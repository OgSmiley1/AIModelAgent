import XLSX from 'xlsx';

// Read the latest Airtable data
const airtable = XLSX.readFile('attached_assets/last updatres_1760191436408.xlsx');
console.log('=== AIRTABLE DATA ===');
console.log('Sheets:', airtable.SheetNames);

// Get first sheet
const airtableSheet = airtable.Sheets[airtable.SheetNames[0]];
const airtableData = XLSX.utils.sheet_to_json(airtableSheet);
console.log('Total rows:', airtableData.length);
console.log('Sample row:', JSON.stringify(airtableData[0], null, 2));
console.log('All columns:', Object.keys(airtableData[0] || {}));

console.log('\n=== VACHERON TRACKER ===');
const vacheron = XLSX.readFile('attached_assets/Vacheron_Constantin V1 tracker_1760191439139.xlsm');
console.log('Sheets:', vacheron.SheetNames);

// Check each sheet
for (const sheetName of vacheron.SheetNames) {
  const sheet = vacheron.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet);
  console.log(`\nSheet: ${sheetName}`);
  console.log('Rows:', data.length);
  if (data.length > 0) {
    console.log('Sample:', JSON.stringify(data[0], null, 2));
  }
}
