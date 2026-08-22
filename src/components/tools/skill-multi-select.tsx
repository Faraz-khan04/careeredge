"use client";

import * as React from "react";
import { Check, Search, X } from "lucide-react";

import { SKILLS } from "@/data/skills";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const CATEGORY_LABEL: Record<string, string> = {
  language: "Languages",
  framework: "Frameworks",
  platform: "Platforms",
  data: "Data",
  practice: "Practices",
  domain: "Domain",
};

interface SkillMultiSelectProps {
  value: string[];
  onChange: (next: string[]) => void;
  /** Ids to surface first — usually the ones relevant to the selected role. */
  suggested?: string[];
  error?: string;
}

export function SkillMultiSelect({ value, onChange, suggested = [], error }: SkillMultiSelectProps) {
  const [query, setQuery] = React.useState("");
  const selected = React.useMemo(() => new Set(value), [value]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = q
      ? SKILLS.filter((s) => s.name.toLowerCase().includes(q) || s.slug.includes(q))
      : SKILLS;

    const suggestedSet = new Set(suggested);
    const groups = new Map<string, typeof SKILLS[number][]>();
    for (const skill of [...pool].sort((a, b) => {
      const aSug = suggestedSet.has(a.id) ? 0 : 1;
      const bSug = suggestedSet.has(b.id) ? 0 : 1;
      return aSug - bSug || a.name.localeCompare(b.name);
    })) {
      const list = groups.get(skill.category) ?? [];
      list.push(skill);
      groups.set(skill.category, list);
    }
    return groups;
  }, [query, suggested]);

  function toggle(id: string) {
    onChange(selected.has(id) ? value.filter((v) => v !== id) : [...value, id]);
  }

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {value.map((id) => {
            const skill = SKILLS.find((s) => s.id === id);
            if (!skill) return null;
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => toggle(id)}
                  className="inline-flex items-center gap-1 rounded-md bg-primary/12 px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                >
                  {skill.name}
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove {skill.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search skills you already have"
          className="pl-9"
          aria-label="Search skills"
        />
      </div>

      <div className="max-h-64 overflow-y-auto rounded-md border">
        {filtered.size === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-muted-foreground">
            Nothing matches &ldquo;{query}&rdquo;. Try a shorter term.
          </p>
        ) : (
          [...filtered.entries()].map(([category, skills]) => (
            <div key={category}>
              <p className="sticky top-0 bg-muted/80 px-3 py-1.5 text-eyebrow uppercase text-muted-foreground backdrop-blur">
                {CATEGORY_LABEL[category] ?? category}
              </p>
              <ul>
                {skills.map((skill) => {
                  const isSelected = selected.has(skill.id);
                  const isSuggested = suggested.includes(skill.id);
                  return (
                    <li key={skill.id}>
                      <button
                        type="button"
                        onClick={() => toggle(skill.id)}
                        aria-pressed={isSelected}
                        className={cn(
                          "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-accent",
                          isSelected && "bg-accent/60",
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className={cn(
                              "flex h-4 w-4 items-center justify-center rounded border",
                              isSelected ? "border-primary bg-primary" : "border-input",
                            )}
                          >
                            {isSelected && (
                              <Check className="h-3 w-3 text-primary-foreground" />
                            )}
                          </span>
                          {skill.name}
                        </span>
                        {isSuggested && !isSelected && (
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            common for this role
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))
        )}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
