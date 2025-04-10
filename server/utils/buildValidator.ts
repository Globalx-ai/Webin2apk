/**
 * Build validation utilities for ensuring build configurations are valid
 * before starting the build process.
 */

export interface BuildConfig {
  url?: string;
  appName: string;
  packageName: string;
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
  
  // Website URL validation - only if it's provided
  if (config.url && !config.url.match(/^https?:\/\/.+/)) {
    errors.push('Invalid website URL format');
  }

  // App name validation
  if (!config.appName || config.appName.length < 3) {
    errors.push('App name must be at least 3 characters');
  }

  // Package name validation
  if (!config.packageName.match(/^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+[0-9a-z_]$/)) {
    errors.push('Invalid package name format');
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
  
  // Check if website URL is reachable
  if (config.url) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(config.url, { 
        method: "HEAD",
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        errors.push(`Website URL returned status ${response.status}`);
      }
    } catch (error) {
      errors.push('Website URL is not reachable');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};