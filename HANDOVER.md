# Vacheron Constantin CRM - Complete Handover Documentation

## 🎯 Project Overview

This is a comprehensive luxury CRM system built for Vacheron Constantin watch sales management. The system features:

- **223 Real Clients** imported from Excel with full ownership tracking
- **PostgreSQL Persistent Storage** - data survives all restarts
- **Telegram Bot with AI** - Google Gemini-powered natural language processing
- **Watch Catalog Database** - 6 Vacheron Constantin timepieces with detailed specs
- **FAQ/Knowledge Base** - 10 professional client service scripts
- **Advanced Telegram Commands** - Watch lookups, FAQ searches, VIP filtering
- **Automated Reminders** - 24-hour appointment notifications via Telegram

## 📊 Current System Status

### Database Statistics (as of latest test)
- **Total Clients:** 223 (deduplicated from 298 Excel rows)
- **Watch Catalog:** 6 Vacheron Constantin watches
- **FAQ Database:** 10 professional service scripts
- **Data Source:** Excel file (Vacheron Constantin V1 tracker - MAAZ entries only)
- **Persistence:** ✅ All data stored in PostgreSQL and survives restarts

### Import Details
- **Source File:** `Vacheron Constantin V1.xlsx`
- **Filter Logic:** Only includes rows where Sales Associate = "MAAZ"
- **Deduplication:** Unique combinations of Client_ID + Watch_Reference
- **Performance:** ~2.6 seconds for full import with database
- **Auto-Import:** Runs on every server startup, skips duplicates

## 🔧 Environment Setup

### Required Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration (Auto-configured by Replit)
DATABASE_URL=<your_postgresql_connection_string>

# Google Gemini AI (Required for Telegram bot AI features)
GOOGLE_API_KEY=<your_google_gemini_api_key>

# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=<your_telegram_bot_token>
TELEGRAM_ADMIN_CHAT_ID=<your_telegram_chat_id>

# Optional: Groq API (Alternative AI provider, not currently used)
GROQ_API_KEY=<your_groq_api_key>

# Application Port (Default: 5000)
PORT=5000

# Node Environment
NODE_ENV=development
```

### How to Get API Keys

1. **GOOGLE_API_KEY** (Required for AI features)
   - Go to [Google AI Studio](https://aistudio.google.com/)
   - Create a new API key
   - Model used: `gemini-2.0-flash-exp`

2. **TELEGRAM_BOT_TOKEN** (Required for Telegram bot)
   - Message [@BotFather](https://t.me/botfather) on Telegram
   - Create a new bot with `/newbot`
   - Copy the provided token

3. **TELEGRAM_ADMIN_CHAT_ID** (Required for appointment reminders)
   - Message [@userinfobot](https://t.me/userinfobot) on Telegram
   - Copy your chat ID

## 🚀 Running the Application

### First-Time Setup

```bash
# Install dependencies (if needed)
npm install

# Push database schema to PostgreSQL
npm run db:push

# Start the application
npm run dev
```

The application will:
1. Start Express server on port 5000
2. Initialize Telegram bot (if credentials provided)
3. Auto-import Excel data (223 clients)
4. Seed watch catalog (6 watches)
5. Seed FAQ database (10 FAQs)
6. Start appointment reminder system (checks every 15 minutes)

### Accessing the Application

- **Web UI:** `http://localhost:5000` (or your Replit URL)
- **Telegram Bot:** Message your bot on Telegram
- **API Endpoints:** `http://localhost:5000/api/*`

## 📱 Telegram Bot Commands

### Direct Commands (No AI needed)

**Client Management:**
- `/stats` - View CRM statistics
- `/list_vip` - List VIP clients
- `/list_confirmed` - List confirmed clients
- `/list_sold` - List sold clients
- `/list_hesitant` - List hesitant clients
- `/list_callback` - List clients needing callback

**Watch Catalog:**
- `/watch <reference>` - Get watch details
  - Example: `/watch 4500V/110A-B128`

**FAQ/Knowledge Base:**
- `/faq <query>` - Search FAQ database
  - Example: `/faq repair turnaround`

**Help:**
- `/help` - Show all commands
- `/start` - Welcome message and introduction

### Natural Language Commands (AI-Powered)

The bot understands conversational requests using Google Gemini AI:

**Client Queries:**
- "Show me all VIP clients"
- "Tell me about Client #108884411"
- "Find client 108884411"
- "How many clients are in Confirmed status?"

**Client Updates:**
- "Update his status to Sold"
- "Close the request for client Z"
- "Change her status to Hesitant"

**Follow-ups & Reminders:**
- "Remind me to call Client Y tomorrow at 2pm"
- "Create a follow-up for Client X"

**Watch & FAQ Queries:**
- "Tell me about watch 4500V"
- "What's the price of Overseas?"
- "Client asked about repairs"
- "What's the warranty policy?"

### Context Tracking

The bot maintains conversation context:
- When you query a client, they become the "last mentioned client"
- Pronouns ("his", "her", "them", "the client") automatically refer to the last mentioned client
- No need to repeat client names in follow-up commands

## 🗄️ Database Schema

### Clients Table (`clients`)

**All 20+ Excel Fields Imported:**
- `id` - UUID primary key
- `name` - Client name (often contains ID like "Client 108884411")
- `phone` - Phone number
- `email` - Email address
- `whatsappNumber` - WhatsApp contact
- `status` - Current pipeline status
- `priority` - Priority level (vip, high, medium, low)
- `interests` - Watch interests/references
- `location` - Client location
- `notes` - Additional notes
- `leadScore` - Lead quality score (0-100)
- `statusSince` - When status was last changed
- `salesAssociate` - Primary sales associate (e.g., "MAAZ")
- `boutiqueSalesAssociateName` - Boutique associate
- `clientSegment` - VIP, Regular, etc.
- `followUpDate` - Next follow-up date
- `priorityLevel` - Excel priority level
- `nextAction` - Next action to take
- `primaryOwner` - Primary account owner
- `backupOwner` - Backup account owner
- `handoverStatus` - Handover tracking
- `completed` - Completion status

**Client Statuses:**
- `requested_callback` - Needs callback
- `confirmed` - Confirmed interest
- `sold` - Purchase complete
- `hesitant` - Unsure/needs nurturing
- `shared_with_boutique` - Passed to boutique team
- `changed_mind` - Not interested/closed
- `vip` - VIP client

### Watches Table (`watches`)

**Enhanced Watch Catalog Schema:**
- `id` - UUID primary key
- `reference` - Watch reference number (e.g., "4500V/110A-B128")
- `collectionName` - Collection (Overseas, Patrimony, etc.)
- `brand` - Brand name (Vacheron Constantin)
- `model` - Model name
- `description` - Full description
- `price` - Price in specified currency
- `currency` - Currency (USD, EUR, etc.)
- `available` - Availability status
- `stock` - Stock status
- `category` - Category (Luxury Sport Watch, etc.)
- `caseSize` - Case diameter (e.g., "41mm")
- `caseMaterial` - Material (Stainless Steel, Gold, etc.)
- `caseThickness` - Thickness measurement
- `dialColor` - Dial color
- `strapBracelet` - Strap/bracelet type
- `movementType` - Movement (Automatic, Manual, etc.)
- `caliber` - Caliber number
- `powerReserve` - Power reserve duration
- `complications` - Array of complications (Date, Chronograph, etc.)
- `waterResistance` - Water resistance rating
- `popularity` - Popularity counter (increments on lookup)

**Current Watch Catalog:**
1. Overseas 4500V/110A-B128 - Blue dial, 41mm, $27,600
2. Fiftysix 4600E/110A-B442 - Day-Date, 40mm, $23,400
3. Traditionnelle 5000H/000R-B059 - Rose gold, 39mm, $43,200
4. Overseas Chronograph 7900V/110A-B334 - 42.5mm, $34,800
5. Patrimony Moon Phase 4337/110R-001 - Complications, $38,500
6. Overseas Ultra-Thin 43175/000R-9687 - Pink gold, $54,300

### FAQs Table (`faqs`)

**FAQ/Knowledge Base Schema:**
- `id` - UUID primary key
- `question` - FAQ question
- `category` - Category (Repairs, Warranty, Product Info, etc.)
- `keywords` - Array of search keywords
- `answer` - Professional response script
- `usageCount` - Usage tracking counter

**Current FAQ Categories:**
1. **Repairs** - Turnaround times, servicing process
2. **Warranty** - Coverage, terms, conditions
3. **Product Info** - Complications, features, specifications
4. **Boutique Services** - Appointments, private viewings
5. **Sales** - Pricing, payment options, purchase process
6. **Client Service** - Handling hesitancy, objections

### Appointments Table (`appointments`)

- `id` - UUID primary key
- `clientId` - Foreign key to clients table
- `appointmentDate` - Appointment date/time
- `notes` - Appointment notes
- `reminderSent` - Whether 24-hour reminder was sent

### Follow-ups Table (`follow_ups`)

- `id` - UUID primary key
- `clientId` - Foreign key to clients table
- `type` - Follow-up type (call, email, meeting)
- `title` - Follow-up title
- `description` - Details
- `scheduledFor` - Scheduled date/time
- `priority` - Priority level
- `completed` - Completion status

## 🛠️ API Endpoints

### Client Management

```bash
# Get all clients
GET /api/clients

# Get single client
GET /api/clients/:id

# Create client
POST /api/clients
Content-Type: application/json
{
  "name": "Client Name",
  "phone": "+1234567890",
  "status": "requested_callback",
  "priority": "medium"
}

# Update client
PATCH /api/clients/:id
Content-Type: application/json
{
  "status": "confirmed",
  "notes": "Follow up next week"
}

# Import Excel data
POST /api/clients/import-excel
# Auto-runs on startup, can be manually triggered
```

### Watch Catalog

```bash
# Get all watches
GET /api/watches

# Get watch by reference
GET /api/watches/:reference
# Example: GET /api/watches/4500V/110A-B128

# Create watch
POST /api/watches
Content-Type: application/json
{
  "reference": "1234V/110A-B456",
  "collectionName": "Overseas",
  "model": "Overseas Automatic",
  "price": 30000,
  "currency": "USD",
  "caseSize": "42mm"
}
```

### FAQ/Knowledge Base

```bash
# Get all FAQs
GET /api/faqs

# Search FAQs
GET /api/faqs/search?q=repair
# Returns ranked results by keyword match

# Create FAQ
POST /api/faqs
Content-Type: application/json
{
  "question": "Client asks about...",
  "category": "Product Info",
  "keywords": ["feature", "spec"],
  "answer": "Professional response..."
}
```

### Follow-ups

```bash
# Get all follow-ups
GET /api/followups

# Create follow-up
POST /api/followups
Content-Type: application/json
{
  "clientId": "client-uuid",
  "type": "call",
  "title": "Follow-up call",
  "scheduledFor": "2025-10-15T14:00:00Z"
}
```

## 📂 Project Structure

```
vacheron-crm/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   └── ui/           # Shadcn components
│   │   ├── pages/            # Application pages
│   │   │   ├── Home.tsx
│   │   │   ├── Clients.tsx
│   │   │   └── Analytics.tsx
│   │   ├── lib/              # Utilities
│   │   │   └── queryClient.ts
│   │   └── App.tsx           # Main app component
│   └── index.html
├── server/                    # Express backend
│   ├── db.ts                 # Database connection
│   ├── storage.ts            # Data access layer
│   ├── routes.ts             # API routes
│   ├── index.ts              # Server entry point
│   ├── import-excel.ts       # Excel import logic
│   ├── seed-catalog.ts       # Watch/FAQ seeding
│   └── services/
│       ├── telegram-bot.ts   # Telegram bot implementation
│       └── gemini-service.ts # AI service wrapper
├── shared/
│   └── schema.ts             # Shared TypeScript types & Drizzle schema
├── attached_assets/          # Excel data files
│   └── Vacheron Constantin V1.xlsx
├── .env                      # Environment variables (create this)
├── package.json
├── drizzle.config.ts
└── README.md
```

## 🔄 Data Flow

### Excel Import Flow

```
1. Server starts → import-excel.ts runs automatically
2. Reads: Vacheron Constantin V1.xlsx (Sheet: "Airtable")
3. Filters: Only rows where Sales_Associate = "MAAZ"
4. Deduplicates: Unique Client_ID + Watch_Reference combinations
5. Maps: All 20+ Excel columns → Database schema
6. Upserts: Uses Drizzle ORM with conflict resolution
7. Result: 223 unique clients inserted/updated
8. Logs: "0 new clients, 223 duplicates skipped" on subsequent runs
```

### Telegram Bot AI Flow

```
1. User sends message → Telegram webhook
2. Bot extracts message text
3. Calls Google Gemini API with:
   - System prompt (defines actions: QUERY_CLIENTS, SEARCH_WATCH, etc.)
   - User message
   - Context (last mentioned client, sample data)
4. Gemini returns JSON:
   {
     "action": "GET_CLIENT",
     "params": {"search": "108884411"},
     "response": "Here's the client info..."
   }
5. executeAction() processes the action:
   - Queries database
   - Updates context
   - Formats response
6. Bot sends formatted message back to user
7. Tracks context for pronoun resolution
```

### Appointment Reminder Flow

```
1. Reminder system checks every 15 minutes
2. Queries: appointments where appointmentDate is in next 24 hours
3. Filters: Only un-sent reminders (reminderSent = false)
4. For each appointment:
   - Fetches client details
   - Formats reminder message
   - Sends to TELEGRAM_ADMIN_CHAT_ID
   - Marks reminderSent = true
5. Prevents duplicate reminders
```

## 🧪 Testing & Verification

### Verify Data Persistence

```bash
# Method 1: Check client count via API
curl http://localhost:5000/api/clients | jq 'length'
# Expected: 223

# Method 2: Restart server and check again
npm run dev
# Watch logs: "0 new clients, 223 duplicates skipped"

# Method 3: Check watch catalog
curl http://localhost:5000/api/watches | jq 'length'
# Expected: 6

# Method 4: Check FAQ count
curl http://localhost:5000/api/faqs | jq 'length'
# Expected: 10
```

### Test Telegram Bot Commands

1. **Direct Commands:**
   ```
   /stats
   /list_vip
   /watch 4500V/110A-B128
   /faq repair
   ```

2. **Natural Language:**
   ```
   "Show me all VIP clients"
   "Tell me about watch Overseas"
   "Client asked about warranty"
   "Find client 108884411"
   "Update his status to Sold"
   ```

### Database Verification

```bash
# Push schema (if needed)
npm run db:push

# Force push (if conflicts)
npm run db:push --force

# Check PostgreSQL directly (if using Replit)
# Use the Database pane in Replit UI
```

## 🐛 Troubleshooting

### Common Issues

1. **Import shows 0 new clients, 0 duplicates**
   - Excel file not found in `attached_assets/`
   - Check file name exactly matches: `Vacheron Constantin V1.xlsx`

2. **Telegram bot not responding**
   - Verify TELEGRAM_BOT_TOKEN is set
   - Check GOOGLE_API_KEY is valid
   - Look for "Telegram bot initialized successfully" in logs

3. **AI features not working**
   - Verify GOOGLE_API_KEY is set
   - Check Gemini API quota/limits
   - Bot will fall back to direct commands if AI fails

4. **Appointment reminders not sending**
   - Set TELEGRAM_ADMIN_CHAT_ID environment variable
   - Check logs for "Reminder system already running"
   - Verify appointments exist in next 24 hours

5. **Database errors**
   - Run `npm run db:push --force` to sync schema
   - Check DATABASE_URL is valid
   - Ensure PostgreSQL is running

## 📈 Performance Metrics

- **Excel Import:** ~2.6 seconds for 223 clients (with PostgreSQL)
- **Client Query:** <100ms for full list (223 clients)
- **Watch Lookup:** <50ms per watch
- **FAQ Search:** <100ms with keyword matching
- **Telegram Response:** 1-3 seconds (includes AI processing)
- **Database:** All queries use indexed lookups

## 🔐 Security Considerations

1. **API Keys:** Never commit .env file to version control
2. **Database:** Use environment variables for connection strings
3. **Telegram Bot:** Only responds to configured chat IDs
4. **Excel Data:** Contains real client information - treat as confidential
5. **Error Messages:** AI errors include fallback to prevent info leakage

## 🚀 Deployment Checklist

- [ ] Set all required environment variables
- [ ] Run `npm run db:push` to initialize database
- [ ] Verify Excel file is in `attached_assets/`
- [ ] Test Telegram bot responds to `/start`
- [ ] Confirm 223 clients imported successfully
- [ ] Check watch catalog has 6 entries
- [ ] Verify FAQ database has 10 entries
- [ ] Test appointment reminders (if using)
- [ ] Enable Replit publishing for production URL

## 📞 Support & Maintenance

### Regular Maintenance Tasks

1. **Monitor Telegram bot logs** for errors
2. **Check appointment reminders** are sending correctly
3. **Backup database** regularly (Replit does this automatically)
4. **Update watch catalog** as new models are released
5. **Add new FAQs** based on common client questions

### Adding New Watches

```bash
# Option 1: Via API
curl -X POST http://localhost:5000/api/watches \
  -H "Content-Type: application/json" \
  -d '{
    "reference": "NEW-REF-123",
    "collectionName": "Patrimony",
    "model": "New Model",
    "price": 50000,
    "caseSize": "40mm"
  }'

# Option 2: Edit server/seed-catalog.ts and restart
```

### Adding New FAQs

```bash
curl -X POST http://localhost:5000/api/faqs \
  -H "Content-Type: application/json" \
  -d '{
    "question": "New FAQ question",
    "category": "Product Info",
    "keywords": ["keyword1", "keyword2"],
    "answer": "Professional response..."
  }'
```

## 📝 Change Log

### October 13, 2025
- ✅ Migrated to PostgreSQL persistent storage
- ✅ Imported 223 clients from Excel with deduplication
- ✅ Enhanced watch catalog with 6 Vacheron Constantin models
- ✅ Built FAQ database with 10 professional scripts
- ✅ Enhanced Telegram bot with /list_vip, /watch, /faq commands
- ✅ Added AI-powered watch and FAQ queries
- ✅ Implemented robust error handling with fallback messages
- ✅ Comprehensive E2E testing completed (all features verified)

### Previous Versions
- October 11, 2025: Initial Excel import, Telegram bot with AI
- Earlier: In-memory storage, WhatsApp features (removed)

---

## 🎓 For AI Transfer / Handover

This system is ready for production use. All features have been tested and verified:

- **Data Integrity:** ✅ 223 clients persist across restarts
- **Watch Catalog:** ✅ 6 watches fully documented
- **FAQ System:** ✅ 10 professional scripts ready
- **Telegram Bot:** ✅ All commands working (direct + AI)
- **API Endpoints:** ✅ All routes tested and functional
- **Error Handling:** ✅ Graceful fallbacks implemented

**Next Steps for New AI/Developer:**
1. Review this handover document
2. Set up environment variables
3. Run `npm run dev` to start
4. Test Telegram bot commands
5. Verify client count = 223
6. Customize watch catalog and FAQs as needed

**Questions to Consider:**
- Should we add more watches to the catalog?
- Do we need additional FAQ categories?
- Should we implement client activity logging?
- Do we want to add more AI capabilities?

This CRM is production-ready and fully functional. Good luck! 🚀
