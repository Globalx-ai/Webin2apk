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
    const { language, content: codeContent } = codeData;
    
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
    console.error('Error validating code:', error);
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
    // Craft a prompt for HTML optimization
    const prompt = `Optimize the following HTML content for display in an Android WebView.
Make it responsive, mobile-friendly, and ensure proper scaling.
Add any necessary meta tags and CSS for optimal mobile display.

HTML CONTENT:
${htmlContent}

Please provide only the optimized HTML code in your response, without any explanations or markdown formatting.`;

    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.choices[0].message.content;
    return content ? content : "";
  } catch (error) {
    console.error('Error optimizing HTML:', error);
    throw new Error(`Failed to optimize HTML: ${(error as Error).message}`);
  }
}