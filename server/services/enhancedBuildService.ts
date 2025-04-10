/**
 * Enhanced Build Service that incorporates validation, retry, and caching
 * for improved reliability and performance.
 */

import { validateBuildConfig, validateBuildResources, type BuildConfig, type BuildValidation } from '../utils/buildValidator';
import { RetryManager } from '../utils/retryManager';
import { BuildCacheService } from '../utils/cacheService';
import * as fs from 'fs';
import * as path from 'path';

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
  private retryManager = new RetryManager(3, 5000);
  private cacheService = new BuildCacheService();
  private static instance: EnhancedBuildService;
  
  /**
   * Creates a new build service instance or returns existing one (singleton)
   */
  constructor() {
    if (EnhancedBuildService.instance) {
      return EnhancedBuildService.instance;
    }
    
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
   * Returns whether a build is in the cache
   * 
   * @param projectId Project ID 
   * @param config Build configuration
   * @returns true if the build is in the cache
   */
  hasCachedBuild(projectId: number, config: BuildConfig): boolean {
    const cacheKey = `apk_${projectId}_${JSON.stringify(config)}`;
    return this.cacheService.has(cacheKey);
  }
  
  /**
   * Gets a cached build result if available
   * 
   * @param projectId Project ID
   * @param config Build configuration
   * @returns The cached build result or null if not found
   */
  getCachedBuild(projectId: number, config: BuildConfig): BuildResult | null {
    const cacheKey = `apk_${projectId}_${JSON.stringify(config)}`;
    return this.cacheService.get<BuildResult>(cacheKey);
  }
  
  /**
   * Caches a successful build result
   * 
   * @param projectId Project ID
   * @param config Build configuration
   * @param result Build result to cache
   */
  cacheBuildResult(projectId: number, config: BuildConfig, result: BuildResult): void {
    const cacheKey = `apk_${projectId}_${JSON.stringify(config)}`;
    this.cacheService.set(cacheKey, result, 3600000); // Cache for 1 hour
  }
  
  /**
   * Execute an operation with retry logic
   * 
   * @param operation The operation to execute
   * @param onRetry Optional callback that is invoked before each retry
   * @returns The result of the operation
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    onRetry?: (attempt: number, error: Error) => void
  ): Promise<T> {
    return this.retryManager.executeWithRetry(operation, onRetry);
  }
  
  /**
   * Invalidates the build cache for a specific project
   * 
   * @param projectId Project ID
   */
  invalidateBuildCache(projectId: number): void {
    const cachePrefix = `apk_${projectId}_`;
    console.log(`Invalidating build cache for project ${projectId}`);
    this.cacheService.delete(cachePrefix);
  }
}