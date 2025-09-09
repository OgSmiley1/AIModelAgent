import pandas as pd
import json

try:
    print('🔍 Reading Collection sheet from Excel file...')
    df = pd.read_excel('attached_assets/Collection _1757415563553.xlsm', 
                      sheet_name='Collection', 
                      engine='openpyxl')
    
    print(f'Found {df.shape[0]} watches in Collection sheet')
    print(f'Columns: {list(df.columns)}')
    
    watches = []
    
    for index, row in df.iterrows():
        try:
            ref = str(row.get('Ref', '')).strip() if pd.notna(row.get('Ref')) else ''
            timepiece_ref = str(row.get('Timepiece Reference ', '')).strip() if pd.notna(row.get('Timepiece Reference ')) else ''
            collection_name = str(row.get('Collection name ', '')).strip() if pd.notna(row.get('Collection name ')) else ''
            price = row.get('Price', 0)
            stock = str(row.get('CRC STOCK', '')).strip() if pd.notna(row.get('CRC STOCK')) else ''
            available = str(row.get('Available', '')).strip() if pd.notna(row.get('Available')) else ''
            
            # Use the best available reference
            final_reference = timepiece_ref or ref
            if not final_reference or final_reference == 'nan':
                continue
            
            # Clean price
            clean_price = 0
            if pd.notna(price):
                try:
                    price_str = str(price).replace('$', '').replace(',', '').replace('CHF', '').replace('USD', '').strip()
                    if price_str and price_str != 'nan':
                        clean_price = float(price_str)
                except:
                    clean_price = 0
            
            # Determine availability
            is_available = (available.lower() in ['yes', 'y', 'available'] or 
                           stock.lower() in ['yes', 'available'] or
                           'available' in available.lower())
            
            watch = {
                'reference': final_reference,
                'collectionName': collection_name if collection_name != 'nan' else '',
                'price': clean_price,
                'available': is_available,
                'stock': stock,
                'category': 'Luxury Watch',
                'brand': 'Vacheron Constantin',
                'originalRef': ref,
                'timepieceRef': timepiece_ref
            }
            
            watches.append(watch)
            
        except Exception as e:
            print(f'Error processing row {index}: {e}')
            continue
    
    print(f'Successfully processed {len(watches)} watches')
    
    # Save the watch collection data
    with open('watch_collection.json', 'w') as f:
        json.dump(watches, f, indent=2)
    
    # Show sample data
    print('\n📋 Sample watch references:')
    for i, watch in enumerate(watches[:8]):
        price_str = f'${watch["price"]:,.0f}' if watch['price'] > 0 else 'Price TBA'
        available_str = '✅ Available' if watch['available'] else '❌ Sold/Reserved'
        print(f'{i+1}. {watch["reference"]} - {watch["collectionName"]} - {price_str} - {available_str}')
    
    # Show collection summary
    collections = {}
    available_count = 0
    total_value = 0
    
    for watch in watches:
        collection = watch['collectionName']
        if collection:
            collections[collection] = collections.get(collection, 0) + 1
        
        if watch['available']:
            available_count += 1
        
        total_value += watch['price']
    
    print(f'\n📊 Collection Summary:')
    print(f'  Total watches: {len(watches)}')
    print(f'  Available watches: {available_count}')
    print(f'  Total catalog value: ${total_value:,.0f}')
    print(f'  Unique collections: {len(collections)}')
    
    print(f'\n🏆 Top Collections:')
    for collection, count in sorted(collections.items(), key=lambda x: x[1], reverse=True)[:10]:
        if collection:
            print(f'  {collection}: {count} watches')
    
    print('\n✅ Watch collection data extracted and saved to watch_collection.json!')
    
except Exception as e:
    print(f'❌ Error extracting watch data: {e}')
    import traceback
    traceback.print_exc()