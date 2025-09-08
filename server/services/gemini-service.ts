import * as fs from "fs";
import { GoogleGenAI, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface GeminiAnalysisResult {
  type: string;
  summary: string;
  insights: string[];
  timestamp: Date;
  confidence?: number;
}

export class GeminiService {
  /**
   * Process a chat message using Gemini
   */
  static async processMessage(
    message: string,
    context: {
      conversationHistory?: any[];
      clientData?: any[];
      currentClient?: any;
      attachedFiles?: any[];
    } = {}
  ): Promise<string> {
    try {
      // Build context-aware system prompt for Gemini
      const systemPrompt = this.buildSystemPrompt(context);
      
      const prompt = `${systemPrompt}\n\nUser: ${message}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      return response.text || "I'm sorry, I couldn't process your request.";
    } catch (error) {
      console.error('Gemini processing error:', error);
      return "I encountered an error processing your request. Please try again.";
    }
  }

  /**
   * Analyze text content with sentiment and insights
   */
  static async analyzeSentiment(text: string): Promise<{
    rating: number;
    confidence: number;
    insights: string[];
  }> {
    try {
      const systemPrompt = `You are a sentiment analysis expert. 
Analyze the sentiment of the text and provide a rating from 1 to 5 stars, 
a confidence score between 0 and 1, and key insights.
Respond with JSON in this format: 
{
  "rating": number, 
  "confidence": number, 
  "insights": ["insight1", "insight2", ...]
}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              rating: { type: "number" },
              confidence: { type: "number" },
              insights: { 
                type: "array",
                items: { type: "string" }
              }
            },
            required: ["rating", "confidence", "insights"],
          },
        },
        contents: text,
      });

      const rawJson = response.text;
      if (rawJson) {
        return JSON.parse(rawJson);
      } else {
        throw new Error("Empty response from model");
      }
    } catch (error) {
      console.error('Gemini sentiment analysis error:', error);
      return {
        rating: 3,
        confidence: 0.5,
        insights: ["Analysis failed due to technical error"]
      };
    }
  }

  /**
   * Analyze images using Gemini's vision capabilities
   */
  static async analyzeImage(imageData: string, prompt?: string): Promise<GeminiAnalysisResult> {
    try {
      const analysisPrompt = prompt || `Analyze this image in detail and describe its key elements, context,
and any notable aspects. Provide business-relevant insights if applicable.`;

      const contents = [
        {
          inlineData: {
            data: imageData,
            mimeType: "image/jpeg",
          },
        },
        analysisPrompt,
      ];

      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: contents,
      });

      const result = response.text || "";
      
      return {
        type: 'image_analysis',
        summary: result,
        insights: this.extractInsights(result),
        timestamp: new Date(),
        confidence: 0.9
      };
    } catch (error) {
      console.error('Gemini image analysis error:', error);
      return {
        type: 'error',
        summary: 'Failed to analyze image',
        insights: ['Image analysis failed'],
        timestamp: new Date()
      };
    }
  }

  /**
   * Analyze videos using Gemini
   */
  static async analyzeVideo(videoData: string): Promise<GeminiAnalysisResult> {
    try {
      const contents = [
        {
          inlineData: {
            data: videoData,
            mimeType: "video/mp4",
          },
        },
        `Analyze this video in detail and describe its key elements, context,
and any notable aspects. Focus on business-relevant insights.`,
      ];

      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: contents,
      });

      const result = response.text || "";
      
      return {
        type: 'video_analysis',
        summary: result,
        insights: this.extractInsights(result),
        timestamp: new Date(),
        confidence: 0.85
      };
    } catch (error) {
      console.error('Gemini video analysis error:', error);
      return {
        type: 'error',
        summary: 'Failed to analyze video',
        insights: ['Video analysis failed'],
        timestamp: new Date()
      };
    }
  }

  /**
   * Generate images using Gemini
   */
  static async generateImage(prompt: string): Promise<{ success: boolean; imageData?: string; error?: string }> {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-preview-image-generation",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.TEXT, Modality.IMAGE],
        },
      });

      const candidates = response.candidates;
      if (!candidates || candidates.length === 0) {
        return { success: false, error: "No image generated" };
      }

      const content = candidates[0].content;
      if (!content || !content.parts) {
        return { success: false, error: "No content in response" };
      }

      for (const part of content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return { 
            success: true, 
            imageData: part.inlineData.data 
          };
        }
      }

      return { success: false, error: "No image data found" };
    } catch (error) {
      console.error('Gemini image generation error:', error);
      return { 
        success: false, 
        error: `Failed to generate image: ${error}` 
      };
    }
  }

  /**
   * Comprehensive client analysis using Gemini
   */
  static async analyzeClient(
    client: any,
    interactions: any[] = [],
    messages: any[] = [],
    deals: any[] = []
  ): Promise<{
    clientId: string;
    insights: string[];
    recommendations: string[];
    nextActions: string[];
    riskFactors: string[];
    opportunities: string[];
    confidenceScore: number;
  }> {
    try {
      const clientContext = {
        profile: client,
        recentInteractions: interactions.slice(-5),
        recentMessages: messages.slice(-10),
        activeDeals: deals.filter((d: any) => d.stage !== 'closed'),
        leadScore: client.leadScore || 0,
        conversionProbability: client.conversionProbability || 0
      };

      const analysisPrompt = `
        Analyze this client comprehensively using advanced AI reasoning:
        
        Client Profile: ${JSON.stringify(client, null, 2)}
        Recent Interactions: ${JSON.stringify(interactions.slice(-3), null, 2)}
        Recent Messages: ${JSON.stringify(messages.slice(-5), null, 2)}
        Active Deals: ${JSON.stringify(deals.filter((d: any) => d.stage !== 'closed'), null, 2)}
        
        Provide strategic analysis in JSON format:
        {
          "insights": ["insight1", "insight2", ...],
          "recommendations": ["rec1", "rec2", ...],
          "nextActions": ["action1", "action2", ...],
          "riskFactors": ["risk1", "risk2", ...],
          "opportunities": ["opp1", "opp2", ...],
          "confidenceScore": 0.85
        }
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        config: {
          systemInstruction: 'You are an expert sales analyst. Analyze client data and provide strategic insights in JSON format.',
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              insights: { type: "array", items: { type: "string" } },
              recommendations: { type: "array", items: { type: "string" } },
              nextActions: { type: "array", items: { type: "string" } },
              riskFactors: { type: "array", items: { type: "string" } },
              opportunities: { type: "array", items: { type: "string" } },
              confidenceScore: { type: "number" }
            },
            required: ["insights", "recommendations", "nextActions", "riskFactors", "opportunities", "confidenceScore"],
          },
        },
        contents: analysisPrompt,
      });

      const analysis = JSON.parse(response.text || '{}');
      
      return {
        clientId: client.id,
        insights: analysis.insights || [],
        recommendations: analysis.recommendations || [],
        nextActions: analysis.nextActions || [],
        riskFactors: analysis.riskFactors || [],
        opportunities: analysis.opportunities || [],
        confidenceScore: analysis.confidenceScore || 0.5
      };
    } catch (error) {
      console.error('Gemini client analysis error:', error);
      return {
        clientId: client.id,
        insights: ['Analysis failed due to technical error'],
        recommendations: ['Retry analysis later'],
        nextActions: ['Contact technical support'],
        riskFactors: ['Analysis incomplete'],
        opportunities: [],
        confidenceScore: 0
      };
    }
  }

  /**
   * Summarize long documents or articles
   */
  static async summarizeDocument(text: string): Promise<string> {
    try {
      const prompt = `Please summarize the following document concisely while maintaining key points and actionable insights:\n\n${text}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      return response.text || "Summary could not be generated";
    } catch (error) {
      console.error('Gemini document summary error:', error);
      return "Failed to summarize document";
    }
  }

  /**
   * Build context-aware system prompt for Gemini
   */
  private static buildSystemPrompt(context: any): string {
    let prompt = `You are CLOSERT AI powered by Gemini, an advanced business sales assistant. You help manage client relationships, analyze business data, and provide strategic insights with Google's latest AI capabilities.

Your advanced capabilities include:
- Multimodal analysis (text, images, videos)
- Advanced reasoning and strategic thinking
- Real-time data processing and insights
- Creative problem-solving for business challenges

You have access to:`;

    if (context.clientData?.length > 0) {
      prompt += `\n- ${context.clientData.length} client profiles with lead scoring and conversion data`;
    }

    if (context.currentClient) {
      prompt += `\n- Current client: ${context.currentClient.name} (${context.currentClient.status})`;
      prompt += `\n- Lead Score: ${context.currentClient.leadScore || 0}/100`;
      prompt += `\n- Conversion Probability: ${Math.round((context.currentClient.conversionProbability || 0) * 100)}%`;
    }

    if (context.attachedFiles?.length > 0) {
      prompt += `\n- ${context.attachedFiles.length} attached files for analysis`;
    }

    prompt += `

Be helpful, professional, and provide actionable insights. Use your advanced reasoning capabilities to deliver strategic recommendations that can improve sales performance and client relationships. Think creatively and provide innovative solutions.`;

    return prompt;
  }

  /**
   * Extract key insights from Gemini responses
   */
  private static extractInsights(content: string): string[] {
    const insights: string[] = [];
    
    // Enhanced extraction with Gemini's structured output
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
        insights.push(trimmed.substring(1).trim());
      } else if (trimmed.length > 25 && (trimmed.includes(':') || trimmed.includes('insight') || trimmed.includes('recommendation'))) {
        insights.push(trimmed);
      }
    }

    return insights.slice(0, 6); // Limit to top 6 insights for Gemini
  }
}