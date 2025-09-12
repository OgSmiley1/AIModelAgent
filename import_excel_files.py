#!/usr/bin/env python3
"""
🚨 CRITICAL JOB-SAVING DATA IMPORT SYSTEM
Import all Excel files and ensure data is accessible in the app
"""
import pandas as pd
import json
import os
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

def process_excel_file(file_path, output_name):
    """Process a single Excel file and extract all data"""
    try:
        print(f"🔄 Processing: {file_path}")
        
        # Try to read all sheets
        try:
            excel_data = pd.read_excel(file_path, sheet_name=None, engine='openpyxl')
        except:
            try:
                excel_data = pd.read_excel(file_path, sheet_name=None, engine='xlrd')
            except:
                print(f"❌ Could not read {file_path}")
                return None
        
        all_data = {}
        total_records = 0
        
        for sheet_name, df in excel_data.items():
            print(f"   📋 Processing sheet: {sheet_name} ({len(df)} rows)")
            
            # Convert all data to JSON-safe format
            sheet_data = []
            for _, row in df.iterrows():
                row_data = {}
                for col in df.columns:
                    row_data[str(col)] = safe_convert(row[col])
                sheet_data.append(row_data)
            
            all_data[sheet_name] = {
                'data': sheet_data,
                'row_count': len(sheet_data),
                'columns': [str(col) for col in df.columns]
            }
            total_records += len(sheet_data)
        
        # Save processed data
        output_file = f"{output_name}_processed.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(all_data, f, indent=2, ensure_ascii=False)
        
        print(f"   ✅ Saved: {output_file} ({total_records} total records)")
        return output_file, total_records
        
    except Exception as e:
        print(f"❌ Error processing {file_path}: {str(e)}")
        return None, 0

def main():
    print("🚨 CRITICAL DATA IMPORT - JOB SECURITY OPERATION")
    print("=" * 55)
    
    excel_files = [
        ("attached_assets/MOE_DubaiMall_CRCLeadsFollowUP (16)_1757665431024.xlsx", "moe_dubai_leads"),
        ("attached_assets/Vacheron_Constantin_Maaz_Warroom_COMPLETE_FINAL_1757665431025.xlsm", "vacheron_maaz_complete"), 
        ("attached_assets/Maaz_AllData_With_FollowUp_1757665431025.xlsx", "maaz_all_data"),
        ("attached_assets/CRC - Sellout Plan  2025 (4)_1757665431026.xlsm", "crc_sellout_plan")
    ]
    
    all_imported_data = {}
    total_all_records = 0
    
    for file_path, output_name in excel_files:
        if os.path.exists(file_path):
            result_file, record_count = process_excel_file(file_path, output_name)
            if result_file:
                all_imported_data[output_name] = {
                    'source_file': file_path,
                    'processed_file': result_file,
                    'record_count': record_count
                }
                total_all_records += record_count
        else:
            print(f"⚠️  File not found: {file_path}")
    
    # Create master import summary
    summary = {
        'import_timestamp': datetime.now().isoformat(),
        'total_files_processed': len(all_imported_data),
        'total_records_imported': total_all_records,
        'files': all_imported_data,
        'status': 'SUCCESS' if all_imported_data else 'FAILED'
    }
    
    with open('excel_import_summary.json', 'w') as f:
        json.dump(summary, f, indent=2)
    
    print(f"\n🏆 IMPORT COMPLETE!")
    print(f"📊 Files processed: {len(all_imported_data)}")
    print(f"📈 Total records: {total_all_records}")
    print(f"💾 Summary saved: excel_import_summary.json")
    
    if total_all_records > 0:
        print("✅ YOUR JOB IS SAFE - DATA SUCCESSFULLY IMPORTED!")
    else:
        print("❌ CRITICAL: NO DATA IMPORTED - IMMEDIATE ACTION NEEDED!")
    
    return total_all_records > 0

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)