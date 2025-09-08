#!/usr/bin/env python3
"""
Simple Project Export Tool
"""

import os
import zipfile
import json
from datetime import datetime

def create_simple_export():
    """Create a downloadable zip with all project files"""
    
    # Create conversation summary
    summary = {
        "project_title": "CRC Sales & Lead Warroom - Complete Export",
        "export_date": datetime.now().isoformat(),
        "description": "Complete luxury watch sales management system with WhatsApp integration",
        "features": [
            "Client profile management with PostgreSQL",
            "WhatsApp Business API integration (silent analysis)",
            "Sales pipeline tracking and management", 
            "Progressive Web App capabilities",
            "Vacheron Constantin luxury styling",
            "Real-time conversation analysis"
        ],
        "status": {
            "database": "PostgreSQL with 3 sample clients loaded",
            "whatsapp": "Webhook active, auto-responses disabled",
            "authentication": "CRC/Smile123 login active",
            "pwa": "Ready for mobile installation"
        }
    }
    
    with open('project_summary.json', 'w') as f:
        json.dump(summary, f, indent=2)
    
    # Create zip file
    zip_name = "CRC_Warroom_Complete_Export.zip"
    
    with zipfile.ZipFile(zip_name, 'w', zipfile.ZIP_DEFLATED) as zipf:
        # Add main files
        main_files = [
            'app.py', 'config.py', 'pyproject.toml', 'uv.lock',
            'whatsapp_auth_helper.py', 'whatsapp_setup_guide.md',
            'test_whatsapp.py', 'export_project.py', 'project_summary.json'
        ]
        
        for file in main_files:
            if os.path.exists(file):
                zipf.write(file)
                
        # Add directories
        for root, dirs, files in os.walk('.'):
            for file in files:
                file_path = os.path.join(root, file)
                
                # Include these directories
                if any(folder in file_path for folder in ['templates/', 'static/', 'models/', 'services/', 'utils/']):
                    if not any(skip in file_path for skip in ['__pycache__', '.pyc']):
                        zipf.write(file_path)
    
    print(f"✅ Created: {zip_name}")
    return zip_name

if __name__ == "__main__":
    create_simple_export()