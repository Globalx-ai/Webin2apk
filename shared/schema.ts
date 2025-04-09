import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  email: text("email"),
  phone: text("phone"),
  address1: text("address_line1"),
  address2: text("address_line2"),
  city: text("city"),
  state: text("state"),
  zipcode: text("zipcode"),
  country: text("country"),
  subscriptionStatus: text("subscription_status").default("free_trial"),
  subscriptionExpiry: text("subscription_expiry"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: text("created_at").notNull().default("NOW()"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  phone: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Project schema for storing app conversion project data
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  packageName: text("package_name").notNull(),
  sourceUrl: text("source_url"), // Can be empty for HTML or PDF sources
  description: text("description"),
  createdAt: text("created_at").notNull().default("NOW()"),
  status: text("status").notNull().default("draft"),
  apkDownloadUrl: text("apk_download_url"),
  iconPath: text("icon_path"),
  sourceType: text("source_type").notNull().default("website"), // website, html, pdf, code
  htmlContent: text("html_content"), // For direct HTML content
  pdfPath: text("pdf_path"), // Path to uploaded PDF
  customCodePath: text("custom_code_path"), // Path to custom code
  githubUrl: text("github_url"), // URL to GitHub repository
  // Payment related fields
  isPaid: boolean("is_paid").default(false),
  paymentIntentId: text("payment_intent_id"),
  couponCode: text("coupon_code"),
  paymentAmount: integer("payment_amount").default(500), // in cents, default $5.00
  paidAt: text("paid_at"),
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
  // AI and custom code options
  includeCustomCode: boolean("include_custom_code").notNull().default(false),
  customCodeVerified: boolean("custom_code_verified").default(false),
  customCodeLanguage: text("custom_code_language").default("java"),
  customCodeContent: text("custom_code_content"),
  customCodeAiSuggestions: jsonb("custom_code_ai_suggestions"), // Store AI suggestions as JSON
});

export const insertAppConfigSchema = createInsertSchema(appConfigs).omit({
  id: true,
});

export type InsertAppConfig = z.infer<typeof insertAppConfigSchema>;
export type AppConfig = typeof appConfigs.$inferSelect;

// WebsiteFormSchema for frontend validation
export const websiteFormSchema = z.object({
  // Source type selector
  sourceType: z.enum(["website", "html", "pdf", "code"]).default("website"),
  
  // Website URL (required for website source type)
  websiteUrl: z.string().url("Please enter a valid URL").optional()
    .refine(val => val || false, { message: "Website URL is required for website source type" }),
  
  // HTML content (required for HTML source type)
  htmlContent: z.string().optional(),
  
  // PDF file is handled separately in the form data
  
  // Platform selection
  platforms: z.array(z.enum(["android", "ios"])).default(["android"]),
  
  // Display settings
  showHeaderAppName: z.boolean().optional().default(true),
  showUrlBar: z.boolean().optional().default(true),
  previewResolution: z.enum([
    // Phone resolutions
    "240x320", "320x480", "480x800", "540x960", "720x1280", 
    "1080x1920", "1440x2560", "2160x3840", "720x1440", 
    "1080x2160", "1080x2340", "1440x3120",
    // Tablet resolutions
    "600x1024", "800x1280", "1200x1920", "1600x2560", 
    "1536x2048", "1668x2388", "2048x2732",
    // Foldable resolutions
    "2208x2480", "2290x1080",
    // Generic categories (for backward compatibility)
    "phone", "tablet", "auto"
  ]).optional().default("720x1280"),
  
  // Common fields for all conversion types
  appName: z.string().min(3, "App name must be at least 3 characters"),
  packageName: z.string().regex(/^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+[0-9a-z_]$/i, "Invalid package name format (e.g., com.example.app)"),
  description: z.string().optional(),
  
  // WebView settings
  enableJavaScript: z.boolean().optional().default(true),
  enableDomStorage: z.boolean().optional().default(true),
  enableZoom: z.boolean().optional().default(false),
  enableCache: z.boolean().optional().default(true),
  orientation: z.enum(["auto", "portrait", "landscape"]).optional().default("auto"),
  offlineMode: z.enum(["none", "cache", "pwa"]).optional().default("none"),
  
  // Custom code options
  includeCustomCode: z.boolean().optional().default(false),
  customCodeLanguage: z.enum(["java", "kotlin", "javascript"]).optional().default("java"),
  customCodeContent: z.string().optional(),
});

export type WebsiteFormData = z.infer<typeof websiteFormSchema>;

// Create a separate schema for custom code
export const customCodeSchema = z.object({
  language: z.enum(["java", "kotlin", "javascript"]),
  content: z.string().min(1, "Code content cannot be empty"),
  projectId: z.number(),
});

export type CustomCodeData = z.infer<typeof customCodeSchema>;

// Coupon codes schema
export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  discountPercent: integer("discount_percent").notNull(), // 100 for 100% discount
  isActive: boolean("is_active").notNull().default(true),
  expiresAt: text("expires_at"), // Optional expiration date
  maxUses: integer("max_uses"), // Optional max number of uses
  currentUses: integer("current_uses").default(0),
  createdAt: text("created_at").notNull().default("NOW()"),
});

export const insertCouponSchema = createInsertSchema(coupons).omit({
  id: true,
  currentUses: true,
  createdAt: true,
});

export type InsertCoupon = z.infer<typeof insertCouponSchema>;
export type Coupon = typeof coupons.$inferSelect;

// User coupon usage tracking
export const couponUsage = pgTable("coupon_usage", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  couponId: integer("coupon_id").references(() => coupons.id).notNull(),
  usedAt: text("used_at").notNull().default("NOW()"),
  projectId: integer("project_id").references(() => projects.id), // Optional, which project it was used for
});

export const insertCouponUsageSchema = createInsertSchema(couponUsage).omit({
  id: true,
  usedAt: true,
});

export type InsertCouponUsage = z.infer<typeof insertCouponUsageSchema>;
export type CouponUsage = typeof couponUsage.$inferSelect;
