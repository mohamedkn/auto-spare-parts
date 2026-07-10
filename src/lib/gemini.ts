import { GoogleGenAI } from "@google/genai";

if (!process.env.GEMINI_API_KEY) {
  console.warn("⚠️ GEMINI_API_KEY is not set in environment variables");
}

// Initialize the Google Gen AI client
export const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

// Define model names for easy reference across the app
export const MODELS = {
  // Ultra-fast model for quick extractions, semantic search, and routing
  base: "gemini-2.5-flash",
  // Advanced model for complex reasoning or highly detailed visual OCR
  advanced: "gemini-2.5-pro",
};
