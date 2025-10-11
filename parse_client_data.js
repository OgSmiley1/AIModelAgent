import XLSX from 'xlsx';
import fs from 'fs';

// Read Vacheron tracker
const vacheron = XLSX.readFile('attached_assets/Vacheron_Constantin V1 tracker_1760191439139.xlsm');

// Get Airtable sheet
const airtableSheet = vacheron.Sheets['Airtable'];
const clients = XLSX.utils.sheet_to_json(airtableSheet);

// Filter out rows with 'maaz' and get valid clients
const validClients = clients.filter(row => {
  const salesAssociate = String(row['SALES ASSOCIATE'] || '').toLowerCase();
  return !salesAssociate.includes('maaz') && row['CLIENT ID'];
});

console.log(`Total clients: ${validClients.length}`);
console.log('\nSample client data:');
console.log(JSON.stringify(validClients.slice(0, 3), null, 2));

// Get Reminder Automation sheet
if (vacheron.Sheets['Reminder_Automation']) {
  const reminderSheet = vacheron.Sheets['Reminder_Automation'];
  const reminders = XLSX.utils.sheet_to_json(reminderSheet);
  console.log('\n\n=== REMINDER AUTOMATION ===');
  console.log(`Total reminders: ${reminders.length}`);
  console.log('Sample:');
  console.log(JSON.stringify(reminders.slice(0, 3), null, 2));
}

// Save to file for inspection
fs.writeFileSync('client_data_parsed.json', JSON.stringify(validClients, null, 2));
console.log('\n✅ Client data saved to client_data_parsed.json');
