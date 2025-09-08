import pandas as pd
import os
from pathlib import Path

def extract_maaz_data():
    """Extract all Maaz client data from uploaded Excel files"""
    
    # Files to process
    files_to_process = [
        "attached_assets/exported-data (49)_1757345821285.xlsx",
        "attached_assets/MOE_DubaiMall_CRCLeadsFollowUP (13)_1757345821286.xlsx",
        "attached_assets/CRC - Sellout Plan  2025 (4)_1757345821288.xlsm",
        "attached_assets/Vacheron_Constantin_Maaz_Warroom v1_1757345821289.xlsx"
    ]
    
    all_maaz_data = []
    
    print("=== EXTRACTING MAAZ CLIENT DATA ===\n")
    
    for file_path in files_to_process:
        if os.path.exists(file_path):
            print(f"Processing: {file_path}")
            try:
                # Read all sheets from the file
                if file_path.endswith('.xlsm'):
                    # For .xlsm files, use openpyxl engine
                    excel_file = pd.ExcelFile(file_path, engine='openpyxl')
                else:
                    # For .xlsx files
                    excel_file = pd.ExcelFile(file_path)
                
                sheet_names = excel_file.sheet_names
                print(f"  Sheets found: {sheet_names}")
                
                for sheet_name in sheet_names:
                    print(f"    Reading sheet: {sheet_name}")
                    try:
                        df = pd.read_excel(file_path, sheet_name=sheet_name)
                        
                        # Look for Maaz-related data
                        maaz_rows = []
                        
                        # Search for "Maaz" in all columns
                        for index, row in df.iterrows():
                            row_str = str(row).lower()
                            if 'maaz' in row_str:
                                maaz_rows.append({
                                    'File': file_path,
                                    'Sheet': sheet_name,
                                    'Row_Index': index,
                                    'Data': row.to_dict()
                                })
                        
                        if maaz_rows:
                            print(f"      Found {len(maaz_rows)} Maaz-related rows")
                            all_maaz_data.extend(maaz_rows)
                        
                    except Exception as e:
                        print(f"      Error reading sheet {sheet_name}: {str(e)}")
                
            except Exception as e:
                print(f"  Error processing file: {str(e)}")
        else:
            print(f"File not found: {file_path}")
        
        print()
    
    # Print all found Maaz data
    print("=== ALL MAAZ CLIENT DATA FOUND ===\n")
    
    if all_maaz_data:
        for i, data in enumerate(all_maaz_data, 1):
            print(f"MAAZ ENTRY #{i}")
            print(f"File: {data['File']}")
            print(f"Sheet: {data['Sheet']}")
            print(f"Row: {data['Row_Index']}")
            print("Data:")
            for key, value in data['Data'].items():
                if pd.notna(value) and str(value).strip():
                    print(f"  {key}: {value}")
            print("-" * 80)
    else:
        print("No Maaz-related data found in the processed files.")
    
    return all_maaz_data

# Also try to extract all data and look for patterns
def extract_all_data_summary():
    """Extract summary of all data to understand structure"""
    
    files_to_process = [
        "attached_assets/exported-data (49)_1757345821285.xlsx",
        "attached_assets/MOE_DubaiMall_CRCLeadsFollowUP (13)_1757345821286.xlsx", 
        "attached_assets/CRC - Sellout Plan  2025 (4)_1757345821288.xlsm",
        "attached_assets/Vacheron_Constantin_Maaz_Warroom v1_1757345821289.xlsx"
    ]
    
    print("\n=== FILE STRUCTURE ANALYSIS ===\n")
    
    for file_path in files_to_process:
        if os.path.exists(file_path):
            print(f"FILE: {file_path}")
            try:
                if file_path.endswith('.xlsm'):
                    excel_file = pd.ExcelFile(file_path, engine='openpyxl')
                else:
                    excel_file = pd.ExcelFile(file_path)
                
                for sheet_name in excel_file.sheet_names:
                    print(f"  SHEET: {sheet_name}")
                    try:
                        df = pd.read_excel(file_path, sheet_name=sheet_name)
                        print(f"    Rows: {len(df)}, Columns: {len(df.columns)}")
                        print(f"    Column names: {list(df.columns)}")
                        
                        # Show first few rows
                        if not df.empty:
                            print("    First few rows:")
                            for idx in range(min(3, len(df))):
                                row_data = []
                                for col in df.columns[:5]:  # First 5 columns
                                    val = df.iloc[idx][col]
                                    if pd.notna(val):
                                        row_data.append(f"{col}: {val}")
                                if row_data:
                                    print(f"      Row {idx}: {' | '.join(row_data)}")
                        
                    except Exception as e:
                        print(f"    Error: {str(e)}")
                    print()
            except Exception as e:
                print(f"  Error: {str(e)}")
        print()

if __name__ == "__main__":
    # Extract Maaz-specific data
    maaz_data = extract_maaz_data()
    
    # Extract general file structure info
    extract_all_data_summary()
    
    print(f"\nTotal Maaz entries found: {len(maaz_data)}")