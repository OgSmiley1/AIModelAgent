import pandas as pd
import os
import json
from datetime import datetime

def extract_maaz_summary():
    """Extract focused Maaz client data with key fields"""
    
    files = {
        "exported-data": "attached_assets/exported-data (49)_1757345821285.xlsx",
        "MOE_DubaiMall": "attached_assets/MOE_DubaiMall_CRCLeadsFollowUP (13)_1757345821286.xlsx", 
        "CRC_SelloutPlan": "attached_assets/CRC - Sellout Plan  2025 (4)_1757345821288.xlsm",
        "VC_Warroom": "attached_assets/Vacheron_Constantin_Maaz_Warroom v1_1757345821289.xlsx"
    }
    
    maaz_clients = []
    
    for file_key, file_path in files.items():
        print(f"\n📊 PROCESSING: {file_key}")
        if not os.path.exists(file_path):
            print(f"❌ File not found")
            continue
            
        try:
            if file_path.endswith('.xlsm'):
                excel_file = pd.ExcelFile(file_path, engine='openpyxl')
            else:
                excel_file = pd.ExcelFile(file_path)
            
            for sheet_name in excel_file.sheet_names:
                print(f"  📋 Sheet: {sheet_name}")
                
                try:
                    df = pd.read_excel(file_path, sheet_name=sheet_name)
                    
                    # Look for Maaz in any column
                    maaz_mask = df.astype(str).apply(lambda x: x.str.contains('maaz', case=False, na=False)).any(axis=1)
                    maaz_rows = df[maaz_mask]
                    
                    if len(maaz_rows) > 0:
                        print(f"    ✅ Found {len(maaz_rows)} Maaz entries")
                        
                        for idx, row in maaz_rows.iterrows():
                            client_data = {
                                'source_file': file_key,
                                'sheet': sheet_name,
                                'row_index': idx
                            }
                            
                            # Extract key fields (common client data columns)
                            key_fields = ['name', 'client', 'contact', 'phone', 'email', 'status', 
                                        'product', 'model', 'price', 'date', 'notes', 'location',
                                        'followup', 'interest', 'budget', 'appointment']
                            
                            for col in df.columns:
                                col_lower = str(col).lower()
                                value = row[col]
                                
                                # Store non-empty values
                                if pd.notna(value) and str(value).strip():
                                    # Check if column matches key fields
                                    for key_field in key_fields:
                                        if key_field in col_lower:
                                            client_data[f"{key_field}"] = str(value)
                                            break
                                    else:
                                        # Store other relevant data
                                        client_data[f"col_{col}"] = str(value)
                            
                            maaz_clients.append(client_data)
                    
                except Exception as e:
                    print(f"    ❌ Error reading sheet: {str(e)[:100]}")
        
        except Exception as e:
            print(f"❌ Error processing file: {str(e)[:100]}")
    
    return maaz_clients

def print_maaz_summary(clients):
    """Print summary of Maaz clients"""
    print(f"\n🎯 MAAZ CLIENT SUMMARY")
    print(f"{'='*50}")
    print(f"Total Maaz entries found: {len(clients)}")
    
    # Group by source
    sources = {}
    for client in clients:
        source = client['source_file']
        if source not in sources:
            sources[source] = []
        sources[source].append(client)
    
    print(f"\n📊 BY SOURCE:")
    for source, data in sources.items():
        print(f"  {source}: {len(data)} entries")
    
    # Show first few entries with key details
    print(f"\n📋 SAMPLE MAAZ CLIENT ENTRIES:")
    for i, client in enumerate(clients[:10]):  # First 10 entries
        print(f"\n--- MAAZ CLIENT #{i+1} ---")
        print(f"Source: {client['source_file']} -> {client['sheet']}")
        
        # Show key fields
        for key, value in client.items():
            if key not in ['source_file', 'sheet', 'row_index'] and 'maaz' in str(value).lower():
                print(f"  🎯 {key}: {value}")
        
        # Show other relevant fields
        relevant_fields = []
        for key, value in client.items():
            if (key not in ['source_file', 'sheet', 'row_index'] and 
                'maaz' not in str(value).lower() and
                any(term in key.lower() for term in ['name', 'contact', 'phone', 'email', 'product', 'price', 'status'])):
                relevant_fields.append(f"{key}: {value}")
        
        if relevant_fields:
            print(f"  📞 Key Details: {' | '.join(relevant_fields[:3])}")

def save_maaz_data(clients):
    """Save all Maaz data to JSON file"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"maaz_clients_extracted_{timestamp}.json"
    
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(clients, f, indent=2, ensure_ascii=False)
    
    print(f"\n💾 SAVED: All Maaz data saved to {filename}")
    return filename

if __name__ == "__main__":
    print("🚀 STARTING MAAZ CLIENT EXTRACTION...")
    
    # Extract data
    maaz_clients = extract_maaz_summary()
    
    # Print summary
    print_maaz_summary(maaz_clients)
    
    # Save to file
    saved_file = save_maaz_data(maaz_clients)
    
    print(f"\n✅ EXTRACTION COMPLETE!")
    print(f"   Total entries: {len(maaz_clients)}")
    print(f"   Saved to: {saved_file}")