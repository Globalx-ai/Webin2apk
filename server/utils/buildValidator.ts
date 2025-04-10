/**
 * Build validation utilities for ensuring build configurations are valid
 * before starting the build process.
 */

import axios from 'axios';
import { URL } from 'url';

export interface BuildConfig {
  appName: string;
  packageName: string;
  url?: string;
  orientation?: string;
  permissions?: string[];
  sourceType?: 'website' | 'html' | 'pdf';
  iconPath?: string;
  htmlContent?: string;
  pdfPath?: string;
  enableJavaScript?: boolean;
  enableZoom?: boolean;
  [key: string]: any;
}

export interface BuildValidation {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates a build configuration to ensure all required fields are present
 * and correctly formatted.
 * 
 * @param config The build configuration to validate
 * @returns BuildValidation result with validation status and errors
 */
export const validateBuildConfig = (config: BuildConfig): BuildValidation => {
  const errors: string[] = [];
  
  // Check required fields
  if (!config.appName) {
    errors.push('App name is required');
  } else if (config.appName.length < 3) {
    errors.push('App name must be at least 3 characters long');
  } else if (config.appName.length > 30) {
    errors.push('App name must be less than 30 characters long');
  }
  
  if (!config.packageName) {
    errors.push('Package name is required');
  } else {
    // Validate package name format (e.g., com.example.app)
    const packageNameRegex = /^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+[0-9a-z_]$/i;
    if (!packageNameRegex.test(config.packageName)) {
      errors.push('Package name must be in the format "com.example.app"');
    }
  }
  
  // Validate URL format for website type
  if (config.sourceType === 'website' && config.url) {
    try {
      new URL(config.url);
    } catch (error) {
      errors.push('Invalid URL format');
    }
  }
  
  // Validate orientation if provided
  if (config.orientation && !['portrait', 'landscape', 'auto'].includes(config.orientation)) {
    errors.push('Orientation must be "portrait", "landscape", or "auto"');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Advanced validation for checking resource availability
 * (e.g. testing if website is reachable)
 */
export const validateBuildResources = async (config: BuildConfig): Promise<BuildValidation> => {
  const errors: string[] = [];
  
  // Only check URL accessibility if it's a website source type
  if (config.sourceType === 'website' && config.url) {
    try {
      // Use a HEAD request to check if the URL is reachable
      await axios.head(config.url, { 
        timeout: 5000,
        validateStatus: (status: number) => status < 500 // Accept any status < 500 as valid
      });
    } catch (error) {
      errors.push(`Website URL is not accessible: ${config.url}`);
    }
  }
  
  // For HTML content, validate that it has basic HTML structure
  if (config.sourceType === 'html' && config.htmlContent) {
    const htmlContent = config.htmlContent.toLowerCase();
    if (!htmlContent.includes('<html') || !htmlContent.includes('</html>')) {
      errors.push('HTML content is missing proper HTML structure');
    }
  }
  
  // For PDF content, validate that PDF path exists
  if (config.sourceType === 'pdf' && config.pdfPath) {
    // This would normally check if the file exists, but we'll skip for now
    // as file system access depends on the environment
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};