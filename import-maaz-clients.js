import { db } from './server/db.js';
import { clients } from './shared/schema.js';
import fs from 'fs';

async function importMaazClients() {
  console.log('🎯 IMPORTING MAAZ CLIENTS TO DATABASE');
  console.log('='.repeat(50));
  
  try {
    // Load the extracted Maaz client data
    const maazClientsData = JSON.parse(fs.readFileSync('maaz_clients_detailed.json', 'utf8'));
    console.log(`📊 Loaded ${maazClientsData.length} Maaz client records`);
    
    let importedCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < maazClientsData.length; i++) {
      const clientData = maazClientsData[i];
      
      try {
        // Extract key client information
        const clientId = clientData['CLIENT ID'] || '';
        const name = clientId ? `Client ${clientId}` : `Maaz Client ${i + 1}`;
        
        // Get phone from any phone-related field
        let phone = null;
        for (const [key, value] of Object.entries(clientData)) {
          if (key.toLowerCase().includes('phone') && value) {
            phone = String(value);
            break;
          }
        }
        
        // Get email from any email-related field  
        let email = null;
        for (const [key, value] of Object.entries(clientData)) {
          if (key.toLowerCase().includes('email') && value) {
            email = String(value);
            break;
          }
        }
        
        // Get status
        let status = (clientData['STATUS'] || 'prospect').toLowerCase();
        if (!['prospect', 'active', 'inactive', 'vip'].includes(status)) {
          status = 'prospect';
        }
        
        // Get segment/priority
        const segment = (clientData['CLIENT SEGMENT'] || 'medium').toLowerCase();
        let priority = 'medium';
        if (segment.includes('vip')) {
          priority = 'vip';
        } else if (segment.includes('high')) {
          priority = 'high';
        } else if (segment.includes('low')) {
          priority = 'low';
        }
        
        // Get interests (product references)
        let interests = clientData['REFERENCE'] || '';
        if (!interests) {
          // Look for any product/reference fields
          for (const [key, value] of Object.entries(clientData)) {
            if (['reference', 'product', 'model'].some(term => key.toLowerCase().includes(term)) && value) {
              interests = String(value);
              break;
            }
          }
        }
        
        // Get notes/comments
        let notes = clientData['COMMENTS'] || '';
        if (!notes) {
          // Combine other relevant fields as notes
          const noteParts = [];
          for (const [key, value] of Object.entries(clientData)) {
            if (!['CLIENT ID', 'STATUS', 'CLIENT SEGMENT', 'REFERENCE'].includes(key) && value) {
              noteParts.push(`${key}: ${value}`);
            }
          }
          notes = noteParts.slice(0, 3).join(' | '); // First 3 fields only
        }
        
        // Get boutique/location
        const location = clientData['BOUTIQUE'] || 'Phone sales Middle East';
        
        // Get dates
        const requestDateStr = clientData['REQUEST DATE'] || '';
        let lastInteraction = null;
        if (requestDateStr) {
          try {
            // Parse date (format: 29/8/2025)
            const [day, month, year] = requestDateStr.split('/');
            lastInteraction = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
          } catch (e) {
            // Date parsing failed, leave as null
          }
        }
        
        // Calculate lead score based on available data
        let leadScore = 50; // Base score
        if (status === 'active') leadScore += 20;
        if (priority === 'vip') leadScore += 30;
        else if (priority === 'high') leadScore += 15;
        if (interests) leadScore += 10;
        if (phone) leadScore += 10;
        if (email) leadScore += 10;
        
        // Insert client into database
        await db.insert(clients).values({
          name,
          phone,
          email,
          status,
          priority,
          interests,
          location,
          notes,
          leadScore,
          conversionProbability: leadScore > 70 ? 0.7 : 0.5,
          lastInteraction,
          tags: ['maaz', 'luxury_watches', 'vacheron_constantin'],
          totalInteractions: 1,
          followUpRequired: true,
          followUpDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
        }).onConflictDoNothing();
        
        importedCount++;
        
        if ((i + 1) % 50 === 0) {
          console.log(`   📈 Imported ${i + 1}/${maazClientsData.length} clients...`);
        }
        
      } catch (error) {
        errorCount++;
        console.log(`   ❌ Error importing client ${i + 1}: ${error.message.substring(0, 100)}`);
        continue;
      }
    }
    
    console.log(`\n✅ IMPORT COMPLETE!`);
    console.log(`   📊 Successfully imported: ${importedCount} clients`);
    console.log(`   ❌ Errors: ${errorCount} clients`);
    console.log(`   🎯 Total Maaz clients in database: ${importedCount}`);
    
    // Verify import
    const maazCount = await db
      .select()
      .from(clients)
      .where(sql`'maaz' = ANY(tags)`);
    
    console.log(`   ✅ Database verification: ${maazCount.length} Maaz-tagged clients found`);
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
  }
}

// Run the import
importMaazClients().catch(console.error);