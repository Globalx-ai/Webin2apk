import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { websiteFormSchema, insertProjectSchema, insertAppConfigSchema } from "@shared/schema";
import { generateAPK } from "./services/apkGenerator";
import { generateAppIcon } from "./utils/imageProcessor";
import { generateAndroidManifest } from "./utils/manifestGenerator";
import { generateKeystore } from "./utils/keystore";
import fs from "fs";
import path from "path";
import multer from "multer";
import { promisify } from "util";

// Create upload directories
const mkdirAsync = promisify(fs.mkdir);
const uploadDir = path.join(process.cwd(), "uploads");
const apkDir = path.join(process.cwd(), "dist", "public", "downloads");
const iconDir = path.join(process.cwd(), "uploads", "icons");

// Ensure directories exist
(async () => {
  try {
    await mkdirAsync(uploadDir, { recursive: true });
    await mkdirAsync(apkDir, { recursive: true });
    await mkdirAsync(iconDir, { recursive: true });
  } catch (err) {
    console.error("Failed to create upload directories:", err);
  }
})();

// Configure multer for file uploads
const storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "icon") {
      cb(null, iconDir);
    } else {
      cb(null, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage_multer });

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes
  
  // Test API connection
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok" });
  });

  // Validate website URL
  app.post("/api/validate-url", async (req: Request, res: Response) => {
    try {
      const { websiteUrl } = req.body;
      
      // Use zod to validate the URL
      const validatedUrl = z.string().url().safeParse(websiteUrl);
      
      if (!validatedUrl.success) {
        return res.status(400).json({ 
          valid: false, 
          message: "Invalid URL format" 
        });
      }
      
      // Test if the URL is reachable
      try {
        const response = await fetch(websiteUrl, { method: "HEAD" });
        if (response.ok) {
          return res.json({ valid: true, message: "URL is valid and accessible" });
        } else {
          return res.status(400).json({ 
            valid: false, 
            message: `URL returned status ${response.status}` 
          });
        }
      } catch (error) {
        return res.status(400).json({ 
          valid: false, 
          message: "Could not connect to the website" 
        });
      }
    } catch (error) {
      res.status(500).json({ 
        error: "Server error", 
        message: (error as Error).message 
      });
    }
  });

  // Create a new project
  app.post("/api/projects", async (req: Request, res: Response) => {
    try {
      const formData = websiteFormSchema.safeParse(req.body);
      
      if (!formData.success) {
        return res.status(400).json({ 
          error: "Validation error", 
          details: formData.error.format() 
        });
      }
      
      // Create the project
      const projectData = {
        userId: 1, // For simplicity, default to user ID 1
        name: formData.data.appName,
        packageName: formData.data.packageName,
        sourceUrl: formData.data.websiteUrl || "",
        sourceType: formData.data.sourceType || "website",
        htmlContent: formData.data.htmlContent || null,
        description: formData.data.description || ""
      };
      
      const project = await storage.createProject(projectData);
      
      // Create the app configuration
      const configData = {
        projectId: project.id,
        enableJavaScript: formData.data.enableJavaScript,
        enableDomStorage: formData.data.enableDomStorage,
        enableZoom: formData.data.enableZoom,
        enableCache: formData.data.enableCache,
        orientation: formData.data.orientation,
        offlineMode: formData.data.offlineMode,
        permissions: ["INTERNET"], // Default permission
        splashScreenEnabled: false,
        adMobEnabled: false
      };
      
      const appConfig = await storage.createAppConfig(configData);
      
      res.status(201).json({ 
        project,
        appConfig
      });
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(500).json({ 
        error: "Server error", 
        message: (error as Error).message 
      });
    }
  });

  // Get all projects
  app.get("/api/projects", async (req: Request, res: Response) => {
    try {
      const userId = 1; // For simplicity, default to user ID 1
      const projects = await storage.getProjectsByUserId(userId);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ 
        error: "Server error", 
        message: (error as Error).message 
      });
    }
  });

  // Get project by ID
  app.get("/api/projects/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid project ID" });
      }
      
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      const appConfig = await storage.getAppConfig(id);
      
      res.json({ project, appConfig });
    } catch (error) {
      res.status(500).json({ 
        error: "Server error", 
        message: (error as Error).message 
      });
    }
  });

  // Update project
  app.patch("/api/projects/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid project ID" });
      }
      
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      const updatedProject = await storage.updateProject(id, req.body);
      res.json(updatedProject);
    } catch (error) {
      res.status(500).json({ 
        error: "Server error", 
        message: (error as Error).message 
      });
    }
  });

  // Update app configuration
  app.patch("/api/projects/:id/config", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        return res.status(400).json({ error: "Invalid project ID" });
      }
      
      const appConfig = await storage.getAppConfig(projectId);
      if (!appConfig) {
        return res.status(404).json({ error: "App configuration not found" });
      }
      
      const updatedConfig = await storage.updateAppConfig(appConfig.id, req.body);
      res.json(updatedConfig);
    } catch (error) {
      res.status(500).json({ 
        error: "Server error", 
        message: (error as Error).message 
      });
    }
  });

  // Upload app icon
  app.post("/api/projects/:id/icon", upload.single("icon"), async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        return res.status(400).json({ error: "Invalid project ID" });
      }
      
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      // Generate app icons for different sizes
      const iconPath = req.file.path;
      const generatedIcons = await generateAppIcon(iconPath, projectId);
      
      // Update project with the icon path
      const updatedProject = await storage.updateProject(projectId, {
        iconPath: generatedIcons.iconSetPath
      });
      
      res.json({
        message: "Icon uploaded and processed successfully",
        project: updatedProject,
        icons: generatedIcons
      });
    } catch (error) {
      console.error("Error uploading icon:", error);
      res.status(500).json({ 
        error: "Server error", 
        message: (error as Error).message 
      });
    }
  });

  // Generate APK
  app.post("/api/projects/:id/build", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        return res.status(400).json({ error: "Invalid project ID" });
      }
      
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      const appConfig = await storage.getAppConfig(projectId);
      if (!appConfig) {
        return res.status(404).json({ error: "App configuration not found" });
      }
      
      // Update project status
      await storage.updateProject(projectId, { status: "building" });
      
      // Generate Android manifest
      const manifestPath = await generateAndroidManifest({
        appName: project.name,
        packageName: project.packageName,
        url: project.sourceUrl,
        orientation: appConfig.orientation,
        permissions: appConfig.permissions || ["INTERNET"],
      });
      
      // Generate keystore if not exists
      const keystorePath = await generateKeystore(project.packageName);
      
      // Build APK
      const apkResult = await generateAPK({
        projectId,
        appName: project.name,
        packageName: project.packageName,
        sourceUrl: project.sourceUrl || "",
        iconPath: project.iconPath || undefined,
        manifestPath,
        keystorePath,
        appConfig
      });
      
      // Update project with APK path
      const updatedProject = await storage.updateProject(projectId, {
        status: "completed",
        apkDownloadUrl: apkResult.downloadUrl
      });
      
      res.json({
        message: "APK built successfully",
        project: updatedProject,
        apk: apkResult
      });
    } catch (error) {
      console.error("Error building APK:", error);
      
      // Update project status to failed
      await storage.updateProject(parseInt(req.params.id), { status: "failed" });
      
      res.status(500).json({ 
        error: "APK build failed", 
        message: (error as Error).message 
      });
    }
  });

  // Download APK
  app.get("/api/projects/:id/download", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        return res.status(400).json({ error: "Invalid project ID" });
      }
      
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      if (!project.apkDownloadUrl) {
        return res.status(404).json({ error: "APK not found. Build the project first." });
      }
      
      const apkPath = path.join(process.cwd(), project.apkDownloadUrl);
      
      if (!fs.existsSync(apkPath)) {
        return res.status(404).json({ error: "APK file not found on the server" });
      }
      
      res.download(apkPath, `${project.name}.apk`);
    } catch (error) {
      res.status(500).json({ 
        error: "Server error", 
        message: (error as Error).message 
      });
    }
  });
  
  // Route to validate and optimize HTML content
  app.post("/api/optimize-html", async (req: Request, res: Response) => {
    try {
      const { htmlContent } = req.body;
      
      if (!htmlContent) {
        return res.status(400).json({ error: "HTML content is required" });
      }
      
      // Import the AI service for HTML optimization
      const { optimizeHtml } = await import('./services/aiService');
      
      // Optimize the HTML content
      const optimizedHtml = await optimizeHtml(htmlContent);
      
      return res.json({ 
        success: true, 
        optimizedHtml,
        message: "HTML content optimized successfully" 
      });
    } catch (error) {
      console.error("Error optimizing HTML:", error);
      res.status(500).json({ 
        error: "Failed to optimize HTML content",
        message: (error as Error).message 
      });
    }
  });
  
  // Route to validate custom code
  app.post("/api/validate-code", async (req: Request, res: Response) => {
    try {
      const { language, content, projectId } = req.body;
      
      if (!language || !content) {
        return res.status(400).json({ error: "Language and code content are required" });
      }
      
      // Import the AI service for code validation
      const { validateCode } = await import('./services/aiService');
      
      // Validate the code
      const validationResult = await validateCode({ language, content, projectId: Number(projectId) });
      
      return res.json({ 
        success: true,
        ...validationResult
      });
    } catch (error) {
      console.error("Error validating code:", error);
      res.status(500).json({ 
        error: "Failed to validate code",
        message: (error as Error).message
      });
    }
  });
  
  // Route to auto-complete code
  app.post("/api/complete-code", async (req: Request, res: Response) => {
    try {
      const { language, partialCode, context } = req.body;
      
      if (!language || !partialCode) {
        return res.status(400).json({ error: "Language and partial code are required" });
      }
      
      // Import the AI service for code completion
      const { completeCode } = await import('./services/aiService');
      
      // Complete the code
      const completionResult = await completeCode(language, partialCode, context || '');
      
      return res.json({ 
        success: true,
        ...completionResult
      });
    } catch (error) {
      console.error("Error completing code:", error);
      res.status(500).json({ 
        error: "Failed to complete code",
        message: (error as Error).message 
      });
    }
  });
  
  // Route to analyze PDF content for app conversion
  app.post("/api/analyze-pdf", upload.single('pdfFile'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "PDF file is required" });
      }
      
      const pdfFilePath = req.file.path;
      const pdfFileUrl = `file://${pdfFilePath}`;
      
      // Import the AI service for PDF analysis
      const { analyzePdf } = await import('./services/aiService');
      
      // Analyze the PDF content
      const analysisResult = await analyzePdf(pdfFileUrl);
      
      return res.json({ 
        success: true,
        ...analysisResult,
        filePath: pdfFilePath
      });
    } catch (error) {
      console.error("Error analyzing PDF:", error);
      res.status(500).json({ 
        error: "Failed to analyze PDF file",
        message: (error as Error).message
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
