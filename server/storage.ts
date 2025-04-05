import { 
  users, type User, type InsertUser,
  projects, type Project, type InsertProject,
  appConfigs, type AppConfig, type InsertAppConfig
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Project methods
  getProject(id: number): Promise<Project | undefined>;
  getProjectsByUserId(userId: number): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<Project>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;
  
  // AppConfig methods
  getAppConfig(projectId: number): Promise<AppConfig | undefined>;
  createAppConfig(config: InsertAppConfig): Promise<AppConfig>;
  updateAppConfig(id: number, config: Partial<AppConfig>): Promise<AppConfig | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private projects: Map<number, Project>;
  private appConfigs: Map<number, AppConfig>;
  private userIdCounter: number;
  private projectIdCounter: number;
  private appConfigIdCounter: number;

  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.appConfigs = new Map();
    this.userIdCounter = 1;
    this.projectIdCounter = 1;
    this.appConfigIdCounter = 1;
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
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
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
      apkDownloadUrl: undefined,
      iconPath: undefined
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

  // AppConfig methods
  async getAppConfig(projectId: number): Promise<AppConfig | undefined> {
    return Array.from(this.appConfigs.values()).find(
      (config) => config.projectId === projectId
    );
  }

  async createAppConfig(insertConfig: InsertAppConfig): Promise<AppConfig> {
    const id = this.appConfigIdCounter++;
    const config: AppConfig = { ...insertConfig, id };
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
}

export const storage = new MemStorage();
