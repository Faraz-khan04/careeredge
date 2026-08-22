"use client";

import * as React from "react";
import { ArrowBigDown, ArrowBigUp } from "lucide-react";

import { cn } from "@/lib/utils";
import { checkRateLimit, RATE_LIMITS } from "@/lib/moderation";

interface VoteControlProps {
  postId?: string;
  commentId?: string;
  initialScore: number;
  initialVote?: "UP" | "DOWN" | null;
  orientation?: "vertical" | "horizontal";
}

export function VoteControl({
  postId,
  commentId,
  initialScore,
  initialVote = null,
  orientation = "vertical",
}: VoteControlProps) {
  const [vote, setVote] = React.useState<"UP" | "DOWN" | null>(initialVote);
  const [score, setScore] = React.useState(initialScore);
  const [notice, setNotice] = React.useState<string | null>(null);

  async function cast(next: "UP" | "DOWN") {
    const limit = checkRateLimit("vote", RATE_LIMITS.vote.limit, RATE_LIMITS.vote.windowMs);
    if (limit.blocked) {
      setNotice("Slow down a moment.");
      window.setTimeout(() => setNotice(null), 2500);
      return;
    }

    const previous = { vote, score };
    // Optimistic: toggling off removes the vote, switching sides moves two points.
    const isUndo = vote === next;
    const delta = isUndo
      ? next === "UP" ? -1 : 1
      : vote === null
        ? next === "UP" ? 1 : -1
        : next === "UP" ? 2 : -2;

    setVote(isUndo ? null : next);
    setScore(score + delta);

    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: next, postId, commentId }),
      });
      if (!res.ok) throw new Error("vote rejected");
    } catch {
      setVote(previous.vote);
      setScore(previous.score);
      setNotice("Vote didn't save.");
      window.setTimeout(() => setNotice(null), 2500);
    }
  }

  return (
    <div
      className={cn(
        "flex items-center gap-0.5",
        orientation === "vertical" ? "flex-col" : "flex-row",
      )}
    >
      <button
        type="button"
        onClick={() => cast("UP")}
        aria-label="Upvote"
        aria-pressed={vote === "UP"}
        className={cn(
          "rounded p-1 transition-colors hover:bg-accent",
          vote === "UP" ? "text-[hsl(var(--lift))]" : "text-muted-foreground",
        )}
      >
        <ArrowBigUp className="h-4 w-4" />
      </button>

      <span
        className={cn(
          "tabular min-w-[2ch] text-center text-xs font-medium",
          vote === "UP" && "text-[hsl(var(--lift))]",
          vote === "DOWN" && "text-[hsl(var(--drop))]",
        )}
      >
        {score}
      </span>

      <button
        type="button"
        onClick={() => cast("DOWN")}
        aria-label="Downvote"
        aria-pressed={vote === "DOWN"}
        className={cn(
          "rounded p-1 transition-colors hover:bg-accent",
          vote === "DOWN" ? "text-[hsl(var(--drop))]" : "text-muted-foreground",
        )}
      >
        <ArrowBigDown className="h-4 w-4" />
      </button>

      {notice && <span className="text-[10px] text-muted-foreground">{notice}</span>}
    </div>
  );
}
