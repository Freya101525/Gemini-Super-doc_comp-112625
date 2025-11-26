import { GoogleGenAI, Type } from "@google/genai";
import { MindMapData } from "../types";

// Helper to initialize client, preferring user key but falling back to environment
const getClient = (userKey?: string | null) => {
  const apiKey = userKey || process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please provide it in settings or environment.");
  }
  return new GoogleGenAI({ apiKey });
};

export const transformToMindMapFormat = async (
  input: string, 
  userKey: string | null
): Promise<MindMapData> => {
  const ai = getClient(userKey);

  const prompt = `
    Analyze the following text and extract key entities and relationships to form a network graph/mind map.
    Return ONLY a JSON object with 'nodes' (array of {id, group}) and 'links' (array of {source, target, value}).
    Groups should be integers clustering related topics.
    Text: ${input.substring(0, 10000)}
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          nodes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                group: { type: Type.INTEGER },
              }
            }
          },
          links: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                source: { type: Type.STRING },
                target: { type: Type.STRING },
                value: { type: Type.NUMBER }
              }
            }
          }
        }
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  return JSON.parse(text);
};

export const runGeminiAgent = async (
  prompt: string,
  modelId: string,
  maxTokens: number,
  context: string,
  userKey: string | null
): Promise<string> => {
  const ai = getClient(userKey);

  // Handle "Thinking" model alias manually if needed, or use supported model
  let actualModel = modelId;
  let thinkingBudget = 0;

  if (modelId === 'gemini-2.5-flash-thinking') {
    actualModel = 'gemini-2.5-flash'; // Flash supports thinking
    thinkingBudget = 1024;
  }

  const response = await ai.models.generateContent({
    model: actualModel,
    contents: `Context:\n${context}\n\nTask:\n${prompt}`,
    config: {
      maxOutputTokens: maxTokens,
      thinkingConfig: thinkingBudget > 0 ? { thinkingBudget } : undefined,
    }
  });

  return response.text || "No output generated.";
};

export const compareDocuments = async (
  doc1: string,
  doc2: string,
  userKey: string | null
): Promise<string> => {
  const ai = getClient(userKey);
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Compare the following two documents. Highlight similarities, differences, and key insights.\n\nDoc 1:\n${doc1.substring(0, 5000)}\n\nDoc 2:\n${doc2.substring(0, 5000)}`,
  });
  return response.text || "Analysis failed.";
};

export const processSmartNote = async (
  text: string,
  userKey: string | null
): Promise<string> => {
  const ai = getClient(userKey);
  
  const prompt = `
    You are an expert editor and analyst. Process the following document.
    
    1. **Smart Formatting**: Keep ALL the original text, but reformat it into clean, professional Markdown. Use appropriate headers (#, ##), lists, bold text for emphasis, and code blocks where necessary to make it highly readable.
    
    2. **AI Summarize**: Add a section at the very top titled "# Executive Summary" containing a comprehensive summary of the document.
    
    3. **AI Keywords**: Add a section after the content titled "# Key Entities Analysis". Create a Markdown Table with columns: "Entity/Keyword", "Category", "Context/Description". Extract up to 20 key entities.
    
    4. **AI Questions**: Add a section at the very end titled "# Comprehensive Questions". Generate 20 comprehensive questions based on the document content that test understanding.

    Document Content:
    ${text.substring(0, 50000)}
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });

  return response.text || "Processing failed.";
};