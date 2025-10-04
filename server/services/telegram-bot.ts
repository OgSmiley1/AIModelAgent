import TelegramBot from 'node-telegram-bot-api';
import OpenAI from 'openai';
import { storage } from '../storage';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

let bot: TelegramBot | null = null;
let openai: OpenAI | null = null;

export function initializeTelegramBot() {
  if (!TELEGRAM_BOT_TOKEN) {
    console.log('⚠️ TELEGRAM_BOT_TOKEN not set - Telegram bot disabled');
    return null;
  }

  if (!OPENAI_API_KEY) {
    console.log('⚠️ OPENAI_API_KEY not set - AI features disabled');
  } else {
    openai = new OpenAI({ apiKey: OPENAI_API_KEY });
  }

  bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });
  console.log('🤖 Telegram bot initialized successfully');

  // Command handlers
  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot?.sendMessage(
      chatId,
      `Welcome to Vacheron Constantin CRM Bot! 🕐\n\n` +
      `I can help you manage clients using natural language. Try:\n\n` +
      `📋 "Show me all clients with status Confirmed"\n` +
      `👤 "Tell me about Client X"\n` +
      `✏️ "Update Client Y's status to Sold"\n` +
      `📞 "Create a follow-up for Client Z tomorrow at 2pm"\n` +
      `📊 "How many clients are in Hesitant status?"\n\n` +
      `Just send me your request!`
    );
  });

  bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    bot?.sendMessage(
      chatId,
      `🤖 CRM Bot Commands:\n\n` +
      `📋 Query clients: "Show me all VIP clients"\n` +
      `👤 Get details: "Tell me about Client #108884411"\n` +
      `✏️ Update status: "Set Client X to Sold"\n` +
      `📞 Create follow-up: "Remind me to call Client Y tomorrow"\n` +
      `📊 Statistics: "How many clients need callback?"\n` +
      `🔍 Search: "Find clients interested in 4300V"\n\n` +
      `I understand natural language - just tell me what you need!`
    );
  });

  // Handle all text messages
  bot.on('message', async (msg) => {
    if (msg.text?.startsWith('/')) return; // Skip commands

    const chatId = msg.chat.id;
    const userMessage = msg.text || '';

    try {
      // Send typing indicator
      await bot?.sendChatAction(chatId, 'typing');

      // Process the request using AI
      const response = await processNaturalLanguageRequest(userMessage);

      // Send response
      await bot?.sendMessage(chatId, response, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      });
    } catch (error) {
      console.error('Telegram bot error:', error);
      await bot?.sendMessage(
        chatId,
        `❌ Sorry, I encountered an error processing your request. Please try again or use /help for examples.`
      );
    }
  });

  return bot;
}

async function processNaturalLanguageRequest(message: string): Promise<string> {
  if (!openai) {
    return '⚠️ AI processing is not available. Please set up OpenAI API key.';
  }

  try {
    // Get all clients for context
    const clients = await storage.getAllClients();
    
    // Use OpenAI to understand the intent and extract parameters
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant for a luxury watch CRM system. Analyze user requests and execute them.
          
Available actions:
1. QUERY_CLIENTS: Search/filter/list clients
2. GET_CLIENT: Get details about a specific client
3. UPDATE_CLIENT: Update client information (status, boutique associate, etc)
4. CREATE_FOLLOWUP: Schedule a follow-up
5. STATS: Provide statistics

Client statuses: requested_callback, changed_mind, confirmed, sold, hesitant, shared_with_boutique, vip, active, prospect, inactive

When updating status to "shared_with_boutique", a boutique associate name is required.

Total clients in system: ${clients.length}

Respond with a JSON object:
{
  "action": "QUERY_CLIENTS|GET_CLIENT|UPDATE_CLIENT|CREATE_FOLLOWUP|STATS",
  "params": {object with relevant parameters},
  "response": "user-friendly message to show"
}`
        },
        {
          role: 'user',
          content: message
        }
      ],
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
    
    // Execute the action
    return await executeAction(result.action, result.params, result.response, clients);

  } catch (error) {
    console.error('AI processing error:', error);
    throw error;
  }
}

async function executeAction(
  action: string,
  params: any,
  aiResponse: string,
  clients: any[]
): Promise<string> {
  try {
    switch (action) {
      case 'QUERY_CLIENTS': {
        let filtered = clients;
        
        if (params.status) {
          filtered = filtered.filter(c => c.status === params.status);
        }
        
        if (params.search) {
          const search = params.search.toLowerCase();
          filtered = filtered.filter(c => 
            c.name?.toLowerCase().includes(search) ||
            c.interests?.toLowerCase().includes(search) ||
            c.notes?.toLowerCase().includes(search)
          );
        }
        
        if (params.limit) {
          filtered = filtered.slice(0, params.limit);
        }
        
        if (filtered.length === 0) {
          return `No clients found matching your criteria.`;
        }
        
        let response = `📋 Found ${filtered.length} client(s):\n\n`;
        filtered.forEach((client, idx) => {
          response += `${idx + 1}. *${client.name}*\n`;
          response += `   Status: ${client.status?.replace(/_/g, ' ')}\n`;
          response += `   Priority: ${client.priority}\n`;
          if (client.phone) response += `   Phone: ${client.phone}\n`;
          if (client.leadScore) response += `   Score: ${client.leadScore}\n`;
          response += `\n`;
        });
        
        return response;
      }
      
      case 'GET_CLIENT': {
        const client = clients.find(c => 
          c.id === params.clientId ||
          c.name?.toLowerCase().includes(params.name?.toLowerCase()) ||
          c.phone === params.phone
        );
        
        if (!client) {
          return `❌ Client not found. Try searching with name, phone, or ID.`;
        }
        
        let response = `👤 *${client.name}*\n\n`;
        response += `📊 Status: ${client.status?.replace(/_/g, ' ')}\n`;
        response += `⭐ Priority: ${client.priority}\n`;
        if (client.phone) response += `📞 Phone: ${client.phone}\n`;
        if (client.email) response += `📧 Email: ${client.email}\n`;
        if (client.whatsappNumber) response += `💬 WhatsApp: ${client.whatsappNumber}\n`;
        if (client.location) response += `📍 Location: ${client.location}\n`;
        if (client.interests) response += `🕐 Interests: ${client.interests}\n`;
        if (client.leadScore) response += `📈 Lead Score: ${client.leadScore}/100\n`;
        if (client.boutiqueSalesAssociateName) response += `🏪 Boutique Associate: ${client.boutiqueSalesAssociateName}\n`;
        if (client.statusSince) {
          const daysSince = Math.floor((Date.now() - new Date(client.statusSince).getTime()) / (1000 * 60 * 60 * 24));
          response += `⏱️ In current status: ${daysSince} days\n`;
        }
        if (client.notes) response += `\n📝 Notes: ${client.notes}\n`;
        
        return response;
      }
      
      case 'UPDATE_CLIENT': {
        const client = clients.find(c => 
          c.id === params.clientId ||
          c.name?.toLowerCase().includes(params.name?.toLowerCase())
        );
        
        if (!client) {
          return `❌ Client not found. Please provide the client name or ID.`;
        }
        
        const updates: any = {};
        if (params.status) {
          updates.status = params.status;
          updates.statusSince = new Date();
        }
        if (params.boutiqueSalesAssociateName) {
          updates.boutiqueSalesAssociateName = params.boutiqueSalesAssociateName;
        }
        if (params.priority) updates.priority = params.priority;
        
        // Validate
        if (updates.status === 'shared_with_boutique' && !updates.boutiqueSalesAssociateName && !client.boutiqueSalesAssociateName) {
          return `❌ When setting status to "Shared with Boutique", you must provide a boutique associate name.`;
        }
        
        await storage.updateClient(client.id, updates);
        
        return `✅ ${client.name} updated successfully!\n\n${aiResponse}`;
      }
      
      case 'CREATE_FOLLOWUP': {
        const client = clients.find(c => 
          c.id === params.clientId ||
          c.name?.toLowerCase().includes(params.name?.toLowerCase())
        );
        
        if (!client) {
          return `❌ Client not found. Please specify which client this follow-up is for.`;
        }
        
        const followUp = await storage.createFollowUp({
          clientId: client.id,
          type: params.type || 'call',
          title: params.title || `Follow-up with ${client.name}`,
          description: params.description,
          scheduledFor: params.scheduledFor ? new Date(params.scheduledFor) : new Date(Date.now() + 86400000), // tomorrow
          priority: params.priority || 'medium'
        });
        
        return `✅ Follow-up created for ${client.name}!\n📅 Scheduled: ${new Date(followUp.scheduledFor).toLocaleString()}\n\n${aiResponse}`;
      }
      
      case 'STATS': {
        const stats = {
          total: clients.length,
          requested_callback: clients.filter(c => c.status === 'requested_callback').length,
          confirmed: clients.filter(c => c.status === 'confirmed').length,
          sold: clients.filter(c => c.status === 'sold').length,
          hesitant: clients.filter(c => c.status === 'hesitant').length,
          shared_with_boutique: clients.filter(c => c.status === 'shared_with_boutique').length,
          changed_mind: clients.filter(c => c.status === 'changed_mind').length,
          vip: clients.filter(c => c.status === 'vip').length,
        };
        
        let response = `📊 *CRM Statistics*\n\n`;
        response += `Total Clients: ${stats.total}\n\n`;
        response += `📞 Requested Callback: ${stats.requested_callback}\n`;
        response += `✅ Confirmed: ${stats.confirmed}\n`;
        response += `💰 Sold: ${stats.sold}\n`;
        response += `🤔 Hesitant: ${stats.hesitant}\n`;
        response += `🏪 Shared with Boutique: ${stats.shared_with_boutique}\n`;
        response += `❌ Changed Mind: ${stats.changed_mind}\n`;
        response += `⭐ VIP: ${stats.vip}\n`;
        
        return response;
      }
      
      default:
        return aiResponse || 'I understood your request, but I\'m not sure how to execute it. Try /help for examples.';
    }
  } catch (error) {
    console.error('Action execution error:', error);
    throw error;
  }
}

export function getTelegramBot() {
  return bot;
}
