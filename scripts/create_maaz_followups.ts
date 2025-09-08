#!/usr/bin/env tsx
/**
 * Create follow-up records for Maaz clients
 * Based on action requirements from tracker data
 */

interface FollowUpData {
  clientName: string;
  type: string;
  title: string;
  description: string;
  scheduledFor: string;
  priority: string;
  metadata: {
    source: string;
    urgencyScore?: number;
    dealValue?: number;
  };
}

const API_BASE = 'http://localhost:5000/api';

// Follow-up data based on Maaz tracker requirements
const followUpData: FollowUpData[] = [
  {
    clientName: 'Ahmed Al Mansouri',
    type: 'reminder',
    title: 'Follow up on Overseas Chronograph availability',
    description: 'Check availability of Overseas Chronograph 5500V/110A-B148 blue dial and schedule viewing appointment. Client is highly interested and deal value is 140,000 AED.',
    scheduledFor: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday (overdue)
    priority: 'high',
    metadata: {
      source: 'maaz_tracker',
      urgencyScore: 9,
      dealValue: 140000
    }
  },
  {
    clientName: 'Fatima Al Zahra',
    type: 'task',
    title: 'Send Patrimony catalog and arrange boutique visit',
    description: 'Client interested in Patrimony collection with 200k AED budget. Send catalog and arrange boutique visit to discuss options.',
    scheduledFor: new Date().toISOString(), // Today
    priority: 'high',
    metadata: {
      source: 'maaz_tracker',
      urgencyScore: 8,
      dealValue: 200000
    }
  },
  {
    clientName: 'Omar Hassan',
    type: 'task',
    title: 'Prepare financing proposal for Traditionnelle Perpetual Calendar',
    description: 'Client considering Traditionnelle Perpetual Calendar and needs finance options. Prepare financing proposal and schedule presentation for 472,000 AED deal.',
    scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    priority: 'high',
    metadata: {
      source: 'maaz_tracker',
      urgencyScore: 7,
      dealValue: 472000
    }
  },
  {
    clientName: 'Khalid Al Maktoum',
    type: 'meeting',
    title: 'Private appointment for Les Cabinotiers consultation',
    description: 'VIP client interested in exclusive Les Cabinotiers pieces. Arrange private appointment to showcase unique timepieces. High-value prospect 1,500,000+ AED.',
    scheduledFor: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(), // 3 days
    priority: 'vip',
    metadata: {
      source: 'maaz_tracker',
      urgencyScore: 10,
      dealValue: 1500000
    }
  },
  {
    clientName: 'Laila Bin Rashid',
    type: 'task',
    title: 'Anniversary gift consultation - Ladies Overseas',
    description: 'Client looking for anniversary gift from Ladies Overseas collection with diamond setting. Budget up to 300k AED. Prefers mother-of-pearl dials.',
    scheduledFor: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 2 days
    priority: 'high',
    metadata: {
      source: 'maaz_tracker',
      urgencyScore: 8,
      dealValue: 300000
    }
  },
  {
    clientName: 'Mohammed Al Sharif',
    type: 'call',
    title: 'Entry-level luxury consultation - FiftySix collection',
    description: 'First-time luxury watch buyer interested in FiftySix collection. Budget conscious at 85,000 AED. Provide entry-level guidance and education.',
    scheduledFor: new Date(Date.now() + 96 * 60 * 60 * 1000).toISOString(), // 4 days
    priority: 'medium',
    metadata: {
      source: 'maaz_tracker',
      urgencyScore: 6,
      dealValue: 85000
    }
  }
];

async function getClients() {
  try {
    const response = await fetch(`${API_BASE}/clients`);
    if (!response.ok) {
      throw new Error(`Failed to fetch clients: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('❌ Failed to fetch clients:', error);
    return [];
  }
}

async function createFollowUp(clientId: string, followUp: FollowUpData) {
  try {
    const followUpPayload = {
      clientId,
      type: followUp.type,
      title: followUp.title,
      description: followUp.description,
      scheduledFor: followUp.scheduledFor,
      priority: followUp.priority,
      metadata: followUp.metadata
    };

    const response = await fetch(`${API_BASE}/follow-ups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(followUpPayload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create follow-up: ${error}`);
    }

    const result = await response.json();
    console.log(`📅 Follow-up created for ${followUp.clientName}: ${followUp.title}`);
    return result;
  } catch (error) {
    console.error(`❌ Failed to create follow-up for ${followUp.clientName}:`, error);
    return null;
  }
}

async function createAllFollowUps() {
  console.log('🚀 Starting Maaz client follow-up creation...\n');
  
  // Get all clients to match names with IDs
  const clients = await getClients();
  if (clients.length === 0) {
    console.error('❌ No clients found. Make sure clients are uploaded first.');
    return;
  }
  
  console.log(`📋 Found ${clients.length} clients in system\n`);
  
  const results = [];
  
  for (const followUp of followUpData) {
    // Find client by name
    const client = clients.find((c: any) => c.name === followUp.clientName);
    
    if (!client) {
      console.error(`❌ Client not found: ${followUp.clientName}`);
      results.push(null);
      continue;
    }
    
    console.log(`📤 Creating follow-up for: ${followUp.clientName}...`);
    const result = await createFollowUp(client.id, followUp);
    results.push(result);
    console.log(''); // Empty line for readability
  }
  
  const successful = results.filter(r => r !== null);
  const failed = results.filter(r => r === null);
  
  console.log('\n📊 Follow-up Creation Summary:');
  console.log(`✅ Successfully created: ${successful.length} follow-ups`);
  console.log(`❌ Failed to create: ${failed.length} follow-ups`);
  
  if (successful.length > 0) {
    console.log('\n📅 Created Follow-ups:');
    successful.forEach((_, index) => {
      const followUp = followUpData[index];
      if (followUp) {
        const scheduledDate = new Date(followUp.scheduledFor).toLocaleDateString();
        console.log(`   ${index + 1}. ${followUp.clientName} - ${followUp.title} (${scheduledDate})`);
      }
    });
  }
  
  console.log('\n🎯 All Maaz client follow-ups have been processed!');
}

// Run the follow-up creation process
createAllFollowUps().catch(console.error);