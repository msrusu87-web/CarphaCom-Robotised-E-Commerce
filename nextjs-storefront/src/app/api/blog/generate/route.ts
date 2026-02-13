import { NextRequest, NextResponse } from "next/server"
import { generateAndSaveBlogPost, autoGenerateProductBlog, getBlogCategoriesForGenerator } from "@lib/ai/blog-generator"

// Secret key for API authentication
const API_SECRET = "CBRadio2026GeneratorKey"

export async function POST(request: NextRequest) {
  try {
    // Check authorization
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${API_SECRET}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { mode, topic, category, keywords, tone, length } = body

    // AUTO MODE: Pick random product → generate promotional blog post
    if (mode === "auto") {
      const result = await autoGenerateProductBlog()

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || "Failed to auto-generate blog post" },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        postId: result.postId,
        productTitle: result.productTitle,
        blogTitle: result.blogTitle,
        message: "Product blog post auto-generated and published"
      })
    }

    // MANUAL MODE: Topic-based generation (legacy)
    if (!topic || !category) {
      return NextResponse.json(
        { error: "Missing required fields: topic and category (or use mode: 'auto')" },
        { status: 400 }
      )
    }

    const result = await generateAndSaveBlogPost({
      topic,
      category,
      keywords: keywords || [],
      tone: tone || "informative",
      length: length || "medium"
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to generate blog post" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      postId: result.postId,
      title: result.post?.title,
      slug: result.post?.slug,
      message: "Blog post generated and published successfully"
    })

  } catch (error: any) {
    console.error("Blog generation API error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authorization
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${API_SECRET}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Return available categories
    const categories = await getBlogCategoriesForGenerator()
    
    return NextResponse.json({
      categories,
      availableTones: ["informative", "friendly", "technical", "promotional"],
      availableLengths: ["short", "medium", "long"],
      usage: {
        method: "POST",
        body: {
          topic: "string (required) - Subject of the blog post",
          category: "string (required) - Category name",
          keywords: "string[] (optional) - SEO keywords",
          tone: "string (optional) - informative|friendly|technical|promotional",
          length: "string (optional) - short|medium|long"
        }
      }
    })
  } catch (error: any) {
    console.error("Blog generator GET error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
