import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Project schema for storing app conversion project data
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  packageName: text("package_name").notNull(),
  sourceUrl: text("source_url").notNull(),
  description: text("description"),
  createdAt: text("created_at").notNull().default("NOW()"),
  status: text("status").notNull().default("draft"),
  apkDownloadUrl: text("apk_download_url"),
  iconPath: text("icon_path"),
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  status: true,
  apkDownloadUrl: true,
  iconPath: true,
});

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

// AppConfig schema for storing technical configuration details for each project
export const appConfigs = pgTable("app_configs", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  enableJavaScript: boolean("enable_javascript").notNull().default(true),
  enableDomStorage: boolean("enable_dom_storage").notNull().default(true),
  enableZoom: boolean("enable_zoom").notNull().default(false),
  enableCache: boolean("enable_cache").notNull().default(true),
  orientation: text("orientation").notNull().default("auto"),
  offlineMode: text("offline_mode").notNull().default("none"),
  permissions: text("permissions").array(),
  customCss: text("custom_css"),
  splashScreenEnabled: boolean("splash_screen_enabled").notNull().default(false),
  splashScreenDuration: integer("splash_screen_duration").default(3000),
  adMobEnabled: boolean("admob_enabled").notNull().default(false),
  adMobAppId: text("admob_app_id"),
  adMobBannerId: text("admob_banner_id"),
  adMobInterstitialId: text("admob_interstitial_id"),
});

export const insertAppConfigSchema = createInsertSchema(appConfigs).omit({
  id: true,
});

export type InsertAppConfig = z.infer<typeof insertAppConfigSchema>;
export type AppConfig = typeof appConfigs.$inferSelect;

// WebsiteFormSchema for frontend validation
export const websiteFormSchema = z.object({
  websiteUrl: z.string().url("Please enter a valid URL"),
  appName: z.string().min(3, "App name must be at least 3 characters"),
  packageName: z.string().regex(/^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+[0-9a-z_]$/i, "Invalid package name format (e.g., com.example.app)"),
  description: z.string().optional(),
  enableJavaScript: z.boolean().optional().default(true),
  enableDomStorage: z.boolean().optional().default(true),
  enableZoom: z.boolean().optional().default(false),
  enableCache: z.boolean().optional().default(true),
  orientation: z.enum(["auto", "portrait", "landscape"]).optional().default("auto"),
  offlineMode: z.enum(["none", "cache", "pwa"]).optional().default("none"),
});

export type WebsiteFormData = z.infer<typeof websiteFormSchema>;
