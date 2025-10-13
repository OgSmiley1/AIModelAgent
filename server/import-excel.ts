import XLSX from 'xlsx';
import type { IStorage } from './storage';

interface ExcelClientRow {
  Client_ID: number;
  Watch_Ref: string;
  Status: string;
  Client_Feedback?: string;
  Request_Date: string;
  Boutique: string;
  Client_Segment: string;
  Sales_Associate: string;
  Comments: string;
  FollowUp_Date?: string;
  Days_Remaining?: number;
  FollowUp_Status?: string;
  Priority_Level?: string;
  Last_Contact?: string;
  Next_Action?: string;
  Completed?: string;
  Reminder_Set?: string;
  Reminder_Date?: string;
  Reminder_Notes?: string;
  Primary_Owner?: string;
  Backup_Owner?: string;
  Handover_Status?: string;
  Handover_Date?: string;
  Handover_Notes?: string;
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

export async function importExcelData(storage: IStorage): Promise<{
  imported: number;
  errors: number;
  skipped: number;
  appointments: number;
}> {
  try {
    console.log('📊 Starting Excel data import from new client file...');
    
    // Read the new pasted client file
    const workbook = XLSX.readFile('attached_assets/Pasted-Client-ID-Watch-Ref-Status-Client-Feedback-Request-Date-Boutique-Client-Segment-Sales-Associate-Comm-1760194037319_1760194037319.txt', {
      type: 'file',
      raw: true
    });
    
    const sheetName = workbook.SheetNames[0];
    const rawClients = XLSX.utils.sheet_to_json<ExcelClientRow>(workbook.Sheets[sheetName]);
    
    console.log(`📄 Found ${rawClients.length} rows in Excel file`);
    
    // Keep ONLY MAAZ entries (as per user requirement: "only for NAAZ under my name")
    const validClients = rawClients.filter(row => {
      const salesAssociate = String(row.Sales_Associate || '').toLowerCase();
      return salesAssociate.includes('maaz') && row.Client_ID;
    });
    
    console.log(`✅ ${validClients.length} valid MAAZ clients found`);
    
    // Get existing clients to check for duplicates
    const existingClients = await storage.getAllClients();
    const existingClientIds = new Set(existingClients.map((c: any) => c.id));
    
    // Remove duplicates - keep unique client records only (first occurrence)
    // If same client has multiple rows with same reference, keep only first
    const seenClientIds = new Set<string>();
    const uniqueClients: ExcelClientRow[] = [];
    
    for (const row of validClients) {
      const clientId = String(row.Client_ID);
      if (!seenClientIds.has(clientId)) {
        uniqueClients.push(row);
        seenClientIds.add(clientId);
      }
    }
    
    console.log(`🔍 ${uniqueClients.length} unique client-watch combinations (removed duplicates)`);
    
    let imported = 0;
    let skipped = 0;
    let errors = 0;
    
    // Import clients with ALL fields
    for (const excelClient of uniqueClients) {
      try {
        const clientId = String(excelClient.Client_ID);
        
        // Skip if client already exists
        if (existingClientIds.has(clientId)) {
          skipped++;
          continue;
        }
        
        // Map status from Excel to our schema
        let status = 'prospect';
        const excelStatus = (excelClient.Status || '').toLowerCase();
        if (excelStatus.includes('confirmed')) status = 'confirmed';
        else if (excelStatus.includes('sold')) status = 'sold';
        else if (excelStatus.includes('request')) status = 'requested_callback';
        else if (excelStatus.includes('cancelled')) status = 'changed_mind';
        
        // Determine priority from segment and priority level
        let priority = 'medium';
        if (excelClient.Client_Segment === 'VIP' || excelClient.Priority_Level?.toLowerCase() === 'high') {
          priority = 'high';
        } else if (excelClient.Priority_Level?.toLowerCase() === 'low') {
          priority = 'low';
        }
        
        // Create comprehensive client record with ALL Excel fields
        await storage.createClient({
          id: clientId,
          name: `Client ${clientId}`,
          status: status as any,
          interests: excelClient.Watch_Ref,
          notes: excelClient.Comments || '',
          priority: priority as any,
          // Excel tracker fields
          clientFeedback: excelClient.Client_Feedback || null,
          requestDate: parseExcelDate(excelClient.Request_Date),
          boutique: excelClient.Boutique,
          clientSegment: excelClient.Client_Segment,
          salesAssociate: excelClient.Sales_Associate,
          followUpStatus: excelClient.FollowUp_Status || null,
          priorityLevel: excelClient.Priority_Level || null,
          lastContact: parseExcelDate(excelClient.Last_Contact),
          nextAction: excelClient.Next_Action || null,
          completed: excelClient.Completed?.toLowerCase() === 'yes' || false,
          reminderSet: excelClient.Reminder_Set?.toLowerCase() === 'yes' || false,
          reminderDate: parseExcelDate(excelClient.Reminder_Date),
          reminderNotes: excelClient.Reminder_Notes || null,
          primaryOwner: excelClient.Primary_Owner || null,
          backupOwner: excelClient.Backup_Owner || null,
          handoverStatus: excelClient.Handover_Status || null,
          handoverDate: parseExcelDate(excelClient.Handover_Date),
          handoverNotes: excelClient.Handover_Notes || null,
          followUpDate: parseExcelDate(excelClient.FollowUp_Date),
          boutiqueSalesAssociateName: excelClient.Sales_Associate,
        });
        
        imported++;
      } catch (error) {
        console.error('Error importing client:', error);
        errors++;
      }
    }
    
    console.log(`📊 Excel import complete: ${imported} new clients imported, ${skipped} duplicates skipped`);
    return { imported, errors, skipped, appointments: 0 };
  } catch (error) {
    console.error('Excel import error:', error);
    throw error;
  }
}
