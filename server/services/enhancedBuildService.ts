/**
 * Enhanced Build Service that incorporates validation, retry, and caching
 * for improved reliability and performance.
 */

import { validateBuildConfig, validateBuildResources, type BuildConfig, type BuildValidation } from '../utils/buildValidator';
import { RetryManager } from '../utils/retryManager';
import { BuildCacheService } from '../utils/cacheService';
import { generateAPK } from './apkGenerator';
import { generateSafeAPK } from './safeApkGenerator';
import { generateAndroidManifest } from '../utils/manifestGenerator';
import { generateKeystore } from '../utils/keystoreGenerator';
import { Keystore } from '../types';
import * as fs from 'fs';
import * as path from 'path';
import { storage } from '../storage';

// Define build result interface
export interface BuildResult {
  success: boolean;
  apkPath?: string;
  downloadUrl?: string;
  error?: string;
  fileSize?: number;
  buildTime?: number;
  buildId: string;
}

export class EnhancedBuildService {
  private retryManager: RetryManager;
  private cacheService: BuildCacheService;
  private static instance: EnhancedBuildService;
  
  /**
   * Creates a new build service instance or returns existing one (singleton)
   */
  constructor() {
    if (EnhancedBuildService.instance) {
      return EnhancedBuildService.instance;
    }
    
    this.retryManager = new RetryManager(3, 5000);
    this.cacheService = new BuildCacheService();
    EnhancedBuildService.instance = this;
  }
  
  /**
   * Validates a build configuration before starting the build process
   * 
   * @param config Build configuration
   * @returns Validation result
   */
  async validateBuild(config: BuildConfig): Promise<BuildValidation> {
    // First, validate the format
    const formatValidation = validateBuildConfig(config);
    
    if (!formatValidation.isValid) {
      return formatValidation;
    }
    
    // Only if format validation passes, check resources
    return await validateBuildResources(config);
  }
  
  /**
   * Builds an Android APK with retry logic and validation
   * 
   * @param projectId Project ID
   * @param config Build configuration
   * @returns Build result
   */
  async buildApk(projectId: number, config: BuildConfig): Promise<BuildResult> {
    // Generate a unique build ID
    const buildId = `build_${projectId}_${Date.now()}`;
    
    // Check cache first if we have a recent build that matches the config
    const cacheKey = `apk_${projectId}_${JSON.stringify(config)}`;
    const cachedResult = this.cacheService.get<BuildResult>(cacheKey);
    
    if (cachedResult) {
      console.log(`Found cached build result for project ${projectId}`);
      return cachedResult;
    }
    
    try {
      // Validate the build first
      const validation = await this.validateBuild(config);
      
      if (!validation.isValid) {
        throw new Error(`Build validation failed: ${validation.errors.join(', ')}`);
      }
      
      // Start the build process with retry logic
      const result = await this.retryManager.executeWithRetry<BuildResult>(
        async () => {
          const startTime = Date.now();
          
          // Log the build start
          console.log(`Starting build for project ${projectId} (Build ID: ${buildId})`);
          
          // Generate Android manifest
          const manifestPath = await generateAndroidManifest({
            appName: config.appName,
            packageName: config.packageName,
            url: config.url || 'about:blank',
            orientation: config.orientation || 'portrait',
            permissions: config.permissions || ['INTERNET'],
          });
          
          // Generate keystore
          const keystorePath = await generateKeystore(config.packageName);
          
          // Create directory for builds
          const buildsDir = path.join(process.cwd(), 'builds', `project_${projectId}`);
          await fs.promises.mkdir(buildsDir, { recursive: true });
          
          // Generate safe APK
          const apkResult = await generateSafeAPK({
            projectId,
            appName: config.appName,
            packageName: config.packageName,
            sourceUrl: config.url,
            iconPath: config.iconPath,
            manifestPath,
            keystorePath,
            appConfig: config,
            sourceType: config.sourceType || 'website'
          });
          
          if (apkResult.success) {
            // Prepare result
            const buildTime = Date.now() - startTime;
            const result: BuildResult = {
              success: true,
              apkPath: apkResult.apkPath,
              downloadUrl: apkResult.downloadUrl,
              fileSize: apkResult.fileSize,
              buildTime,
              buildId
            };
            
            // Cache the successful result
            this.cacheService.set(cacheKey, result, 3600000); // Cache for 1 hour
            
            return result;
          } else {
            throw new Error(apkResult.error || 'Unknown error during APK generation');
          }
        },
        (attempt, error) => {
          console.log(`Build ${buildId} failed. Attempt ${attempt}/3. Error: ${error.message}`);
          
          // Update build log in database if available
          if (projectId) {
            this.updateBuildLog(projectId, buildId, `Retry attempt ${attempt}/3: ${error.message}`);
          }
        }
      );
      
      return result;
    } catch (error) {
      // Log and return error
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Build ${buildId} failed: ${errorMessage}`);
      
      return {
        success: false,
        error: errorMessage,
        buildId
      };
    }
  }
  
  /**
   * Invalidates the build cache for a specific project
   * 
   * @param projectId Project ID
   */
  invalidateBuildCache(projectId: number): void {
    // Find all cache keys that match this project
    const keysToDelete: string[] = [];
    
    const cachePrefix = `apk_${projectId}_`;
    
    // Iterate through all cache entries and remove those for this project
    // (In a real implementation we would have a more efficient way to do this)
    
    console.log(`Invalidating build cache for project ${projectId}`);
    
    // Delete all cache entries for this project
    this.cacheService.delete(cachePrefix);
  }
  
  /**
   * Updates the build log in the database
   * 
   * @param projectId Project ID
   * @param buildId Build ID
   * @param message Log message
   */
  private async updateBuildLog(projectId: number, buildId: string, message: string): Promise<void> {
    try {
      // Find existing build log
      const buildLogs = await storage.getBuildLogsByProjectId(projectId);
      const buildLog = buildLogs.find(log => log.externalBuildId === buildId);
      
      if (buildLog) {
        // Append message to existing log
        const updatedLogs = buildLog.logs ? `${buildLog.logs}\n${message}` : message;
        await storage.updateBuildLog(buildLog.id, { logs: updatedLogs });
      } else {
        // Create new build log
        await storage.createBuildLog({
          projectId,
          userId: 0, // Will be updated with actual user ID
          buildType: 'android',
          status: 'processing',
          platform: 'android',
          logs: message,
          externalBuildId: buildId
        });
      }
    } catch (error) {
      console.error(`Failed to update build log: ${error}`);
    }
  }
}