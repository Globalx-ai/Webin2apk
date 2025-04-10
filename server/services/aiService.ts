import OpenAI from 'openai';
import { CustomCodeData } from '@shared/schema';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Interface for code verification result
interface CodeVerificationResult {
  isValid: boolean;
  issues: Array<{
    severity: 'error' | 'warning' | 'info';
    message: string;
    line?: number;
    column?: number;
  }>;
  suggestions: Array<{
    type: 'fix' | 'improvement';
    description: string;
    code?: string;
  }>;
  fixedCode?: string;
}

// Interface for code completion result
interface CodeCompletionResult {
  completedCode: string;
  explanation: string;
}

/**
 * Validates custom code using AI
 * 
 * @param codeData Custom code data to validate
 * @returns Validation result with issues and suggestions
 */
export async function validateCode(codeData: CustomCodeData): Promise<CodeVerificationResult> {
  try {
    const { language, content } = codeData;
    const codeContent = content;
    
    // Basic validation first
    const basicValidation = performBasicCodeValidation(language, codeContent);
    
    // If basic validation shows critical issues, return those immediately
    if (basicValidation.issues.some(issue => issue.severity === 'error')) {
      return basicValidation;
    }
    
    // Check for API quota limit
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "quota_reached") {
      console.log("Using enhanced fallback code validation due to API quota limitation");
      return enhancedFallbackValidation(language, codeContent, basicValidation);
    }
    
    // Craft a prompt for code validation
    const prompt = `Please analyze the following ${language} code for an Android application. 
Identify any bugs, potential issues, security vulnerabilities, or performance problems.
Also suggest improvements and optimizations.

CODE:
\`\`\`${language}
${codeContent}
\`\`\`

Provide the response in JSON format with the following structure:
{
  "isValid": boolean, // overall assessment if the code is valid and safe to use
  "issues": [ // array of issues found
    {
      "severity": "error" | "warning" | "info",
      "message": "description of the issue",
      "line": number, // approximate line number if identifiable
      "column": number // approximate column number if identifiable
    }
  ],
  "suggestions": [ // array of suggestions for improvements
    {
      "type": "fix" | "improvement",
      "description": "description of the suggestion",
      "code": "suggested code fix/improvement" // if applicable
    }
  ],
  "fixedCode": "complete fixed version of the code" // if there are errors that can be fixed
}`;

    try {
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      // Parse the AI response
      const responseContent = response.choices[0].message.content || "{}";
      const result = JSON.parse(responseContent);
      
      return {
        isValid: result.isValid || false,
        issues: result.issues || [],
        suggestions: result.suggestions || [],
        fixedCode: result.fixedCode,
      };
    } catch (error) {
      const aiError = error as Error;
      console.error('OpenAI API error:', aiError);
      // If we hit quota limits, use the enhanced fallback
      if (aiError.message && aiError.message.includes("quota")) {
        console.log("API quota reached, using enhanced fallback validation");
        return enhancedFallbackValidation(language, codeContent, basicValidation);
      }
      throw aiError;
    }
  } catch (error) {
    console.error('Error validating code:', error);
    try {
      // Extract language and content from codeData again in case they're lost in the catch block scope
      const { language, content } = codeData;
      const codeContent = content;
      
      // Use enhanced fallback if possible
      return enhancedFallbackValidation(language, codeContent, 
        performBasicCodeValidation(language, codeContent));
    } catch (fallbackError) {
      return {
        isValid: false,
        issues: [{
          severity: 'error',
          message: `Failed to validate code: ${(error as Error).message}`,
        }],
        suggestions: [],
      };
    }
  }
}

/**
 * Performs basic code validation without using AI
 * 
 * @param language Programming language
 * @param codeContent Code content to validate
 * @returns Basic validation result
 */
function performBasicCodeValidation(language: string, codeContent: string): CodeVerificationResult {
  try {
    const issues: Array<{
      severity: 'error' | 'warning' | 'info';
      message: string;
      line?: number;
      column?: number;
    }> = [];
    
    // Basic validation - check for common issues
    if (language === 'javascript' || language === 'typescript') {
      // Check for missing semicolons
      const lines = codeContent.split('\n');
      lines.forEach((line, index) => {
        const trimmed = line.trim();
        if (trimmed && 
            !trimmed.endsWith(';') && 
            !trimmed.endsWith('{') && 
            !trimmed.endsWith('}') && 
            !trimmed.endsWith('*/') &&
            !trimmed.endsWith('//') &&
            !trimmed.startsWith('import') &&
            !trimmed.startsWith('export') &&
            !trimmed.includes('function') &&
            !trimmed.startsWith('//') &&
            !trimmed.startsWith('*')) {
          issues.push({
            severity: 'warning',
            message: 'Possible missing semicolon',
            line: index + 1
          });
        }
      });
      
      // Check for console.log statements
      if (codeContent.includes('console.log')) {
        issues.push({
          severity: 'info',
          message: 'Debug console.log statements found in code. Consider removing them before production.'
        });
      }
    }
    
    // Check for potentially insecure patterns
    if (codeContent.includes('eval(')) {
      issues.push({
        severity: 'error',
        message: 'Use of eval() detected, which can lead to security vulnerabilities.'
      });
    }
    
    // Check for basic syntax errors
    let unbalancedBraces = 0;
    for (const char of codeContent) {
      if (char === '{') unbalancedBraces++;
      if (char === '}') unbalancedBraces--;
    }
    
    if (unbalancedBraces !== 0) {
      issues.push({
        severity: 'error',
        message: 'Unbalanced braces detected. Check your code structure.'
      });
    }
    
    // Generate a basic suggestion
    const suggestions = [
      {
        type: 'improvement' as const,
        description: 'Consider adding comments to document your code functionality.'
      }
    ];
    
    return {
      isValid: issues.filter(i => i.severity === 'error').length === 0,
      issues,
      suggestions
    };
  } catch (error) {
    console.error('Error in basic code validation:', error);
    return {
      isValid: false,
      issues: [{
        severity: 'error' as const,
        message: 'Could not validate code: ' + (error as Error).message
      }],
      suggestions: []
    };
  }
}

/**
 * Enhanced fallback code validation that adds security and best practice checks
 * 
 * @param language The programming language of the code
 * @param codeContent The code content to validate
 * @param basicValidation The results from the basic validation as a starting point
 * @returns Enhanced validation results with additional security and best practice checks
 */
function enhancedFallbackValidation(
  language: string, 
  codeContent: string, 
  basicValidation: CodeVerificationResult
): CodeVerificationResult {
  try {
    const result = { ...basicValidation };
    
    // Keep track of any issues we add
    const additionalIssues: Array<{
      severity: 'error' | 'warning' | 'info';
      message: string;
      line?: number;
      column?: number;
    }> = [];
    
    const additionalSuggestions: Array<{
      type: 'fix' | 'improvement';
      description: string;
      code?: string;
    }> = [];
    
    // Check for common security issues based on language
    if (language === 'java' || language === 'kotlin') {
      // Android-specific security checks
      if (codeContent.includes('setJavaScriptEnabled(true)') && 
          !codeContent.includes('setAllowFileAccess(false)')) {
        additionalIssues.push({
          severity: 'warning',
          message: 'JavaScript is enabled but file access is not explicitly disabled, which could lead to security vulnerabilities.',
        });
        
        additionalSuggestions.push({
          type: 'fix',
          description: 'Disable file access when enabling JavaScript to prevent potential security vulnerabilities.',
          code: 'webView.getSettings().setJavaScriptEnabled(true);\nwebView.getSettings().setAllowFileAccess(false);',
        });
      }
      
      if (codeContent.includes('setAllowFileAccessFromFileURLs(true)') || 
          codeContent.includes('setAllowUniversalAccessFromFileURLs(true)')) {
        additionalIssues.push({
          severity: 'error',
          message: 'Enabling universal file access or file access from file URLs introduces significant security vulnerabilities.',
        });
        
        additionalSuggestions.push({
          type: 'fix',
          description: 'Disable universal file access and file access from file URLs.',
          code: 'webView.getSettings().setAllowFileAccessFromFileURLs(false);\nwebView.getSettings().setAllowUniversalAccessFromFileURLs(false);',
        });
      }
      
      // Check for common Android implementation issues
      if (codeContent.includes('WebView') && !codeContent.includes('onReceivedSslError')) {
        additionalIssues.push({
          severity: 'warning',
          message: 'SSL error handling is not implemented for WebView, which may lead to security warnings and connection issues.',
        });
        
        additionalSuggestions.push({
          type: 'improvement',
          description: 'Implement SSL error handling for WebView. Carefully consider whether to proceed with connections that have SSL errors.',
          code: `webView.setWebViewClient(new WebViewClient() {
    @Override
    public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
        // For security, default behavior is to cancel the connection
        // Only proceed if you understand the security implications
        handler.cancel();
        
        // For development only, you might want to proceed anyway
        // handler.proceed();
    }
});`,
        });
      }
      
      // Check for input validation
      if ((codeContent.includes('loadUrl(') || codeContent.includes('loadUrl (')) &&
          !codeContent.includes('validateUrl') && 
          !codeContent.includes('isValidUrl') && 
          !codeContent.includes('validateInput')) {
        additionalIssues.push({
          severity: 'warning',
          message: 'URL loading without validation could allow loading of malicious content.',
        });
        
        additionalSuggestions.push({
          type: 'improvement',
          description: 'Validate URLs before loading them in the WebView.',
          code: `private boolean isValidUrl(String url) {
    // Basic validation - you should expand this as needed
    return url != null && (url.startsWith("https://") || url.startsWith("http://"));
}

// Then use it before loading any URL
if (isValidUrl(urlToLoad)) {
    webView.loadUrl(urlToLoad);
} else {
    // Handle invalid URL
    Log.e("WebView", "Attempted to load invalid URL: " + urlToLoad);
}`,
        });
      }
    } else if (language === 'javascript') {
      // JavaScript-specific checks
      
      // Check for potential XSS vulnerabilities
      if ((codeContent.includes('innerHTML') || codeContent.includes('document.write')) &&
          !codeContent.includes('sanitize') && 
          !codeContent.includes('DOMPurify')) {
        additionalIssues.push({
          severity: 'warning',
          message: 'Using innerHTML or document.write without sanitization could expose your app to XSS attacks.',
        });
        
        additionalSuggestions.push({
          type: 'improvement',
          description: 'Use textContent instead of innerHTML when possible, or sanitize input with a library like DOMPurify.',
          code: `// Safer alternatives to innerHTML:
// 1. For text-only content:
element.textContent = content;

// 2. For HTML content that needs sanitization:
// First, add the DOMPurify library to your project
// import DOMPurify from 'dompurify';
element.innerHTML = DOMPurify.sanitize(content);`,
        });
      }
      
      // Check for eval usage
      if (codeContent.includes('eval(') || codeContent.includes('new Function(')) {
        additionalIssues.push({
          severity: 'error',
          message: 'Using eval() or new Function() is unsafe and opens your app to injection attacks.',
        });
        
        additionalSuggestions.push({
          type: 'fix',
          description: 'Avoid using eval() or new Function(). Use safer alternatives such as JSON.parse() for JSON data.',
          code: `// Instead of:
// eval('(' + jsonString + ')')

// Use:
JSON.parse(jsonString)

// For other dynamic code, consider redesigning your approach`,
        });
      }
      
      // Check for insecure communication with the native app
      if (codeContent.includes('window.Android') || 
          codeContent.includes('AndroidInterface') ||
          codeContent.includes('webkit.messageHandlers')) {
        
        if (!codeContent.includes('try') || !codeContent.includes('catch')) {
          additionalIssues.push({
            severity: 'warning',
            message: 'Native app communication without proper error handling could cause crashes.',
          });
          
          additionalSuggestions.push({
            type: 'improvement',
            description: 'Add proper error handling when communicating with the native app.',
            code: `try {
  // For Android
  if (window.AndroidInterface) {
    window.AndroidInterface.someMethod(params);
  }
  // For iOS
  else if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.iOSInterface) {
    window.webkit.messageHandlers.iOSInterface.postMessage(params);
  }
} catch (error) {
  console.error('Error communicating with native app:', error);
  // Fallback behavior or error notification to user
}`,
          });
        }
      }
    }
    
    // Add our additional checks to the result
    result.issues = [...result.issues, ...additionalIssues];
    result.suggestions = [...result.suggestions, ...additionalSuggestions];
    
    // Update validity based on presence of errors
    result.isValid = !result.issues.some(issue => issue.severity === 'error');
    
    return result;
  } catch (error) {
    console.error('Error in enhanced fallback validation:', error);
    // Return the original basic validation if the enhanced checks fail
    return basicValidation;
  }
}

/**
 * Auto-completes code using AI
 * 
 * @param language Programming language
 * @param partialCode Partial code to complete
 * @param context Additional context about the code's purpose
 * @returns Completed code with explanation
 */
export async function completeCode(
  language: string,
  partialCode: string,
  context: string
): Promise<CodeCompletionResult> {
  try {
    // Check for API quota limit
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "quota_reached") {
      console.log("Using fallback code completion due to API quota limitation");
      return provideFallbackCodeCompletion(language, partialCode, context);
    }
    
    // Craft a prompt for code completion
    const prompt = `Please complete the following ${language} code for an Android application. 
The code will be used in the following context: ${context}

PARTIAL CODE:
\`\`\`${language}
${partialCode}
\`\`\`

Provide the response in JSON format with the following structure:
{
  "completedCode": "the full completed code including the original parts",
  "explanation": "explanation of the completed code and how it works"
}`;

    try {
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      // Parse the AI response
      const responseText = response.choices[0].message.content || "{}";
      const result = JSON.parse(responseText);
      
      return {
        completedCode: result.completedCode || "",
        explanation: result.explanation || "No explanation provided",
      };
    } catch (error) {
      const aiError = error as Error;
      console.error('OpenAI API error:', aiError);
      // If we hit quota limits, use the fallback
      if (aiError.message && aiError.message.includes("quota")) {
        console.log("API quota reached, using fallback code completion");
        return provideFallbackCodeCompletion(language, partialCode, context);
      }
      throw aiError;
    }
  } catch (error) {
    console.error('Error completing code:', error);
    // Try fallback as last resort
    try {
      return provideFallbackCodeCompletion(language, partialCode, context);
    } catch (fallbackError) {
      throw new Error(`Failed to auto-complete code: ${(error as Error).message}`);
    }
  }
}

/**
 * Provides basic code completion without AI
 * Used when OpenAI API is unavailable or quota is reached
 * 
 * @param language Programming language
 * @param partialCode Partial code to complete
 * @param context Additional context
 * @returns Basic completed code with explanation
 */
function provideFallbackCodeCompletion(
  language: string,
  partialCode: string,
  context: string
): CodeCompletionResult {
  // Define common code templates based on language
  const templates: Record<string, { code: string, explanation: string }> = {
    java: {
      code: `
public class AndroidHelper {
    private Context context;
    
    public AndroidHelper(Context context) {
        this.context = context;
    }
    
    public void showToast(String message) {
        Toast.makeText(context, message, Toast.LENGTH_SHORT).show();
    }
    
    public void navigateToActivity(Class<?> activityClass) {
        Intent intent = new Intent(context, activityClass);
        context.startActivity(intent);
    }
    
    public boolean isNetworkAvailable() {
        ConnectivityManager connectivityManager = (ConnectivityManager) 
            context.getSystemService(Context.CONNECTIVITY_SERVICE);
        NetworkInfo activeNetworkInfo = connectivityManager.getActiveNetworkInfo();
        return activeNetworkInfo != null && activeNetworkInfo.isConnected();
    }
}`,
      explanation: "This is a helper class for Android that provides common functionality like showing toasts, navigating between activities, and checking network connectivity."
    },
    kotlin: {
      code: `
class AndroidHelper(private val context: Context) {
    fun showToast(message: String) {
        Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
    }
    
    fun navigateToActivity(activityClass: Class<*>) {
        val intent = Intent(context, activityClass)
        context.startActivity(intent)
    }
    
    fun isNetworkAvailable(): Boolean {
        val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val activeNetworkInfo = connectivityManager.activeNetworkInfo
        return activeNetworkInfo != null && activeNetworkInfo.isConnected
    }
}`,
      explanation: "This is a helper class for Android written in Kotlin that provides common functionality like showing toasts, navigating between activities, and checking network connectivity."
    },
    javascript: {
      code: `
class WebViewHelper {
  constructor() {
    this.isReady = false;
  }

  init() {
    document.addEventListener('DOMContentLoaded', () => {
      this.isReady = true;
      console.log('WebView Helper initialized');
    });
    
    // Handle messages from native app
    window.addEventListener('message', (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (e) {
        console.error('Error parsing message from native app:', e);
      }
    });
  }

  handleMessage(message) {
    switch(message.type) {
      case 'DATA':
        this.handleData(message.payload);
        break;
      case 'COMMAND':
        this.executeCommand(message.payload);
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  handleData(data) {
    console.log('Received data from native app:', data);
    // Process data here
  }

  executeCommand(command) {
    console.log('Executing command:', command);
    // Execute command here
  }

  sendToNative(message) {
    // Send message to Android/iOS native app
    try {
      const messageString = JSON.stringify(message);
      
      // For Android
      if (window.AndroidInterface) {
        window.AndroidInterface.receiveMessage(messageString);
      }
      
      // For iOS
      if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.iOSInterface) {
        window.webkit.messageHandlers.iOSInterface.postMessage(messageString);
      }
    } catch (e) {
      console.error('Error sending message to native app:', e);
    }
  }
}

// Initialize the helper
const webViewHelper = new WebViewHelper();
webViewHelper.init();`,
      explanation: "This JavaScript code creates a WebViewHelper class that facilitates communication between a web page and a native Android/iOS app through a WebView. It handles message passing in both directions and provides methods to process commands and data."
    }
  };

  // Check if we have a template for the requested language
  const template = templates[language] || templates.javascript;
  
  // Determine if the partial code is trying to create a class
  const isCreatingClass = partialCode.includes("class") || partialCode.includes("interface");
  
  // Attempt to create a completion based on the partial code
  let completedCode = partialCode;
  
  // If the partial code looks like it's trying to create a class/method, add common patterns
  if (isCreatingClass) {
    // If the partial code doesn't end with a closing bracket, it might be incomplete
    if (!partialCode.trim().endsWith("}")) {
      completedCode += "\n    // Methods added by fallback code completion\n";
      
      if (language === "java" || language === "kotlin") {
        completedCode += `
    public void initialize() {
        // Initialization code here
        System.out.println("Initialized");
    }
    
    public String getData() {
        // Code to retrieve data
        return "Sample data";
    }
}`;
      } else {
        completedCode += `
    initialize() {
        // Initialization code here
        console.log("Initialized");
    }
    
    getData() {
        // Code to retrieve data
        return "Sample data";
    }
}`;
      }
    }
  } else {
    // If it doesn't look like a class definition, append a helper function
    if (language === "java" || language === "kotlin") {
      completedCode += `\n\n// Helper method added by fallback completion
public void processData(String data) {
    // Process data here
    System.out.println("Processing: " + data);
}\n`;
    } else {
      completedCode += `\n\n// Helper function added by fallback completion
function processData(data) {
    // Process data here
    console.log("Processing:", data);
}\n`;
    }
  }
  
  return {
    completedCode,
    explanation: `This code completion was generated by a fallback mechanism due to API limitations. The code provides basic functionality related to ${context}. You may need to modify it to fit your specific requirements.`
  };
}

/**
 * Analyzes a PDF document to extract structure for conversion
 * 
 * @param pdfUrl URL to the PDF file
 * @returns Analysis of the PDF structure for app conversion
 */
export async function analyzePdf(pdfUrl: string): Promise<any> {
  try {
    // Check for API quota limit
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "quota_reached") {
      console.log("Using fallback PDF analysis due to API quota limitation");
      return provideFallbackPdfAnalysis(pdfUrl);
    }
    
    // Craft a prompt for PDF analysis
    const prompt = `Analyze the structure of a PDF document at ${pdfUrl} for conversion into an Android app.
Identify the main sections, layout, and content types for optimal display in a mobile app format.
Consider how the PDF content should be organized in a WebView-based application.`;

    try {
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
      });

      const content = response.choices[0].message.content;
      return {
        analysis: content ? content : "No analysis available",
      };
    } catch (error) {
      const aiError = error as Error;
      console.error('OpenAI API error:', aiError);
      // If we hit quota limits, use the fallback
      if (aiError.message && aiError.message.includes("quota")) {
        console.log("API quota reached, using fallback PDF analysis");
        return provideFallbackPdfAnalysis(pdfUrl);
      }
      throw aiError;
    }
  } catch (error) {
    console.error('Error analyzing PDF:', error);
    try {
      // Try fallback as last resort
      return provideFallbackPdfAnalysis(pdfUrl);
    } catch (fallbackError) {
      throw new Error(`Failed to analyze PDF: ${(error as Error).message}`);
    }
  }
}

/**
 * Provides basic PDF analysis without AI
 * Used when OpenAI API is unavailable or quota is reached
 * 
 * @param pdfUrl URL to the PDF file
 * @returns Basic PDF analysis for app conversion
 */
function provideFallbackPdfAnalysis(pdfUrl: string): { analysis: string } {
  // Extract basic info from the PDF URL
  const pdfName = pdfUrl.split('/').pop() || "document.pdf";
  const fileName = pdfName.replace('.pdf', '');
  
  return {
    analysis: `
PDF Analysis Report (Fallback)

PDF Document: ${pdfName}
Estimated Content Structure:

1. General Structure
   - The PDF likely contains text, images, and possibly tables or diagrams
   - We recommend a responsive WebView layout to display the content
   - Pages should be handled as continuous scrolling rather than page-by-page

2. Conversion Strategy
   - Convert each page to a responsive HTML format
   - Add proper CSS for mobile display and readability
   - Ensure images and tables are scaled correctly
   - Add navigation controls (zoom, page jump, etc.)

3. Implementation Recommendations
   - Use a horizontally scrollable menu for chapter/section navigation
   - Implement pinch-to-zoom for detailed content viewing
   - Add search functionality for text content
   - Include night mode option for better readability in dark environments
   - Implement a progress bar showing relative position in the document

4. Mobile App Integration
   - The WebView should include proper JavaScript interfaces for app interaction
   - Add share functionality for specific pages or sections
   - Implement bookmarks for easy navigation to important parts
   - Add annotation features if required

Note: This is a generic analysis provided by the fallback mechanism. For a more accurate analysis, please provide a valid OpenAI API key or check your quota limits.
`
  };
}

/**
 * Optimizes HTML content for mobile viewing in an Android WebView
 * 
 * @param htmlContent Raw HTML content
 * @returns Optimized HTML with responsive design improvements
 */
export async function optimizeHtml(htmlContent: string): Promise<string> {
  try {
    // Check for API quota limit
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "quota_reached") {
      console.log("Using fallback HTML optimization due to API quota limitation");
      return addMobileOptimization(htmlContent);
    }
    
    // Craft a prompt for HTML optimization
    const prompt = `Optimize the following HTML content for display in an Android WebView.
Make it responsive, mobile-friendly, and ensure proper scaling.
Add any necessary meta tags and CSS for optimal mobile display.

HTML CONTENT:
${htmlContent}

Please provide only the optimized HTML code in your response, without any explanations or markdown formatting.`;

    try {
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
      });

      const content = response.choices[0].message.content;
      return content ? content : "";
    } catch (error) {
      const aiError = error as Error;
      console.error('OpenAI API error:', aiError);
      // If we hit quota limits, use the fallback
      if (aiError.message && aiError.message.includes("quota")) {
        console.log("API quota reached, using fallback HTML optimization");
        return addMobileOptimization(htmlContent);
      }
      throw aiError;
    }
  } catch (error) {
    console.error('Error optimizing HTML:', error);
    // Use fallback for any type of error
    try {
      return addMobileOptimization(htmlContent);
    } catch (fallbackError) {
      throw new Error(`Failed to optimize HTML: ${(error as Error).message}`);
    }
  }
}

/**
 * Fallback function to add basic mobile optimization to HTML
 * Used when OpenAI API is unavailable or quota is reached
 * 
 * @param htmlContent Original HTML content
 * @returns Basic mobile-optimized HTML
 */
function addMobileOptimization(htmlContent: string): string {
  try {
    // Check if the HTML already has a viewport meta tag
    const hasViewport = htmlContent.includes('<meta name="viewport"');
    
    // Basic responsive meta tags
    const metaTags = !hasViewport ? 
      '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">' : '';
    
    // Basic responsive CSS
    const responsiveCSS = `
<style>
  * { box-sizing: border-box; }
  body { 
    margin: 0; 
    padding: 10px; 
    font-size: 16px; 
    line-height: 1.5;
    font-family: Arial, sans-serif;
  }
  img, video, iframe { 
    max-width: 100% !important; 
    height: auto !important; 
  }
  table { 
    width: 100% !important; 
    display: block;
    overflow-x: auto;
  }
  @media (max-width: 768px) {
    body { font-size: 14px; }
    h1 { font-size: 1.8em; }
    h2 { font-size: 1.5em; }
  }
</style>`;
    
    // Insert the meta tags and CSS into the HTML
    if (htmlContent.includes('<head>')) {
      return htmlContent
        .replace('<head>', `<head>${metaTags}${responsiveCSS}`);
    } else if (htmlContent.includes('<html>')) {
      return htmlContent
        .replace('<html>', `<html><head>${metaTags}${responsiveCSS}</head>`);
    } else {
      return `<!DOCTYPE html>
<html>
<head>
  ${metaTags}
  ${responsiveCSS}
</head>
<body>
  ${htmlContent}
</body>
</html>`;
    }
  } catch (error) {
    console.error("Error in fallback HTML optimization:", error);
    // Return original content if the fallback fails
    return htmlContent;
  }
}