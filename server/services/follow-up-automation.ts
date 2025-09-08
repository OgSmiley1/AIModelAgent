export interface FollowUpRecommendation {
  type: 'reminder' | 'call' | 'email' | 'meeting' | 'task';
  priority: 'low' | 'medium' | 'high';
  suggestedDate: Date;
  reason: string;
  automatedMessage?: string;
  clientId: string;
}

export interface EngagementMetrics {
  totalTouches: number;
  lastEngagement: Date;
  engagementFrequency: number; // touches per week
  responseRate: number;
  preferredChannel: 'whatsapp' | 'email' | 'phone' | 'chat';
  bestTimeToContact: {
    dayOfWeek: number; // 0-6 (Sunday-Saturday)
    hour: number; // 0-23
  };
}

export class FollowUpAutomationService {
  /**
   * Generate intelligent follow-up recommendations based on client behavior
   */
  static generateFollowUpRecommendations(
    client: any,
    interactions: any[] = [],
    deals: any[] = []
  ): FollowUpRecommendation[] {
    const recommendations: FollowUpRecommendation[] = [];
    const now = new Date();
    
    // Get client's active deals
    const activeDeals = deals.filter(d => d.clientId === client.id && d.stage !== 'closed');
    
    // Calculate days since last interaction
    const daysSinceLastInteraction = client.lastInteraction 
      ? Math.floor((now.getTime() - new Date(client.lastInteraction).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    // High-value client follow-up
    if (client.lifetimeValue > 100000 && daysSinceLastInteraction > 7) {
      recommendations.push({
        type: 'call',
        priority: 'high',
        suggestedDate: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
        reason: 'High-value client requires regular touchpoints',
        automatedMessage: `Follow up with ${client.name} - high-value client (${client.lifetimeValue.toLocaleString()})`,
        clientId: client.id
      });
    }

    // Lead scoring based follow-up
    if ((client.leadScore || 0) > 80 && daysSinceLastInteraction > 3) {
      recommendations.push({
        type: 'call',
        priority: 'high',
        suggestedDate: new Date(now.getTime() + 12 * 60 * 60 * 1000), // 12 hours
        reason: 'High lead score indicates strong interest - strike while hot',
        automatedMessage: `Urgent: High-score lead ${client.name} ready for conversion`,
        clientId: client.id
      });
    }

    // Deal stage follow-up
    activeDeals.forEach(deal => {
      if (deal.stage === 'negotiation' && daysSinceLastInteraction > 2) {
        recommendations.push({
          type: 'call',
          priority: 'high',
          suggestedDate: new Date(now.getTime() + 6 * 60 * 60 * 1000), // 6 hours
          reason: `Deal in negotiation stage requires immediate attention`,
          automatedMessage: `Critical: ${deal.title} negotiation requires follow-up`,
          clientId: client.id
        });
      }
      
      if (deal.stage === 'proposal' && daysSinceLastInteraction > 5) {
        recommendations.push({
          type: 'email',
          priority: 'medium',
          suggestedDate: new Date(now.getTime() + 24 * 60 * 60 * 1000),
          reason: 'Proposal submitted - check for questions or concerns',
          automatedMessage: `Follow up on proposal: ${deal.title}`,
          clientId: client.id
        });
      }
    });

    // Conversion probability follow-up
    if ((client.conversionProbability || 0) > 0.7 && daysSinceLastInteraction > 4) {
      recommendations.push({
        type: 'meeting',
        priority: 'high',
        suggestedDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days
        reason: 'High conversion probability - schedule close meeting',
        automatedMessage: `Schedule closing meeting with ${client.name} (${Math.round((client.conversionProbability || 0) * 100)}% conversion probability)`,
        clientId: client.id
      });
    }

    // Risk mitigation follow-up
    if (client.riskFactors && client.riskFactors.length > 0) {
      recommendations.push({
        type: 'task',
        priority: 'medium',
        suggestedDate: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        reason: 'Address identified risk factors',
        automatedMessage: `Address risks for ${client.name}: ${client.riskFactors.join(', ')}`,
        clientId: client.id
      });
    }

    // Long-term nurturing
    if (client.status === 'prospect' && daysSinceLastInteraction > 14) {
      recommendations.push({
        type: 'email',
        priority: 'low',
        suggestedDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        reason: 'Long-term prospect nurturing',
        automatedMessage: `Nurture prospect ${client.name} - provide value-added content`,
        clientId: client.id
      });
    }

    // VIP client maintenance
    if (client.status === 'vip' && daysSinceLastInteraction > 10) {
      recommendations.push({
        type: 'call',
        priority: 'medium',
        suggestedDate: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        reason: 'VIP client relationship maintenance',
        automatedMessage: `VIP client check-in: ${client.name}`,
        clientId: client.id
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Calculate engagement metrics for a client
   */
  static calculateEngagementMetrics(
    client: any,
    interactions: any[] = [],
    messages: any[] = []
  ): EngagementMetrics {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Filter recent interactions and messages
    const recentInteractions = interactions.filter(i => 
      i.clientId === client.id && new Date(i.timestamp) > thirtyDaysAgo
    );
    const recentMessages = messages.filter(m => 
      m.clientId === client.id && new Date(m.timestamp) > thirtyDaysAgo
    );

    // Calculate total touches
    const totalTouches = recentInteractions.length + recentMessages.length;

    // Calculate last engagement
    const allEngagements = [...recentInteractions, ...recentMessages]
      .map(e => new Date(e.timestamp))
      .sort((a, b) => b.getTime() - a.getTime());
    
    const lastEngagement = allEngagements[0] || new Date(client.lastInteraction || now);

    // Calculate engagement frequency (touches per week)
    const engagementFrequency = totalTouches * (7 / 30); // Convert monthly to weekly

    // Calculate response rate
    const outgoingMessages = recentMessages.filter(m => m.direction === 'outgoing');
    const incomingMessages = recentMessages.filter(m => m.direction === 'incoming');
    const responseRate = outgoingMessages.length > 0 
      ? incomingMessages.length / outgoingMessages.length 
      : 0;

    // Determine preferred channel
    const channelCounts = recentMessages.reduce((acc: any, msg) => {
      acc[msg.platform] = (acc[msg.platform] || 0) + 1;
      return acc;
    }, {});
    const preferredChannel = Object.keys(channelCounts).reduce((a, b) => 
      channelCounts[a] > channelCounts[b] ? a : b, 'whatsapp'
    ) as 'whatsapp' | 'email' | 'phone' | 'chat';

    // Calculate best time to contact
    const messageTimes = recentMessages.map(m => {
      const date = new Date(m.timestamp);
      return {
        dayOfWeek: date.getDay(),
        hour: date.getHours()
      };
    });

    const bestTime = messageTimes.length > 0 
      ? messageTimes.reduce((acc, time) => {
          // Simple heuristic: find most common hour
          const hourCounts = messageTimes.reduce((hc: any, t) => {
            hc[t.hour] = (hc[t.hour] || 0) + 1;
            return hc;
          }, {});
          const bestHour = Object.keys(hourCounts).reduce((a, b) => 
            hourCounts[a] > hourCounts[b] ? a : b
          );
          
          // Find most common day
          const dayCounts = messageTimes.reduce((dc: any, t) => {
            dc[t.dayOfWeek] = (dc[t.dayOfWeek] || 0) + 1;
            return dc;
          }, {});
          const bestDay = Object.keys(dayCounts).reduce((a, b) => 
            dayCounts[a] > dayCounts[b] ? a : b
          );

          return {
            dayOfWeek: parseInt(bestDay),
            hour: parseInt(bestHour)
          };
        }, { dayOfWeek: 2, hour: 10 }) // Default: Tuesday 10 AM
      : { dayOfWeek: 2, hour: 10 };

    return {
      totalTouches,
      lastEngagement,
      engagementFrequency,
      responseRate: Math.min(responseRate, 1), // Cap at 100%
      preferredChannel,
      bestTimeToContact: bestTime
    };
  }

  /**
   * Generate automated follow-up messages based on context
   */
  static generateAutomatedMessage(
    client: any,
    followUpType: string,
    context: any = {}
  ): string {
    const templates = {
      'high_lead_score': [
        `Hi ${client.name}, I noticed you've been actively researching our solutions. Would you like to schedule a quick call to discuss how we can help?`,
        `${client.name}, based on your recent activity, you seem very interested in our offering. Let's connect to answer any questions you might have.`,
        `Hello ${client.name}, I'd love to continue our conversation about how our solution can benefit your business. Are you available for a brief call?`
      ],
      'deal_negotiation': [
        `Hi ${client.name}, I wanted to follow up on our recent proposal discussion. Do you have any questions or concerns I can address?`,
        `${client.name}, I'm here to help move our deal forward. What additional information do you need to make a decision?`,
        `Hello ${client.name}, let's schedule a time to finalize the details of our agreement. What works best for your schedule?`
      ],
      'vip_maintenance': [
        `Hi ${client.name}, I wanted to check in and see how everything is going with your recent purchase. Any feedback or questions?`,
        `${client.name}, as one of our valued VIP clients, I wanted to personally ensure you're completely satisfied with our service.`,
        `Hello ${client.name}, I hope you're enjoying our solution. I'm here if you need any support or have suggestions for improvement.`
      ],
      'long_term_nurture': [
        `Hi ${client.name}, I came across an article about ${context.industry || 'your industry'} that I thought you might find interesting. [Article link]`,
        `${client.name}, I wanted to share some insights that might be valuable for your business growth. Would you like to hear more?`,
        `Hello ${client.name}, I've been thinking about our previous conversation and have some ideas that might benefit your organization.`
      ]
    };

    const messageType = context.messageType || 'high_lead_score';
    const options = templates[messageType as keyof typeof templates] || templates.high_lead_score;
    
    return options[Math.floor(Math.random() * options.length)];
  }

  /**
   * Schedule follow-up automatically based on optimal timing
   */
  static scheduleOptimalFollowUp(
    client: any,
    engagementMetrics: EngagementMetrics,
    recommendation: FollowUpRecommendation
  ): Date {
    const now = new Date();
    let optimalDate = new Date(recommendation.suggestedDate);

    // Adjust based on client's best time to contact
    const bestTime = engagementMetrics.bestTimeToContact;
    optimalDate.setDay(bestTime.dayOfWeek);
    optimalDate.setHours(bestTime.hour, 0, 0, 0);

    // Ensure it's not in the past
    if (optimalDate < now) {
      optimalDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Next day
      optimalDate.setHours(bestTime.hour, 0, 0, 0);
    }

    // Avoid weekends for business contacts
    if (optimalDate.getDay() === 0) { // Sunday
      optimalDate.setDate(optimalDate.getDate() + 1); // Monday
    } else if (optimalDate.getDay() === 6) { // Saturday
      optimalDate.setDate(optimalDate.getDate() + 2); // Monday
    }

    return optimalDate;
  }

  /**
   * Create automated follow-up tasks in bulk
   */
  static createBulkFollowUps(
    clients: any[],
    interactions: any[] = [],
    messages: any[] = [],
    deals: any[] = []
  ): any[] {
    const followUps: any[] = [];

    clients.forEach(client => {
      const clientInteractions = interactions.filter(i => i.clientId === client.id);
      const clientMessages = messages.filter(m => m.clientId === client.id);
      const clientDeals = deals.filter(d => d.clientId === client.id);

      const recommendations = this.generateFollowUpRecommendations(
        client, 
        clientInteractions, 
        clientDeals
      );

      const engagementMetrics = this.calculateEngagementMetrics(
        client,
        clientInteractions,
        clientMessages
      );

      recommendations.forEach(rec => {
        const optimalDate = this.scheduleOptimalFollowUp(client, engagementMetrics, rec);
        
        followUps.push({
          id: `auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          clientId: client.id,
          type: rec.type,
          title: rec.automatedMessage || `Follow up with ${client.name}`,
          description: rec.reason,
          scheduledFor: optimalDate,
          completed: false,
          priority: rec.priority,
          automatedAction: 'auto_generated',
          createdAt: new Date(),
          metadata: {
            engagementMetrics,
            recommendation: rec
          }
        });
      });
    });

    return followUps;
  }
}