import { COMMENT_LIMITS, createCommentSchema } from "@memories/shared";
import { Trash2 } from "lucide-react";
import { useState, type FormEvent, type RefObject } from "react";
import { Link } from "react-router";
import { useComments } from "../../../application/comment/useComments";
import type { Comment } from "../../../domain/comment";
import { ApiError } from "../../../infrastructure/api/http";
import { timeAgo } from "../../format/dates";
import { Avatar } from "../user/Avatar";

interface CommentsSectionProps {
  memoryId: string;
  memoryOwnerId: string;
  currentUserId: string;
  inputRef?: RefObject<HTMLTextAreaElement | null>; // lets the page focus the box
}

function CommentItem({
  comment,
  canDelete,
  onDelete,
}: {
  comment: Comment;
  canDelete: boolean;
  onDelete: () => Promise<void>;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [failed, setFailed] = useState(false);
  const name = `${comment.author.firstName} ${comment.author.lastName}`;

  async function handleDelete() {
    setIsDeleting(true);
    setFailed(false);
    try {
      await onDelete(); // on success this item disappears
    } catch {
      setFailed(true);
      setIsDeleting(false);
    }
  }

  return (
    <li className="flex gap-3 py-4">
      <Avatar user={comment.author} />
      <div className="min-w-0 flex-1">
        <p className="text-sm">
          <Link
            to={`/u/${comment.author.username}`}
            className="font-semibold hover:underline hover:underline-offset-4"
          >
            {name}
          </Link>{" "}
          <span className="text-neutral-500">
            · <time dateTime={comment.createdAt}>{timeAgo(comment.createdAt)}</time>
          </span>
        </p>
        <p className="mt-1 whitespace-pre-line break-words text-[15px] leading-relaxed text-neutral-800">
          {comment.body}
        </p>
        {failed && (
          <p role="alert" className="mt-1 text-xs text-red-600">
            Couldn't delete it. Try again.
          </p>
        )}
      </div>
      {canDelete && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          aria-label={`Delete comment by ${name}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-200 hover:text-red-700 disabled:opacity-50"
        >
          <Trash2 size={16} aria-hidden="true" />
        </button>
      )}
    </li>
  );
}

export function CommentsSection({
  memoryId,
  memoryOwnerId,
  currentUserId,
  inputRef,
}: CommentsSectionProps) {
  const { comments, status, retry, add, remove } = useComments(memoryId);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = createCommentSchema.safeParse({ body: text });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your comment");
      return;
    }

    setIsPosting(true);
    setError(null);
    try {
      await add(parsed.data.body);
      setText("");
    } catch (caught) {
      setError(
        caught instanceof ApiError && caught.status === 404
          ? "This memory isn't available anymore."
          : "Couldn't post your comment. Try again.",
      );
    } finally {
      setIsPosting(false);
    }
  }

  const remaining = COMMENT_LIMITS.bodyMax - text.length;

  return (
    <section
      id="comments"
      aria-labelledby="comments-title"
      className="mt-8 scroll-mt-4 border-t border-line pt-6"
    >
      <h2
        id="comments-title"
        className="text-xs font-semibold uppercase tracking-[0.15em]"
      >
        Comments{status === "ready" && ` · ${comments.length}`}
      </h2>

      {status === "loading" && (
        <p className="py-4 text-sm text-neutral-500">Loading comments...</p>
      )}
      {status === "error" && (
        <p className="py-4 text-sm text-neutral-600">
          Couldn't load comments.{" "}
          <button
            type="button"
            onClick={retry}
            className="font-semibold underline underline-offset-4"
          >
            Try again
          </button>
        </p>
      )}
      {status === "ready" && comments.length === 0 && (
        <p className="py-4 text-sm text-neutral-500">
          No comments yet. Say what this memory makes you think of.
        </p>
      )}
      {comments.length > 0 && (
        <ul className="divide-y divide-line">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              // Your own comments, and any comment on your memory
              canDelete={
                comment.author.id === currentUserId ||
                memoryOwnerId === currentUserId
              }
              onDelete={() => remove(comment.id)}
            />
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} noValidate className="mt-4">
        <label htmlFor="comment-body" className="sr-only">
          Write a comment
        </label>
        <textarea
          ref={inputRef}
          id="comment-body"
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            if (error) setError(null);
          }}
          onKeyDown={(event) => {
            // Ctrl/Cmd + Enter posts, plain Enter makes a new line
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
              event.currentTarget.form?.requestSubmit();
            }
          }}
          rows={2}
          maxLength={COMMENT_LIMITS.bodyMax}
          placeholder="Write a comment..."
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "comment-error" : undefined}
          className={`w-full resize-y rounded-md border bg-white px-3.5 py-3 text-[15px] leading-relaxed outline-none transition placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 ${
            error ? "border-red-600" : "border-neutral-300"
          }`}
        />
        {error && (
          <p id="comment-error" className="mt-1 text-sm text-red-600">
            {error}
          </p>
        )}
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="text-xs text-neutral-500">
            {remaining < 100 ? `${remaining} characters left` : ""}
          </span>
          <button
            type="submit"
            disabled={isPosting || text.trim().length === 0}
            className="h-10 rounded-full bg-neutral-900 px-5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPosting ? "Posting..." : "Post"}
          </button>
        </div>
      </form>
    </section>
  );
}
