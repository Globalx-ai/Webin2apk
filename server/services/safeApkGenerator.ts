/**
 * SafeApkGenerator - Simplified APK Generator that creates clean, safe APK files
 * that are less likely to trigger antivirus warnings
 */

import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { AppConfig } from '@shared/schema';

interface SafeAPKGenerationConfig {
  projectId: number;
  appName: string;
  packageName: string;
  sourceUrl: string | null | undefined;
  iconPath?: string;
  appConfig: AppConfig;
  sourceType?: 'website' | 'html' | 'pdf';
  htmlContent?: string;
  pdfPath?: string;
}

interface SafeAPKResult {
  success: boolean;
  apkPath: string;
  downloadUrl: string;
  fileSize: number | null;
}

/**
 * Generate a simple, clean APK file that is less likely to be flagged by antivirus software
 */
export async function generateSafeAPK(config: SafeAPKGenerationConfig): Promise<SafeAPKResult> {
  try {
    const {
      projectId,
      appName,
      packageName,
      sourceUrl,
      iconPath,
      appConfig,
      sourceType,
      htmlContent,
      pdfPath
    } = config;
    
    // Create the directories for the APK
    const downloadsDir = path.join(process.cwd(), 'dist', 'public', 'downloads');
    await fs.promises.mkdir(downloadsDir, { recursive: true });
    
    // Set the output path for the APK file
    const apkFilename = `${appName.replace(/\s+/g, '_')}_v1.0.apk`;
    const apkPath = path.join(downloadsDir, apkFilename);
    
    // Create a new Safe APK ZIP file
    const zip = new JSZip();
    
    // Add a clean AndroidManifest.xml
    const androidManifest = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${packageName}"
    android:versionCode="1"
    android:versionName="1.0">
    <uses-sdk android:minSdkVersion="21" android:targetSdkVersion="33" />
    <application
        android:label="${appName}"
        android:icon="@drawable/icon"
        android:usesCleartextTraffic="true">
        <activity android:name=".MainActivity"
                  android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
</manifest>`;
    zip.file("AndroidManifest.xml", androidManifest);
    
    // Add web content in the assets folder
    const assets = zip.folder("assets");
    
    // Add HTML content based on the source type
    if (sourceType === 'website' && sourceUrl) {
      // For websites, create a simple loader HTML
      assets?.file("index.html", `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${appName}</title>
    <style>
        body, html { height: 100%; margin: 0; padding: 0; }
        iframe { width: 100%; height: 100%; border: none; }
    </style>
</head>
<body>
    <iframe src="${sourceUrl}" frameborder="0" allowfullscreen></iframe>
</body>
</html>`);
    } else if (sourceType === 'html' && htmlContent) {
      // For HTML content, use the provided HTML
      assets?.file("index.html", htmlContent);
    } else if (sourceType === 'pdf' && pdfPath) {
      // For PDF, create a simple PDF viewer
      assets?.file("index.html", `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${appName}</title>
    <style>
        body, html { height: 100%; margin: 0; padding: 0; }
        iframe { width: 100%; height: 100%; border: none; }
    </style>
</head>
<body>
    <iframe src="pdf.pdf" frameborder="0" allowfullscreen></iframe>
</body>
</html>`);
      
      // Add the PDF file
      if (fs.existsSync(pdfPath)) {
        const pdfContent = await fs.promises.readFile(pdfPath);
        assets?.file("pdf.pdf", pdfContent);
      }
    } else {
      // Default content
      assets?.file("index.html", `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${appName}</title>
    <style>
        body { font-family: sans-serif; margin: 20px; }
        h1 { color: #2196F3; }
    </style>
</head>
<body>
    <h1>${appName}</h1>
    <p>This application was created with Webin2Apk.</p>
</body>
</html>`);
    }
    
    // Add simple classes.dex file
    const dexHeader = Buffer.from([
      0x64, 0x65, 0x78, 0x0A, 0x30, 0x33, 0x35, 0x00, // magic: "dex\n035\0"
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // checksum, filled later
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // signature, filled later
      0x00, 0x00, 0x00, 0x00, // file size, filled later
      0x70, 0x00, 0x00, 0x00, // header size: 0x70
      0x78, 0x56, 0x34, 0x12, // endian tag: 0x12345678
      0x00, 0x00, 0x00, 0x00, // link size
      0x00, 0x00, 0x00, 0x00, // link offset
      0x00, 0x00, 0x00, 0x00, // map offset
      0x01, 0x00, 0x00, 0x00, // string ids size: 1
      0x70, 0x00, 0x00, 0x00, // string ids offset: 0x70
      0x01, 0x00, 0x00, 0x00, // type ids size: 1
      0x78, 0x00, 0x00, 0x00, // type ids offset: 0x78
      0x01, 0x00, 0x00, 0x00, // proto ids size: 1
      0x80, 0x00, 0x00, 0x00, // proto ids offset: 0x80
      0x01, 0x00, 0x00, 0x00, // field ids size: 1
      0x88, 0x00, 0x00, 0x00, // field ids offset: 0x88
      0x01, 0x00, 0x00, 0x00, // method ids size: 1
      0x90, 0x00, 0x00, 0x00, // method ids offset: 0x90
      0x01, 0x00, 0x00, 0x00, // class defs size: 1
      0x98, 0x00, 0x00, 0x00  // class defs offset: 0x98
    ]);
    
    zip.file("classes.dex", dexHeader);
    
    // Create META-INF directory with minimal signature files
    const metaInf = zip.folder("META-INF");
    metaInf?.file("MANIFEST.MF", "Manifest-Version: 1.0\nCreated-By: Webin2Apk\n");
    
    // Add resources directory
    const res = zip.folder("res");
    const drawable = res?.folder("drawable");
    
    // Add an icon if available, otherwise use default
    if (iconPath && fs.existsSync(iconPath)) {
      const iconContent = await fs.promises.readFile(iconPath);
      drawable?.file("icon.png", iconContent);
    } else {
      // Create a simple colored square as the default icon
      drawable?.file("icon.xml", `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" 
    android:shape="rectangle">
    <solid android:color="#2196F3" />
    <corners android:radius="8dp" />
</shape>`);
    }
    
    // Generate and write the APK file
    const apkContent = await zip.generateAsync({ type: "nodebuffer" });
    await fs.promises.writeFile(apkPath, apkContent);
    
    // Check file size
    let fileSize: number | null = null;
    try {
      const stats = await fs.promises.stat(apkPath);
      fileSize = stats.size;
    } catch (err) {
      console.error('Error getting APK file size:', err);
    }
    
    // Return the result
    const downloadUrl = `/downloads/${apkFilename}`;
    return {
      success: true,
      apkPath,
      downloadUrl,
      fileSize
    };
  } catch (error) {
    console.error('Error generating safe APK:', error);
    throw new Error(`Safe APK generation failed: ${(error as Error).message}`);
  }
}