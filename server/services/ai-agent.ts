import OpenAI from "openai";
import { GeminiService } from "./gemini-service";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  attachments?: FileAttachment[];
}

export interface FileAttachment {
  id: string;
  filename: string;
  type: 'document' | 'image' | 'audio' | 'video';
  url: string;
  analysisResults?: any;
}

export interface ClientAnalysisResult {
  clientId: string;
  insights: string[];
  recommendations: string[];
  nextActions: string[];
  riskFactors: string[];
  opportunities: string[];
  confidenceScore: number;
}

export class AIAgentService {
  /**
   * Process a chat message with AI agent capabilities
   */
  static async processMessage(
    message: string,
    context: {
      conversationHistory?: ChatMessage[];
      clientData?: any[];
      currentClient?: any;
      attachedFiles?: FileAttachment[];
    } = {}
  ): Promise<string> {
    try {
      // Build context-aware system prompt
      const systemPrompt = this.buildSystemPrompt(context);
      
      // Prepare messages for OpenAI
      const messages: any[] = [
        { role: 'system', content: systemPrompt }
      ];

      // Add conversation history
      if (context.conversationHistory) {
        context.conversationHistory.slice(-10).forEach(msg => {
          messages.push({
            role: msg.role,
            content: msg.content
          });
        });
      }

      // Add current message
      messages.push({ role: 'user', content: message });

      // Process with OpenAI - using gpt-5 as it's the latest model
      const response = await openai.chat.completions.create({
        model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages,
        max_tokens: 1000,
        temperature: 0.7,
      });

      return response.choices[0].message.content || "I'm sorry, I couldn't process your request.";
    } catch (error) {
      console.error('AI Agent processing error:', error);
      return "I encountered an error processing your request. Please try again.";
    }
  }

  /**
   * Analyze uploaded files using AI
   */
  static async analyzeFile(
    file: FileAttachment,
    analysisType: 'general' | 'client_document' | 'contract' | 'report' = 'general'
  ): Promise<any> {
    try {
      let analysisPrompt = '';
      
      switch (analysisType) {
        case 'client_document':
          analysisPrompt = 'Analyze this client document and extract key information including: client preferences, budget indicators, timeline requirements, decision-making factors, potential objections, and opportunities. Provide actionable insights for sales strategy.';
          break;
        case 'contract':
          analysisPrompt = 'Analyze this contract document and summarize: key terms, payment schedules, deliverables, timelines, risk factors, and important clauses. Highlight any concerns or opportunities.';
          break;
        case 'report':
          analysisPrompt = 'Analyze this report and provide: executive summary, key findings, trends, recommendations, and actionable insights for business decision-making.';
          break;
        default:
          analysisPrompt = 'Analyze this document and provide a comprehensive summary with key insights, important information, and actionable recommendations.';
      }

      if (file.type === 'image') {
        // For images, use vision model
        const response = await openai.chat.completions.create({
          model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: analysisPrompt },
                { type: "image_url", image_url: { url: file.url } }
              ],
            },
          ],
          max_tokens: 500,
        });

        return {
          type: 'image_analysis',
          summary: response.choices[0].message.content,
          insights: this.extractInsights(response.choices[0].message.content || ''),
          timestamp: new Date()
        };
      } else {
        // For documents, analyze text content (assuming it's been extracted)
        const response = await openai.chat.completions.create({
          model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
          messages: [
            { role: 'system', content: analysisPrompt },
            { role: 'user', content: `Please analyze this document: ${file.filename}` }
          ],
          max_tokens: 800,
        });

        return {
          type: 'document_analysis',
          summary: response.choices[0].message.content,
          insights: this.extractInsights(response.choices[0].message.content || ''),
          timestamp: new Date()
        };
      }
    } catch (error) {
      console.error('File analysis error:', error);
      return {
        type: 'error',
        summary: 'Failed to analyze file',
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  /**
   * Perform comprehensive client analysis
   */
  static async analyzeClient(
    client: any,
    interactions: any[] = [],
    messages: any[] = [],
    deals: any[] = []
  ): Promise<ClientAnalysisResult> {
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
        Analyze this client comprehensively and provide strategic insights:
        
        Client Profile: ${JSON.stringify(client, null, 2)}
        Recent Interactions: ${JSON.stringify(interactions.slice(-3), null, 2)}
        Recent Messages: ${JSON.stringify(messages.slice(-5), null, 2)}
        Active Deals: ${JSON.stringify(deals.filter((d: any) => d.stage !== 'closed'), null, 2)}
        
        Provide analysis in JSON format:
        {
          "insights": ["insight1", "insight2", ...],
          "recommendations": ["rec1", "rec2", ...],
          "nextActions": ["action1", "action2", ...],
          "riskFactors": ["risk1", "risk2", ...],
          "opportunities": ["opp1", "opp2", ...],
          "confidenceScore": 0.85
        }
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [
          { role: 'system', content: 'You are an expert sales analyst. Analyze client data and provide strategic insights in JSON format.' },
          { role: 'user', content: analysisPrompt }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000,
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');
      
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
      console.error('Client analysis error:', error);
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
   * Generate intelligent responses to voice/speech input
   */
  static async processVoiceInput(
    audioText: string,
    context: {
      currentClient?: any;
      recentActivity?: any[];
    } = {}
  ): Promise<string> {
    try {
      const voicePrompt = `
        You are a professional sales assistant. The user has spoken to you via voice input.
        Respond in a conversational, helpful manner. Keep responses concise but informative.
        
        User said: "${audioText}"
        
        ${context.currentClient ? `Current client context: ${context.currentClient.name} (${context.currentClient.status})` : ''}
        
        Provide a helpful, actionable response.
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [
          { role: 'system', content: 'You are a helpful sales assistant. Respond conversationally to voice input.' },
          { role: 'user', content: voicePrompt }
        ],
        max_tokens: 300,
        temperature: 0.8,
      });

      return response.choices[0].message.content || "I understand. How can I help you further?";
    } catch (error) {
      console.error('Voice processing error:', error);
      return "I didn't catch that. Could you please try again?";
    }
  }

  /**
   * Generate automated client outreach messages
   */
  static async generateOutreachMessage(
    client: any,
    context: {
      purpose: 'follow_up' | 'proposal' | 'check_in' | 'closing' | 'nurturing';
      recentActivity?: string;
      dealInfo?: any;
    }
  ): Promise<string> {
    try {
      const outreachPrompt = `
        Generate a personalized outreach message for this client:
        
        Client: ${client.name} (${client.status})
        Lead Score: ${client.leadScore || 0}
        Interests: ${client.interests || 'Not specified'}
        Last Interaction: ${client.lastInteraction ? new Date(client.lastInteraction).toDateString() : 'Never'}
        Purpose: ${context.purpose}
        Recent Activity: ${context.recentActivity || 'None'}
        
        Generate a professional, personalized message that:
        1. Addresses the client by name
        2. References their specific interests or situation
        3. Provides clear value
        4. Has a specific call-to-action
        5. Maintains a warm but professional tone
        
        Keep it concise (2-3 sentences max).
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [
          { role: 'system', content: 'You are an expert sales communication specialist. Generate personalized, effective outreach messages.' },
          { role: 'user', content: outreachPrompt }
        ],
        max_tokens: 200,
        temperature: 0.7,
      });

      return response.choices[0].message.content || `Hi ${client.name}, I wanted to follow up with you. How can I assist you today?`;
    } catch (error) {
      console.error('Outreach generation error:', error);
      return `Hi ${client.name}, I hope you're doing well. I wanted to reach out and see how I can help you achieve your goals.`;
    }
  }

  /**
   * Build context-aware system prompt
   */
  private static buildSystemPrompt(context: any): string {
    let prompt = `You are CLOSERT AI, an advanced business sales assistant similar to Manus.AI. You help manage client relationships, analyze business data, and provide strategic insights.

Your capabilities include:
- Client analysis and relationship management
- Sales forecasting and pipeline optimization
- Document analysis and insights
- Automated follow-up recommendations
- Business intelligence and reporting

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

Be helpful, professional, and provide actionable insights. When analyzing clients or business data, focus on practical recommendations that can improve sales performance and client relationships.`;

    return prompt;
  }

  /**
   * Extract key insights from AI responses
   */
  private static extractInsights(content: string): string[] {
    const insights: string[] = [];
    
    // Simple extraction of bullet points and key phrases
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
        insights.push(trimmed.substring(1).trim());
      } else if (trimmed.length > 20 && trimmed.includes(':')) {
        insights.push(trimmed);
      }
    }

    return insights.slice(0, 5); // Limit to top 5 insights
  }
}