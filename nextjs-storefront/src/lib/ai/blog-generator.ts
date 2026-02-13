"use server"

import { Pool } from "pg"

// Database connection
const pool = new Pool({
  host: "localhost",
  port: 5432,
  database: "medusa_store",
  user: "medusa",
  password: "YOUR_DB_PASSWORD",
  ssl: false,
  max: 5,
  idleTimeoutMillis: 30000,
})

// AI API Keys
const GROQ_API_KEY = "YOUR_GROQ_API_KEY"
const OPENAI_API_KEY = "YOUR_OPENAI_API_KEY"

// ===== Types =====

export type BlogGenerationRequest = {
  topic: string
  category: string
  keywords?: string[]
  tone?: "informative" | "friendly" | "technical" | "promotional"
  length?: "short" | "medium" | "long"
}

export type GeneratedBlogPost = {
  title: string
  slug: string
  excerpt: string
  content: string
  seo_title: string
  seo_description: string
  tags: string[]
}

type ProductForBlog = {
  id: string
  title: string
  brand: string
  description: string
  handle: string
  image_url: string | null
  price: number | null
  currency: string
  category_name: string | null
  product_url: string
}

// ===== Helpers =====

// Generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[ăâ]/g, 'a')
    .replace(/[îí]/g, 'i')
    .replace(/[șş]/g, 's')
    .replace(/[țţ]/g, 't')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 100)
}

// Strip HTML tags from product description to get clean text
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 500)
}

// Format price from minor units (e.g. 37815 → "378.15 RON")
function formatPrice(amount: number | null): string {
  if (!amount) return ""
  const major = Math.floor(amount / 100)
  const minor = amount % 100
  return `${major}.${minor.toString().padStart(2, '0')} RON`
}

// ===== Product Picker =====

// Pick a random published product with its image, price, and category
async function pickRandomProduct(): Promise<ProductForBlog> {
  // Get a random product that hasn't been blogged about recently
  const result = await pool.query(`
    SELECT 
      p.id, p.title, p.subtitle as brand, p.description, p.handle,
      (SELECT i.url FROM image i WHERE i.product_id = p.id AND i.rank = 0 LIMIT 1) as image_url,
      (SELECT pr.amount FROM price pr 
       JOIN product_variant_price_set pvps ON pr.price_set_id = pvps.price_set_id
       JOIN product_variant pv ON pvps.variant_id = pv.id
       WHERE pv.product_id = p.id AND pr.currency_code = 'ron'
       LIMIT 1) as price,
      (SELECT pc.name FROM product_category pc
       JOIN product_category_product pcp ON pc.id = pcp.product_category_id
       WHERE pcp.product_id = p.id
       LIMIT 1) as category_name
    FROM product p
    WHERE p.status = 'published'
      AND p.id NOT IN (
        SELECT UNNEST(related_product_ids) FROM blog_posts 
        WHERE is_auto_generated = true 
          AND created_at > NOW() - INTERVAL '7 days'
          AND related_product_ids IS NOT NULL
      )
    ORDER BY RANDOM()
    LIMIT 1
  `)

  if (result.rows.length === 0) {
    // Fallback: any random published product
    const fallback = await pool.query(`
      SELECT 
        p.id, p.title, p.subtitle as brand, p.description, p.handle,
        (SELECT i.url FROM image i WHERE i.product_id = p.id AND i.rank = 0 LIMIT 1) as image_url,
        (SELECT pr.amount FROM price pr 
         JOIN product_variant_price_set pvps ON pr.price_set_id = pvps.price_set_id
         JOIN product_variant pv ON pvps.variant_id = pv.id
         WHERE pv.product_id = p.id AND pr.currency_code = 'ron'
         LIMIT 1) as price,
        (SELECT pc.name FROM product_category pc
         JOIN product_category_product pcp ON pc.id = pcp.product_category_id
         WHERE pcp.product_id = p.id
         LIMIT 1) as category_name
      FROM product p
      WHERE p.status = 'published'
      ORDER BY RANDOM()
      LIMIT 1
    `)
    if (fallback.rows.length === 0) {
      throw new Error("No published products found in store")
    }
    const row = fallback.rows[0]
    return { ...row, currency: "RON", product_url: `/ro/products/${row.handle}` }
  }

  const row = result.rows[0]
  return { ...row, currency: "RON", product_url: `/ro/products/${row.handle}` }
}

// ===== AI Calls =====

// Call Groq API (primary)
async function callGroq(systemPrompt: string, userPrompt: string): Promise<string | null> {
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    })

    if (!response.ok) {
      console.error("Groq API error:", await response.text())
      return null
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || null
  } catch (error) {
    console.error("Groq API call failed:", error)
    return null
  }
}

// Call OpenAI API (fallback)
async function callOpenAI(systemPrompt: string, userPrompt: string): Promise<string | null> {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    })

    if (!response.ok) {
      console.error("OpenAI API error:", await response.text())
      return null
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || null
  } catch (error) {
    console.error("OpenAI API call failed:", error)
    return null
  }
}

// Call AI with fallback
async function callAI(systemPrompt: string, userPrompt: string): Promise<string> {
  let result = await callGroq(systemPrompt, userPrompt)
  
  if (!result) {
    console.log("Groq failed, falling back to OpenAI...")
    result = await callOpenAI(systemPrompt, userPrompt)
  }
  
  if (!result) {
    throw new Error("Both AI providers failed")
  }
  
  return result
}

// ===== JSON Parser =====

function parseAIJson(aiResponse: string): any {
  const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error("No JSON found in response")
  }

  let jsonStr = jsonMatch[0]

  // Fix newlines inside string values
  const lines = jsonStr.split('\n')
  let inString = false
  let fixedJson = ''

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const quotes = (line.match(/(?<!\\)"/g) || []).length

    if (inString) {
      fixedJson += '\\n' + line.replace(/\n/g, '\\n')
      if (quotes % 2 === 1) inString = false
    } else {
      if (i > 0) fixedJson += '\n'
      fixedJson += line
      if (quotes % 2 === 1) inString = true
    }
  }

  try {
    return JSON.parse(fixedJson)
  } catch (e) {
    // Fallback cleanup
    let cleanJson = jsonMatch[0]
      .replace(/"\s*:\s*"([^"]*)\n\s*/g, '": "$1 ')
      .replace(/\n\s*</g, ' <')
      .replace(/>\n\s*/g, '> ')
      .replace(/\n\s+/g, ' ')
    return JSON.parse(cleanJson)
  }
}

// ===== Product Blog Generator (main autoblog function) =====

export async function autoGenerateProductBlog(): Promise<{
  success: boolean
  postId?: string
  productTitle?: string
  blogTitle?: string
  error?: string
}> {
  try {
    // 1. Pick a random product from the store
    const product = await pickRandomProduct()
    console.log(`[AutoBlog] Picked product: ${product.title} (${product.brand})`)

    // 2. Clean up product description
    const cleanDescription = product.description ? stripHtml(product.description) : ""
    const priceStr = formatPrice(product.price)

    // 3. Build AI prompt for product-focused blog article
    const systemPrompt = `You are an expert copywriter for a Romanian online store selling electronic equipment, radio communications, video surveillance, and car accessories.
You write promotional blog articles that showcase products from the store.
Write ONLY in English.
Style: professional, friendly, persuasive, optimized for SEO and Google indexing.
Purpose: promoting store products through useful and informative articles.
The store is called "StatiiInfoTrafic.ro" - radio and communications equipment.`

    const userPrompt = `Write a promotional blog article for the following product from our store:

PRODUCT: ${product.title}
BRAND: ${product.brand || "N/A"}
CATEGORY: ${product.category_name || "Electronic equipment"}
PRICE: ${priceStr || "Available on site"}
PRODUCT DESCRIPTION: ${cleanDescription || "Quality product from the " + (product.brand || "our") + " range"}
PRODUCT LINK: https://YOUR_PNI_USERNAMEtrafic.ro${product.product_url}

Article requirements:
1. TITLE: Must contain the brand (${product.brand || ""}) and the product model/name. Should be attractive, Google-friendly, max 70 characters.
2. CONTENT (800-1200 words): 
   - Introduction that captures attention and presents the problem the product solves
   - Section "Why you need [product]" - practical use cases
   - Section with technical features and main advantages
   - Section "Who is this recommended for" - target audience
   - Conclusions with call-to-action to the store
   - Include an HTML link to the product: <a href="https://YOUR_PNI_USERNAMEtrafic.ro${product.product_url}">View product in store</a>
   - IMPORTANT: Do NOT include links to other external websites. The only allowed links are to https://YOUR_PNI_USERNAMEtrafic.ro
3. All JSON fields must be filled in

Return EXACTLY this JSON format (no additional text):
{
  "title": "Title with brand and model - max 70 characters, SEO friendly",
  "excerpt": "Short summary 150-160 characters about the product and benefits",
  "content": "Complete HTML on a single line: <h2>, <h3>, <p>, <ul>, <li>, <strong>, <a>. No newlines in string.",
  "seo_title": "SEO title max 60 characters with brand and model",
  "seo_description": "Meta description max 155 characters with main keywords",
  "tags": ["${product.brand || "equipment"}", "tag2", "tag3", "tag4", "tag5"]
}

IMPORTANT: HTML content must be on a SINGLE LINE, without \\n. Return ONLY the JSON.`

    // 4. Generate the content via AI
    const aiResponse = await callAI(systemPrompt, userPrompt)
    const parsed = parseAIJson(aiResponse)

    if (!parsed.title || !parsed.content) {
      throw new Error("AI response missing required fields (title/content)")
    }

    // 5. Build blog post object
    const blogPost: GeneratedBlogPost = {
      title: parsed.title,
      slug: generateSlug(parsed.title),
      excerpt: parsed.excerpt || parsed.title,
      content: parsed.content,
      seo_title: parsed.seo_title || parsed.title,
      seo_description: parsed.seo_description || parsed.excerpt,
      tags: Array.isArray(parsed.tags) ? parsed.tags : [product.brand || "equipment"]
    }

    // 6. Pick a random blog category
    const blogCategory = await pickRandomBlogCategory()

    // 7. Save to database with product image and product link
    const postId = crypto.randomUUID()

    await pool.query(
      `INSERT INTO blog_posts (
        id, title, slug, excerpt, content, featured_image,
        category, tags, seo_title, seo_description,
        author, status, is_auto_generated, related_product_ids,
        created_at, updated_at, published_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10,
        $11, $12, $13, $14,
        NOW(), NOW(), NOW()
      )`,
      [
        postId,
        blogPost.title,
        blogPost.slug,
        blogPost.excerpt,
        blogPost.content,
        product.image_url,  // Use the actual product image
        blogCategory,
        blogPost.tags,
        blogPost.seo_title,
        blogPost.seo_description,
        "Admin Statii Info Trafic",
        "published",
        true,
        [product.id]  // Track which product this blog is about
      ]
    )

    console.log(`[AutoBlog] Published: "${blogPost.title}" with image ${product.image_url}`)

    return {
      success: true,
      postId,
      productTitle: product.title,
      blogTitle: blogPost.title
    }
  } catch (error: any) {
    console.error("[AutoBlog] Generation failed:", error)
    return {
      success: false,
      error: error.message || "Unknown error"
    }
  }
}

// Pick a random blog category from the database
async function pickRandomBlogCategory(): Promise<string> {
  try {
    const result = await pool.query(
      "SELECT name FROM blog_categories ORDER BY RANDOM() LIMIT 1"
    )
    return result.rows.length > 0 ? result.rows[0].name : "Reviews"
  } catch {
    return "Reviews"
  }
}

// ===== Legacy functions (kept for manual/API usage) =====

// Generate blog post using AI (topic-based, manual)
export async function generateBlogPost(request: BlogGenerationRequest): Promise<GeneratedBlogPost> {
  const { topic, category, keywords = [], tone = "informative", length = "medium" } = request
  
  const lengthGuide = {
    short: "500-700 words",
    medium: "800-1200 words", 
    long: "1500-2000 words"
  }
  
  const systemPrompt = `You are an expert in CB, VHF, UHF, and PMR radio communication equipment. 
You write articles for a Romanian online store that sells radio stations and accessories.
Write ONLY in English.
Use a professional but accessible tone, optimized for SEO.`

  const userPrompt = `Generate a complete blog article in English about: "${topic}"

Category: ${category}
Keywords: ${keywords.join(", ") || "CB stations, radio communications, Romania"}
Tone: ${tone} | Length: ${lengthGuide[length]}

Return EXACTLY this JSON format (no additional text):
{
  "title": "Title max 70 characters, SEO friendly",
  "excerpt": "Summary 150-160 characters",
  "content": "Complete HTML on a single line with <h2>, <h3>, <p>, <ul>, <li>, <strong>.",
  "seo_title": "SEO title max 60 characters",
  "seo_description": "Meta description max 155 characters",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}

IMPORTANT: HTML content on a SINGLE LINE. Return ONLY the JSON.`

  const aiResponse = await callAI(systemPrompt, userPrompt)
  const parsed = parseAIJson(aiResponse)
  
  if (!parsed.title || !parsed.content) {
    throw new Error("AI response missing required fields")
  }
  
  return {
    title: parsed.title,
    slug: generateSlug(parsed.title),
    excerpt: parsed.excerpt || parsed.title,
    content: parsed.content,
    seo_title: parsed.seo_title || parsed.title,
    seo_description: parsed.seo_description || parsed.excerpt,
    tags: Array.isArray(parsed.tags) ? parsed.tags : []
  }
}

// Save blog post to database (legacy/manual)
export async function saveBlogPost(post: GeneratedBlogPost, category: string): Promise<string> {
  const id = crypto.randomUUID()
  
  await pool.query(
    `INSERT INTO blog_posts (
      id, title, slug, excerpt, content,
      category, tags, seo_title, seo_description,
      author, status, is_auto_generated, 
      created_at, updated_at, published_at
    ) VALUES (
      $1, $2, $3, $4, $5,
      $6, $7, $8, $9,
      $10, $11, $12,
      NOW(), NOW(), NOW()
    )`,
    [
      id, post.title, post.slug, post.excerpt, post.content,
      category, post.tags, post.seo_title, post.seo_description,
      "Admin Statii Info Trafic", "published", true
    ]
  )
  
  return id
}

// Generate and save (legacy/manual)
export async function generateAndSaveBlogPost(request: BlogGenerationRequest): Promise<{
  success: boolean
  postId?: string
  post?: GeneratedBlogPost
  error?: string
}> {
  try {
    const post = await generateBlogPost(request)
    const postId = await saveBlogPost(post, request.category)
    return { success: true, postId, post }
  } catch (error: any) {
    console.error("Blog generation failed:", error)
    return { success: false, error: error.message || "Unknown error" }
  }
}

// Get blog categories from database
export async function getBlogCategoriesForGenerator(): Promise<Array<{ id: string; name: string; slug: string }>> {
  const result = await pool.query("SELECT id, name, slug FROM blog_categories ORDER BY name")
  return result.rows
}
