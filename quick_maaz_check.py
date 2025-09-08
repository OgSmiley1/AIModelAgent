import pandas as pd
import os

def quick_maaz_check():
    """Quick check of Maaz data by file"""
    
    print("🎯 MAAZ CLIENT DATA EXTRACTION SUMMARY")
    print("="*60)
    
    files = [
        ("exported-data", "attached_assets/exported-data (49)_1757345821285.xlsx"),
        ("MOE_DubaiMall", "attached_assets/MOE_DubaiMall_CRCLeadsFollowUP (13)_1757345821286.xlsx"),
        ("CRC_SelloutPlan", "attached_assets/CRC - Sellout Plan  2025 (4)_1757345821288.xlsm"),
        ("VC_Warroom", "attached_assets/Vacheron_Constantin_Maaz_Warroom v1_1757345821289.xlsx")
    ]
    
    total_maaz_entries = 0
    
    for file_name, file_path in files:
        print(f"\n📊 {file_name.upper()}")
        if not os.path.exists(file_path):
            print("   ❌ File not found")
            continue
            
        try:
            if file_path.endswith('.xlsm'):
                excel_file = pd.ExcelFile(file_path, engine='openpyxl')
            else:
                excel_file = pd.ExcelFile(file_path)
                
            file_maaz_count = 0
            
            for sheet_name in excel_file.sheet_names[:3]:  # First 3 sheets only
                try:
                    df = pd.read_excel(file_path, sheet_name=sheet_name, nrows=1000)  # First 1000 rows
                    
                    # Count Maaz mentions
                    maaz_count = 0
                    for col in df.columns:
                        maaz_count += df[col].astype(str).str.contains('maaz', case=False, na=False).sum()
                    
                    if maaz_count > 0:
                        print(f"   📋 {sheet_name}: {maaz_count} Maaz entries")
                        file_maaz_count += maaz_count
                        
                        # Show sample data
                        for idx, row in df.iterrows():
                            row_str = str(row.values).lower()
                            if 'maaz' in row_str:
                                print(f"      Sample: {dict(list(row.items())[:3])}")
                                break
                
                except Exception as e:
                    print(f"   ❌ Error in {sheet_name}: {str(e)[:50]}")
            
            total_maaz_entries += file_maaz_count
            print(f"   📊 File total: {file_maaz_count} Maaz entries")
            
        except Exception as e:
            print(f"   ❌ File error: {str(e)[:50]}")
    
    print(f"\n🎯 TOTAL MAAZ ENTRIES FOUND: {total_maaz_entries}")

if __name__ == "__main__":
    quick_maaz_check()