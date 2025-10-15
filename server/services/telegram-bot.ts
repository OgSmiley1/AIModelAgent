import TelegramBot from 'node-telegram-bot-api';
import { GoogleGenAI } from '@google/genai';
import { storage } from '../storage';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || '';
const AMBASSADOR_PASSWORD = '12001';
const VALID_AMBASSADORS = ['Maaz', 'Riham', 'Asma'];

type Ambassador = 'Maaz' | 'Riham' | 'Asma';

let bot: TelegramBot | null = null;
let genai: InstanceType<typeof GoogleGenAI> | null = null;

// Track last mentioned client per chat for pronoun resolution
const chatContext = new Map<number, { lastClientId?: string, lastClientName?: string }>();

// Session management for authentication flow
interface ChatSession {
  step?: 'askName' | 'askPassword';
  candidateAmbassador?: string;
}
const chatSessions = new Map<number, ChatSession>();

// Helper functions for ambassador authentication
async function getChatAmbassador(chatId: number): Promise<Ambassador | null> {
  const ambassador = await storage.getTelegramAmbassador(chatId);
  return ambassador?.ambassador as Ambassador || null;
}

async function setChatAmbassador(chatId: number, ambassador: Ambassador): Promise<void> {
  await storage.setTelegramAmbassador(chatId, ambassador);
}

// Middleware to require authentication
async function requireAuth(chatId: number): Promise<Ambassador | false> {
  const ambassador = await getChatAmbassador(chatId);
  if (!ambassador) {
    await bot?.sendMessage(
      chatId,
      '🔒 Please authenticate first.\n\nWho are you? (Maaz / Riham / Asma)'
    );
    chatSessions.set(chatId, { step: 'askName' });
    return false;
  }
  return ambassador;
}

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
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const ambassador = await getChatAmbassador(chatId);
    
    if (ambassador) {
      await bot?.sendMessage(
        chatId,
        `Welcome back, ${ambassador}! ✨\n\n` +
        `You're already verified. Use /help to see commands.\n` +
        `Use /switch to change identity.`
      );
    } else {
      await bot?.sendMessage(
        chatId,
        `Welcome to Vacheron Constantin CRM Bot! 🕐\n\n` +
        `Please identify yourself.\n\n` +
        `Who are you? (Maaz / Riham / Asma)`
      );
      chatSessions.set(chatId, { step: 'askName' });
    }
  });

  bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    bot?.sendMessage(
      chatId,
      `🤖 *Vacheron Constantin CRM Bot Commands:*\n\n` +
      `*Authentication:*\n` +
      `/switch - Change your identity (Maaz/Riham/Asma)\n\n` +
      `*Client Management:*\n` +
      `/stats - View YOUR client statistics\n` +
      `/list_vip - List YOUR VIP clients\n` +
      `/list_confirmed - List YOUR confirmed clients\n` +
      `/list_sold - List YOUR sold clients\n` +
      `/list_hesitant - List YOUR hesitant clients\n` +
      `/list_callback - List YOUR clients needing callback\n\n` +
      `*Watch Catalog:*\n` +
      `/watch <reference> - Get watch details\n` +
      `/price <reference> - Get watch price & availability\n` +
      `/available - List all available watches\n` +
      `Examples: /watch 4500V, /price Overseas\n\n` +
      `*FAQ/Knowledge Base:*\n` +
      `/faq <query> - Search FAQ database\n` +
      `Example: /faq repair turnaround\n\n` +
      `*Power Commands:*\n` +
      `/status - Check system status\n` +
      `/due - See YOUR follow-ups today\n` +
      `/lead <clientId> - Get YOUR client details\n` +
      `Example: /lead 12345\n\n` +
      `*Natural Language (AI-Powered):*\n` +
      `📋 "Show me all my VIP clients"\n` +
      `👤 "Tell me about my Client #108884411"\n` +
      `🔍 "Find my client 108884411"\n` +
      `✏️ "Update his status to Sold"\n` +
      `📞 "Remind me to call Client Y tomorrow"\n` +
      `❌ "Close the request for client Z"\n` +
      `🕐 "Tell me about watch 4500V/110A-B128"\n` +
      `💰 "What's the price of Overseas?"\n` +
      `❓ "Client asked about repairs"\n\n` +
      `Just send me your request!`,
      { parse_mode: 'Markdown' }
    );
  });

  // Switch command - change ambassador identity
  bot.onText(/\/switch/, async (msg) => {
    const chatId = msg.chat.id;
    await bot?.sendMessage(chatId, '🔄 Okay, who are you now?\n\n(Maaz / Riham / Asma)');
    chatSessions.set(chatId, { step: 'askName' });
  });

  // Simple command handlers that don't need AI
  bot.onText(/\/stats/, async (msg) => {
    const chatId = msg.chat.id;
    const ambassador = await requireAuth(chatId);
    if (!ambassador) return;
    
    try {
      const clients = await storage.getClientsByOwner(ambassador);
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
      
      let response = `📊 *${ambassador}'s Client Statistics*\n\n`;
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
      const ambassador = await requireAuth(chatId);
      if (!ambassador) return;
      
      const clients = await storage.getClientsByOwner(ambassador);
      const confirmed = clients.filter(c => c.status === 'confirmed').slice(0, 20);
      
      if (confirmed.length === 0) {
        await bot?.sendMessage(chatId, `No confirmed clients found for ${ambassador}.`);
        return;
      }
      
      let response = `✅ *${ambassador}'s Confirmed Clients* (${confirmed.length}):\n\n`;
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
      const ambassador = await requireAuth(chatId);
      if (!ambassador) return;
      
      const clients = await storage.getClientsByOwner(ambassador);
      const sold = clients.filter(c => c.status === 'sold').slice(0, 20);
      
      if (sold.length === 0) {
        await bot?.sendMessage(chatId, `No sold clients found for ${ambassador}.`);
        return;
      }
      
      let response = `💰 *${ambassador}'s Sold Clients* (${sold.length}):\n\n`;
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
      const ambassador = await requireAuth(chatId);
      if (!ambassador) return;
      
      const clients = await storage.getClientsByOwner(ambassador);
      const hesitant = clients.filter(c => c.status === 'hesitant').slice(0, 20);
      
      if (hesitant.length === 0) {
        await bot?.sendMessage(chatId, `No hesitant clients found for ${ambassador}.`);
        return;
      }
      
      let response = `🤔 *${ambassador}'s Hesitant Clients* (${hesitant.length}):\n\n`;
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
      const ambassador = await requireAuth(chatId);
      if (!ambassador) return;
      
      const clients = await storage.getClientsByOwner(ambassador);
      const callback = clients.filter(c => c.status === 'requested_callback').slice(0, 20);
      
      if (callback.length === 0) {
        await bot?.sendMessage(chatId, `No clients requesting callback for ${ambassador}.`);
        return;
      }
      
      let response = `📞 *${ambassador}'s Clients Needing Callback* (${callback.length}):\n\n`;
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

  bot.onText(/\/list_vip/, async (msg) => {
    const chatId = msg.chat.id;
    try {
      const ambassador = await requireAuth(chatId);
      if (!ambassador) return;
      
      const clients = await storage.getClientsByOwner(ambassador);
      const vips = clients.filter(c => c.clientSegment === 'VIP' || c.status === 'vip' || c.priority === 'vip').slice(0, 20);
      
      if (vips.length === 0) {
        await bot?.sendMessage(chatId, `No VIP clients found for ${ambassador}.`);
        return;
      }
      
      let response = `⭐ *${ambassador}'s VIP Clients* (${vips.length}):\n\n`;
      vips.forEach((client, idx) => {
        response += `${idx + 1}. ${client.name}\n`;
        if (client.phone) response += `   📞 ${client.phone}\n`;
        response += `   Status: ${client.status}\n`;
        if (client.salesAssociate) response += `   SA: ${client.salesAssociate}\n`;
        response += `\n`;
      });
      
      await bot?.sendMessage(chatId, response, { parse_mode: 'Markdown' });
    } catch (error) {
      await bot?.sendMessage(chatId, '❌ Error fetching VIP clients');
    }
  });

  bot.onText(/\/watch (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const reference = match?.[1];
    
    if (!reference) {
      await bot?.sendMessage(chatId, 'Please provide a watch reference. Example: /watch 4500V/110A-B128');
      return;
    }
    
    try {
      const watch = await storage.getWatchByReference(reference);
      
      if (!watch) {
        await bot?.sendMessage(chatId, `❌ Watch ${reference} not found in catalog.`);
        return;
      }
      
      await storage.incrementWatchPopularity(watch.id);
      
      let response = `🕐 *${watch.model || watch.reference}*\n\n`;
      response += `Reference: ${watch.reference}\n`;
      if (watch.collectionName) response += `Collection: ${watch.collectionName}\n`;
      if (watch.caseSize) response += `📏 Size: ${watch.caseSize}\n`;
      if (watch.caseMaterial) response += `⚙️ Material: ${watch.caseMaterial}\n`;
      if (watch.dialColor) response += `🎨 Dial: ${watch.dialColor}\n`;
      if (watch.movementType) response += `⚡ Movement: ${watch.movementType}\n`;
      if (watch.caliber) response += `🔧 Caliber: ${watch.caliber}\n`;
      if (watch.powerReserve) response += `🔋 Power Reserve: ${watch.powerReserve}\n`;
      if (watch.complications && watch.complications.length > 0) {
        response += `✨ Complications: ${watch.complications.join(', ')}\n`;
      }
      if (watch.waterResistance) response += `💧 Water Resistance: ${watch.waterResistance}\n`;
      if (watch.price) response += `💰 Price: ${watch.currency} ${watch.price.toLocaleString()}\n`;
      if (watch.available !== undefined) response += `📦 ${watch.available ? '✅ Available' : '❌ Out of Stock'}\n`;
      if (watch.description) response += `\n${watch.description}`;
      
      await bot?.sendMessage(chatId, response, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error fetching watch:', error);
      await bot?.sendMessage(chatId, '❌ Error fetching watch information');
    }
  });

  bot.onText(/\/faq (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const query = match?.[1];
    
    if (!query) {
      await bot?.sendMessage(chatId, 'Please provide a search term. Example: /faq repair');
      return;
    }
    
    try {
      const faqs = await storage.searchFaqs(query);
      
      if (faqs.length === 0) {
        await bot?.sendMessage(chatId, `No FAQs found for "${query}". Try different keywords.`);
        return;
      }
      
      const topFaq = faqs[0];
      await storage.incrementFaqUsage(topFaq.id);
      
      let response = `❓ *${topFaq.question}*\n\n`;
      response += `📂 Category: ${topFaq.category}\n\n`;
      response += `💬 Answer:\n${topFaq.answer}`;
      
      if (faqs.length > 1) {
        response += `\n\n_Found ${faqs.length - 1} more related FAQ(s)_`;
      }
      
      await safeSendMessage(chatId, response, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error searching FAQs:', error);
      await bot?.sendMessage(chatId, '❌ Error searching FAQ database');
    }
  });

  bot.onText(/\/price (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const query = match?.[1];
    
    if (!query) {
      await bot?.sendMessage(chatId, 'Please provide a watch reference or name. Example: /price 4500V');
      return;
    }
    
    try {
      const watches = await storage.searchWatches(query);
      
      if (watches.length === 0) {
        await bot?.sendMessage(chatId, `❌ No watches found for "${query}"`);
        return;
      }
      
      const watch = watches[0];
      await storage.incrementWatchPopularity(watch.id);
      
      let response = `🕐 *${watch.model || watch.reference}*\n\n`;
      response += `Reference: ${watch.reference}\n`;
      if (watch.collectionName) response += `Collection: ${watch.collectionName}\n`;
      if (watch.price) response += `💰 Price: ${watch.currency} ${watch.price.toLocaleString()}\n`;
      response += `📦 ${watch.available ? '✅ Available' : '❌ Out of Stock'}\n`;
      
      await bot?.sendMessage(chatId, response, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error searching watches:', error);
      await bot?.sendMessage(chatId, '❌ Error searching watch catalog');
    }
  });

  bot.onText(/\/available/, async (msg) => {
    const chatId = msg.chat.id;
    
    try {
      const watches = await storage.getAvailableWatches();
      
      if (watches.length === 0) {
        await bot?.sendMessage(chatId, 'No watches currently available.');
        return;
      }
      
      let response = `✅ *Available Watches* (${watches.length}):\n\n`;
      watches.slice(0, 15).forEach((watch, idx) => {
        response += `${idx + 1}. ${watch.reference}`;
        if (watch.collectionName) response += ` - ${watch.collectionName}`;
        if (watch.price) response += ` (${watch.currency} ${watch.price.toLocaleString()})`;
        response += `\n`;
      });
      
      if (watches.length > 15) {
        response += `\n_...and ${watches.length - 15} more_`;
      }
      
      await bot?.sendMessage(chatId, response, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error fetching available watches:', error);
      await bot?.sendMessage(chatId, '❌ Error fetching available watches');
    }
  });

  bot.onText(/\/clients_for (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const requestedAmbassador = match?.[1];
    
    if (!requestedAmbassador) {
      await bot?.sendMessage(chatId, 'Please provide ambassador name. Example: /clients_for Maaz');
      return;
    }
    
    try {
      // Require authentication
      const authenticatedAmbassador = await requireAuth(chatId);
      if (!authenticatedAmbassador) return;
      
      // Security: Only allow viewing own clients
      if (requestedAmbassador.toLowerCase() !== authenticatedAmbassador.toLowerCase()) {
        await bot?.sendMessage(chatId, `🔒 You can only view your own clients. Use /stats to see ${authenticatedAmbassador}'s clients.`);
        return;
      }
      
      const clients = await storage.getClientsByOwner(authenticatedAmbassador);
      
      if (clients.length === 0) {
        await bot?.sendMessage(chatId, `No clients found for ${authenticatedAmbassador}`);
        return;
      }
      
      let response = `👥 *${authenticatedAmbassador}'s Clients* (${clients.length}):\n\n`;
      clients.slice(0, 20).forEach((client, idx) => {
        response += `${idx + 1}. ${client.name}\n`;
        response += `   Status: ${client.status}\n`;
        if (client.clientSegment) response += `   Segment: ${client.clientSegment}\n`;
        if (client.interests) response += `   Interests: ${client.interests}\n`;
        response += `\n`;
      });
      
      if (clients.length > 20) {
        response += `_...and ${clients.length - 20} more_`;
      }
      
      await safeSendMessage(chatId, response, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error fetching clients:', error);
      await bot?.sendMessage(chatId, '❌ Error fetching clients');
    }
  });

  // Power commands for system status and actions
  bot.onText(/\/status/, async (msg) => {
    const chatId = msg.chat.id;
    
    try {
      const status = {
        telegram: !!TELEGRAM_BOT_TOKEN ? "✅ Active" : "❌ Inactive",
        gemini: !!GOOGLE_API_KEY ? "✅ Active" : "❌ Inactive",
        database: "✅ Connected",
        timestamp: new Date().toISOString()
      };
      
      let response = `🔧 *System Status*\n\n`;
      response += `Telegram Bot: ${status.telegram}\n`;
      response += `Gemini AI: ${status.gemini}\n`;
      response += `Database: ${status.database}\n\n`;
      response += `_Last checked: ${new Date().toLocaleString()}_`;
      
      await bot?.sendMessage(chatId, response, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error fetching status:', error);
      await bot?.sendMessage(chatId, '❌ Error fetching system status');
    }
  });

  bot.onText(/\/due/, async (msg) => {
    const chatId = msg.chat.id;
    const ambassador = await requireAuth(chatId);
    if (!ambassador) return;
    
    try {
      const allFollowups = await storage.getFollowUpsByOwner(ambassador);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const dueFollowups = allFollowups.filter(f => {
        const scheduledDate = new Date(f.scheduledFor);
        return scheduledDate >= today && scheduledDate < tomorrow;
      });
      
      if (dueFollowups.length === 0) {
        await bot?.sendMessage(chatId, `✅ No follow-ups due today for ${ambassador}!`);
        return;
      }
      
      let response = `📋 *${ambassador}'s Follow-ups Due Today* (${dueFollowups.length}):\n\n`;
      dueFollowups.slice(0, 15).forEach((followup, idx) => {
        const time = new Date(followup.scheduledFor).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        response += `${idx + 1}. `;
        if (followup.type) response += `${followup.type} - `;
        if (followup.description) response += `${followup.description.substring(0, 50)}${followup.description.length > 50 ? '...' : ''}`;
        response += ` (${time})`;
        response += `\n`;
      });
      
      if (dueFollowups.length > 15) {
        response += `\n_...and ${dueFollowups.length - 15} more_`;
      }
      
      await safeSendMessage(chatId, response, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error fetching due followups:', error);
      await bot?.sendMessage(chatId, '❌ Error fetching due follow-ups');
    }
  });

  bot.onText(/\/lead (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const ambassador = await requireAuth(chatId);
    if (!ambassador) return;
    
    const clientId = match?.[1];
    
    if (!clientId) {
      await bot?.sendMessage(chatId, 'Please provide a client ID. Example: /lead 12345');
      return;
    }
    
    try {
      const client = await storage.getClient(clientId);
      
      if (!client) {
        await bot?.sendMessage(chatId, `❌ Client "${clientId}" not found`);
        return;
      }
      
      // Check if this client belongs to the ambassador
      const ownerClients = await storage.getClientsByOwner(ambassador);
      const isOwner = ownerClients.some(c => c.id === client.id);
      
      if (!isOwner) {
        await bot?.sendMessage(chatId, `❌ Client "${clientId}" not found (or not yours)`);
        return;
      }
      
      let response = `👤 *Client Profile*\n\n`;
      response += `Name: ${client.name}\n`;
      response += `Status: ${client.status}\n`;
      response += `Owner: ${client.salesAssociate || client.primaryOwner || 'Unassigned'}\n`;
      if (client.leadScore) response += `Lead Score: ${client.leadScore}/100\n`;
      if (client.conversionProbability) response += `Conversion Probability: ${(client.conversionProbability * 100).toFixed(0)}%\n`;
      if (client.interests) response += `Interests: ${client.interests}\n`;
      if (client.nextBestAction) response += `\n💡 Next Action: ${client.nextBestAction}`;
      
      await bot?.sendMessage(chatId, response, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error fetching client:', error);
      await bot?.sendMessage(chatId, '❌ Error fetching client details');
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

    // Handle authentication flow
    const session = chatSessions.get(chatId);
    if (session) {
      if (session.step === 'askName') {
        const name = userMessage.trim();
        const normalized = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
        
        if (!VALID_AMBASSADORS.includes(normalized)) {
          await bot?.sendMessage(chatId, '❌ Please reply with: Maaz, Riham, or Asma');
          return;
        }
        
        session.candidateAmbassador = normalized;
        session.step = 'askPassword';
        chatSessions.set(chatId, session);
        await bot?.sendMessage(chatId, '🔐 Password?');
        return;
      }
      
      if (session.step === 'askPassword') {
        if (userMessage.trim() !== AMBASSADOR_PASSWORD) {
          await bot?.sendMessage(chatId, '❌ Incorrect password. Try again.\n\nPassword?');
          return;
        }
        
        const ambassador = session.candidateAmbassador as Ambassador;
        await setChatAmbassador(chatId, ambassador);
        chatSessions.delete(chatId);
        
        await bot?.sendMessage(
          chatId,
          `✅ Verified as ${ambassador}!\n\n` +
          `Your data is now scoped to your clients only.\n` +
          `Use /help to see available commands.`
        );
        return;
      }
    }

    try {
      console.log('🤖 [Telegram Bot] Processing natural language message:', userMessage);
      
      // Require authentication for natural language processing
      const ambassador = await requireAuth(chatId);
      if (!ambassador) return;
      
      // Send typing indicator
      await bot?.sendChatAction(chatId, 'typing');

      // Process the request using AI with chat context (scoped to ambassador)
      const response = await processNaturalLanguageRequest(userMessage, chatId, ambassador);

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

async function processNaturalLanguageRequest(message: string, chatId: number, ambassador: string): Promise<string> {
  if (!genai) {
    return '⚠️ AI processing is not available. Please set up Google API key.';
  }

  try {
    // Get clients scoped to authenticated ambassador
    const clients = await storage.getClientsByOwner(ambassador);
    
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
    
    // Get watch and FAQ data for enhanced AI context
    const watches = await storage.getAllWatches();
    const faqs = await storage.getAllFaqs();
    
    const sampleWatches = watches.slice(0, 3).map(w => ({
      reference: w.reference,
      model: w.model,
      collection: w.collectionName,
      caseSize: w.caseSize,
      price: w.price
    }));
    
    const sampleFaqs = faqs.slice(0, 3).map(f => ({
      category: f.category,
      question: f.question
    }));
    
    // Use Gemini to understand the intent and extract parameters
    const systemPrompt = `You are an AI assistant for Vacheron Constantin luxury watch CRM. Analyze user requests and execute them.

IMPORTANT: You are assisting ${ambassador}. All client data shown is ONLY their clients (primaryOwner or salesAssociate = ${ambassador}). You cannot access other ambassadors' clients.

UNDERSTANDING REQUESTS:
- "Find client 108884411" or "Tell me about 108884411" → Search by name/phone/ID
- "Update his/her status to X" → Update the LAST MENTIONED client's status
- "Close the request" or "Close his/her request" → Update LAST MENTIONED client to changed_mind
- "Tell me about watch 4500V" or "What's the price of Overseas" → Search watch catalog
- "Client asked about repairs" or "What's the warranty policy" → Search FAQ database
- Pronouns (his/her/them/the client) ALWAYS refer to the last mentioned client

AVAILABLE ACTIONS:
1. QUERY_CLIENTS: Search/filter/list clients by status, name, or criteria
2. GET_CLIENT: Get details about a specific client (by name, phone, or number in their name)
3. UPDATE_CLIENT: Update client status, priority, or boutique associate
4. CREATE_FOLLOWUP: Schedule a follow-up task
5. STATS: Provide CRM statistics
6. SEARCH_WATCH: Look up watch by reference, model, or collection name
7. SEARCH_FAQ: Find FAQ/script by topic, category, or keywords

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
- For watches: search by reference number, model name, or collection name
- For FAQs: search by topic keywords, category, or question content

DATA AVAILABLE:
Total clients: ${clients.length}
Total watches: ${watches.length}
Total FAQs: ${faqs.length}
Sample clients: ${JSON.stringify(sampleClients, null, 2)}
Sample watches: ${JSON.stringify(sampleWatches, null, 2)}
Sample FAQs: ${JSON.stringify(sampleFaqs, null, 2)}${contextInfo}

Respond ONLY with valid JSON:
{
  "action": "QUERY_CLIENTS|GET_CLIENT|UPDATE_CLIENT|CREATE_FOLLOWUP|STATS|SEARCH_WATCH|SEARCH_FAQ",
  "params": {
    "clientId": "ID from context if using pronouns",
    "name": "partial or full client name",
    "status": "...",
    "search": "search term",
    "boutiqueSalesAssociateName": "...",
    "priority": "...",
    "type": "call|email|meeting",
    "scheduledFor": "ISO date string",
    "watchReference": "watch reference or model name",
    "faqQuery": "FAQ search keywords"
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
    
    // Handle API errors with helpful fallback
    if ((error as any).status === 429 || (error as any).code === 'rate_limit_exceeded') {
      return '⚠️ *API Rate Limit*\n\nPlease wait a moment and try again.';
    }
    
    // Provide helpful fallback when AI processing fails
    return '⚠️ *AI Processing Unavailable*\n\n' +
           'Try using direct commands:\n' +
           '• `/list_vip` - List VIP clients\n' +
           '• `/watch <reference>` - Get watch details\n' +
           '• `/faq <query>` - Search knowledge base\n' +
           '• `/stats` - View CRM statistics\n' +
           '• `/help` - See all commands\n\n' +
           `_Error: ${(error as any).message}_`;
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
      
      case 'SEARCH_WATCH': {
        const reference = params.watchReference || params.search;
        if (!reference) {
          return `❌ Please specify a watch reference, model, or collection name.`;
        }
        
        // Try exact reference match first
        let watch = await storage.getWatchByReference(reference);
        
        // If not found, search by model or collection
        if (!watch) {
          const allWatches = await storage.getAllWatches();
          watch = allWatches.find(w => 
            w.model?.toLowerCase().includes(reference.toLowerCase()) ||
            w.collectionName?.toLowerCase().includes(reference.toLowerCase()) ||
            w.reference.toLowerCase().includes(reference.toLowerCase())
          );
        }
        
        if (!watch) {
          return `❌ Watch "${reference}" not found in catalog. Try using the full reference number.`;
        }
        
        await storage.incrementWatchPopularity(watch.id);
        
        let response = `🕐 *${watch.model || watch.reference}*\n\n`;
        response += `Reference: ${watch.reference}\n`;
        if (watch.collectionName) response += `Collection: ${watch.collectionName}\n`;
        if (watch.caseSize) response += `📏 Size: ${watch.caseSize}\n`;
        if (watch.caseMaterial) response += `⚙️ Material: ${watch.caseMaterial}\n`;
        if (watch.dialColor) response += `🎨 Dial: ${watch.dialColor}\n`;
        if (watch.movementType) response += `⚡ Movement: ${watch.movementType}\n`;
        if (watch.caliber) response += `🔧 Caliber: ${watch.caliber}\n`;
        if (watch.powerReserve) response += `🔋 Power Reserve: ${watch.powerReserve}\n`;
        if (watch.complications && watch.complications.length > 0) {
          response += `✨ Complications: ${watch.complications.join(', ')}\n`;
        }
        if (watch.waterResistance) response += `💧 Water Resistance: ${watch.waterResistance}\n`;
        if (watch.price) response += `💰 Price: ${watch.currency} ${watch.price.toLocaleString()}\n`;
        if (watch.available !== undefined) response += `📦 ${watch.available ? '✅ Available' : '❌ Out of Stock'}\n`;
        if (watch.description) response += `\n${watch.description}`;
        
        if (aiResponse) response += `\n\n_${aiResponse}_`;
        
        return response;
      }
      
      case 'SEARCH_FAQ': {
        const query = params.faqQuery || params.search;
        if (!query) {
          return `❌ Please specify what FAQ topic you're looking for.`;
        }
        
        const faqs = await storage.searchFaqs(query);
        
        if (faqs.length === 0) {
          return `❌ No FAQs found for "${query}". Try different keywords like "repair", "warranty", "pricing", etc.`;
        }
        
        const topFaq = faqs[0];
        await storage.incrementFaqUsage(topFaq.id);
        
        let response = `❓ *${topFaq.question}*\n\n`;
        response += `📂 Category: ${topFaq.category}\n\n`;
        response += `💬 Answer:\n${topFaq.answer}`;
        
        if (faqs.length > 1) {
          response += `\n\n_Found ${faqs.length - 1} more related FAQ(s). Try /faq for more._`;
        }
        
        if (aiResponse) response += `\n\n_${aiResponse}_`;
        
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
