#!/usr/bin/env tsx
/**
 * Verify Maaz client upload success
 * Check clients and follow-ups were properly created
 */

const API_BASE = 'http://localhost:5000/api';

async function verifyUpload() {
  console.log('🔍 Verifying Maaz client upload...\n');
  
  try {
    // Check clients
    const clientsResponse = await fetch(`${API_BASE}/clients`);
    const clients = await clientsResponse.json();
    
    console.log(`📋 Total clients in system: ${clients.length}`);
    
    const maazClients = ['Ahmed Al Mansouri', 'Fatima Al Zahra', 'Omar Hassan', 'Khalid Al Maktoum', 'Laila Bin Rashid', 'Mohammed Al Sharif'];
    
    console.log('\n👥 Maaz Clients Status:');
    maazClients.forEach((name, index) => {
      const client = clients.find((c: any) => c.name === name);
      if (client) {
        console.log(`   ✅ ${index + 1}. ${name} (ID: ${client.id})`);
        console.log(`      📞 Phone: ${client.phone || 'N/A'}`);
        console.log(`      💰 Budget: ${client.budget ? client.budget.toLocaleString() + ' AED' : 'N/A'}`);
        console.log(`      🏷️  Priority: ${client.priority || 'N/A'}`);
        console.log(`      📍 Location: ${client.location || 'N/A'}`);
        console.log('');
      } else {
        console.log(`   ❌ ${index + 1}. ${name} - NOT FOUND`);
      }
    });
    
    // Check follow-ups
    try {
      const followUpsResponse = await fetch(`${API_BASE}/follow-ups`);
      const followUps = await followUpsResponse.json();
      
      console.log(`📅 Total follow-ups in system: ${followUps.length}`);
      
      if (followUps.length > 0) {
        console.log('\n📋 Follow-up Records:');
        followUps.forEach((followUp: any, index: number) => {
          const client = clients.find((c: any) => c.id === followUp.clientId);
          const clientName = client ? client.name : 'Unknown Client';
          const scheduledDate = new Date(followUp.scheduledFor).toLocaleDateString();
          console.log(`   ${index + 1}. ${clientName} - ${followUp.title}`);
          console.log(`      📅 Scheduled: ${scheduledDate}`);
          console.log(`      🎯 Priority: ${followUp.priority}`);
          console.log('');
        });
      }
    } catch (error) {
      console.log('❌ Could not fetch follow-ups (endpoint may not exist)');
    }
    
    console.log('\n🎯 Summary:');
    const foundClients = maazClients.filter(name => 
      clients.find((c: any) => c.name === name)
    );
    
    console.log(`✅ Successfully uploaded clients: ${foundClients.length}/${maazClients.length}`);
    
    if (foundClients.length === maazClients.length) {
      console.log('🎉 All Maaz clients have been successfully uploaded to CRC Warroom!');
      
      // Display client summary with deal values
      const totalDealValue = clients
        .filter((c: any) => maazClients.includes(c.name))
        .reduce((sum: number, c: any) => sum + (c.budget || 0), 0);
      
      console.log(`💰 Total pipeline value: ${totalDealValue.toLocaleString()} AED`);
      console.log(`📊 Average deal size: ${Math.round(totalDealValue / foundClients.length).toLocaleString()} AED`);
      
      // Identify VIP clients
      const vipClients = clients.filter((c: any) => 
        maazClients.includes(c.name) && (c.budget || 0) > 500000
      );
      
      if (vipClients.length > 0) {
        console.log(`\n👑 VIP Clients (500K+ AED):`);
        vipClients.forEach((client: any) => {
          console.log(`   • ${client.name}: ${client.budget?.toLocaleString()} AED`);
        });
      }
    } else {
      console.log('⚠️  Some clients may be missing. Please re-run the upload script if needed.');
    }
    
  } catch (error) {
    console.error('❌ Error verifying upload:', error);
  }
}

verifyUpload().catch(console.error);