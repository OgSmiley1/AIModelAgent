#!/usr/bin/env python3
"""
Maaz Mafia Tracker Database Setup
Creates follow-up management tables and initial data
"""

import psycopg2
import psycopg2.extras
from datetime import datetime, timedelta
import os
from config import Config

def get_db_connection():
    """Get database connection"""
    try:
        conn = psycopg2.connect(
            host=os.environ.get('PGHOST', 'localhost'),
            database=os.environ.get('PGDATABASE', 'main'),
            user=os.environ.get('PGUSER', 'main'),
            password=os.environ.get('PGPASSWORD', ''),
            port=os.environ.get('PGPORT', 5432)
        )
        return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        return None

def create_followup_tables():
    """Create follow-up tracking tables for Maaz Mafia Tracker"""
    
    conn = get_db_connection()
    if not conn:
        print("Failed to connect to database")
        return False
    
    cursor = conn.cursor()
    
    try:
        # 1. Add follow-up fields to existing clients table
        print("Adding follow-up fields to clients table...")
        cursor.execute("""
            ALTER TABLE clients 
            ADD COLUMN IF NOT EXISTS last_contact_date TIMESTAMP,
            ADD COLUMN IF NOT EXISTS next_followup_date TIMESTAMP,
            ADD COLUMN IF NOT EXISTS last_instructions TEXT,
            ADD COLUMN IF NOT EXISTS follow_up_status VARCHAR(50) DEFAULT 'pending',
            ADD COLUMN IF NOT EXISTS action_required TEXT,
            ADD COLUMN IF NOT EXISTS urgency_score INTEGER DEFAULT 5,
            ADD COLUMN IF NOT EXISTS deal_value_aed DECIMAL(12,2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS last_interaction_type VARCHAR(100),
            ADD COLUMN IF NOT EXISTS expected_close_date TIMESTAMP
        """)
        
        # 2. Create follow-up actions table
        print("Creating follow_up_actions table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS follow_up_actions (
                id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
                client_id VARCHAR(36) REFERENCES clients(id) ON DELETE CASCADE,
                action_type VARCHAR(100) NOT NULL,
                description TEXT NOT NULL,
                due_date TIMESTAMP NOT NULL,
                status VARCHAR(50) DEFAULT 'pending',
                priority VARCHAR(20) DEFAULT 'medium',
                created_by VARCHAR(100) DEFAULT 'Maaz',
                created_at TIMESTAMP DEFAULT NOW(),
                completed_at TIMESTAMP,
                completion_notes TEXT,
                reminder_sent BOOLEAN DEFAULT FALSE
            )
        """)
        
        # 3. Create interaction history table
        print("Creating interaction_history table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS interaction_history (
                id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
                client_id VARCHAR(36) REFERENCES clients(id) ON DELETE CASCADE,
                interaction_date TIMESTAMP DEFAULT NOW(),
                interaction_type VARCHAR(100) NOT NULL,
                channel VARCHAR(50) NOT NULL,
                summary TEXT NOT NULL,
                instructions_given TEXT,
                client_response TEXT,
                outcome VARCHAR(100),
                next_action TEXT,
                created_by VARCHAR(100) DEFAULT 'Maaz',
                watch_models_discussed TEXT[],
                deal_value_discussed DECIMAL(12,2)
            )
        """)
        
        # 4. Create watch inventory table from Vacheron Constantin catalog
        print("Creating watch_inventory table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS watch_inventory (
                id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
                reference_number VARCHAR(100) UNIQUE NOT NULL,
                collection VARCHAR(100) NOT NULL,
                model_name TEXT NOT NULL,
                price_aed DECIMAL(12,2) NOT NULL,
                availability VARCHAR(50) DEFAULT 'available',
                description TEXT,
                category VARCHAR(100),
                movement VARCHAR(100),
                case_material VARCHAR(100),
                dial_color VARCHAR(50),
                strap_type VARCHAR(100),
                water_resistance VARCHAR(50),
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        """)
        
        # 5. Create daily follow-up queue view
        print("Creating follow-up queue view...")
        cursor.execute("""
            CREATE OR REPLACE VIEW daily_followup_queue AS
            SELECT 
                c.id,
                c.name,
                c.phone,
                c.email,
                c.priority,
                c.status,
                c.last_contact_date,
                c.next_followup_date,
                c.last_instructions,
                c.action_required,
                c.urgency_score,
                c.deal_value_aed,
                c.last_interaction_type,
                CASE 
                    WHEN c.next_followup_date < NOW() THEN 'overdue'
                    WHEN c.next_followup_date::date = CURRENT_DATE THEN 'due_today'
                    WHEN c.next_followup_date::date = CURRENT_DATE + 1 THEN 'due_tomorrow'
                    ELSE 'upcoming'
                END as followup_status,
                EXTRACT(DAYS FROM (NOW() - c.next_followup_date)) as days_overdue
            FROM clients c
            WHERE c.next_followup_date IS NOT NULL
            ORDER BY 
                CASE 
                    WHEN c.next_followup_date < NOW() THEN 1
                    WHEN c.next_followup_date::date = CURRENT_DATE THEN 2
                    ELSE 3
                END,
                c.urgency_score DESC,
                c.deal_value_aed DESC
        """)
        
        conn.commit()
        print("✅ Maaz Mafia Tracker database setup completed successfully!")
        return True
        
    except Exception as e:
        print(f"Error setting up database: {e}")
        conn.rollback()
        return False
    finally:
        cursor.close()
        conn.close()

def insert_sample_followup_data():
    """Insert sample follow-up data for testing"""
    
    conn = get_db_connection()
    if not conn:
        return False
    
    cursor = conn.cursor()
    
    try:
        # Update existing clients with follow-up data
        print("Adding sample follow-up data...")
        
        sample_updates = [
            {
                'name': 'Ahmed Al Mansouri',
                'last_instructions': 'Promised to check availability of Overseas Chronograph 5500V/110A-B148 blue dial',
                'action_required': 'Follow up on watch availability and schedule viewing appointment',
                'urgency_score': 9,
                'deal_value_aed': 140000,
                'next_followup_date': datetime.now() - timedelta(days=1),  # Overdue
                'last_interaction_type': 'WhatsApp inquiry'
            },
            {
                'name': 'Fatima Al Zahra',
                'last_instructions': 'Client interested in Patrimony collection, budget 200k AED',
                'action_required': 'Send catalog and arrange boutique visit',
                'urgency_score': 8,
                'deal_value_aed': 200000,
                'next_followup_date': datetime.now(),  # Due today
                'last_interaction_type': 'Phone call'
            },
            {
                'name': 'Omar Hassan',
                'last_instructions': 'Considering Traditionnelle Perpetual Calendar, needs finance options',
                'action_required': 'Prepare financing proposal and schedule presentation',
                'urgency_score': 7,
                'deal_value_aed': 472000,
                'next_followup_date': datetime.now() + timedelta(days=1),  # Due tomorrow
                'last_interaction_type': 'Email exchange'
            }
        ]
        
        for update in sample_updates:
            cursor.execute("""
                UPDATE clients SET 
                    last_instructions = %s,
                    action_required = %s,
                    urgency_score = %s,
                    deal_value_aed = %s,
                    next_followup_date = %s,
                    last_interaction_type = %s,
                    last_contact_date = %s
                WHERE name ILIKE %s
            """, (
                update['last_instructions'],
                update['action_required'],
                update['urgency_score'],
                update['deal_value_aed'],
                update['next_followup_date'],
                update['last_interaction_type'],
                datetime.now() - timedelta(days=2),
                f"%{update['name']}%"
            ))
        
        conn.commit()
        print("✅ Sample follow-up data inserted successfully!")
        return True
        
    except Exception as e:
        print(f"Error inserting sample data: {e}")
        conn.rollback()
        return False
    finally:
        cursor.close()
        conn.close()

def insert_watch_inventory():
    """Insert sample Vacheron Constantin watch inventory"""
    
    conn = get_db_connection()
    if not conn:
        return False
    
    cursor = conn.cursor()
    
    try:
        print("Inserting Vacheron Constantin watch inventory...")
        
        # Sample watches from the catalog data provided
        watches = [
            ('4600V/200A-B980', 'Overseas', 'Overseas self-winding', 91000, 'available'),
            ('4605V/200A-B971', 'Overseas', 'Overseas self-winding', 120000, 'available'),
            ('5520V/210A-B148', 'Overseas', 'Overseas chronograph', 140000, 'limited'),
            ('4300V/220R-B642', 'Overseas', 'Overseas perpetual calendar ultra-thin skeleton', 645000, 'on_order'),
            ('85180/000R-H116', 'Patrimony', 'Patrimony self-winding', 137000, 'available'),
            ('4010U/000R-H117', 'Patrimony', 'Patrimony moon phase retrograde date', 207000, 'available'),
            ('82172/000R-H118', 'Traditionnelle', 'Traditionnelle manual-winding', 103000, 'available'),
            ('83570/000R-H060', 'Traditionnelle', 'Traditionnelle moon phase', 189000, 'limited'),
            ('4600E/000A-B487', 'FiftySix', 'Fiftysix self-winding', 51500, 'available'),
            ('4000E/000R-B438', 'FiftySix', 'Fiftysix complete calendar', 186000, 'available')
        ]
        
        for ref, collection, model, price, availability in watches:
            cursor.execute("""
                INSERT INTO watch_inventory 
                (reference_number, collection, model_name, price_aed, availability)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (reference_number) DO UPDATE SET
                price_aed = EXCLUDED.price_aed,
                availability = EXCLUDED.availability,
                updated_at = NOW()
            """, (ref, collection, model, price, availability))
        
        conn.commit()
        print("✅ Watch inventory inserted successfully!")
        return True
        
    except Exception as e:
        print(f"Error inserting watch inventory: {e}")
        conn.rollback()
        return False
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    print("🔧 Setting up Maaz Mafia Tracker Database...")
    
    if create_followup_tables():
        print("📊 Database tables created successfully")
        
        if insert_sample_followup_data():
            print("📋 Sample follow-up data added")
            
        if insert_watch_inventory():
            print("⌚ Watch inventory populated")
            
        print("\n✅ Maaz Mafia Tracker setup complete!")
        print("🎯 You can now track follow-ups, manage client interactions, and monitor deals!")
    else:
        print("❌ Setup failed - please check database connection")