import json
import logging
import os
import re
from datetime import datetime
from typing import Dict, List, Optional, Tuple

import google.generativeai as genai
from pydantic import BaseModel, Field

# Initialize Gemini client - check both possible API key names
api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
if not api_key:
    raise ValueError("Neither GEMINI_API_KEY nor GOOGLE_API_KEY environment variable is set")

genai.configure(api_key=api_key)

# Mock watch prices for collection value estimation
MOCK_WATCH_PRICES = {
    "rolex submariner": 15000,
    "rolex daytona": 30000,
    "rolex gmt": 12000,
    "patek philippe nautilus": 130000,
    "patek philippe calatrava": 25000,
    "audemars piguet royal oak": 50000,
    "omega speedmaster": 7000,
    "cartier tank": 6000,
    "tag heuer carrera": 5500,
    "breitling navitimer": 4500,
    "iwc pilot": 8000,
    "panerai luminor": 9000,
}

def search_watch_price(watch_name: str) -> Optional[int]:
    """Search for watch price using mock data"""
    normalized_name = watch_name.lower().strip()
    for key, price in MOCK_WATCH_PRICES.items():
        if key in normalized_name:
            logging.info(f"Found price for '{watch_name}': ${price:,}")
            return price
    logging.warning(f"Could not find price for '{watch_name}'")
    return None

class ConversationAnalysis(BaseModel):
    client_name: str = "Unknown Client"
    client_phone: str = ""
    client_email: Optional[str] = None
    collection_interests: List[str] = Field(default_factory=list)
    timepiece_references: List[str] = Field(default_factory=list)
    owned_watches: List[str] = Field(default_factory=list)  # NEW: Other watches client owns
    estimated_collection_value_usd: int = 0  # NEW: Estimated value of owned collection
    budget_range: Optional[str] = None
    urgency_level: str = "medium"  # low, medium, high, urgent
    sentiment: str = "neutral"  # very_positive, positive, neutral, negative, very_negative
    purchase_intent: str = "browsing"  # browsing, interested, ready_to_buy, confirmed
    key_interactions: List[str] = Field(default_factory=list)
    follow_up_required: bool = False
    follow_up_date: Optional[str] = None
    notes: str = ""

class WhatsAppAnalyzer:
    def __init__(self):
        self.model = genai.GenerativeModel('gemini-pro')
        
    def analyze_conversation(self, conversation_text: str) -> ConversationAnalysis:
        """Analyze WhatsApp conversation and extract client information"""
        
        system_prompt = """
        You are a world-class WhatsApp conversation analyzer for an elite Vacheron Constantin sales associate.
        Your primary goal is to extract critical client and sales intelligence from conversation transcripts.
        
        **CRITICAL EXTRACTION POINTS:**

        1. **CLIENT IDENTIFICATION:**
            - client_name: Extract the full name. Be precise.
            - client_phone: Extract any phone number mentioned, prioritizing international format (e.g., +971501234567).
            - client_email: Extract any email address mentioned.

        2. **PRODUCT INTEREST (Vacheron Constantin):**
            - collection_interests: List all Vacheron Constantin collections mentioned (e.g., Overseas, Patrimony).
            - timepiece_references: List all specific Vacheron Constantin model numbers (e.g., 4500V/110A-B483).

        3. **CLIENT PROFILE & VALUE ASSESSMENT (THIS IS KEY):**
            - owned_watches: **This is your most important task.** Identify and list ALL non-Vacheron Constantin watches the client mentions they currently own (e.g., "Rolex Submariner", "Patek Philippe Nautilus 5711"). This is crucial for understanding their profile.
            - budget_range: Note any stated budget.

        4. **INTERACTION ANALYSIS:**
            - urgency_level: Classify urgency (low/medium/high/urgent).
            - sentiment: Classify tone (very_positive/positive/neutral/negative/very_negative).
            - purchase_intent: Classify readiness (browsing/interested/ready_to_buy/confirmed).
            - key_interactions: Summarize the most important points of the conversation.

        5. **ACTIONABLE INTELLIGENCE:**
            - follow_up_required: Determine if a follow-up is needed.
            - follow_up_date: Suggest a specific follow-up date if applicable.
            - notes: Provide a concise summary and strategic recommendations for the sales associate.

        RESPOND ONLY WITH VALID JSON IN THIS EXACT FORMAT:
        {
            "client_name": "extracted name or Unknown Client",
            "client_phone": "phone number or empty string",
            "client_email": "email or null",
            "collection_interests": ["list of collections mentioned"],
            "timepiece_references": ["list of model numbers"],
            "owned_watches": ["list of non-VC watches client owns"],
            "budget_range": "budget mentioned or null",
            "urgency_level": "low/medium/high/urgent",
            "sentiment": "very_positive/positive/neutral/negative/very_negative",
            "purchase_intent": "browsing/interested/ready_to_buy/confirmed",
            "key_interactions": ["important conversation points"],
            "follow_up_required": true/false,
            "follow_up_date": "YYYY-MM-DD or null",
            "notes": "summary and recommendations"
        }
        """
        
        try:
            prompt = f"{system_prompt}\n\nConversation to analyze:\n{conversation_text}"
            response = self.model.generate_content(prompt)
            
            if response.text:
                # Clean response text
                response_text = response.text.strip()
                
                # Remove markdown formatting if present
                if response_text.startswith('```json'):
                    response_text = response_text[7:-3].strip()
                elif response_text.startswith('```'):
                    response_text = response_text[3:-3].strip()
                
                # Parse JSON
                data = json.loads(response_text)
                analysis = ConversationAnalysis(**data)
                
                # NEW: Post-analysis processing for collection value
                total_collection_value = 0
                if analysis.owned_watches:
                    logging.info(f"Found owned watches: {analysis.owned_watches}. Researching value...")
                    for watch in analysis.owned_watches:
                        value = search_watch_price(watch)
                        if value and value > 0:
                            logging.info(f"  - Estimated value of {watch}: ${value:,} USD")
                            total_collection_value += value
                    analysis.estimated_collection_value_usd = total_collection_value
                    if total_collection_value > 0:
                        analysis.notes += f"\nClient's estimated existing collection value: ${total_collection_value:,} USD."
                
                return analysis
            else:
                raise ValueError("Empty response from Gemini")
                
        except Exception as e:
            logging.error(f"Failed to analyze conversation: {e}")
            # Return basic analysis with conversation text
            return ConversationAnalysis(
                client_name="Unknown Client",
                client_phone="",
                urgency_level="medium",
                sentiment="neutral",
                purchase_intent="browsing",
                key_interactions=[conversation_text[:200]],
                notes=f"Analysis failed: {str(e)}"
            )
    
    def extract_client_data_for_update(self, analysis: ConversationAnalysis) -> Dict:
        """Convert analysis to client update format"""
        
        # Determine priority based on urgency and purchase intent
        urgency = analysis.urgency_level or 'medium'
        intent = analysis.purchase_intent or 'browsing'
        
        if urgency == 'urgent' and intent == 'confirmed':
            priority = 'vip'
        elif urgency == 'urgent' and intent == 'ready_to_buy':
            priority = 'critical'
        elif urgency == 'high' and intent in ['confirmed', 'ready_to_buy']:
            priority = 'critical' if intent == 'confirmed' else 'high'
        elif urgency == 'medium' and intent == 'ready_to_buy':
            priority = 'high'
        elif urgency in ['medium', 'low'] and intent == 'interested':
            priority = 'medium'
        elif urgency == 'low' and intent == 'browsing':
            priority = 'low'
        else:
            priority = 'medium'
        
        # Determine status
        status = 'prospect' if analysis.purchase_intent in ['browsing', 'interested'] else 'active'
        
        # Create interests string
        interests = []
        if analysis.collection_interests:
            interests.extend(analysis.collection_interests)
        if analysis.timepiece_references:
            interests.extend(analysis.timepiece_references)
        
        return {
            'name': analysis.client_name,
            'phone': analysis.client_phone,
            'email': analysis.client_email,
            'whatsapp_number': analysis.client_phone,
            'priority': priority,
            'status': status,
            'interests': ', '.join(interests) if interests else None,
            'notes': analysis.notes,
            'budget_range': analysis.budget_range,
            'follow_up_required': analysis.follow_up_required,
            'follow_up_date': analysis.follow_up_date,
            'last_interaction': datetime.now().isoformat(),
            'sentiment': analysis.sentiment,
            'purchase_intent': analysis.purchase_intent,
            'urgency_level': analysis.urgency_level
        }
    
    def find_matching_client(self, analysis: ConversationAnalysis, existing_clients: List[Dict]) -> Optional[Dict]:
        """Find matching client with improved, more flexible logic"""
        logging.info("Attempting to find matching client...")
        
        if not existing_clients:
            return None

        # Enhanced phone number matching
        if analysis.client_phone:
            # Normalize the phone number from the analysis (remove all non-digits)
            analysis_phone_digits = re.sub(r'\D', '', analysis.client_phone)
            if len(analysis_phone_digits) >= 9:  # Basic validation
                target_phone_suffix = analysis_phone_digits[-9:]
                for client in existing_clients:
                    for key in ['phone', 'whatsapp_number']:
                        if client.get(key):
                            client_phone = re.sub(r'\D', '', client[key])
                            if len(client_phone) >= 9 and client_phone.endswith(target_phone_suffix):
                                logging.info(f"MATCH FOUND: Phone suffix '{target_phone_suffix}' matched client '{client['name']}'.")
                                return client

        # Enhanced name matching (case-insensitive)
        if analysis.client_name and analysis.client_name != "Unknown Client":
            normalized_analysis_name = analysis.client_name.lower().strip()
            for client in existing_clients:
                if client.get('name'):
                    normalized_client_name = client['name'].lower().strip()
                    if normalized_client_name == normalized_analysis_name:
                        logging.info(f"MATCH FOUND: Name '{analysis.client_name}' matched.")
                        return client

        logging.info("No matching client found.")
        return None
    
    def generate_interaction_summary(self, analysis: ConversationAnalysis) -> str:
        """Generate a summary for interaction logging"""
        
        summary_parts = []
        
        if analysis.collection_interests:
            summary_parts.append(f"Interested in: {', '.join(analysis.collection_interests)}")
        
        if analysis.timepiece_references:
            summary_parts.append(f"Specific models: {', '.join(analysis.timepiece_references)}")
        
        if analysis.budget_range:
            summary_parts.append(f"Budget: {analysis.budget_range}")
        
        summary_parts.append(f"Intent: {analysis.purchase_intent}")
        summary_parts.append(f"Urgency: {analysis.urgency_level}")
        summary_parts.append(f"Sentiment: {analysis.sentiment}")
        
        if analysis.key_interactions:
            summary_parts.append(f"Key points: {'; '.join(analysis.key_interactions[:3])}")
        
        return " | ".join(summary_parts)

def test_analyzer():
    """Test the WhatsApp analyzer with sample conversation"""
    
    sample_conversation = """
    [8/19, 2:30 PM] Ahmed Al Mansouri: Hello, I'm interested in the new Overseas collection
    [8/19, 2:31 PM] CRC Sales: Good afternoon Mr. Al Mansouri! Thank you for your interest. Which Overseas model caught your attention?
    [8/19, 2:32 PM] Ahmed Al Mansouri: The blue dial chronograph, I believe it's the 5500V model
    [8/19, 2:33 PM] Ahmed Al Mansouri: My budget is around 150k AED, is this available?
    [8/19, 2:35 PM] CRC Sales: Perfect choice! The Overseas Chronograph 5500V/110A-B148 in blue is an excellent piece. Let me check availability for you
    [8/19, 2:36 PM] Ahmed Al Mansouri: Great, I need it for next week if possible. It's for my anniversary
    [8/19, 2:37 PM] Ahmed Al Mansouri: My email is ahmed.almansouri@email.com if you need to send details
    """
    
    analyzer = WhatsAppAnalyzer()
    analysis = analyzer.analyze_conversation(sample_conversation)
    
    print("=== WhatsApp Conversation Analysis ===")
    print(f"Client: {analysis.client_name}")
    print(f"Phone: {analysis.client_phone}")
    print(f"Email: {analysis.client_email}")
    print(f"Collections: {analysis.collection_interests}")
    print(f"References: {analysis.timepiece_references}")
    print(f"Budget: {analysis.budget_range}")
    print(f"Urgency: {analysis.urgency_level}")
    print(f"Sentiment: {analysis.sentiment}")
    print(f"Purchase Intent: {analysis.purchase_intent}")
    print(f"Follow-up Required: {analysis.follow_up_required}")
    print(f"Notes: {analysis.notes}")

if __name__ == "__main__":
    test_analyzer()