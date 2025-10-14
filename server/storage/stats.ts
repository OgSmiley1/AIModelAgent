import { db } from '../db';
import { clients, messages, conversations, followUps } from '@shared/schema';
import { eq, and, gte, lt, lte, desc, sql, isNull } from 'drizzle-orm';

/**
 * Get start and end of day in UTC for date-bounded queries
 */
export function getDayBoundaries(daysAgo: number = 0) {
  const now = new Date();
  const startOfDay = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() - daysAgo
  ));
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
  
  return { startOfDay, endOfDay };
}

/**
 * Get dashboard statistics with safe defaults
 */
export async function getDashboardStats() {
  try {
    const { startOfDay: todayStart, endOfDay: todayEnd } = getDayBoundaries(0);
    const { startOfDay: yesterdayStart, endOfDay: yesterdayEnd } = getDayBoundaries(1);
    const now = new Date();

    // Count today's messages
    const todayMessagesResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(messages)
      .where(
        and(
          gte(messages.timestamp, todayStart),
          lt(messages.timestamp, todayEnd)
        )
      );
    const todayMessages = todayMessagesResult[0]?.count ?? 0;

    // Count yesterday's messages for growth calculation
    const yesterdayMessagesResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(messages)
      .where(
        and(
          gte(messages.timestamp, yesterdayStart),
          lt(messages.timestamp, yesterdayEnd)
        )
      );
    const yesterdayMessages = yesterdayMessagesResult[0]?.count ?? 0;

    // Calculate message growth percentage (avoid division by zero)
    const messageGrowth = yesterdayMessages > 0 
      ? ((todayMessages - yesterdayMessages) / yesterdayMessages * 100).toFixed(1)
      : todayMessages > 0 ? "100" : "0";

    // Count pending followups (scheduled for today or overdue, not completed)
    const pendingFollowupsResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(followUps)
      .where(
        and(
          lte(followUps.scheduledFor, now),
          eq(followUps.completed, false)
        )
      );
    const pendingFollowups = pendingFollowupsResult[0]?.count ?? 0;

    // Count new clients created today
    const newClientsResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(clients)
      .where(
        and(
          gte(clients.createdAt, todayStart),
          lt(clients.createdAt, todayEnd)
        )
      );
    const newClients = newClientsResult[0]?.count ?? 0;

    // Count updated clients today
    const updatedClientsResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(clients)
      .where(
        and(
          gte(clients.updatedAt, todayStart),
          lt(clients.updatedAt, todayEnd)
        )
      );
    const updatedClients = updatedClientsResult[0]?.count ?? 0;

    // Calculate average response time (from conversation creation to last message)
    // Using a simplified approach based on conversation activity
    const avgResponseResult = await db
      .select({ 
        avgMinutes: sql<number>`coalesce(round(avg(extract(epoch from (last_message_at - created_at))/60)::numeric, 1), 0)` 
      })
      .from(conversations)
      .where(
        and(
          gte(conversations.createdAt, todayStart),
          sql`last_message_at is not null`
        )
      );
    const avgResponseMinutes = avgResponseResult[0]?.avgMinutes ?? 0;
    const avgResponseTime = avgResponseMinutes > 0 
      ? `${avgResponseMinutes} min` 
      : "N/A";

    // SLA breach detection: conversations created over 24 hours ago with low message count
    const slaThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const slaBreachesResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(conversations)
      .where(
        and(
          lte(conversations.createdAt, slaThreshold),
          sql`(message_count = 0 or message_count is null or last_message_at is null)`
        )
      );
    const slaBreaches = slaBreachesResult[0]?.count ?? 0;

    // Count total clients
    const totalClientsResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(clients);
    const totalClients = totalClientsResult[0]?.count ?? 0;

    // Count active conversations
    const activeChatsResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(conversations)
      .where(eq(conversations.status, 'active'));
    const activeChats = activeChatsResult[0]?.count ?? 0;

    // Calculate satisfaction score from average sentiment
    const avgSentimentResult = await db
      .select({ 
        avgSentiment: sql<number>`coalesce(avg(sentiment_score), 0)` 
      })
      .from(messages)
      .where(sql`sentiment_score is not null`);
    const avgSentiment = avgSentimentResult[0]?.avgSentiment ?? 0;
    const satisfaction = avgSentiment > 0 
      ? (avgSentiment * 2 + 3).toFixed(1) 
      : "N/A";

    // Mock conversion rate for now (would need orders/deals table)
    const conversionRate = 68;

    return {
      todayMessages,
      yesterdayMessages,
      messageGrowth,
      totalClients,
      activeChats,
      pendingFollowups,
      newClients,
      updatedClients,
      avgResponseTime,
      conversionRate,
      satisfaction,
      slaBreaches,
    };
  } catch (error) {
    console.error('Error calculating dashboard stats:', error);
    // Return safe defaults on error
    return {
      todayMessages: 0,
      yesterdayMessages: 0,
      messageGrowth: "0",
      totalClients: 0,
      activeChats: 0,
      pendingFollowups: 0,
      newClients: 0,
      updatedClients: 0,
      avgResponseTime: "N/A",
      conversionRate: 0,
      satisfaction: "N/A",
      slaBreaches: 0,
    };
  }
}

/**
 * Get due followups for today
 */
export async function getDueFollowupsToday() {
  try {
    const { startOfDay: todayStart, endOfDay: todayEnd } = getDayBoundaries(0);
    
    const dueFollowups = await db
      .select()
      .from(followUps)
      .where(
        and(
          gte(followUps.scheduledFor, todayStart),
          lte(followUps.scheduledFor, todayEnd),
          eq(followUps.completed, false)
        )
      )
      .orderBy(followUps.scheduledFor);
    
    return dueFollowups;
  } catch (error) {
    console.error('Error fetching due followups:', error);
    return [];
  }
}

/**
 * Get hot leads (high lead score clients)
 */
export async function getHotLeads(minScore: number = 70) {
  try {
    const hotLeads = await db
      .select()
      .from(clients)
      .where(gte(clients.leadScore, minScore))
      .orderBy(desc(clients.leadScore))
      .limit(20);
    
    return hotLeads;
  } catch (error) {
    console.error('Error fetching hot leads:', error);
    return [];
  }
}

/**
 * Get dangling conversations (no outgoing message in last N hours)
 */
export async function getDanglingConversations(hours: number = 48) {
  try {
    const threshold = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    // Get conversations that have had recent incoming messages but no outgoing response
    const danglingConvs = await db
      .select({
        conversationId: conversations.id,
        clientId: conversations.clientId,
        lastIncoming: sql<Date>`max(case when ${messages.direction} = 'incoming' then ${messages.timestamp} end)`,
        lastOutgoing: sql<Date>`max(case when ${messages.direction} = 'outgoing' then ${messages.timestamp} end)`,
      })
      .from(conversations)
      .leftJoin(messages, eq(messages.conversationId, conversations.id))
      .groupBy(conversations.id, conversations.clientId)
      .having(
        and(
          sql`max(case when ${messages.direction} = 'incoming' then ${messages.timestamp} end) >= ${threshold}`,
          sql`max(case when ${messages.direction} = 'outgoing' then ${messages.timestamp} end) is null or max(case when ${messages.direction} = 'outgoing' then ${messages.timestamp} end) < max(case when ${messages.direction} = 'incoming' then ${messages.timestamp} end)`
        )
      );
    
    return danglingConvs;
  } catch (error) {
    console.error('Error fetching dangling conversations:', error);
    return [];
  }
}

/**
 * Get next actions summary
 */
export async function getNextActions() {
  try {
    const [due, hot, dangling] = await Promise.all([
      getDueFollowupsToday(),
      getHotLeads(70),
      getDanglingConversations(48)
    ]);
    
    return { due, hot, dangling };
  } catch (error) {
    console.error('Error fetching next actions:', error);
    return { due: [], hot: [], dangling: [] };
  }
}
