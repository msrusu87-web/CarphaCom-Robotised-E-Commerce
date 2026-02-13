import { NextRequest, NextResponse } from 'next/server';

const B2B_BASE_URL = 'https://b2b.mo.ro';
const B2B_CREDENTIALS = {
  username: 'YOUR_PNI_USERNAME',
  password: 'YOUR_PNI_PASSWORD'
};

// Category mapping
const CATEGORY_MAPPING: Record<number, string> = {
  390: 'Phone and Tablet Accessories',
  395: 'IP Cameras',
  362: 'Radio Station Headsets',
  443: 'Radio Station Kits',
  540: 'Plugs Connectors Mounts',
  544: 'Self-Supporting Gates',
  543: 'Parking Sensors',
  403: 'Stand Alone',
  348: 'CB Stations',
  517: 'Thermostats',
  545: 'Garage Doors',
  405: 'Access Control Accessories',
  453: 'Parking Sensors',
};

// Session management
let b2bSession: { cookies: string; timestamp: number } | null = null;

async function loginB2B(): Promise<string> {
  // Check if session valid (30 min TTL)
  if (b2bSession && Date.now() - b2bSession.timestamp < 30 * 60 * 1000) {
    return b2bSession.cookies;
  }

  // Login via form POST
  const loginResponse = await fetch(`${B2B_BASE_URL}/account/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      username: B2B_CREDENTIALS.username,
      password: B2B_CREDENTIALS.password,
      login: 'Login'
    }).toString(),
    redirect: 'manual'
  });

  const setCookieHeaders = loginResponse.headers.get('set-cookie') || '';
  const sessionCookie = setCookieHeaders.split(';')[0];

  if (!sessionCookie) {
    throw new Error('B2B login failed: No session cookie');
  }

  b2bSession = { cookies: sessionCookie, timestamp: Date.now() };
  return sessionCookie;
}

async function fetchFromB2B(action: string, limit: number = 10, productId?: number): Promise<any> {
  const cookies = await loginB2B();

  const body: any = { action };
  if (action === 'list') body.limit = limit;
  if (action === 'detail') body.product_id = productId;

  const response = await fetch(`${B2B_BASE_URL}/api/b2b`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`B2B API error: ${response.statusText}`);
  }

  return response.json();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, productIds, limit = 10 } = body;

    // Fetch products list
    if (action === 'fetch-products') {
      const data = await fetchFromB2B('list', limit);
      
      const grouped = (data.products || []).reduce((acc: Record<string, any>, product: any) => {
        const catId = product.category?.id || 0;
        const catName = product.category?.name || 'Uncategorized';
        
        if (!acc[catId]) {
          acc[catId] = { id: catId, name: catName, products: [] };
        }
        
        acc[catId].products.push({
          id: product.id,
          sku: product.sku,
          name: product.name,
          price: {
            distribution: product.price?.distribution || 0,
            retail: product.price?.retail || 0,
            retail_with_vat: product.price?.retail_with_vat || 0,
            tiered: (product.price?.tiered || []).map((t: any) => ({
              min: t.qty_min,
              max: t.qty_max,
              price: t.price,
              price_with_vat: t.price_with_vat
            }))
          },
          stock: {
            total: product.stock?.new?.total || 0,
            reseal: product.stock?.reseal || 0,
            estimated_arrival: product.stock?.estimated_arrival || null
          },
          manufacturer: product.manufacturer || '',
          ean: product.ean || '',
          box_size: product.box_size || 1,
          warranty: product.warranty || '',
          images: (product.images || []).map((img: any) => ({ url: img.url, alt: img.alt || product.name })),
          weight: product.weight || 0,
          description: product.description || ''
        });
        
        return acc;
      }, {});

      return NextResponse.json({
        success: true,
        categories: Object.values(grouped).map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          product_count: cat.products.length,
          products: cat.products
        })),
        total_products: (data.products || []).length
      });
    }

    // Import single or multiple products
    if (action === 'import-products') {
      if (!productIds || !Array.isArray(productIds)) {
        return NextResponse.json({ error: 'productIds required' }, { status: 400 });
      }

      const imported: any[] = [];
      const errors: any[] = [];

      for (const productId of productIds.slice(0, 10)) {
        try {
          const product: any = await fetchFromB2B('detail', 1, productId);
          const ourCategoryName = CATEGORY_MAPPING[product.category?.id] || product.category?.name;

          imported.push({
            id: productId,
            sku: product.sku,
            name: product.name,
            category: ourCategoryName,
            retail_price: product.price?.retail,
            retail_price_with_vat: product.price?.retail_with_vat,
            distribution_price: product.price?.distribution,
            stock_total: product.stock?.new?.total || 0,
            stock_reseal: product.stock?.reseal || 0,
            estimated_arrival: product.stock?.estimated_arrival,
            manufacturer: product.manufacturer,
            ean: product.ean,
            barcode: product.barcode,
            box_size: product.box_size,
            warranty: product.warranty,
            weight: product.weight,
            description: product.description,
            images: product.images || [],
            specifications: product.specifications || {},
            tiered_pricing: (product.price?.tiered || []).map((t: any) => ({
              min_qty: t.qty_min,
              max_qty: t.qty_max,
              price: t.price,
              price_with_vat: t.price_with_vat
            }))
          });
        } catch (err: any) {
          errors.push({ id: productId, error: err.message });
        }
      }

      return NextResponse.json({ success: true, imported, errors });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('B2B API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
