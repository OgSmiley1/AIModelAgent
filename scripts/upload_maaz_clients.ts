#!/usr/bin/env tsx
/**
 * Upload Maaz-related clients from database setup files
 * Extracts client data and uploads via API
 */

interface MaazClient {
  name: string;
  phone?: string;
  email?: string;
  whatsappNumber?: string;
  status?: string;
  priority?: string;
  interests?: string;
  notes?: string;
  budget?: number;
  location?: string;
  tags?: string[];
  followUpRequired?: boolean;
  followUpDate?: string;
  lastInteraction?: string;
}

const API_BASE = 'http://localhost:5000/api';

// Client data extracted from Maaz tracker files
const maazClients: MaazClient[] = [
  {
    name: 'Ahmed Al Mansouri',
    phone: '+971501234567',
    email: 'ahmed.mansouri@email.com',
    whatsappNumber: '+971501234567',
    status: 'active',
    priority: 'high',
    interests: 'Overseas Chronograph, Blue dial watches, Luxury sports watches',
    notes: 'Promised to check availability of Overseas Chronograph 5500V/110A-B148 blue dial. Action required: Follow up on watch availability and schedule viewing appointment. Urgency Score: 9/10. Deal Value: 140,000 AED. Last interaction: WhatsApp inquiry.',
    budget: 140000,
    location: 'Dubai, UAE',
    tags: ['vacheron_constantin', 'overseas_collection', 'high_urgency', 'whatsapp_lead'],
    followUpRequired: true,
    followUpDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday (overdue)
    lastInteraction: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
  },
  {
    name: 'Fatima Al Zahra',
    phone: '+971502345678',
    email: 'fatima.alzahra@email.com', 
    whatsappNumber: '+971502345678',
    status: 'active',
    priority: 'high',
    interests: 'Patrimony collection, Classic dress watches, White gold timepieces',
    notes: 'Client interested in Patrimony collection, budget 200k AED. Action required: Send catalog and arrange boutique visit. Urgency Score: 8/10. Deal Value: 200,000 AED. Last interaction: Phone call.',
    budget: 200000,
    location: 'Abu Dhabi, UAE',
    tags: ['vacheron_constantin', 'patrimony_collection', 'high_budget', 'phone_lead'],
    followUpRequired: true,
    followUpDate: new Date().toISOString(), // Today
    lastInteraction: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  },
  {
    name: 'Omar Hassan',
    phone: '+971503456789',
    email: 'omar.hassan@email.com',
    whatsappNumber: '+971503456789', 
    status: 'active',
    priority: 'critical',
    interests: 'Traditionnelle Perpetual Calendar, Grand complications, Investment timepieces',
    notes: 'Considering Traditionnelle Perpetual Calendar, needs finance options. Action required: Prepare financing proposal and schedule presentation. Urgency Score: 7/10. Deal Value: 472,000 AED. Last interaction: Email exchange.',
    budget: 472000,
    location: 'Sharjah, UAE',
    tags: ['vacheron_constantin', 'traditionnelle_collection', 'grand_complications', 'high_value', 'financing_needed'],
    followUpRequired: true,
    followUpDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    lastInteraction: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  },
  {
    name: 'Khalid Al Maktoum',
    phone: '+971504567890',
    email: 'khalid.maktoum@email.com',
    whatsappNumber: '+971504567890',
    status: 'prospect',
    priority: 'vip',
    interests: 'Les Cabinotiers, Unique pieces, Bespoke timepieces',
    notes: 'VIP prospect interested in exclusive Les Cabinotiers pieces. Collector of unique timepieces. Requires private appointment. Deal Value: 1,500,000+ AED.',
    budget: 1500000,
    location: 'Dubai, UAE',
    tags: ['vacheron_constantin', 'les_cabinotiers', 'vip_client', 'collector', 'exclusive'],
    followUpRequired: true,
    followUpDate: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(), // 3 days
    lastInteraction: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString()
  },
  {
    name: 'Laila Bin Rashid',
    phone: '+971505678901',
    email: 'laila.binrashid@email.com',
    whatsappNumber: '+971505678901',
    status: 'active', 
    priority: 'high',
    interests: 'Ladies Overseas, Jewelry watches, Diamond complications',
    notes: 'Interested in Ladies Overseas collection with diamond setting. Looking for anniversary gift. Budget flexible up to 300k AED. Prefers mother-of-pearl dials.',
    budget: 300000,
    location: 'Dubai, UAE',
    tags: ['vacheron_constantin', 'ladies_watches', 'overseas_collection', 'anniversary_gift'],
    followUpRequired: true,
    followUpDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 2 days
    lastInteraction: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
  },
  {
    name: 'Mohammed Al Sharif',
    phone: '+971506789012',
    email: 'mohammed.sharif@email.com',
    whatsappNumber: '+971506789012',
    status: 'active',
    priority: 'medium',
    interests: 'FiftySix collection, Entry-level luxury, Steel timepieces',
    notes: 'First-time luxury watch buyer. Interested in FiftySix collection as entry point. Budget conscious but appreciates craftsmanship. Deal Value: 85,000 AED.',
    budget: 85000,
    location: 'Ajman, UAE',
    tags: ['vacheron_constantin', 'fiftysix_collection', 'first_time_buyer', 'budget_conscious'],
    followUpRequired: true,
    followUpDate: new Date(Date.now() + 96 * 60 * 60 * 1000).toISOString(), // 4 days
    lastInteraction: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  }
];

async function uploadClient(client: MaazClient) {
  try {
    const response = await fetch(`${API_BASE}/clients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(client),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to upload ${client.name}: ${error}`);
    }

    const result = await response.json();
    console.log(`✅ Successfully uploaded: ${client.name} (ID: ${result.id})`);
    return result;
  } catch (error) {
    console.error(`❌ Failed to upload ${client.name}:`, error);
    return null;
  }
}

async function createFollowUp(clientId: string, clientName: string, followUpDate: string, actionRequired: string) {
  try {
    const followUpData = {
      clientId,
      type: 'reminder',
      title: `Follow up with ${clientName}`,
      description: actionRequired,
      scheduledFor: followUpDate,
      priority: 'high',
      metadata: {
        source: 'maaz_tracker',
        urgent: true
      }
    };

    const response = await fetch(`${API_BASE}/follow-ups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(followUpData),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create follow-up for ${clientName}: ${error}`);
    }

    const result = await response.json();
    console.log(`📅 Follow-up created for: ${clientName}`);
    return result;
  } catch (error) {
    console.error(`❌ Failed to create follow-up for ${clientName}:`, error);
    return null;
  }
}

async function uploadAllMaazClients() {
  console.log('🚀 Starting Maaz client upload process...\n');
  
  const results = [];
  
  for (const client of maazClients) {
    console.log(`📤 Uploading: ${client.name}...`);
    const result = await uploadClient(client);
    
    if (result && client.followUpDate) {
      // Extract action from notes for follow-up
      const actionMatch = client.notes.match(/Action required: ([^.]+)/);
      const actionRequired = actionMatch ? actionMatch[1] : 'Follow up with client';
      
      await createFollowUp(result.id, client.name, client.followUpDate, actionRequired);
    }
    
    results.push(result);
    console.log(''); // Empty line for readability
  }
  
  const successful = results.filter(r => r !== null);
  const failed = results.filter(r => r === null);
  
  console.log('\n📊 Upload Summary:');
  console.log(`✅ Successfully uploaded: ${successful.length} clients`);
  console.log(`❌ Failed uploads: ${failed.length} clients`);
  
  if (successful.length > 0) {
    console.log('\n👥 Uploaded Clients:');
    successful.forEach((client, index) => {
      console.log(`   ${index + 1}. ${maazClients.find(c => c.name === client.name)?.name || 'Unknown'}`);
    });
  }
  
  console.log('\n🎯 All Maaz-related clients have been processed!');
}

// Run the upload process
uploadAllMaazClients().catch(console.error);