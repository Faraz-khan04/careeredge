"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Download, Loader2 } from "lucide-react";
import { z } from "zod";

import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCalculatorStore } from "@/store/use-calculator-store";
import type { CalculationKind } from "@/store/use-calculator-store";

const formSchema = z.object({
  email: z.string().min(1, "Enter your email.").email("That email doesn't look right."),
  currentRole: z.string().min(2, "Which role are you in?").max(80),
  yearsExperience: z.coerce
    .number({ invalid_type_error: "Use a number." })
    .int("Whole years.")
    .min(0, "Can't be negative.")
    .max(45, "45 is our ceiling."),
});

type FormValues = z.infer<typeof formSchema>;

interface LeadCaptureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Stable id for the asset being unlocked, e.g. "negotiation-report-pdf". */
  asset: string;
  assetTitle: string;
  assetDescription: string;
  source?: CalculationKind;
  onUnlocked: () => void;
}

export function LeadCaptureModal({
  open,
  onOpenChange,
  asset,
  assetTitle,
  assetDescription,
  source,
  onUnlocked,
}: LeadCaptureModalProps) {
  const unlockAsset = useCalculatorStore((s) => s.unlockAsset);
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", currentRole: "", yearsExperience: 3 },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      const params = new URLSearchParams(window.location.search);
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          unlockedAsset: asset,
          source,
          utmSource: params.get("utm_source") ?? undefined,
          utmMedium: params.get("utm_medium") ?? undefined,
          utmCampaign: params.get("utm_campaign") ?? undefined,
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setServerError(body?.error ?? "That didn't go through. Try again in a moment.");
        return;
      }

      unlockAsset(asset);
      reset();
      onOpenChange(false);
      onUnlocked();
    } catch {
      setServerError("Couldn't reach the server. Check your connection and try again.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mb-1 flex h-9 w-9 items-center justify-center rounded-md bg-primary/12">
            <Download className="h-4 w-4 text-primary" />
          </div>
          <DialogTitle>{assetTitle}</DialogTitle>
          <DialogDescription>{assetDescription}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="lead-email">Email</Label>
            <Input
              id="lead-email"
              type="email"
              autoComplete="email"
              placeholder="you@work.com"
              aria-invalid={Boolean(errors.email)}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="grid grid-cols-[1fr_7rem] gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="lead-role">Current role</Label>
              <Input
                id="lead-role"
                placeholder="Backend Engineer"
                aria-invalid={Boolean(errors.currentRole)}
                {...register("currentRole")}
              />
              {errors.currentRole && (
                <p className="text-xs text-destructive">{errors.currentRole.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lead-yoe">Years</Label>
              <Input
                id="lead-yoe"
                type="number"
                inputMode="numeric"
                min={0}
                max={45}
                aria-invalid={Boolean(errors.yearsExperience)}
                {...register("yearsExperience")}
              />
              {errors.yearsExperience && (
                <p className="text-xs text-destructive">{errors.yearsExperience.message}</p>
              )}
            </div>
          </div>

          {serverError && (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {serverError}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? "Sending" : "Send me the report"}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            One email with the report attached. Unsubscribe from any of them.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
