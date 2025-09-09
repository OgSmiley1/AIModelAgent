// Utility to parse Vacheron Constantin watch data
export interface VacheronWatchData {
  modelCode: string;
  referenceNumber: string;
  description: string;
  price: string;
  priceNumeric?: number;
  available: boolean;
  statusFlag1: boolean;
  statusFlag2: boolean;
  collection?: string;
  category?: string;
  material?: string;
  complications?: string[];
  priority?: string;
}

export function parseVacheronWatchLine(line: string): VacheronWatchData | null {
  // Parse a line from the watch data file
  // Format: VMX40G130C      4017C/000G-130C Regulator perpetual calendar - Jewellery        6,000,000 AED   YES     TRUE    TRUE
  
  if (!line.trim() || line.trim().length < 10) return null;
  
  const parts = line.split(/\s{2,}|\t+/); // Split on multiple spaces or tabs
  if (parts.length < 6) return null;
  
  const modelCode = parts[0]?.trim();
  const referenceNumber = parts[1]?.trim();
  const description = parts[2]?.trim();
  const priceStr = parts[3]?.trim();
  const availableStr = parts[4]?.trim();
  const statusFlag1Str = parts[5]?.trim();
  const statusFlag2Str = parts[6]?.trim();
  
  if (!modelCode || !referenceNumber || !description) return null;
  
  // Parse price
  let priceNumeric: number | undefined;
  if (priceStr && priceStr !== "NA") {
    const numericPrice = priceStr.replace(/[^\d]/g, "");
    if (numericPrice) {
      priceNumeric = parseInt(numericPrice, 10);
    }
  }
  
  // Parse availability
  const available = availableStr?.toUpperCase() === "YES";
  const statusFlag1 = statusFlag1Str?.toUpperCase() === "TRUE";
  const statusFlag2 = statusFlag2Str?.toUpperCase() === "TRUE";
  
  // Extract collection and category from description
  const { collection, category, material, complications } = extractWatchDetails(description);
  
  // Determine priority based on price and flags
  let priority = "medium";
  if (priceNumeric && priceNumeric >= 1000000) priority = "exclusive";
  else if (priceNumeric && priceNumeric >= 500000) priority = "high";
  else if (statusFlag1 && statusFlag2) priority = "high";
  
  return {
    modelCode,
    referenceNumber,
    description,
    price: priceStr || "Price on request",
    priceNumeric,
    available,
    statusFlag1,
    statusFlag2,
    collection,
    category,
    material,
    complications,
    priority
  };
}

function extractWatchDetails(description: string) {
  let collection = "";
  let category = "";
  let material = "";
  const complications: string[] = [];
  
  const desc = description.toLowerCase();
  
  // Extract collection
  if (desc.includes("overseas")) collection = "Overseas";
  else if (desc.includes("traditionnelle")) collection = "Traditionnelle";
  else if (desc.includes("patrimony")) collection = "Patrimony";
  else if (desc.includes("fiftysix")) collection = "FiftySix";
  else if (desc.includes("historiques")) collection = "Historiques";
  else if (desc.includes("égérie")) collection = "Égérie";
  else if (desc.includes("métiers d'art")) collection = "Métiers d'Art";
  else if (desc.includes("heures créatives")) collection = "Heures Créatives";
  
  // Extract category/movement type
  if (desc.includes("self-winding")) category = "Self-winding";
  else if (desc.includes("manual-winding")) category = "Manual-winding";
  else if (desc.includes("tourbillon")) category = "Tourbillon";
  else if (desc.includes("chronograph")) category = "Chronograph";
  else if (desc.includes("perpetual calendar")) category = "Perpetual Calendar";
  else if (desc.includes("minute repeater")) category = "Minute Repeater";
  else if (desc.includes("dual time")) category = "Dual Time";
  else if (desc.includes("moon phase")) category = "Moon Phase";
  else if (desc.includes("quartz")) category = "Quartz";
  
  // Extract material
  if (desc.includes("000g") || desc.includes("white gold")) material = "White Gold";
  else if (desc.includes("000r") || desc.includes("rose gold") || desc.includes("pink gold")) material = "Rose Gold";
  else if (desc.includes("000p") || desc.includes("platinum")) material = "Platinum";
  else if (desc.includes("000a") || desc.includes("steel")) material = "Stainless Steel";
  else if (desc.includes("000j") || desc.includes("yellow gold")) material = "Yellow Gold";
  else if (desc.includes("000t") || desc.includes("titanium")) material = "Titanium";
  
  // Extract complications
  if (desc.includes("perpetual calendar")) complications.push("Perpetual Calendar");
  if (desc.includes("tourbillon")) complications.push("Tourbillon");
  if (desc.includes("chronograph")) complications.push("Chronograph");
  if (desc.includes("minute repeater")) complications.push("Minute Repeater");
  if (desc.includes("dual time")) complications.push("Dual Time");
  if (desc.includes("moon phase")) complications.push("Moon Phase");
  if (desc.includes("retrograde")) complications.push("Retrograde");
  if (desc.includes("skeleton")) complications.push("Skeleton");
  if (desc.includes("ultra-thin")) complications.push("Ultra-thin");
  if (desc.includes("openworked")) complications.push("Openworked");
  if (desc.includes("regulator")) complications.push("Regulator");
  if (desc.includes("astronomical")) complications.push("Astronomical");
  if (desc.includes("jewellery") || desc.includes("high jewellery")) complications.push("Jewellery");
  
  return { collection, category, material, complications };
}

// Complete Vacheron Constantin watch dataset
export function getFullVacheronWatchDataset(): VacheronWatchData[] {
  const watchDataLines = [
    "VMX40G130C      4017C/000G-130C Regulator perpetual calendar - Jewellery        6,000,000 AED   YES     TRUE    TRUE",
    "VMX24G160C      2400C/000G-160C Miniature - Ode to Izanagi      6,000,000 AED   No              FALSE",
    "VMX98R202C      9890C/000R-202C Armillary tourbillon - Ode to Chronos   6,000,000 AED   No              FALSE",
    "VMX97R212C      9720C/000R-212C Celestia astronomical grand complication        6,000,000 AED   No              FALSE",
    "                        6,000,000 AED   No              FALSE",
    "VMX80R246C      80172/000R-246C Minute repeater perpetual calendar - Ornamental NA      No              FALSE",
    "VMX82PH063      82035/000P-H063 Historiques American 1921 - Arabic      192,000 AED     No              FALSE",
    "                        192,000 AED     No              FALSE",
    "VMX42AB934      4200H/222A-B934 Historiques 222 121,000 AED     No              FALSE",
    "                        121,000 AED     No              FALSE",
    "VMX60GH067      6057T/000G-H067 Traditionnelle tourbillon high jewellery        2,720,000 AED   No              FALSE",
    "                        2,720,000 AED   No              FALSE",
    "VMX85JH069      85180/000J-H069 Patrimony self-winding  134,000 AED     No              FALSE",
    "                        134,000 AED     No              FALSE",
    "VMX46RH101      4600E/000R-H101 Fiftysix self-winding   96,500 AED      YES     TRUE    TRUE",
    "                        96,500 AED      No              FALSE",
    "VMX24RH024      2400A/000R-H024 Métiers d'Art Tribute to traditional symbols - Eternal flow     560,000 AED     No              FALSE",
    "VMX24RH022      2405A/000R-H022 Métiers d'Art Tribute to traditional symbols - Moonlight slivers        560,000 AED     No              FALSE",
    "VMX24GH023      2400A/000G-H023 Métiers d'Art Tribute to traditional symbols - Eternal flow     560,000 AED     No              FALSE",
    "VMX24GH021      2405A/000G-H021 Métiers d'Art Tribute to traditional symbols - Moonlight slivers        560,000 AED     No              FALSE",
    "VMX86RH034      86073/000R-H034 Métiers d'Art The legend of the Chinese zodiac - year of the snake      560,000 AED     No              FALSE",
    "VMX86PH033      86073/000P-H033 Métiers d'Art The legend of the Chinese zodiac - year of the snake      620,000 AED     No              FALSE",
    "VMX43RC642      4300V/220R-B642 Overseas perpetual calendar ultra-thin skeleton 605,000 AED     No              FALSE",
    "VMX43RC547      4300V/220R-B547 Overseas perpetual calendar ultra-thin skeleton 605,000 AED     No              FALSE",
    "VMX43RC509      4300V/220R-B509 Overseas perpetual calendar ultra-thin  442,000 AED     No              FALSE",
    "VMX43RC064      4300V/220R-B064 Overseas perpetual calendar ultra-thin  442,000 AED     YES     TRUE    TRUE",
    "VMX43GC946      4300V/220G-B946 Overseas perpetual calendar ultra-thin skeleton 605,000 AED     YES     TRUE    TRUE",
    "VMX43GC945      4300V/220G-B945 Overseas perpetual calendar ultra-thin  442,000 AED     YES     TRUE    TRUE",
    "VMX60GC955      6007V/210G-B955 Overseas tourbillon high jewellery      1,020,000 AED   YES     TRUE    TRUE",
    "VMX60TH032      6000V/210T-H032 Overseas tourbillon     580,000 AED     No              FALSE",
    "VMX79RC965      7920V/210R-B965 Overseas dual time Green        286,000 AED     YES     TRUE    TRUE",
    "VMX55RC966      5520V/210R-B966 Overseas chronograph Pink Gold  299,000 AED     No              FALSE",
    "VMX46RC969      4605V/200R-B969 Overseas self-winding Green Diamonds - Pink Gold        220,000 AED     No              FALSE",
    "VMX45RC967      4520V/210R-B967 Overseas self-winding Green     229,000 AED     YES     TRUE    TRUE",
    "VMX46RH134      4600V/200R-H134 Overseas self-winding   196,000 AED     No              FALSE",
    "VMX40GH070      4010U/000G-H070 Patrimony moon phase retrograde date    187,000 AED     No              FALSE",
    "VMX12GH094      1208J/118G-H094 Grand Lady Kalla        5,350,000 AED   No              FALSE",
    "VMX82RH008      82172/000R-H008 Traditionnelle manual-winding   89,500 AED      No              FALSE",
    "VMX40R143C      4017C/000R-143C Regulator perpetual calendar - Jewellery        NA      No              FALSE",
    "VMX40G146C      4017C/000G-146C Regulator perpetual calendar - Jewellery        NA      No              FALSE",
    "VMX97G134C      9720C/000G-134C Celestia Astronomical Grand Complication (Set for Riyadh)       6,000,000 AED   No              FALSE",
    "VMX66G132C      6620C/000G-132C Astronomical striking grand complication        8,550,000 AED   No              FALSE",
    "VMX75RB994      7500U/000R-B994 Métiers d'Art Tribute to Explorer Naturalists - Cap de Bonne-Espérance  675,000 AED     No              FALSE",
    "VMX75GB991      7500U/000G-B991 Métiers d'Art Tribute to Explorer Naturalists - Cap-Vert        675,000 AED     No              FALSE",
    "VMX41GB909      4116U/000G-B909 Patrimony self-winding jewellery        310,000 AED     No              FALSE",
    "VMX12RC592      1225V/000R-B592 Overseas quartz 125,000 AED     YES     TRUE    TRUE",
    "VMX12AC590      1225V/200A-B590 Overseas quartz 62,500 AED      No              FALSE",
    "VMX46RC979      4600V/200R-B979 Overseas self-winding Blue 34.5 mm      196,000 AED     YES     TRUE    TRUE",
    "VMX46RC978      4605V/200R-B978 Overseas self-winding Blue 35 mm        220,000 AED     YES     TRUE    TRUE",
    "VMX46RC968      4605V/200R-B968 Overseas self-winding Pink Gold         220,000 AED     No              FALSE",
    "VMX46AC980      4600V/200A-B980 Overseas self-winding   87,500 AED      No              FALSE",
    "VMX46AC971      4605V/200A-B971 Overseas self-winding   116,000 AED     No              FALSE",
    "VMX45RC705      4520V/210R-B705 Overseas self-winding   229,000 AED     No              FALSE",
    "VMX45AC483      4520V/210A-B483 Overseas self-winding   94,500 AED      No              FALSE",
    "VMX45AC128      4520V/210A-B128 Overseas self-winding   94,500 AED      No              FALSE",
    "VMX45AC126      4520V/210A-B126 Overseas self-winding   94,500 AED      No              FALSE",
    "VMX79RC336      7920V/000R-B336 Overseas dual time      184,000 AED     No              FALSE",
    "VMX79AC546      7920V/210A-B546 Overseas dual time Black        117,000 AED     No              FALSE",
    "VMX79AC334      7920V/210A-B334 Overseas dual time Blue 117,000 AED     No              FALSE",
    "VMX79AC333      7920V/210A-B333 Overseas dual time Silver       117,000 AED     No              FALSE",
    "VMX60TC935      6000V/210T-B935 Overseas tourbillon skeleton - Titanium 42.5 mm 735,000 AED     No              FALSE",
    "VMX60RC934      6000V/210R-B934 Overseas tourbillon skeleton    840,000 AED     YES     TRUE    TRUE",
    "VMX60RC733      6000V/210R-B733 Overseas tourbillon     680,000 AED     No              FALSE",
    "VMX55RC952      5520V/210R-B952 Overseas chronograph    299,000 AED     No              FALSE",
    "VMX55AC686      5520V/210A-B686 Overseas chronograph    135,000 AED     YES     TRUE    TRUE",
    "VMX55AC481      5520V/210A-B481 Overseas chronograph    135,000 AED     YES     TRUE    TRUE",
    "VMX55AC148      5520V/210A-B148 Overseas chronograph    135,000 AED     YES     TRUE    TRUE",
    "VMX86RB983      86073/000R-B983 Métiers d'Art The legend of the Chinese zodiac - year of the dragon     448,000 AED     No              FALSE",
    "VMX86PB982      86073/000P-B982 Métiers d'Art The legend of the Chinese zodiac - year of the dragon     545,000 AED     No              FALSE",
    "VMX40PH003      4000U/000P-H003 Patrimony retrograde day-date   234,000 AED     YES     TRUE    TRUE",
    "VMX98G078C      9827C/000G-078C Armillary tourbillon perpetual calendar - Planetaria Jewellery  NA      No              FALSE",
    "VMX89G095C      89667/000G-095C 14-day Openworked tourbillon - High Jewellery   NA      No              FALSE",
    "VMX97G015C      9727C/000G-015C Celestia Astronomical Grand Complication - High Jewellery       NA      No              FALSE",
    "VMX66R127C      6605C/000R-127C Minute repeater Grand feu enamel - Jewellery    NA      No              FALSE",
    "VMX97P126C      9720C/000P-126C Celestia Astronomical Grand Complication (set for Dubai)        6,500,000 AED   YES     TRUE    TRUE",
    "VMX55A3161      5500V/110A-B686 Overseas chronograph    135,000 AED     No              FALSE",
    "VMX40AC911      4000V/210A-B911 Overseas moon phase retrograde date     166,000 AED     No              FALSE",
    "VMX43RB947      4305T/000R-B947 Traditionnelle perpetual calendar ultra-thin    336,000 AED     No              FALSE",
    "VMX14R3071      1405T/000R-B636 Traditionnelle manual-winding   112,000 AED     No              FALSE",
    "VMX70GB913      7006T/000G-B913 Traditionnelle moon phase       310,000 AED     No              FALSE",
    "VMX60RB961      6040T/000R-B961 Traditionnelle tourbillon       755,000 AED     No              FALSE",
    "VMX60RB960      6040T/000R-B960 Traditionnelle tourbillon       755,000 AED     No              FALSE",
    "VMX60RB959      6040T/000R-B959 Traditionnelle tourbillon       755,000 AED     No              FALSE",
    "VMX60R3061      6010T/000R-B638 Traditionnelle tourbillon retrograde date openface      650,000 AED     No              FALSE",
    "VMX60PH025      6000T/000P-H025 Traditionnelle tourbillon       650,000 AED     No              FALSE",
    "VMX12RB984      1205F/000R-B984 Égérie quartz   81,000 AED      No              FALSE",
    "VMX80GB942      8006F/000G-B942 Égérie Creative Edition 428,000 AED     No              FALSE",
    "VMX80RB958      8005F/000R-B958 Égérie moon phase       149,000 AED     No              FALSE",
    "VMX46RB957      4605F/000R-B957 Égérie self-winding     129,000 AED     No              FALSE",
    "VMX80RB977      8016F/127R-B977 Égérie moon phase jewellery     785,000 AED     No              FALSE",
    "VMX80RB976      8006F/000R-B976 Égérie moon phase       310,000 AED     No              FALSE",
    "VMX80RH002      8005F/120R-H002 Égérie moon phase       215,000 AED     No              FALSE",
    "VMX55RB952      5500V/110R-B952 Overseas chronograph    299,000 AED     No              FALSE",
    "VMX76RB927      7620A/000R-B927 Métiers d'Art Tribute to great civilisations - Grand sphinx de Tanis    NA      No              FALSE",
    "VMX76RB926      7620A/000R-B926 Métiers d'Art Tribute to great civilisations - Lion de Darius   NA      No              FALSE",
    "VMX76GB929      7620A/000G-B929 Métiers d'Art Tribute to great civilisations - Buste d'Auguste  NA      No              FALSE",
    "VMX76GB928      7620A/000G-B928 Métiers d'Art Tribute to great civilisations - Victoire de Samothrace   NA      No              FALSE",
    "VMX86RB933      86073/000R-B933 Métiers d'Art The legend of the Chinese zodiac - year of the rabbit     448,000 AED     No              FALSE",
    "VMX86PB932      86073/000P-B932 Métiers d'Art The legend of the Chinese zodiac - year of the rabbit     545,000 AED     No              FALSE",
    "VMX41RB907      4115U/000R-B907 Patrimony self-winding  138,000 AED     No              FALSE",
    "VMX41GB908      4115U/000G-B908 Patrimony self-winding  138,000 AED     No              FALSE",
    "VMX42JB935      4200H/222J-B935 Historiques 222 279,000 AED     YES     TRUE    TRUE",
    "VMX98R079C      9820C/000R-079C Armillary tourbillon perpetual calendar - Planetaria    4,380,000 AED   No              FALSE",
    "VMX79AV546      7900V/110A-B546 Overseas dual time      117,000 AED     No              FALSE",
    "VMX79AV334      7900V/110A-B334 Overseas dual time      117,000 AED     No              FALSE",
    "VMX79AV333      7900V/110A-B333 Overseas dual time      117,000 AED     No              FALSE",
    "VMX60RV733      6000V/110R-B733 Overseas tourbillon     680,000 AED     No              FALSE",
    "VMX60AV544      6000V/110A-B544 Overseas tourbillon     515,000 AED     YES     TRUE    TRUE",
    "VMX55RV074      5500V/000R-B074 Overseas chronograph    206,000 AED     No              FALSE",
    "VMX55AV481      5500V/110A-B481 Overseas chronograph    135,000 AED     No              FALSE",
    "VMX55AV148      5500V/110A-B148 Overseas chronograph    135,000 AED     No              FALSE",
    "VMX45RV705      4500V/110R-B705 Overseas self-winding   229,000 AED     No              FALSE",
    "VMX45RV127      4500V/000R-B127 Overseas self-winding   153,000 AED     No              FALSE"
  ];
  
  const parsedWatches: VacheronWatchData[] = [];
  
  for (const line of watchDataLines) {
    const parsed = parseVacheronWatchLine(line);
    if (parsed) {
      parsedWatches.push(parsed);
    }
  }
  
  return parsedWatches;
}

// Export function to convert VacheronWatchData to InsertWatchCollection format
export function convertToWatchCollectionInsert(vacheronData: VacheronWatchData[]) {
  return vacheronData.map(watch => ({
    modelCode: watch.modelCode,
    referenceNumber: watch.referenceNumber,
    description: watch.description,
    price: watch.price,
    priceNumeric: watch.priceNumeric,
    currency: "AED",
    available: watch.available,
    statusFlag1: watch.statusFlag1,
    statusFlag2: watch.statusFlag2,
    collection: watch.collection,
    category: watch.category,
    material: watch.material,
    complications: watch.complications,
    priority: watch.priority,
    gender: "unisex"
  }));
}