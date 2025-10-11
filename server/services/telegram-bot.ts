import TelegramBot from 'node-telegram-bot-api';
import { GoogleGenAI } from '@google/genai';
import { storage } from '../storage';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || '';

let bot: TelegramBot | null = null;
let genai: InstanceType<typeof GoogleGenAI> | null = null;

// Track last mentioned client per chat for pronoun resolution
const chatContext = new Map<number, { lastClientId?: string, lastClientName?: string }>();

export function initializeTelegramBot() {
  if (!TELEGRAM_BOT_TOKEN) {
    console.log('⚠️ TELEGRAM_BOT_TOKEN not set - Telegram bot disabled');
    return null;
  }

  if (!GOOGLE_API_KEY) {
    console.log('⚠️ GOOGLE_API_KEY not set - AI features disabled');
  } else {
    genai = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });
    console.log('🤖 Google Gemini AI initialized successfully');
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
      `*Direct Commands (No AI needed):*\n` +
      `/stats - View CRM statistics\n` +
      `/list_confirmed - List confirmed clients\n` +
      `/list_sold - List sold clients\n` +
      `/list_hesitant - List hesitant clients\n` +
      `/list_callback - List clients needing callback\n\n` +
` *Natural Language (Powered by Google Gemini):*\n` +
      `📋 "Show me all VIP clients"\n` +
      `👤 "Tell me about Client #108884411"\n` +
      `🔍 "Find client 108884411"\n` +
      `✏️ "Update his status to Sold"\n` +
      `📞 "Remind me to call Client Y tomorrow"\n` +
      `❌ "Close the request for client Z"`
    );
  });

  // Simple command handlers that don't need AI
  bot.onText(/\/stats/, async (msg) => {
    const chatId = msg.chat.id;
    try {
      const clients = await storage.getAllClients();
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
      response += `⭐ VIP: ${stats.vip}`;
      
      await bot?.sendMessage(chatId, response, { parse_mode: 'Markdown' });
    } catch (error) {
      await bot?.sendMessage(chatId, '❌ Error fetching statistics');
    }
  });

  bot.onText(/\/list_confirmed/, async (msg) => {
    const chatId = msg.chat.id;
    try {
      const clients = await storage.getAllClients();
      const confirmed = clients.filter(c => c.status === 'confirmed').slice(0, 20);
      
      if (confirmed.length === 0) {
        await bot?.sendMessage(chatId, 'No confirmed clients found.');
        return;
      }
      
      let response = `✅ *Confirmed Clients* (${confirmed.length}):\n\n`;
      confirmed.forEach((client, idx) => {
        response += `${idx + 1}. ${client.name}\n`;
        if (client.phone) response += `   📞 ${client.phone}\n`;
        response += `   Priority: ${client.priority}\n\n`;
      });
      
      await bot?.sendMessage(chatId, response, { parse_mode: 'Markdown' });
    } catch (error) {
      await bot?.sendMessage(chatId, '❌ Error fetching clients');
    }
  });

  bot.onText(/\/list_sold/, async (msg) => {
    const chatId = msg.chat.id;
    try {
      const clients = await storage.getAllClients();
      const sold = clients.filter(c => c.status === 'sold').slice(0, 20);
      
      if (sold.length === 0) {
        await bot?.sendMessage(chatId, 'No sold clients found.');
        return;
      }
      
      let response = `💰 *Sold Clients* (${sold.length}):\n\n`;
      sold.forEach((client, idx) => {
        response += `${idx + 1}. ${client.name}\n`;
        if (client.phone) response += `   📞 ${client.phone}\n`;
        response += `\n`;
      });
      
      await bot?.sendMessage(chatId, response, { parse_mode: 'Markdown' });
    } catch (error) {
      await bot?.sendMessage(chatId, '❌ Error fetching clients');
    }
  });

  bot.onText(/\/list_hesitant/, async (msg) => {
    const chatId = msg.chat.id;
    try {
      const clients = await storage.getAllClients();
      const hesitant = clients.filter(c => c.status === 'hesitant').slice(0, 20);
      
      if (hesitant.length === 0) {
        await bot?.sendMessage(chatId, 'No hesitant clients found.');
        return;
      }
      
      let response = `🤔 *Hesitant Clients* (${hesitant.length}):\n\n`;
      hesitant.forEach((client, idx) => {
        response += `${idx + 1}. ${client.name}\n`;
        if (client.phone) response += `   📞 ${client.phone}\n`;
        response += `   Priority: ${client.priority}\n\n`;
      });
      
      await bot?.sendMessage(chatId, response, { parse_mode: 'Markdown' });
    } catch (error) {
      await bot?.sendMessage(chatId, '❌ Error fetching clients');
    }
  });

  bot.onText(/\/list_callback/, async (msg) => {
    const chatId = msg.chat.id;
    try {
      const clients = await storage.getAllClients();
      const callback = clients.filter(c => c.status === 'requested_callback').slice(0, 20);
      
      if (callback.length === 0) {
        await bot?.sendMessage(chatId, 'No clients requesting callback.');
        return;
      }
      
      let response = `📞 *Clients Needing Callback* (${callback.length}):\n\n`;
      callback.forEach((client, idx) => {
        response += `${idx + 1}. ${client.name}\n`;
        if (client.phone) response += `   📞 ${client.phone}\n`;
        response += `   Priority: ${client.priority}\n\n`;
      });
      
      await bot?.sendMessage(chatId, response, { parse_mode: 'Markdown' });
    } catch (error) {
      await bot?.sendMessage(chatId, '❌ Error fetching clients');
    }
  });

  // Handle all text messages
  bot.on('message', async (msg) => {
    console.log('📨 [Telegram Bot] Message received:', {
      chatId: msg.chat.id,
      text: msg.text,
      from: msg.from?.username || msg.from?.first_name
    });
    
    if (msg.text?.startsWith('/')) {
      console.log('⚡ [Telegram Bot] Skipping - this is a command');
      return; // Skip commands
    }

    const chatId = msg.chat.id;
    const userMessage = msg.text || '';

    try {
      console.log('🤖 [Telegram Bot] Processing natural language message:', userMessage);
      
      // Send typing indicator
      await bot?.sendChatAction(chatId, 'typing');

      // Process the request using AI with chat context
      const response = await processNaturalLanguageRequest(userMessage, chatId);

      // Send response (safely handles long messages)
      await safeSendMessage(chatId, response, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      });
    } catch (error) {
      console.error('❌ [Telegram Bot] Top-level error:', error);
      console.error('❌ [Telegram Bot] Error stack:', (error as any).stack);
      await bot?.sendMessage(
        chatId,
        `❌ Sorry, I encountered an error processing your request. Please try again or use /help for examples.`
      );
    }
  });

  return bot;
}

// Helper function to safely send messages within Telegram's 4096 character limit
async function safeSendMessage(chatId: number, text: string, options?: any): Promise<void> {
  const MAX_LENGTH = 4096;
  
  if (text.length <= MAX_LENGTH) {
    await bot?.sendMessage(chatId, text, options);
    return;
  }
  
  // Split message into chunks
  const chunks: string[] = [];
  let currentChunk = '';
  const lines = text.split('\n');
  
  for (const line of lines) {
    if ((currentChunk + line + '\n').length > MAX_LENGTH) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      // If a single line is too long, truncate it
      if (line.length > MAX_LENGTH) {
        chunks.push(line.substring(0, MAX_LENGTH - 20) + '...(truncated)');
      } else {
        currentChunk = line + '\n';
      }
    } else {
      currentChunk += line + '\n';
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  // Send chunks with small delay
  for (let i = 0; i < chunks.length; i++) {
    await bot?.sendMessage(chatId, chunks[i] + (i < chunks.length - 1 ? '\n\n_(continued...)_' : ''), options);
    if (i < chunks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
}

async function processNaturalLanguageRequest(message: string, chatId: number): Promise<string> {
  if (!genai) {
    return '⚠️ AI processing is not available. Please set up Google API key.';
  }

  try {
    // Get all clients for context
    const clients = await storage.getAllClients();
    
    // Get or initialize chat context
    const context = chatContext.get(chatId) || {};
    
    // Build a sample of client data to help AI understand the structure
    const sampleClients = clients.slice(0, 3).map(c => ({
      name: c.name,
      phone: c.phone,
      status: c.status,
      id: c.id
    }));
    
    // Build context message for AI
    let contextInfo = '';
    if (context.lastClientId && context.lastClientName) {
      contextInfo = `\n\nCONVERSATION CONTEXT:
Last mentioned client: ${context.lastClientName} (ID: ${context.lastClientId})
When user says "his", "her", "them", "the client", "this client", or "the request", they mean: ${context.lastClientName}`;
    }
    
    // Use Gemini to understand the intent and extract parameters
    const systemPrompt = `You are an AI assistant for Vacheron Constantin luxury watch CRM. Analyze user requests and execute them.

UNDERSTANDING REQUESTS:
- "Find client 108884411" or "Tell me about 108884411" → Search by name/phone/ID
- "Update his/her status to X" → Update the LAST MENTIONED client's status
- "Close the request" or "Close his/her request" → Update LAST MENTIONED client to changed_mind
- Pronouns (his/her/them/the client) ALWAYS refer to the last mentioned client

AVAILABLE ACTIONS:
1. QUERY_CLIENTS: Search/filter/list clients by status, name, or criteria
2. GET_CLIENT: Get details about a specific client (by name, phone, or number in their name)
3. UPDATE_CLIENT: Update client status, priority, or boutique associate
4. CREATE_FOLLOWUP: Schedule a follow-up task
5. STATS: Provide CRM statistics

CLIENT STATUSES: 
- requested_callback (needs callback)
- confirmed (confirmed interest)
- sold (purchase complete)
- hesitant (unsure/needs nurturing)
- shared_with_boutique (passed to boutique team)
- changed_mind (not interested/closed)

SEARCH LOGIC:
- Client names often contain numbers like "Client 108884411"
- Search by: exact name match, partial name, phone number, or ID
- When user says "client 108884411", search for clients where name contains "108884411"

Total clients: ${clients.length}
Sample data: ${JSON.stringify(sampleClients, null, 2)}${contextInfo}

Respond ONLY with valid JSON:
{
  "action": "QUERY_CLIENTS|GET_CLIENT|UPDATE_CLIENT|CREATE_FOLLOWUP|STATS",
  "params": {
    "clientId": "ID from context if using pronouns",
    "name": "partial or full client name",
    "status": "...",
    "search": "search term",
    "boutiqueSalesAssociateName": "...",
    "priority": "...",
    "type": "call|email|meeting",
    "scheduledFor": "ISO date string"
  },
  "response": "user-friendly message"
}`;

    console.log('🔍 [Telegram Bot] Processing message:', message);
    console.log('🔍 [Telegram Bot] Calling Gemini API...');
    
    const prompt = `${systemPrompt}\n\nUser request: ${message}`;
    
    const result = await genai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3
      }
    });
    
    console.log('✅ [Telegram Bot] Gemini API response received');
    console.log('📄 [Telegram Bot] Full response keys:', Object.keys(result));
    console.log('📄 [Telegram Bot] result.text:', result.text);
    console.log('📄 [Telegram Bot] result.candidates:', result.candidates ? 'exists' : 'undefined');
    
    // Safely access the response text
    let responseText = '';
    
    // Method 1: Direct text property (recommended by SDK)
    if (result.text) {
      responseText = result.text;
      console.log('✅ [Telegram Bot] Got text from result.text');
    }
    // Method 2: From candidates array
    else if (result.candidates && result.candidates.length > 0) {
      const firstCandidate = result.candidates[0];
      if (firstCandidate.content && firstCandidate.content.parts && firstCandidate.content.parts.length > 0) {
        responseText = firstCandidate.content.parts[0].text || '';
        console.log('✅ [Telegram Bot] Got text from result.candidates');
      }
    }
    
    console.log('📝 [Telegram Bot] Response text:', responseText);
    
    if (!responseText) {
      console.error('❌ [Telegram Bot] No text in response.');
      console.error('❌ [Telegram Bot] Full result object:', JSON.stringify(result, null, 2));
      throw new Error('Empty response from Gemini API');
    }
    
    const parsed = JSON.parse(responseText);
    console.log('🎯 [Telegram Bot] Parsed JSON:', JSON.stringify(parsed, null, 2));
    
    // Execute the action and update context
    const response = await executeAction(parsed.action, parsed.params, parsed.response, clients, chatId);
    
    return response;

  } catch (error) {
    console.error('❌ [Telegram Bot] AI processing error:', error);
    console.error('❌ [Telegram Bot] Error details:', {
      message: (error as any).message,
      stack: (error as any).stack,
      response: (error as any).response?.data
    });
    
    // Handle API errors
    if ((error as any).status === 429 || (error as any).code === 'rate_limit_exceeded') {
      return '⚠️ *API Rate Limit*\n\nPlease wait a moment and try again.';
    }
    
    throw error;
  }
}

async function executeAction(
  action: string,
  params: any,
  aiResponse: string,
  clients: any[],
  chatId: number
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
        
        // Always limit to prevent message too long errors (default: 10, max: 20)
        const limit = Math.min(params.limit || 10, 20);
        const totalFound = filtered.length;
        filtered = filtered.slice(0, limit);
        
        if (filtered.length === 0) {
          return `No clients found matching your criteria.`;
        }
        
        let response = `📋 Found ${totalFound} client(s)`;
        if (totalFound > limit) {
          response += ` (showing first ${limit})`;
        }
        response += `:\n\n`;
        
        filtered.forEach((client, idx) => {
          response += `${idx + 1}. *${client.name}*\n`;
          response += `   Status: ${client.status?.replace(/_/g, ' ')}\n`;
          response += `   Priority: ${client.priority}\n`;
          if (client.phone) response += `   Phone: ${client.phone}\n`;
          if (client.leadScore) response += `   Score: ${client.leadScore}\n`;
          response += `\n`;
        });
        
        // Ensure message is within Telegram's 4096 character limit
        if (response.length > 4000) {
          response = response.substring(0, 3900) + '\n\n...(truncated)';
        }
        
        return response;
      }
      
      case 'GET_CLIENT': {
        const client = clients.find(c => 
          c.id === params.clientId ||
          c.name?.toLowerCase().includes(params.name?.toLowerCase()) ||
          c.phone === params.phone ||
          (params.search && (
            c.name?.toLowerCase().includes(params.search.toLowerCase()) ||
            c.phone?.includes(params.search)
          ))
        );
        
        if (!client) {
          return `❌ Client not found. Try searching with name, phone, or number.`;
        }
        
        // Update chat context with this client
        chatContext.set(chatId, {
          lastClientId: client.id,
          lastClientName: client.name
        });
        
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
          c.name?.toLowerCase().includes(params.name?.toLowerCase()) ||
          (params.search && c.name?.toLowerCase().includes(params.search.toLowerCase()))
        );
        
        if (!client) {
          return `❌ Client not found. Please provide the client name, number, or ID.`;
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
        
        let statusText = updates.status ? updates.status.replace(/_/g, ' ') : '';
        return `✅ ${client.name} updated successfully!\n\n` +
               `New status: ${statusText}\n` +
               (aiResponse ? `\n${aiResponse}` : '');
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

// Telegram Reminder System
let reminderInterval: NodeJS.Timeout | null = null;

export function startReminderSystem(adminChatId: number) {
  if (reminderInterval) {
    console.log('⏰ Reminder system already running');
    return;
  }

  console.log('⏰ Starting Telegram reminder system...');
  
  // Check every 15 minutes
  reminderInterval = setInterval(async () => {
    try {
      const appointments = await storage.getAllAppointments();
      const now = new Date();
      const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      for (const appointment of appointments) {
        const appointmentDate = new Date(appointment.appointmentDate);
        
        // Send reminder 24 hours before
        if (appointmentDate > now && appointmentDate <= in24Hours && !appointment.reminderSent) {
          const client = await storage.getClient(appointment.clientId);
          if (client) {
            const message = `🔔 *Appointment Reminder*\n\n` +
              `📅 Client: ${client.name}\n` +
              `⏰ Time: ${appointmentDate.toLocaleString()}\n` +
              `📝 Note: ${appointment.notes || 'No notes'}\n\n` +
              `_Reminder sent 24 hours before appointment_`;
            
            await bot?.sendMessage(adminChatId, message, { parse_mode: 'Markdown' });
            
            // Mark as sent
            await storage.updateAppointment(appointment.id, { reminderSent: true });
            console.log(`✅ Sent reminder for ${client.name}'s appointment`);
          }
        }
      }
    } catch (error) {
      console.error('❌ Reminder check error:', error);
    }
  }, 15 * 60 * 1000); // Check every 15 minutes
  
  console.log('✅ Telegram reminder system started');
}

export function stopReminderSystem() {
  if (reminderInterval) {
    clearInterval(reminderInterval);
    reminderInterval = null;
    console.log('⏸️ Telegram reminder system stopped');
  }
}
