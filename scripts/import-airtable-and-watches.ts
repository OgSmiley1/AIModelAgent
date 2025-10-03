import XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

interface ClientRecord {
  name: string;
  phone?: string;
  email?: string;
  whatsappNumber?: string;
  status?: string;
  priority?: string;
  interests?: string;
  notes?: string;
  budget?: number;
  timeframe?: string;
  location?: string;
  decisionMaker?: boolean;
  leadScore?: number;
  conversionProbability?: number;
  engagementLevel?: string;
  followUpRequired?: boolean;
  followUpDate?: Date;
  tags?: string[];
}

interface WatchRecord {
  reference: string;
  collectionName?: string;
  brand?: string;
  model?: string;
  description?: string;
  price?: number;
  currency?: string;
  available?: boolean;
  stock?: string;
  category?: string;
  specifications?: any;
  images?: string[];
  tags?: string[];
}

// Read Airtable clients file
function extractClientsFromAirtable(filePath: string): ClientRecord[] {
  console.log(`\n📋 Reading Airtable file: ${filePath}`);
  
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    console.log(`📄 Found sheet: ${sheetName}`);
    
    const worksheet = workbook.Sheets[sheetName];
    const rawData: any[] = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`📊 Found ${rawData.length} rows in Airtable`);
    console.log(`🔍 Sample columns:`, Object.keys(rawData[0] || {}).slice(0, 10));
    
    const clients: ClientRecord[] = rawData.map((row, index) => {
      // Flexible column name matching
      const getName = () => {
        for (const key of Object.keys(row)) {
          if (key.toLowerCase().includes('name') || key.toLowerCase().includes('client')) {
            return String(row[key] || `Client ${index + 1}`);
          }
        }
        return `Client ${index + 1}`;
      };
      
      const getPhone = () => {
        for (const key of Object.keys(row)) {
          if (key.toLowerCase().includes('phone') || key.toLowerCase().includes('mobile')) {
            return row[key] ? String(row[key]) : undefined;
          }
        }
        return undefined;
      };
      
      const getEmail = () => {
        for (const key of Object.keys(row)) {
          if (key.toLowerCase().includes('email')) {
            return row[key] ? String(row[key]) : undefined;
          }
        }
        return undefined;
      };
      
      const getStatus = () => {
        for (const key of Object.keys(row)) {
          if (key.toLowerCase().includes('status')) {
            const status = String(row[key] || 'prospect').toLowerCase();
            return ['prospect', 'active', 'inactive', 'vip'].includes(status) ? status : 'prospect';
          }
        }
        return 'prospect';
      };
      
      const getPriority = () => {
        for (const key of Object.keys(row)) {
          if (key.toLowerCase().includes('priority') || key.toLowerCase().includes('segment')) {
            const val = String(row[key] || '').toLowerCase();
            if (val.includes('vip')) return 'vip';
            if (val.includes('high')) return 'high';
            if (val.includes('low')) return 'low';
            return 'medium';
          }
        }
        return 'medium';
      };
      
      const getInterests = () => {
        for (const key of Object.keys(row)) {
          if (key.toLowerCase().includes('interest') || key.toLowerCase().includes('product') || 
              key.toLowerCase().includes('reference') || key.toLowerCase().includes('watch')) {
            return row[key] ? String(row[key]) : '';
          }
        }
        return '';
      };
      
      const getNotes = () => {
        for (const key of Object.keys(row)) {
          if (key.toLowerCase().includes('note') || key.toLowerCase().includes('comment') || 
              key.toLowerCase().includes('description')) {
            return row[key] ? String(row[key]) : '';
          }
        }
        return '';
      };
      
      const getLocation = () => {
        for (const key of Object.keys(row)) {
          if (key.toLowerCase().includes('location') || key.toLowerCase().includes('city') || 
              key.toLowerCase().includes('country') || key.toLowerCase().includes('boutique')) {
            return row[key] ? String(row[key]) : '';
          }
        }
        return '';
      };
      
      const name = getName();
      const phone = getPhone();
      const status = getStatus();
      const priority = getPriority();
      
      // Calculate lead score based on data completeness and priority
      let leadScore = 50;
      if (status === 'active') leadScore += 20;
      if (priority === 'vip') leadScore += 30;
      else if (priority === 'high') leadScore += 15;
      if (getInterests()) leadScore += 10;
      if (phone) leadScore += 10;
      if (getEmail()) leadScore += 10;
      
      return {
        name,
        phone,
        email: getEmail(),
        whatsappNumber: phone,
        status,
        priority,
        interests: getInterests(),
        notes: getNotes(),
        location: getLocation(),
        budget: 0,
        timeframe: 'medium_term',
        decisionMaker: false,
        leadScore,
        conversionProbability: leadScore > 70 ? 0.7 : 0.5,
        engagementLevel: priority === 'vip' ? 'very_high' : priority === 'high' ? 'high' : 'medium',
        followUpRequired: true,
        tags: ['airtable_import', 'vacheron_constantin', 'luxury_watches']
      };
    });
    
    console.log(`✅ Extracted ${clients.length} clients from Airtable`);
    return clients;
    
  } catch (error) {
    console.error('❌ Error reading Airtable file:', error);
    return [];
  }
}

// Read watch references from Vacheron Constantin file
function extractWatchesFromVC(filePath: string): WatchRecord[] {
  console.log(`\n⌚ Reading Vacheron Constantin file: ${filePath}`);
  
  try {
    const workbook = XLSX.readFile(filePath);
    console.log(`📚 Found ${workbook.SheetNames.length} sheets:`, workbook.SheetNames.join(', '));
    
    const allWatches: WatchRecord[] = [];
    
    // Try to find a sheet with watch/product data
    for (const sheetName of workbook.SheetNames) {
      if (sheetName.toLowerCase().includes('collection') || 
          sheetName.toLowerCase().includes('watch') || 
          sheetName.toLowerCase().includes('product') || 
          sheetName.toLowerCase().includes('reference') ||
          sheetName.toLowerCase().includes('catalog') ||
          sheetName.toLowerCase().includes('inventory')) {
        
        console.log(`\n📄 Processing sheet: ${sheetName}`);
        const worksheet = workbook.Sheets[sheetName];
        const rawData: any[] = XLSX.utils.sheet_to_json(worksheet);
        
        if (rawData.length === 0) continue;
        
        console.log(`📊 Found ${rawData.length} rows`);
        console.log(`🔍 Sample columns:`, Object.keys(rawData[0] || {}).slice(0, 10));
        
        const watches = rawData.map((row, index) => {
          // Flexible column matching
          const getReference = () => {
            for (const key of Object.keys(row)) {
              if (key.toLowerCase().includes('reference') || key.toLowerCase().includes('ref') ||
                  key.toLowerCase().includes('sku') || key.toLowerCase().includes('model')) {
                return row[key] ? String(row[key]) : `REF-${Date.now()}-${index}`;
              }
            }
            return `REF-${Date.now()}-${index}`;
          };
          
          const getCollection = () => {
            for (const key of Object.keys(row)) {
              if (key.toLowerCase().includes('collection') || key.toLowerCase().includes('series')) {
                return row[key] ? String(row[key]) : undefined;
              }
            }
            return undefined;
          };
          
          const getModel = () => {
            for (const key of Object.keys(row)) {
              if (key.toLowerCase().includes('model') || key.toLowerCase().includes('name')) {
                return row[key] ? String(row[key]) : undefined;
              }
            }
            return undefined;
          };
          
          const getDescription = () => {
            for (const key of Object.keys(row)) {
              if (key.toLowerCase().includes('description') || key.toLowerCase().includes('details')) {
                return row[key] ? String(row[key]) : undefined;
              }
            }
            return undefined;
          };
          
          const getPrice = () => {
            for (const key of Object.keys(row)) {
              if (key.toLowerCase().includes('price') || key.toLowerCase().includes('cost')) {
                const val = row[key];
                if (typeof val === 'number') return val;
                if (typeof val === 'string') {
                  const num = parseFloat(val.replace(/[^0-9.]/g, ''));
                  return isNaN(num) ? 0 : num;
                }
              }
            }
            return 0;
          };
          
          const getAvailable = () => {
            for (const key of Object.keys(row)) {
              if (key.toLowerCase().includes('available') || key.toLowerCase().includes('stock') ||
                  key.toLowerCase().includes('status')) {
                const val = String(row[key] || '').toLowerCase();
                return val.includes('available') || val.includes('in stock') || val.includes('yes');
              }
            }
            return false;
          };
          
          return {
            reference: getReference(),
            collectionName: getCollection(),
            brand: 'Vacheron Constantin',
            model: getModel(),
            description: getDescription(),
            price: getPrice(),
            currency: 'USD',
            available: getAvailable(),
            stock: getAvailable() ? 'Available' : 'Contact for availability',
            category: 'Luxury Watch',
            specifications: {},
            images: [],
            tags: ['vacheron_constantin', 'luxury', 'swiss_watches']
          };
        });
        
        allWatches.push(...watches);
        console.log(`✅ Extracted ${watches.length} watches from ${sheetName}`);
      }
    }
    
    console.log(`\n✅ Total watches extracted: ${allWatches.length}`);
    return allWatches;
    
  } catch (error) {
    console.error('❌ Error reading Vacheron Constantin file:', error);
    return [];
  }
}

// Main execution
async function main() {
  console.log('\n🚀 Starting import process...\n');
  
  const airtablePath = path.join(process.cwd(), 'attached_assets', 'Latest Airtable_1759507236807.xlsx');
  const vcPath = path.join(process.cwd(), 'attached_assets', 'Vacheron_Constantin_Intelligence_Engine_HANDOVER_COMPLETE_1759507250724.xlsm');
  
  // Extract clients
  const clients = extractClientsFromAirtable(airtablePath);
  if (clients.length > 0) {
    const clientsOutput = path.join(process.cwd(), 'extracted_clients.json');
    fs.writeFileSync(clientsOutput, JSON.stringify(clients, null, 2));
    console.log(`\n💾 Saved ${clients.length} clients to: ${clientsOutput}`);
  }
  
  // Extract watches
  const watches = extractWatchesFromVC(vcPath);
  if (watches.length > 0) {
    const watchesOutput = path.join(process.cwd(), 'extracted_watches.json');
    fs.writeFileSync(watchesOutput, JSON.stringify(watches, null, 2));
    console.log(`💾 Saved ${watches.length} watches to: ${watchesOutput}`);
  }
  
  console.log('\n✨ Extraction complete! Files ready for import.\n');
  console.log('📊 Summary:');
  console.log(`   Clients: ${clients.length}`);
  console.log(`   Watches: ${watches.length}`);
  console.log('\n🔄 Next step: Import data using API endpoints');
}

main().catch(console.error);
