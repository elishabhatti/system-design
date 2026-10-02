import { z } from "zod";

export const LIMITS = {
  email: 254,
  channelName: { min: 3, max: 30 },
  password: { min: 8, max: 72 }, // bcrypt 72 bytes ke baad chupchap truncate karta hai
  bio: 300,
  title: 100,
  description: 5000,
  tag: { min: 2, max: 30 },
  maxTags: 10,
  comment: 1000,
  search: 100,
  url: 2048,
};

export const UPLOAD = {
  maxSizeMb: 500,
  mimeTypes: ["video/mp4", "video/quicktime", "video/webm"],
  minScheduleLeadMs: 5 * 60 * 1000,
  maxScheduleLeadMs: 365 * 24 * 60 * 60 * 1000,
};

// ---------- helper: zod errors -> { fieldName: "first message" } ----------
export function validate(schema, values) {
  const result = schema.safeParse(values);
  if (result.success) return { ok: true, data: result.data, errors: {} };
  const errors = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] ?? "_form";
    if (!errors[key]) errors[key] = issue.message;
  }
  return { ok: false, data: null, errors };
}

// ---------- building blocks ----------
const email = z
  .string()
  .trim()
  .min(1, "Email is required")
  .max(LIMITS.email, "Email is too long")
  .email("Enter a valid email address");

// letters (Urdu/Unicode bhi), numbers, space . _ -  | pehla character letter/number
const CHANNEL_RE = /^[\p{L}\p{N}][\p{L}\p{N} ._-]*$/u;

export const channelNameSchema = z
  .string()
  .trim()
  .min(LIMITS.channelName.min, `At least ${LIMITS.channelName.min} characters`)
  .max(LIMITS.channelName.max, `At most ${LIMITS.channelName.max} characters`)
  .regex(CHANNEL_RE, "Use letters, numbers, spaces and . _ - only")
  .refine((v) => !/\s{2,}/.test(v), "No double spaces");

const optionalHttpUrl = z
  .string()
  .trim()
  .max(LIMITS.url, "Link is too long")
  .refine((v) => {
    if (!v) return true;
    try {
      const u = new URL(v);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  }, "Enter a valid http(s) link");

// ---------- auth ----------
// Login pe strength rules NAHI lagte, warna purane users lock ho jayenge.
export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required").max(128, "Password is too long"),
});

export const registerSchema = z.object({
  channelName: channelNameSchema,
  email,
  password: z
    .string()
    .min(LIMITS.password.min, `At least ${LIMITS.password.min} characters`)
    .max(LIMITS.password.max, `At most ${LIMITS.password.max} characters`)
    .regex(/\p{L}/u, "Include at least one letter")
    .regex(/\d/, "Include at least one number"),
});

// ---------- profile ----------
export const profileSchema = z.object({
  channelName: channelNameSchema,
  bio: z.string().trim().max(LIMITS.bio, `Bio can be ${LIMITS.bio} characters at most`),
  avatarUrl: optionalHttpUrl,
  bannerUrl: optionalHttpUrl,
});

// ---------- upload ----------
const TAG_RE = /^[\p{L}\p{N}][\p{L}\p{N}_+#.-]*$/u; // react, node.js, c++, c#

export const normalizeTags = (raw) => [
  ...new Set(
    String(raw || "")
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
  ),
];

const tagsField = z.string().superRefine((raw, ctx) => {
  const tags = normalizeTags(raw);
  if (tags.length > LIMITS.maxTags) {
    ctx.addIssue({ code: "custom", message: `Max ${LIMITS.maxTags} tags` });
  }
  const bad = tags.find(
    (t) => t.length < LIMITS.tag.min || t.length > LIMITS.tag.max || !TAG_RE.test(t)
  );
  if (bad) {
    ctx.addIssue({
      code: "custom",
      message: `"${bad}" is not a valid tag (${LIMITS.tag.min}-${LIMITS.tag.max} chars; letters, numbers, _ - + # .)`,
    });
  }
});

export const uploadSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(LIMITS.title, `Max ${LIMITS.title} characters`),
    description: z.string().max(LIMITS.description, `Max ${LIMITS.description} characters`),
    category: z.string().min(1, "Pick a category"),
    tags: tagsField,
    visibility: z.enum(["private", "public", "schedule"]),
    scheduledFor: z.string().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.visibility !== "schedule") return;
    const fail = (message) => ctx.addIssue({ code: "custom", path: ["scheduledFor"], message });
    if (!v.scheduledFor) return fail("Pick a date and time for the release");
    const t = new Date(v.scheduledFor).getTime();
    if (Number.isNaN(t)) return fail("That date isn't valid");
    if (t < Date.now() + UPLOAD.minScheduleLeadMs) return fail("Release must be at least 5 minutes from now");
    if (t > Date.now() + UPLOAD.maxScheduleLeadMs) return fail("Release must be within a year");
  });

// returns "" if ok, else an error message
export function validateVideoFile(file) {
  if (!file) return "Choose a video file to upload.";
  if (!UPLOAD.mimeTypes.includes(file.type)) return "Unsupported format. Use an MP4, MOV or WEBM file.";
  if (file.size === 0) return "That file is empty.";
  if (file.size > UPLOAD.maxSizeMb * 1024 * 1024) return `That video is over ${UPLOAD.maxSizeMb} MB.`;
  return "";
}

// ---------- comments / search ----------
export const COMMENT_MAX = LIMITS.comment;
export const commentSchema = z.string().trim().min(1, "Write something first").max(COMMENT_MAX, `Max ${COMMENT_MAX} characters`);

// control characters hata ke trim + limit
export const cleanSearch = (q) =>
  String(q || "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, LIMITS.search);