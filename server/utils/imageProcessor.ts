import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import { exec } from 'child_process';

// Promisify exec for cleaner async/await usage
const execAsync = promisify(exec);

// Define required icon sizes for Android (in pixels)
const ICON_SIZES = {
  ldpi: 36,
  mdpi: 48,
  hdpi: 72,
  xhdpi: 96,
  xxhdpi: 144,
  xxxhdpi: 192,
  playstore: 512,
  adaptive: 1024
};

interface GeneratedIcons {
  iconSetPath: string;
  sizes: Record<string, string>;
}

/**
 * Generates app icons in various sizes required for Android apps
 * 
 * @param sourceIconPath Path to the source icon image
 * @param projectId Project ID for organizing files
 * @returns Object containing paths to the generated icons
 */
export async function generateAppIcon(sourceIconPath: string, projectId: number): Promise<GeneratedIcons> {
  // Create project-specific icon directory
  const iconBaseDir = path.join(process.cwd(), 'uploads', 'icons');
  const projectIconDir = path.join(iconBaseDir, `project_${projectId}`);
  
  try {
    // Ensure directory exists
    await fs.promises.mkdir(projectIconDir, { recursive: true });
    
    const generatedIcons: Record<string, string> = {};
    
    // In a real implementation, this would use Sharp or another image processing library
    // to resize and optimize the images. For this example, we'll simulate the process.
    
    // Process each icon size
    for (const [sizeName, size] of Object.entries(ICON_SIZES)) {
      // Generate the destination path for this size
      const destFilename = `icon_${sizeName}.png`;
      const destPath = path.join(projectIconDir, destFilename);
      
      // In a real implementation, use Sharp to resize:
      // await sharp(sourceIconPath)
      //   .resize(size, size)
      //   .png()
      //   .toFile(destPath);
      
      // For this example, we'll simply copy the original icon
      await fs.promises.copyFile(sourceIconPath, destPath);
      
      // Update the result object
      generatedIcons[sizeName] = destPath;
    }
    
    // Create adaptive icon files (background and foreground layers)
    // In a real implementation, these would be properly generated
    const adaptiveBackground = path.join(projectIconDir, 'adaptive_background.png');
    const adaptiveForeground = path.join(projectIconDir, 'adaptive_foreground.png');
    
    await fs.promises.copyFile(sourceIconPath, adaptiveBackground);
    await fs.promises.copyFile(sourceIconPath, adaptiveForeground);
    
    generatedIcons['adaptive_background'] = adaptiveBackground;
    generatedIcons['adaptive_foreground'] = adaptiveForeground;
    
    // Generate an XML file for the adaptive icon
    const adaptiveIconXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>`;
    
    const adaptiveXmlPath = path.join(projectIconDir, 'ic_launcher.xml');
    await fs.promises.writeFile(adaptiveXmlPath, adaptiveIconXml);
    
    generatedIcons['adaptive_xml'] = adaptiveXmlPath;
    
    return {
      iconSetPath: projectIconDir,
      sizes: generatedIcons
    };
  } catch (error) {
    console.error('Error generating app icons:', error);
    throw new Error(`Failed to generate app icons: ${(error as Error).message}`);
  }
}

/**
 * Generates splash screen images in various sizes
 * 
 * @param sourcePath Source image for splash screen
 * @param projectId Project ID
 * @param backgroundColor Background color (for padding if needed)
 * @returns Object containing paths to the generated splash screen images
 */
export async function generateSplashScreen(
  sourcePath: string, 
  projectId: number, 
  backgroundColor: string = '#FFFFFF'
): Promise<Record<string, string>> {
  const splashDir = path.join(process.cwd(), 'uploads', 'splashscreens', `project_${projectId}`);
  
  try {
    // Ensure directory exists
    await fs.promises.mkdir(splashDir, { recursive: true });
    
    // Define common screen densities and sizes
    const screenDensities = [
      { name: 'ldpi', width: 320, height: 426 },
      { name: 'mdpi', width: 480, height: 640 },
      { name: 'hdpi', width: 720, height: 960 },
      { name: 'xhdpi', width: 960, height: 1280 },
      { name: 'xxhdpi', width: 1440, height: 1920 },
      { name: 'xxxhdpi', width: 1920, height: 2560 }
    ];
    
    const splashImages: Record<string, string> = {};
    
    // In a real implementation, use Sharp to resize:
    // Generate splash screen for each density
    for (const density of screenDensities) {
      const destFilename = `splash_${density.name}.png`;
      const destPath = path.join(splashDir, destFilename);
      
      // In a real implementation:
      // await sharp(sourcePath)
      //   .resize({
      //     width: density.width,
      //     height: density.height,
      //     fit: 'contain',
      //     background: backgroundColor
      //   })
      //   .png()
      //   .toFile(destPath);
      
      // For this example, simply copy the source file
      await fs.promises.copyFile(sourcePath, destPath);
      
      splashImages[density.name] = destPath;
    }
    
    return splashImages;
  } catch (error) {
    console.error('Error generating splash screens:', error);
    throw new Error(`Failed to generate splash screens: ${(error as Error).message}`);
  }
}
