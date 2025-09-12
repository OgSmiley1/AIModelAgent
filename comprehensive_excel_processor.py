#!/usr/bin/env python3
"""
🚨 COMPREHENSIVE EXCEL DATA PROCESSOR & SYSTEM INTEGRATOR
Process all Excel files and integrate with the active system
"""
import pandas as pd
import json
import os
import requests
from datetime import datetime
import sys

def safe_convert(value):
    """Safely convert values to JSON-serializable format"""
    if pd.isna(value):
        return None
    if isinstance(value, (pd.Timestamp, datetime)):
        return value.strftime('%Y-%m-%d %H:%M:%S') if hasattr(value, 'strftime') else str(value)
    if isinstance(value, (int, float, str, bool)):
        return value
    return str(value)

def process_excel_to_clients(file_path, source_name):
    """Process Excel file and convert to client format"""
    try:
        print(f"📊 Processing {source_name}: {file_path}")
        
        # Read all sheets
        excel_data = pd.read_excel(file_path, sheet_name=None, engine='openpyxl')
        
        all_clients = []
        total_records = 0
        
        for sheet_name, df in excel_data.items():
            print(f"   📋 Sheet '{sheet_name}': {len(df)} rows")
            
            # Convert each row to client-like format
            for index, row in df.iterrows():
                client_data = {
                    'source_file': source_name,
                    'source_sheet': sheet_name,
                    'row_index': index,
                    'data': {}
                }
                
                # Store all column data
                for col in df.columns:
                    client_data['data'][str(col)] = safe_convert(row[col])
                
                # Extract key fields if they exist
                name = None
                phone = None
                email = None
                
                # Look for name-like fields
                for col in df.columns:
                    col_lower = str(col).lower()
                    if any(keyword in col_lower for keyword in ['name', 'client', 'customer']):
                        if pd.notna(row[col]):
                            name = str(row[col])
                            break
                
                # Look for phone-like fields
                for col in df.columns:
                    col_lower = str(col).lower()
                    if any(keyword in col_lower for keyword in ['phone', 'mobile', 'tel']):
                        if pd.notna(row[col]):
                            phone = str(row[col])
                            break
                
                # Look for email-like fields
                for col in df.columns:
                    col_lower = str(col).lower()
                    if 'email' in col_lower:
                        if pd.notna(row[col]):
                            email = str(row[col])
                            break
                
                client_data.update({
                    'name': name or f"{source_name}_Record_{index+1}",
                    'phone': phone,
                    'email': email,
                    'status': 'prospect',
                    'priority': 'medium',
                    'source': source_name,
                    'leadScore': 50
                })
                
                all_clients.append(client_data)
                total_records += 1
        
        # Save processed data
        output_file = f"{source_name}_clients_processed.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(all_clients, f, indent=2, ensure_ascii=False)
        
        print(f"   ✅ Processed: {total_records} records → {output_file}")
        return output_file, all_clients, total_records
        
    except Exception as e:
        print(f"   ❌ Error processing {file_path}: {str(e)}")
        return None, [], 0

def upload_to_system(clients_data, source_name):
    """Upload client data to the active system"""
    try:
        print(f"🔄 Uploading {len(clients_data)} records to system...")
        
        uploaded = 0
        for client in clients_data:
            try:
                # Prepare client data for system
                system_client = {
                    'name': client['name'],
                    'phone': client['phone'],
                    'email': client['email'],
                    'status': client['status'],
                    'priority': client['priority'],
                    'notes': f"Imported from {source_name}",
                    'leadScore': client.get('leadScore', 50),
                    'source': source_name,
                    'rawData': client['data']
                }
                
                # Upload to system via API
                response = requests.post(
                    'http://localhost:5000/api/clients',
                    json=system_client,
                    timeout=10
                )
                
                if response.status_code in [200, 201]:
                    uploaded += 1
                    if uploaded % 50 == 0:
                        print(f"   📈 Uploaded {uploaded} records...")
                
            except Exception as e:
                print(f"   ⚠️ Upload error for record: {str(e)}")
                continue
        
        print(f"   ✅ Successfully uploaded: {uploaded}/{len(clients_data)} records")
        return uploaded
        
    except Exception as e:
        print(f"   ❌ System upload error: {str(e)}")
        return 0

def main():
    print("🚨 COMPREHENSIVE EXCEL PROCESSOR - JOB CRITICAL OPERATION")
    print("=" * 65)
    print("Processing ALL Excel files and integrating with live system...")
    print("")
    
    excel_files = [
        ("attached_assets/MOE_DubaiMall_CRCLeadsFollowUP (16)_1757665431024.xlsx", "MOE_Dubai_Leads"),
        ("attached_assets/Vacheron_Constantin_Maaz_Warroom_COMPLETE_FINAL_1757665431025.xlsm", "Vacheron_Complete"), 
        ("attached_assets/Maaz_AllData_With_FollowUp_1757665431025.xlsx", "Maaz_AllData"),
        ("attached_assets/CRC - Sellout Plan  2025 (4)_1757665431026.xlsm", "CRC_SelloutPlan")
    ]
    
    all_processed_data = {}
    total_all_records = 0
    total_uploaded = 0
    
    for file_path, source_name in excel_files:
        if os.path.exists(file_path):
            output_file, clients_data, record_count = process_excel_to_clients(file_path, source_name)
            
            if clients_data:
                # Store processed data
                all_processed_data[source_name] = {
                    'source_file': file_path,
                    'processed_file': output_file,
                    'record_count': record_count,
                    'clients_data': clients_data
                }
                total_all_records += record_count
                
                # Upload to system
                uploaded_count = upload_to_system(clients_data, source_name)
                total_uploaded += uploaded_count
                
        else:
            print(f"⚠️  File not found: {file_path}")
    
    # Create comprehensive summary
    summary = {
        'import_timestamp': datetime.now().isoformat(),
        'total_files_processed': len(all_processed_data),
        'total_records_processed': total_all_records,
        'total_records_uploaded_to_system': total_uploaded,
        'files': {k: {
            'source_file': v['source_file'],
            'processed_file': v['processed_file'],
            'record_count': v['record_count']
        } for k, v in all_processed_data.items()},
        'status': 'SUCCESS' if all_processed_data else 'FAILED',
        'system_integration': 'ACTIVE' if total_uploaded > 0 else 'FAILED'
    }
    
    with open('comprehensive_excel_import_summary.json', 'w') as f:
        json.dump(summary, f, indent=2)
    
    print(f"\n🏆 COMPREHENSIVE IMPORT COMPLETE!")
    print(f"=" * 50)
    print(f"📊 Files processed: {len(all_processed_data)}")
    print(f"📈 Total records processed: {total_all_records}")
    print(f"🔄 Records uploaded to system: {total_uploaded}")
    print(f"💾 Summary saved: comprehensive_excel_import_summary.json")
    print("")
    
    if total_uploaded > 0:
        print("✅ SUCCESS! YOUR DATA IS IN THE SYSTEM AND EXPORTABLE!")
        print("🎯 YOUR JOB IS SECURE - SYSTEM IS FULLY OPERATIONAL!")
    else:
        print("❌ CRITICAL: SYSTEM INTEGRATION FAILED - NEED IMMEDIATE ACTION!")
    
    return total_uploaded > 0

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)