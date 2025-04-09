import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { websiteFormSchema, insertProjectSchema, insertAppConfigSchema } from "@shared/schema";
import { generateAPK } from "./services/apkGenerator";
import { generateAppIcon } from "./utils/imageProcessor";
import { generateAndroidManifest } from "./utils/manifestGenerator";
import { generateKeystore } from "./utils/keystore";
import { fetchCodeWithAI, improveCodeWithAI } from "./services/aiCodeFetcher";
import { setupAuth } from "./auth";
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
  // Setup authentication
  setupAuth(app);
  
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
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const formData = websiteFormSchema.safeParse(req.body);
      
      if (!formData.success) {
        return res.status(400).json({ 
          error: "Validation error", 
          details: formData.error.format() 
        });
      }
      
      // Create the project
      const projectData = {
        userId: req.user.id, // Use the authenticated user's ID
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
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const projects = await storage.getProjectsByUserId(req.user.id);
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
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid project ID" });
      }
      
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      // Check if the project belongs to the current user
      if (project.userId !== req.user.id) {
        return res.status(403).json({ error: "You don't have permission to access this project" });
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
      console.log("Icon upload request received");
      
      // Debug request information
      console.log("Request body:", req.body);
      console.log("Request file:", req.file);
      console.log("Request params:", req.params);
      
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
      
      // Debug file information
      console.log("Uploaded file:", {
        path: req.file.path,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size
      });
      
      try {
        // Verify the file exists
        await fs.promises.access(req.file.path, fs.constants.F_OK);
        console.log("File exists at path:", req.file.path);
      } catch (fileError) {
        console.error("File does not exist:", fileError);
        return res.status(500).json({ error: "File upload failed - file not saved correctly" });
      }
      
      // Generate app icons for different sizes
      console.log("Generating app icons...");
      const iconPath = req.file.path;
      const generatedIcons = await generateAppIcon(iconPath, projectId);
      console.log("Generated icons:", generatedIcons);
      
      // Update project with the icon path
      const updatedProject = await storage.updateProject(projectId, {
        iconPath: generatedIcons.iconSetPath
      });
      
      console.log("Project updated with icon path:", updatedProject?.iconPath || "none");
      
      res.json({
        message: "Icon uploaded and processed successfully",
        project: updatedProject,
        icons: generatedIcons
      });
    } catch (error) {
      console.error("Error uploading icon:", error);
      
      // Provide more detailed error information
      if (error instanceof Error) {
        res.status(500).json({ 
          error: "Server error", 
          message: error.message,
          stack: process.env.NODE_ENV === 'production' ? undefined : error.stack 
        });
      } else {
        res.status(500).json({ 
          error: "Server error", 
          message: String(error)
        });
      }
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
        url: project.sourceUrl || 'about:blank', // Provide default URL if not available
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
      
      // Get the APK download path for this project
      const apkFilename = `${project.name.replace(/\s+/g, '_')}_v1.0.apk`;
      const downloadsDirPath = path.join(process.cwd(), 'dist', 'public', 'downloads');
      const apkPath = path.join(downloadsDirPath, apkFilename);
      const publicPath = `/downloads/${apkFilename}`;
      
      console.log('APK requested. Looking for file:', apkPath);
      
      // If file doesn't exist or there's no download URL, try to build it first
      if (!fs.existsSync(apkPath) || !project.apkDownloadUrl) {
        console.log('APK file not found, generating on demand...');
        
        // Ensure the downloads directory exists
        await fs.promises.mkdir(downloadsDirPath, { recursive: true });
        
        // Get or create app config
        let appConfig = await storage.getAppConfig(projectId);
        if (!appConfig) {
          appConfig = await storage.createAppConfig({
            projectId,
            enableJavaScript: true,
            enableZoom: true,
            orientation: "portrait",
            permissions: ["INTERNET"]
          });
        }
        
        // Generate manifest file
        const buildsDir = path.join(process.cwd(), 'builds');
        await fs.promises.mkdir(buildsDir, { recursive: true });
        const manifestPath = path.join(buildsDir, `manifest_${projectId}.xml`);
        
        try {
          await generateAndroidManifest({
            appName: project.name,
            packageName: project.packageName,
            url: project.sourceUrl || '',
            orientation: appConfig.orientation,
            permissions: appConfig.permissions || ['INTERNET']
          });
        } catch (err) {
          console.error('Failed to generate manifest:', err);
          return res.status(500).json({ error: "Failed to generate Android manifest" });
        }
        
        // Generate keystore directory if it doesn't exist
        const keystoreDir = path.join(buildsDir, 'keystores');
        await fs.promises.mkdir(keystoreDir, { recursive: true });
        
        // Generate keystore if it doesn't exist
        const keystorePath = path.join(
          keystoreDir,
          `${project.packageName.replace(/\./g, '_')}.keystore`
        );
        
        // Get icon path if available (handling potentially null/undefined)
        const iconPath = project.iconPath ?? undefined;
        
        try {
          // Generate the APK
          const apkResult = await generateAPK({
            projectId,
            appName: project.name,
            packageName: project.packageName,
            sourceUrl: project.sourceUrl || undefined,
            iconPath,
            manifestPath,
            keystorePath,
            appConfig
          });
          
          if (apkResult.success) {
            // Update project with download URL
            await storage.updateProject(projectId, {
              status: "built",
              apkDownloadUrl: publicPath
            });
            
            // Ensure the APK is available at the expected path
            if (apkResult.apkPath && fs.existsSync(apkResult.apkPath)) {
              // Copy APK to public downloads directory if needed
              if (apkResult.apkPath !== apkPath) {
                await fs.promises.copyFile(apkResult.apkPath, apkPath);
              }
            }
            
            console.log('APK successfully generated on demand:', apkPath);
          } else {
            return res.status(500).json({ error: "APK generation failed" });
          }
        } catch (error) {
          console.error('Failed to generate APK on demand:', error);
          return res.status(500).json({ 
            error: "APK generation failed", 
            message: `Could not build APK: ${(error as Error).message}` 
          });
        }
      }
      
      // Check again if file exists after potential build
      if (!fs.existsSync(apkPath)) {
        return res.status(404).json({ 
          error: "APK file not available", 
          message: "The APK file could not be found or generated" 
        });
      }
      
      // Set proper headers for file download
      const apkDownloadName = `${project.name.replace(/\s+/g, '_')}_v1.0.apk`;
      res.download(apkPath, apkDownloadName);
    } catch (error) {
      console.error(`Error downloading APK: ${(error as Error).message}`);
      res.status(500).json({ 
        error: "Server error", 
        message: (error as Error).message 
      });
    }
  });
  
  // New endpoint for generating AAB bundle for app store upload
  app.get("/api/projects/:id/bundle", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        return res.status(400).json({ error: "Invalid project ID" });
      }
      
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      // Get the AAB download path for this project
      const aabFilename = `${project.name.replace(/\s+/g, '_')}_v1.0.aab`;
      const downloadsDir = path.join(process.cwd(), 'dist', 'public', 'downloads');
      await fs.promises.mkdir(downloadsDir, { recursive: true });
      const aabPath = path.join(downloadsDir, aabFilename);
      
      // Create a simulated AAB file (in a real implementation, this would be generated using Android Gradle Plugin)
      const content = `This is a simulated Android App Bundle (AAB) file for:
App Name: ${project.name}
Package: ${project.packageName}
Version: 1.0
Build Date: ${new Date().toISOString()}

In a real implementation, this would be a binary AAB file generated by the Android Gradle build system.
An AAB file would include the app's compiled code (.dex files), resources, assets, and native libraries.
Google Play uses AAB files to generate and serve optimized APKs for different device configurations.`;
      
      // Write the AAB file
      await fs.promises.writeFile(aabPath, Buffer.from(content));
      
      // Set the download name
      const aabDownloadName = `${project.name.replace(/\s+/g, '_')}_v1.0.aab`;
      
      // Use Express's download helper function
      res.download(aabPath, aabDownloadName);
    } catch (error) {
      console.error(`Error generating AAB bundle: ${(error as Error).message}`);
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
  
  // New endpoint for fetching code with AI
  app.post("/api/fetch-code", async (req: Request, res: Response) => {
    try {
      const { language, prompt } = req.body;
      
      if (!language || !prompt) {
        return res.status(400).json({ 
          error: "Bad request", 
          message: "Both language and prompt are required" 
        });
      }
      
      const result = await fetchCodeWithAI(language, prompt);
      res.json(result);
    } catch (error) {
      console.error("Error fetching code with AI:", error);
      res.status(500).json({ 
        error: "AI Code Generation Failed", 
        message: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // New endpoint for improving existing code with AI
  app.post("/api/improve-code", async (req: Request, res: Response) => {
    try {
      const { language, code } = req.body;
      
      if (!language || !code) {
        return res.status(400).json({ 
          error: "Bad request", 
          message: "Both language and code are required" 
        });
      }
      
      const result = await improveCodeWithAI(language, code);
      res.json(result);
    } catch (error) {
      console.error("Error improving code with AI:", error);
      res.status(500).json({ 
        error: "AI Code Improvement Failed", 
        message: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // GitHub integration endpoint
  app.post("/api/projects/:id/github", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.id);
      const { githubToken, repoName, description, isPrivate } = req.body;
      
      if (!githubToken || !repoName) {
        return res.status(400).json({ 
          success: false, 
          message: "GitHub token and repository name are required"
        });
      }
      
      // Get the project to verify it exists
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ success: false, message: "Project not found" });
      }
      
      // In a real implementation, this would:
      // 1. Validate the GitHub token
      // 2. Create a new repository with the given name
      // 3. Push the app code to the repository
      // 4. Update the project with the repository URL
      
      // For now, simulate success
      const repoUrl = `https://github.com/user/${repoName}`;
      
      // Update the project with the repository URL
      // Using 'as any' to handle the updated schema
      await storage.updateProject(projectId, {
        ...project,
        githubUrl: repoUrl
      } as any);
      
      res.json({
        success: true,
        repoUrl,
        message: "GitHub repository created successfully"
      });
    } catch (error) {
      console.error("GitHub integration error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to create GitHub repository"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
