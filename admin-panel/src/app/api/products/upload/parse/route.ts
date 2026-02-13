import { NextRequest, NextResponse } from 'next/server'
import { parse } from 'csv-parse/sync'
import { parseStringPromise } from 'xml2js'

// POST - Parse CSV or XML file and return columns + preview
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const format = (formData.get('format') as string) || 'csv'

    if (!file) {
      return NextResponse.json({ error: 'No file selected' }, { status: 400 })
    }

    const text = await file.text()
    let rows: Record<string, string>[] = []
    let columns: string[] = []

    if (format === 'csv') {
      const parsed = parse(text, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
        relax_column_count: true,
      }) as Record<string, string>[]
      rows = parsed
      if (rows.length > 0) {
        columns = Object.keys(rows[0])
      }
    } else if (format === 'xml') {
      const result = await parseStringPromise(text, { explicitArray: false, trim: true })
      
      // Find the products array - support multiple structures
      let products: any[] = []
      if (result.products?.product) {
        products = Array.isArray(result.products.product) 
          ? result.products.product 
          : [result.products.product]
      } else if (result.root?.product) {
        products = Array.isArray(result.root.product) 
          ? result.root.product 
          : [result.root.product]
      } else {
        // Try to find any array of items
        const root = Object.values(result)[0] as any
        if (root && typeof root === 'object') {
          const firstArray = Object.values(root).find(v => Array.isArray(v)) as any[]
          if (firstArray) products = firstArray
          else {
            const firstObj = Object.entries(root).find(([_, v]) => typeof v === 'object' && !Array.isArray(v))
            if (firstObj) products = [firstObj[1]]
          }
        }
      }

      // Flatten XML products to rows
      rows = products.map((p: any) => {
        const row: Record<string, string> = {}
        for (const [key, val] of Object.entries(p)) {
          if (typeof val === 'string' || typeof val === 'number') {
            row[key] = String(val)
          } else if (key === 'images' && typeof val === 'object') {
            // Handle <images><image>...</image></images>
            const imgs = (val as any).image
            const imgList = Array.isArray(imgs) ? imgs : [imgs]
            imgList.forEach((img: string, i: number) => {
              row[`image${i + 1}`] = String(img)
            })
          } else if (key === 'specifications' && typeof val === 'object') {
            // Handle <specifications><spec key="...">...</spec></specifications>
            const specs = (val as any).spec
            const specList = Array.isArray(specs) ? specs : specs ? [specs] : []
            specList.forEach((spec: any, i: number) => {
              const specKey = spec?.$ ? spec.$.key : spec?.key || `spec_${i + 1}`
              const specVal = spec?._ || spec?.value || (typeof spec === 'string' ? spec : '')
              row[`spec_key${i + 1}`] = specKey
              row[`spec_val${i + 1}`] = specVal
            })
          }
        }
        return row
      })

      if (rows.length > 0) {
        // Collect all unique columns across all rows
        const colSet = new Set<string>()
        rows.forEach(r => Object.keys(r).forEach(k => colSet.add(k)))
        columns = Array.from(colSet)
      }
    }

    // Suggest field mappings
    const suggestedMappings: Record<string, string> = {}
    const fieldPatterns: Record<string, RegExp> = {
      title: /^(title|name|titlu|nume|produs|product_name|denumire)$/i,
      description: /^(description|descriere|desc|detalii|details)$/i,
      sku: /^(sku|cod|code|product_code|cod_produs)$/i,
      ean: /^(ean|ean13|gtin|barcode|cod_bare)$/i,
      brand: /^(brand|marca|producator|manufacturer|Producator|Producător)$/i,
      category: /^(category|categorie|cat|tip|type)$/i,
      price: /^(price|pret|rrp|rrp_price|pret_vanzare|retail_price)$/i,
      supplier_price: /^(supplier_price|pret_furnizor|cost|pret_achizitie|buy_price|wholesale)$/i,
      stock: /^(stock|stoc|quantity|cantitate|qty|inventar)$/i,
      weight: /^(weight|greutate|kg)$/i,
      warranty_months: /^(warranty|garantie|warranty_months|luni_garantie)$/i,
    }

    // Image columns
    for (let i = 1; i <= 10; i++) {
      fieldPatterns[`image${i}`] = new RegExp(`^(image${i}|imagine${i}|img${i}|poza${i}|photo${i})$`, 'i')
    }
    // Spec columns
    for (let i = 1; i <= 10; i++) {
      fieldPatterns[`spec_key${i}`] = new RegExp(`^(spec_key${i}|specificatie_${i}_cheie|attr_name_${i})$`, 'i')
      fieldPatterns[`spec_val${i}`] = new RegExp(`^(spec_val${i}|specificatie_${i}_valoare|attr_value_${i})$`, 'i')
    }

    columns.forEach(col => {
      for (const [field, pattern] of Object.entries(fieldPatterns)) {
        if (pattern.test(col)) {
          suggestedMappings[col] = field
        }
      }
    })

    return NextResponse.json({
      success: true,
      format,
      totalRows: rows.length,
      columns,
      suggestedMappings,
      preview: rows.slice(0, 5), // First 5 rows as preview
      allData: rows, // Full data for client-side processing
    })
  } catch (error: any) {
    console.error('Parse error:', error)
    return NextResponse.json({ error: error.message || 'Error parsing file' }, { status: 500 })
  }
}
