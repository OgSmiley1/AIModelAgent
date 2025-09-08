    import json
    import logging
    import os
    import re
    from datetime import datetime
    from typing import Dict, List, Optional

    import google.generativeai as genai
    from pydantic import BaseModel, Field  # Import Field for default_factory

    # Configure logging
    logging.basicConfig(level=logging.INFO)

    # Configure the Gemini API key
    try:
        api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("Neither GEMINI_API_KEY nor GOOGLE_API_KEY environment variable is set")
        genai.configure(api_key=api_key)  # ✅ Fixed: Correct usage of genai.configure
    except ValueError as e:
        logging.error(f"Gemini API key configuration error: {e}")
        raise  # Re-raise to stop execution if API key is missing


    class ConversationAnalysis(BaseModel):
        client_name: str = "Unknown Client"
        client_phone: str = ""
        client_email: Optional[str] = None
        collection_interests: List[str] = Field(default_factory=list)
        timepiece_references: List[str] = Field(default_factory=list)
        budget_range: Optional[str] = None
        urgency_level: str = "medium"
        sentiment: str = "neutral"
        purchase_intent: str = "browsing"
        key_interactions: List[str] = Field(default_factory=list)
        follow_up_required: bool = False
        follow_up_date: Optional[str] = None
        notes: str = ""

        class Config:
            extra = "ignore"


    class WhatsAppAnalyzer:
        def __init__(self):
            self.system_prompt = self._get_system_prompt()

            # Initialize the GenerativeModel
            self.model = genai.GenerativeModel(
                model_name='gemini-1.5-pro-latest',
                system_instruction=self.system_prompt
            )

            # Generate the JSON schema explicitly
            self.conversation_analysis_json_schema = ConversationAnalysis.model_json_schema()

        def _get_system_prompt(self) -> str:
            """Returns the system prompt for the AI model."""
            return """
            You are an expert WhatsApp conversation analyzer for a luxury watch sales team at Vacheron Constantin.
            Analyze the provided WhatsApp conversation and extract the following information in a structured JSON format that strictly adheres to the provided schema.

            1. CLIENT IDENTIFICATION:
            - Client name (extract from conversation context)
            - Phone number (if mentioned or from WhatsApp number)
            - Email address (if mentioned)

            2. PRODUCT INTERESTS:
            - Watch collections mentioned (Patrimony, Overseas, Traditionnelle, etc.)
            - Specific timepiece references (model numbers like 4500V/110A-B483)
            - Budget range or price discussions

            3. INTERACTION ANALYSIS:
            - Urgency level: how urgent is their request (low/medium/high/urgent)
            - Sentiment: overall tone (very_positive/positive/neutral/negative/very_negative)
            - Purchase intent: buying readiness (browsing/interested/ready_to_buy/confirmed)
            - Key interactions: important conversation points

            4. FOLLOW-UP REQUIREMENTS:
            - Whether follow-up is needed
            - Suggested follow-up date
            - Notes for sales team

            Extract phone numbers in international format (+971XXXXXXXXX) if possible.
            Be precise with timepiece references and collection names.
            Focus on luxury watch terminology and Vacheron Constantin specific information.
            """

        def analyze_conversation(self, conversation_text: str) -> ConversationAnalysis:
            """Analyze WhatsApp conversation and extract client information"""
            try:
                generation_config = genai.GenerationConfig(
                    response_mime_type="application/json",
                    response_schema=self.conversation_analysis_json_schema
                )

                response = self.model.generate_content(
                    f"Conversation to analyze:\n{conversation_text}",
                    generation_config=generation_config
                )

                if response.text:
                    data = json.loads(response.text)
                    return ConversationAnalysis(**data)
                else:
                    raise ValueError("Empty response from Gemini")

            except Exception as e:
                logging.error(f"Failed to analyze conversation: {e}")
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
            urgency = analysis.urgency_level or 'medium'
            intent = analysis.purchase_intent or 'browsing'

            priority_map = {
                ('urgent', 'confirmed'): 'vip',
                ('urgent', 'ready_to_buy'): 'critical',
                ('high', 'confirmed'): 'critical',
                ('high', 'ready_to_buy'): 'high',
                ('medium', 'ready_to_buy'): 'high'
            }
            priority = priority_map.get((urgency, intent), 'medium')
            status = 'prospect' if intent in ['browsing', 'interested'] else 'active'

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
            """Find matching client in existing database"""
            if not analysis.client_phone:
                return None
            clean_phone = re.sub(r'[^\d+]', '', analysis.client_phone)
            if not clean_phone:
                return None

            for client in existing_clients:
                for key in ['phone', 'whatsapp_number']:
                    if client.get(key):
                        client_phone = re.sub(r'[^\d+]', '', client[key])
                        if client_phone and clean_phone.endswith(client_phone[-9:]):
                            return client

                if client.get('name') and analysis.client_name:
                    if client['name'].lower().strip() == analysis.client_name.lower().strip():
                        return client
            return None

        def generate_interaction_summary(self, analysis: ConversationAnalysis) -> str:
            """Generate a summary for interaction logging"""
            parts = []
            if analysis.collection_interests:
                parts.append(f"Interested in: {', '.join(analysis.collection_interests)}")
            if analysis.timepiece_references:
                parts.append(f"Models: {', '.join(analysis.timepiece_references)}")
            if analysis.budget_range:
                parts.append(f"Budget: {analysis.budget_range}")
            parts.append(f"Intent: {analysis.purchase_intent}")
            return " | ".join(parts)


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

        # Test client data extraction
        client_data = analyzer.extract_client_data_for_update(analysis)
        print("\n=== Client Update Data ===")
        for key, value in client_data.items():
            print(f"{key}: {value}")


    if __name__ == "__main__":
        test_analyzer()