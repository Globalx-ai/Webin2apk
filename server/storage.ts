import { 
  users, type User, type InsertUser,
  projects, type Project, type InsertProject,
  appConfigs, type AppConfig, type InsertAppConfig,
  coupons, type Coupon, type InsertCoupon,
  couponUsage, type CouponUsage, type InsertCouponUsage
} from "@shared/schema";
import session from 'express-session';
import createMemoryStore from 'memorystore';

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  updateStripeCustomerId(userId: number, customerId: string): Promise<User | undefined>;
  updateUserSubscription(userId: number, subscriptionId: string, expiryDate: string): Promise<User | undefined>;
  
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
  
  // Session store for auth
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private projects: Map<number, Project>;
  private appConfigs: Map<number, AppConfig>;
  private coupons: Map<number, Coupon>;
  private couponUsages: Map<number, CouponUsage>;
  private userIdCounter: number;
  private projectIdCounter: number;
  private appConfigIdCounter: number;
  private couponIdCounter: number;
  private couponUsageIdCounter: number;
  public sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.appConfigs = new Map();
    this.coupons = new Map();
    this.couponUsages = new Map();
    this.userIdCounter = 1;
    this.projectIdCounter = 1;
    this.appConfigIdCounter = 1;
    this.couponIdCounter = 1;
    this.couponUsageIdCounter = 1;
    
    // Initialize memory session store
    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // Initialize default coupon codes
    this.initializeCoupons();
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
}

export const storage = new MemStorage();
