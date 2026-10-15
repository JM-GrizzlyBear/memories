import { z } from "zod";

export const MESSAGE_LIMITS = {
  bodyMax: 2000,
  maxPhotos: 10,
  maxPhotoBytes: 5 * 1024 * 1024, // 5 MB
  photoTypes: ["image/jpeg", "image/png", "image/webp"],
  editMinutes: 22, // you can change what you wrote for this long
  groupMin: 3, // a group is 3 people or more (2 people is just a chat)
  groupMax: 57, // people in a group, you included
  groupNameMax: 80,
} as const;

export const MESSAGE_PRIVACY = ["friends", "anyone"] as const;
export type MessagePrivacy = (typeof MESSAGE_PRIVACY)[number];

export const GROUP_ROLES = ["admin", "moderator", "member"] as const;
export type GroupRole = (typeof GROUP_ROLES)[number];

// Settings → Privacy
export const messagePrivacySchema = z.object({
  messagePrivacy: z.enum(MESSAGE_PRIVACY, "Choose friends or anyone"),
});

// The text of a message (photos come as files next to it)
export const messageBodySchema = z.object({
  body: z
    .string()
    .trim()
    .max(
      MESSAGE_LIMITS.bodyMax,
      `Keep it to ${MESSAGE_LIMITS.bodyMax} characters or fewer`,
    )
    .default(""),
});

const groupNameSchema = z
  .string()
  .trim()
  .max(
    MESSAGE_LIMITS.groupNameMax,
    `Keep the name to ${MESSAGE_LIMITS.groupNameMax} characters or fewer`,
  );

export const createGroupSchema = z.object({
  name: groupNameSchema.default(""),
  memberIds: z
    .array(z.uuid())
    .min(
      MESSAGE_LIMITS.groupMin - 1,
      `A group needs at least ${MESSAGE_LIMITS.groupMin} people, you included`,
    )
    .max(
      MESSAGE_LIMITS.groupMax - 1,
      `A group holds up to ${MESSAGE_LIMITS.groupMax} people`,
    ),
});

export const renameGroupSchema = z.object({ name: groupNameSchema });

export const addMembersSchema = z.object({
  memberIds: z
    .array(z.uuid())
    .min(1, "Pick someone to add")
    .max(MESSAGE_LIMITS.groupMax),
});

export const setRoleSchema = z.object({
  role: z.enum(GROUP_ROLES, "Choose admin, moderator or member"),
});

export type CreateGroupBody = z.infer<typeof createGroupSchema>;
