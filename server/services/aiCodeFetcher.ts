import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Fetch code using AI based on a user prompt
 * @param language Programming language to generate (html, css, javascript, java, python, etc.)
 * @param prompt User's description of what they want the code to do
 * @returns Generated code with explanation
 */
export async function fetchCodeWithAI(language: string, prompt: string): Promise<{
  code: string;
  explanation: string;
  language: string;
}> {
  try {
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert ${language} developer. Generate clean, well-documented, and efficient ${language} code based on the user's request. Return only valid, working code with explanations.`,
        },
        {
          role: "user",
          content: `Generate ${language} code for the following request: ${prompt}. 
          Please provide the code in a format that can be directly used in an Android application.
          If it's an HTML/CSS project, ensure it's mobile responsive.
          If it's Java, ensure it's compatible with Android SDK.
          If it's Python, ensure it works with Chaquopy for Android.
          Provide a brief explanation of how the code works.`,
        },
      ],
      response_format: { type: "json_object" },
    });

    // Check if content is available and parse it
    const content = response.choices[0].message.content;
    let result: any = {};
    
    if (content) {
      result = JSON.parse(content);
    }
    
    // If result is already structured correctly, return it
    if (result.code && result.explanation) {
      return {
        code: result.code,
        explanation: result.explanation,
        language
      };
    }
    
    // Otherwise, try to extract code and explanation from the response
    return {
      code: result.code || "// No code was generated",
      explanation: result.explanation || "No explanation provided",
      language
    };
  } catch (error: unknown) {
    console.error("Error fetching code with AI:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to generate ${language} code: ${errorMessage}`);
  }
}

/**
 * Analyze and improve existing code using AI
 * @param language Programming language of the code
 * @param code Existing code to analyze and improve
 * @returns Improved code with explanation of changes
 */
export async function improveCodeWithAI(language: string, code: string): Promise<{
  improvedCode: string;
  explanation: string;
  language: string;
}> {
  try {
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert ${language} developer. Analyze the provided code, identify any issues or improvements, and return an improved version with explanations.`,
        },
        {
          role: "user",
          content: `Analyze and improve the following ${language} code. Make it more efficient, readable, and ensure it's mobile/Android compatible:
          
          ${code}
          
          Provide the improved code and explain your changes.`,
        },
      ],
      response_format: { type: "json_object" },
    });

    // Check if content is available and parse it
    const content = response.choices[0].message.content;
    let result: any = {};
    
    if (content) {
      result = JSON.parse(content);
    }
    
    return {
      improvedCode: result.improvedCode || result.code || code,
      explanation: result.explanation || "No explanation provided",
      language
    };
  } catch (error: unknown) {
    console.error("Error improving code with AI:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to improve ${language} code: ${errorMessage}`);
  }
}