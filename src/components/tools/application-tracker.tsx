"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Clock, Download, Plus, Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { SKILLS } from "@/data/skills";
import {
  PROGRESS_STAGES,
  STAGE_LABEL,
  TYPICAL_RANGES,
  analyseFunnel,
  type Application,
  type Stage,
} from "@/lib/engines/application-funnel";
import { cn } from "@/lib/utils";

const SOURCES = [
  "LinkedIn",
  "Naukri",
  "Company site",
  "Referral",
  "Indeed",
  "Instahyre",
  "Wellfound",
  "Recruiter reached out",
  "Other",
];

const STORE_KEY = "careeredge.applications.v1";
const SKILLS_KEY = "careeredge.myskills.v1";

/**
 * Application tracker.
 *
 * Everything lives in this browser and nothing is uploaded. That is partly a
 * privacy position — a list of every company that turned you down is about as
 * sensitive as career data gets — and partly why the tool works with no
 * account at all.
 */
export function ApplicationTracker() {
  const [apps, setApps] = React.useState<Application[]>([]);
  const [mySkills, setMySkills] = React.useState<string[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const [adding, setAdding] = React.useState(false);

  // Read once on mount. Writing before this completes would clobber the
  // stored list with an empty one.
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) setApps(JSON.parse(raw));
      const rawSkills = localStorage.getItem(SKILLS_KEY);
      if (rawSkills) setMySkills(JSON.parse(rawSkills));
    } catch {
      // Corrupt or unavailable storage — start empty rather than crash.
    }
    setLoaded(true);
  }, []);

  React.useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(apps));
      localStorage.setItem(SKILLS_KEY, JSON.stringify(mySkills));
    } catch {
      // Storage full or blocked. The session still works in memory.
    }
  }, [apps, mySkills, loaded]);

  const result = React.useMemo(() => analyseFunnel(apps, mySkills), [apps, mySkills]);

  const fileRef = React.useRef<HTMLInputElement>(null);

  /**
   * Local storage is one cleared cache away from gone, so an export is not a
   * nice-to-have here — it is the only backup that exists.
   */
  function exportJson() {
    const blob = new Blob([JSON.stringify({ apps, mySkills }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `careeredge-applications-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importJson(file: File) {
    try {
      const parsed = JSON.parse(await file.text());
      if (Array.isArray(parsed?.apps)) {
        // Merge rather than replace, so an import cannot silently wipe a log.
        setApps((prev) => {
          const seen = new Set(prev.map((a) => a.id));
          return [...prev, ...parsed.apps.filter((a: Application) => !seen.has(a.id))];
        });
      }
      if (Array.isArray(parsed?.mySkills)) {
        setMySkills((prev) => Array.from(new Set([...prev, ...parsed.mySkills])));
      }
    } catch {
      // Not a file we wrote. Leaving the existing log untouched is the safe
      // failure here.
    }
  }

  function addApp(app: Application) {
    setApps((prev) => [app, ...prev]);
    setAdding(false);
  }

  function updateStage(id: string, stage: Stage) {
    setApps((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        // Reached stage only ever moves forward, so a rejection after an
        // interview still records that you interviewed.
        const rankOf = (s: Stage) => Math.max(0, PROGRESS_STAGES.indexOf(s));
        const reached = rankOf(stage) > rankOf(a.reachedStage) ? stage : a.reachedStage;

        // The first move past "applied" is the first human reply. Stamped
        // once so the median reflects when contact actually happened.
        const firstReplyOn =
          a.firstReplyOn ?? (rankOf(stage) > 0 ? new Date().toISOString() : undefined);

        return { ...a, stage, reachedStage: reached, firstReplyOn };
      }),
    );
  }

  if (!loaded) {
    return <div className="h-64 animate-pulse rounded-xl border border-border bg-card" />;
  }

  return (
    <div className="space-y-6">
      {apps.length === 0 && !adding ? (
        <EmptyState onAdd={() => setAdding(true)} />
      ) : (
        <>
          {/* ---------------------------------------------------------- */}
          {/* Funnel                                                      */}
          {/* ---------------------------------------------------------- */}
          <div className="crosshairs relative rounded-xl p-6 panel sm:p-8">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="text-sm font-semibold">Your funnel</h2>
              <span
                className={cn(
                  "rounded-full border px-2.5 py-0.5 font-mono text-xs",
                  result.confidence === "too-early"
                    ? "border-[hsl(var(--caution))]/30 bg-[hsl(var(--caution))]/10 text-[hsl(var(--caution))]"
                    : "border-[hsl(var(--lift))]/30 bg-[hsl(var(--lift))]/10 text-[hsl(var(--lift))]",
                )}
              >
                {result.total} logged &middot;{" "}
                {result.confidence === "too-early"
                  ? "too early to read"
                  : result.confidence === "indicative"
                    ? "indicative"
                    : "reasonable sample"}
              </span>
            </div>

            <div className="mt-6 space-y-3">
              {PROGRESS_STAGES.map((stage) => {
                const count = apps.filter((a) => {
                  const r = Math.max(0, PROGRESS_STAGES.indexOf(a.reachedStage));
                  return r >= PROGRESS_STAGES.indexOf(stage);
                }).length;
                const pct = result.total ? (count / result.total) * 100 : 0;

                return (
                  <div key={stage}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span>{STAGE_LABEL[stage]}</span>
                      <span className="tabular font-mono text-xs text-muted-foreground">
                        {count} &middot; {pct.toFixed(0)}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/[0.05]">
                      <div
                        className="h-full rounded-full bg-primary transition-[width] duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {result.readable && (
              <dl className="mt-7 grid grid-cols-3 gap-4 border-t border-white/[0.06] pt-5">
                <Rate label="Reply rate" value={result.responseRate} range={TYPICAL_RANGES.responseRate} />
                <Rate label="Interview rate" value={result.interviewRate} range={TYPICAL_RANGES.interviewRate} />
                <Rate label="Offer rate" value={result.offerRate} range={TYPICAL_RANGES.offerRate} />
              </dl>
            )}
          </div>

          {/* ---------------------------------------------------------- */}
          {/* Observations                                                */}
          {/* ---------------------------------------------------------- */}
          {result.observations.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold">What your log shows</h2>
              {result.observations.map((o) => (
                <p
                  key={o}
                  className="rounded-lg border border-border bg-white/[0.02] p-4 text-sm leading-relaxed text-muted-foreground"
                >
                  {o}
                </p>
              ))}
            </section>
          )}

          {/* ---------------------------------------------------------- */}
          {/* Follow up                                                   */}
          {/* ---------------------------------------------------------- */}
          {result.needsFollowUp.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-[hsl(var(--caution))]" />
                  {result.needsFollowUp.length} worth a follow-up
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  No reply after three weeks. A short, polite note occasionally restarts one, and
                  costs nothing to send.
                </p>
                <ul className="space-y-1.5">
                  {result.needsFollowUp.slice(0, 8).map((a) => (
                    <li key={a.id} className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="truncate">
                        {a.role} <span className="text-muted-foreground">at {a.company}</span>
                      </span>
                      <span className="tabular shrink-0 font-mono text-xs text-muted-foreground">
                        {Math.floor(
                          (Date.now() - new Date(a.appliedOn).getTime()) / 86_400_000,
                        )}{" "}
                        days
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* ---------------------------------------------------------- */}
          {/* Where you applied                                           */}
          {/* ---------------------------------------------------------- */}
          {result.bySource.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Where you applied</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-2">
                  {result.bySource.map((src) => (
                    <li
                      key={src.source}
                      className="grid grid-cols-[1fr_5rem_5rem] items-baseline gap-3 text-sm"
                    >
                      <span className="truncate">{src.source}</span>
                      <span className="tabular text-right font-mono text-xs text-muted-foreground">
                        {src.replied}/{src.applied}
                      </span>
                      <span
                        className={cn(
                          "tabular text-right font-mono text-xs",
                          src.readable ? "text-foreground" : "text-muted-foreground/50",
                        )}
                      >
                        {src.readable ? `${(src.replyRate * 100).toFixed(0)}%` : "—"}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  A percentage only appears once a source has at least ten applications behind it.
                  Below that, a single reply swings the rate by ten points and the ranking means
                  nothing.
                </p>
              </CardContent>
            </Card>
          )}

          {/* ---------------------------------------------------------- */}
          {/* Skills asked for                                            */}
          {/* ---------------------------------------------------------- */}
          {result.gaps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">What these postings asked for</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Counted across the applications you logged. A skill appearing often means the
                  roles you are targeting want it &mdash; it does not mean its absence is why any
                  particular application ended.
                </p>

                <ul className="space-y-2">
                  {result.gaps.slice(0, 10).map((g) => (
                    <li key={g.skillId} className="flex items-center gap-3">
                      <span className="w-40 shrink-0 truncate text-sm">{g.name}</span>
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.05]">
                        <span
                          className={cn(
                            "block h-full rounded-full",
                            g.held ? "bg-[hsl(var(--lift))]" : "bg-[hsl(var(--caution))]",
                          )}
                          style={{ width: `${g.share * 100}%` }}
                        />
                      </span>
                      <span className="tabular w-24 shrink-0 text-right font-mono text-xs text-muted-foreground">
                        {g.askedIn}/{result.total}
                        {g.held ? " · have" : ""}
                      </span>
                    </li>
                  ))}
                </ul>

                {result.gaps.some((g) => !g.held) && (
                  <Button variant="outline" asChild>
                    <Link
                      href={`/tools/skill-arbitrage?skills=${mySkills.slice(0, 6).join(",")}`}
                    >
                      Price these gaps with Skill ROI
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* ---------------------------------------------------------- */}
          {/* List                                                        */}
          {/* ---------------------------------------------------------- */}
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm">Applications</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={exportJson} title="Download a backup">
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
                <Button size="sm" variant="ghost" onClick={() => fileRef.current?.click()}>
                  <Upload className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Import</span>
                </Button>
                <Button size="sm" onClick={() => setAdding(true)}>
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {apps.map((a) => (
                <div
                  key={a.id}
                  className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-t border-border px-6 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{a.role}</p>
                    <p className="truncate font-mono text-xs text-muted-foreground">
                      {a.company} &middot; {new Date(a.appliedOn).toLocaleDateString()}
                      {a.source ? ` · ${a.source}` : ""}
                      {a.ctcQuoted ? (
                        <>
                          {" · "}
                          <Link
                            href={`/tools/ctc-calculator?ctc=${a.ctcQuoted}`}
                            className="text-primary hover:underline"
                          >
                            ₹{(a.ctcQuoted / 100_000).toFixed(1)}L
                          </Link>
                        </>
                      ) : null}
                    </p>
                  </div>

                  <select
                    value={a.stage}
                    onChange={(e) => updateStage(a.id, e.target.value as Stage)}
                    aria-label={`Stage for ${a.role} at ${a.company}`}
                    className="rounded-md border border-input bg-background px-2 py-1 text-xs outline-none focus-visible:border-primary"
                  >
                    {(Object.keys(STAGE_LABEL) as Stage[]).map((s) => (
                      <option key={s} value={s}>
                        {STAGE_LABEL[s]}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => setApps((prev) => prev.filter((x) => x.id !== a.id))}
                    aria-label={`Delete ${a.role} at ${a.company}`}
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:text-[hsl(var(--drop))] focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void importJson(file);
          e.target.value = "";
        }}
      />

      {adding && <AddForm onAdd={addApp} onCancel={() => setAdding(false)} />}

      {/* Your stack, for the gap comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Skills you already have</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
            Used to mark which of the requested skills you already hold. Nothing leaves your
            browser.
          </p>
          <SkillPicker selected={mySkills} onChange={setMySkills} />
        </CardContent>
      </Card>

      <p className="text-xs leading-relaxed text-muted-foreground">
        This tool counts what you record. It does not know why any employer said no, and it will
        not guess &mdash; rejections turn on hiring freezes, internal candidates and timing far more
        often than on anything about you.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Rate({
  label,
  value,
  range,
}: {
  label: string;
  value: number;
  range: readonly [number, number];
}) {
  return (
    <div>
      <dd className="tabular font-mono text-xl font-semibold tracking-tight">
        {(value * 100).toFixed(1)}%
      </dd>
      <dt className="mt-1 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </dt>
      <p className="mt-1 font-mono text-[0.625rem] text-muted-foreground/70">
        typical {(range[0] * 100).toFixed(0)}–{(range[1] * 100).toFixed(0)}%
      </p>
    </div>
  );
}

function AddForm({
  onAdd,
  onCancel,
}: {
  onAdd: (a: Application) => void;
  onCancel: () => void;
}) {
  const [company, setCompany] = React.useState("");
  const [role, setRole] = React.useState("");
  const [appliedOn, setAppliedOn] = React.useState(new Date().toISOString().slice(0, 10));
  const [source, setSource] = React.useState("LinkedIn");
  const [ctc, setCtc] = React.useState("");
  const [skills, setSkills] = React.useState<string[]>([]);

  function submit() {
    if (!company.trim() || !role.trim()) return;
    onAdd({
      id: crypto.randomUUID(),
      company: company.trim(),
      role: role.trim(),
      appliedOn,
      stage: "applied",
      reachedStage: "applied",
      requiredSkills: skills,
      source,
      ctcQuoted: ctc ? Number(ctc) * 100_000 : undefined,
      notes: "",
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Log an application</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="company">Company</Label>
            <input
              id="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-primary"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="role">Role</Label>
            <input
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-primary"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="date">Applied on</Label>
            <input
              id="date"
              type="date"
              value={appliedOn}
              onChange={(e) => setAppliedOn(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-primary"
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="source">Where you applied</Label>
            <select
              id="source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-primary"
            >
              {SOURCES.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ctc">CTC quoted, in lakhs (optional)</Label>
            <input
              id="ctc"
              type="number"
              min={0}
              step={0.5}
              value={ctc}
              onChange={(e) => setCtc(e.target.value)}
              placeholder="18"
              className="tabular w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm outline-none focus-visible:border-primary"
            />
          </div>
        </div>

        <div>
          <Label>Skills the posting asked for</Label>
          <p className="mb-2 mt-1 text-xs text-muted-foreground">
            Optional, but it is what makes the gap analysis work.
          </p>
          <SkillPicker selected={skills} onChange={setSkills} />
        </div>

        <div className="flex gap-2">
          <Button onClick={submit} disabled={!company.trim() || !role.trim()}>
            Add application
          </Button>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SkillPicker({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const [query, setQuery] = React.useState("");

  const matches = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return SKILLS.filter(
      (s) => s.name.toLowerCase().includes(q) && !selected.includes(s.id),
    ).slice(0, 6);
  }, [query, selected]);

  return (
    <div className="space-y-2">
      {selected.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {selected.map((id) => (
            <li key={id}>
              <button
                type="button"
                onClick={() => onChange(selected.filter((s) => s !== id))}
                className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 font-mono text-xs text-primary transition-colors hover:border-primary/50"
              >
                {SKILLS.find((s) => s.id === id)?.name ?? id} &times;
              </button>
            </li>
          ))}
        </ul>
      )}

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search skills"
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-primary"
      />

      {matches.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {matches.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => {
                  onChange([...selected, s.id]);
                  setQuery("");
                }}
                className="rounded-full border border-border px-2.5 py-0.5 font-mono text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                + {s.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-10 text-center">
      <h2 className="text-lg font-semibold">Start logging applications</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        Add one each time you apply and update the stage as things move. After twenty or so, your
        own funnel becomes readable &mdash; where applications stop, and which skills the roles you
        target keep asking for.
      </p>
      <Button className="mt-6" onClick={onAdd}>
        <Plus className="h-4 w-4" />
        Log your first application
      </Button>
    </div>
  );
}
