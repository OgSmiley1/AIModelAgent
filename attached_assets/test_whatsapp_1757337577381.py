#!/usr/bin/env python3
"""
WhatsApp Integration Test Script
Test sending messages via WhatsApp Business API
"""

import requests
import json

def test_send_message():
    # Your credentials
    access_token = "EAAIrbMWay8QBPD1WyNL0m19YQWKDLe2ss89lgArHKVC9veU1qH4hcdyvaZCyjAZBtRu46dj48uqkIrhPdBdG2e0qHxZAfj51jyDYZAqu6AWTvXKZAXbQKNkEjy5ZASUhAgPPIL7PRF1AOzr4vG0bIyMgrZBSGGUTFTRy3pf6Eoy6LyeuzF7H7qu7hX1sV7UoFwrhZAA0xMEMIaLbYyCMZALDUkKxmdmcRwa4facWQDA2IixNOMgZDZD"
    phone_number_id = "103853712672398"  # Test phone number ID
    
    # WhatsApp API endpoint
    url = f"https://graph.facebook.com/v18.0/{phone_number_id}/messages"
    
    # Headers
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    # Test message to your number
    payload = {
        "messaging_product": "whatsapp",
        "to": "971509509587",  # User's actual number
        "type": "text",
        "text": {
            "body": "🔔 CRC Warroom Test\n\nWhatsApp integration is working! Messages will be analyzed without auto-responses."
        }
    }
    
    try:
        print("Sending test message...")
        response = requests.post(url, headers=headers, json=payload)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            result = response.json()
            message_id = result.get('messages', [{}])[0].get('id')
            print(f"✅ Message sent successfully! Message ID: {message_id}")
        else:
            print(f"❌ Failed to send message: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")

def discover_phone_number():
    """Try to find the correct phone number ID"""
    access_token = "EAAIrbMWay8QBPD1WyNL0m19YQWKDLe2ss89lgArHKVC9veU1qH4hcdyvaZCyjAZBtRu46dj48uqkIrhPdBdG2e0qHxZAfj51jyDYZAqu6AWTvXKZAXbQKNkEjy5ZASUhAgPPIL7PRF1AOzr4vG0bIyMgrZBSGGUTFTRy3pf6Eoy6LyeuzF7H7qu7hX1sV7UoFwrhZAA0xMEMIaLbYyCMZALDUkKxmdmcRwa4facWQDA2IixNOMgZDZD"
    
    # Try different endpoints to find phone number ID
    endpoints_to_try = [
        "https://graph.facebook.com/v18.0/me",
        "https://graph.facebook.com/v18.0/me/accounts",
        "https://graph.facebook.com/v18.0/app",
    ]
    
    headers = {"Authorization": f"Bearer {access_token}"}
    
    for endpoint in endpoints_to_try:
        try:
            print(f"Trying: {endpoint}")
            response = requests.get(endpoint, headers=headers)
            print(f"Response: {response.text}")
            print("-" * 50)
        except Exception as e:
            print(f"Error with {endpoint}: {str(e)}")

if __name__ == "__main__":
    print("=== WhatsApp Integration Test ===")
    print("1. Discovering phone number...")
    discover_phone_number()
    
    print("\n2. Testing message send...")
    test_send_message()