import { MESSAGE_LIMITS } from "@memories/shared";
import { Check, Search, X } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type SyntheticEvent,
} from "react";
import { useNavigate } from "react-router";
import { usePeopleToMessage } from "../../../application/conversation/useConversations";
import {
  useCreateGroup,
  useStartDirectChat,
} from "../../../application/conversation/useMessageMutations";
import type { MessageablePerson } from "../../../domain/conversation";
import { fullName } from "../../format/chatText";
import { errorMessage } from "../../format/errorMessage";
import { Avatar } from "../user/Avatar";

interface NewChatDialogProps {
  open: boolean;
  onClose: () => void;
}

// Pick one person for a chat, or two or more for a group (3+ people with you)
export function NewChatDialog({ open, onClose }: NewChatDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function handleCancel(event: SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault();
    onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      onCancel={handleCancel}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      aria-labelledby="new-chat-title"
      className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-lg bg-paper p-0 text-ink shadow-2xl backdrop:bg-black/50"
    >
      {/* A fresh form every time it opens */}
      {open && <NewChatForm onClose={onClose} />}
    </dialog>
  );
}

function NewChatForm({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [picked, setPicked] = useState<MessageablePerson[]>([]);
  const [groupName, setGroupName] = useState("");
  const [problem, setProblem] = useState<string | null>(null);
  const { people, hasText, isSearching } = usePeopleToMessage(text);
  const startDirect = useStartDirectChat();
  const createGroup = useCreateGroup();
  const isWorking = startDirect.isPending || createGroup.isPending;
  const isGroup = picked.length >= 2;

  function toggle(person: MessageablePerson) {
    setProblem(null);
    if (picked.some((item) => item.id === person.id)) {
      setPicked(picked.filter((item) => item.id !== person.id));
    } else if (picked.length + 1 >= MESSAGE_LIMITS.groupMax) {
      setProblem(`A group holds up to ${MESSAGE_LIMITS.groupMax} people`);
    } else {
      setPicked([...picked, person]);
      setText("");
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (picked.length === 0) return;
    setProblem(null);
    try {
      const conversation = isGroup
        ? await createGroup.mutateAsync({
            name: groupName.trim(),
            memberIds: picked.map((person) => person.id),
          })
        : await startDirect.mutateAsync(picked[0].id);
      onClose();
      navigate(`/messages/c/${conversation.id}`);
    } catch (error) {
      setProblem(errorMessage(error));
    }
  }

  return (
    <form onSubmit={submit} className="p-5 sm:p-7">
      <div className="flex items-center justify-between">
        <h2 id="new-chat-title" className="font-serif text-2xl tracking-tight">
          New message
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full hover:bg-neutral-100"
        >
          <X size={20} aria-hidden="true" />
        </button>
      </div>
      <p className="mt-1 text-sm text-neutral-500">
        Pick 1 person for a chat, or 2 or more for a group (a group is{" "}
        {MESSAGE_LIMITS.groupMin}+ people, you included). Friends join right
        away; others get a request.
      </p>

      {picked.length > 0 && (
        <ul aria-label="Picked" className="mt-4 flex flex-wrap gap-2">
          {picked.map((person) => (
            <li key={person.id}>
              <button
                type="button"
                onClick={() => toggle(person)}
                aria-label={`Remove ${fullName(person)}`}
                className="flex h-9 items-center gap-1.5 rounded-full bg-ink pl-1 pr-3 text-sm text-paper"
              >
                <Avatar user={person} size="xs" />
                {person.firstName}
                <X size={14} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="relative mt-4">
        <Search
          size={16}
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
        />
        <label htmlFor="new-chat-search" className="sr-only">
          Search people
        </label>
        <input
          id="new-chat-search"
          type="search"
          autoFocus
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Search by name or username"
          autoComplete="off"
          className="h-11 w-full rounded-md border border-neutral-300 bg-white pl-9 pr-3 outline-none focus:border-ink"
        />
      </div>

      {hasText && (
        <ul
          className="mt-1 max-h-72 divide-y divide-line overflow-y-auto"
          aria-live="polite"
          aria-busy={isSearching}
        >
          {people.length === 0 && !isSearching && (
            <li className="py-4 text-sm text-neutral-500">
              Nobody you can message matches that. You can message your friends,
              and people who allow messages from anyone.
            </li>
          )}
          {people.map((person) => {
            const isPicked = picked.some((item) => item.id === person.id);
            return (
              <li key={person.id}>
                <button
                  type="button"
                  onClick={() => toggle(person)}
                  aria-pressed={isPicked}
                  className="flex w-full items-center gap-3 py-2 text-left transition hover:bg-neutral-100"
                >
                  <Avatar user={person} size="md" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">
                      {fullName(person)}
                    </span>
                    <span className="block truncate text-sm text-neutral-500">
                      @{person.username}
                      {!person.isFriend && " · gets a request"}
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    className={`mr-1 flex h-6 w-6 items-center justify-center rounded-full border ${
                      isPicked
                        ? "border-ink bg-ink text-paper"
                        : "border-neutral-400"
                    }`}
                  >
                    {isPicked && <Check size={14} />}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {isGroup && (
        <div className="mt-5">
          <label
            htmlFor="new-group-name"
            className="text-xs font-semibold uppercase tracking-[0.15em]"
          >
            Group name{" "}
            <span className="font-normal normal-case tracking-normal text-neutral-500">
              (optional)
            </span>
          </label>
          <input
            id="new-group-name"
            value={groupName}
            onChange={(event) => setGroupName(event.target.value)}
            maxLength={MESSAGE_LIMITS.groupNameMax}
            placeholder="Barkada"
            className="mt-2 h-11 w-full rounded-md border border-neutral-300 bg-white px-3 outline-none focus:border-ink"
          />
        </div>
      )}

      {problem && (
        <p
          role="alert"
          className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {problem}
        </p>
      )}

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={picked.length === 0 || isWorking}
          className="h-11 rounded-full bg-ink px-6 text-sm font-medium text-paper transition hover:bg-neutral-800 disabled:bg-neutral-300"
        >
          {isWorking
            ? "Opening…"
            : isGroup
              ? `Create group (${picked.length + 1})`
              : "Chat"}
        </button>
      </div>
    </form>
  );
}
