import { 
  users, type User, type InsertUser,
  projects, type Project, type InsertProject,
  appConfigs, type AppConfig, type InsertAppConfig,
  coupons, type Coupon, type InsertCoupon,
  couponUsage, type CouponUsage, type InsertCouponUsage,
  analytics, type Analytics, type InsertAnalytics,
  transactions, type Transaction, type InsertTransaction,
  buildLogs, type BuildLog, type InsertBuildLog,
  userActivityLogs, type UserActivityLog, type InsertUserActivityLog,
  systemSettings, type SystemSetting, type InsertSystemSetting
} from "@shared/schema";
import session from 'express-session';
import createMemoryStore from 'memorystore';
import connectPg from 'connect-pg-simple';
import { db, pool } from './db';
import { eq, desc, and, gte, lte, like } from 'drizzle-orm';

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  updateStripeCustomerId(userId: number, customerId: string): Promise<User | undefined>;
  updateUserSubscription(userId: number, subscriptionId: string, expiryDate: string): Promise<User | undefined>;
  getTotalUsers(): Promise<number>;
  getAllUsers(): Promise<User[]>;
  
  // Project methods
  getProject(id: number): Promise<Project | undefined>;
  getProjectsByUserId(userId: number): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<Project>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;
  markProjectAsPaid(id: number, paymentIntentId: string): Promise<Project | undefined>;
  
  // AppConfig methods
  getAppConfig(projectId: number): Promise<AppConfig | undefined>;
  createAppConfig(config: InsertAppConfig): Promise<AppConfig>;
  updateAppConfig(id: number, config: Partial<AppConfig>): Promise<AppConfig | undefined>;
  
  // Coupon methods
  getCouponByCode(code: string): Promise<Coupon | undefined>;
  createCoupon(coupon: InsertCoupon): Promise<Coupon>;
  updateCoupon(id: number, coupon: Partial<Coupon>): Promise<Coupon | undefined>;
  incrementCouponUsage(id: number): Promise<Coupon | undefined>;
  
  // Coupon usage methods
  createCouponUsage(usage: InsertCouponUsage): Promise<CouponUsage>;
  getCouponUsagesByUser(userId: number): Promise<CouponUsage[]>;
  
  // GitHub integration
  updateUserGithubToken(userId: number, token: string, username: string): Promise<User | undefined>;
  
  // Analytics methods for admin dashboard
  getAnalyticsForDate(date: string): Promise<Analytics | undefined>;
  createAnalytics(analytics: InsertAnalytics): Promise<Analytics>;
  updateAnalytics(id: number, analytics: Partial<Analytics>): Promise<Analytics | undefined>;
  getAnalyticsRange(startDate: string, endDate: string): Promise<Analytics[]>;
  
  // Transaction methods for admin dashboard
  getTransaction(id: number): Promise<Transaction | undefined>;
  getTransactionsByUserId(userId: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: number, transaction: Partial<Transaction>): Promise<Transaction | undefined>;
  getAllTransactions(limit?: number, offset?: number): Promise<Transaction[]>;
  
  // Build logs methods for admin dashboard
  getBuildLog(id: number): Promise<BuildLog | undefined>;
  getBuildLogsByProjectId(projectId: number): Promise<BuildLog[]>;
  getBuildLogsByUserId(userId: number): Promise<BuildLog[]>;
  createBuildLog(buildLog: InsertBuildLog): Promise<BuildLog>;
  updateBuildLog(id: number, buildLog: Partial<BuildLog>): Promise<BuildLog | undefined>;
  getAllBuildLogs(limit?: number, offset?: number): Promise<BuildLog[]>;
  
  // User activity logs methods for admin dashboard
  getUserActivityLog(id: number): Promise<UserActivityLog | undefined>;
  getUserActivityLogsByUserId(userId: number): Promise<UserActivityLog[]>;
  createUserActivityLog(activityLog: InsertUserActivityLog): Promise<UserActivityLog>;
  getAllUserActivityLogs(limit?: number, offset?: number): Promise<UserActivityLog[]>;
  
  // System settings methods for admin dashboard
  getSystemSetting(key: string): Promise<SystemSetting | undefined>;
  getSystemSettingsByCategory(category: string): Promise<SystemSetting[]>;
  createSystemSetting(setting: InsertSystemSetting): Promise<SystemSetting>;
  updateSystemSetting(id: number, setting: Partial<SystemSetting>): Promise<SystemSetting | undefined>;
  getAllSystemSettings(): Promise<SystemSetting[]>;
  
  // Dashboard stats methods
  getDashboardStats(): Promise<any>;
  
  // Session store for auth
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private projects: Map<number, Project>;
  private appConfigs: Map<number, AppConfig>;
  private coupons: Map<number, Coupon>;
  private couponUsages: Map<number, CouponUsage>;
  private analytics: Map<number, Analytics>;
  private transactions: Map<number, Transaction>;
  private buildLogs: Map<number, BuildLog>;
  private userActivityLogs: Map<number, UserActivityLog>;
  private systemSettings: Map<number, SystemSetting>;
  private userIdCounter: number;
  private projectIdCounter: number;
  private appConfigIdCounter: number;
  private couponIdCounter: number;
  private couponUsageIdCounter: number;
  private analyticsIdCounter: number;
  private transactionIdCounter: number;
  private buildLogIdCounter: number;
  private userActivityLogIdCounter: number;
  private systemSettingIdCounter: number;
  public sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.appConfigs = new Map();
    this.coupons = new Map();
    this.couponUsages = new Map();
    this.analytics = new Map();
    this.transactions = new Map();
    this.buildLogs = new Map();
    this.userActivityLogs = new Map();
    this.systemSettings = new Map();
    this.userIdCounter = 1;
    this.projectIdCounter = 1;
    this.appConfigIdCounter = 1;
    this.couponIdCounter = 1;
    this.couponUsageIdCounter = 1;
    this.analyticsIdCounter = 1;
    this.transactionIdCounter = 1;
    this.buildLogIdCounter = 1;
    this.userActivityLogIdCounter = 1;
    this.systemSettingIdCounter = 1;
    
    // Initialize memory session store
    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // Initialize default coupon codes
    this.initializeCoupons();
    
    // Initialize system settings
    this.initializeSystemSettings();
  }
  
  // Initialize system settings
  private async initializeSystemSettings() {
    const now = new Date().toISOString();
    const defaultSettings = [
      { 
        settingKey: "app_name", 
        settingValue: "Webin2Apk", 
        settingType: "text", 
        category: "general", 
        description: "Application name", 
        isPublic: true, 
        lastUpdated: now 
      },
      { 
        settingKey: "app_version", 
        settingValue: "1.0.0", 
        settingType: "text", 
        category: "general", 
        description: "Application version", 
        isPublic: true, 
        lastUpdated: now 
      },
      {
        settingKey: "payment_enabled",
        settingValue: "false",
        settingType: "boolean",
        category: "payment",
        description: "Enable payment requirement for builds",
        isPublic: true,
        lastUpdated: now
      },
      {
        settingKey: "default_payment_amount",
        settingValue: "500",
        settingType: "number",
        category: "payment",
        description: "Default payment amount in cents (500 = $5.00)",
        isPublic: true,
        lastUpdated: now
      }
    ];
    
    for (const setting of defaultSettings) {
      const id = this.systemSettingIdCounter++;
      this.systemSettings.set(id, { ...setting, id, updatedBy: null });
    }
  }
  
  // Initialize default coupon codes as specified (GLOBALX, MAKERAPP, DISCOUNT5)
  private async initializeCoupons() {
    const now = new Date().toISOString();
    const defaultCoupons = [
      { code: "GLOBALX", discountPercent: 100, isActive: true, createdAt: now, currentUses: 0 },
      { code: "MAKERAPP", discountPercent: 100, isActive: true, createdAt: now, currentUses: 0 },
      { code: "DISCOUNT5", discountPercent: 100, isActive: true, createdAt: now, currentUses: 0 }
    ];
    
    for (const coupon of defaultCoupons) {
      const id = this.couponIdCounter++;
      this.coupons.set(id, { ...coupon, id });
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date().toISOString();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: now,
      subscriptionStatus: "free_trial",
      subscriptionExpiry: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userUpdate: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userUpdate };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async updateStripeCustomerId(userId: number, customerId: string): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    const updatedUser = { ...user, stripeCustomerId: customerId };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  async updateUserSubscription(userId: number, subscriptionId: string, expiryDate: string): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    const updatedUser = { 
      ...user, 
      stripeSubscriptionId: subscriptionId,
      subscriptionStatus: "active",
      subscriptionExpiry: expiryDate
    };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  // Project methods
  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getProjectsByUserId(userId: number): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(
      (project) => project.userId === userId
    );
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = this.projectIdCounter++;
    const now = new Date().toISOString();
    const project: Project = { 
      ...insertProject, 
      id, 
      createdAt: now, 
      status: "draft",
      apkDownloadUrl: null,
      iconPath: null,
      isPaid: false,
      paymentIntentId: null,
      couponCode: null,
      paymentAmount: 500,
      paidAt: null
    };
    this.projects.set(id, project);
    return project;
  }

  async updateProject(id: number, projectUpdate: Partial<Project>): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project) return undefined;
    
    const updatedProject = { ...project, ...projectUpdate };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  async deleteProject(id: number): Promise<boolean> {
    return this.projects.delete(id);
  }
  
  async markProjectAsPaid(id: number, paymentIntentId: string): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project) return undefined;
    
    const now = new Date().toISOString();
    const updatedProject = { 
      ...project, 
      isPaid: true,
      paymentIntentId,
      paidAt: now,
      status: "paid"
    };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  // AppConfig methods
  async getAppConfig(projectId: number): Promise<AppConfig | undefined> {
    return Array.from(this.appConfigs.values()).find(
      (config) => config.projectId === projectId
    );
  }

  async createAppConfig(insertConfig: InsertAppConfig): Promise<AppConfig> {
    const id = this.appConfigIdCounter++;
    const config: AppConfig = { 
      ...insertConfig, 
      id,
      enableJavaScript: insertConfig.enableJavaScript ?? true,
      enableDomStorage: insertConfig.enableDomStorage ?? true,
      enableZoom: insertConfig.enableZoom ?? false,
      enableCache: insertConfig.enableCache ?? true,
      orientation: insertConfig.orientation || "auto",
      offlineMode: insertConfig.offlineMode || "none",
      permissions: insertConfig.permissions || [],
      customCodeAiSuggestions: insertConfig.customCodeAiSuggestions || {}
    };
    this.appConfigs.set(id, config);
    return config;
  }

  async updateAppConfig(id: number, configUpdate: Partial<AppConfig>): Promise<AppConfig | undefined> {
    const config = this.appConfigs.get(id);
    if (!config) return undefined;
    
    const updatedConfig = { ...config, ...configUpdate };
    this.appConfigs.set(id, updatedConfig);
    return updatedConfig;
  }
  
  // Coupon methods
  async getCouponByCode(code: string): Promise<Coupon | undefined> {
    return Array.from(this.coupons.values()).find(
      (coupon) => coupon.code.toLowerCase() === code.toLowerCase()
    );
  }
  
  async createCoupon(insertCoupon: InsertCoupon): Promise<Coupon> {
    const id = this.couponIdCounter++;
    const now = new Date().toISOString();
    const coupon: Coupon = {
      ...insertCoupon,
      id,
      createdAt: now,
      currentUses: 0
    };
    this.coupons.set(id, coupon);
    return coupon;
  }
  
  async updateCoupon(id: number, couponUpdate: Partial<Coupon>): Promise<Coupon | undefined> {
    const coupon = this.coupons.get(id);
    if (!coupon) return undefined;
    
    const updatedCoupon = { ...coupon, ...couponUpdate };
    this.coupons.set(id, updatedCoupon);
    return updatedCoupon;
  }
  
  async incrementCouponUsage(id: number): Promise<Coupon | undefined> {
    const coupon = this.coupons.get(id);
    if (!coupon) return undefined;
    
    const updatedCoupon = { 
      ...coupon, 
      currentUses: (coupon.currentUses || 0) + 1 
    };
    this.coupons.set(id, updatedCoupon);
    return updatedCoupon;
  }
  
  // Coupon usage methods
  async createCouponUsage(insertUsage: InsertCouponUsage): Promise<CouponUsage> {
    const id = this.couponUsageIdCounter++;
    const now = new Date().toISOString();
    const usage: CouponUsage = {
      ...insertUsage,
      id,
      usedAt: now
    };
    this.couponUsages.set(id, usage);
    return usage;
  }
  
  async getCouponUsagesByUser(userId: number): Promise<CouponUsage[]> {
    return Array.from(this.couponUsages.values()).filter(
      (usage) => usage.userId === userId
    );
  }

  // Get total number of users
  async getTotalUsers(): Promise<number> {
    return this.users.size;
  }

  // Get all users
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Update GitHub tokens for a user
  async updateUserGithubToken(userId: number, token: string, username: string): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    const updatedUser = { 
      ...user, 
      githubToken: token,
      githubUsername: username
    };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  // Analytics methods
  async getAnalyticsForDate(date: string): Promise<Analytics | undefined> {
    return Array.from(this.analytics.values()).find(
      (analytics) => analytics.date.split('T')[0] === date.split('T')[0]
    );
  }
  
  async createAnalytics(insertAnalytics: InsertAnalytics): Promise<Analytics> {
    const id = this.analyticsIdCounter++;
    const analytics: Analytics = {
      ...insertAnalytics,
      id
    };
    this.analytics.set(id, analytics);
    return analytics;
  }
  
  async updateAnalytics(id: number, analyticsUpdate: Partial<Analytics>): Promise<Analytics | undefined> {
    const analytics = this.analytics.get(id);
    if (!analytics) return undefined;
    
    const updatedAnalytics = { ...analytics, ...analyticsUpdate };
    this.analytics.set(id, updatedAnalytics);
    return updatedAnalytics;
  }
  
  async getAnalyticsRange(startDate: string, endDate: string): Promise<Analytics[]> {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    
    return Array.from(this.analytics.values()).filter(analytics => {
      const date = new Date(analytics.date).getTime();
      return date >= start && date <= end;
    });
  }
  
  // Transaction methods
  async getTransaction(id: number): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }
  
  async getTransactionsByUserId(userId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      (transaction) => transaction.userId === userId
    );
  }
  
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.transactionIdCounter++;
    const now = new Date().toISOString();
    const transaction: Transaction = {
      ...insertTransaction,
      id,
      createdAt: now
    };
    this.transactions.set(id, transaction);
    return transaction;
  }
  
  async updateTransaction(id: number, transactionUpdate: Partial<Transaction>): Promise<Transaction | undefined> {
    const transaction = this.transactions.get(id);
    if (!transaction) return undefined;
    
    const updatedTransaction = { ...transaction, ...transactionUpdate };
    this.transactions.set(id, updatedTransaction);
    return updatedTransaction;
  }
  
  async getAllTransactions(limit?: number, offset: number = 0): Promise<Transaction[]> {
    const transactions = Array.from(this.transactions.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(offset);
    
    return limit ? transactions.slice(0, limit) : transactions;
  }
  
  // Build logs methods
  async getBuildLog(id: number): Promise<BuildLog | undefined> {
    return this.buildLogs.get(id);
  }
  
  async getBuildLogsByProjectId(projectId: number): Promise<BuildLog[]> {
    return Array.from(this.buildLogs.values()).filter(
      (log) => log.projectId === projectId
    );
  }
  
  async getBuildLogsByUserId(userId: number): Promise<BuildLog[]> {
    return Array.from(this.buildLogs.values()).filter(
      (log) => log.userId === userId
    );
  }
  
  async createBuildLog(insertBuildLog: InsertBuildLog): Promise<BuildLog> {
    const id = this.buildLogIdCounter++;
    const now = new Date().toISOString();
    const buildLog: BuildLog = {
      ...insertBuildLog,
      id,
      startTime: now,
      endTime: null,
      duration: null
    };
    this.buildLogs.set(id, buildLog);
    return buildLog;
  }
  
  async updateBuildLog(id: number, buildLogUpdate: Partial<BuildLog>): Promise<BuildLog | undefined> {
    const buildLog = this.buildLogs.get(id);
    if (!buildLog) return undefined;
    
    const updatedBuildLog = { ...buildLog, ...buildLogUpdate };
    this.buildLogs.set(id, updatedBuildLog);
    return updatedBuildLog;
  }
  
  async getAllBuildLogs(limit?: number, offset: number = 0): Promise<BuildLog[]> {
    const logs = Array.from(this.buildLogs.values())
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(offset);
    
    return limit ? logs.slice(0, limit) : logs;
  }
  
  // User activity logs methods
  async getUserActivityLog(id: number): Promise<UserActivityLog | undefined> {
    return this.userActivityLogs.get(id);
  }
  
  async getUserActivityLogsByUserId(userId: number): Promise<UserActivityLog[]> {
    return Array.from(this.userActivityLogs.values()).filter(
      (log) => log.userId === userId
    );
  }
  
  async createUserActivityLog(insertActivityLog: InsertUserActivityLog): Promise<UserActivityLog> {
    const id = this.userActivityLogIdCounter++;
    const now = new Date().toISOString();
    const activityLog: UserActivityLog = {
      ...insertActivityLog,
      id,
      timestamp: now
    };
    this.userActivityLogs.set(id, activityLog);
    return activityLog;
  }
  
  async getAllUserActivityLogs(limit?: number, offset: number = 0): Promise<UserActivityLog[]> {
    const logs = Array.from(this.userActivityLogs.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(offset);
    
    return limit ? logs.slice(0, limit) : logs;
  }
  
  // System settings methods
  async getSystemSetting(key: string): Promise<SystemSetting | undefined> {
    return Array.from(this.systemSettings.values()).find(
      (setting) => setting.settingKey === key
    );
  }
  
  async getSystemSettingsByCategory(category: string): Promise<SystemSetting[]> {
    return Array.from(this.systemSettings.values()).filter(
      (setting) => setting.category === category
    );
  }
  
  async createSystemSetting(insertSetting: InsertSystemSetting): Promise<SystemSetting> {
    const id = this.systemSettingIdCounter++;
    const now = new Date().toISOString();
    const setting: SystemSetting = {
      ...insertSetting,
      id,
      lastUpdated: now
    };
    this.systemSettings.set(id, setting);
    return setting;
  }
  
  async updateSystemSetting(id: number, settingUpdate: Partial<SystemSetting>): Promise<SystemSetting | undefined> {
    const setting = this.systemSettings.get(id);
    if (!setting) return undefined;
    
    const now = new Date().toISOString();
    const updatedSetting = { 
      ...setting, 
      ...settingUpdate,
      lastUpdated: now
    };
    this.systemSettings.set(id, updatedSetting);
    return updatedSetting;
  }
  
  async getAllSystemSettings(): Promise<SystemSetting[]> {
    return Array.from(this.systemSettings.values());
  }
  
  // Dashboard stats methods
  async getDashboardStats(): Promise<any> {
    const totalUsers = this.users.size;
    const totalProjects = this.projects.size;
    const totalAppBuilds = this.buildLogs.size;
    
    // Count app builds by platform
    const androidBuilds = Array.from(this.buildLogs.values()).filter(
      (log) => log.platform === "android"
    ).length;
    
    const iosBuilds = Array.from(this.buildLogs.values()).filter(
      (log) => log.platform === "ios"
    ).length;
    
    // Count projects by source type
    const websiteTypeProjects = Array.from(this.projects.values()).filter(
      (project) => project.sourceType === "website"
    ).length;
    
    const htmlTypeProjects = Array.from(this.projects.values()).filter(
      (project) => project.sourceType === "html"
    ).length;
    
    const pdfTypeProjects = Array.from(this.projects.values()).filter(
      (project) => project.sourceType === "pdf"
    ).length;
    
    const codeTypeProjects = Array.from(this.projects.values()).filter(
      (project) => project.sourceType === "code"
    ).length;
    
    // Calculate total revenue
    const totalRevenue = Array.from(this.transactions.values()).reduce(
      (sum, transaction) => sum + transaction.amount,
      0
    );
    
    // Get recent build logs
    const recentBuildLogs = Array.from(this.buildLogs.values())
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, 10);
    
    // Get recent user activity
    const recentUserActivity = Array.from(this.userActivityLogs.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
    
    // Get recent transactions
    const recentTransactions = Array.from(this.transactions.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
    
    // Get user growth (last 7 days)
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const newUsers = Array.from(this.users.values()).filter(
      (user) => new Date(user.createdAt).getTime() >= sevenDaysAgo.getTime()
    ).length;
    
    return {
      totalUsers,
      totalProjects,
      totalAppBuilds,
      androidBuilds,
      iosBuilds,
      websiteTypeProjects,
      htmlTypeProjects,
      pdfTypeProjects,
      codeTypeProjects,
      totalRevenue,
      recentBuildLogs,
      recentUserActivity,
      recentTransactions,
      newUsers,
      
      // Calculate KPIs and metrics
      metrics: {
        averageBuildsPerUser: totalUsers > 0 ? totalAppBuilds / totalUsers : 0,
        averageProjectsPerUser: totalUsers > 0 ? totalProjects / totalUsers : 0,
        averageRevenuePerUser: totalUsers > 0 ? totalRevenue / totalUsers : 0,
        buildSuccessRate: totalAppBuilds > 0 ? 
          Array.from(this.buildLogs.values()).filter(log => log.status === "success").length / totalAppBuilds : 0,
        userGrowthRate: totalUsers > 0 ? newUsers / totalUsers : 0
      }
    };
  }
}

// DatabaseStorage implementation using Supabase PostgreSQL
export class DatabaseStorage implements IStorage {
  public sessionStore: session.Store;
  
  constructor() {
    // Initialize PostgreSQL session store
    const PostgresSessionStore = connectPg(session);
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true,
      tableName: 'user_sessions'
    });
    
    // Initialize default system settings and coupons
    this.initializeSystemSettings();
    this.initializeCoupons();
  }
  
  // Initialize system settings
  private async initializeSystemSettings() {
    try {
      // Only add default settings if none exist
      const existingSettings = await db.select().from(systemSettings);
      
      if (existingSettings.length === 0) {
        const now = new Date().toISOString();
        const defaultSettings = [
          { 
            settingKey: "app_name", 
            settingValue: "Webin2Apk", 
            settingType: "text", 
            category: "general", 
            description: "Application name", 
            isPublic: true, 
            lastUpdated: now 
          },
          { 
            settingKey: "app_version", 
            settingValue: "1.0.0", 
            settingType: "text", 
            category: "general", 
            description: "Application version", 
            isPublic: true, 
            lastUpdated: now 
          },
          {
            settingKey: "payment_enabled",
            settingValue: "false",
            settingType: "boolean",
            category: "payment",
            description: "Enable payment requirement for builds",
            isPublic: true,
            lastUpdated: now
          },
          {
            settingKey: "default_payment_amount",
            settingValue: "500",
            settingType: "number",
            category: "payment",
            description: "Default payment amount in cents (500 = $5.00)",
            isPublic: true,
            lastUpdated: now
          }
        ];
        
        for (const setting of defaultSettings) {
          await db.insert(systemSettings).values({
            ...setting,
            updatedBy: null
          });
        }
        
        console.log("Default system settings initialized");
      }
    } catch (error) {
      console.error("Error initializing system settings:", error);
    }
  }
  
  // Initialize default coupon codes
  private async initializeCoupons() {
    try {
      // Only add default coupons if none exist
      const existingCoupons = await db.select().from(coupons);
      
      if (existingCoupons.length === 0) {
        const now = new Date().toISOString();
        const defaultCoupons = [
          { code: "GLOBALX", discountPercent: 100, isActive: true, createdAt: now, currentUses: 0 },
          { code: "MAKERAPP", discountPercent: 100, isActive: true, createdAt: now, currentUses: 0 },
          { code: "DISCOUNT5", discountPercent: 100, isActive: true, createdAt: now, currentUses: 0 }
        ];
        
        for (const coupon of defaultCoupons) {
          await db.insert(coupons).values(coupon);
        }
        
        console.log("Default coupons initialized");
      }
    } catch (error) {
      console.error("Error initializing coupons:", error);
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const now = new Date().toISOString();
    const newUser = {
      ...insertUser,
      createdAt: now,
      subscriptionStatus: "free_trial",
      subscriptionExpiry: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
    };
    
    const [user] = await db.insert(users).values(newUser).returning();
    return user;
  }
  
  async updateUser(id: number, userUpdate: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userUpdate)
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser;
  }
  
  async updateStripeCustomerId(userId: number, customerId: string): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ stripeCustomerId: customerId })
      .where(eq(users.id, userId))
      .returning();
    
    return updatedUser;
  }
  
  async updateUserSubscription(userId: number, subscriptionId: string, expiryDate: string): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({
        stripeSubscriptionId: subscriptionId,
        subscriptionStatus: "active",
        subscriptionExpiry: expiryDate
      })
      .where(eq(users.id, userId))
      .returning();
    
    return updatedUser;
  }
  
  async getTotalUsers(): Promise<number> {
    const result = await db.select({ count: users }).from(users);
    return Number(result[0]?.count) || 0;
  }
  
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  
  // Project methods
  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async getProjectsByUserId(userId: number): Promise<Project[]> {
    return await db.select().from(projects).where(eq(projects.userId, userId));
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const now = new Date().toISOString();
    const newProject = { 
      ...insertProject, 
      createdAt: now, 
      status: "draft",
      apkDownloadUrl: null,
      iconPath: null,
      isPaid: false,
      paymentIntentId: null,
      couponCode: null,
      paymentAmount: 500,
      paidAt: null
    };
    
    const [project] = await db.insert(projects).values(newProject).returning();
    return project;
  }

  async updateProject(id: number, projectUpdate: Partial<Project>): Promise<Project | undefined> {
    const [updatedProject] = await db
      .update(projects)
      .set(projectUpdate)
      .where(eq(projects.id, id))
      .returning();
    
    return updatedProject;
  }

  async deleteProject(id: number): Promise<boolean> {
    try {
      await db.delete(projects).where(eq(projects.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting project:", error);
      return false;
    }
  }
  
  async markProjectAsPaid(id: number, paymentIntentId: string): Promise<Project | undefined> {
    const now = new Date().toISOString();
    
    const [updatedProject] = await db
      .update(projects)
      .set({
        isPaid: true,
        paymentIntentId,
        paidAt: now,
        status: "paid"
      })
      .where(eq(projects.id, id))
      .returning();
    
    return updatedProject;
  }

  // AppConfig methods
  async getAppConfig(projectId: number): Promise<AppConfig | undefined> {
    const [config] = await db
      .select()
      .from(appConfigs)
      .where(eq(appConfigs.projectId, projectId));
    
    return config;
  }

  async createAppConfig(insertConfig: InsertAppConfig): Promise<AppConfig> {
    // Clean up the data to match the database schema
    const newConfig = { 
      projectId: insertConfig.projectId,
      enableJavaScript: insertConfig.enableJavaScript ?? true,
      enableDomStorage: insertConfig.enableDomStorage ?? true,
      enableZoom: insertConfig.enableZoom ?? false,
      enableCache: insertConfig.enableCache ?? true,
      orientation: insertConfig.orientation || "auto",
      offlineMode: insertConfig.offlineMode || "none",
      permissions: insertConfig.permissions || [],
      customCss: insertConfig.customCss || null,
      splashScreenEnabled: insertConfig.splashScreenEnabled ?? false,
      splashScreenDuration: insertConfig.splashScreenDuration || 3000,
      adMobEnabled: insertConfig.adMobEnabled ?? false,
      adMobAppId: insertConfig.adMobAppId || null,
      adMobBannerId: insertConfig.adMobBannerId || null,
      adMobInterstitialId: insertConfig.adMobInterstitialId || null,
      // Handle the naming inconsistency between schema and database
      custom_code_enabled: insertConfig.includeCustomCode ?? false,
      include_custom_code: insertConfig.includeCustomCode ?? false,
      custom_code_verified: insertConfig.customCodeVerified ?? false,
      custom_code_language: insertConfig.customCodeLanguage || "java",
      custom_code_content: insertConfig.customCodeContent || null,
      custom_code_ai_suggestions: insertConfig.customCodeAiSuggestions || {}
    };
    
    const [config] = await db.insert(appConfigs).values(newConfig).returning();
    return config;
  }

  async updateAppConfig(id: number, configUpdate: Partial<AppConfig>): Promise<AppConfig | undefined> {
    const [updatedConfig] = await db
      .update(appConfigs)
      .set(configUpdate)
      .where(eq(appConfigs.id, id))
      .returning();
    
    return updatedConfig;
  }
  
  // Coupon methods
  async getCouponByCode(code: string): Promise<Coupon | undefined> {
    const [coupon] = await db
      .select()
      .from(coupons)
      .where(eq(coupons.code, code));
    
    return coupon;
  }
  
  async createCoupon(insertCoupon: InsertCoupon): Promise<Coupon> {
    const now = new Date().toISOString();
    const newCoupon = {
      ...insertCoupon,
      createdAt: now,
      currentUses: 0
    };
    
    const [coupon] = await db.insert(coupons).values(newCoupon).returning();
    return coupon;
  }
  
  async updateCoupon(id: number, couponUpdate: Partial<Coupon>): Promise<Coupon | undefined> {
    const [updatedCoupon] = await db
      .update(coupons)
      .set(couponUpdate)
      .where(eq(coupons.id, id))
      .returning();
    
    return updatedCoupon;
  }
  
  async incrementCouponUsage(id: number): Promise<Coupon | undefined> {
    // First get current coupon to get current uses
    const [coupon] = await db.select().from(coupons).where(eq(coupons.id, id));
    
    if (!coupon) return undefined;
    
    // Increment and update
    const [updatedCoupon] = await db
      .update(coupons)
      .set({ 
        currentUses: (coupon.currentUses || 0) + 1 
      })
      .where(eq(coupons.id, id))
      .returning();
    
    return updatedCoupon;
  }
  
  // Coupon usage methods
  async createCouponUsage(insertUsage: InsertCouponUsage): Promise<CouponUsage> {
    const now = new Date().toISOString();
    const newUsage = {
      ...insertUsage,
      usedAt: now
    };
    
    const [usage] = await db.insert(couponUsage).values(newUsage).returning();
    return usage;
  }
  
  async getCouponUsagesByUser(userId: number): Promise<CouponUsage[]> {
    return await db
      .select()
      .from(couponUsage)
      .where(eq(couponUsage.userId, userId));
  }

  // GitHub integration
  async updateUserGithubToken(userId: number, token: string, username: string): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ 
        githubToken: token,
        githubUsername: username
      })
      .where(eq(users.id, userId))
      .returning();
    
    return updatedUser;
  }
  
  // Analytics methods
  async getAnalyticsForDate(date: string): Promise<Analytics | undefined> {
    const dateOnly = date.split('T')[0];
    const [analyticsData] = await db
      .select()
      .from(analytics)
      .where(like(analytics.date, `${dateOnly}%`));
    
    return analyticsData;
  }
  
  async createAnalytics(insertAnalytics: InsertAnalytics): Promise<Analytics> {
    const [analyticsData] = await db
      .insert(analytics)
      .values(insertAnalytics)
      .returning();
    
    return analyticsData;
  }
  
  async updateAnalytics(id: number, analyticsUpdate: Partial<Analytics>): Promise<Analytics | undefined> {
    const [updatedAnalytics] = await db
      .update(analytics)
      .set(analyticsUpdate)
      .where(eq(analytics.id, id))
      .returning();
    
    return updatedAnalytics;
  }
  
  async getAnalyticsRange(startDate: string, endDate: string): Promise<Analytics[]> {
    return await db
      .select()
      .from(analytics)
      .where(
        and(
          gte(analytics.date, startDate),
          lte(analytics.date, endDate)
        )
      )
      .orderBy(analytics.date);
  }
  
  // Transaction methods
  async getTransaction(id: number): Promise<Transaction | undefined> {
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id));
    
    return transaction;
  }
  
  async getTransactionsByUserId(userId: number): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt));
  }
  
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const now = new Date().toISOString();
    // Make sure we have the required fields based on the database schema
    const newTransaction = {
      userId: insertTransaction.userId,
      type: insertTransaction.type || 'payment',
      status: insertTransaction.status || 'completed',
      amount: insertTransaction.amount || 0,
      paymentMethod: insertTransaction.paymentMethod || 'card',
      description: insertTransaction.description || null,
      paymentIntentId: insertTransaction.paymentIntentId || null,
      projectId: insertTransaction.projectId || null,
      invoiceId: insertTransaction.invoiceId || null,
      receiptUrl: insertTransaction.receiptUrl || null,
      currency: insertTransaction.currency || 'usd',
      metadata: insertTransaction.metadata || {},
      createdAt: now
    };
    
    const [transaction] = await db
      .insert(transactions)
      .values(newTransaction)
      .returning();
    
    return transaction;
  }
  
  async updateTransaction(id: number, transactionUpdate: Partial<Transaction>): Promise<Transaction | undefined> {
    const [updatedTransaction] = await db
      .update(transactions)
      .set(transactionUpdate)
      .where(eq(transactions.id, id))
      .returning();
    
    return updatedTransaction;
  }
  
  async getAllTransactions(limit?: number, offset: number = 0): Promise<Transaction[]> {
    let query = db
      .select()
      .from(transactions)
      .orderBy(desc(transactions.createdAt))
      .offset(offset);
    
    if (limit) {
      query = query.limit(limit);
    }
    
    return await query;
  }
  
  // Build logs methods
  async getBuildLog(id: number): Promise<BuildLog | undefined> {
    const [buildLog] = await db
      .select()
      .from(buildLogs)
      .where(eq(buildLogs.id, id));
    
    return buildLog;
  }
  
  async getBuildLogsByProjectId(projectId: number): Promise<BuildLog[]> {
    return await db
      .select()
      .from(buildLogs)
      .where(eq(buildLogs.projectId, projectId))
      .orderBy(desc(buildLogs.startTime));
  }
  
  async getBuildLogsByUserId(userId: number): Promise<BuildLog[]> {
    return await db
      .select()
      .from(buildLogs)
      .where(eq(buildLogs.userId, userId))
      .orderBy(desc(buildLogs.startTime));
  }
  
  async createBuildLog(insertBuildLog: InsertBuildLog): Promise<BuildLog> {
    const now = new Date().toISOString();
    const newBuildLog = {
      ...insertBuildLog,
      startTime: now,
      endTime: null,
      duration: null
    };
    
    const [buildLog] = await db
      .insert(buildLogs)
      .values(newBuildLog)
      .returning();
    
    return buildLog;
  }
  
  async updateBuildLog(id: number, buildLogUpdate: Partial<BuildLog>): Promise<BuildLog | undefined> {
    const [updatedBuildLog] = await db
      .update(buildLogs)
      .set(buildLogUpdate)
      .where(eq(buildLogs.id, id))
      .returning();
    
    return updatedBuildLog;
  }
  
  async getAllBuildLogs(limit?: number, offset: number = 0): Promise<BuildLog[]> {
    let query = db
      .select()
      .from(buildLogs)
      .orderBy(desc(buildLogs.startTime))
      .offset(offset);
    
    if (limit) {
      query = query.limit(limit);
    }
    
    return await query;
  }
  
  // User activity logs methods
  async getUserActivityLog(id: number): Promise<UserActivityLog | undefined> {
    const [activityLog] = await db
      .select()
      .from(userActivityLogs)
      .where(eq(userActivityLogs.id, id));
    
    return activityLog;
  }
  
  async getUserActivityLogsByUserId(userId: number): Promise<UserActivityLog[]> {
    return await db
      .select()
      .from(userActivityLogs)
      .where(eq(userActivityLogs.userId, userId))
      .orderBy(desc(userActivityLogs.timestamp));
  }
  
  async createUserActivityLog(insertActivityLog: InsertUserActivityLog): Promise<UserActivityLog> {
    const now = new Date().toISOString();
    // Ensure all required fields are set
    const newActivityLog = {
      userId: insertActivityLog.userId,
      action: insertActivityLog.action,
      timestamp: now,
      ipAddress: insertActivityLog.ipAddress || null,
      userAgent: insertActivityLog.userAgent || null,
      details: insertActivityLog.details || {}
    };
    
    const [activityLog] = await db
      .insert(userActivityLogs)
      .values(newActivityLog)
      .returning();
    
    return activityLog;
  }
  
  async getAllUserActivityLogs(limit?: number, offset: number = 0): Promise<UserActivityLog[]> {
    let query = db
      .select()
      .from(userActivityLogs)
      .orderBy(desc(userActivityLogs.timestamp))
      .offset(offset);
    
    if (limit) {
      query = query.limit(limit);
    }
    
    return await query;
  }
  
  // System settings methods
  async getSystemSetting(key: string): Promise<SystemSetting | undefined> {
    const [setting] = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.settingKey, key));
    
    return setting;
  }
  
  async getSystemSettingsByCategory(category: string): Promise<SystemSetting[]> {
    return await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.category, category));
  }
  
  async createSystemSetting(insertSetting: InsertSystemSetting): Promise<SystemSetting> {
    const now = new Date().toISOString();
    const newSetting = {
      ...insertSetting,
      lastUpdated: now
    };
    
    const [setting] = await db
      .insert(systemSettings)
      .values(newSetting)
      .returning();
    
    return setting;
  }
  
  async updateSystemSetting(id: number, settingUpdate: Partial<SystemSetting>): Promise<SystemSetting | undefined> {
    const now = new Date().toISOString();
    
    const [updatedSetting] = await db
      .update(systemSettings)
      .set({
        ...settingUpdate,
        lastUpdated: now
      })
      .where(eq(systemSettings.id, id))
      .returning();
    
    return updatedSetting;
  }
  
  async getAllSystemSettings(): Promise<SystemSetting[]> {
    return await db.select().from(systemSettings);
  }
  
  // Dashboard stats methods
  async getDashboardStats(): Promise<any> {
    // Total users
    const userCount = await this.getTotalUsers();
    
    // Total projects
    const projectsResult = await db.select({ count: projects }).from(projects);
    const projectCount = Number(projectsResult[0]?.count) || 0;
    
    // Completed builds
    const completedBuildsResult = await db
      .select({ count: projects })
      .from(projects)
      .where(eq(projects.status, "built"));
    const builtCount = Number(completedBuildsResult[0]?.count) || 0;
    
    // Recent transactions
    const recentTransactions = await this.getAllTransactions(5);
    
    // Recent build logs
    const recentBuildLogs = await this.getAllBuildLogs(5);
    
    // Platform stats
    const androidBuildsResult = await db
      .select({ count: buildLogs })
      .from(buildLogs)
      .where(like(buildLogs.buildType, "%android%"));
    const androidBuilds = Number(androidBuildsResult[0]?.count) || 0;
    
    const iosBuildsResult = await db
      .select({ count: buildLogs })
      .from(buildLogs)
      .where(like(buildLogs.buildType, "%ios%"));
    const iosBuilds = Number(iosBuildsResult[0]?.count) || 0;
    
    return {
      userCount,
      projectCount,
      builtCount,
      recentTransactions,
      recentBuildLogs,
      platformStats: {
        android: androidBuilds,
        ios: iosBuilds
      }
    };
  }
}

// Switch to PostgreSQL-based DatabaseStorage
export const storage = new DatabaseStorage();
