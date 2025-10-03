import * as fs from 'fs';
import * as path from 'path';

const API_BASE = process.env.REPLIT_DEV_DOMAIN 
  ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
  : 'http://localhost:5000';

async function importClients() {
  console.log('\n📤 Importing clients to database...');
  
  const clientsPath = path.join(process.cwd(), 'extracted_clients.json');
  const clients = JSON.parse(fs.readFileSync(clientsPath, 'utf8'));
  
  const BATCH_SIZE = 50; // Import 50 at a time
  let totalImported = 0;
  let totalErrors = 0;
  
  for (let i = 0; i < clients.length; i += BATCH_SIZE) {
    const batch = clients.slice(i, i + BATCH_SIZE);
    console.log(`   Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(clients.length/BATCH_SIZE)} (${batch.length} clients)...`);
    
    try {
      const response = await fetch(`${API_BASE}/api/clients/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batch)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        totalImported += result.imported || 0;
        totalErrors += result.errors || 0;
      } else {
        console.error('   ❌ Batch failed:', result);
        totalErrors += batch.length;
      }
    } catch (error) {
      console.error('   ❌ Error:', error);
      totalErrors += batch.length;
    }
    
    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('✅ Clients import complete!');
  console.log(`   Imported: ${totalImported}`);
  console.log(`   Errors: ${totalErrors}`);
  console.log(`   Total: ${clients.length}`);
  
  return { imported: totalImported, errors: totalErrors, total: clients.length };
}

async function importWatches() {
  console.log('\n⌚ Importing watches to database...');
  
  const watchesPath = path.join(process.cwd(), 'extracted_watches.json');
  const watches = JSON.parse(fs.readFileSync(watchesPath, 'utf8'));
  
  const BATCH_SIZE = 50; // Import 50 at a time
  let totalImported = 0;
  let totalErrors = 0;
  
  for (let i = 0; i < watches.length; i += BATCH_SIZE) {
    const batch = watches.slice(i, i + BATCH_SIZE);
    console.log(`   Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(watches.length/BATCH_SIZE)} (${batch.length} watches)...`);
    
    try {
      const response = await fetch(`${API_BASE}/api/watches/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batch)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        totalImported += result.imported || 0;
        totalErrors += result.errors || 0;
      } else {
        console.error('   ❌ Batch failed:', result);
        totalErrors += batch.length;
      }
    } catch (error) {
      console.error('   ❌ Error:', error);
      totalErrors += batch.length;
    }
    
    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('✅ Watches import complete!');
  console.log(`   Imported: ${totalImported}`);
  console.log(`   Errors: ${totalErrors}`);
  console.log(`   Total: ${watches.length}`);
  
  return { imported: totalImported, errors: totalErrors, total: watches.length };
}

async function main() {
  console.log('\n🚀 Starting database import process...');
  console.log(`🌐 API Base: ${API_BASE}\n`);
  
  // Wait a moment for server to be ready
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const clientsResult = await importClients();
  const watchesResult = await importWatches();
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 IMPORT SUMMARY');
  console.log('='.repeat(50));
  
  if (clientsResult) {
    console.log(`\n👥 Clients: ${clientsResult.imported}/${clientsResult.total} imported`);
  } else {
    console.log('\n❌ Client import failed');
  }
  
  if (watchesResult) {
    console.log(`⌚ Watches: ${watchesResult.imported}/${watchesResult.total} imported`);
  } else {
    console.log('❌ Watch import failed');
  }
  
  console.log('\n✨ Import process complete!');
}

main().catch(console.error);
