import pandas as pd
import json

def extract_detailed_maaz():
    """Extract detailed Maaz client information"""
    
    print("🎯 DETAILED MAAZ CLIENT EXTRACTION")
    print("="*50)
    
    # Focus on the main data file
    file_path = "attached_assets/exported-data (49)_1757345821285.xlsx"
    
    try:
        df = pd.read_excel(file_path, sheet_name='Data')
        print(f"📊 Loaded {len(df)} total rows from exported-data")
        
        # Find Maaz entries
        maaz_mask = df.astype(str).apply(lambda x: x.str.contains('maaz', case=False, na=False)).any(axis=1)
        maaz_data = df[maaz_mask].copy()
        
        print(f"🎯 Found {len(maaz_data)} Maaz entries")
        print(f"📋 Columns available: {list(df.columns)}")
        
        # Extract key client information
        maaz_clients = []
        
        for idx, row in maaz_data.iterrows():
            client = {}
            
            # Get all non-null values
            for col in df.columns:
                value = row[col]
                if pd.notna(value) and str(value).strip():
                    # Clean column name
                    clean_col = str(col).strip().replace('\n', ' ').replace('  ', ' ')
                    client[clean_col] = str(value).strip()
            
            maaz_clients.append(client)
        
        # Show summary
        print(f"\n📊 MAAZ CLIENT DETAILS:")
        for i, client in enumerate(maaz_clients[:5]):  # First 5 clients
            print(f"\n--- MAAZ CLIENT #{i+1} ---")
            for key, value in list(client.items())[:8]:  # First 8 fields
                if len(str(value)) < 100:  # Avoid very long values
                    print(f"  {key}: {value}")
        
        # Save all data
        with open('maaz_clients_detailed.json', 'w', encoding='utf-8') as f:
            json.dump(maaz_clients, f, indent=2, ensure_ascii=False)
        
        print(f"\n✅ SAVED: {len(maaz_clients)} Maaz clients to maaz_clients_detailed.json")
        
        # Show column analysis
        print(f"\n📋 COLUMN ANALYSIS:")
        all_columns = set()
        for client in maaz_clients:
            all_columns.update(client.keys())
        
        print(f"Total unique columns: {len(all_columns)}")
        for col in sorted(all_columns)[:20]:  # First 20 columns
            print(f"  - {col}")
        
        return maaz_clients
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return []

if __name__ == "__main__":
    clients = extract_detailed_maaz()
    print(f"\n🎯 EXTRACTION COMPLETE: {len(clients)} Maaz clients processed")