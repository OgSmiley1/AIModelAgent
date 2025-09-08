interface WhatsAppMessage {
  id: string;
  from: string;
  body: string;
  timestamp: number;
  type: string;
}

interface WhatsAppWebhookData {
  entry: Array<{
    changes: Array<{
      value: {
        messages?: WhatsAppMessage[];
        contacts?: Array<{
          profile: { name: string };
          wa_id: string;
        }>;
      };
    }>;
  }>;
}

export class WhatsAppService {
  private accessToken: string;
  private phoneNumberId: string;
  private webhookVerifyToken: string;

  constructor() {
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN || "";
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
    this.webhookVerifyToken = process.env.WHATSAPP_WEBHOOK_TOKEN || "CRC_WARROOM_WEBHOOK_2025_SECURE_TOKEN";
  }

  async verifyWebhook(mode: string, token: string, challenge: string): Promise<string | null> {
    if (mode === "subscribe" && token === this.webhookVerifyToken) {
      return challenge;
    }
    return null;
  }

  async sendMessage(to: string, message: string): Promise<boolean> {
    if (!this.accessToken || !this.phoneNumberId) {
      console.error("WhatsApp credentials not configured");
      return false;
    }

    try {
      const response = await fetch(`https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: to,
          text: { body: message }
        })
      });

      if (!response.ok) {
        console.error("Failed to send WhatsApp message:", await response.text());
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error sending WhatsApp message:", error);
      return false;
    }
  }

  parseWebhookData(data: WhatsAppWebhookData): Array<{
    messageId: string;
    from: string;
    fromName: string;
    body: string;
    timestamp: Date;
    type: string;
  }> {
    const messages: Array<{
      messageId: string;
      from: string;
      fromName: string;
      body: string;
      timestamp: Date;
      type: string;
    }> = [];

    if (!data.entry) return messages;

    for (const entry of data.entry) {
      for (const change of entry.changes) {
        const { messages: incomingMessages, contacts } = change.value;
        
        if (incomingMessages && contacts) {
          const contactMap = new Map(contacts.map(c => [c.wa_id, c.profile.name]));
          
          for (const msg of incomingMessages) {
            messages.push({
              messageId: msg.id,
              from: msg.from,
              fromName: contactMap.get(msg.from) || "Unknown",
              body: msg.body,
              timestamp: new Date(msg.timestamp * 1000),
              type: msg.type
            });
          }
        }
      }
    }

    return messages;
  }

  isConfigured(): boolean {
    return !!(this.accessToken && this.phoneNumberId);
  }

  getConnectionStatus(): {
    connected: boolean;
    accessToken: boolean;
    phoneNumberId: boolean;
  } {
    return {
      connected: this.isConfigured(),
      accessToken: !!this.accessToken,
      phoneNumberId: !!this.phoneNumberId,
    };
  }
}

export const whatsAppService = new WhatsAppService();
