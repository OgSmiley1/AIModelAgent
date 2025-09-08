import json
import psycopg2
from datetime import datetime
import os

def import_maaz_clients_to_database():
    """Import all Maaz client data to the PostgreSQL database"""
    
    print("🎯 IMPORTING MAAZ CLIENTS TO DATABASE")
    print("="*50)
    
    # Load the extracted Maaz client data
    try:
        with open('maaz_clients_detailed.json', 'r', encoding='utf-8') as f:
            maaz_clients = json.load(f)
        print(f"📊 Loaded {len(maaz_clients)} Maaz client records")
    except FileNotFoundError:
        print("❌ maaz_clients_detailed.json not found. Please run extract_maaz_clients.py first.")
        return
    
    # Connect to database
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cursor = conn.cursor()
        print("✅ Connected to database")
    except Exception as e:
        print(f"❌ Database connection failed: {str(e)}")
        return
    
    # Import each client
    imported_count = 0
    error_count = 0
    
    for i, client_data in enumerate(maaz_clients, 1):
        try:
            # Extract key client information
            client_id = client_data.get('CLIENT ID', '')
            name = f"Client {client_id}" if client_id else f"Maaz Client {i}"
            
            # Get phone from any phone-related field
            phone = None
            for key, value in client_data.items():
                if 'phone' in key.lower() and value:
                    phone = str(value)
                    break
            
            # Get email from any email-related field  
            email = None
            for key, value in client_data.items():
                if 'email' in key.lower() and value:
                    email = str(value)
                    break
            
            # Get status
            status = client_data.get('STATUS', 'prospect').lower()
            if status not in ['prospect', 'active', 'inactive', 'vip']:
                status = 'prospect'
            
            # Get segment/priority
            segment = client_data.get('CLIENT SEGMENT', 'medium').lower()
            priority = 'medium'
            if 'vip' in segment:
                priority = 'vip'
            elif 'high' in segment:
                priority = 'high'
            elif 'low' in segment:
                priority = 'low'
            
            # Get interests (product references)
            interests = client_data.get('REFERENCE', '')
            if not interests:
                # Look for any product/reference fields
                for key, value in client_data.items():
                    if any(term in key.lower() for term in ['reference', 'product', 'model']) and value:
                        interests = str(value)
                        break
            
            # Get notes/comments
            notes = client_data.get('COMMENTS', '')
            if not notes:
                # Combine other relevant fields as notes
                note_parts = []
                for key, value in client_data.items():
                    if key not in ['CLIENT ID', 'STATUS', 'CLIENT SEGMENT', 'REFERENCE'] and value:
                        note_parts.append(f"{key}: {value}")
                notes = " | ".join(note_parts[:3])  # First 3 fields only
            
            # Get boutique/location
            location = client_data.get('BOUTIQUE', 'Phone sales Middle East')
            
            # Get dates
            request_date_str = client_data.get('REQUEST DATE', '')
            last_interaction = None
            if request_date_str:
                try:
                    # Parse date (format: 29/8/2025)
                    day, month, year = request_date_str.split('/')
                    last_interaction = f"{year}-{month.zfill(2)}-{day.zfill(2)}"
                except:
                    pass
            
            # Calculate lead score based on available data
            lead_score = 50  # Base score
            if status == 'active': lead_score += 20
            if priority == 'vip': lead_score += 30
            elif priority == 'high': lead_score += 15
            if interests: lead_score += 10
            if phone: lead_score += 10
            if email: lead_score += 10
            
            # Insert client into database
            insert_query = """
                INSERT INTO clients (
                    name, phone, email, status, priority, interests, location, 
                    notes, lead_score, conversion_probability, last_interaction,
                    tags, total_interactions, follow_up_required
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT DO NOTHING
            """
            
            cursor.execute(insert_query, (
                name,
                phone,
                email, 
                status,
                priority,
                interests,
                location,
                notes,
                lead_score,
                0.7 if lead_score > 70 else 0.5,  # Conversion probability
                last_interaction,
                ['maaz', 'luxury_watches', 'vacheron_constantin'],  # Tags
                1,  # Total interactions
                True  # Follow up required
            ))
            
            imported_count += 1
            
            if i % 50 == 0:
                print(f"   📈 Imported {i}/{len(maaz_clients)} clients...")
                
        except Exception as e:
            error_count += 1
            print(f"   ❌ Error importing client {i}: {str(e)[:100]}")
            continue
    
    # Commit changes
    try:
        conn.commit()
        print(f"\n✅ IMPORT COMPLETE!")
        print(f"   📊 Successfully imported: {imported_count} clients")
        print(f"   ❌ Errors: {error_count} clients")
        print(f"   🎯 Total Maaz clients in database: {imported_count}")
        
        # Verify import
        cursor.execute("SELECT COUNT(*) FROM clients WHERE 'maaz' = ANY(tags)")
        maaz_count = cursor.fetchone()[0]
        print(f"   ✅ Database verification: {maaz_count} Maaz-tagged clients found")
        
    except Exception as e:
        print(f"❌ Commit failed: {str(e)}")
        conn.rollback()
    
    finally:
        cursor.close()
        conn.close()
        print("🔐 Database connection closed")

if __name__ == "__main__":
    import_maaz_clients_to_database()