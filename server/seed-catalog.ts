import { storage } from './storage';

export async function seedWatchCatalog() {
  console.log('🌱 Seeding watch catalog...');
  
  const watches = [
    {
      reference: '4500V/110A-B128',
      collectionName: 'Overseas',
      model: 'Overseas Automatic',
      description: 'Stainless steel sport watch with iconic design, integrated bracelet, and versatile strap system',
      price: 27600,
      currency: 'USD',
      available: true,
      stock: 'In Stock',
      category: 'Luxury Sport Watch',
      caseSize: '41mm',
      caseMaterial: 'Stainless Steel',
      caseThickness: '11mm',
      dialColor: 'Blue',
      strapBracelet: 'Integrated Stainless Steel Bracelet',
      waterResistance: '150m',
      movementType: 'Automatic',
      caliber: 'Calibre 5100',
      powerReserve: '60 hours',
      frequency: '28,800 vph',
      jewels: 27,
      complications: ['Date'],
      functions: ['Hours', 'Minutes', 'Seconds', 'Date'],
      crystalType: 'Sapphire Crystal',
      caseBack: 'Transparent Sapphire',
      limitedEdition: false,
      tags: ['sport', 'blue dial', 'steel', 'overseas', 'automatic']
    },
    {
      reference: '7900V/110A-B334',
      collectionName: 'Overseas',
      model: 'Overseas Perpetual Calendar Ultra-Thin',
      description: 'Ultra-thin perpetual calendar with elegant proportions and innovative quick-change strap system',
      price: 61500,
      currency: 'USD',
      available: true,
      stock: 'Limited Availability',
      category: 'Complicated Watch',
      caseSize: '41.5mm',
      caseMaterial: 'Stainless Steel',
      caseThickness: '8.1mm',
      dialColor: 'Blue',
      strapBracelet: 'Integrated Stainless Steel Bracelet',
      waterResistance: '150m',
      movementType: 'Automatic',
      caliber: 'Calibre 1120 QP',
      powerReserve: '40 hours',
      frequency: '19,800 vph',
      jewels: 36,
      complications: ['Perpetual Calendar', 'Moon Phase'],
      functions: ['Hours', 'Minutes', 'Date', 'Day', 'Month', 'Year', 'Moon Phase'],
      crystalType: 'Anti-reflective Sapphire',
      caseBack: 'Transparent Sapphire',
      limitedEdition: false,
      tags: ['perpetual calendar', 'ultra-thin', 'blue dial', 'overseas']
    },
    {
      reference: '5000H/000R-B059',
      collectionName: 'Traditionnelle',
      model: 'Traditionnelle Tourbillon',
      description: 'Classic tourbillon showcasing haute horlogerie craftsmanship with refined aesthetics',
      price: 158000,
      currency: 'USD',
      available: true,
      stock: 'Made to Order',
      category: 'Grand Complication',
      caseSize: '41mm',
      caseMaterial: '18K Pink Gold',
      caseThickness: '10.97mm',
      dialColor: 'Silver',
      strapBracelet: 'Alligator Leather',
      waterResistance: '30m',
      movementType: 'Manual',
      caliber: 'Calibre 2160',
      powerReserve: '80 hours',
      frequency: '18,000 vph',
      jewels: 27,
      complications: ['Tourbillon'],
      functions: ['Hours', 'Minutes', 'Tourbillon'],
      crystalType: 'Sapphire Crystal',
      caseBack: 'Transparent Sapphire',
      limitedEdition: false,
      tags: ['tourbillon', 'pink gold', 'manual', 'traditionnelle']
    },
    {
      reference: '4500V/110A-B483',
      collectionName: 'Overseas',
      model: 'Overseas Chronograph',
      description: 'Sporty chronograph with 3-counter layout, robust construction, and versatile design',
      price: 38900,
      currency: 'USD',
      available: true,
      stock: 'In Stock',
      category: 'Sport Chronograph',
      caseSize: '42.5mm',
      caseMaterial: 'Stainless Steel',
      caseThickness: '13.7mm',
      dialColor: 'Silver-toned',
      strapBracelet: 'Integrated Stainless Steel Bracelet',
      waterResistance: '150m',
      movementType: 'Automatic',
      caliber: 'Calibre 5200',
      powerReserve: '52 hours',
      frequency: '28,800 vph',
      jewels: 36,
      complications: ['Chronograph', 'Date'],
      functions: ['Hours', 'Minutes', 'Seconds', 'Chronograph', 'Date'],
      crystalType: 'Sapphire Crystal',
      caseBack: 'Solid',
      limitedEdition: false,
      tags: ['chronograph', 'sport', 'steel', 'overseas']
    },
    {
      reference: '7337/110R-001',
      collectionName: 'Patrimony',
      model: 'Patrimony Perpetual Calendar',
      description: 'Elegant perpetual calendar combining refined design with advanced complications',
      price: 76000,
      currency: 'USD',
      available: false,
      stock: 'Out of Stock',
      category: 'Complicated Watch',
      caseSize: '41mm',
      caseMaterial: '18K Pink Gold',
      caseThickness: '9.7mm',
      dialColor: 'Slate Grey',
      strapBracelet: 'Alligator Leather',
      waterResistance: '30m',
      movementType: 'Automatic',
      caliber: 'Calibre 1120 QP',
      powerReserve: '40 hours',
      frequency: '19,800 vph',
      jewels: 36,
      complications: ['Perpetual Calendar', 'Moon Phase'],
      functions: ['Hours', 'Minutes', 'Date', 'Day', 'Month', 'Year', 'Moon Phase'],
      crystalType: 'Sapphire Crystal',
      caseBack: 'Solid',
      limitedEdition: false,
      tags: ['perpetual calendar', 'pink gold', 'patrimony', 'moon phase']
    },
    {
      reference: '43175/000R-9687',
      collectionName: 'Historiques',
      model: 'Historiques American 1921',
      description: 'Heritage-inspired piece with distinctive off-center dial design, celebrating American heritage',
      price: 38500,
      currency: 'USD',
      available: true,
      stock: 'Limited Availability',
      category: 'Heritage Watch',
      caseSize: '40mm',
      caseMaterial: '18K Pink Gold',
      caseThickness: '10mm',
      dialColor: 'Silver',
      strapBracelet: 'Alligator Leather',
      waterResistance: '30m',
      movementType: 'Manual',
      caliber: 'Calibre 4400 AS',
      powerReserve: '65 hours',
      frequency: '28,800 vph',
      jewels: 27,
      complications: [],
      functions: ['Hours', 'Minutes', 'Seconds'],
      crystalType: 'Sapphire Crystal',
      caseBack: 'Transparent Sapphire',
      limitedEdition: false,
      tags: ['heritage', 'pink gold', 'manual', 'historiques', 'american']
    }
  ];

  try {
    for (const watch of watches) {
      const existing = await storage.getWatchByReference(watch.reference);
      if (!existing) {
        await storage.createWatch(watch);
        console.log(`  ✅ Added watch: ${watch.reference} - ${watch.model}`);
      } else {
        console.log(`  ⏭️  Watch already exists: ${watch.reference}`);
      }
    }
    console.log(`✅ Watch catalog seeding complete!`);
  } catch (error) {
    console.error('❌ Error seeding watch catalog:', error);
  }
}

export async function seedFaqDatabase() {
  console.log('🌱 Seeding FAQ database...');
  
  const faqs = [
    {
      question: 'Client asks about watch repair turnaround time',
      category: 'Repairs',
      keywords: ['repair', 'service', 'turnaround', 'time', 'how long'],
      answer: 'Our standard service and repair process typically takes 4-6 weeks, depending on the complexity of the work required. For more complex complications or if parts need to be specially ordered from Switzerland, the process may take 8-12 weeks. We will provide you with a detailed estimate and timeline once our master watchmakers have inspected your timepiece. Rest assured, your Vacheron Constantin watch will receive the utmost care and precision throughout the entire service process.',
      tone: 'professional',
      context: 'Use when client inquires about repair or service duration',
      relatedReferences: [],
      priority: 10
    },
    {
      question: 'Client asks about warranty coverage',
      category: 'Warranty',
      keywords: ['warranty', 'coverage', 'guarantee', 'protection'],
      answer: 'Every Vacheron Constantin timepiece comes with an international limited warranty valid for 2 years from the date of purchase. This warranty covers manufacturing defects in materials and workmanship under normal use. The warranty does not cover damage resulting from accidents, improper use, unauthorized service, or normal wear and tear. For your peace of mind, we also offer extended warranty programs that can extend coverage up to 5 years. Your warranty certificate and purchase documentation should be kept in a safe place.',
      tone: 'professional',
      context: 'Use when discussing warranty terms and coverage',
      relatedReferences: [],
      priority: 10
    },
    {
      question: 'Client asks about water resistance',
      category: 'Product Info',
      keywords: ['water resistance', 'waterproof', 'swimming', 'diving', 'water'],
      answer: 'The water resistance rating varies by model. Our Overseas collection features 150m (15 ATM) water resistance, suitable for swimming and snorkeling. The Patrimony and Traditionnelle collections typically have 30m (3 ATM) water resistance, making them splash-resistant but not suitable for swimming. Please note that water resistance is not a permanent condition and may be affected by aging gaskets, accidental shocks, or crown manipulation. We recommend having the water resistance tested annually, especially if you use your watch in aquatic environments.',
      tone: 'professional',
      context: 'Use when discussing water resistance capabilities',
      relatedReferences: ['4500V/110A-B128', '7337/110R-001'],
      priority: 8
    },
    {
      question: 'Client interested in Overseas collection features',
      category: 'Product Info',
      keywords: ['overseas', 'collection', 'features', 'sport watch'],
      answer: 'The Vacheron Constantin Overseas collection represents our sport-elegant line, combining robustness with refined aesthetics. Key features include: an integrated bracelet design with quick-change strap system allowing effortless switching between metal bracelet, leather strap, and rubber strap; 150m water resistance for active lifestyles; the distinctive Maltese cross bezel; and in-house automatic movements. The collection ranges from time-only models to sophisticated complications including chronographs and perpetual calendars, all maintaining the versatile sport-chic aesthetic.',
      tone: 'professional',
      context: 'Use when discussing Overseas collection characteristics',
      relatedReferences: ['4500V/110A-B128', '7900V/110A-B334', '4500V/110A-B483'],
      priority: 9
    },
    {
      question: 'Client asks about perpetual calendar complication',
      category: 'Product Info',
      keywords: ['perpetual calendar', 'complication', 'calendar', 'date', 'leap year'],
      answer: 'A perpetual calendar is one of haute horlogerie\'s most prestigious complications. Unlike a simple calendar, it automatically accounts for months with varying lengths and even leap years, requiring no adjustment until the year 2100. This extraordinary mechanism displays the day, date, month, year, and often moon phase. Our Overseas Perpetual Calendar Ultra-Thin showcases this complication in an ultra-slim 8.1mm case, a remarkable achievement in watchmaking. The perpetual calendar represents the pinnacle of mechanical ingenuity and craftsmanship.',
      tone: 'professional',
      context: 'Use when explaining perpetual calendar complications',
      relatedReferences: ['7900V/110A-B334', '7337/110R-001'],
      priority: 7
    },
    {
      question: 'Client asks about pricing and payment options',
      category: 'Boutique Services',
      keywords: ['price', 'payment', 'financing', 'cost', 'how much'],
      answer: 'Our Vacheron Constantin collection ranges from approximately $27,000 for entry-level models to several hundred thousand dollars for grand complications. We offer several payment options to accommodate your preferences: full payment via wire transfer, bank check, or credit card (Visa, Mastercard, American Express). We also partner with select financing companies to offer flexible payment plans for qualified clients. All transactions are handled with complete discretion and security. I would be delighted to discuss specific pricing for any timepiece that interests you.',
      tone: 'professional',
      context: 'Use when discussing pricing and payment methods',
      relatedReferences: [],
      priority: 9
    },
    {
      question: 'Client requests boutique appointment',
      category: 'Boutique Services',
      keywords: ['appointment', 'visit', 'boutique', 'schedule', 'meet'],
      answer: 'We would be honored to welcome you to our boutique for a private viewing. I can arrange a personalized appointment at your convenience, where you can experience our timepieces firsthand in an intimate setting. During your visit, our expert advisors will be available to discuss the heritage, craftsmanship, and technical specifications of any pieces that interest you. We can also prepare specific models for your viewing in advance. What date and time would work best for your schedule?',
      tone: 'professional',
      context: 'Use when client wants to schedule boutique visit',
      relatedReferences: [],
      priority: 10
    },
    {
      question: 'Client asks about tourbillon complication',
      category: 'Product Info',
      keywords: ['tourbillon', 'complication', 'movement', 'mechanical'],
      answer: 'The tourbillon is one of watchmaking\'s most revered complications, invented by Abraham-Louis Breguet in 1795. It compensates for the effects of gravity on the watch\'s accuracy by placing the escapement and balance wheel inside a rotating cage that completes one rotation per minute. Our Traditionnelle Tourbillon showcases this mesmerizing complication through a transparent dial opening, allowing you to observe this mechanical ballet. The tourbillon represents the highest level of watchmaking artistry, requiring weeks of meticulous hand-assembly by our master watchmakers.',
      tone: 'professional',
      context: 'Use when explaining tourbillon complications',
      relatedReferences: ['5000H/000R-B059'],
      priority: 6
    },
    {
      question: 'Client asks about servicing costs',
      category: 'Repairs',
      keywords: ['service cost', 'maintenance cost', 'repair price', 'how much service'],
      answer: 'Service costs vary depending on the model and required work. A standard complete service for a time-only automatic watch typically ranges from $800-$1,200. For complicated pieces (chronographs, perpetual calendars, tourbillons), service costs can range from $1,500-$5,000 or more, depending on complexity. This includes complete movement disassembly, cleaning, lubrication, regulation, case refinishing, and water resistance testing. We always provide a detailed estimate before proceeding with any work. Proper maintenance ensures your timepiece will perform beautifully for generations.',
      tone: 'professional',
      context: 'Use when discussing service and maintenance costs',
      relatedReferences: [],
      priority: 8
    },
    {
      question: 'Client hesitant about making purchase decision',
      category: 'Sales',
      keywords: ['hesitant', 'unsure', 'thinking', 'decision', 'not sure'],
      answer: 'I completely understand that acquiring a Vacheron Constantin timepiece is a significant decision. This is an investment piece that will accompany you through life\'s most important moments and can be passed down through generations. Please take all the time you need to consider which piece resonates with you. I\'m here to provide any additional information you may need - whether it\'s about the technical specifications, the heritage of a particular collection, or arranging a private viewing. There\'s absolutely no pressure; when the right timepiece finds you, you\'ll know. Would it be helpful if I prepared some additional materials for your consideration?',
      tone: 'empathetic',
      context: 'Use when client shows hesitation or needs more time',
      relatedReferences: [],
      priority: 10
    }
  ];

  try {
    for (const faq of faqs) {
      const existing = await storage.searchFaqs(faq.question);
      if (existing.length === 0) {
        await storage.createFaq(faq);
        console.log(`  ✅ Added FAQ: ${faq.category} - ${faq.question.substring(0, 50)}...`);
      } else {
        console.log(`  ⏭️  FAQ already exists: ${faq.question.substring(0, 50)}...`);
      }
    }
    console.log(`✅ FAQ database seeding complete!`);
  } catch (error) {
    console.error('❌ Error seeding FAQ database:', error);
  }
}

export async function seedCatalogData() {
  await seedWatchCatalog();
  await seedFaqDatabase();
}
