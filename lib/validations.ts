import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address").max(255),
  password: z.string().min(1, "Password is required").max(128),
});

export const passwordSchema = z
  .string()
  .min(12, "Minimum 12 characters")
  .max(128, "Maximum 128 characters")
  .regex(/[A-Z]/, "Must contain an uppercase letter")
  .regex(/[a-z]/, "Must contain a lowercase letter")
  .regex(/[0-9]/, "Must contain a number")
  .regex(/[^A-Za-z0-9]/, "Must contain a special character");

export const inviteMemberSchema = z.object({
  email: z.string().email("Invalid email address").max(255),
  full_name: z.string().min(1, "Name is required").max(100).trim(),
  role: z.enum(["admin", "member"]).default("member"),
  password: passwordSchema,
});

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200).trim(),
  description: z.string().max(2000).nullable().optional(),
  status: z.enum(["pending", "in-progress", "done"]).default("pending"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  assigned_to: z.string().uuid("Invalid assignee"),
  deadline: z.string().datetime({ offset: true }).nullable().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).trim().optional(),
  description: z.string().max(2000).nullable().optional(),
  status: z.enum(["pending", "in-progress", "done"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  assigned_to: z.string().uuid().optional(),
  deadline: z.string().datetime({ offset: true }).nullable().optional(),
});

export const updateTaskStatusSchema = z.object({
  status: z.enum(["pending", "in-progress", "done"]),
});

export const updateProfileSchema = z.object({
  full_name: z.string().min(1).max(100).trim().optional(),
  avatar_url: z.string().url().max(500).nullable().optional(),
});

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: passwordSchema,
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });
