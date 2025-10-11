import XLSX from 'xlsx';
import type { Storage } from './storage';

interface ExcelClient {
  STATUS: string;
  'REQUEST DATE': string;
  REFERENCE: string;
  'Collection Name': string;
  'BOUTIQUE': string;
  'CLIENT ID': number;
  'CLIENT SEGMENT': string;
  'SALES ASSOCIATE': string;
  COMMENTS: string;
  'CLIENT FEEDBACK'?: string;
}

export async function importExcelData(storage: Storage): Promise<{
  imported: number;
  errors: number;
  skipped: number;
  appointments: number;
}> {
  try {
    // Read Vacheron tracker workbook (try new file first, fallback to old)
    let workbook;
    try {
      workbook = XLSX.readFile('attached_assets/Vacheron_Constantin V1 tracker_1760192864660.xlsm');
    } catch {
      workbook = XLSX.readFile('attached_assets/Vacheron_Constantin V1 tracker_1760191439139.xlsm');
    }
    
    // Get Airtable sheet for client data
    const airtableSheet = workbook.Sheets['Airtable'];
    const rawClients = XLSX.utils.sheet_to_json<ExcelClient>(airtableSheet);
    
    // Filter out maaz and invalid entries
    const validClients = rawClients.filter(row => {
      const salesAssociate = String(row['SALES ASSOCIATE'] || '').toLowerCase();
      return !salesAssociate.includes('maaz') && row['CLIENT ID'];
    });
    
    // Get existing clients to check for duplicates
    const existingClients = await storage.getAllClients();
    const existingClientIds = new Set(existingClients.map(c => c.id));
    
    let imported = 0;
    let skipped = 0;
    let errors = 0;
    
    // Import clients
    for (const excelClient of validClients) {
      try {
        const clientId = String(excelClient['CLIENT ID']);
        
        // Skip if client already exists
        if (existingClientIds.has(clientId)) {
          skipped++;
          continue;
        }
        
        // Map status from Excel to our schema
        let status = 'prospect';
        const excelStatus = (excelClient.STATUS || '').toLowerCase();
        if (excelStatus.includes('confirmed')) status = 'confirmed';
        else if (excelStatus.includes('sold')) status = 'sold';
        else if (excelStatus.includes('request')) status = 'requested_callback';
        else if (excelStatus.includes('changed') || excelStatus.includes('closed')) status = 'changed_mind';
        
        // Create new client
        await storage.createClient({
          id: clientId,
          name: `Client ${clientId}`,
          status: status as any,
          interests: excelClient['Collection Name'] || excelClient.REFERENCE,
          notes: [
            excelClient.COMMENTS,
            excelClient['CLIENT FEEDBACK'],
            `Reference: ${excelClient.REFERENCE}`,
            `Boutique: ${excelClient.BOUTIQUE}`
          ].filter(Boolean).join('\n'),
          priority: excelClient['CLIENT SEGMENT'] === 'VIP' ? 'high' : 'medium',
          boutiqueSalesAssociateName: excelClient['SALES ASSOCIATE'],
        });
        
        imported++;
      } catch (error) {
        console.error('Error importing client:', error);
        errors++;
      }
    }
    
    // Import appointments from Reminder_Automation sheet
    let appointments = 0;
    if (workbook.Sheets['Reminder_Automation']) {
      const reminderSheet = workbook.Sheets['Reminder_Automation'];
      const reminders = XLSX.utils.sheet_to_json(reminderSheet);
      
      for (const reminder of reminders.slice(2)) { // Skip header rows
        try {
          const clientId = String((reminder as any)['⏰ REMINDER AUTOMATION SYSTEM']);
          const reminderDate = (reminder as any)['__EMPTY_3'];
          const watchRef = (reminder as any)['__EMPTY_1'];
          
          if (clientId && reminderDate && clientId !== 'Client_ID') {
            await storage.createFollowUp({
              clientId: clientId,
              type: 'reminder',
              title: `Appointment - ${watchRef}`,
              description: `Follow-up for watch reference: ${watchRef}`,
              scheduledFor: new Date(reminderDate),
              priority: ((reminder as any)['__EMPTY_5'] || 'MEDIUM').toLowerCase() as any,
              channel: 'call'
            });
            appointments++;
          }
        } catch (error) {
          console.error('Error importing appointment:', error);
        }
      }
    }
    
    console.log(`📊 Excel import complete: ${imported} new clients imported, ${skipped} duplicates skipped, ${appointments} appointments`);
    return { imported, errors, skipped, appointments };
  } catch (error) {
    console.error('Excel import error:', error);
    throw error;
  }
}
