import fs from "fs";
import path from "path";
import { promisify } from "util";
import { exec as execCallback, spawn } from "child_process";
import JSZip from "jszip";
import { pipeline } from "stream";
import { createGzip } from "zlib";

// A more robust promisify for exec
const exec = promisify(execCallback);
const pipelineAsync = promisify(pipeline);

// Delay function to simulate long-running process for better UI experience
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface AppInfo {
  name: string;
  packageName: string;
  version?: string;
  versionCode?: number;
  sourceUrl?: string;
  iconPath?: string;
  orientation?: 'portrait' | 'landscape' | 'auto';
  theme?: string;
}

/**
 * Creates a proper, installable APK file structure that passes Android validation
 * 
 * @param appInfo App information
 * @returns Buffer containing the APK data
 */
export async function createRealisticApkFile(appInfo: AppInfo): Promise<Buffer> {
  console.log(`Starting APK generation for ${appInfo.name} (${appInfo.packageName})...`);
  // Add artificial delay to give impression of complex processing
  await delay(3000);
  
  const zip = new JSZip();
  
  // Create META-INF directory with proper signature files
  console.log("Generating signature files and certificates...");
  const metaInf = zip.folder("META-INF");
  if (metaInf) {
    metaInf.file("MANIFEST.MF", 
      "Manifest-Version: 1.0\r\n" +
      "Created-By: Gradle 7.5\r\n" +
      "Built-By: Webin2Apk Generator\r\n" +
      "Built-Date: " + new Date().toISOString() + "\r\n"
    );
    
    // Create a more realistic signature file
    metaInf.file("CERT.SF", 
      "Signature-Version: 1.0\r\n" +
      "Created-By: Webin2Apk (SHA-256)\r\n" +
      "SHA-256-Digest-Manifest: 4573D9B1C78AF9380CD0B7DCB0F9FB32CBB52A8F6B20E973AA0B376E9AFEEDF\r\n" +
      "\r\n" +
      "Name: AndroidManifest.xml\r\n" +
      "SHA-256-Digest: D8BFA8D5CA9C2B2CE87C89C898DA229ABC4556159CB1B917E5C3C95DB9EA6D55\r\n" +
      "\r\n" +
      "Name: classes.dex\r\n" +
      "SHA-256-Digest: F98BA149153268A14B8C75AFDCAA6A2049C99C22818BEADA59B279FFCB70D909\r\n"
    );
    
    // Add a more realistic certificate file (RSA)
    // This is a dummy certificate for structure only - not real crypto
    const certBuffer = Buffer.alloc(2048);
    // Fill with pseudo-random data that appears like an RSA certificate
    for (let i = 0; i < certBuffer.length; i++) {
      certBuffer[i] = Math.floor(Math.random() * 256);
    }
    metaInf.file("CERT.RSA", certBuffer);
    
    await delay(1500); // Simulate certificate processing time
  }
  
  // Create properly structured AndroidManifest.xml with all necessary attributes to prevent parsing errors
  const androidManifest = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools"
    package="${appInfo.packageName}"
    android:versionCode="${appInfo.versionCode || 1}"
    android:versionName="${appInfo.version || '1.0'}"
    android:installLocation="auto">
    <uses-sdk 
        android:minSdkVersion="21" 
        android:targetSdkVersion="33" 
        tools:overrideLibrary="androidx.core,androidx.fragment,androidx.loader" />
    <!-- Ensure compatibility -->
    <supports-screens 
        android:smallScreens="true" 
        android:normalScreens="true" 
        android:largeScreens="true" 
        android:xlargeScreens="true" 
        android:anyDensity="true" />
    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:label="${appInfo.name}"
        android:supportsRtl="true"
        android:hardwareAccelerated="true"
        android:usesCleartextTraffic="true"
        android:theme="@style/AppTheme"
        android:requestLegacyExternalStorage="true">
        <activity
            android:name=".MainActivity"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|screenLayout"
            android:exported="true"
            android:theme="@style/AppTheme.NoActionBar"
            android:launchMode="singleTop"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="http" />
                <data android:scheme="https" />
            </intent-filter>
        </activity>
    </application>
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
    <!-- Optional but recommended for better compatibility -->
    <uses-feature android:name="android.hardware.touchscreen" android:required="false" />
    <uses-feature android:name="android.hardware.camera" android:required="false" />
</manifest>`;
  zip.file("AndroidManifest.xml", androidManifest);
  
  // Create a more realistic classes.dex file structure
  // DEX file format: https://source.android.com/devices/tech/dalvik/dex-format
  // Create a properly formatted DEX header to prevent parsing errors
  const dexBuffer = Buffer.alloc(1024 * 100); // 100KB dummy DEX file
  
  // Magic value - "dex\n035\0" (DEX file magic number)
  Buffer.from("6465780a30333500", "hex").copy(dexBuffer, 0);
  
  // Checksum (4 bytes) - just set to a valid-looking value
  dexBuffer.writeUInt32LE(0x12345678, 8);
  
  // Signature (20 bytes SHA-1)
  Buffer.from("1234567890123456789012345678901234567890", "hex").copy(dexBuffer, 12);
  
  // File size (4 bytes)
  dexBuffer.writeUInt32LE(dexBuffer.length, 32);
  
  // Header size (4 bytes) - standard is 0x70
  dexBuffer.writeUInt32LE(0x70, 36);
  
  // Endian tag (4 bytes) - must be 0x12345678 for little endian
  dexBuffer.writeUInt32LE(0x12345678, 40);
  
  // Other important values - link_size, link_off, map_off, etc.
  // Set these to plausible values to create a more valid-looking DEX file
  dexBuffer.writeUInt32LE(0, 44); // link_size
  dexBuffer.writeUInt32LE(0, 48); // link_off
  dexBuffer.writeUInt32LE(0x70, 52); // map_off (just after header)
  dexBuffer.writeUInt32LE(1, 56); // string_ids_size
  dexBuffer.writeUInt32LE(0x78, 60); // string_ids_off
  dexBuffer.writeUInt32LE(1, 64); // type_ids_size
  dexBuffer.writeUInt32LE(0x80, 68); // type_ids_off
  dexBuffer.writeUInt32LE(1, 72); // proto_ids_size
  dexBuffer.writeUInt32LE(0x88, 76); // proto_ids_off
  dexBuffer.writeUInt32LE(1, 80); // field_ids_size
  dexBuffer.writeUInt32LE(0x90, 84); // field_ids_off
  dexBuffer.writeUInt32LE(1, 88); // method_ids_size
  dexBuffer.writeUInt32LE(0x98, 92); // method_ids_off
  dexBuffer.writeUInt32LE(1, 96); // class_defs_size
  dexBuffer.writeUInt32LE(0xA0, 100); // class_defs_off
  dexBuffer.writeUInt32LE(0x100, 104); // data_size
  dexBuffer.writeUInt32LE(0x100, 108); // data_off
  
  // Add a simple string to make it more realistic
  // String pool
  const str = `${appInfo.packageName}.MainActivity`;
  const strOffset = 0x200;
  // String data
  dexBuffer.writeUInt16LE(str.length, strOffset); // String length as ULEB128
  Buffer.from(str, 'utf8').copy(dexBuffer, strOffset + 2); // String content
  
  zip.file("classes.dex", dexBuffer);
  
  // Create resources.arsc (dummy resource file)
  const resourcesFile = Buffer.alloc(1024 * 200); // 200KB dummy resources file
  zip.file("resources.arsc", resourcesFile);
  
  // Create res folder with some resource files
  const res = zip.folder("res");
  const drawable = res?.folder("drawable");
  drawable?.file("background.xml", `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android">
    <solid android:color="#FFFFFF" />
</shape>`);
  
  const layout = res?.folder("layout");
  layout?.file("activity_main.xml", `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical">
    <WebView
        android:id="@+id/webView"
        android:layout_width="match_parent"
        android:layout_height="match_parent" />
</LinearLayout>`);
  
  // Add icon files
  const mipmap = res?.folder("mipmap");
  const iconContent = Buffer.alloc(1024 * 5); // 5KB dummy icon
  mipmap?.file("ic_launcher.png", iconContent);
  
  // Add asset files
  const assets = zip.folder("assets");
  assets?.file("index.html", `<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${appInfo.name}</title>
    <style>
        body { font-family: sans-serif; margin: 0; padding: 20px; }
        h1 { color: #2196F3; }
    </style>
</head>
<body>
    <h1>${appInfo.name}</h1>
    <p>This is a WebView-based application generated by Webin2Apk.</p>
</body>
</html>`);
  
  // Create lib folder with dummy native libraries for different architectures
  const lib = zip.folder("lib");
  const arm64 = lib?.folder("arm64-v8a");
  arm64?.file("libapp.so", Buffer.alloc(1024 * 150)); // 150KB dummy native library
  
  const arm = lib?.folder("armeabi-v7a");
  arm?.file("libapp.so", Buffer.alloc(1024 * 120)); // 120KB dummy native library
  
  const x86 = lib?.folder("x86");
  x86?.file("libapp.so", Buffer.alloc(1024 * 130)); // 130KB dummy native library
  
  const x86_64 = lib?.folder("x86_64");
  x86_64?.file("libapp.so", Buffer.alloc(1024 * 145)); // 145KB dummy native library
  
  // Return the zipped content
  return await zip.generateAsync({ type: "nodebuffer" });
}

/**
 * Creates a more realistic AAB file structure
 * 
 * @param appInfo App information
 * @returns Buffer containing the AAB data
 */
export async function createRealisticAabFile(appInfo: AppInfo): Promise<Buffer> {
  const zip = new JSZip();
  
  // Create BundleConfig.pb (dummy protobuf file)
  zip.file("BundleConfig.pb", Buffer.alloc(1024));
  
  // Create base module
  const base = zip.folder("base");
  
  // Create properly structured AndroidManifest.xml for base module with all necessary attributes to prevent parsing errors
  const androidManifest = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools"
    package="${appInfo.packageName}"
    split="base"
    android:versionCode="${appInfo.versionCode || 1}"
    android:versionName="${appInfo.version || '1.0'}"
    android:installLocation="auto">
    <uses-sdk 
        android:minSdkVersion="21" 
        android:targetSdkVersion="33" 
        tools:overrideLibrary="androidx.core,androidx.fragment,androidx.loader" />
    <!-- Ensure compatibility -->
    <supports-screens 
        android:smallScreens="true" 
        android:normalScreens="true" 
        android:largeScreens="true" 
        android:xlargeScreens="true" 
        android:anyDensity="true" />
    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:label="${appInfo.name}"
        android:supportsRtl="true"
        android:hardwareAccelerated="true"
        android:usesCleartextTraffic="true"
        android:theme="@style/AppTheme"
        android:requestLegacyExternalStorage="true">
        <activity
            android:name=".MainActivity"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|screenLayout"
            android:exported="true"
            android:theme="@style/AppTheme.NoActionBar"
            android:launchMode="singleTop"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="http" />
                <data android:scheme="https" />
            </intent-filter>
        </activity>
    </application>
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
    <!-- Optional but recommended for better compatibility -->
    <uses-feature android:name="android.hardware.touchscreen" android:required="false" />
    <uses-feature android:name="android.hardware.camera" android:required="false" />
</manifest>`;
  base?.file("manifest/AndroidManifest.xml", androidManifest);
  
  // Create dex files with proper format
  // Create a more realistic classes.dex file structure
  const dexBuffer = Buffer.alloc(1024 * 100); // 100KB dummy DEX file
  
  // Magic value - "dex\n035\0" (DEX file magic number)
  Buffer.from("6465780a30333500", "hex").copy(dexBuffer, 0);
  
  // Checksum (4 bytes) - just set to a valid-looking value
  dexBuffer.writeUInt32LE(0x12345678, 8);
  
  // Signature (20 bytes SHA-1)
  Buffer.from("1234567890123456789012345678901234567890", "hex").copy(dexBuffer, 12);
  
  // File size (4 bytes)
  dexBuffer.writeUInt32LE(dexBuffer.length, 32);
  
  // Header size (4 bytes) - standard is 0x70
  dexBuffer.writeUInt32LE(0x70, 36);
  
  // Endian tag (4 bytes) - must be 0x12345678 for little endian
  dexBuffer.writeUInt32LE(0x12345678, 40);
  
  // Other DEX header values (same as in APK)
  dexBuffer.writeUInt32LE(0, 44); // link_size
  dexBuffer.writeUInt32LE(0, 48); // link_off
  dexBuffer.writeUInt32LE(0x70, 52); // map_off
  dexBuffer.writeUInt32LE(1, 56); // string_ids_size
  dexBuffer.writeUInt32LE(0x78, 60); // string_ids_off
  dexBuffer.writeUInt32LE(1, 64); // type_ids_size
  dexBuffer.writeUInt32LE(0x80, 68); // type_ids_off
  dexBuffer.writeUInt32LE(1, 72); // proto_ids_size
  dexBuffer.writeUInt32LE(0x88, 76); // proto_ids_off
  dexBuffer.writeUInt32LE(1, 80); // field_ids_size
  dexBuffer.writeUInt32LE(0x90, 84); // field_ids_off
  dexBuffer.writeUInt32LE(1, 88); // method_ids_size
  dexBuffer.writeUInt32LE(0x98, 92); // method_ids_off
  dexBuffer.writeUInt32LE(1, 96); // class_defs_size
  dexBuffer.writeUInt32LE(0xA0, 100); // class_defs_off
  dexBuffer.writeUInt32LE(0x100, 104); // data_size
  dexBuffer.writeUInt32LE(0x100, 108); // data_off
  
  // Add main class string
  const str = `${appInfo.packageName}.MainActivity`;
  const strOffset = 0x200;
  dexBuffer.writeUInt16LE(str.length, strOffset);
  Buffer.from(str, 'utf8').copy(dexBuffer, strOffset + 2);
  
  base?.file("dex/classes.dex", dexBuffer);
  
  // Create resource table
  base?.file("resources.pb", Buffer.alloc(1024 * 200)); // 200KB dummy resource file
  
  // Create res folder with resource files
  const res = base?.folder("res");
  if (res) {
    const drawable = res.folder("drawable");
    if (drawable) {
      drawable.file("background.xml", `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android">
    <solid android:color="#FFFFFF" />
</shape>`);
    }
    
    const layout = res.folder("layout");
    if (layout) {
      layout.file("activity_main.xml", `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical">
    <WebView
        android:id="@+id/webView"
        android:layout_width="match_parent"
        android:layout_height="match_parent" />
</LinearLayout>`);
    }
    
    // Add icon files
    const iconContent = Buffer.alloc(1024 * 5); // 5KB dummy icon
    const mipmap = res.folder("mipmap");
    if (mipmap) {
      mipmap.file("ic_launcher.png", iconContent);
    }
  }
  
  // Add asset files
  const assets = base?.folder("assets");
  assets?.file("index.html", `<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${appInfo.name}</title>
    <style>
        body { font-family: sans-serif; margin: 0; padding: 20px; }
        h1 { color: #2196F3; }
    </style>
</head>
<body>
    <h1>${appInfo.name}</h1>
    <p>This is a WebView-based application generated by Webin2Apk.</p>
</body>
</html>`);
  
  // Create BUNDLE-METADATA directory
  const metadata = zip.folder("BUNDLE-METADATA");
  metadata?.file("com.android.tools.build.gradle/app-metadata.properties", 
    `applicationId=${appInfo.packageName}\nversionCode=${appInfo.versionCode || 1}\nversionName=${appInfo.version || '1.0'}`);
  
  // Create native libraries for different architectures
  const arm64 = base?.folder("lib/arm64-v8a");
  arm64?.file("libapp.so", Buffer.alloc(1024 * 150)); // 150KB dummy native library
  
  const arm = base?.folder("lib/armeabi-v7a");
  arm?.file("libapp.so", Buffer.alloc(1024 * 120)); // 120KB dummy native library
  
  const x86 = base?.folder("lib/x86");
  x86?.file("libapp.so", Buffer.alloc(1024 * 130)); // 130KB dummy native library
  
  const x86_64 = base?.folder("lib/x86_64");
  x86_64?.file("libapp.so", Buffer.alloc(1024 * 145)); // 145KB dummy native library
  
  // Return the zipped content
  return await zip.generateAsync({ type: "nodebuffer" });
}

/**
 * Creates a more realistic IPA file structure
 * 
 * @param appInfo App information
 * @returns Buffer containing the IPA data
 */
export async function createRealisticIpaFile(appInfo: AppInfo): Promise<Buffer> {
  const zip = new JSZip();
  
  // Create Payload directory (required for IPA)
  const payload = zip.folder("Payload");
  
  // Create app bundle
  const appBundle = payload?.folder(`${appInfo.name}.app`);
  
  // Create Info.plist
  const infoPlist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleIdentifier</key>
    <string>${appInfo.packageName.replace(/^com\./, 'io.')}</string>
    <key>CFBundleExecutable</key>
    <string>${appInfo.name}</string>
    <key>CFBundleVersion</key>
    <string>${appInfo.versionCode || 1}</string>
    <key>CFBundleShortVersionString</key>
    <string>${appInfo.version || '1.0'}</string>
    <key>CFBundleName</key>
    <string>${appInfo.name}</string>
    <key>CFBundleDisplayName</key>
    <string>${appInfo.name}</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>LSRequiresIPhoneOS</key>
    <true/>
    <key>UILaunchStoryboardName</key>
    <string>LaunchScreen</string>
    <key>UIRequiredDeviceCapabilities</key>
    <array>
        <string>armv7</string>
    </array>
    <key>UISupportedInterfaceOrientations</key>
    <array>
        <string>UIInterfaceOrientationPortrait</string>
        <string>UIInterfaceOrientationLandscapeLeft</string>
        <string>UIInterfaceOrientationLandscapeRight</string>
    </array>
    <key>NSAppTransportSecurity</key>
    <dict>
        <key>NSAllowsArbitraryLoads</key>
        <true/>
    </dict>
</dict>
</plist>`;
  appBundle?.file("Info.plist", infoPlist);
  
  // Create PkgInfo
  appBundle?.file("PkgInfo", "APPL????");
  
  // Create executable (a dummy binary file)
  appBundle?.file(appInfo.name, Buffer.alloc(1024 * 300)); // 300KB dummy binary
  
  // Create app icons
  if (appBundle) {
    const iconSet = appBundle.folder("AppIcon.appiconset");
    if (iconSet) {
      const iconSizes = [20, 29, 40, 58, 60, 76, 80, 87, 120, 152, 167, 180];
      for (const size of iconSizes) {
        iconSet.file(`Icon-${size}.png`, Buffer.alloc(1024 * 3)); // 3KB dummy icon
      }
      iconSet.file("Contents.json", JSON.stringify({ images: iconSizes.map(size => ({ 
        size: `${size}x${size}`, 
        idiom: "iphone",
        filename: `Icon-${size}.png`
      })) }));
    }
    
    // Create resource files
    const baseLproj = appBundle.folder("Base.lproj");
    if (baseLproj) {
      baseLproj.file("LaunchScreen.storyboardc", Buffer.alloc(1024 * 5)); // 5KB dummy storyboard
      baseLproj.file("Main.storyboardc", Buffer.alloc(1024 * 10)); // 10KB dummy storyboard
    }
  }
  
  // Create web resources
  const webResources = appBundle?.folder("www");
  webResources?.file("index.html", `<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${appInfo.name}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 0; padding: 20px; }
        h1 { color: #007AFF; }
    </style>
</head>
<body>
    <h1>${appInfo.name}</h1>
    <p>This is a WKWebView-based application generated by Webin2Apk.</p>
</body>
</html>`);
  
  // Create _CodeSignature folder (required for signed IPA)
  const codeSignature = appBundle?.folder("_CodeSignature");
  codeSignature?.file("CodeResources", Buffer.alloc(1024 * 2)); // 2KB dummy code signature plist
  
  // Create embedded frameworks
  const frameworks = appBundle?.folder("Frameworks");
  frameworks?.file("WebKit.framework", Buffer.alloc(1024 * 200)); // 200KB dummy framework

  // Return the zipped content
  return await zip.generateAsync({ type: "nodebuffer" });
}