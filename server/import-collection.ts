import XLSX from 'xlsx';
import type { IStorage } from './storage';

interface CollectionRow {
  Ref: string;
  'Timepiece Reference ': string;
  'Collection name ': string;
  Price: string;
  'CRC STOCK': string;
  Available: boolean;
  'Available_For_Sale': string;
}

interface AirtableRow {
  STATUS: string;
  'CLIENT FEEDBACK': string;
  'REQUEST DATE': string;
  REFERENCE: string;
  'Collection Name': string;
  Price: string;
  'Price 2 ': number;
  BOUTIQUE: string;
  'CLIENT ID': number;
  'CLIENT SEGMENT': string;
  'SALES ASSOCIATE': string;
  COMMENTS: string;
  'Avalible?': boolean;
}

function parsePrice(priceStr: string | number): number {
  if (!priceStr) return 0;
  // If already a number, return it
  if (typeof priceStr === 'number') return priceStr;
  // Remove "AED" and commas, then parse
  const cleaned = String(priceStr).replace(/[^\d.]/g, '');
  return parseFloat(cleaned) || 0;
}

function parseExcelDate(dateValue: any): Date | undefined {
  if (!dateValue) return undefined;
  try {
    // Excel date serial number
    if (typeof dateValue === 'number') {
      const date = XLSX.SSF.parse_date_code(dateValue);
      return new Date(date.y, date.m - 1, date.d);
    }
    // String date
    const parsed = new Date(dateValue);
    return isNaN(parsed.getTime()) ? undefined : parsed;
  } catch {
    return undefined;
  }
}

export async function importCollectionWatches(storage: IStorage, excelPath: string): Promise<{
  imported: number;
  updated: number;
  skipped: number;
}> {
  try {
    console.log('🕐 Starting watch collection import from Excel...');
    
    const workbook = XLSX.readFile(excelPath);
    const collectionSheet = workbook.Sheets['Collection'];
    
    if (!collectionSheet) {
      throw new Error('Collection sheet not found in Excel file');
    }
    
    const rawData = XLSX.utils.sheet_to_json<CollectionRow>(collectionSheet);
    console.log(`📄 Found ${rawData.length} watches in Collection tab`);
    
    let imported = 0;
    let updated = 0;
    let skipped = 0;
    
    for (const row of rawData) {
      try {
        const reference = row['Timepiece Reference ']?.trim();
        const modelCode = row.Ref?.trim();
        
        if (!reference || !modelCode) {
          skipped++;
          continue;
        }
        
        const collectionName = row['Collection name ']?.trim();
        const priceAED = parsePrice(row.Price);
        const available = row.Available === true || row['CRC STOCK']?.toLowerCase() === 'yes';
        
        // Check if watch already exists
        const existing = await storage.getWatchByReference(reference);
        
        const watchData = {
          reference,
          model: modelCode,
          collectionName: collectionName || undefined,
          description: collectionName || undefined,
          price: priceAED,
          currency: 'AED',
          available,
          stock: available ? 'In Stock' : 'Out of Stock',
          category: 'Luxury Watch',
          brand: 'Vacheron Constantin'
        };
        
        if (existing) {
          // Update existing watch
          await storage.updateWatch(existing.id, watchData);
          updated++;
          console.log(`  🔄 Updated: ${reference}`);
        } else {
          // Create new watch
          await storage.createWatch(watchData);
          imported++;
          console.log(`  ✅ Added: ${reference}`);
        }
      } catch (error) {
        console.error(`  ❌ Error processing watch:`, error);
        skipped++;
      }
    }
    
    console.log(`✅ Collection import complete: ${imported} new, ${updated} updated, ${skipped} skipped`);
    return { imported, updated, skipped };
  } catch (error) {
    console.error('❌ Collection import error:', error);
    throw error;
  }
}

export async function importAirtableClients(storage: IStorage, excelPath: string): Promise<{
  imported: number;
  updated: number;
  skipped: number;
}> {
  try {
    console.log('👥 Starting Airtable client import from Excel...');
    
    const workbook = XLSX.readFile(excelPath);
    const airtableSheet = workbook.Sheets['Airtable'];
    
    if (!airtableSheet) {
      throw new Error('Airtable sheet not found in Excel file');
    }
    
    const rawData = XLSX.utils.sheet_to_json<AirtableRow>(airtableSheet);
    console.log(`📄 Found ${rawData.length} rows in Airtable tab`);
    
    // Filter for CRC team members only: Maaz, Asma, Riham
    const crcTeamData = rawData.filter(row => {
      const salesAssociate = String(row['SALES ASSOCIATE'] || '').toLowerCase();
      return salesAssociate.includes('maaz') || 
             salesAssociate.includes('asma') || 
             salesAssociate.includes('riham');
    });
    
    console.log(`✅ ${crcTeamData.length} rows belong to CRC team (Maaz, Asma, Riham)`);
    
    // Deduplicate by CLIENT_ID
    const uniqueClients = new Map<string, AirtableRow>();
    for (const row of crcTeamData) {
      const clientId = String(row['CLIENT ID']);
      if (clientId && !uniqueClients.has(clientId)) {
        uniqueClients.set(clientId, row);
      }
    }
    
    console.log(`🔍 ${uniqueClients.size} unique clients after deduplication`);
    
    let imported = 0;
    let updated = 0;
    let skipped = 0;
    
    for (const [clientIdStr, row] of Array.from(uniqueClients.entries())) {
      try {
        const clientId = String(row['CLIENT ID']);
        
        if (!clientId) {
          skipped++;
          continue;
        }
        
        // Map status from Airtable to our schema
        let status = 'prospect';
        const airtableStatus = (row.STATUS || '').toLowerCase();
        if (airtableStatus.includes('confirmed')) status = 'confirmed';
        else if (airtableStatus.includes('sold')) status = 'sold';
        else if (airtableStatus.includes('request')) status = 'requested_callback';
        else if (airtableStatus.includes('cancelled')) status = 'changed_mind';
        
        // Determine priority from segment
        let priority = 'medium';
        const segment = row['CLIENT SEGMENT'] || '';
        if (segment === 'VIP') {
          priority = 'high';
        }
        
        const watchRef = row.REFERENCE || '';
        const price = row['Price 2 '] || parsePrice(row.Price);
        
        // Check if client already exists
        const existing = await storage.getClient(clientId);
        
        const clientData = {
          id: clientId,
          name: `Client ${clientId}`,
          status: status as any,
          interests: watchRef,
          notes: row.COMMENTS || '',
          priority: priority as any,
          clientFeedback: row['CLIENT FEEDBACK'] || null,
          requestDate: parseExcelDate(row['REQUEST DATE']),
          boutique: row.BOUTIQUE,
          clientSegment: row['CLIENT SEGMENT'],
          salesAssociate: row['SALES ASSOCIATE'],
          boutiqueSalesAssociateName: row['SALES ASSOCIATE']
        };
        
        if (existing) {
          // Update existing client
          await storage.updateClient(clientId, clientData);
          updated++;
          console.log(`  🔄 Updated: Client ${clientId} (${row['SALES ASSOCIATE']})`);
        } else {
          // Create new client
          await storage.createClient(clientData);
          imported++;
          console.log(`  ✅ Added: Client ${clientId} (${row['SALES ASSOCIATE']})`);
        }
      } catch (error) {
        console.error(`  ❌ Error processing client:`, error);
        skipped++;
      }
    }
    
    console.log(`✅ Airtable import complete: ${imported} new, ${updated} updated, ${skipped} skipped`);
    return { imported, updated, skipped };
  } catch (error) {
    console.error('❌ Airtable import error:', error);
    throw error;
  }
}

export async function importFullExcelData(excelPath: string = 'attached_assets/Vacheron_ConstantinFINAL_1760372461825.xlsm'): Promise<void> {
  const { storage } = await import('./storage');
  
  console.log('📊 Starting full Excel data import...');
  console.log(`📁 File: ${excelPath}`);
  
  // Import watches from Collection tab
  const watchResults = await importCollectionWatches(storage, excelPath);
  console.log(`\n🕐 Watch Import Summary:`);
  console.log(`   New: ${watchResults.imported}`);
  console.log(`   Updated: ${watchResults.updated}`);
  console.log(`   Skipped: ${watchResults.skipped}`);
  
  // Import clients from Airtable tab
  const clientResults = await importAirtableClients(storage, excelPath);
  console.log(`\n👥 Client Import Summary:`);
  console.log(`   New: ${clientResults.imported}`);
  console.log(`   Updated: ${clientResults.updated}`);
  console.log(`   Skipped: ${clientResults.skipped}`);
  
  console.log('\n✅ Full Excel import complete!');
}
