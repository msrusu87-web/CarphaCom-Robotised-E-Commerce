/**
 * Business Categories — Complete Romanian market taxonomy
 * Each category has subcategories with search keywords in Romanian
 * Used by the scraping engine to build targeted search queries
 * NOTE: Keywords intentionally kept in Romanian — they are search queries for Romanian business directories
 */

export interface SubCategory {
  id: string
  name: string
  keywords: string[]
}

export interface BusinessCategory {
  id: string
  name: string
  icon: string  // emoji
  description: string
  subcategories: SubCategory[]
}

export const BUSINESS_CATEGORIES_FULL: BusinessCategory[] = [
  {
    id: 'transport',
    name: 'Transport & Logistics',
    icon: '🚛',
    description: 'Freight transport, courier, logistics companies',
    subcategories: [
      { id: 'transport-rutier', name: 'Road Freight Transport', keywords: ['transport rutier marfa', 'transport marfa romania', 'firma transport marfa', 'camioane transport'] },
      { id: 'transport-international', name: 'International Transport', keywords: ['transport international', 'transport marfa international', 'transport TIR europa'] },
      { id: 'curierat', name: 'Courier & Parcel Delivery', keywords: ['firma curierat', 'servicii curierat', 'livrare colete', 'curier rapid'] },
      { id: 'curierat-mare', name: 'Heavy Freight (TIR/Trucks)', keywords: ['transport camioane mari', 'firma TIR', 'transport agabaritic', 'flota camion'] },
      { id: 'taxi', name: 'Taxi & Passenger Transport', keywords: ['firma taxi', 'transport persoane', 'taxi romania', 'transport privat persoane'] },
      { id: 'transport-aerian', name: 'Air Transport', keywords: ['transport aerian marfa', 'cargo aerian', 'expeditii aeriene', 'transport avion'] },
      { id: 'transport-maritim', name: 'Maritime & River Transport', keywords: ['transport maritim', 'transport naval', 'shipping romania', 'transport fluvial dunare'] },
      { id: 'transport-feroviar', name: 'Rail Transport', keywords: ['transport feroviar', 'transport cale ferata', 'vagoane marfa', 'transport tren'] },
      { id: 'logistica', name: 'Logistics & Warehousing', keywords: ['logistica romania', 'depozitare marfa', 'warehouse romania', 'centru logistic'] },
      { id: 'mutari', name: 'Moving & Relocation', keywords: ['firma mutari', 'mutari mobila', 'relocari birouri', 'mutari internationale'] },
      { id: 'inchirieri-auto', name: 'Car Rental & Fleets', keywords: ['inchirieri auto', 'rent a car romania', 'leasing auto', 'flota auto firma'] },
      { id: 'expeditii', name: 'Forwarding & Freight', keywords: ['expeditii marfa', 'freight forwarder romania', 'casa expeditii', 'agent expeditie'] },
    ],
  },
  {
    id: 'constructii',
    name: 'Construction & Real Estate',
    icon: '🏗️',
    description: 'Construction companies, materials, installations',
    subcategories: [
      { id: 'constructii-civile', name: 'Civil Construction', keywords: ['firma constructii', 'constructii civile', 'antreprenor constructii'] },
      { id: 'constructii-industriale', name: 'Industrial Construction', keywords: ['constructii industriale', 'hale metalice', 'constructii depozite'] },
      { id: 'materiale', name: 'Construction Materials', keywords: ['materiale constructii', 'depozit materiale', 'ciment caramida'] },
      { id: 'instalatii', name: 'Plumbing & Heating', keywords: ['instalatii sanitare', 'instalatii termice', 'instalator autorizat'] },
      { id: 'electrician', name: 'Electrical Installations', keywords: ['electrician autorizat', 'instalatii electrice', 'firma electricitate'] },
      { id: 'finisaje', name: 'Finishing & Interior Design', keywords: ['finisaje interioare', 'amenajari interioare', 'zugraveli decoratiuni'] },
      { id: 'drumuri', name: 'Infrastructure & Roads', keywords: ['constructii drumuri', 'asfaltare', 'infrastructura rutiera'] },
      { id: 'demolari', name: 'Demolition & Excavation', keywords: ['demolari constructii', 'excavatii terasamente', 'sapaturi fundatii'] },
      { id: 'imobiliare', name: 'Real Estate Agencies', keywords: ['agentie imobiliara', 'imobiliare romania', 'vanzari apartamente'] },
      { id: 'arhitectura', name: 'Architecture & Design', keywords: ['birou arhitectura', 'proiectare constructii', 'design interior'] },
    ],
  },
  {
    id: 'auto',
    name: 'Auto & Service',
    icon: '🚗',
    description: 'Auto services, parts, MOT, tire shops',
    subcategories: [
      { id: 'service-auto', name: 'General Auto Service', keywords: ['service auto', 'reparatii auto', 'atelier auto'] },
      { id: 'piese-auto', name: 'Auto Parts & Accessories', keywords: ['piese auto', 'magazin piese auto', 'dezmembrari auto'] },
      { id: 'vulcanizare', name: 'Tire Shop & Tires', keywords: ['vulcanizare', 'anvelope auto', 'schimb anvelope'] },
      { id: 'spalatorie', name: 'Car Wash', keywords: ['spalatorie auto', 'detailing auto', 'polish auto'] },
      { id: 'itp', name: 'MOT & Technical Inspections', keywords: ['statie ITP', 'inspectie tehnica periodica', 'verificare auto'] },
      { id: 'tractari', name: 'Towing & Roadside Assistance', keywords: ['tractari auto', 'asistenta rutiera', 'platforma auto'] },
      { id: 'vopsitorie', name: 'Body Shop & Paint', keywords: ['vopsitorie auto', 'tinichigerie auto', 'reparatii caroserie'] },
      { id: 'autoutilitare', name: 'Commercial Vehicles & Trucks', keywords: ['vanzare camioane', 'autoutilitare', 'vehicule comerciale'] },
    ],
  },
  {
    id: 'securitate',
    name: 'Security & Guard',
    icon: '🛡️',
    description: 'Guard companies, surveillance systems, alarms',
    subcategories: [
      { id: 'paza', name: 'Guard & Protection', keywords: ['firma paza', 'servicii paza', 'agent securitate'] },
      { id: 'supraveghere', name: 'Video Surveillance Systems', keywords: ['camere supraveghere', 'sisteme CCTV', 'monitorizare video'] },
      { id: 'alarme', name: 'Alarm Systems', keywords: ['sisteme alarma', 'alarma casa', 'alarma antiefractie'] },
      { id: 'control-acces', name: 'Access Control', keywords: ['control acces', 'sisteme pontaj', 'interfon video'] },
      { id: 'detectie-incendiu', name: 'Fire Detection & Safety', keywords: ['detectie incendiu', 'sisteme PSI', 'stingatoare'] },
      { id: 'securitate-it', name: 'Cybersecurity', keywords: ['securitate cibernetica', 'protectie date', 'cybersecurity firma'] },
    ],
  },
  {
    id: 'horeca',
    name: 'HoReCa',
    icon: '🍽️',
    description: 'Restaurants, hotels, catering, cafes',
    subcategories: [
      { id: 'restaurante', name: 'Restaurants', keywords: ['restaurant romania', 'restaurante bucuresti', 'restaurant traditional'] },
      { id: 'hoteluri', name: 'Hotels & Guesthouses', keywords: ['hotel romania', 'pensiune turistica', 'cazare romania'] },
      { id: 'catering', name: 'Catering & Events', keywords: ['catering evenimente', 'firma catering', 'meniu corporate'] },
      { id: 'cafenele', name: 'Cafes & Bars', keywords: ['cafenea', 'bar cocktail', 'pub restaurant'] },
      { id: 'fast-food', name: 'Fast Food & Delivery', keywords: ['fast food', 'livrare mancare', 'food delivery'] },
      { id: 'cofetarii', name: 'Bakeries & Pastry Shops', keywords: ['cofetarie', 'patiserie', 'torturi personalizate'] },
      { id: 'echipamente-horeca', name: 'HoReCa Equipment', keywords: ['echipamente horeca', 'dotari restaurant', 'utilaje bucatarie'] },
    ],
  },
  {
    id: 'retail',
    name: 'Retail & Commerce',
    icon: '🏪',
    description: 'Stores, supermarkets, wholesale',
    subcategories: [
      { id: 'magazine', name: 'Stores & Retail', keywords: ['magazin romania', 'retail romania', 'comert cu amanuntul'] },
      { id: 'en-gros', name: 'Wholesale Trade', keywords: ['en gros romania', 'distribuitor romania', 'angro produse'] },
      { id: 'alimentare', name: 'Grocery Stores', keywords: ['magazin alimentar', 'bacanie', 'minimarket'] },
      { id: 'online', name: 'Online Stores / E-Commerce', keywords: ['magazin online romania', 'ecommerce romania', 'vanzari online'] },
      { id: 'electrocasnice', name: 'Electrical & Electronics', keywords: ['magazin electronice', 'electrocasnice', 'tehnica'] },
      { id: 'mobilier', name: 'Furniture & Decorations', keywords: ['magazin mobila', 'mobilier romania', 'decoratiuni interioare'] },
    ],
  },
  {
    id: 'it',
    name: 'IT & Telecommunications',
    icon: '💻',
    description: 'IT companies, software, telecommunications, hosting',
    subcategories: [
      { id: 'software', name: 'Software Development', keywords: ['firma software romania', 'dezvoltare aplicatii', 'programare web'] },
      { id: 'web-design', name: 'Web Design & Marketing', keywords: ['web design romania', 'agentie digitala', 'marketing online'] },
      { id: 'hosting', name: 'Hosting & Cloud', keywords: ['hosting romania', 'server dedicat', 'cloud computing'] },
      { id: 'reparatii-it', name: 'IT Repairs & Service', keywords: ['service calculatoare', 'reparatii laptop', 'service IT'] },
      { id: 'telecom', name: 'Telecommunications', keywords: ['telecomunicatii firma', 'centrala telefonica', 'telefonie IP'] },
      { id: 'retele', name: 'Networks & IT Infrastructure', keywords: ['retele calculatoare', 'infrastructura IT', 'cablare structurata'] },
    ],
  },
  {
    id: 'agricultura',
    name: 'Agriculture & Farms',
    icon: '🌾',
    description: 'Farms, agricultural machinery, agricultural products',
    subcategories: [
      { id: 'ferme', name: 'Farms & Homesteads', keywords: ['ferma animale', 'ferma legume', 'gospodarie romania'] },
      { id: 'utilaje-agricole', name: 'Agricultural Machinery', keywords: ['utilaje agricole', 'tractoare romania', 'masini agricole'] },
      { id: 'seminte', name: 'Seeds & Fertilizers', keywords: ['seminte romania', 'ingrasaminte', 'produse fitosanitare'] },
      { id: 'cereale', name: 'Cereals & Oilseeds', keywords: ['cereale romania', 'grau porumb', 'oleaginoase'] },
      { id: 'irigatii', name: 'Irrigation Systems', keywords: ['irigatii', 'sisteme irigatii', 'pompe apa agricola'] },
      { id: 'apicultura', name: 'Beekeeping & Organic Products', keywords: ['apicultura', 'miere romania', 'produse bio ferma'] },
    ],
  },
  {
    id: 'sanatate',
    name: 'Health & Medical',
    icon: '🏥',
    description: 'Clinics, medical offices, pharmacies, dentistry',
    subcategories: [
      { id: 'clinici', name: 'Private Clinics & Hospitals', keywords: ['clinica privata', 'spital privat', 'centru medical'] },
      { id: 'stomatologie', name: 'Dentistry', keywords: ['cabinet stomatologic', 'dentist', 'implant dentar'] },
      { id: 'farmacii', name: 'Pharmacies', keywords: ['farmacie romania', 'farmacie online', 'produse farmaceutice'] },
      { id: 'oftalmologie', name: 'Ophthalmology & Optics', keywords: ['oftalmologie', 'optica medicala', 'lentile ochelari'] },
      { id: 'recuperare', name: 'Recovery & Physiotherapy', keywords: ['fizioterapie', 'recuperare medicala', 'kinetoterapie'] },
      { id: 'laborator', name: 'Analysis Laboratories', keywords: ['laborator analize', 'analize medicale', 'recoltare sange'] },
      { id: 'veterinar', name: 'Veterinary Clinics', keywords: ['cabinet veterinar', 'clinica veterinara', 'medic veterinar'] },
    ],
  },
  {
    id: 'educatie',
    name: 'Education & Training',
    icon: '🎓',
    description: 'Schools, universities, courses, after-school',
    subcategories: [
      { id: 'scoli-private', name: 'Private Schools & High Schools', keywords: ['scoala privata', 'liceu privat', 'invatamant privat'] },
      { id: 'cursuri', name: 'Courses & Training', keywords: ['cursuri profesionale', 'training romania', 'centru formare'] },
      { id: 'limbi-straine', name: 'Foreign Languages', keywords: ['cursuri engleza', 'scoala limbi straine', 'traduceri autorizate'] },
      { id: 'after-school', name: 'After School & Kindergartens', keywords: ['after school', 'gradinita privata', 'cresa privata'] },
      { id: 'auto-scoala', name: 'Driving Schools', keywords: ['scoala soferi', 'auto scoala', 'permis conducere'] },
    ],
  },
  {
    id: 'productie',
    name: 'Manufacturing & Industry',
    icon: '🏭',
    description: 'Factories, workshops, industrial production',
    subcategories: [
      { id: 'metalurgie', name: 'Metallurgy & Metal Processing', keywords: ['prelucrare metale', 'confectii metalice', 'sudura industriala'] },
      { id: 'mase-plastice', name: 'Plastics & Packaging', keywords: ['mase plastice', 'ambalaje romania', 'injectie plastic'] },
      { id: 'lemn', name: 'Wood Processing & Furniture', keywords: ['prelucrare lemn', 'fabrica mobila', 'tamplarie'] },
      { id: 'textile', name: 'Textiles & Clothing', keywords: ['confectii textile', 'fabrica haine', 'croitorie industriala'] },
      { id: 'alimentar', name: 'Food Industry', keywords: ['fabrica produse alimentare', 'procesare alimente', 'conserve'] },
      { id: 'chimic', name: 'Chemical Industry', keywords: ['industrie chimica', 'produse chimice', 'detergenti industriali'] },
    ],
  },
  {
    id: 'turism',
    name: 'Tourism & Recreation',
    icon: '✈️',
    description: 'Travel agencies, guides, recreation',
    subcategories: [
      { id: 'agentii-turism', name: 'Travel Agencies', keywords: ['agentie turism', 'bilete avion', 'vacante romania'] },
      { id: 'ghizi', name: 'Tour Guides', keywords: ['ghid turistic', 'tur ghidat', 'excursii organizate'] },
      { id: 'agrement', name: 'Recreation & Adventure', keywords: ['parc aventura', 'agrement outdoor', 'paintball'] },
      { id: 'spa', name: 'SPA & Wellness', keywords: ['spa wellness', 'centru spa', 'relaxare masaj'] },
      { id: 'inchirieri-turistice', name: 'Tourist Rentals', keywords: ['inchiriere biciclete', 'ATV inchiriere', 'echipament ski'] },
    ],
  },
  {
    id: 'juridic',
    name: 'Legal & Financial',
    icon: '⚖️',
    description: 'Lawyers, notaries, accounting, consulting',
    subcategories: [
      { id: 'avocatura', name: 'Law Office', keywords: ['avocat romania', 'cabinet avocat', 'consultanta juridica'] },
      { id: 'notariat', name: 'Notary Offices', keywords: ['notar public', 'birou notarial', 'legalizare acte'] },
      { id: 'contabilitate', name: 'Accounting & Audit', keywords: ['firma contabilitate', 'expert contabil', 'audit financiar'] },
      { id: 'consultanta-fiscala', name: 'Tax Consulting', keywords: ['consultanta fiscala', 'planificare fiscala', 'declaratii fiscale'] },
      { id: 'executori', name: 'Bailiffs', keywords: ['executor judecatoresc', 'executare silita', 'birou executor'] },
      { id: 'asigurari', name: 'Insurance', keywords: ['firma asigurari', 'broker asigurari', 'polita asigurare'] },
    ],
  },
  {
    id: 'sport',
    name: 'Sports & Fitness',
    icon: '⚽',
    description: 'Fitness gyms, sports clubs, sports stores',
    subcategories: [
      { id: 'fitness', name: 'Fitness Gyms', keywords: ['sala fitness', 'gym romania', 'antrenament personal'] },
      { id: 'cluburi-sportive', name: 'Sports Clubs', keywords: ['club sportiv', 'scoala sport', 'competitii sportive'] },
      { id: 'echipamente-sport', name: 'Sports Equipment', keywords: ['magazin sport', 'echipament sportiv', 'articole sportive'] },
      { id: 'piscine', name: 'Pools & Water Parks', keywords: ['piscina', 'aqua park', 'natatie'] },
      { id: 'arte-martiale', name: 'Martial Arts', keywords: ['arte martiale', 'karate', 'kickboxing sala'] },
    ],
  },
  {
    id: 'energie',
    name: 'Energy & Environment',
    icon: '⚡',
    description: 'Solar energy, recycling, utilities',
    subcategories: [
      { id: 'solar', name: 'Solar Panels & Photovoltaic', keywords: ['panouri solare', 'sistem fotovoltaic', 'energie solara firma'] },
      { id: 'reciclare', name: 'Recycling & Waste', keywords: ['reciclare deseuri', 'colectare deseuri', 'firma salubrizare'] },
      { id: 'climatizare', name: 'HVAC & Air Conditioning', keywords: ['aer conditionat', 'climatizare', 'ventilatie industriala'] },
      { id: 'gaze', name: 'Gas Installations', keywords: ['instalatii gaze', 'centrala termica', 'incalzire casa'] },
      { id: 'apa', name: 'Water Treatment & Drilling', keywords: ['tratare apa', 'foraj put', 'statie epurare'] },
    ],
  },
  {
    id: 'curatenie',
    name: 'Cleaning & Services',
    icon: '🧹',
    description: 'Cleaning, pest control, building maintenance',
    subcategories: [
      { id: 'curatenie-profesionala', name: 'Professional Cleaning', keywords: ['firma curatenie', 'curatenie birouri', 'curatenie industriala'] },
      { id: 'ddd', name: 'Pest Control & Disinfection', keywords: ['dezinsectie', 'deratizare', 'dezinfectie firma'] },
      { id: 'spalatorie-covoare', name: 'Carpet Cleaning', keywords: ['spalatorie covoare', 'curatare canapele', 'curatare tapiterie'] },
      { id: 'intretinere', name: 'Building Maintenance', keywords: ['intretinere cladiri', 'administrare imobile', 'facility management'] },
    ],
  },
  {
    id: 'publicitate',
    name: 'Advertising & Media',
    icon: '📢',
    description: 'Advertising agencies, print shops, PR',
    subcategories: [
      { id: 'agentii-pub', name: 'Advertising Agencies', keywords: ['agentie publicitate', 'reclama firma', 'branding romania'] },
      { id: 'tipografii', name: 'Print Shops', keywords: ['tipografie', 'print romania', 'imprimerie digitala'] },
      { id: 'productie-media', name: 'Media & Video Production', keywords: ['productie video', 'filmare drona', 'studio foto'] },
      { id: 'seo-marketing', name: 'SEO & Digital Marketing', keywords: ['agentie SEO', 'marketing digital', 'social media management'] },
      { id: 'events', name: 'Event Planning', keywords: ['organizare evenimente', 'event planner', 'sonorizare lumini'] },
    ],
  },
]

/**
 * Flatten categories + subcategories into a flat keyword map
 * for the scraping engine
 */
export function getCategoryKeywords(categoryId: string, subcategoryIds?: string[]): string[] {
  const cat = BUSINESS_CATEGORIES_FULL.find(c => c.id === categoryId)
  if (!cat) return [categoryId]

  const keywords: string[] = []

  if (!subcategoryIds || subcategoryIds.length === 0) {
    // Use all subcategories
    for (const sub of cat.subcategories) {
      keywords.push(...sub.keywords)
    }
  } else {
    for (const subId of subcategoryIds) {
      const sub = cat.subcategories.find(s => s.id === subId)
      if (sub) keywords.push(...sub.keywords)
    }
  }

  return keywords
}

/**
 * Get a flat list for backward compatibility with BUSINESS_CATEGORIES
 */
export function getFlatCategories(): { id: string; name: string; keywords: string[] }[] {
  return BUSINESS_CATEGORIES_FULL.map(cat => ({
    id: cat.id,
    name: cat.name,
    keywords: cat.subcategories.flatMap(s => s.keywords).slice(0, 4),
  }))
}
