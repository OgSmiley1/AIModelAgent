import { Client, Message, Interaction, Deal } from "@shared/schema";

interface ScoringFactors {
  engagementScore: number;
  behaviorScore: number;
  demographicScore: number;
  interactionQuality: number;
  timelineScore: number;
  budgetScore: number;
  authorityScore: number;
  needScore: number;
}

interface ScoringWeights {
  engagement: number;
  behavior: number;
  demographics: number;
  interaction: number;
  timeline: number;
  budget: number;
  authority: number;
  need: number;
}

export class LeadScoringService {
  private defaultWeights: ScoringWeights = {
    engagement: 0.25,    // How actively they engage
    behavior: 0.20,      // Their behavioral patterns
    demographics: 0.15,  // Fit with ideal customer profile
    interaction: 0.15,   // Quality of interactions
    timeline: 0.10,      // Urgency/timeline indicators
    budget: 0.10,        // Budget indicators
    authority: 0.05,     // Decision-making authority
    need: 0.10          // Expressed need/pain points
  };

  async calculateLeadScore(
    client: Client,
    messages: Message[] = [],
    interactions: Interaction[] = [],
    deals: Deal[] = []
  ): Promise<{ score: number; factors: ScoringFactors; insights: string[] }> {
    
    const factors: ScoringFactors = {
      engagementScore: this.calculateEngagementScore(client, messages, interactions),
      behaviorScore: this.calculateBehaviorScore(client, messages),
      demographicScore: this.calculateDemographicScore(client),
      interactionQuality: this.calculateInteractionQuality(interactions, messages),
      timelineScore: this.calculateTimelineScore(client, messages),
      budgetScore: this.calculateBudgetScore(client, messages),
      authorityScore: this.calculateAuthorityScore(client, messages),
      needScore: this.calculateNeedScore(messages, interactions)
    };

    // Calculate weighted score
    const score = Math.round(
      (factors.engagementScore * this.defaultWeights.engagement +
       factors.behaviorScore * this.defaultWeights.behavior +
       factors.demographicScore * this.defaultWeights.demographics +
       factors.interactionQuality * this.defaultWeights.interaction +
       factors.timelineScore * this.defaultWeights.timeline +
       factors.budgetScore * this.defaultWeights.budget +
       factors.authorityScore * this.defaultWeights.authority +
       factors.needScore * this.defaultWeights.need) * 100
    );

    const insights = this.generateInsights(factors, client);

    return { score: Math.min(100, Math.max(0, score)), factors, insights };
  }

  private calculateEngagementScore(client: Client, messages: Message[], interactions: Interaction[]): number {
    let score = 0;

    // Message frequency and recency
    const recentMessages = messages.filter(m => {
      const daysSince = (Date.now() - (m.timestamp?.getTime() || 0)) / (1000 * 60 * 60 * 24);
      return daysSince <= 30;
    });

    // Engagement frequency (messages per week)
    const messagesPerWeek = recentMessages.length / 4;
    if (messagesPerWeek >= 5) score += 30;
    else if (messagesPerWeek >= 2) score += 20;
    else if (messagesPerWeek >= 0.5) score += 10;

    // Response quality (longer messages indicate higher engagement)
    const avgMessageLength = messages.reduce((sum, m) => sum + m.content.length, 0) / Math.max(messages.length, 1);
    if (avgMessageLength > 100) score += 20;
    else if (avgMessageLength > 50) score += 10;

    // Total interactions
    if (client.totalInteractions >= 10) score += 30;
    else if (client.totalInteractions >= 5) score += 20;
    else if (client.totalInteractions >= 2) score += 10;

    // Recent activity boost
    const daysSinceLastInteraction = client.lastInteraction 
      ? (Date.now() - client.lastInteraction.getTime()) / (1000 * 60 * 60 * 24)
      : 999;
    
    if (daysSinceLastInteraction <= 1) score += 20;
    else if (daysSinceLastInteraction <= 7) score += 10;
    else if (daysSinceLastInteraction > 30) score -= 20;

    return Math.min(100, Math.max(0, score));
  }

  private calculateBehaviorScore(client: Client, messages: Message[]): number {
    let score = 0;

    // Sentiment analysis
    const avgSentiment = client.sentimentScore || 0;
    if (avgSentiment > 0.3) score += 25;
    else if (avgSentiment > 0) score += 15;
    else if (avgSentiment < -0.3) score -= 15;

    // Buying signals in messages
    const buyingSignals = this.detectBuyingSignals(messages);
    score += Math.min(30, buyingSignals.length * 10);

    // Conversion stage progression
    const stageScores = {
      'awareness': 10,
      'interest': 25,
      'consideration': 50,
      'intent': 75,
      'purchase': 100
    };
    score += stageScores[client.conversionStage as keyof typeof stageScores] || 0;

    // Consistency of engagement
    if (messages.length >= 5) {
      const timestamps = messages.map(m => m.timestamp?.getTime() || 0).sort();
      const intervals = [];
      for (let i = 1; i < timestamps.length; i++) {
        intervals.push(timestamps[i] - timestamps[i-1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
      
      // Consistent engagement gets a boost
      if (variance < avgInterval * 0.5) score += 15;
    }

    return Math.min(100, Math.max(0, score));
  }

  private calculateDemographicScore(client: Client): number {
    let score = 50; // Base score

    // Location scoring (assuming luxury markets)
    const highValueLocations = ['dubai', 'geneva', 'hong kong', 'singapore', 'monaco', 'zurich'];
    if (client.location && highValueLocations.some(loc => 
      client.location!.toLowerCase().includes(loc))) {
      score += 20;
    }

    // Priority level
    const priorityScores = {
      'vip': 30,
      'critical': 25,
      'high': 20,
      'medium': 10,
      'low': 0
    };
    score += priorityScores[client.priority as keyof typeof priorityScores] || 0;

    // Budget indicators
    if (client.budget && client.budget > 100000) score += 20;
    else if (client.budget && client.budget > 50000) score += 15;
    else if (client.budget && client.budget > 10000) score += 10;

    return Math.min(100, Math.max(0, score));
  }

  private calculateInteractionQuality(interactions: Interaction[], messages: Message[]): number {
    let score = 0;

    // Quality of interactions
    const positiveInteractions = interactions.filter(i => i.outcome === 'positive').length;
    const totalInteractions = interactions.length;
    
    if (totalInteractions > 0) {
      const positiveRatio = positiveInteractions / totalInteractions;
      score += positiveRatio * 40;
    }

    // Message sentiment consistency
    const positiveMessages = messages.filter(m => m.sentiment === 'positive').length;
    if (messages.length > 0) {
      const positiveMsgRatio = positiveMessages / messages.length;
      score += positiveMsgRatio * 30;
    }

    // Depth of conversations
    const deepConversations = messages.filter(m => m.content.length > 200).length;
    score += Math.min(30, deepConversations * 5);

    return Math.min(100, Math.max(0, score));
  }

  private calculateTimelineScore(client: Client, messages: Message[]): number {
    let score = 50; // Neutral base

    // Urgency keywords in recent messages
    const urgencyKeywords = ['urgent', 'soon', 'quickly', 'immediately', 'asap', 'now', 'this week', 'this month'];
    const recentMessages = messages.slice(-10);
    const urgencyMentions = recentMessages.reduce((count, msg) => {
      return count + urgencyKeywords.filter(keyword => 
        msg.content.toLowerCase().includes(keyword)).length;
    }, 0);

    if (urgencyMentions >= 3) score += 30;
    else if (urgencyMentions >= 1) score += 15;

    // Timeline indicators
    if (client.timeframe) {
      const timeframeScores = {
        'immediate': 40,
        'short_term': 30,
        'medium_term': 15,
        'long_term': 5
      };
      score += timeframeScores[client.timeframe as keyof typeof timeframeScores] || 0;
    }

    // Follow-up requirements
    if (client.followUpRequired) score += 10;

    return Math.min(100, Math.max(0, score));
  }

  private calculateBudgetScore(client: Client, messages: Message[]): number {
    let score = 0;

    // Explicit budget mentioned
    if (client.budget) {
      if (client.budget >= 500000) score += 40;
      else if (client.budget >= 100000) score += 30;
      else if (client.budget >= 50000) score += 20;
      else if (client.budget >= 10000) score += 10;
    }

    // Budget-related keywords in messages
    const budgetKeywords = ['budget', 'investment', 'price', 'cost', 'afford', 'spend', 'value'];
    const budgetMentions = messages.reduce((count, msg) => {
      return count + budgetKeywords.filter(keyword => 
        msg.content.toLowerCase().includes(keyword)).length;
    }, 0);

    score += Math.min(20, budgetMentions * 5);

    // Price sensitivity indicators
    const pricePositiveKeywords = ['worth it', 'investment', 'quality', 'value'];
    const priceNegativeKeywords = ['expensive', 'too much', 'cheaper', 'discount'];
    
    const positivePrice = messages.reduce((count, msg) => {
      return count + pricePositiveKeywords.filter(keyword => 
        msg.content.toLowerCase().includes(keyword)).length;
    }, 0);

    const negativePrice = messages.reduce((count, msg) => {
      return count + priceNegativeKeywords.filter(keyword => 
        msg.content.toLowerCase().includes(keyword)).length;
    }, 0);

    score += positivePrice * 10 - negativePrice * 5;

    return Math.min(100, Math.max(0, score));
  }

  private calculateAuthorityScore(client: Client, messages: Message[]): number {
    let score = 50; // Base assumption

    // Decision maker flag
    if (client.decisionMaker) score += 30;

    // Authority keywords
    const authorityKeywords = ['decide', 'decision', 'approve', 'authorize', 'my team', 'we need', 'board approval'];
    const authorityMentions = messages.reduce((count, msg) => {
      return count + authorityKeywords.filter(keyword => 
        msg.content.toLowerCase().includes(keyword)).length;
    }, 0);

    score += Math.min(20, authorityMentions * 10);

    // Influence indicators
    const influenceKeywords = ['ceo', 'director', 'manager', 'owner', 'founder', 'head of'];
    const influenceMentions = messages.reduce((count, msg) => {
      return count + influenceKeywords.filter(keyword => 
        msg.content.toLowerCase().includes(keyword)).length;
    }, 0);

    score += Math.min(20, influenceMentions * 10);

    return Math.min(100, Math.max(0, score));
  }

  private calculateNeedScore(messages: Message[], interactions: Interaction[]): number {
    let score = 0;

    // Pain points and needs keywords
    const needKeywords = ['problem', 'issue', 'challenge', 'need', 'solution', 'help', 'improve', 'better'];
    const needMentions = messages.reduce((count, msg) => {
      return count + needKeywords.filter(keyword => 
        msg.content.toLowerCase().includes(keyword)).length;
    }, 0);

    score += Math.min(40, needMentions * 5);

    // Specific solution inquiries
    const solutionKeywords = ['how does', 'can you', 'do you offer', 'what about', 'features', 'capabilities'];
    const solutionMentions = messages.reduce((count, msg) => {
      return count + solutionKeywords.filter(keyword => 
        msg.content.toLowerCase().includes(keyword)).length;
    }, 0);

    score += Math.min(30, solutionMentions * 10);

    // Competition mentions
    const competitionKeywords = ['competitor', 'alternative', 'compare', 'vs', 'versus', 'other options'];
    const competitionMentions = messages.reduce((count, msg) => {
      return count + competitionKeywords.filter(keyword => 
        msg.content.toLowerCase().includes(keyword)).length;
    }, 0);

    score += Math.min(30, competitionMentions * 15);

    return Math.min(100, Math.max(0, score));
  }

  private detectBuyingSignals(messages: Message[]): string[] {
    const signals: string[] = [];
    const buyingSignalPatterns = {
      'pricing_inquiry': ['price', 'cost', 'pricing', 'how much', 'quote'],
      'timeline_urgency': ['when', 'timeline', 'soon', 'quickly', 'deadline'],
      'decision_process': ['decide', 'decision', 'choose', 'select', 'approve'],
      'comparison_shopping': ['compare', 'vs', 'alternative', 'competitor'],
      'implementation_questions': ['how to', 'implement', 'setup', 'install'],
      'team_involvement': ['team', 'colleagues', 'discuss', 'meeting'],
      'budget_allocation': ['budget', 'invest', 'purchase', 'buy'],
      'trial_request': ['trial', 'demo', 'test', 'try'],
      'specific_features': ['features', 'capabilities', 'functionality'],
      'support_questions': ['support', 'training', 'help', 'assistance']
    };

    const allText = messages.map(m => m.content).join(' ').toLowerCase();

    for (const [signal, keywords] of Object.entries(buyingSignalPatterns)) {
      if (keywords.some(keyword => allText.includes(keyword))) {
        signals.push(signal);
      }
    }

    return signals;
  }

  private generateInsights(factors: ScoringFactors, client: Client): string[] {
    const insights: string[] = [];

    if (factors.engagementScore > 70) {
      insights.push("High engagement level - actively communicating and responding");
    } else if (factors.engagementScore < 30) {
      insights.push("Low engagement - may need re-engagement strategy");
    }

    if (factors.behaviorScore > 70) {
      insights.push("Strong buying signals detected in behavior patterns");
    }

    if (factors.budgetScore > 60) {
      insights.push("Budget qualification looks positive");
    } else if (factors.budgetScore < 30) {
      insights.push("Budget concerns may need to be addressed");
    }

    if (factors.timelineScore > 70) {
      insights.push("Urgent timeline - high priority for immediate follow-up");
    }

    if (factors.authorityScore < 40) {
      insights.push("May need to identify decision makers");
    }

    if (factors.needScore > 60) {
      insights.push("Clear pain points identified - good fit for solution");
    }

    if (client.conversionStage === 'intent' || client.conversionStage === 'consideration') {
      insights.push("Client in active evaluation phase");
    }

    return insights;
  }

  async predictConversionProbability(client: Client, historicalData: any[]): Promise<number> {
    // Simplified ML-style prediction based on multiple factors
    let probability = 0.5; // Base probability

    // Lead score influence
    const leadScore = client.leadScore || 0;
    probability += (leadScore - 50) / 100 * 0.3;

    // Engagement level influence
    const engagementMultiplier = {
      'very_high': 0.25,
      'high': 0.15,
      'medium': 0.05,
      'low': -0.1
    };
    probability += engagementMultiplier[client.engagementLevel as keyof typeof engagementMultiplier] || 0;

    // Stage influence
    const stageMultiplier = {
      'awareness': -0.2,
      'interest': 0,
      'consideration': 0.15,
      'intent': 0.25,
      'purchase': 0.4
    };
    probability += stageMultiplier[client.conversionStage as keyof typeof stageMultiplier] || 0;

    // Time factor (fresher leads have higher probability)
    const daysSinceCreation = (Date.now() - (client.createdAt?.getTime() || Date.now())) / (1000 * 60 * 60 * 24);
    if (daysSinceCreation <= 7) probability += 0.1;
    else if (daysSinceCreation <= 30) probability += 0.05;
    else if (daysSinceCreation > 90) probability -= 0.1;

    return Math.min(1, Math.max(0, probability));
  }

  generateNextBestAction(client: Client, factors: ScoringFactors): string {
    // Determine best next action based on scoring factors
    
    if (factors.engagementScore < 30) {
      return "Re-engagement campaign - send value-added content";
    }
    
    if (factors.budgetScore < 40 && factors.needScore > 60) {
      return "Address budget concerns with ROI presentation";
    }
    
    if (factors.timelineScore > 70) {
      return "Schedule immediate demo or proposal meeting";
    }
    
    if (factors.authorityScore < 40) {
      return "Identify and connect with decision makers";
    }
    
    if (client.conversionStage === 'consideration' && factors.interactionQuality > 60) {
      return "Send detailed proposal with case studies";
    }
    
    if (client.conversionStage === 'intent') {
      return "Schedule closing conversation and address final concerns";
    }
    
    if (factors.needScore > 70 && factors.behaviorScore > 60) {
      return "Book product demonstration or pilot program";
    }
    
    return "Continue nurturing with relevant content and regular check-ins";
  }
}

export const leadScoringService = new LeadScoringService();