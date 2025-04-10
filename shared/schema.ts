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
  role: text("role").default("user"),
  lastLogin: text("last_login"),
  loginCount: integer("login_count").default(0),
  ipAddress: text("ip_address"),
  githubToken: text("github_token"),
  githubUsername: text("github_username"),
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
  aabDownloadUrl: text("aab_download_url"),
  ipaDownloadUrl: text("ipa_download_url"),
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
  aabDownloadUrl: true,
  ipaDownloadUrl: true,
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

// Analytics tables for admin dashboard
export const analytics = pgTable("analytics", {
  id: serial("id").primaryKey(),
  date: text("date").notNull().default("NOW()"),
  totalUsers: integer("total_users").notNull().default(0),
  newUsers: integer("new_users").notNull().default(0),
  totalProjects: integer("total_projects").notNull().default(0),
  newProjects: integer("new_projects").notNull().default(0),
  totalBuilds: integer("total_builds").notNull().default(0),
  newBuilds: integer("new_builds").notNull().default(0),
  websiteTypeProjects: integer("website_type_projects").notNull().default(0),
  htmlTypeProjects: integer("html_type_projects").notNull().default(0),
  pdfTypeProjects: integer("pdf_type_projects").notNull().default(0),
  codeTypeProjects: integer("code_type_projects").notNull().default(0),
  totalRevenue: integer("total_revenue").notNull().default(0), // in cents
  androidBuilds: integer("android_builds").notNull().default(0),
  iosBuilds: integer("ios_builds").notNull().default(0),
});

export const insertAnalyticsSchema = createInsertSchema(analytics).omit({
  id: true,
});

export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;
export type Analytics = typeof analytics.$inferSelect;

// Transaction history for admin dashboard
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  projectId: integer("project_id").references(() => projects.id),
  amount: integer("amount").notNull().default(0), // in cents
  status: text("status").notNull().default("pending"),
  paymentMethod: text("payment_method").notNull().default("stripe"),
  paymentIntentId: text("payment_intent_id"),
  invoiceId: text("invoice_id"),
  receiptUrl: text("receipt_url"),
  description: text("description"),
  currency: text("currency").notNull().default("usd"),
  type: text("type").notNull().default("one-time"), // one-time or subscription
  createdAt: text("created_at").notNull().default("NOW()"),
  metadata: jsonb("metadata"), // Additional transaction data
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

// Build logs for admin dashboard
export const buildLogs = pgTable("build_logs", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  buildType: text("build_type").notNull(), // apk, aab, ipa
  status: text("status").notNull().default("pending"), // pending, success, failed
  startTime: text("start_time").notNull().default("NOW()"),
  endTime: text("end_time"),
  duration: integer("duration"), // in milliseconds
  fileSize: integer("file_size"), // in bytes
  buildVersion: text("build_version"),
  buildNumber: integer("build_number"),
  errorMessage: text("error_message"),
  platform: text("platform").notNull().default("android"), // android, ios
  logs: text("logs"), // Build process logs
  metadata: jsonb("metadata"), // Additional build data
});

export const insertBuildLogSchema = createInsertSchema(buildLogs).omit({
  id: true,
  startTime: true,
});

export type InsertBuildLog = z.infer<typeof insertBuildLogSchema>;
export type BuildLog = typeof buildLogs.$inferSelect;

// User activity logs for admin dashboard
export const userActivityLogs = pgTable("user_activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  action: text("action").notNull(), // login, project_create, build_apk, etc.
  timestamp: text("timestamp").notNull().default("NOW()"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  details: jsonb("details"), // Additional activity details
});

export const insertUserActivityLogSchema = createInsertSchema(userActivityLogs).omit({
  id: true,
  timestamp: true,
});

export type InsertUserActivityLog = z.infer<typeof insertUserActivityLogSchema>;
export type UserActivityLog = typeof userActivityLogs.$inferSelect;

// System settings for admin configuration
export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  settingKey: text("setting_key").notNull().unique(),
  settingValue: text("setting_value"),
  settingType: text("setting_type").notNull().default("text"), // text, number, boolean, json
  category: text("category").notNull().default("general"),
  description: text("description"),
  isPublic: boolean("is_public").notNull().default(false), // Is this setting available to regular users?
  lastUpdated: text("last_updated").notNull().default("NOW()"),
  updatedBy: integer("updated_by").references(() => users.id),
});

export const insertSystemSettingSchema = createInsertSchema(systemSettings).omit({
  id: true,
  lastUpdated: true,
});

export type InsertSystemSetting = z.infer<typeof insertSystemSettingSchema>;
export type SystemSetting = typeof systemSettings.$inferSelect;
