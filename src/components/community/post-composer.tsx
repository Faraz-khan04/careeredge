"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Eye, EyeOff, Loader2, Wand2 } from "lucide-react";

import { createPostSchema, type CreatePostInput } from "@/lib/schemas";
import { validateContent, checkRateLimit, RATE_LIMITS, type ModerationFinding } from "@/lib/moderation";
import { useCalculatorStore } from "@/store/use-calculator-store";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TAG_LABEL, type TagKey } from "@/components/community/tag-pill";
import { CalculationEmbed } from "@/components/community/calculation-embed";
import type { RemotePayEquityResult, SkillArbitrageResult } from "@/types";

const TAGS = Object.keys(TAG_LABEL) as TagKey[];

export function PostComposer() {
  const router = useRouter();
  const params = useSearchParams();
  const embedLocalId = params.get("embed");
  const presetTag = params.get("tag") as TagKey | null;

  const runById = useCalculatorStore((s) => s.runById);
  const [embedRun, setEmbedRun] = React.useState(() =>
    embedLocalId ? runById(embedLocalId) : undefined,
  );
  const [findings, setFindings] = React.useState<ModerationFinding[]>([]);
  const [serverError, setServerError] = React.useState<string | null>(null);

  // The store rehydrates from localStorage after mount, so the run may not be
  // there on the first render.
  React.useEffect(() => {
    if (embedLocalId && !embedRun) setEmbedRun(runById(embedLocalId));
  }, [embedLocalId, embedRun, runById]);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreatePostInput>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      title: "",
      content: "",
      tags: presetTag ? [presetTag] : [],
      isAnonymous: true,
    },
  });

  const content = watch("content");
  const isAnonymous = watch("isAnonymous");

  // Debounced so the warnings don't flicker on every keystroke.
  React.useEffect(() => {
    const handle = window.setTimeout(() => {
      setFindings(content.length > 20 ? validateContent(content).findings : []);
    }, 400);
    return () => window.clearTimeout(handle);
  }, [content]);

  const blockers = findings.filter((f) => f.severity === "block");
  const warnings = findings.filter((f) => f.severity === "warn");

  function applyRedaction() {
    setValue("content", validateContent(content).redacted, { shouldValidate: true });
  }

  async function onSubmit(values: CreatePostInput) {
    setServerError(null);

    const limit = checkRateLimit("post", RATE_LIMITS.post.limit, RATE_LIMITS.post.windowMs);
    if (limit.blocked) {
      const minutes = Math.ceil((limit.resetAt - Date.now()) / 60_000);
      setServerError(`You've hit the posting limit. Try again in about ${minutes} minutes.`);
      return;
    }

    const check = validateContent(values.content);
    if (!check.ok) {
      setFindings(check.findings);
      setServerError("Remove the flagged details before publishing.");
      return;
    }

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          calculationId: embedRun?.serverId,
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setServerError(body?.error ?? "Couldn't publish. Try again.");
        return;
      }

      const body = (await res.json()) as { slug: string };
      router.push(`/community/${body.slug}`);
    } catch {
      setServerError("Couldn't reach the server. Your draft is still here.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          placeholder="Got $95k fully remote from a SF company while living in Lisbon — worth taking?"
          {...register("title")}
        />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Channels</Label>
        <Controller
          control={control}
          name="tags"
          render={({ field }) => (
            <div className="flex flex-wrap gap-2">
              {TAGS.map((tag) => {
                const selected = field.value?.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    aria-pressed={selected}
                    onClick={() =>
                      field.onChange(
                        selected
                          ? field.value.filter((t) => t !== tag)
                          : [...(field.value ?? []), tag],
                      )
                    }
                    className={cn(
                      "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                      selected
                        ? "border-primary/40 bg-primary/12 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/40",
                    )}
                  >
                    {TAG_LABEL[tag]}
                  </button>
                );
              })}
            </div>
          )}
        />
        {errors.tags && <p className="text-xs text-destructive">{errors.tags.message}</p>}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between">
          <Label htmlFor="content">Post</Label>
          <span className="tabular text-xs text-muted-foreground">
            {content.length.toLocaleString()} / 20,000
          </span>
        </div>
        <textarea
          id="content"
          rows={12}
          placeholder="Markdown works here. Numbers, levels and locations get the most useful replies — names and employers get people fired."
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          {...register("content")}
        />
        {errors.content && <p className="text-xs text-destructive">{errors.content.message}</p>}
      </div>

      {(blockers.length > 0 || warnings.length > 0) && (
        <div
          className={cn(
            "space-y-2 rounded-md border px-4 py-3",
            blockers.length > 0
              ? "border-destructive/40 bg-destructive/10"
              : "border-[hsl(var(--caution))]/40 bg-[hsl(var(--caution))]/10",
          )}
        >
          <p className="flex items-center gap-2 text-sm font-medium">
            <AlertTriangle className="h-4 w-4" />
            {blockers.length > 0 ? "Fix before publishing" : "Worth a second look"}
          </p>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {[...blockers, ...warnings].map((f, i) => (
              <li key={`${f.code}-${i}`}>{f.message}</li>
            ))}
          </ul>
          {blockers.length > 0 && (
            <Button type="button" size="sm" variant="outline" onClick={applyRedaction}>
              <Wand2 className="h-3.5 w-3.5" />
              Redact them for me
            </Button>
          )}
        </div>
      )}

      {embedRun && (
        <div className="space-y-2">
          <Label>Attached calculation</Label>
          <CalculationEmbed
            type={embedRun.kind}
            result={embedRun.result as SkillArbitrageResult | RemotePayEquityResult}
          />
          <button
            type="button"
            onClick={() => setEmbedRun(undefined)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Remove attachment
          </button>
        </div>
      )}

      <div className="flex items-center justify-between rounded-lg border px-4 py-3">
        <div className="flex items-center gap-3">
          {isAnonymous ? (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Eye className="h-4 w-4 text-primary" />
          )}
          <div>
            <p className="text-sm font-medium">
              {isAnonymous ? "Posting anonymously" : "Posting with your role badge"}
            </p>
            <p className="text-xs text-muted-foreground">
              {isAnonymous
                ? "No handle, no badge, no profile link. Moderators can still act on abuse."
                : "Shows your verified role and years of experience, never your employer."}
            </p>
          </div>
        </div>
        <Controller
          control={control}
          name="isAnonymous"
          render={({ field }) => (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => field.onChange(!field.value)}
            >
              Switch
            </Button>
          )}
        />
      </div>

      {serverError && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {serverError}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting || blockers.length > 0}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSubmitting ? "Publishing" : "Publish"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
