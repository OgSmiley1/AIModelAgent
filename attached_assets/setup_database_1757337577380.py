#!/usr/bin/env python3
"""
Database setup script for CRC Warroom Enhanced
Creates tables and populates with sample data
"""

import os
import sys
import psycopg2
import psycopg2.extras
import json
from datetime import datetime, timedelta
import hashlib

def get_db_connection():
    """Get database connection"""
    try:
        return psycopg2.connect(
            host=os.getenv('PGHOST', 'localhost'),
            database=os.getenv('PGDATABASE', 'postgres'),
            user=os.getenv('PGUSER', 'postgres'),
            password=os.getenv('PGPASSWORD', ''),
            port=os.getenv('PGPORT', '5432')
        )
    except Exception as e:
        print(f"Database connection failed: {e}")
        sys.exit(1)

def create_tables():
    """Create all database tables"""
    conn = get_db_connection()
    conn.autocommit = True
    cursor = conn.cursor()
    
    # Drop existing tables if they exist
    drop_tables = [
        "DROP TABLE IF EXISTS whatsapp_conversations CASCADE;",
        "DROP TABLE IF EXISTS leads CASCADE;",
        "DROP TABLE IF EXISTS clients CASCADE;",
        "DROP TABLE IF EXISTS process_documents CASCADE;",
        "DROP TABLE IF EXISTS faqs CASCADE;",
        "DROP TABLE IF EXISTS watches CASCADE;",
        "DROP TABLE IF EXISTS sessions CASCADE;",
        "DROP TABLE IF EXISTS users CASCADE;"
    ]
    
    for drop_sql in drop_tables:
        try:
            cursor.execute(drop_sql)
        except Exception as e:
            print(f"Drop table warning: {e}")
    
    # Drop existing enums
    enum_drops = [
        "DROP TYPE IF EXISTS user_role CASCADE;",
        "DROP TYPE IF EXISTS client_priority CASCADE;",
        "DROP TYPE IF EXISTS client_status CASCADE;",
        "DROP TYPE IF EXISTS lead_status CASCADE;",
        "DROP TYPE IF EXISTS watch_category CASCADE;",
        "DROP TYPE IF EXISTS availability_status CASCADE;",
        "DROP TYPE IF EXISTS sentiment_type CASCADE;",
        "DROP TYPE IF EXISTS urgency_level CASCADE;"
    ]
    
    for drop_enum in enum_drops:
        try:
            cursor.execute(drop_enum)
        except Exception as e:
            print(f"Drop enum warning: {e}")
    
    # Create type enums
    enums = [
        "CREATE TYPE user_role AS ENUM ('admin', 'manager', 'sales_associate', 'readonly');",
        "CREATE TYPE client_priority AS ENUM ('low', 'medium', 'high', 'critical', 'vip');",
        "CREATE TYPE client_status AS ENUM ('active', 'inactive', 'prospect', 'converted', 'churned');",
        "CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'qualified', 'proposal_sent', 'negotiation', 'closed_won', 'closed_lost');",
        "CREATE TYPE watch_category AS ENUM ('mens_watch', 'ladies_watch', 'complications', 'grand_complications', 'jewelry_watches');",
        "CREATE TYPE availability_status AS ENUM ('available', 'sold', 'reserved', 'discontinued', 'pre_order');",
        "CREATE TYPE sentiment_type AS ENUM ('very_positive', 'positive', 'neutral', 'negative', 'very_negative');",
        "CREATE TYPE urgency_level AS ENUM ('low', 'normal', 'high', 'urgent');"
    ]
    
    for enum_sql in enums:
        try:
            cursor.execute(enum_sql)
        except Exception as e:
            print(f"Create enum warning: {e}")
    
    # Create users table
    cursor.execute("""
        CREATE TABLE users (
            id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
            email VARCHAR UNIQUE,
            first_name VARCHAR,
            last_name VARCHAR,
            profile_image_url VARCHAR,
            role user_role DEFAULT 'sales_associate',
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
    """)
    
    # Create sessions table for authentication
    cursor.execute("""
        CREATE TABLE sessions (
            sid VARCHAR PRIMARY KEY,
            sess JSONB NOT NULL,
            expire TIMESTAMP NOT NULL
        );
        
        CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire);
    """)
    
    # Create clients table
    cursor.execute("""
        CREATE TABLE clients (
            id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
            name VARCHAR NOT NULL,
            email VARCHAR,
            phone VARCHAR,
            whatsapp_number VARCHAR,
            priority client_priority DEFAULT 'medium',
            status client_status DEFAULT 'active',
            location VARCHAR,
            budget DECIMAL,
            interests TEXT,
            notes TEXT,
            assigned_sales_associate VARCHAR REFERENCES users(id),
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
    """)
    
    # Create leads table
    cursor.execute("""
        CREATE TABLE leads (
            id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
            client_id VARCHAR REFERENCES clients(id) ON DELETE CASCADE,
            status lead_status DEFAULT 'new',
            source VARCHAR,
            description TEXT,
            value DECIMAL,
            currency VARCHAR DEFAULT 'AED',
            probability INTEGER DEFAULT 50,
            expected_close_date DATE,
            assigned_to VARCHAR REFERENCES users(id),
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
    """)
    
    # Create watches table
    cursor.execute("""
        CREATE TABLE watches (
            id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
            reference_number VARCHAR UNIQUE NOT NULL,
            name VARCHAR NOT NULL,
            collection VARCHAR NOT NULL,
            category watch_category NOT NULL,
            description TEXT,
            price DECIMAL NOT NULL,
            currency VARCHAR DEFAULT 'AED',
            availability availability_status DEFAULT 'available',
            case_material VARCHAR,
            case_diameter VARCHAR,
            movement VARCHAR,
            dial_color VARCHAR,
            strap_material VARCHAR,
            features TEXT[],
            images JSONB,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
    """)
    
    # Create FAQs table
    cursor.execute("""
        CREATE TABLE faqs (
            id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
            category VARCHAR NOT NULL,
            question TEXT NOT NULL,
            answer TEXT NOT NULL,
            tags TEXT[],
            display_order INTEGER DEFAULT 0,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
    """)
    
    # Create process documents table
    cursor.execute("""
        CREATE TABLE process_documents (
            id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
            code VARCHAR UNIQUE NOT NULL,
            title VARCHAR NOT NULL,
            description TEXT,
            content TEXT NOT NULL,
            version VARCHAR DEFAULT '1.0',
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
    """)
    
    # Create WhatsApp conversations table
    cursor.execute("""
        CREATE TABLE whatsapp_conversations (
            id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
            phone_number VARCHAR NOT NULL,
            message_text TEXT NOT NULL,
            direction VARCHAR NOT NULL,
            sentiment sentiment_type,
            watch_interest VARCHAR,
            urgency_level urgency_level DEFAULT 'normal',
            client_id VARCHAR REFERENCES clients(id),
            created_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_whatsapp_phone ON whatsapp_conversations(phone_number);
        CREATE INDEX IF NOT EXISTS idx_whatsapp_created_at ON whatsapp_conversations(created_at);
    """)
    
    cursor.close()
    conn.close()
    print("✅ Database tables created successfully!")

def populate_sample_data():
    """Populate database with sample data"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Insert default user
    cursor.execute("""
        INSERT INTO users (id, email, first_name, last_name, role) 
        VALUES ('maaz-001', 'maaz@crc.com', 'Maaz', 'Sharif', 'admin')
        ON CONFLICT (id) DO NOTHING;
    """)
    
    # Insert sample Vacheron Constantin watches
    watches_data = [
        {
            'reference_number': '4500V/110A-B483',
            'name': 'Overseas Chronograph',
            'collection': 'Overseas',
            'category': 'mens_watch',
            'description': 'Steel case with blue dial, featuring integrated chronograph and date function',
            'price': 165000.00,
            'case_material': 'Stainless Steel',
            'case_diameter': '42.5mm',
            'movement': 'Calibre 5200/2',
            'dial_color': 'Blue',
            'strap_material': 'Steel Bracelet',
            'features': ['Chronograph', 'Date', 'Water Resistant 150m'],
            'images': ['overseas_chrono_blue.jpg']
        },
        {
            'reference_number': '7900V/110A-B333',
            'name': 'Overseas Small Model',
            'collection': 'Overseas',
            'category': 'ladies_watch',
            'description': 'Elegant ladies timepiece with mother-of-pearl dial and diamond hour markers',
            'price': 89500.00,
            'case_material': 'Stainless Steel',
            'case_diameter': '34mm',
            'movement': 'Calibre 5300',
            'dial_color': 'Mother-of-Pearl',
            'strap_material': 'Steel Bracelet',
            'features': ['Diamond Hour Markers', 'Date', 'Water Resistant 150m'],
            'images': ['overseas_ladies_mop.jpg']
        },
        {
            'reference_number': '4600E/000A-B442',
            'name': 'Patrimony Manual-Winding',
            'collection': 'Patrimony',
            'category': 'mens_watch',
            'description': 'Ultra-thin manual winding watch with blue dial, epitome of classical elegance',
            'price': 125000.00,
            'case_material': '18K White Gold',
            'case_diameter': '40mm',
            'movement': 'Calibre 1400',
            'dial_color': 'Blue',
            'strap_material': 'Alligator Leather',
            'features': ['Manual Winding', 'Ultra-Thin', 'Water Resistant 30m'],
            'images': ['patrimony_manual_blue.jpg']
        },
        {
            'reference_number': '85180/000R-9248',
            'name': 'Traditionnelle Tourbillon',
            'collection': 'Traditionnelle',
            'category': 'grand_complications',
            'description': 'Magnificent tourbillon with open dial showcasing the mesmerizing complication',
            'price': 385000.00,
            'case_material': '18K Rose Gold',
            'case_diameter': '41mm',
            'movement': 'Calibre 2160',
            'dial_color': 'Silver',
            'strap_material': 'Alligator Leather',
            'features': ['Tourbillon', 'Manual Winding', 'Sapphire Crystal Caseback'],
            'images': ['traditionnelle_tourbillon.jpg']
        },
        {
            'reference_number': '30030/000G-9899',
            'name': 'Les Cabinotiers Celestia',
            'collection': 'Les Cabinotiers',
            'category': 'grand_complications',
            'description': 'One of the most complicated watches ever made with astronomical indications',
            'price': 2850000.00,
            'case_material': '18K White Gold',
            'case_diameter': '45mm',
            'movement': 'Calibre 3600',
            'dial_color': 'Blue',
            'strap_material': 'Alligator Leather',
            'features': ['Triple Calendar', 'Equation of Time', 'Sunrise/Sunset', 'Celestial Chart'],
            'images': ['celestia_astronomical.jpg']
        },
        {
            'reference_number': '25155/000G-9584',
            'name': 'Traditionnelle Perpetual Calendar',
            'collection': 'Traditionnelle',
            'category': 'grand_complications',
            'description': 'Classic perpetual calendar with moon phases and leap year indication',
            'price': 450000.00,
            'case_material': '18K White Gold',
            'case_diameter': '41mm',
            'movement': 'Calibre 1120 QP',
            'dial_color': 'Silver',
            'strap_material': 'Alligator Leather',
            'features': ['Perpetual Calendar', 'Moon Phases', 'Leap Year', 'Day/Date/Month'],
            'images': ['perpetual_calendar_white_gold.jpg']
        },
        {
            'reference_number': '81180/000J-9118',
            'name': 'Historiques American 1921',
            'collection': 'Historiques',
            'category': 'mens_watch',
            'description': 'Vintage-inspired cushion case with diagonal time display',
            'price': 195000.00,
            'case_material': '18K Yellow Gold',
            'case_diameter': '40mm x 40mm',
            'movement': 'Calibre 4400 AS',
            'dial_color': 'Silver',
            'strap_material': 'Alligator Leather',
            'features': ['Diagonal Display', 'Vintage Style', 'Cushion Case'],
            'images': ['american_1921_yellow_gold.jpg']
        },
        {
            'reference_number': '25572/000G-9800',
            'name': 'Malte Tourbillon Openworked',
            'collection': 'Malte',
            'category': 'complications',
            'description': 'Tonneau-shaped case with visible tourbillon and skeleton dial',
            'price': 295000.00,
            'case_material': '18K White Gold',
            'case_diameter': '38.7mm x 47.61mm',
            'movement': 'Calibre 2790 SQ',
            'dial_color': 'Skeleton',
            'strap_material': 'Alligator Leather',
            'features': ['Tourbillon', 'Openworked Dial', 'Tonneau Case'],
            'images': ['malte_tourbillon_skeleton.jpg']
        }
    ]
    
    for watch in watches_data:
        cursor.execute("""
            INSERT INTO watches (reference_number, name, collection, category, description, 
                               price, case_material, case_diameter, movement, dial_color, 
                               strap_material, features, images)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (reference_number) DO NOTHING;
        """, (
            watch['reference_number'], watch['name'], watch['collection'], 
            watch['category'], watch['description'], watch['price'],
            watch['case_material'], watch['case_diameter'], watch['movement'],
            watch['dial_color'], watch['strap_material'], watch['features'],
            json.dumps(watch['images'])
        ))
    
    # Insert sample FAQs
    faqs_data = [
        {
            'category': 'General Information',
            'question': 'What makes Vacheron Constantin special?',
            'answer': 'Vacheron Constantin is the oldest continuously operating watch manufacture in the world, founded in 1755. We combine exceptional craftsmanship with innovative complications and timeless design.',
            'tags': ['heritage', 'craftsmanship', 'history'],
            'display_order': 1
        },
        {
            'category': 'Watch Collections',
            'question': 'What are the main Vacheron Constantin collections?',
            'answer': 'Our main collections include Overseas (sport luxury), Patrimony (dress watches), Traditionnelle (classical complications), Historiques (vintage-inspired), Malte (tonneau-shaped), and Les Cabinotiers (haute horlogerie).',
            'tags': ['collections', 'overseas', 'patrimony', 'traditionnelle'],
            'display_order': 1
        },
        {
            'category': 'Purchasing Process',
            'question': 'How do I purchase a Vacheron Constantin watch?',
            'answer': 'You can purchase through our authorized boutiques, authorized dealers, or by appointment. Some rare pieces require special ordering. We offer personalized consultation services.',
            'tags': ['purchase', 'boutique', 'dealer', 'appointment'],
            'display_order': 1
        },
        {
            'category': 'Servicing & Warranty',
            'question': 'What warranty does Vacheron Constantin provide?',
            'answer': 'We provide a 3-year international warranty covering manufacturing defects. Extended warranty and regular maintenance services are available through our service centers.',
            'tags': ['warranty', 'service', 'maintenance'],
            'display_order': 1
        },
        {
            'category': 'Complications',
            'question': 'What watch complications does Vacheron Constantin offer?',
            'answer': 'We offer simple to grand complications including chronographs, perpetual calendars, tourbillons, minute repeaters, celestial displays, and unique astronomical functions.',
            'tags': ['complications', 'tourbillon', 'calendar', 'chronograph'],
            'display_order': 1
        },
        {
            'category': 'Investment Value',
            'question': 'Do Vacheron Constantin watches hold their value?',
            'answer': 'Vacheron Constantin watches, especially limited editions and complications, generally maintain strong value retention due to our heritage, craftsmanship quality, and limited production.',
            'tags': ['investment', 'value', 'resale', 'limited edition'],
            'display_order': 1
        }
    ]
    
    for faq in faqs_data:
        cursor.execute("""
            INSERT INTO faqs (category, question, answer, tags, display_order)
            VALUES (%s, %s, %s, %s, %s);
        """, (faq['category'], faq['question'], faq['answer'], 
              faq['tags'], faq['display_order']))
    
    # Insert sample process documents (from attached files)
    processes_data = [
        {
            'code': 'WI-01',
            'title': 'VC Incoming Inquiry Process',
            'description': 'Standard process for handling incoming client inquiries',
            'content': 'Step-by-step process for managing new client inquiries from initial contact through qualification and follow-up.'
        },
        {
            'code': 'WI-02',
            'title': 'VC Airtable Process',
            'description': 'Airtable data management and tracking procedures',
            'content': 'Guidelines for maintaining client and lead data in Airtable system with proper categorization and follow-up scheduling.'
        },
        {
            'code': 'WI-03',
            'title': 'VC Digital Passport',
            'description': 'Digital passport and client profiling system',
            'content': 'Process for creating comprehensive client profiles including preferences, purchase history, and communication logs.'
        },
        {
            'code': 'WI-06',
            'title': 'VC Boutique Appointment & Phone Sale Process',
            'description': 'Boutique appointment booking and phone sales procedures',
            'content': 'Complete guide for managing boutique appointments, phone consultations, and remote sales processes.'
        },
        {
            'code': 'WI-07',
            'title': 'VC Extend Platform Order Process',
            'description': 'Extended platform order management procedures',
            'content': 'Process for handling special orders, customizations, and extended delivery arrangements through Vacheron Constantin platforms.'
        }
    ]
    
    for process in processes_data:
        cursor.execute("""
            INSERT INTO process_documents (code, title, description, content)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (code) DO NOTHING;
        """, (process['code'], process['title'], process['description'], process['content']))
    
    # Insert sample clients and leads
    sample_clients = [
        {
            'name': 'Ahmed Al Mansouri',
            'email': 'ahmed@example.ae',
            'phone': '+971501234567',
            'whatsapp_number': '+971501234567',
            'priority': 'high',
            'location': 'Dubai, UAE',
            'budget': 250000,
            'interests': 'Overseas collection, sports watches, chronographs',
            'notes': 'VIP client interested in limited editions. Previous purchase: Patrimony.',
            'assigned_sales_associate': 'maaz-001'
        },
        {
            'name': 'Sarah Johnson',
            'email': 'sarah@example.com',
            'phone': '+971509876543',
            'whatsapp_number': '+971509876543',
            'priority': 'medium',
            'location': 'Abu Dhabi, UAE',
            'budget': 150000,
            'interests': 'Ladies watches, jewelry complications',
            'notes': 'Looking for anniversary gift. Interested in diamond-set pieces.',
            'assigned_sales_associate': 'maaz-001'
        },
        {
            'name': 'Mohammed Hassan',
            'email': 'mohammed@example.ae',
            'phone': '+971505555555',
            'whatsapp_number': '+971505555555',
            'priority': 'vip',
            'location': 'Sharjah, UAE',
            'budget': 500000,
            'interests': 'Grand complications, tourbillons, perpetual calendars',
            'notes': 'Serious collector. Owns multiple Patek Philippe and AP pieces. Looking for first VC.',
            'assigned_sales_associate': 'maaz-001'
        }
    ]
    
    for client in sample_clients:
        cursor.execute("""
            INSERT INTO clients (name, email, phone, whatsapp_number, priority, location, 
                               budget, interests, notes, assigned_sales_associate)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id;
        """, (client['name'], client['email'], client['phone'], client['whatsapp_number'],
              client['priority'], client['location'], client['budget'], client['interests'],
              client['notes'], client['assigned_sales_associate']))
        
        client_id = cursor.fetchone()[0]
        
        # Add sample lead for each client
        cursor.execute("""
            INSERT INTO leads (client_id, status, source, description, value, probability, 
                             expected_close_date, assigned_to)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s);
        """, (client_id, 'qualified', 'Referral', f'Potential sale for {client["name"]}',
              client['budget'], 75, datetime.now() + timedelta(days=30), 'maaz-001'))
    
    conn.commit()
    cursor.close()
    conn.close()
    print("✅ Sample data populated successfully!")

def main():
    """Main setup function"""
    print("🚀 Setting up CRC Warroom Enhanced Database...")
    
    try:
        create_tables()
        populate_sample_data()
        print("✅ Database setup completed successfully!")
        print("\n📊 Database ready with:")
        print("   - 8 Vacheron Constantin watches")
        print("   - 6 FAQ categories")
        print("   - 5 process documents")
        print("   - 3 sample clients with leads")
        print("   - Authentication and session tables")
        
    except Exception as e:
        print(f"❌ Database setup failed: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()