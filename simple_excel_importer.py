#!/usr/bin/env python3
"""
🚨 SIMPLE EXCEL IMPORTER - NO EXTERNAL DEPENDENCIES
Direct file processing and manual client creation
"""
import pandas as pd
import json
import os
from datetime import datetime

def process_excel_files():
    """Process Excel files and create client JSON for manual import"""
    print("🚨 PROCESSING EXCEL FILES FOR SYSTEM INTEGRATION")
    print("=" * 55)
    
    excel_files = [
        ("attached_assets/MOE_DubaiMall_CRCLeadsFollowUP (16)_1757665431024.xlsx", "MOE_Dubai_Leads"),
        ("attached_assets/Vacheron_Constantin_Maaz_Warroom_COMPLETE_FINAL_1757665431025.xlsm", "Vacheron_Complete"), 
        ("attached_assets/Maaz_AllData_With_FollowUp_1757665431025.xlsx", "Maaz_AllData"),
        ("attached_assets/CRC - Sellout Plan  2025 (4)_1757665431026.xlsm", "CRC_SelloutPlan")
    ]
    
    all_clients = []
    total_records = 0
    
    for file_path, source_name in excel_files:
        if not os.path.exists(file_path):
            print(f"⚠️  File not found: {file_path}")
            continue
            
        try:
            print(f"📊 Processing {source_name}: {file_path}")
            
            # Try to read with different engines
            try:
                excel_data = pd.read_excel(file_path, sheet_name=None, engine='openpyxl')
            except:
                try:
                    excel_data = pd.read_excel(file_path, sheet_name=None, engine='xlrd')
                except:
                    print(f"   ❌ Could not read {file_path}")
                    continue
            
            file_clients = []
            
            for sheet_name, df in excel_data.items():
                print(f"   📋 Sheet '{sheet_name}': {len(df)} rows")
                
                for index, row in df.iterrows():
                    # Extract meaningful client data
                    name = None
                    phone = None
                    email = None
                    notes = []
                    
                    # Smart field detection
                    for col in df.columns:
                        col_str = str(col).lower()
                        value = row[col]
                        
                        if pd.notna(value) and str(value).strip():
                            value_str = str(value).strip()
                            
                            # Name detection
                            if not name and any(keyword in col_str for keyword in ['name', 'client', 'customer']):
                                name = value_str
                            
                            # Phone detection
                            elif not phone and any(keyword in col_str for keyword in ['phone', 'mobile', 'tel', 'contact']):
                                phone = value_str
                            
                            # Email detection
                            elif not email and 'email' in col_str:
                                email = value_str
                            
                            # Everything else goes to notes
                            else:
                                notes.append(f"{col}: {value_str}")
                    
                    # Create client record
                    client = {
                        'name': name or f"{source_name}_Record_{len(file_clients)+1}",
                        'phone': phone,
                        'email': email,
                        'status': 'prospect',
                        'priority': 'medium',
                        'notes': f"Source: {source_name} | Sheet: {sheet_name} | " + " | ".join(notes[:5]),
                        'leadScore': 50,
                        'source': source_name,
                        'sheet': sheet_name,
                        'originalData': {str(k): str(v) if pd.notna(v) else None for k, v in row.items()}
                    }
                    
                    file_clients.append(client)
                    total_records += 1
            
            all_clients.extend(file_clients)
            print(f"   ✅ Extracted {len(file_clients)} client records")
            
        except Exception as e:
            print(f"   ❌ Error processing {file_path}: {str(e)}")
            continue
    
    # Save all processed clients
    output_file = "all_excel_clients_for_import.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_clients, f, indent=2, ensure_ascii=False)
    
    # Create import summary
    summary = {
        'timestamp': datetime.now().isoformat(),
        'total_files_attempted': len(excel_files),
        'total_clients_extracted': len(all_clients),
        'total_records_processed': total_records,
        'output_file': output_file,
        'status': 'SUCCESS' if all_clients else 'NO_DATA',
        'ready_for_system_import': True
    }
    
    with open('excel_import_ready.json', 'w') as f:
        json.dump(summary, f, indent=2)
    
    print(f"\n🏆 EXCEL PROCESSING COMPLETE!")
    print(f"=" * 40)
    print(f"📊 Total client records extracted: {len(all_clients)}")
    print(f"📈 Total data records processed: {total_records}")
    print(f"💾 Output file: {output_file}")
    print(f"📋 Summary file: excel_import_ready.json")
    
    if all_clients:
        print("✅ EXCEL DATA READY FOR SYSTEM INTEGRATION!")
    else:
        print("❌ NO CLIENT DATA EXTRACTED - CHECK FILES!")
    
    return len(all_clients) > 0

if __name__ == "__main__":
    success = process_excel_files()
    print("\n🎯 NEXT: Use API endpoint to import this data to live system")
    exit(0 if success else 1)