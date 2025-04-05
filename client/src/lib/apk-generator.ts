import { apiRequest } from "./queryClient";

/**
 * Client-side utility functions for APK generation and management
 * Includes functionality for AI-powered features like code validation and HTML optimization
 */

/**
 * Tests if a website URL is valid and accessible
 * 
 * @param url The URL to test
 * @returns Promise resolving to a validation result
 */
export async function validateWebsiteUrl(url: string): Promise<{ 
  valid: boolean; 
  message: string; 
}> {
  try {
    const response = await apiRequest("POST", "/api/validate-url", { websiteUrl: url });
    return await response.json();
  } catch (error) {
    return { 
      valid: false, 
      message: (error as Error).message || "Failed to validate URL" 
    };
  }
}

/**
 * Starts the APK building process for a project
 * 
 * @param projectId The project ID to build
 * @returns Promise resolving to build result
 */
export async function buildApk(projectId: number): Promise<{
  success: boolean;
  message: string;
  downloadUrl?: string;
}> {
  try {
    const response = await apiRequest("POST", `/api/projects/${projectId}/build`, undefined);
    const result = await response.json();
    
    return {
      success: true,
      message: result.message || "APK built successfully",
      downloadUrl: result.project.apkDownloadUrl
    };
  } catch (error) {
    return {
      success: false,
      message: (error as Error).message || "Failed to build APK"
    };
  }
}

/**
 * Uploads an app icon for a project
 * 
 * @param projectId The project ID
 * @param iconFile The icon file to upload
 * @returns Promise resolving to upload result
 */
export async function uploadAppIcon(projectId: number, iconFile: File): Promise<{
  success: boolean;
  message: string;
  iconPath?: string;
}> {
  try {
    const formData = new FormData();
    formData.append("icon", iconFile);
    
    // Manual fetch since our apiRequest doesn't support FormData
    const response = await fetch(`/api/projects/${projectId}/icon`, {
      method: "POST",
      body: formData,
      credentials: "include"
    });
    
    if (!response.ok) {
      throw new Error(`Failed to upload icon: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    return {
      success: true,
      message: result.message || "Icon uploaded successfully",
      iconPath: result.project.iconPath
    };
  } catch (error) {
    return {
      success: false,
      message: (error as Error).message || "Failed to upload icon"
    };
  }
}

/**
 * Gets the download URL for a generated APK
 * 
 * @param projectId The project ID
 * @returns The APK download URL
 */
export function getApkDownloadUrl(projectId: number): string {
  return `/api/projects/${projectId}/download`;
}

/**
 * Formats a package name from an app name
 * 
 * @param appName The app name to convert
 * @returns A suggested package name
 */
export function suggestPackageName(appName: string): string {
  // Remove non-alphanumeric characters
  const cleanName = appName.replace(/[^a-zA-Z0-9 ]/g, "");
  
  // Convert to lowercase and replace spaces with underscores
  const formattedName = cleanName.toLowerCase().replace(/\s+/g, "_");
  
  // Create a basic package name
  return `com.appbundlemaker.${formattedName}`;
}

/**
 * Estimates the APK size based on whether icons and other resources are included
 * 
 * @param hasCustomIcons Whether custom icons are included
 * @param hasAds Whether ads are enabled
 * @returns Estimated APK size in MB
 */
export function estimateApkSize(hasCustomIcons: boolean, hasAds: boolean): number {
  // Base APK size for a WebView app
  let size = 3.5;
  
  // Custom icons add some size
  if (hasCustomIcons) {
    size += 0.3;
  }
  
  // Ad libraries add significant size
  if (hasAds) {
    size += 1.2;
  }
  
  return size;
}

/**
 * Validates custom code using AI
 * 
 * @param language Programming language (java, kotlin, javascript)
 * @param content Code content to validate
 * @param projectId Project ID
 * @returns Validation result with issues and suggestions
 */
export async function validateCustomCode(
  language: string,
  content: string,
  projectId: number
): Promise<{
  success: boolean;
  isValid?: boolean;
  issues?: Array<{
    severity: 'error' | 'warning' | 'info';
    message: string;
    line?: number;
    column?: number;
  }>;
  suggestions?: Array<{
    type: 'fix' | 'improvement';
    description: string;
    code?: string;
  }>;
  fixedCode?: string;
  error?: string;
}> {
  try {
    const response = await apiRequest("POST", "/api/validate-code", {
      language,
      content,
      projectId
    });
    
    return await response.json();
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message || "Failed to validate code"
    };
  }
}

/**
 * Auto-completes code using AI
 * 
 * @param language Programming language
 * @param partialCode Partial code to complete
 * @param context Additional context about code purpose
 * @returns Completed code with explanation
 */
export async function completeCode(
  language: string,
  partialCode: string,
  context: string
): Promise<{
  success: boolean;
  completedCode?: string;
  explanation?: string;
  error?: string;
}> {
  try {
    const response = await apiRequest("POST", "/api/complete-code", {
      language,
      partialCode,
      context
    });
    
    return await response.json();
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message || "Failed to generate code"
    };
  }
}

/**
 * Optimizes HTML content for mobile viewing
 * 
 * @param htmlContent Raw HTML content
 * @returns Optimized HTML with responsive design
 */
export async function optimizeHtml(htmlContent: string): Promise<{
  success: boolean;
  optimizedHtml?: string;
  error?: string;
}> {
  try {
    const response = await apiRequest("POST", "/api/optimize-html", {
      htmlContent
    });
    
    return await response.json();
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message || "Failed to optimize HTML"
    };
  }
}

/**
 * Uploads and analyzes a PDF for app conversion
 * 
 * @param pdfFile The PDF file
 * @returns Analysis of PDF structure
 */
export async function analyzePdf(pdfFile: File): Promise<{
  success: boolean;
  analysis?: string;
  filePath?: string;
  error?: string;
}> {
  try {
    const formData = new FormData();
    formData.append("pdfFile", pdfFile);
    
    // Manual fetch since our apiRequest doesn't support FormData
    const response = await fetch("/api/analyze-pdf", {
      method: "POST",
      body: formData,
      credentials: "include"
    });
    
    if (!response.ok) {
      throw new Error(`Failed to analyze PDF: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message || "Failed to analyze PDF"
    };
  }
}
