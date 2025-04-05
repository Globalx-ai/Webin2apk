import fs from 'fs';
import path from 'path';

interface ManifestConfig {
  appName: string;
  packageName: string;
  url: string; // We'll handle null/undefined values when using this
  orientation: string;
  permissions: string[];
}

/**
 * Generates an AndroidManifest.xml file for a WebView-based app
 * 
 * @param config Configuration object with app details
 * @returns Path to the generated manifest file
 */
export async function generateAndroidManifest(config: ManifestConfig): Promise<string> {
  const { appName, packageName, url, orientation, permissions } = config;
  
  // Create the manifests directory if it doesn't exist
  const manifestsDir = path.join(process.cwd(), 'builds', 'manifests');
  await fs.promises.mkdir(manifestsDir, { recursive: true });
  
  // Generate a unique filename for this manifest
  const filename = `manifest_${packageName.replace(/\./g, '_')}.xml`;
  const filePath = path.join(manifestsDir, filename);
  
  // Build the permissions section
  const permissionsXml = permissions
    .map(perm => `    <uses-permission android:name="android.permission.${perm}" />`)
    .join('\n');
  
  // Determine the screen orientation setting
  let orientationValue = 'unspecified';
  switch (orientation) {
    case 'portrait':
      orientationValue = 'portrait';
      break;
    case 'landscape':
      orientationValue = 'landscape';
      break;
    default:
      orientationValue = 'unspecified';
  }
  
  // Create the manifest content
  const manifestContent = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${packageName}"
    android:versionCode="1"
    android:versionName="1.0">

${permissionsXml}

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="true">
        
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|keyboardHidden|screenSize"
            android:screenOrientation="${orientationValue}">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
        
    </application>

</manifest>`;
  
  // Write the manifest to the file
  await fs.promises.writeFile(filePath, manifestContent);
  
  return filePath;
}
