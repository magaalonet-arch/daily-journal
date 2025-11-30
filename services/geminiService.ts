import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysis } from "../types";

const API_KEY = process.env.API_KEY || ''; // In a real app, ensure this is handled securely

// We mock this if no API key is present for the demo to work without crashing, 
// but the prompt assumes we use valid Gemini implementation patterns.
// If the user hasn't provided a key, we'll return a helpful error object or mock data if we wanted to be lenient.
// For this strict adherence, we assume the environment has the key or we fail gracefully.

export const geminiService = {
  analyzeEntry: async (text: string): Promise<AIAnalysis> => {
    if (!API_KEY) {
      throw new Error("Gemini API Key is missing. Please set process.env.API_KEY.");
    }

    const ai = new GoogleGenAI({ apiKey: API_KEY });

    // Schema for structured output
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        sentiment: {
          type: Type.STRING,
          enum: ['Positive', 'Neutral', 'Negative', 'Mixed'],
          description: "The overall emotional tone of the journal entry."
        },
        summary: {
          type: Type.STRING,
          description: "A concise 1-sentence summary of the entry."
        },
        advice: {
          type: Type.STRING,
          description: "A short, philosophical or supportive piece of advice relevant to the entry."
        },
        tags: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "3-5 relevant thematic tags."
        }
      },
      required: ["sentiment", "summary", "advice", "tags"]
    };

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Analyze the following journal entry providing a sentiment, summary, supportive advice, and tags. 
        
        Entry: "${text}"`,
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          systemInstruction: "You are an empathetic, insightful journaling assistant. Your goal is to help the user reflect on their day.",
        }
      });

      if (response.text) {
        return JSON.parse(response.text) as AIAnalysis;
      }
      throw new Error("Empty response from AI");
    } catch (error) {
      console.error("Gemini analysis failed:", error);
      // Fallback for demo purposes if API fails
      throw error;
    }
  }
};