import os
import uuid
import hashlib
from flask import Flask, render_template, request, redirect, url_for, session, jsonify, flash, send_file
from functools import wraps
import psycopg2
import psycopg2.extras
from datetime import datetime
import sys

# --- App Configuration ---
app = Flask(__name__)
# Use a strong, consistent secret key from environment variables
app.secret_key = os.environ.get('SECRET_KEY', 'default_super_secret_key_for_dev_2025') 

# --- Database Configuration ---
# This automatically reads the DATABASE_URL from your Replit Database settings
DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql://user:password@host:port/dbname')

def get_db_connection():
    """Establishes a connection to the database."""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    except psycopg2.OperationalError as e:
        print(f"🔴 DATABASE CONNECTION FAILED: {e}")
        return None

# --- Database Initialization (Run Once) ---
def init_db():
    """Initializes the database with a complete schema and sample data."""
    conn = get_db_connection()
    if not conn:
        print("Could not initialize database. Connection failed.")
        return

    with conn.cursor() as cur:
        # Drop tables for a clean setup
        cur.execute("DROP TABLE IF EXISTS leads, clients, users, watch_inventory, saleoutplan CASCADE;")

        # Users Table (with roles)
        cur.execute("""
            CREATE TABLE users (
                id UUID PRIMARY KEY,
                username VARCHAR(80) UNIQUE NOT NULL,
                password_hash VARCHAR(128) NOT NULL,
                role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'associate'))
            );
        """)

        # Clients Table (linked to sales associate)
        cur.execute("""
            CREATE TABLE clients (
                id UUID PRIMARY KEY,
                name VARCHAR(120) NOT NULL,
                email VARCHAR(120),
                phone VARCHAR(30),
                status VARCHAR(50) DEFAULT 'Prospect',
                priority VARCHAR(50) DEFAULT 'Medium',
                sales_associate_id UUID REFERENCES users(id)
            );
        """)

        # Leads Table (linked to client and associate)
        cur.execute("""
            CREATE TABLE leads (
                id UUID PRIMARY KEY,
                client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
                description TEXT,
                value NUMERIC(12, 2),
                expected_close_date DATE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                sales_associate_id UUID REFERENCES users(id),
                invoice_number VARCHAR(100),
                purchase_location VARCHAR(50),
                watch_availability VARCHAR(50)
            );
        """)

        # Watch Inventory Table
        cur.execute("""
            CREATE TABLE watch_inventory (
                id UUID PRIMARY KEY,
                timepiece_reference VARCHAR(100) UNIQUE NOT NULL,
                collection_name VARCHAR(150),
                price NUMERIC(12, 2),
                available BOOLEAN DEFAULT TRUE
            );
        """)

        print("✅ Core tables (users, clients, leads, inventory) created.")

        # --- Sample Data ---
        admin_pass = hashlib.sha256('Smile123'.encode()).hexdigest()
        maaz_pass = hashlib.sha256('MaazPass1'.encode()).hexdigest()
        riham_pass = hashlib.sha256('RihamPass1'.encode()).hexdigest()
        asma_pass = hashlib.sha256('AsmaPass1'.encode()).hexdigest()

        admin_id, maaz_id, riham_id, asma_id = [uuid.uuid4() for _ in range(4)]

        cur.execute("INSERT INTO users (id, username, password_hash, role) VALUES (%s, %s, %s, %s), (%s, %s, %s, %s), (%s, %s, %s, %s), (%s, %s, %s, %s);",
                    (admin_id, 'CRC', admin_pass, 'admin',
                     maaz_id, 'Maaz', maaz_pass, 'associate',
                     riham_id, 'Riham', riham_pass, 'associate',
                     asma_id, 'Asma', asma_pass, 'associate'))
        print("👤 Sample users (CRC, Maaz, Riham, Asma) created.")

        client_data = [
            (uuid.uuid4(), 'Ahmed Al Maktoum', 'ahmed.m@example.com', '+971501112222', 'Active', 'High', maaz_id),
            (uuid.uuid4(), 'Fatima Al Futtaim', 'fatima.f@example.com', '+971553334444', 'Active', 'High', riham_id),
            (uuid.uuid4(), 'Yusuf bin Khalid', 'yusuf.k@example.com', '+971525556666', 'Prospect', asma_id)
        ]
        client_ids = {client[1]: client[0] for client in client_data}
        for client in client_data:
            cur.execute("INSERT INTO clients (id, name, email, phone, status, priority, sales_associate_id) VALUES (%s, %s, %s, %s, %s, %s, %s);", client)
        print("👥 Sample clients created and assigned.")

        lead_data = [
            (uuid.uuid4(), client_ids['Ahmed Al Maktoum'], 'Vacheron Constantin Overseas Tourbillon', 125000.00, maaz_id, 'INV-2025-001'),
            (uuid.uuid4(), client_ids['Fatima Al Futtaim'], 'VC Patrimony Perpetual Calendar', 95000.00, riham_id, None)
        ]
        for lead in lead_data:
            cur.execute("INSERT INTO leads (id, client_id, description, value, sales_associate_id, invoice_number) VALUES (%s, %s, %s, %s, %s, %s);", lead)
        print("🎯 Sample leads created.")

        inventory_data = [
            (uuid.uuid4(), '4500V/110A-B128', 'Overseas', 95000.00, True),
            (uuid.uuid4(), '82172/000R-9382', 'Patrimony', 78000.00, True),
            (uuid.uuid4(), '5500V/110A-B148', 'Overseas Chronograph', 125000.00, False)
        ]
        for item in inventory_data:
            cur.execute("INSERT INTO watch_inventory (id, timepiece_reference, collection_name, price, available) VALUES (%s, %s, %s, %s, %s);", item)
        print("⌚ Sample watch inventory created.")

    conn.commit()
    cur.close()
    conn.close()
    print("✅ Database initialized successfully.")

# --- Decorators ---
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash("Please log in to access this page.", "warning")
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if session.get('role') != 'admin':
            flash("You do not have permission to access this page.", "error")
            return redirect(url_for('dashboard'))
        return f(*args, **kwargs)
    return decorated_function

# --- Main Routes ---
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        conn = get_db_connection()
        if not conn:
            flash("Database service unavailable.", "error")
            return render_template('login.html')
        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
            cur.execute("SELECT * FROM users WHERE username = %s AND password_hash = %s;", (username, password_hash))
            user = cur.fetchone()
        conn.close()
        if user:
            session.clear()
            session['user_id'], session['username'], session['role'] = str(user['id']), user['username'], user['role']
            return redirect(url_for('dashboard'))
        else:
            flash("Invalid credentials.", "error")
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()
    flash("You have been successfully logged out.", "info")
    return redirect(url_for('login'))

@app.route('/')
@app.route('/dashboard')
@login_required
def dashboard():
    conn = get_db_connection()
    if not conn:
        flash("Database connection failed", "error")
        return render_template('dashboard.html', total_clients=0, potential_sales=0)
    with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
        params = (session['user_id'],) if session['role'] == 'associate' else ()
        filter_clause = " WHERE sales_associate_id = %s" if session['role'] == 'associate' else ""
        cur.execute(f"SELECT COUNT(*) as total FROM clients{filter_clause};", params)
        total_clients = cur.fetchone()['total']
        sales_query = f"SELECT COALESCE(SUM(value), 0) as potential FROM leads WHERE expected_close_date >= date_trunc('month', CURRENT_DATE)"
        if session['role'] == 'associate':
            sales_query += " AND sales_associate_id = %s"
        cur.execute(sales_query, params)
        potential_sales = cur.fetchone()['potential']
    conn.close()
    return render_template('dashboard.html', total_clients=total_clients, potential_sales=potential_sales)

@app.route('/clients')
@app.route('/client-management') # Alias for your route
@login_required
def clients_list():
    conn = get_db_connection()
    if not conn:
        flash("Database connection failed", "error")
        return render_template('clients_list.html', clients=[])
    with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
        query = "SELECT c.id, c.name, c.email, c.status, c.priority, u.username as associate_name FROM clients c JOIN users u ON c.sales_associate_id = u.id"
        if session['role'] == 'associate':
            query += " WHERE c.sales_associate_id = %s ORDER BY c.name"
            cur.execute(query, (session['user_id'],))
        else:
            query += " ORDER BY u.username, c.name"
            cur.execute(query)
        clients = cur.fetchall()
    conn.close()
    return render_template('clients_list.html', clients=clients)

@app.route('/client/<uuid:client_id>')
@login_required
def client_detail(client_id):
    conn = get_db_connection()
    if not conn:
        flash("Database connection failed", "error")
        return redirect(url_for('clients_list'))
    with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
        query = "SELECT * FROM clients WHERE id = %s"
        params = [str(client_id)]
        if session['role'] == 'associate':
            query += " AND sales_associate_id = %s"
            params.append(session['user_id'])
        cur.execute(query, tuple(params))
        client = cur.fetchone()
        if not client:
            flash("Client not found or access denied.", "error")
            return redirect(url_for('clients_list'))
        cur.execute("SELECT * FROM leads WHERE client_id = %s ORDER BY created_at DESC", (str(client_id),))
        leads = cur.fetchall()
    conn.close()
    return render_template('client_detail.html', client=client, leads=leads)

# --- Your Additional Feature Routes (now connected to the database) ---

@app.route('/maaz-tracker')
@login_required
def maaz_tracker():
    conn = get_db_connection()
    if not conn:
        flash("Database connection failed", "error")
        return render_template('maaz_tracker.html', assignments=[], total_value=0)
    with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
        # This query specifically finds Maaz's data
        cur.execute("""
            SELECT l.*, c.name as client_name, c.priority 
            FROM leads l 
            JOIN clients c ON l.client_id = c.id
            JOIN users u ON l.sales_associate_id = u.id
            WHERE u.username = 'Maaz';
        """)
        assignments = cur.fetchall()
        total_value = sum(item['value'] for item in assignments if item['value'])
    conn.close()
    return render_template('maaz_tracker.html', assignments=assignments, total_value=total_value)

@app.route('/watch-inventory')
@login_required
def watch_inventory():
    conn = get_db_connection()
    if not conn:
        flash("Database connection failed", "error")
        return render_template('watch_inventory.html', watches=[])
    with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
        cur.execute("SELECT * FROM watch_inventory ORDER BY collection_name, timepiece_reference;")
        watches = cur.fetchall()
    conn.close()
    return render_template('watch_inventory.html', watches=watches)

# --- Placeholder Routes for features to be built ---
@app.route('/developer-mode')
@login_required
@admin_required # Only admins can access this
def developer_mode():
    return render_template('placeholder.html', title="Developer Mode")

@app.route('/whatsapp-setup')
@login_required
def whatsapp_setup():
    return render_template('placeholder.html', title="WhatsApp Setup")

# --- API Routes ---
@app.route('/api/verify_password', methods=['POST'])
@login_required
def verify_password():
    password = request.json.get('password')
    if not password: return jsonify({'success': False, 'error': 'Password required'}), 400
    password_hash = hashlib.sha256(password.encode()).hexdigest()
    conn = get_db_connection()
    user = None
    if conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM users WHERE id = %s AND password_hash = %s;", (session['user_id'], password_hash))
            user = cur.fetchone()
        conn.close()
    return jsonify({'success': True}) if user else jsonify({'success': False, 'error': 'Invalid password'})

# --- CLI Command for Database Initialization ---
@app.cli.command("initdb")
def initdb_command():
    """Creates the database tables and populates them with sample data."""
    print("Starting database initialization...")
    init_db()
    print("Database setup complete.")

# --- Main Execution ---
if __name__ == '__main__':
    # This block is for running the web server.
    # To initialize the database, stop the app and run 'flask --app app initdb' in the shell.
    app.run(host='0.0.0.0', port=5000, debug=True)
