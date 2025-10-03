import XLSX from 'xlsx';
import * as path from 'path';

const vcPath = path.join(process.cwd(), 'attached_assets', 'Vacheron_Constantin_Intelligence_Engine_HANDOVER_COMPLETE_1759507250724.xlsm');

console.log('\n🔍 Inspecting Vacheron Constantin file sheets...\n');

const workbook = XLSX.readFile(vcPath);

for (const sheetName of workbook.SheetNames) {
  const worksheet = workbook.Sheets[sheetName];
  const data: any[] = XLSX.utils.sheet_to_json(worksheet);
  
  if (data.length > 0) {
    console.log(`\n📄 Sheet: ${sheetName}`);
    console.log(`   Rows: ${data.length}`);
    console.log(`   Columns: ${Object.keys(data[0]).join(', ')}`);
    console.log(`   Sample data:`, JSON.stringify(data[0], null, 2).substring(0, 300));
  }
}
