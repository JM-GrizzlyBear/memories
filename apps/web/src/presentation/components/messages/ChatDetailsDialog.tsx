import {
  MESSAGE_LIMITS,
  PROFILE_PHOTO_LIMITS,
  type GroupRole,
} from "@memories/shared";
import { Camera, LogOut, Search, Trash2, UserPlus, X } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type SyntheticEvent,
} from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { usePeopleToMessage } from "../../../application/conversation/useConversations";
import {
  useAddGroupMembers,
  useRemoveGroupMember,
  useRenameGroup,
  useSetGroupPhoto,
  useSetMemberRole,
} from "../../../application/conversation/useMessageMutations";
import type {
  Conversation,
  ConversationMember,
} from "../../../domain/conversation";
import {
  conversationTitle,
  fullName,
  groupSize,
  groupSizeText,
  otherMember,
  roleLabel,
} from "../../format/chatText";
import { errorMessage } from "../../format/errorMessage";
import { Avatar } from "../user/Avatar";
import { ChatAvatar } from "./ChatAvatar";

// Toasts would be hidden behind the open dialog, so results show inside it
type Feedback = { kind: "ok" | "error"; text: string } | null;

interface ChatDetailsDialogProps {
  open: boolean;
  conversation: Conversation;
  myId: string;
  onClose: () => void;
}

// Chat details: the person (direct chat), or everything about a group
export function ChatDetailsDialog({
  open,
  conversation,
  myId,
  onClose,
}: ChatDetailsDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function handleCancel(event: SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault(); // Escape: close through React
    onClose();
  }

  const title = conversationTitle(conversation, myId);

  return (
    <dialog
      ref={dialogRef}
      onCancel={handleCancel}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      aria-label={`About ${title}`}
      className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-lg bg-paper p-0 text-ink shadow-2xl backdrop:bg-black/50"
    >
      {open && (
        <div className="p-5 sm:p-7">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="-mr-2 -mt-2 flex h-11 w-11 items-center justify-center rounded-full hover:bg-neutral-100"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>
          {conversation.kind === "direct" ? (
            <DirectDetails
              conversation={conversation}
              myId={myId}
              onClose={onClose}
            />
          ) : (
            <GroupDetails
              conversation={conversation}
              myId={myId}
              onClose={onClose}
            />
          )}
        </div>
      )}
    </dialog>
  );
}

function DirectDetails({
  conversation,
  myId,
  onClose,
}: Omit<ChatDetailsDialogProps, "open">) {
  const other = otherMember(conversation, myId);
  if (!other) return null;
  return (
    <div className="flex flex-col items-center text-center">
      <Avatar user={other} size="xl" />
      <h2 className="mt-4 font-serif text-3xl tracking-tight">
        {fullName(other)}
      </h2>
      <p className="text-neutral-500">@{other.username}</p>
      <Link
        to={`/u/${other.username}`}
        onClick={onClose}
        className="mt-5 flex h-11 items-center rounded-full border border-ink px-6 text-sm font-medium transition hover:bg-neutral-100"
      >
        View profile
      </Link>
    </div>
  );
}

function GroupDetails({
  conversation,
  myId,
  onClose,
}: Omit<ChatDetailsDialogProps, "open">) {
  const navigate = useNavigate();
  const id = conversation.id;
  const rename = useRenameGroup(id);
  const setPhoto = useSetGroupPhoto(id);
  const remove = useRemoveGroupMember(id);
  const [name, setName] = useState(conversation.name ?? "");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);

  const isIn = conversation.me.status === "accepted";
  const myRole = conversation.me.role;
  const people = conversation.members;
  const joined = people.filter((member) => member.status === "accepted");

  async function run(work: () => Promise<unknown>, success: string) {
    setFeedback(null);
    try {
      await work();
      setFeedback({ kind: "ok", text: success });
      return true;
    } catch (error) {
      setFeedback({ kind: "error", text: errorMessage(error) });
      return false;
    }
  }

  async function saveName(event: FormEvent) {
    event.preventDefault();
    const next = name.trim();
    if (next === (conversation.name ?? "")) return;
    await run(
      async () => await rename.mutateAsync(next),
      next ? "Group renamed" : "Group name removed",
    );
  }

  async function pickPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (
      !(PROFILE_PHOTO_LIMITS.types as readonly string[]).includes(file.type)
    ) {
      setFeedback({ kind: "error", text: "Choose a JPG, PNG, or WebP photo" });
      return;
    }
    if (file.size > PROFILE_PHOTO_LIMITS.maxBytes) {
      setFeedback({ kind: "error", text: "Choose a photo of 5 MB or less" });
      return;
    }
    await run(
      async () => await setPhoto.mutateAsync(file),
      "Group photo changed",
    );
  }

  async function leave() {
    const left = await run(
      async () => await remove.mutateAsync(myId),
      "You left the group",
    );
    if (left) {
      onClose();
      navigate("/messages");
      toast.success("You left the group"); // the dialog is closed now, so it shows
    }
  }

  return (
    <div>
      <div className="flex flex-col items-center text-center">
        <div className="relative">
          <ChatAvatar conversation={conversation} myId={myId} size="lg" />
          {isIn && (
            <>
              <input
                ref={photoRef}
                type="file"
                accept={PROFILE_PHOTO_LIMITS.types.join(",")}
                onChange={pickPhoto}
                className="sr-only"
                tabIndex={-1}
                aria-hidden="true"
              />
              <button
                type="button"
                onClick={() => photoRef.current?.click()}
                disabled={setPhoto.isPending}
                aria-label="Change group photo"
                className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-ink text-paper ring-2 ring-paper transition hover:bg-neutral-700"
              >
                <Camera size={16} aria-hidden="true" />
              </button>
            </>
          )}
        </div>
        <h2 className="mt-4 font-serif text-3xl tracking-tight break-words">
          {conversationTitle(conversation, myId)}
        </h2>
        <p className="text-sm text-neutral-500">
          {groupSizeText(conversation)} · {MESSAGE_LIMITS.groupMin} to{" "}
          {MESSAGE_LIMITS.groupMax}
        </p>
        {isIn && conversation.photoUrl && (
          <button
            type="button"
            onClick={() =>
              void run(
                async () => await setPhoto.mutateAsync(null),
                "Group photo removed",
              )
            }
            disabled={setPhoto.isPending}
            className="mt-2 flex h-9 items-center gap-1.5 rounded-full px-3 text-sm text-neutral-600 transition hover:bg-neutral-100 hover:text-ink"
          >
            <Trash2 size={14} aria-hidden="true" />
            Remove photo
          </button>
        )}
      </div>

      {feedback && (
        <p
          role={feedback.kind === "error" ? "alert" : "status"}
          className={`mt-4 rounded-md px-3 py-2 text-sm ${
            feedback.kind === "error"
              ? "bg-red-50 text-red-800"
              : "bg-neutral-100 text-ink"
          }`}
        >
          {feedback.text}
        </p>
      )}

      {isIn && (
        <form onSubmit={saveName} className="mt-6">
          <label
            htmlFor="group-name"
            className="text-xs font-semibold uppercase tracking-[0.15em]"
          >
            Group name
          </label>
          <div className="mt-2 flex gap-2">
            <input
              id="group-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={MESSAGE_LIMITS.groupNameMax}
              placeholder="No name: shows the people's names"
              className="h-11 min-w-0 flex-1 rounded-md border border-neutral-300 bg-white px-3 outline-none focus:border-ink"
            />
            <button
              type="submit"
              disabled={
                rename.isPending || name.trim() === (conversation.name ?? "")
              }
              className="h-11 rounded-full bg-ink px-5 text-sm font-medium text-paper transition hover:bg-neutral-800 disabled:bg-neutral-300"
            >
              Save
            </button>
          </div>
        </form>
      )}

      {isIn && (
        <AddPeople conversation={conversation} onFeedback={setFeedback} />
      )}

      <section className="mt-6" aria-labelledby="group-people">
        <h3
          id="group-people"
          className="text-xs font-semibold uppercase tracking-[0.15em]"
        >
          People
        </h3>
        {isIn &&
          myRole !== "member" &&
          groupSize(conversation) <= MESSAGE_LIMITS.groupMin && (
            <p className="mt-1 text-sm text-neutral-500">
              A group needs at least {MESSAGE_LIMITS.groupMin} people, so add
              someone before removing anyone.
            </p>
          )}
        <ul className="mt-2 divide-y divide-line">
          {people.map((member) => (
            <MemberRow
              key={member.id}
              conversationId={id}
              member={member}
              myId={myId}
              myRole={isIn ? myRole : null}
              // Removing someone can't take the group below 3 people
              canShrink={groupSize(conversation) > MESSAGE_LIMITS.groupMin}
              onFeedback={setFeedback}
            />
          ))}
        </ul>
      </section>

      {isIn && (
        <div className="mt-6 border-t border-line pt-4">
          {confirmLeave ? (
            <div className="rounded-md bg-neutral-100 p-3 text-sm">
              <p>
                Leave this group? You won't get its messages anymore.
                {myRole === "admin" &&
                  joined.filter((member) => member.role === "admin").length ===
                    1 &&
                  " Since you're the only admin, the person who's been here longest becomes admin."}
              </p>
              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmLeave(false)}
                  className="h-10 rounded-full border border-ink px-4 font-medium"
                >
                  Stay
                </button>
                <button
                  type="button"
                  onClick={() => void leave()}
                  disabled={remove.isPending}
                  className="h-10 rounded-full bg-red-700 px-4 font-medium text-white disabled:opacity-60"
                >
                  {remove.isPending ? "Leaving…" : "Leave group"}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmLeave(true)}
              className="flex h-11 items-center gap-2 rounded-full px-3 text-sm font-medium text-red-700 transition hover:bg-red-50"
            >
              <LogOut size={16} aria-hidden="true" />
              Leave group
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface MemberRowProps {
  conversationId: string;
  member: ConversationMember;
  myId: string;
  myRole: GroupRole | null; // null = I haven't joined
  canShrink: boolean;
  onFeedback: (feedback: Feedback) => void;
}

// One person in the group, with what my role lets me do to them
function MemberRow({
  conversationId,
  member,
  myId,
  myRole,
  canShrink,
  onFeedback,
}: MemberRowProps) {
  const setRole = useSetMemberRole(conversationId);
  const remove = useRemoveGroupMember(conversationId);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const isMe = member.id === myId;
  const isInvited = member.status !== "accepted";
  const label = isInvited ? "Invited" : roleLabel(member.role);
  const canChangeRole = myRole === "admin" && !isMe && !isInvited;
  const mayRemove =
    !isMe &&
    (myRole === "admin" ||
      (myRole === "moderator" && member.role === "member"));
  const canRemove = mayRemove && canShrink;

  async function changeRole(role: GroupRole) {
    onFeedback(null);
    try {
      await setRole.mutateAsync({ userId: member.id, role });
      onFeedback({
        kind: "ok",
        text:
          role === "member"
            ? `${member.firstName} is now a member`
            : `${member.firstName} is now ${role === "admin" ? "an admin" : "a moderator"}`,
      });
    } catch (error) {
      onFeedback({ kind: "error", text: errorMessage(error) });
    }
  }

  async function removeMember() {
    onFeedback(null);
    try {
      await remove.mutateAsync(member.id);
      onFeedback({ kind: "ok", text: `${member.firstName} was removed` });
    } catch (error) {
      onFeedback({ kind: "error", text: errorMessage(error) });
    }
    setConfirmRemove(false);
  }

  return (
    <li className="py-3">
      <div className="flex items-center gap-3">
        <Avatar user={member} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">
            {fullName(member)}
            {isMe && (
              <span className="font-normal text-neutral-500"> (you)</span>
            )}
          </p>
          <p className="truncate text-sm text-neutral-500">
            @{member.username}
            {label && <> · {label}</>}
          </p>
        </div>
        {canChangeRole && (
          <>
            <label htmlFor={`role-${member.id}`} className="sr-only">
              Role of {fullName(member)}
            </label>
            <select
              id={`role-${member.id}`}
              value={member.role}
              disabled={setRole.isPending}
              onChange={(event) =>
                void changeRole(event.target.value as GroupRole)
              }
              className="h-10 rounded-full border border-neutral-300 bg-white px-3 text-sm"
            >
              <option value="admin">Admin</option>
              <option value="moderator">Moderator</option>
              <option value="member">Member</option>
            </select>
          </>
        )}
        {canRemove && !confirmRemove && (
          <button
            type="button"
            onClick={() => setConfirmRemove(true)}
            aria-label={`Remove ${fullName(member)}`}
            className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-500 transition hover:bg-red-50 hover:text-red-700"
          >
            <X size={18} aria-hidden="true" />
          </button>
        )}
      </div>
      {confirmRemove && (
        <div className="mt-2 flex items-center justify-end gap-2 text-sm">
          <span className="mr-auto text-neutral-600">
            Remove {member.firstName} from the group?
          </span>
          <button
            type="button"
            onClick={() => setConfirmRemove(false)}
            className="h-9 rounded-full border border-ink px-3 font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void removeMember()}
            disabled={remove.isPending}
            className="h-9 rounded-full bg-red-700 px-3 font-medium text-white disabled:opacity-60"
          >
            {remove.isPending ? "Removing…" : "Remove"}
          </button>
        </div>
      )}
    </li>
  );
}

// Search people to add: friends join right away, people open to anyone get a request
function AddPeople({
  conversation,
  onFeedback,
}: {
  conversation: Conversation;
  onFeedback: (feedback: Feedback) => void;
}) {
  const [text, setText] = useState("");
  const { people, hasText, isSearching } = usePeopleToMessage(text);
  const add = useAddGroupMembers(conversation.id);
  const inGroup = new Set(conversation.members.map((member) => member.id));
  const results = people.filter((person) => !inGroup.has(person.id));
  const isFull =
    conversation.members.filter((member) => member.status !== "declined")
      .length >= MESSAGE_LIMITS.groupMax;

  async function addPerson(
    personId: string,
    firstName: string,
    isFriend: boolean,
  ) {
    onFeedback(null);
    try {
      await add.mutateAsync([personId]);
      onFeedback({
        kind: "ok",
        text: isFriend
          ? `${firstName} was added`
          : `${firstName} was invited. They'll join once they accept.`,
      });
      setText("");
    } catch (error) {
      onFeedback({ kind: "error", text: errorMessage(error) });
    }
  }

  return (
    <section className="mt-6" aria-labelledby="add-people">
      <h3
        id="add-people"
        className="text-xs font-semibold uppercase tracking-[0.15em]"
      >
        Add people
      </h3>
      {isFull ? (
        <p className="mt-2 text-sm text-neutral-500">
          This group is full ({MESSAGE_LIMITS.groupMax} people).
        </p>
      ) : (
        <>
          <div className="relative mt-2">
            <Search
              size={16}
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
            />
            <label htmlFor="add-people-search" className="sr-only">
              Search people to add
            </label>
            <input
              id="add-people-search"
              type="search"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Search by name or username"
              autoComplete="off"
              className="h-11 w-full rounded-md border border-neutral-300 bg-white pl-9 pr-3 outline-none focus:border-ink"
            />
          </div>
          {hasText && (
            <ul
              className="mt-1 divide-y divide-line"
              aria-live="polite"
              aria-busy={isSearching}
            >
              {results.length === 0 && !isSearching && (
                <li className="py-3 text-sm text-neutral-500">
                  Nobody you can add matches that.
                </li>
              )}
              {results.map((person) => (
                <li key={person.id} className="flex items-center gap-3 py-2">
                  <Avatar user={person} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {fullName(person)}
                    </span>
                    <span className="block truncate text-xs text-neutral-500">
                      {person.isFriend
                        ? "Friend · joins right away"
                        : "Not your friend · gets a request"}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      void addPerson(
                        person.id,
                        person.firstName,
                        person.isFriend,
                      )
                    }
                    disabled={add.isPending}
                    aria-label={`Add ${fullName(person)}`}
                    className="flex h-9 items-center gap-1.5 rounded-full border border-ink px-3 text-sm font-medium transition hover:bg-neutral-100 disabled:opacity-60"
                  >
                    <UserPlus size={15} aria-hidden="true" />
                    Add
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
