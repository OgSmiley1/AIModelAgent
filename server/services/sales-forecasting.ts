import { Client, Deal, SalesForecast, Message, Interaction } from "@shared/schema";

interface ForecastData {
  period: 'weekly' | 'monthly' | 'quarterly';
  predictedRevenue: number;
  predictedDeals: number;
  confidence: number;
  factors: ForecastFactors;
  recommendations: string[];
}

interface ForecastFactors {
  pipelineValue: number;
  conversionRate: number;
  averageDealSize: number;
  salesVelocity: number;
  seasonalTrend: number;
  leadQuality: number;
  historicalAccuracy: number;
}

interface PipelineAnalysis {
  totalValue: number;
  weightedValue: number;
  dealsByStage: Record<string, number>;
  averageDealSize: number;
  conversionRates: Record<string, number>;
}

export class SalesForecastingService {
  private stageWeights = {
    'prospecting': 0.1,
    'qualification': 0.2,
    'proposal': 0.5,
    'negotiation': 0.8,
    'closed_won': 1.0,
    'closed_lost': 0.0
  };

  private stageDurations = {
    'prospecting': 14,    // Average days in each stage
    'qualification': 21,
    'proposal': 28,
    'negotiation': 14,
    'closed_won': 0,
    'closed_lost': 0
  };

  async generateForecast(
    period: 'weekly' | 'monthly' | 'quarterly',
    clients: Client[],
    deals: Deal[],
    messages: Message[],
    interactions: Interaction[],
    historicalData?: SalesForecast[]
  ): Promise<ForecastData> {
    
    const pipelineAnalysis = this.analyzePipeline(deals);
    const leadQualityScore = this.analyzeLeadQuality(clients, messages, interactions);
    const seasonalTrend = this.calculateSeasonalTrend(period, historicalData);
    const salesVelocity = this.calculateSalesVelocity(deals);
    
    const factors: ForecastFactors = {
      pipelineValue: pipelineAnalysis.totalValue,
      conversionRate: this.calculateOverallConversionRate(deals),
      averageDealSize: pipelineAnalysis.averageDealSize,
      salesVelocity,
      seasonalTrend,
      leadQuality: leadQualityScore,
      historicalAccuracy: this.calculateHistoricalAccuracy(historicalData)
    };

    const { predictedRevenue, predictedDeals, confidence } = this.calculatePrediction(
      period,
      factors,
      pipelineAnalysis
    );

    const recommendations = this.generateRecommendations(factors, pipelineAnalysis);

    return {
      period,
      predictedRevenue,
      predictedDeals,
      confidence,
      factors,
      recommendations
    };
  }

  private analyzePipeline(deals: Deal[]): PipelineAnalysis {
    const activeDeals = deals.filter(d => !['closed_won', 'closed_lost'].includes(d.stage));
    
    const totalValue = activeDeals.reduce((sum, deal) => sum + deal.value, 0);
    const weightedValue = activeDeals.reduce((sum, deal) => {
      const weight = this.stageWeights[deal.stage as keyof typeof this.stageWeights] || 0;
      return sum + (deal.value * weight * deal.probability);
    }, 0);

    const dealsByStage: Record<string, number> = {};
    activeDeals.forEach(deal => {
      dealsByStage[deal.stage] = (dealsByStage[deal.stage] || 0) + 1;
    });

    const averageDealSize = activeDeals.length > 0 ? totalValue / activeDeals.length : 0;

    // Calculate conversion rates between stages
    const conversionRates = this.calculateStageConversionRates(deals);

    return {
      totalValue,
      weightedValue,
      dealsByStage,
      averageDealSize,
      conversionRates
    };
  }

  private calculateStageConversionRates(deals: Deal[]): Record<string, number> {
    const stages = ['prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won'];
    const conversionRates: Record<string, number> = {};

    for (let i = 0; i < stages.length - 1; i++) {
      const currentStage = stages[i];
      const nextStage = stages[i + 1];
      
      const currentStageDeals = deals.filter(d => d.stage === currentStage).length;
      const advancedDeals = deals.filter(d => 
        stages.indexOf(d.stage) > i || d.stage === 'closed_won'
      ).length;
      
      conversionRates[`${currentStage}_to_${nextStage}`] = 
        currentStageDeals > 0 ? advancedDeals / currentStageDeals : 0.5;
    }

    return conversionRates;
  }

  private analyzeLeadQuality(clients: Client[], messages: Message[], interactions: Interaction[]): number {
    if (clients.length === 0) return 50;

    // Calculate average lead score
    const avgLeadScore = clients.reduce((sum, client) => sum + (client.leadScore || 0), 0) / clients.length;

    // Analyze engagement levels
    const highEngagementClients = clients.filter(c => c.engagementLevel === 'high' || c.engagementLevel === 'very_high').length;
    const engagementRatio = highEngagementClients / clients.length;

    // Analyze recent activity
    const recentlyActiveClients = clients.filter(c => {
      if (!c.lastInteraction) return false;
      const daysSince = (Date.now() - c.lastInteraction.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 7;
    }).length;
    const activityRatio = recentlyActiveClients / clients.length;

    // Combine factors
    return Math.round(avgLeadScore * 0.5 + engagementRatio * 25 + activityRatio * 25);
  }

  private calculateSeasonalTrend(period: string, historicalData?: SalesForecast[]): number {
    if (!historicalData || historicalData.length < 4) return 1.0; // Neutral if no data

    const currentMonth = new Date().getMonth();
    const currentQuarter = Math.floor(currentMonth / 3);

    // Simplified seasonal analysis
    const seasonalMultipliers = {
      monthly: [0.9, 0.9, 1.0, 1.1, 1.1, 1.0, 0.8, 0.8, 1.1, 1.2, 1.3, 1.2], // By month
      quarterly: [1.0, 1.1, 0.9, 1.2], // By quarter
      weekly: Array(52).fill(1.0) // Simplified for weekly
    };

    if (period === 'monthly') {
      return seasonalMultipliers.monthly[currentMonth];
    } else if (period === 'quarterly') {
      return seasonalMultipliers.quarterly[currentQuarter];
    }

    return 1.0;
  }

  private calculateSalesVelocity(deals: Deal[]): number {
    const closedDeals = deals.filter(d => d.actualCloseDate && d.createdAt);
    
    if (closedDeals.length === 0) return 30; // Default 30 days

    const velocities = closedDeals.map(deal => {
      const created = deal.createdAt!.getTime();
      const closed = deal.actualCloseDate!.getTime();
      return (closed - created) / (1000 * 60 * 60 * 24); // Days
    });

    return velocities.reduce((sum, velocity) => sum + velocity, 0) / velocities.length;
  }

  private calculateOverallConversionRate(deals: Deal[]): number {
    if (deals.length === 0) return 0.2; // Default 20%

    const closedWon = deals.filter(d => d.stage === 'closed_won').length;
    const totalClosed = deals.filter(d => d.stage === 'closed_won' || d.stage === 'closed_lost').length;

    return totalClosed > 0 ? closedWon / totalClosed : 0.2;
  }

  private calculateHistoricalAccuracy(historicalData?: SalesForecast[]): number {
    if (!historicalData || historicalData.length === 0) return 0.7; // Default 70%

    const accurateForecasts = historicalData.filter(forecast => {
      if (!forecast.actualRevenue || forecast.actualRevenue === 0) return false;
      
      const variance = Math.abs(forecast.predictedRevenue - forecast.actualRevenue) / forecast.actualRevenue;
      return variance <= 0.2; // Within 20% considered accurate
    });

    return accurateForecasts.length / historicalData.length;
  }

  private calculatePrediction(
    period: string,
    factors: ForecastFactors,
    pipelineAnalysis: PipelineAnalysis
  ): { predictedRevenue: number; predictedDeals: number; confidence: number } {
    
    // Base prediction from weighted pipeline
    let predictedRevenue = pipelineAnalysis.weightedValue;

    // Apply conversion rate
    predictedRevenue *= factors.conversionRate;

    // Apply seasonal trends
    predictedRevenue *= factors.seasonalTrend;

    // Adjust for lead quality
    const qualityMultiplier = 0.7 + (factors.leadQuality / 100) * 0.6; // 0.7 to 1.3 range
    predictedRevenue *= qualityMultiplier;

    // Add new deals based on lead flow (simplified)
    const periodMultiplier = period === 'weekly' ? 0.25 : period === 'monthly' ? 1 : 3;
    const newDealsRevenue = factors.averageDealSize * factors.conversionRate * 
                           (factors.leadQuality / 100) * periodMultiplier * 2; // Assume 2 new qualified leads per period
    
    predictedRevenue += newDealsRevenue;

    // Calculate predicted number of deals
    const predictedDeals = Math.round(predictedRevenue / Math.max(factors.averageDealSize, 1000));

    // Calculate confidence based on various factors
    let confidence = 0.5; // Base confidence
    
    confidence += factors.historicalAccuracy * 0.3;
    confidence += Math.min(0.2, factors.leadQuality / 500);
    confidence += Math.min(0.2, pipelineAnalysis.dealsByStage['proposal'] / 10);
    confidence += Math.min(0.1, pipelineAnalysis.dealsByStage['negotiation'] / 5);
    
    // Reduce confidence for longer periods
    if (period === 'quarterly') confidence *= 0.8;
    else if (period === 'weekly') confidence *= 1.1;

    confidence = Math.min(0.95, Math.max(0.3, confidence));

    return {
      predictedRevenue: Math.round(predictedRevenue),
      predictedDeals,
      confidence: Math.round(confidence * 100) / 100
    };
  }

  private generateRecommendations(factors: ForecastFactors, pipelineAnalysis: PipelineAnalysis): string[] {
    const recommendations: string[] = [];

    if (factors.conversionRate < 0.15) {
      recommendations.push("Focus on improving qualification process - conversion rate is below industry average");
    }

    if (pipelineAnalysis.dealsByStage['prospecting'] > pipelineAnalysis.dealsByStage['qualification'] * 3) {
      recommendations.push("Accelerate lead qualification - high number of prospects stuck in early stage");
    }

    if (factors.salesVelocity > 60) {
      recommendations.push("Sales cycle is lengthy - consider process optimization and automation");
    }

    if (factors.leadQuality < 60) {
      recommendations.push("Improve lead generation quality - current leads showing weak buying signals");
    }

    if (pipelineAnalysis.dealsByStage['negotiation'] > 0 && 
        pipelineAnalysis.dealsByStage['closed_won'] / pipelineAnalysis.dealsByStage['negotiation'] < 0.7) {
      recommendations.push("Focus on closing skills - deals stalling in negotiation stage");
    }

    if (factors.averageDealSize < 50000) {
      recommendations.push("Consider upselling strategies or targeting higher-value prospects");
    }

    if (factors.historicalAccuracy < 0.6) {
      recommendations.push("Improve forecast accuracy by better tracking deal progression and probability updates");
    }

    if (recommendations.length === 0) {
      recommendations.push("Pipeline health looks good - maintain current sales activities and monitor key metrics");
    }

    return recommendations;
  }

  async predictDealOutcome(deal: Deal, client: Client, historicalSimilarDeals: Deal[]): Promise<{
    probability: number;
    expectedValue: number;
    timeToClose: number;
    riskFactors: string[];
  }> {
    
    // Base probability from deal
    let probability = deal.probability;

    // Adjust based on client lead score
    const leadScoreMultiplier = (client.leadScore || 50) / 100;
    probability *= (0.5 + leadScoreMultiplier);

    // Adjust based on stage
    const stageMultipliers = {
      'prospecting': 0.8,
      'qualification': 0.9,
      'proposal': 1.0,
      'negotiation': 1.1
    };
    probability *= stageMultipliers[deal.stage as keyof typeof stageMultipliers] || 1.0;

    // Calculate expected value
    const expectedValue = deal.value * probability;

    // Estimate time to close based on current stage and historical data
    let timeToClose = 0;
    const currentStageIndex = Object.keys(this.stageDurations).indexOf(deal.stage);
    const remainingStages = Object.keys(this.stageDurations).slice(currentStageIndex + 1);
    
    timeToClose = remainingStages.reduce((sum, stage) => {
      return sum + (this.stageDurations[stage as keyof typeof this.stageDurations] || 0);
    }, 0);

    // Adjust based on historical similar deals
    if (historicalSimilarDeals.length > 0) {
      const avgSimilarDealTime = historicalSimilarDeals
        .filter(d => d.actualCloseDate && d.createdAt)
        .reduce((sum, d) => {
          const duration = (d.actualCloseDate!.getTime() - d.createdAt!.getTime()) / (1000 * 60 * 60 * 24);
          return sum + duration;
        }, 0) / historicalSimilarDeals.length;
      
      timeToClose = (timeToClose + avgSimilarDealTime) / 2;
    }

    // Identify risk factors
    const riskFactors: string[] = [];
    
    if (client.engagementLevel === 'low') riskFactors.push("Low client engagement");
    if (client.sentimentScore < -0.2) riskFactors.push("Negative sentiment trend");
    if (!client.decisionMaker) riskFactors.push("Decision maker not identified");
    if (deal.competitorInfo) riskFactors.push("Competitive situation");
    if (timeToClose > 90) riskFactors.push("Extended sales cycle");
    
    const daysSinceLastUpdate = deal.updatedAt ? 
      (Date.now() - deal.updatedAt.getTime()) / (1000 * 60 * 60 * 24) : 0;
    if (daysSinceLastUpdate > 14) riskFactors.push("Stalled deal - no recent activity");

    return {
      probability: Math.min(1, Math.max(0, probability)),
      expectedValue: Math.round(expectedValue),
      timeToClose: Math.round(timeToClose),
      riskFactors
    };
  }
}

export const salesForecastingService = new SalesForecastingService();