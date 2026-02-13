import { NextRequest, NextResponse } from 'next/server';

const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'medusa_store',
  user: process.env.DB_USER || 'medusa',
  password: process.env.DB_PASSWORD || 'YOUR_DB_PASSWORD',
});

// COMPLETE products with ALL supplier fields - images, description, video, specs
const DEMO_PRODUCTS = [
  {
    sku: 'PNI-HP8500UV',
    name: 'Statie radio CB portabila PNI HP 8500 UV, dual band, 136-174MHz, 400-520MHz, 128CH',
    description: `<h2>Statie radio portabila PNI HP 8500 UV - Dual Band VHF/UHF</h2>
<p>Statia radio <strong>PNI HP 8500 UV</strong> este un transceiver portabil dual band, ideal pentru comunicatii profesionale si amatoristice.</p>
<h3>Caracteristici principale:</h3>
<ul>
<li>Dual band: VHF 136-174MHz si UHF 400-520MHz</li>
<li>128 canale programabile</li>
<li>Putere emisie: 5W VHF / 4W UHF</li>
<li>Display LCD iluminat cu indicator baterie</li>
<li>VOX activare vocala</li>
<li>Squelch reglabil digital</li>
<li>Scanare canale automata</li>
<li>Lanterna LED integrata</li>
<li>Radio FM 65-108MHz</li>
</ul>
<h3>Continut pachet:</h3>
<ul>
<li>1x Statie radio PNI HP 8500 UV</li>
<li>1x Antena duala</li>
<li>1x Acumulator Li-Ion 1500mAh</li>
<li>1x Incarcator cu adaptor</li>
<li>1x Clip curea</li>
<li>1x Manual utilizare</li>
</ul>`,
    manufacturer: 'PNI',
    category: 'CB Stations',
    rrp_price: 289.00,
    distribution_price: 195.00,
    ean: '5949066537001',
    weight: 0.350,
    box_size: 6,
    warranty: '24 luni',
    stock_total: 156,
    video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    images: [
      '/uploads/products/10940_0_cf006f21.jpg',
      '/uploads/products/10940_10_c286c4d5.jpg',
      '/uploads/products/10940_11_aaf74a35.jpg',
      '/uploads/products/10940_12_67f40e26.jpg'
    ],
    specifications: {
      'Frecventa VHF': '136-174 MHz',
      'Frecventa UHF': '400-520 MHz',
      'Numar canale': '128',
      'Putere emisie VHF': '5W',
      'Putere emisie UHF': '4W',
      'Impedanta': '50 Ohm',
      'Tip modulatie': 'FM',
      'Sensibilitate': '<0.25uV',
      'Acumulator': 'Li-Ion 1500mAh 7.4V',
      'Autonomie': 'pana la 12 ore',
      'Dimensiuni': '115 x 60 x 35 mm',
      'Temperatura operare': '-20°C ~ +60°C'
    },
    tiered_pricing: [
      { min_qty: 1, max_qty: 2, price_with_vat: 275 },
      { min_qty: 3, max_qty: 4, price_with_vat: 268 },
      { min_qty: 5, max_qty: 9, price_with_vat: 259 },
      { min_qty: 10, max_qty: 19, price_with_vat: 249 },
      { min_qty: 20, max_qty: null, price_with_vat: 239 }
    ]
  },
  {
    sku: 'PNI-ESCORT-HP8001L',
    name: 'Statie radio CB PNI Escort HP 8001L ASQ, 4W, 12V, reglaj squelch',
    description: `<h2>Statie radio CB PNI Escort HP 8001L ASQ</h2>
<p>Statie radio CB <strong>PNI Escort HP 8001L ASQ</strong> este perfecta pentru soferii profesionisti si amatori care doresc o comunicatie clara pe drum.</p>
<h3>Caracteristici tehnice:</h3>
<ul>
<li>Putere de emisie: 4W AM</li>
<li>Alimentare: 12V DC</li>
<li>ASQ - Squelch automat</li>
<li>40 canale EU</li>
<li>Indicator RF/S-Meter</li>
<li>Conexiune microfon 4 pini</li>
</ul>
<h3>Avantaje:</h3>
<ul>
<li>Design compact pentru montaj usor</li>
<li>Butoane iluminate pentru utilizare nocturna</li>
<li>Difuzor integrat de mare putere</li>
</ul>`,
    manufacturer: 'PNI',
    category: 'CB Stations',
    rrp_price: 199.00,
    distribution_price: 135.00,
    ean: '5949066537002',
    weight: 0.680,
    box_size: 8,
    warranty: '24 luni',
    stock_total: 234,
    video_url: 'https://www.youtube.com/embed/pni-escort-video',
    images: [
      '/uploads/products/10940_13_e60dd0c0.jpg',
      '/uploads/products/10940_0_cf006f21.jpg',
      '/uploads/products/10940_10_c286c4d5.jpg'
    ],
    specifications: {
      'Frecventa': '26.965-27.405 MHz',
      'Numar canale': '40 EU',
      'Putere emisie': '4W AM',
      'Alimentare': '12V DC',
      'Tip squelch': 'ASQ (automat)',
      'Conexiune microfon': '4 pini',
      'Impedanta antena': '50 Ohm',
      'Dimensiuni': '110 x 140 x 40 mm',
      'Greutate': '680g'
    },
    tiered_pricing: [
      { min_qty: 1, max_qty: 2, price_with_vat: 189 },
      { min_qty: 3, max_qty: 4, price_with_vat: 179 },
      { min_qty: 5, max_qty: 9, price_with_vat: 169 },
      { min_qty: 10, max_qty: null, price_with_vat: 159 }
    ]
  },
  {
    sku: 'PNI-ANTENA-ML70',
    name: 'Antena CB PNI ML70, 70cm, cu magnet inclus, 26-28MHz',
    description: `<h2>Antena CB magnetica PNI ML70</h2>
<p>Antena <strong>PNI ML70</strong> este solutia perfecta pentru cei care nu doresc montaj permanent pe vehicul.</p>
<h3>Caracteristici:</h3>
<ul>
<li>Lungime totala: 70 cm</li>
<li>Baza magnetica puternica 145mm</li>
<li>Cablu coaxial 4m inclus</li>
<li>Conector PL259</li>
<li>Frecventa: 26-28 MHz</li>
<li>Putere maxima: 150W</li>
</ul>
<p>Montaj rapid fara gauri sau modificari ale caroseriei.</p>`,
    manufacturer: 'PNI',
    category: 'Antene CB',
    rrp_price: 79.00,
    distribution_price: 52.00,
    ean: '5949066537003',
    weight: 0.420,
    box_size: 12,
    warranty: '12 luni',
    stock_total: 312,
    video_url: null,
    images: [
      '/uploads/products/10940_11_aaf74a35.jpg',
      '/uploads/products/10940_12_67f40e26.jpg'
    ],
    specifications: {
      'Frecventa': '26-28 MHz',
      'Lungime antena': '70 cm',
      'Diametru magnet': '145 mm',
      'Lungime cablu': '4 m',
      'Conector': 'PL259',
      'Putere maxima': '150W',
      'Impedanta': '50 Ohm',
      'SWR': '<1.5'
    },
    tiered_pricing: [
      { min_qty: 1, max_qty: 4, price_with_vat: 75 },
      { min_qty: 5, max_qty: 9, price_with_vat: 69 },
      { min_qty: 10, max_qty: 19, price_with_vat: 65 },
      { min_qty: 20, max_qty: null, price_with_vat: 59 }
    ]
  },
  {
    sku: 'PNI-MICROFON-DYN',
    name: 'Microfon dinamic PNI cu 6 pini, cablu 2m, pentru statii CB',
    description: `<h2>Microfon dinamic PNI 6 pini</h2>
<p>Microfon de schimb sau upgrade pentru statiile radio CB cu conexiune 6 pini.</p>
<h3>Caracteristici:</h3>
<ul>
<li>Tip: Dinamic</li>
<li>Conexiune: 6 pini</li>
<li>Cablu spiralat extensibil 2m</li>
<li>Buton PTT robust</li>
<li>Carcasa ergonomica</li>
</ul>`,
    manufacturer: 'PNI',
    category: 'Microfoane',
    rrp_price: 65.00,
    distribution_price: 42.00,
    ean: '5949066537004',
    weight: 0.180,
    box_size: 20,
    warranty: '12 luni',
    stock_total: 189,
    video_url: null,
    images: [
      '/uploads/products/10940_13_e60dd0c0.jpg',
      '/uploads/products/10940_0_cf006f21.jpg'
    ],
    specifications: {
      'Tip microfon': 'Dinamic',
      'Conexiune': '6 pini',
      'Lungime cablu': '2 m spiralat',
      'Impedanta': '500 Ohm',
      'Sensibilitate': '-65dB'
    },
    tiered_pricing: [
      { min_qty: 1, max_qty: 4, price_with_vat: 62 },
      { min_qty: 5, max_qty: 9, price_with_vat: 58 },
      { min_qty: 10, max_qty: null, price_with_vat: 52 }
    ]
  },
  {
    sku: 'PNI-CABLU-RG58-10M',
    name: 'Cablu coaxial RG58 10 metri cu conectori PL259, pentru antene CB',
    description: `<h2>Cablu coaxial RG58 - 10 metri</h2>
<p>Cablu de extensie pentru antene CB, prevazut cu conectori PL259 la ambele capete.</p>
<h3>Specificatii:</h3>
<ul>
<li>Tip cablu: RG58/U</li>
<li>Lungime: 10 metri</li>
<li>Conectori: PL259 (ambele capete)</li>
<li>Impedanta: 50 Ohm</li>
<li>Ecranare cupru impletit</li>
</ul>
<p>Ideal pentru instalatii unde este necesara o distanta mai mare intre statie si antena.</p>`,
    manufacturer: 'PNI',
    category: 'Cabluri si Conectori',
    rrp_price: 45.00,
    distribution_price: 28.00,
    ean: '5949066537005',
    weight: 0.320,
    box_size: 25,
    warranty: '12 luni',
    stock_total: 445,
    video_url: null,
    images: [
      '/uploads/products/10940_10_c286c4d5.jpg'
    ],
    specifications: {
      'Tip cablu': 'RG58/U',
      'Lungime': '10 m',
      'Impedanta': '50 Ohm',
      'Conectori': 'PL259 x2',
      'Diametru': '5 mm',
      'Ecranare': 'Cupru impletit'
    },
    tiered_pricing: [
      { min_qty: 1, max_qty: 9, price_with_vat: 42 },
      { min_qty: 10, max_qty: 24, price_with_vat: 38 },
      { min_qty: 25, max_qty: null, price_with_vat: 35 }
    ]
  },
  {
    sku: 'PNI-SUPORT-BARA',
    name: 'Suport antena PNI pentru bara de protectie, reglabil',
    description: `<h2>Suport antena pentru bara de protectie</h2>
<p>Suport metalic robust pentru montarea antenelor CB pe bara de protectie a vehiculului.</p>
<h3>Caracteristici:</h3>
<ul>
<li>Material: otel zincat</li>
<li>Unghi reglabil</li>
<li>Compatibil bare 20-50mm</li>
<li>Include conectica SO239</li>
</ul>`,
    manufacturer: 'PNI',
    category: 'Suporturi Antene',
    rrp_price: 55.00,
    distribution_price: 36.00,
    ean: '5949066537006',
    weight: 0.280,
    box_size: 15,
    warranty: '18 luni',
    stock_total: 98,
    video_url: null,
    images: [
      '/uploads/products/10940_11_aaf74a35.jpg',
      '/uploads/products/10940_12_67f40e26.jpg'
    ],
    specifications: {
      'Material': 'Otel zincat',
      'Diametru bara compatibil': '20-50 mm',
      'Conector inclus': 'SO239',
      'Unghi': 'Reglabil 0-90°'
    },
    tiered_pricing: [
      { min_qty: 1, max_qty: 4, price_with_vat: 52 },
      { min_qty: 5, max_qty: 9, price_with_vat: 48 },
      { min_qty: 10, max_qty: null, price_with_vat: 45 }
    ]
  },
  {
    sku: 'PNI-ALIMENTATOR-13V',
    name: 'Alimentator stabilizat PNI 13.8V 5A pentru statii radio',
    description: `<h2>Alimentator stabilizat 13.8V / 5A</h2>
<p>Sursa de alimentare profesionala pentru statii radio CB si echipamente 12V.</p>
<h3>Caracteristici tehnice:</h3>
<ul>
<li>Tensiune iesire: 13.8V DC stabilizat</li>
<li>Curent continuu: 5A</li>
<li>Curent varf: 7A</li>
<li>Tensiune intrare: 220V AC 50Hz</li>
<li>Protectie suprasarcina</li>
<li>Protectie scurtcircuit</li>
<li>Indicator LED functionare</li>
</ul>`,
    manufacturer: 'PNI',
    category: 'Alimentatoare',
    rrp_price: 129.00,
    distribution_price: 85.00,
    ean: '5949066537007',
    weight: 1.250,
    box_size: 4,
    warranty: '24 luni',
    stock_total: 67,
    video_url: 'https://www.youtube.com/embed/alimentator-pni',
    images: [
      '/uploads/products/10940_13_e60dd0c0.jpg',
      '/uploads/products/10940_0_cf006f21.jpg',
      '/uploads/products/10940_10_c286c4d5.jpg'
    ],
    specifications: {
      'Tensiune intrare': '220V AC 50Hz',
      'Tensiune iesire': '13.8V DC',
      'Curent continuu': '5A',
      'Curent varf': '7A',
      'Ripple': '<50mV',
      'Protectii': 'Suprasarcina, scurtcircuit',
      'Dimensiuni': '150 x 85 x 65 mm'
    },
    tiered_pricing: [
      { min_qty: 1, max_qty: 2, price_with_vat: 122 },
      { min_qty: 3, max_qty: 4, price_with_vat: 115 },
      { min_qty: 5, max_qty: 9, price_with_vat: 109 },
      { min_qty: 10, max_qty: null, price_with_vat: 99 }
    ]
  },
  {
    sku: 'PNI-CASTI-HS81',
    name: 'Casti cu microfon PNI HS81 pentru statii portabile, PTT',
    description: `<h2>Casti cu microfon PTT PNI HS81</h2>
<p>Set casti cu microfon pentru statii radio portabile, ideal pentru utilizare hands-free.</p>
<h3>Caracteristici:</h3>
<ul>
<li>Casti in-ear confortabile</li>
<li>Microfon cu clip</li>
<li>Buton PTT inline</li>
<li>Cablu rezistent 1.2m</li>
<li>Compatibil statii 2 pini Kenwood</li>
</ul>`,
    manufacturer: 'PNI',
    category: 'Casti si Accesorii Audio',
    rrp_price: 49.00,
    distribution_price: 32.00,
    ean: '5949066537008',
    weight: 0.085,
    box_size: 30,
    warranty: '12 luni',
    stock_total: 278,
    video_url: null,
    images: [
      '/uploads/products/10940_11_aaf74a35.jpg',
      '/uploads/products/10940_12_67f40e26.jpg'
    ],
    specifications: {
      'Tip': 'In-ear cu microfon',
      'Conexiune': '2 pini tip Kenwood',
      'Lungime cablu': '1.2 m',
      'PTT': 'Da, buton inline',
      'Compatibilitate': 'Statii portabile 2 pini'
    },
    tiered_pricing: [
      { min_qty: 1, max_qty: 4, price_with_vat: 46 },
      { min_qty: 5, max_qty: 9, price_with_vat: 42 },
      { min_qty: 10, max_qty: 19, price_with_vat: 39 },
      { min_qty: 20, max_qty: null, price_with_vat: 35 }
    ]
  },
  {
    sku: 'PNI-SWR-METER',
    name: 'Aparat masura SWR si putere PNI, 1.5-150MHz, 10/100W',
    description: `<h2>Aparat masura SWR si putere PNI</h2>
<p>Instrument esential pentru reglarea antenelor CB si verificarea puterii de emisie.</p>
<h3>Caracteristici:</h3>
<ul>
<li>Masoara SWR (Standing Wave Ratio)</li>
<li>Masoara puterea directa si reflectata</li>
<li>Doua scale: 10W si 100W</li>
<li>Frecventa: 1.5-150 MHz</li>
<li>Conectori SO239</li>
</ul>
<p>Usor de utilizat, montaj inline intre statie si antena.</p>`,
    manufacturer: 'PNI',
    category: 'Aparate de Masura',
    rrp_price: 89.00,
    distribution_price: 58.00,
    ean: '5949066537009',
    weight: 0.340,
    box_size: 10,
    warranty: '24 luni',
    stock_total: 54,
    video_url: 'https://www.youtube.com/embed/swr-meter-tutorial',
    images: [
      '/uploads/products/10940_13_e60dd0c0.jpg',
      '/uploads/products/10940_0_cf006f21.jpg',
      '/uploads/products/10940_10_c286c4d5.jpg'
    ],
    specifications: {
      'Frecventa': '1.5-150 MHz',
      'Scale putere': '10W / 100W',
      'Impedanta': '50 Ohm',
      'Conectori': 'SO239 x2',
      'Acuratete SWR': '±5%',
      'Acuratete putere': '±10%'
    },
    tiered_pricing: [
      { min_qty: 1, max_qty: 2, price_with_vat: 85 },
      { min_qty: 3, max_qty: 4, price_with_vat: 79 },
      { min_qty: 5, max_qty: 9, price_with_vat: 75 },
      { min_qty: 10, max_qty: null, price_with_vat: 69 }
    ]
  },
  {
    sku: 'PNI-ADAPTOR-BNC',
    name: 'Adaptor PNI BNC mama la PL259 tata, pentru antene',
    description: `<h2>Adaptor BNC mama - PL259 tata</h2>
<p>Adaptor pentru conectarea echipamentelor cu iesire BNC la antene sau cabluri cu conector PL259.</p>
<h3>Specificatii:</h3>
<ul>
<li>Intrare: BNC mama</li>
<li>Iesire: PL259 tata (UHF)</li>
<li>Material: Alama nichelata</li>
<li>Impedanta: 50 Ohm</li>
</ul>`,
    manufacturer: 'PNI',
    category: 'Adaptoare si Conectori',
    rrp_price: 19.00,
    distribution_price: 11.00,
    ean: '5949066537010',
    weight: 0.025,
    box_size: 50,
    warranty: '12 luni',
    stock_total: 534,
    video_url: null,
    images: [
      '/uploads/products/10940_11_aaf74a35.jpg'
    ],
    specifications: {
      'Tip intrare': 'BNC mama',
      'Tip iesire': 'PL259 tata',
      'Material': 'Alama nichelata',
      'Impedanta': '50 Ohm'
    },
    tiered_pricing: [
      { min_qty: 1, max_qty: 9, price_with_vat: 18 },
      { min_qty: 10, max_qty: 24, price_with_vat: 16 },
      { min_qty: 25, max_qty: 49, price_with_vat: 14 },
      { min_qty: 50, max_qty: null, price_with_vat: 12 }
    ]
  }
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'demo-import') {
      const client = await pool.connect();
      const imported: any[] = [];
      
      try {
        await client.query('BEGIN');
        
        // Delete existing demo products and their images
        const skus = DEMO_PRODUCTS.map(p => p.sku);
        const handles = DEMO_PRODUCTS.map(p => p.sku.toLowerCase());
        
        // Get product IDs first
        const existingProducts = await client.query(
          `SELECT id FROM product WHERE handle = ANY($1::text[])`,
          [handles]
        );
        const productIds = existingProducts.rows.map((r: {id: string}) => r.id);
        
        // Delete images for these products
        if (productIds.length > 0) {
          await client.query(
            `DELETE FROM image WHERE product_id = ANY($1::text[])`,
            [productIds]
          );
        }
        
        // Delete variants and products
        for (const sku of skus) {
          await client.query(`DELETE FROM product_variant WHERE sku = $1`, [sku]);
        }
        await client.query(
          `DELETE FROM product WHERE handle = ANY($1::text[])`,
          [handles]
        );
        
        for (const product of DEMO_PRODUCTS) {
          const productId = crypto.randomUUID();
          const variantId = crypto.randomUUID();
          const priceSetId = crypto.randomUUID();
          
          // Create product with FULL data - description, metadata, thumbnail
          await client.query(
            `INSERT INTO product (id, title, handle, description, status, thumbnail, metadata) 
             VALUES ($1, $2, $3, $4, 'published', $5, $6)`,
            [
              productId,
              product.name,
              product.sku.toLowerCase(),
              product.description,
              product.images[0] || null, // First image as thumbnail
              JSON.stringify({ 
                rrp_price: product.rrp_price,
                distribution_price: product.distribution_price,
                manufacturer: product.manufacturer,
                category: product.category,
                box_size: product.box_size,
                warranty: product.warranty,
                stock_total: product.stock_total,
                video_url: product.video_url,
                specifications: product.specifications,
                supplier_sku: product.sku,
                ean: product.ean
              })
            ]
          );
          
          // Create images in image table with product_id
          for (let i = 0; i < product.images.length; i++) {
            await client.query(
              `INSERT INTO image (id, url, product_id, rank) VALUES ($1, $2, $3, $4)`,
              [crypto.randomUUID(), product.images[i], productId, i]
            );
          }
          
          // Create variant with inventory metadata
          await client.query(
            `INSERT INTO product_variant (id, product_id, sku, title, manage_inventory, metadata) 
             VALUES ($1, $2, $3, $4, true, $5)`,
            [
              variantId,
              productId,
              product.sku,
              product.name,
              JSON.stringify({
                weight: product.weight,
                ean: product.ean,
                stock_total: product.stock_total
              })
            ]
          );
          
          // Create price set
          await client.query(`INSERT INTO price_set (id) VALUES ($1)`, [priceSetId]);
          
          // Link variant to price set
          await client.query(
            `INSERT INTO product_variant_price_set (id, variant_id, price_set_id) 
             VALUES ($1, $2, $3)`,
            [crypto.randomUUID(), variantId, priceSetId]
          );
          
          // Add tiered pricing
          for (const tier of product.tiered_pricing) {
            const amountCents = Math.round(tier.price_with_vat * 100);
            await client.query(
              `INSERT INTO price (id, price_set_id, currency_code, raw_amount, amount, min_quantity, max_quantity) 
               VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [
                crypto.randomUUID(),
                priceSetId,
                'ron',
                JSON.stringify({ value: amountCents }),
                amountCents,
                tier.min_qty,
                tier.max_qty
              ]
            );
          }
          
          imported.push({
            sku: product.sku,
            name: product.name,
            rrp: product.rrp_price,
            distribution: product.distribution_price,
            profit: product.rrp_price - product.distribution_price,
            profit_percent: Math.round((product.rrp_price - product.distribution_price) / product.rrp_price * 100),
            stock: product.stock_total,
            images: product.images.length,
            has_video: !!product.video_url,
            specs_count: Object.keys(product.specifications).length,
            tiers: product.tiered_pricing.length
          });
        }
        
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
      
      return NextResponse.json({ 
        success: true, 
        imported, 
        count: imported.length,
        summary: {
          total_products: imported.length,
          total_images: imported.reduce((sum, p) => sum + p.images, 0),
          products_with_video: imported.filter(p => p.has_video).length,
          avg_profit_percent: Math.round(imported.reduce((sum, p) => sum + p.profit_percent, 0) / imported.length)
        }
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Demo import error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
