#!/usr/bin/env tsx
/**
 * Daily Metrics Rollup Job
 * 
 * This script calculates and stores daily metrics for historical tracking.
 * Should be run daily via cron or Replit scheduler.
 * 
 * Usage: tsx jobs/daily-rollup.ts [date]
 * If no date provided, rolls up yesterday's metrics.
 */

import { db } from '../server/db';
import { metricsDaily, messages, clients, conversations, followUps } from '@shared/schema';
import { eq, and, gte, lt, lte, sql, isNull } from 'drizzle-orm';

async function rollupMetrics(targetDate?: string) {
  try {
    // Calculate date boundaries
    let dayToRollup: Date;
    
    if (targetDate) {
      dayToRollup = new Date(targetDate);
    } else {
      // Default: roll up yesterday
      dayToRollup = new Date();
      dayToRollup.setDate(dayToRollup.getDate() - 1);
    }
    
    const startOfDay = new Date(Date.UTC(
      dayToRollup.getUTCFullYear(),
      dayToRollup.getUTCMonth(),
      dayToRollup.getUTCDate()
    ));
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
    const dayStr = startOfDay.toISOString().split('T')[0]; // YYYY-MM-DD

    console.log(`📊 Rolling up metrics for ${dayStr}...`);

    // Count messages for the day
    const messagesResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(messages)
      .where(
        and(
          gte(messages.timestamp, startOfDay),
          lt(messages.timestamp, endOfDay)
        )
      );
    const dailyMessages = messagesResult[0]?.count ?? 0;

    // Count new clients created that day
    const newClientsResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(clients)
      .where(
        and(
          gte(clients.createdAt, startOfDay),
          lt(clients.createdAt, endOfDay)
        )
      );
    const newClients = newClientsResult[0]?.count ?? 0;

    // Count updated clients that day
    const updatedClientsResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(clients)
      .where(
        and(
          gte(clients.updatedAt, startOfDay),
          lt(clients.updatedAt, endOfDay)
        )
      );
    const updatedClients = updatedClientsResult[0]?.count ?? 0;

    // Calculate average response time
    const avgResponseResult = await db
      .select({ 
        avgMinutes: sql<number>`coalesce(round(avg(extract(epoch from (last_message_at - created_at))/60)::numeric, 1), 0)` 
      })
      .from(conversations)
      .where(
        and(
          gte(conversations.createdAt, startOfDay),
          lt(conversations.createdAt, endOfDay),
          sql`last_message_at is not null`
        )
      );
    const avgResponseMin = avgResponseResult[0]?.avgMinutes ?? null;

    // Count SLA breaches (conversations created that day with no response after 24h)
    const slaThreshold = new Date(endOfDay.getTime() - 24 * 60 * 60 * 1000);
    const slaBreachesResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(conversations)
      .where(
        and(
          gte(conversations.createdAt, startOfDay),
          lt(conversations.createdAt, endOfDay),
          lte(conversations.createdAt, slaThreshold),
          sql`(message_count = 0 or message_count is null or last_message_at is null)`
        )
      );
    const slaBreaches = slaBreachesResult[0]?.count ?? 0;

    // Count pending followups at end of day
    const pendingFollowupsResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(followUps)
      .where(
        and(
          lte(followUps.scheduledFor, endOfDay),
          eq(followUps.completed, false)
        )
      );
    const pendingFollowups = pendingFollowupsResult[0]?.count ?? 0;

    // Count active conversations at end of day
    const activeConversationsResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(conversations)
      .where(
        and(
          lte(conversations.createdAt, endOfDay),
          eq(conversations.status, 'active')
        )
      );
    const activeConversations = activeConversationsResult[0]?.count ?? 0;

    // Upsert metrics
    const metrics = {
      day: dayStr,
      messages: dailyMessages,
      newClients,
      updatedClients,
      conversions: 0, // TODO: Calculate from deals/orders when available
      avgResponseMin,
      slaBreaches,
      pendingFollowups,
      activeConversations,
    };

    // Check if record exists
    const existing = await db
      .select()
      .from(metricsDaily)
      .where(eq(metricsDaily.day, dayStr))
      .limit(1);

    if (existing.length > 0) {
      // Update existing
      await db
        .update(metricsDaily)
        .set(metrics)
        .where(eq(metricsDaily.day, dayStr));
      console.log(`✅ Updated metrics for ${dayStr}`);
    } else {
      // Insert new
      await db.insert(metricsDaily).values(metrics);
      console.log(`✅ Created metrics for ${dayStr}`);
    }

    console.log(`📈 Metrics Summary for ${dayStr}:`);
    console.log(`   Messages: ${dailyMessages}`);
    console.log(`   New Clients: ${newClients}`);
    console.log(`   Updated Clients: ${updatedClients}`);
    console.log(`   Avg Response Time: ${avgResponseMin ? avgResponseMin + ' min' : 'N/A'}`);
    console.log(`   SLA Breaches: ${slaBreaches}`);
    console.log(`   Pending Follow-ups: ${pendingFollowups}`);
    console.log(`   Active Conversations: ${activeConversations}`);

    return metrics;
  } catch (error) {
    console.error('❌ Error rolling up metrics:', error);
    throw error;
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const targetDate = process.argv[2]; // Optional YYYY-MM-DD
  
  rollupMetrics(targetDate)
    .then(() => {
      console.log('✅ Rollup complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Rollup failed:', error);
      process.exit(1);
    });
}

export { rollupMetrics };
