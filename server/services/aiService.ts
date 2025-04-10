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
    
    // Check for API quota limit
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "quota_reached") {
      console.log("Using fallback code validation due to API quota limitation");
      return performBasicCodeValidation(language, codeContent);
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
      // If we hit quota limits, use the fallback
      if (aiError.message && aiError.message.includes("quota")) {
        console.log("API quota reached, using fallback code validation");
        return performBasicCodeValidation(language, codeContent);
      }
      throw aiError;
    }
  } catch (error) {
    console.error('Error validating code:', error);
    try {
      // Extract language and content from codeData again in case they're lost in the catch block scope
      const { language, content } = codeData;
      const codeContent = content;
      
      // Fallback to basic validation
      return performBasicCodeValidation(language, codeContent);
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
    console.error('Error completing code:', error);
    throw new Error(`Failed to auto-complete code: ${(error as Error).message}`);
  }
}

/**
 * Analyzes a PDF document to extract structure for conversion
 * 
 * @param pdfUrl URL to the PDF file
 * @returns Analysis of the PDF structure for app conversion
 */
export async function analyzePdf(pdfUrl: string): Promise<any> {
  try {
    // Craft a prompt for PDF analysis
    const prompt = `Analyze the structure of a PDF document at ${pdfUrl} for conversion into an Android app.
Identify the main sections, layout, and content types for optimal display in a mobile app format.
Consider how the PDF content should be organized in a WebView-based application.`;

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
    console.error('Error analyzing PDF:', error);
    throw new Error(`Failed to analyze PDF: ${(error as Error).message}`);
  }
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