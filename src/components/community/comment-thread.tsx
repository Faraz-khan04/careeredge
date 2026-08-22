"use client";

import * as React from "react";
import { ShieldCheck } from "lucide-react";

import { relativeTime, cn } from "@/lib/utils";
import { VoteControl } from "@/components/community/vote-control";

export interface CommentNode {
  id: string;
  content: string;
  isAnonymous: boolean;
  authorHandle: string | null;
  authorBadge: string | null;
  isVerified: boolean;
  upvotes: number;
  downvotes: number;
  createdAt: string;
  depth: number;
  replies: CommentNode[];
}

/** Past this depth replies stack sideways instead of nesting further. */
const MAX_VISUAL_DEPTH = 5;

export function CommentThread({ comments }: { comments: CommentNode[] }) {
  if (comments.length === 0) {
    return (
      <p className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
        No replies yet. The first substantive comment on an offer post usually sets the tone
        for the rest.
      </p>
    );
  }

  return (
    <ul className="space-y-1">
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} />
      ))}
    </ul>
  );
}

function CommentItem({ comment }: { comment: CommentNode }) {
  const [collapsed, setCollapsed] = React.useState(false);
  const replyCount = countReplies(comment);

  return (
    <li>
      <div className="flex gap-2.5 py-2">
        <div className="flex flex-col items-center gap-1">
          <VoteControl
            commentId={comment.id}
            initialScore={comment.upvotes - comment.downvotes}
          />
          {comment.replies.length > 0 && (
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              aria-expanded={!collapsed}
              className="group flex flex-1 justify-center"
              title={collapsed ? "Expand replies" : "Collapse replies"}
            >
              <span className="w-px flex-1 bg-border transition-colors group-hover:bg-primary" />
              <span className="sr-only">
                {collapsed ? "Expand" : "Collapse"} {replyCount} replies
              </span>
            </button>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
            {comment.isAnonymous ? (
              <span>Anonymous</span>
            ) : (
              <>
                <span className="font-medium text-foreground">{comment.authorHandle}</span>
                {comment.authorBadge && (
                  <span className="flex items-center gap-1 rounded border px-1.5 py-0.5">
                    {comment.isVerified && (
                      <ShieldCheck
                        className="h-3 w-3 text-[hsl(var(--lift))]"
                        aria-label="Verified"
                      />
                    )}
                    {comment.authorBadge}
                  </span>
                )}
              </>
            )}
            <span aria-hidden="true">·</span>
            <time dateTime={comment.createdAt}>{relativeTime(comment.createdAt)}</time>
            {collapsed && replyCount > 0 && (
              <button
                type="button"
                onClick={() => setCollapsed(false)}
                className="text-primary hover:underline"
              >
                {replyCount} more
              </button>
            )}
          </div>

          <div className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">
            {comment.content}
          </div>

          <button
            type="button"
            className="mt-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            Reply
          </button>
        </div>
      </div>

      {!collapsed && comment.replies.length > 0 && (
        <ul
          className={cn(
            "space-y-1 border-l pl-3 sm:pl-4",
            comment.depth >= MAX_VISUAL_DEPTH && "border-l-0 pl-0",
          )}
        >
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} />
          ))}
        </ul>
      )}
    </li>
  );
}

function countReplies(node: CommentNode): number {
  return node.replies.reduce((total, child) => total + 1 + countReplies(child), 0);
}

/** Turns a flat, path-ordered comment list into the tree the UI renders. */
export function buildCommentTree(
  flat: (Omit<CommentNode, "replies"> & { parentId: string | null })[],
): CommentNode[] {
  const byId = new Map<string, CommentNode>();
  const roots: CommentNode[] = [];

  for (const row of flat) {
    byId.set(row.id, { ...row, replies: [] });
  }
  for (const row of flat) {
    const node = byId.get(row.id);
    if (!node) continue;
    if (row.parentId) {
      byId.get(row.parentId)?.replies.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}
