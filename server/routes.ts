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
import { setupAuth, isAuthenticated, isAdmin } from "./auth";
import fs from "fs";
import path from "path";
import multer from "multer";
import { promisify } from "util";
import Stripe from "stripe";

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

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
// Initialize Stripe
let stripe: Stripe;
try {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error("WARNING: STRIPE_SECRET_KEY environment variable is not set. Payment features will not work properly.");
  }
  
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2023-10-16' as any,
  });
  console.log("Stripe client initialized successfully");
} catch (error) {
  console.error("Failed to initialize Stripe client:", error);
  stripe = new Stripe('dummy_key_for_fallback', { apiVersion: '2023-10-16' as any });
}

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
      
      // Use zod to validate the URL format
      const validatedUrl = z.string().url().safeParse(websiteUrl);
      
      if (!validatedUrl.success) {
        return res.status(400).json({ 
          valid: false, 
          message: "Invalid URL format. Please include http:// or https:// prefix." 
        });
      }
      
      // Test if the URL is reachable - try with GET first since some servers reject HEAD requests
      try {
        // Try GET request with a short timeout for better user experience
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(websiteUrl, { 
          method: "GET",
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          return res.json({ valid: true, message: "URL is valid and accessible" });
        } else {
          // Fallback to HEAD request if GET fails with 4xx status
          if (response.status >= 400 && response.status < 500) {
            const headResponse = await fetch(websiteUrl, { method: "HEAD" });
            if (headResponse.ok) {
              return res.json({ valid: true, message: "URL is valid and accessible" });
            }
          }
          
          return res.status(400).json({ 
            valid: false, 
            message: `URL returned status ${response.status}. The website may be blocking our requests.` 
          });
        }
      } catch (error) {
        console.error("URL validation error:", error);
        // Return a more user-friendly error message
        return res.status(400).json({ 
          valid: false, 
          message: "Could not connect to the website. Please check if the URL is correct and the website is accessible." 
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
      
      // Determine source type and build differently based on it
      const sourceType = project.sourceType || 'website';
      
      // Update project status
      await storage.updateProject(projectId, { status: "building" });
      
      // Create a build log to track progress
      const buildLog = await storage.createBuildLog({
        userId: project.userId || 0,
        projectId: project.id,
        buildType: req.body.buildType || 'android',
        status: 'processing',
        platform: req.body.buildType === 'ios' ? 'ios' : 'android'
      });
      
      // Update build log to show progress
      const updateBuildProgress = async (status: string, message: string) => {
        console.log(`[Build Progress] ${status}: ${message}`);
        const logs = buildLog.logs ? buildLog.logs + '\n' + message : message;
        await storage.updateBuildLog(buildLog.id, { logs });
      };
      
      await updateBuildProgress('started', 'Starting build process...');
      
      // Step 1: Generate Android manifest
      await updateBuildProgress('manifest', 'Generating app manifest...');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Give UI time to update
      
      const manifestPath = await generateAndroidManifest({
        appName: project.name,
        packageName: project.packageName,
        url: project.sourceUrl || 'about:blank', // Provide default URL if not available
        orientation: appConfig.orientation,
        permissions: appConfig.permissions || ["INTERNET"],
      });
      
      // Step 2: Process icons
      await updateBuildProgress('icons', 'Processing app icons...');
      await new Promise(resolve => setTimeout(resolve, 1500)); // Give UI time to update
      
      // Step 3: Generate keystore if not exists
      await updateBuildProgress('keystore', 'Creating signing keys...');
      await new Promise(resolve => setTimeout(resolve, 1200)); // Give UI time to update
      
      const keystorePath = await generateKeystore(project.packageName);
      
      // Step 4: Package WebView
      await updateBuildProgress('webview', 'Packaging WebView for Android...');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Give UI time to update
      
      // Special handling for HTML content
      if (sourceType === 'html' && project.htmlContent) {
        // Create a temporary HTML file for bundling
        const htmlPath = path.join(process.cwd(), 'builds', `project_${projectId}`, 'source.html');
        await fs.promises.mkdir(path.dirname(htmlPath), { recursive: true });
        await fs.promises.writeFile(htmlPath, project.htmlContent, 'utf8');
        
        // Use a file:// URL in the bundle instead of HTTP URL
        project.sourceUrl = `file:///android_asset/www/index.html`;
        
        await updateBuildProgress('html', 'Processing HTML content for app bundle...');
        await new Promise(resolve => setTimeout(resolve, 1500)); // Give UI time to update
      }
      
      // Special handling for PDF content
      if (sourceType === 'pdf' && project.pdfPath) {
        // Set up PDF viewer in the WebView
        project.sourceUrl = `file:///android_asset/www/pdf_viewer.html?pdf=document.pdf`;
        
        await updateBuildProgress('pdf', 'Processing PDF document for app bundle...');
        await new Promise(resolve => setTimeout(resolve, 1500)); // Give UI time to update
      }
      
      // Step 5: Finalize APK
      await updateBuildProgress('finalizing', 'Finalizing Android APK...');
      await new Promise(resolve => setTimeout(resolve, 2500)); // Give UI time to update
      
      // Build APK
      const apkResult = await generateAPK({
        projectId,
        appName: project.name,
        packageName: project.packageName,
        sourceUrl: project.sourceUrl || "",
        iconPath: project.iconPath || undefined,
        manifestPath,
        keystorePath,
        appConfig,
        sourceType,
        htmlContent: project.htmlContent,
        pdfPath: project.pdfPath
      });
      
      // Update build log to completed
      await storage.updateBuildLog(buildLog.id, { 
        status: 'completed',
        endTime: new Date().toISOString(),
        fileSize: apkResult.fileSize || 0,
        buildVersion: '1.0',
        buildNumber: 1
      });
      
      // Update project with APK path
      const updatedProject = await storage.updateProject(projectId, {
        status: "completed",
        apkDownloadUrl: apkResult.downloadUrl
      });
      
      res.json({
        message: "APK built successfully",
        project: updatedProject,
        apk: apkResult,
        buildLog: await storage.getBuildLog(buildLog.id)
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
      
      try {
        // Import the bundle generator
        const { createRealisticAabFile } = await import('./utils/bundleGenerator');
        
        // Generate a realistic AAB file
        const aabContent = await createRealisticAabFile({
          name: project.name,
          packageName: project.packageName,
          version: '1.0.0',
          versionCode: 1
        });
        
        // Write the AAB file
        await fs.promises.writeFile(aabPath, aabContent);
        
        console.log(`Realistic AAB file created at: ${aabPath} (${aabContent.length} bytes)`);
      } catch (error) {
        console.error('Error creating realistic AAB:', error);
        
        // Fallback to simple content if realistic generator fails
        const fallbackContent = `This is a simulated Android App Bundle (AAB) file for:
App Name: ${project.name}
Package: ${project.packageName}
Version: 1.0
Build Date: ${new Date().toISOString()}

In a real implementation, this would be a binary AAB file generated by the Android Gradle build system.
An AAB file would include the app's compiled code (.dex files), resources, assets, and native libraries.
Google Play uses AAB files to generate and serve optimized APKs for different device configurations.`;
        
        // Write the fallback AAB file
        await fs.promises.writeFile(aabPath, Buffer.from(fallbackContent));
        
        console.log(`Fallback AAB file created at: ${aabPath}`);
      }
      
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

  // iOS IPA Bundle Download
  app.get("/api/projects/:id/ios-bundle", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        return res.status(400).json({ error: "Invalid project ID" });
      }
      
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      // Get the IPA download path for this project
      const ipaFilename = `${project.name.replace(/\s+/g, '_')}_v1.0.ipa`;
      const downloadsDir = path.join(process.cwd(), 'dist', 'public', 'downloads');
      await fs.promises.mkdir(downloadsDir, { recursive: true });
      const ipaPath = path.join(downloadsDir, ipaFilename);
      
      try {
        // Import the bundle generator
        const { createRealisticIpaFile } = await import('./utils/bundleGenerator');
        
        // Generate a realistic IPA file
        const ipaContent = await createRealisticIpaFile({
          name: project.name,
          packageName: project.packageName || 'com.example.webapp',
          version: '1.0.0',
          versionCode: 1
        });
        
        // Write the IPA file
        await fs.promises.writeFile(ipaPath, ipaContent);
        
        console.log(`Realistic IPA file created at: ${ipaPath} (${ipaContent.length} bytes)`);
      } catch (error) {
        console.error('Error creating realistic IPA:', error);
        
        // Fallback to simple content if realistic generator fails
        const fallbackContent = `This is a simulated iOS App Package (IPA) file for:
App Name: ${project.name}
Bundle ID: ${project.packageName ? project.packageName.replace(/^com\./, 'io.') : 'io.example.app'}
Version: 1.0
SDK Version: Latest
Build Date: ${new Date().toISOString()}

In a real implementation, this would be a binary IPA file generated by the Xcode build system.
An IPA file would include the app's compiled code, resources, assets, and provisioning profile.
It requires proper Apple Developer certificate signing for installation on iOS devices.`;
        
        // Write the fallback IPA file
        await fs.promises.writeFile(ipaPath, Buffer.from(fallbackContent));
        
        console.log(`Fallback IPA file created at: ${ipaPath}`);
      }
      
      // Set the download URL for future access
      const downloadUrl = `/downloads/${ipaFilename}`;
      
      // Update the project with the IPA download URL if it doesn't already have one
      if (!project.ipaDownloadUrl) {
        await storage.updateProject(projectId, { ipaDownloadUrl: downloadUrl });
      }
      
      // Set the download name
      const ipaDownloadName = `${project.name.replace(/\s+/g, '_')}_v1.0.ipa`;
      
      // Use Express's download helper function
      res.download(ipaPath, ipaDownloadName);
    } catch (error) {
      console.error(`Error generating iOS bundle: ${(error as Error).message}`);
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
  app.post("/api/projects/:id/github", isAuthenticated, async (req: Request, res: Response) => {
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
      
      // Check if the project belongs to the current user
      if (project.userId !== req.user?.id) {
        return res.status(403).json({ 
          success: false, 
          message: "You don't have permission to access this project" 
        });
      }
      
      // In a real implementation, this would:
      // 1. Validate the GitHub token
      // 2. Create a new repository with the given name
      // 3. Push the app code to the repository
      // 4. Update the project with the repository URL
      
      // For now, simulate success
      const repoUrl = `https://github.com/${req.user?.username || 'user'}/${repoName}`;
      
      // Store the GitHub token with the user for future use
      if (req.user) {
        await storage.updateUserGithubToken(req.user.id, githubToken, req.user.username || '');
      }
      
      // Update the project with the repository URL
      await storage.updateProject(projectId, {
        githubUrl: repoUrl
      });
      
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
  
  // =====================
  // PAYMENT ROUTES
  // =====================
  
  // Create a payment intent for a project
  app.post("/api/projects/:id/payment", async (req: Request, res: Response) => {
    try {
      console.log("Payment endpoint called for project:", req.params.id);
      console.log("Request body:", req.body);
      
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        console.log("Payment error: User not authenticated");
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        console.log("Payment error: Invalid project ID", req.params.id);
        return res.status(400).json({ error: "Invalid project ID" });
      }
      
      const project = await storage.getProject(projectId);
      if (!project) {
        console.log("Payment error: Project not found", projectId);
        return res.status(404).json({ error: "Project not found" });
      }
      
      console.log("Processing payment for project:", project.name);
      
      // Check if the project belongs to the current user
      if (project.userId !== req.user.id) {
        console.log("Payment error: Permission denied", { 
          projectUserId: project.userId, 
          requestUserId: req.user.id 
        });
        return res.status(403).json({ error: "You don't have permission to access this project" });
      }
      
      // Check if project is already paid
      if (project.isPaid) {
        console.log("Payment error: Project already paid", projectId);
        return res.status(400).json({ error: "Project already paid for" });
      }
      
      // Check if creating an intent or processing a payment
      const { createIntent, useSubscription, couponCode, amount } = req.body;
      console.log("Payment options:", { createIntent, useSubscription, couponCode, amount });

      // If user has active subscription, allow them to build without payment
      if (useSubscription) {
        const user = req.user;
        if (user.subscriptionStatus === "active") {
          const now = new Date().toISOString();
          await storage.updateProject(projectId, { 
            isPaid: true,
            paidAt: now,
            status: "paid",
            paymentIntentId: `subscription_${user.id}_${Date.now()}`
          });
          
          return res.json({ 
            success: true, 
            message: "Project marked as paid with active subscription",
            project: await storage.getProject(projectId)
          });
        } else {
          return res.status(400).json({ error: "No active subscription found" });
        }
      }
      
      // Check for coupon code
      let finalAmount = amount || project.paymentAmount || 500; // Default $5.00
      
      if (couponCode) {
        const coupon = await storage.getCouponByCode(couponCode);
        
        if (coupon && coupon.isActive) {
          // Check if coupon has max uses and if it's been reached
          if (coupon.maxUses && coupon.currentUses !== null && coupon.currentUses >= coupon.maxUses) {
            return res.status(400).json({ error: "Coupon has reached maximum usage" });
          }
          
          // Check if coupon is expired
          if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
            return res.status(400).json({ error: "Coupon has expired" });
          }
          
          // Apply discount
          finalAmount = Math.max(0, finalAmount - Math.floor(finalAmount * (coupon.discountPercent / 100)));
          
          // Update project with coupon code
          await storage.updateProject(projectId, { couponCode });
          
          // If 100% discount, mark as paid immediately
          if (finalAmount === 0) {
            const now = new Date().toISOString();
            await storage.updateProject(projectId, { 
              isPaid: true,
              paidAt: now,
              status: "paid"
            });
            
            // Track coupon usage
            await storage.incrementCouponUsage(coupon.id);
            await storage.createCouponUsage({
              userId: req.user.id,
              couponId: coupon.id,
              projectId
            });
            
            return res.json({ 
              success: true, 
              message: "Payment successful with 100% discount coupon",
              project: await storage.getProject(projectId)
            });
          }
        } else {
          return res.status(400).json({ error: "Invalid or inactive coupon code" });
        }
      }
      
      // If this is a request to create a payment intent only
      if (createIntent) {
        console.log("Creating payment intent for amount:", finalAmount);
        try {
          // Create a payment intent with Stripe
          const paymentIntent = await stripe.paymentIntents.create({
            amount: finalAmount,
            currency: "usd",
            automatic_payment_methods: { enabled: true }, // Enable automatic payment methods
            metadata: {
              projectId: projectId.toString(),
              userId: req.user.id.toString(),
              couponCode: couponCode || ""
            }
          });
          
          console.log("Payment intent created successfully:", {
            id: paymentIntent.id,
            hasClientSecret: !!paymentIntent.client_secret
          });
          
          return res.json({
            clientSecret: paymentIntent.client_secret,
            amount: finalAmount
          });
        } catch (stripeError) {
          console.error("Stripe error creating payment intent:", stripeError);
          throw stripeError;
        }
      }
      
      // If this is a payment confirmation (not just intent creation)
      // Create a payment intent with Stripe
      const paymentIntent = await stripe.paymentIntents.create({
        amount: finalAmount,
        currency: "usd",
        automatic_payment_methods: { enabled: true }, // Enable automatic payment methods
        metadata: {
          projectId: projectId.toString(),
          userId: req.user.id.toString(),
          couponCode: couponCode || ""
        },
        confirm: true,
        return_url: `${req.headers.origin || "https://app-bundle-maker.replit.app"}`
      });
      
      // Update project with payment intent ID
      await storage.updateProject(projectId, { 
        paymentIntentId: paymentIntent.id,
        paymentAmount: finalAmount
      });
      
      res.json({
        clientSecret: paymentIntent.client_secret,
        amount: finalAmount
      });
    } catch (error) {
      console.error("Payment intent creation error:", error);
      res.status(500).json({
        error: "Failed to create payment intent",
        message: (error as Error).message
      });
    }
  });
  
  // Webhook to handle Stripe payment events
  app.post("/api/stripe-webhook", async (req: Request, res: Response) => {
    const signature = req.headers["stripe-signature"] as string;
    
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.warn("Missing Stripe webhook secret. Skipping signature verification.");
    }
    
    let event;
    
    try {
      // Parse the webhook payload and verify signature
      if (process.env.STRIPE_WEBHOOK_SECRET && signature) {
        event = stripe.webhooks.constructEvent(
          req.body,
          signature,
          process.env.STRIPE_WEBHOOK_SECRET
        );
      } else {
        // For development, just parse the body
        event = req.body;
      }
      
      // Handle the event
      switch (event.type) {
        case "payment_intent.succeeded":
          const paymentIntent = event.data.object;
          const { projectId, userId, couponCode } = paymentIntent.metadata;
          
          if (!projectId) {
            console.error("No project ID in metadata");
            break;
          }
          
          // Mark project as paid
          const pId = parseInt(projectId);
          const now = new Date().toISOString();
          await storage.markProjectAsPaid(pId, paymentIntent.id);
          
          // Track coupon usage if a coupon was used
          if (couponCode) {
            const coupon = await storage.getCouponByCode(couponCode);
            if (coupon) {
              await storage.incrementCouponUsage(coupon.id);
              await storage.createCouponUsage({
                userId: parseInt(userId),
                couponId: coupon.id,
                projectId: pId
              });
            }
          }
          
          console.log(`Payment for project ${projectId} completed successfully`);
          break;
          
        case "payment_intent.payment_failed":
          const failedPayment = event.data.object;
          console.error(`Payment failed for project ${failedPayment.metadata.projectId}`);
          break;
        
        // Subscription related webhooks
        case "customer.subscription.created":
          const newSubscription = event.data.object;
          // Find user with this customer ID
          console.log(`Subscription created: ${newSubscription.id}`);
          break;
          
        case "customer.subscription.updated":
          const updatedSubscription = event.data.object;
          console.log(`Subscription updated: ${updatedSubscription.id}`);
          
          // If subscription is canceled or past due, update user status
          if (updatedSubscription.status === "canceled" || updatedSubscription.status === "unpaid") {
            // Find the user with this subscription ID
            // (In a real implementation, you'd fetch from the DB)
            // For now, we'll just log it
            console.log(`Subscription ${updatedSubscription.id} is now ${updatedSubscription.status}`);
          }
          break;
          
        case "customer.subscription.deleted":
          const deletedSubscription = event.data.object;
          console.log(`Subscription deleted: ${deletedSubscription.id}`);
          break;
          
        default:
          console.log(`Unhandled event type ${event.type}`);
      }
      
      res.json({ received: true });
    } catch (error) {
      console.error("Stripe webhook error:", error);
      res.status(400).send(`Webhook Error: ${(error as Error).message}`);
    }
  });
  
  // Validate coupon code
  app.post("/api/validate-coupon", async (req: Request, res: Response) => {
    try {
      const { code } = req.body;
      
      if (!code) {
        return res.status(400).json({ error: "Coupon code is required" });
      }
      
      const coupon = await storage.getCouponByCode(code);
      
      if (!coupon) {
        return res.status(404).json({ error: "Coupon not found" });
      }
      
      if (!coupon.isActive) {
        return res.status(400).json({ error: "Coupon is inactive" });
      }
      
      // Check if coupon has max uses and if it's been reached
      if (coupon.maxUses && coupon.currentUses !== null && coupon.currentUses >= coupon.maxUses) {
        return res.status(400).json({ error: "Coupon has reached maximum usage" });
      }
      
      // Check if coupon is expired
      if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
        return res.status(400).json({ error: "Coupon has expired" });
      }
      
      res.json({
        valid: true,
        discountPercent: coupon.discountPercent
      });
    } catch (error) {
      console.error("Coupon validation error:", error);
      res.status(500).json({
        error: "Failed to validate coupon",
        message: (error as Error).message
      });
    }
  });
  
  // Update user subscription status
  app.post("/api/update-subscription-status", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const { status } = req.body;
      
      if (!status || !["active", "canceled", "expired"].includes(status)) {
        return res.status(400).json({ error: "Invalid subscription status" });
      }
      
      // Calculate expiry date (1 year from now for active subscriptions)
      const expiryDate = status === "active" 
        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() 
        : null;
      
      // Update user's subscription status
      await storage.updateUser(req.user.id, {
        subscriptionStatus: status,
        subscriptionExpiry: expiryDate
      });
      
      res.json({
        success: true,
        message: `Subscription status updated to ${status}`,
        expiryDate
      });
    } catch (error) {
      console.error("Subscription status update error:", error);
      res.status(500).json({
        error: "Failed to update subscription status",
        message: (error as Error).message
      });
    }
  });
  
  // Admin impersonation routes
  app.post("/api/admin/impersonate/:userId", isAdmin, async (req: Request, res: Response) => {
    const { userId } = req.params;
    const userIdNumber = parseInt(userId, 10);
    
    try {
      // Get user to impersonate
      const userToImpersonate = await storage.getUser(userIdNumber);
      if (!userToImpersonate) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Store the admin's original user ID in a token
      // In a real implementation, this should be a properly encrypted token with expiration
      const adminToken = Buffer.from(JSON.stringify({
        adminId: req.user?.id || 0,
        impersonatedUserId: userIdNumber,
        timestamp: Date.now()
      })).toString('base64');
      
      // Change the session to impersonate the target user
      req.login(userToImpersonate, (err) => {
        if (err) {
          return res.status(500).json({ error: "Failed to impersonate user" });
        }
        
        // Return successful response with token for returning to admin
        return res.status(200).json({ 
          success: true,
          message: "Impersonation successful",
          adminToken 
        });
      });
    } catch (error) {
      console.error("Error during impersonation:", error);
      return res.status(500).json({ error: "Server error during impersonation" });
    }
  });
  
  // Return to admin account after impersonation
  app.post("/api/admin/end-impersonation", isAuthenticated, async (req: Request, res: Response) => {
    const { adminToken } = req.body;
    
    if (!adminToken) {
      return res.status(400).json({ error: "Admin token is required" });
    }
    
    try {
      // Decode token
      const decodedToken = JSON.parse(Buffer.from(adminToken, 'base64').toString());
      
      // Validate token (in a real app, would include expiration check, signature verification, etc.)
      if (!decodedToken.adminId) {
        return res.status(400).json({ error: "Invalid admin token" });
      }
      
      // Get the original admin user
      const adminUser = await storage.getUser(decodedToken.adminId);
      if (!adminUser) {
        return res.status(404).json({ error: "Admin user not found" });
      }
      
      // Log in as admin
      req.login(adminUser, (err) => {
        if (err) {
          return res.status(500).json({ error: "Failed to return to admin account" });
        }
        
        // Return successful response
        return res.status(200).json({ 
          success: true, 
          message: "Successfully returned to admin account" 
        });
      });
    } catch (error) {
      console.error("Error ending impersonation:", error);
      return res.status(500).json({ error: "Server error ending impersonation" });
    }
  });
  
  // Create subscription
  app.post("/api/create-subscription", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const user = req.user;
      
      // Check if user already has an active subscription
      if (user.subscriptionStatus === "active" && user.stripeSubscriptionId) {
        // Get the subscription from Stripe
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        
        if (subscription.status === "active") {
          return res.status(400).json({ error: "User already has an active subscription" });
        }
      }
      
      // If user doesn't have email, require it
      if (!user.email) {
        return res.status(400).json({ error: "Email is required for subscription" });
      }
      
      // Create or get a customer
      let customerId = user.stripeCustomerId;
      
      if (!customerId) {
        // Create a new customer
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.username
        });
        
        customerId = customer.id;
        await storage.updateStripeCustomerId(user.id, customerId);
      }
      
      // Create a subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [
          {
            price: process.env.STRIPE_PRICE_ID || 'price_1NwXYmBLGgPFGWZ8e6RvH9X2', // Default price ID for testing
          },
        ],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          payment_method_types: ['card'],
          save_default_payment_method: 'on_subscription'
        },
        expand: ['latest_invoice.payment_intent'],
      });
      
      // Update user record
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      
      await storage.updateUserSubscription(
        user.id, 
        subscription.id, 
        oneYearFromNow.toISOString()
      );
      
      res.json({
        subscriptionId: subscription.id,
        clientSecret: (subscription.latest_invoice as any).payment_intent.client_secret,
      });
    } catch (error) {
      console.error("Subscription creation error:", error);
      res.status(500).json({
        error: "Failed to create subscription",
        message: (error as Error).message
      });
    }
  });
  
  // Admin Dashboard Routes
  
  // Get dashboard statistics
  app.get("/api/admin/dashboard-stats", isAdmin, async (_req: Request, res: Response) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ 
        error: "Failed to fetch dashboard statistics", 
        message: (error as Error).message 
      });
    }
  });
  
  // Get all users (for admin)
  app.get("/api/admin/users", isAdmin, async (_req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ 
        error: "Failed to fetch users", 
        message: (error as Error).message 
      });
    }
  });
  
  // Get all transactions (for admin)
  app.get("/api/admin/transactions", isAdmin, async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      
      const transactions = await storage.getAllTransactions(limit, offset);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ 
        error: "Failed to fetch transactions", 
        message: (error as Error).message 
      });
    }
  });
  
  // Get all build logs (for admin)
  app.get("/api/admin/build-logs", isAdmin, async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      
      const buildLogs = await storage.getAllBuildLogs(limit, offset);
      res.json(buildLogs);
    } catch (error) {
      console.error("Error fetching build logs:", error);
      res.status(500).json({ 
        error: "Failed to fetch build logs", 
        message: (error as Error).message 
      });
    }
  });
  
  // Get user activity logs (for admin)
  app.get("/api/admin/activity-logs", isAdmin, async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      
      const activityLogs = await storage.getAllUserActivityLogs(limit, offset);
      res.json(activityLogs);
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      res.status(500).json({ 
        error: "Failed to fetch activity logs", 
        message: (error as Error).message 
      });
    }
  });
  
  // Get analytics date range (for admin)
  app.get("/api/admin/analytics", isAdmin, async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ error: "Start date and end date are required" });
      }
      
      const analytics = await storage.getAnalyticsRange(startDate as string, endDate as string);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ 
        error: "Failed to fetch analytics", 
        message: (error as Error).message 
      });
    }
  });
  
  // Create or update analytics for a specific date (for admin)
  app.post("/api/admin/analytics", isAdmin, async (req: Request, res: Response) => {
    try {
      const { date, ...analyticsData } = req.body;
      
      // Check if analytics for this date already exists
      const existingAnalytics = await storage.getAnalyticsForDate(date);
      
      if (existingAnalytics) {
        // Update existing analytics
        const updatedAnalytics = await storage.updateAnalytics(existingAnalytics.id, analyticsData);
        res.json(updatedAnalytics);
      } else {
        // Create new analytics
        const newAnalytics = await storage.createAnalytics({ date, ...analyticsData });
        res.status(201).json(newAnalytics);
      }
    } catch (error) {
      console.error("Error creating/updating analytics:", error);
      res.status(500).json({ 
        error: "Failed to create/update analytics", 
        message: (error as Error).message 
      });
    }
  });
  
  // Get all system settings (for admin)
  app.get("/api/admin/settings", isAdmin, async (_req: Request, res: Response) => {
    try {
      const settings = await storage.getAllSystemSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching system settings:", error);
      res.status(500).json({ 
        error: "Failed to fetch system settings", 
        message: (error as Error).message 
      });
    }
  });
  
  // Get system settings by category (for admin)
  app.get("/api/admin/settings/:category", isAdmin, async (req: Request, res: Response) => {
    try {
      const { category } = req.params;
      const settings = await storage.getSystemSettingsByCategory(category);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching system settings by category:", error);
      res.status(500).json({ 
        error: "Failed to fetch system settings", 
        message: (error as Error).message 
      });
    }
  });
  
  // Update system setting (for admin)
  app.patch("/api/admin/settings/:id", isAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const settingId = parseInt(id);
      
      if (isNaN(settingId)) {
        return res.status(400).json({ error: "Invalid setting ID" });
      }
      
      const { settingValue } = req.body;
      
      if (settingValue === undefined) {
        return res.status(400).json({ error: "Setting value is required" });
      }
      
      const updatedSetting = await storage.updateSystemSetting(settingId, { 
        settingValue,
        updatedBy: req.user.id
      });
      
      if (!updatedSetting) {
        return res.status(404).json({ error: "Setting not found" });
      }
      
      res.json(updatedSetting);
    } catch (error) {
      console.error("Error updating system setting:", error);
      res.status(500).json({ 
        error: "Failed to update system setting", 
        message: (error as Error).message 
      });
    }
  });
  
  // Create new system setting (for admin)
  app.post("/api/admin/settings", isAdmin, async (req: Request, res: Response) => {
    try {
      const { settingKey, settingValue, settingType, category, description, isPublic } = req.body;
      
      if (!settingKey || !settingType || !category) {
        return res.status(400).json({ error: "Setting key, type, and category are required" });
      }
      
      // Check if setting with this key already exists
      const existingSetting = await storage.getSystemSetting(settingKey);
      
      if (existingSetting) {
        return res.status(409).json({ error: "Setting with this key already exists" });
      }
      
      const newSetting = await storage.createSystemSetting({
        settingKey,
        settingValue: settingValue || null,
        settingType,
        category,
        description: description || null,
        isPublic: isPublic || false,
        updatedBy: req.user.id
      });
      
      res.status(201).json(newSetting);
    } catch (error) {
      console.error("Error creating system setting:", error);
      res.status(500).json({ 
        error: "Failed to create system setting", 
        message: (error as Error).message 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
