#!/usr/bin/env python3
"""
CRC Warroom - Complete Business Intelligence Excel Workbook Generator
Creates comprehensive Excel workbook with client tracking, watch inventory, and analytics
"""

import json
import pandas as pd
from datetime import datetime, timedelta
import numpy as np
from openpyxl import Workbook
from openpyxl.styles import Font, Fill, PatternFill, Alignment, Border, Side
from openpyxl.formatting.rule import ColorScaleRule, CellIsRule
from openpyxl.chart import BarChart, PieChart, LineChart, Reference
from openpyxl.utils.dataframe import dataframe_to_rows
import os

def load_system_data():
    """Load all CRC Warroom data from API responses"""
    try:
        # Load clients data
        with open('/tmp/clients_data.json', 'r') as f:
            clients_data = json.load(f)
        
        # Load watches data
        with open('/tmp/watches_data.json', 'r') as f:
            watches_data = json.load(f)
            
        # Load dashboard data (if available)
        dashboard_data = {}
        try:
            with open('/tmp/dashboard_data.json', 'r') as f:
                dashboard_data = json.load(f)
        except FileNotFoundError:
            print("Dashboard data not available, continuing without it...")
            
        return clients_data, watches_data, dashboard_data
        
    except Exception as e:
        print(f"Error loading data: {e}")
        return [], [], {}

def calculate_registry_duration(client_data):
    """Calculate how long each client has been in the registry"""
    try:
        # Check for createdAt field
        if 'createdAt' in client_data and client_data['createdAt']:
            created_date = pd.to_datetime(client_data['createdAt'], utc=True)
            current_date = datetime.now().replace(tzinfo=created_date.tzinfo)
            duration = current_date - created_date.to_pydatetime()
            return max(0, duration.days)
        
        # Check for originalData.requestDate (from imported data)
        if 'originalData' in client_data and client_data['originalData']:
            if 'requestDate' in client_data['originalData'] and client_data['originalData']['requestDate']:
                request_date = pd.to_datetime(client_data['originalData']['requestDate'], utc=True)
                current_date = datetime.now().replace(tzinfo=request_date.tzinfo)
                duration = current_date - request_date.to_pydatetime()
                return max(0, duration.days)
        
        # If no specific dates, estimate based on import date (conservative estimate)
        # Most clients were imported recently, so default to 30 days for estimation
        return 30
        
    except Exception as e:
        # If all else fails, estimate 30 days as a reasonable default
        return 30

def create_client_sheet(wb, clients_data):
    """Create comprehensive client database sheet"""
    print("📋 Creating client database sheet...")
    
    ws = wb.create_sheet("Client Database", 0)
    
    # Headers with registry tracking
    headers = [
        "Name", "Phone", "Email", "WhatsApp", "Status", "Priority", 
        "Lead Score", "Conversion Probability", "Engagement Level",
        "Registry Days", "Follow-up Required", "Follow-up Date",
        "Budget", "Timeframe", "Location", "Decision Maker",
        "Interests", "Tags", "Source", "Sales Associate", 
        "Original Reference", "Request Date", "Notes", "Created Date"
    ]
    
    # Apply headers
    for col, header in enumerate(headers, 1):
        cell = ws.cell(row=1, column=col, value=header)
        cell.font = Font(bold=True, color="FFFFFF")
        cell.fill = PatternFill(start_color="1f4e79", end_color="1f4e79", fill_type="solid")
        cell.alignment = Alignment(horizontal="center", vertical="center")
    
    # Add client data with registry tracking
    for row, client in enumerate(clients_data, 2):
        registry_days = calculate_registry_duration(client)
        
        # Extract original data safely
        original_data = client.get('originalData', {}) or {}
        
        row_data = [
            client.get('name', ''),
            client.get('phone', ''),
            client.get('email', ''),
            client.get('whatsappNumber', ''),
            client.get('status', ''),
            client.get('priority', ''),
            client.get('leadScore', 0),
            client.get('conversionProbability', 0),
            client.get('engagementLevel', ''),
            registry_days,  # Days in registry
            "Yes" if client.get('followUpRequired', False) else "No",
            client.get('followUpDate', ''),
            client.get('budget', 0),
            client.get('timeframe', ''),
            client.get('location', ''),
            "Yes" if client.get('decisionMaker', False) else "No",
            client.get('interests', ''),
            ", ".join(client.get('tags', [])),
            client.get('source', ''),
            original_data.get('salesAssociate', ''),
            original_data.get('originalReference', ''),
            original_data.get('requestDate', ''),
            client.get('notes', ''),
            client.get('createdAt', '')
        ]
        
        for col, value in enumerate(row_data, 1):
            ws.cell(row=row, column=col, value=value)
    
    # Apply conditional formatting for priority clients
    red_fill = PatternFill(start_color="FFE6E6", end_color="FFE6E6", fill_type="solid")
    yellow_fill = PatternFill(start_color="FFFACD", end_color="FFFACD", fill_type="solid")
    green_fill = PatternFill(start_color="E6FFE6", end_color="E6FFE6", fill_type="solid")
    
    # Priority-based formatting
    priority_col = 6  # Priority column
    for row in range(2, len(clients_data) + 2):
        priority = ws.cell(row=row, column=priority_col).value
        if priority == "high":
            for col in range(1, len(headers) + 1):
                ws.cell(row=row, column=col).fill = red_fill
        elif priority == "vip":
            for col in range(1, len(headers) + 1):
                ws.cell(row=row, column=col).fill = yellow_fill
    
    # Auto-adjust column widths
    for col in ws.columns:
        max_length = 0
        column = col[0].column_letter
        for cell in col:
            try:
                if len(str(cell.value)) > max_length:
                    max_length = len(str(cell.value))
            except:
                pass
        adjusted_width = min(max_length + 2, 50)
        ws.column_dimensions[column].width = adjusted_width
    
    return ws

def create_watch_inventory_sheet(wb, watches_data):
    """Create comprehensive watch inventory sheet"""
    print("⌚ Creating watch inventory sheet...")
    
    ws = wb.create_sheet("Watch Inventory")
    
    # Headers for watch inventory
    headers = [
        "Reference", "Brand", "Collection", "Model", "Description",
        "Price (USD)", "Currency", "Available", "Stock", "Category",
        "Popularity", "Tags", "Created Date", "Updated Date"
    ]
    
    # Apply headers
    for col, header in enumerate(headers, 1):
        cell = ws.cell(row=1, column=col, value=header)
        cell.font = Font(bold=True, color="FFFFFF")
        cell.fill = PatternFill(start_color="8B4513", end_color="8B4513", fill_type="solid")  # Brown for luxury
        cell.alignment = Alignment(horizontal="center", vertical="center")
    
    # Add watch data
    for row, watch in enumerate(watches_data, 2):
        row_data = [
            watch.get('reference', ''),
            watch.get('brand', ''),
            watch.get('collectionName', ''),
            watch.get('model', ''),
            watch.get('description', ''),
            watch.get('price', 0),
            watch.get('currency', 'USD'),
            "Yes" if watch.get('available', False) else "No",
            watch.get('stock', ''),
            watch.get('category', ''),
            watch.get('popularity', 0),
            ", ".join(watch.get('tags', [])),
            watch.get('createdAt', ''),
            watch.get('updatedAt', '')
        ]
        
        for col, value in enumerate(row_data, 1):
            cell = ws.cell(row=row, column=col, value=value)
            
            # Format price column
            if col == 6 and isinstance(value, (int, float)):
                cell.number_format = '"$"#,##0_);("$"#,##0)'
    
    # Conditional formatting for availability
    available_col = 8  # Available column
    for row in range(2, len(watches_data) + 2):
        available = ws.cell(row=row, column=available_col).value
        if available == "Yes":
            ws.cell(row=row, column=available_col).fill = PatternFill(start_color="90EE90", end_color="90EE90", fill_type="solid")
        else:
            ws.cell(row=row, column=available_col).fill = PatternFill(start_color="FFB6C1", end_color="FFB6C1", fill_type="solid")
    
    # Auto-adjust column widths
    for col in ws.columns:
        max_length = 0
        column = col[0].column_letter
        for cell in col:
            try:
                if len(str(cell.value)) > max_length:
                    max_length = len(str(cell.value))
            except:
                pass
        adjusted_width = min(max_length + 2, 40)
        ws.column_dimensions[column].width = adjusted_width
    
    return ws

def create_analytics_dashboard(wb, clients_data, watches_data, dashboard_data):
    """Create business analytics dashboard"""
    print("📊 Creating analytics dashboard...")
    
    ws = wb.create_sheet("Analytics Dashboard")
    
    # Title
    title_cell = ws.cell(row=1, column=1, value="CRC WARROOM - BUSINESS INTELLIGENCE DASHBOARD")
    title_cell.font = Font(size=16, bold=True, color="FFFFFF")
    title_cell.fill = PatternFill(start_color="D4AF37", end_color="D4AF37", fill_type="solid")  # Gold
    ws.merge_cells("A1:H1")
    
    # Key Metrics
    ws.cell(row=3, column=1, value="KEY PERFORMANCE INDICATORS").font = Font(bold=True, size=14)
    
    # Calculate metrics
    total_clients = len(clients_data)
    vip_clients = len([c for c in clients_data if c.get('priority') == 'vip'])
    high_priority = len([c for c in clients_data if c.get('priority') == 'high'])
    follow_up_required = len([c for c in clients_data if c.get('followUpRequired', False)])
    
    total_watches = len(watches_data)
    available_watches = len([w for w in watches_data if w.get('available', False)])
    total_inventory_value = sum(w.get('price', 0) for w in watches_data)
    
    # Average registry duration
    avg_registry_days = np.mean([calculate_registry_duration(c) for c in clients_data])
    
    metrics = [
        ("Total Clients", total_clients),
        ("VIP Clients", vip_clients),
        ("High Priority Clients", high_priority),
        ("Clients Requiring Follow-up", follow_up_required),
        ("Average Registry Days", f"{avg_registry_days:.1f}"),
        ("Total Watch Collection", total_watches),
        ("Available Watches", available_watches),
        ("Total Inventory Value", f"${total_inventory_value:,.0f}")
    ]
    
    row = 5
    for metric, value in metrics:
        ws.cell(row=row, column=1, value=metric).font = Font(bold=True)
        ws.cell(row=row, column=2, value=value).font = Font(size=12)
        if "Value" in metric:
            ws.cell(row=row, column=2).number_format = '"$"#,##0_);("$"#,##0)'
        row += 1
    
    # Client Distribution by Status
    ws.cell(row=row+2, column=1, value="CLIENT DISTRIBUTION BY STATUS").font = Font(bold=True, size=12)
    status_counts = {}
    for client in clients_data:
        status = client.get('status', 'unknown')
        status_counts[status] = status_counts.get(status, 0) + 1
    
    row += 4
    for status, count in status_counts.items():
        ws.cell(row=row, column=1, value=status.title())
        ws.cell(row=row, column=2, value=count)
        row += 1
    
    # Watch Collections Summary
    ws.cell(row=row+2, column=4, value="WATCH COLLECTIONS SUMMARY").font = Font(bold=True, size=12)
    collection_counts = {}
    for watch in watches_data:
        collection = watch.get('collectionName', 'Unknown')
        if collection:
            collection_counts[collection] = collection_counts.get(collection, 0) + 1
    
    row_start = row + 4
    for collection, count in sorted(collection_counts.items(), key=lambda x: x[1], reverse=True)[:10]:  # Top 10
        ws.cell(row=row_start, column=4, value=collection)
        ws.cell(row=row_start, column=5, value=count)
        row_start += 1
    
    return ws

def create_follow_up_tracker(wb, clients_data):
    """Create follow-up tracking sheet with registry duration analysis"""
    print("📅 Creating follow-up tracker...")
    
    ws = wb.create_sheet("Follow-up Tracker")
    
    # Headers
    headers = [
        "Client Name", "Phone", "WhatsApp", "Status", "Priority",
        "Registry Days", "Follow-up Required", "Follow-up Date",
        "Lead Score", "Last Contact", "Next Action", "Notes"
    ]
    
    # Apply headers
    for col, header in enumerate(headers, 1):
        cell = ws.cell(row=1, column=col, value=header)
        cell.font = Font(bold=True, color="FFFFFF")
        cell.fill = PatternFill(start_color="2E8B57", end_color="2E8B57", fill_type="solid")  # Sea Green
        cell.alignment = Alignment(horizontal="center", vertical="center")
    
    # Filter clients needing follow-up or high priority
    follow_up_clients = [c for c in clients_data if 
                        c.get('followUpRequired', False) or 
                        c.get('priority') in ['high', 'vip'] or
                        c.get('leadScore', 0) > 70]
    
    # Sort by registry days (longest first)
    follow_up_clients.sort(key=lambda c: calculate_registry_duration(c), reverse=True)
    
    # Add follow-up data
    for row, client in enumerate(follow_up_clients, 2):
        registry_days = calculate_registry_duration(client)
        
        # Determine next action based on registry duration and status
        if registry_days > 90:
            next_action = "Long-term follow-up required"
        elif registry_days > 30:
            next_action = "Medium-term check-in"
        elif client.get('followUpRequired', False):
            next_action = "Immediate follow-up"
        else:
            next_action = "Regular contact"
        
        row_data = [
            client.get('name', ''),
            client.get('phone', ''),
            client.get('whatsappNumber', ''),
            client.get('status', ''),
            client.get('priority', ''),
            registry_days,
            "Yes" if client.get('followUpRequired', False) else "No",
            client.get('followUpDate', ''),
            client.get('leadScore', 0),
            "TBD",  # Last contact placeholder
            next_action,
            client.get('notes', '')
        ]
        
        for col, value in enumerate(row_data, 1):
            cell = ws.cell(row=row, column=col, value=value)
            
            # Highlight urgent follow-ups
            if registry_days > 60:
                cell.fill = PatternFill(start_color="FFE4B5", end_color="FFE4B5", fill_type="solid")
            elif client.get('priority') == 'vip':
                cell.fill = PatternFill(start_color="F0E68C", end_color="F0E68C", fill_type="solid")
    
    # Auto-adjust column widths
    for col in ws.columns:
        max_length = 0
        column = col[0].column_letter
        for cell in col:
            try:
                if len(str(cell.value)) > max_length:
                    max_length = len(str(cell.value))
            except:
                pass
        adjusted_width = min(max_length + 2, 35)
        ws.column_dimensions[column].width = adjusted_width
    
    return ws

def create_business_formulas_sheet(wb, clients_data, watches_data):
    """Create sheet with business formulas and calculations"""
    print("🔧 Creating business formulas sheet...")
    
    ws = wb.create_sheet("Business Tools")
    
    # Title
    title_cell = ws.cell(row=1, column=1, value="BUSINESS CALCULATION TOOLS")
    title_cell.font = Font(size=14, bold=True)
    ws.merge_cells("A1:D1")
    
    # Revenue Projection Calculator
    ws.cell(row=3, column=1, value="REVENUE PROJECTION CALCULATOR").font = Font(bold=True)
    ws.cell(row=4, column=1, value="Average Deal Size:")
    ws.cell(row=4, column=2, value=50000)  # Default luxury watch deal
    ws.cell(row=5, column=1, value="Conversion Rate (%):")
    ws.cell(row=5, column=2, value=15)  # Default conversion rate
    ws.cell(row=6, column=1, value="Active Prospects:")
    ws.cell(row=6, column=2, value=len([c for c in clients_data if c.get('status') in ['prospect', 'interested']]))
    ws.cell(row=7, column=1, value="Projected Monthly Revenue:")
    ws.cell(row=7, column=2, value="=B4*B5/100*B6")
    ws.cell(row=7, column=2).number_format = '"$"#,##0_);("$"#,##0)'
    
    # Client Performance Metrics
    ws.cell(row=9, column=1, value="CLIENT PERFORMANCE METRICS").font = Font(bold=True)
    ws.cell(row=10, column=1, value="Total Clients:")
    ws.cell(row=10, column=2, value=len(clients_data))
    ws.cell(row=11, column=1, value="VIP Clients:")
    ws.cell(row=11, column=2, value=len([c for c in clients_data if c.get('priority') == 'vip']))
    ws.cell(row=12, column=1, value="VIP Percentage:")
    ws.cell(row=12, column=2, value="=B11/B10*100")
    ws.cell(row=12, column=2).number_format = '0.0"%"'
    
    # Inventory Metrics
    ws.cell(row=14, column=1, value="INVENTORY ANALYSIS").font = Font(bold=True)
    ws.cell(row=15, column=1, value="Total Watches:")
    ws.cell(row=15, column=2, value=len(watches_data))
    ws.cell(row=16, column=1, value="Available Watches:")
    ws.cell(row=16, column=2, value=len([w for w in watches_data if w.get('available', False)]))
    ws.cell(row=17, column=1, value="Availability Rate:")
    ws.cell(row=17, column=2, value="=B16/B15*100")
    ws.cell(row=17, column=2).number_format = '0.0"%"'
    
    return ws

def main():
    """Create comprehensive CRC Warroom Excel workbook"""
    print("🚀 Starting CRC Warroom Excel Workbook Creation...")
    
    # Load all system data
    clients_data, watches_data, dashboard_data = load_system_data()
    
    if not clients_data and not watches_data:
        print("❌ No data loaded. Please check data files.")
        return
    
    print(f"📊 Data loaded: {len(clients_data)} clients, {len(watches_data)} watches")
    
    # Create workbook
    wb = Workbook()
    
    # Remove default sheet
    wb.remove(wb.active)
    
    # Create all sheets
    create_client_sheet(wb, clients_data)
    create_watch_inventory_sheet(wb, watches_data)
    create_analytics_dashboard(wb, clients_data, watches_data, dashboard_data)
    create_follow_up_tracker(wb, clients_data)
    create_business_formulas_sheet(wb, clients_data, watches_data)
    
    # Save workbook
    filename = f"CRC_Warroom_Complete_Workbook_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    wb.save(filename)
    
    print(f"✅ Excel workbook created successfully: {filename}")
    print(f"📁 File size: {os.path.getsize(filename) / 1024 / 1024:.2f} MB")
    
    # Display summary
    print("\n🎯 WORKBOOK SUMMARY:")
    print("📋 Sheet 1: Client Database - Complete client registry with tracking")
    print("⌚ Sheet 2: Watch Inventory - Full luxury watch collection") 
    print("📊 Sheet 3: Analytics Dashboard - Business intelligence metrics")
    print("📅 Sheet 4: Follow-up Tracker - Client registry duration & follow-up management")
    print("🔧 Sheet 5: Business Tools - Revenue projections & formulas")
    print(f"\n✨ Total Records: {len(clients_data)} clients + {len(watches_data)} watches")
    
    return filename

if __name__ == "__main__":
    main()