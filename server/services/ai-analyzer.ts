import { Message, Client } from "@shared/schema";

interface SentimentAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number; // -1 to 1
  confidence: number;
}

interface ConversationAnalysis {
  intent: 'inquiry' | 'complaint' | 'support' | 'sales' | 'casual';
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  topics: string[];
  keyPhrases: string[];
  actionRequired: boolean;
  suggestedResponse?: string;
}

interface ClientProfile {
  interests: string[];
  preferences: Record<string, any>;
  behaviorPatterns: Record<string, any>;
  communicationStyle: string;
  timezone?: string;
  responseTimePreference?: string;
}

export class AIAnalyzerService {
  private sentimentKeywords = {
    positive: ['great', 'excellent', 'amazing', 'perfect', 'love', 'thank you', 'thanks', 'awesome', 'wonderful', 'fantastic'],
    negative: ['terrible', 'awful', 'hate', 'horrible', 'worst', 'angry', 'frustrated', 'disappointed', 'upset', 'annoyed'],
  };

  private urgencyKeywords = {
    urgent: ['urgent', 'emergency', 'asap', 'immediately', 'now', 'critical'],
    high: ['soon', 'quickly', 'fast', 'important', 'priority'],
  };

  private intentKeywords = {
    inquiry: ['question', 'ask', 'wondering', 'curious', 'information', 'details'],
    complaint: ['problem', 'issue', 'wrong', 'error', 'not working', 'broken'],
    support: ['help', 'support', 'assistance', 'guide', 'tutorial'],
    sales: ['buy', 'purchase', 'price', 'cost', 'order', 'payment'],
  };

  analyzeSentiment(text: string): SentimentAnalysis {
    const words = text.toLowerCase().split(/\s+/);
    let positiveScore = 0;
    let negativeScore = 0;

    for (const word of words) {
      if (this.sentimentKeywords.positive.includes(word)) {
        positiveScore++;
      } else if (this.sentimentKeywords.negative.includes(word)) {
        negativeScore++;
      }
    }

    const totalWords = words.length;
    const netScore = (positiveScore - negativeScore) / Math.max(totalWords, 1);
    
    let sentiment: 'positive' | 'neutral' | 'negative';
    if (netScore > 0.1) sentiment = 'positive';
    else if (netScore < -0.1) sentiment = 'negative';
    else sentiment = 'neutral';

    return {
      sentiment,
      score: Math.max(-1, Math.min(1, netScore * 5)), // Scale to -1 to 1
      confidence: Math.min(1, (positiveScore + negativeScore) / Math.max(totalWords, 1) * 10)
    };
  }

  analyzeConversation(messages: Message[]): ConversationAnalysis {
    const recentMessages = messages.slice(-5); // Analyze last 5 messages
    const combinedText = recentMessages.map(m => m.content).join(' ').toLowerCase();
    
    // Determine intent
    let intent: ConversationAnalysis['intent'] = 'casual';
    let maxScore = 0;
    
    for (const [intentType, keywords] of Object.entries(this.intentKeywords)) {
      const score = keywords.reduce((acc, keyword) => 
        acc + (combinedText.includes(keyword) ? 1 : 0), 0);
      if (score > maxScore) {
        maxScore = score;
        intent = intentType as ConversationAnalysis['intent'];
      }
    }

    // Determine urgency
    let urgency: ConversationAnalysis['urgency'] = 'medium';
    if (this.urgencyKeywords.urgent.some(keyword => combinedText.includes(keyword))) {
      urgency = 'urgent';
    } else if (this.urgencyKeywords.high.some(keyword => combinedText.includes(keyword))) {
      urgency = 'high';
    } else if (combinedText.includes('whenever') || combinedText.includes('no rush')) {
      urgency = 'low';
    }

    // Extract topics and key phrases (simplified)
    const topics = this.extractTopics(combinedText);
    const keyPhrases = this.extractKeyPhrases(combinedText);

    // Determine if action is required
    const actionRequired = intent !== 'casual' && urgency !== 'low';

    // Generate suggested response
    const suggestedResponse = actionRequired ? this.generateResponse(intent, urgency, topics) : undefined;

    return {
      intent,
      urgency,
      topics,
      keyPhrases,
      actionRequired,
      suggestedResponse
    };
  }

  private extractTopics(text: string): string[] {
    const topicKeywords = {
      'product': ['product', 'item', 'feature', 'service'],
      'pricing': ['price', 'cost', 'payment', 'billing', 'fee'],
      'support': ['help', 'support', 'issue', 'problem'],
      'delivery': ['delivery', 'shipping', 'order', 'package'],
      'technical': ['technical', 'bug', 'error', 'not working']
    };

    const topics: string[] = [];
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        topics.push(topic);
      }
    }
    return topics;
  }

  private extractKeyPhrases(text: string): string[] {
    // Simplified key phrase extraction
    const sentences = text.split(/[.!?]+/);
    return sentences
      .filter(sentence => sentence.trim().length > 10 && sentence.trim().length < 100)
      .map(sentence => sentence.trim())
      .slice(0, 3);
  }

  private generateResponse(intent: string, urgency: string, topics: string[]): string {
    const urgencyPrefix = urgency === 'urgent' ? "I understand this is urgent. " : "";
    
    const responseTemplates = {
      inquiry: "Thank you for your inquiry. I'd be happy to help you with information about our services.",
      complaint: "I sincerely apologize for the inconvenience. Let me look into this matter right away and find a solution for you.",
      support: "I'm here to help you with any support you need. Could you please provide more details about the specific issue?",
      sales: "Thank you for your interest in our products. I'd be happy to discuss our offerings and help you find the perfect solution.",
      casual: "Thanks for reaching out! I'm here if you need anything."
    };

    const baseResponse = responseTemplates[intent as keyof typeof responseTemplates] || responseTemplates.casual;
    
    return urgencyPrefix + baseResponse;
  }

  analyzeClientProfile(client: Client, messages: Message[], interactions: any[]): ClientProfile {
    const allText = messages.map(m => m.content).join(' ').toLowerCase();
    
    // Extract interests based on message content
    const interests = this.extractInterests(allText);
    
    // Analyze communication patterns
    const behaviorPatterns = this.analyzeBehaviorPatterns(messages, interactions);
    
    // Determine communication style
    const communicationStyle = this.determineCommunicationStyle(messages);

    return {
      interests,
      preferences: client.preferences || {},
      behaviorPatterns,
      communicationStyle,
    };
  }

  private extractInterests(text: string): string[] {
    const interestCategories = {
      'technology': ['tech', 'software', 'app', 'digital', 'automation'],
      'business': ['business', 'enterprise', 'company', 'corporate'],
      'premium': ['premium', 'luxury', 'high-end', 'exclusive'],
      'efficiency': ['efficiency', 'productivity', 'optimization', 'streamline'],
      'analytics': ['analytics', 'data', 'insights', 'reporting']
    };

    const interests: string[] = [];
    for (const [category, keywords] of Object.entries(interestCategories)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        interests.push(category);
      }
    }
    return interests;
  }

  private analyzeBehaviorPatterns(messages: Message[], interactions: any[]): Record<string, any> {
    const totalMessages = messages.length;
    const averageMessageLength = messages.reduce((sum, msg) => sum + msg.content.length, 0) / totalMessages;
    
    // Analyze response time patterns (if we have timestamps)
    const responseTimePattern = this.analyzeResponseTimes(messages);
    
    // Analyze interaction frequency
    const interactionFrequency = interactions.length / Math.max(1, this.daysSinceFirstInteraction(interactions));

    return {
      totalMessages,
      averageMessageLength,
      responseTimePattern,
      interactionFrequency,
      preferredContactMethod: 'whatsapp' // Default since we're analyzing WhatsApp messages
    };
  }


  private analyzeResponseTimes(messages: Message[]): string {
    // Simplified - would need more sophisticated analysis with actual timestamps
    const timestamps = messages
      .filter(m => m.timestamp)
      .map(m => m.timestamp!.getHours());
    
    if (timestamps.length === 0) return 'unknown';
    
    const avgHour = timestamps.reduce((sum, hour) => sum + hour, 0) / timestamps.length;
    
    if (avgHour >= 9 && avgHour <= 17) return 'business_hours';
    else if (avgHour >= 18 && avgHour <= 22) return 'evening';
    else return 'flexible';
  }

  private daysSinceFirstInteraction(interactions: any[]): number {
    if (interactions.length === 0) return 1;
    
    const firstInteraction = interactions[interactions.length - 1]?.timestamp || new Date();
    const now = new Date();
    return Math.max(1, Math.ceil((now.getTime() - firstInteraction.getTime()) / (1000 * 60 * 60 * 24)));
  }

  private determineCommunicationStyle(messages: Message[]): string {
    const totalLength = messages.reduce((sum, msg) => sum + msg.content.length, 0);
    const avgLength = totalLength / Math.max(1, messages.length);
    
    if (avgLength > 200) return 'detailed';
    else if (avgLength < 50) return 'concise';
    else return 'balanced';
  }

  generateFollowUpSuggestions(client: Client, recentActivity: any): Array<{
    type: string;
    title: string;
    scheduledFor: Date;
    priority: string;
  }> {
    const suggestions: Array<{
      type: string;
      title: string;
      scheduledFor: Date;
      priority: string;
    }> = [];
    
    const now = new Date();
    const lastInteraction = client.lastInteraction || now;
    const daysSinceLastInteraction = Math.ceil((now.getTime() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24));
    
    // Suggest follow-up based on time since last interaction
    if (daysSinceLastInteraction > 7) {
      suggestions.push({
        type: 'check_in',
        title: 'Regular check-in follow-up',
        scheduledFor: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
        priority: 'medium'
      });
    }
    
    // Suggest follow-up based on client priority
    if (client.priority === 'vip' || client.priority === 'critical') {
      suggestions.push({
        type: 'priority_follow_up',
        title: 'VIP client priority follow-up',
        scheduledFor: new Date(now.getTime() + 4 * 60 * 60 * 1000), // 4 hours
        priority: 'high'
      });
    }
    
    return suggestions;
  }
}

export const aiAnalyzer = new AIAnalyzerService();
