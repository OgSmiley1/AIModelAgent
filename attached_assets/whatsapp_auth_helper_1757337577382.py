#!/usr/bin/env python3
"""
WhatsApp Authorization Helper
Generate authorization URLs and exchange codes for access tokens
"""

import urllib.parse
import requests
import json

def generate_auth_url():
    """Generate Meta authorization URL for WhatsApp permissions"""
    
    # Your app details
    app_id = "610696125139908"
    redirect_uri = "https://developers.facebook.com/tools/explorer/"  # Use Graph API Explorer
    
    # Required permissions for WhatsApp Business
    scope = "whatsapp_business_management,whatsapp_business_messaging"
    
    # Build authorization URL
    auth_url = f"https://www.facebook.com/v18.0/dialog/oauth?" + urllib.parse.urlencode({
        "client_id": app_id,
        "redirect_uri": redirect_uri,
        "scope": scope,
        "response_type": "code",
        "state": "crc_warroom_auth"
    })
    
    return auth_url

def exchange_code_for_token(code, app_id, app_secret):
    """Exchange authorization code for access token"""
    
    url = "https://graph.facebook.com/v18.0/oauth/access_token"
    
    params = {
        "client_id": app_id,
        "client_secret": app_secret,
        "redirect_uri": "https://developers.facebook.com/tools/explorer/",
        "code": code
    }
    
    try:
        response = requests.get(url, params=params)
        if response.status_code == 200:
            return response.json()
        else:
            return {"error": f"Token exchange failed: {response.text}"}
    except Exception as e:
        return {"error": f"Request failed: {str(e)}"}

if __name__ == "__main__":
    print("=== WhatsApp Authorization Helper ===\n")
    
    print("Step 1: Visit this authorization URL:")
    print("=" * 60)
    auth_url = generate_auth_url()
    print(auth_url)
    print("=" * 60)
    
    print("\nStep 2: After authorization, you'll be redirected to Graph API Explorer")
    print("Step 3: Copy the 'code' parameter from the redirect URL")
    print("Step 4: Run this script again with the code to get your access token")
    
    print("\nAlternative: Use Graph API Explorer directly")
    print("1. Go to https://developers.facebook.com/tools/explorer/")
    print("2. Select your app: VC Client Engagement")
    print("3. Click 'Get Token' → 'Get User Access Token'")
    print("4. Select permissions: whatsapp_business_management, whatsapp_business_messaging")
    print("5. Generate token and copy it")