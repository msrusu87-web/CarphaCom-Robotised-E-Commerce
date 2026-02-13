"use client"

import { useState } from "react"

const API_SECRET = "CBRadio2026GeneratorKey"

type Category = {
  id: string
  name: string
  slug: string
}

const CATEGORIES: Category[] = [
  { id: "1", name: "Guides", slug: "guides" },
  { id: "2", name: "Reviews", slug: "reviews" },
  { id: "3", name: "Comparisons", slug: "comparisons" },
  { id: "4", name: "Tips & Tricks", slug: "tips-tricks" },
  { id: "5", name: "News", slug: "news" },
]

const SUGGESTED_TOPICS = [
  "How to improve the range of your CB radio",
  "Top 10 essential accessories for your CB radio",
  "Differences between AM and SSB CB radios",
  "Guide to choosing the right microphone",
  "How to properly calibrate a CB antenna",
  "Advantages of CB radios with automatic squelch",
  "Best CB radios for truckers",
  "How to use CB channels safely",
  "Maintenance and cleaning of CB radios",
  "CB radio legislation in Romania",
]

export default function BlogGeneratorPage() {
  const [topic, setTopic] = useState("")
  const [category, setCategory] = useState("Ghiduri")
  const [keywords, setKeywords] = useState("")
  const [tone, setTone] = useState<"informativ" | "prietenos" | "tehnic" | "promotional">("informativ")
  const [length, setLength] = useState<"scurt" | "mediu" | "lung">("mediu")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError("Please enter a topic for the article")
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/blog/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${API_SECRET}`,
        },
        body: JSON.stringify({
          topic: topic.trim(),
          category,
          keywords: keywords.split(",").map(k => k.trim()).filter(k => k),
          tone,
          length,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate blog post")
      }

      setResult(data)
      setTopic("")
      setKeywords("")
    } catch (err: any) {
      setError(err.message || "An error occurred during generation")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-dark-900 min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white">AI Blog Generator</h1>
          </div>
          <p className="text-dark-400">Generate blog articles using AI (Groq/ChatGPT)</p>
        </div>

        {/* Form */}
        <div className="bg-dark-800 border border-dark-700 rounded-xl p-6 mb-6">
          {/* Topic Input */}
          <div className="mb-6">
            <label className="block text-white font-medium mb-2">
              Article Topic *
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. How to choose the perfect CB radio for trucks"
              className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 resize-none"
              rows={3}
            />
          </div>

          {/* Suggested Topics */}
          <div className="mb-6">
            <label className="block text-dark-400 text-sm mb-2">
              Suggested topics:
            </label>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_TOPICS.slice(0, 5).map((t, i) => (
                <button
                  key={i}
                  onClick={() => setTopic(t)}
                  className="px-3 py-1.5 bg-dark-700 hover:bg-dark-600 text-dark-300 hover:text-white text-xs rounded-full transition-colors"
                >
                  {t.length > 40 ? t.substring(0, 40) + "..." : t}
                </button>
              ))}
            </div>
          </div>

          {/* Category & Tone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-white font-medium mb-2">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-white font-medium mb-2">Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as any)}
                className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
              >
                <option value="informativ">Informative</option>
                <option value="prietenos">Friendly</option>
                <option value="tehnic">Technical</option>
                <option value="promotional">Promotional</option>
              </select>
            </div>
          </div>

          {/* Length & Keywords */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-white font-medium mb-2">Length</label>
              <select
                value={length}
                onChange={(e) => setLength(e.target.value as any)}
                className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
              >
                <option value="scurt">Short (500-700 words)</option>
                <option value="mediu">Medium (800-1200 words)</option>
                <option value="lung">Long (1500-2000 words)</option>
              </select>
            </div>

            <div>
              <label className="block text-white font-medium mb-2">
                Keywords <span className="text-dark-500">(comma separated)</span>
              </label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="CB radio, antenna, communications"
                className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={loading || !topic.trim()}
            className={`w-full py-4 rounded-lg font-semibold text-lg transition-all flex items-center justify-center gap-3 ${
              loading || !topic.trim()
                ? "bg-dark-600 text-dark-400 cursor-not-allowed"
                : "bg-gradient-to-r from-purple-500 to-primary-500 text-white hover:from-purple-600 hover:to-primary-600 shadow-lg hover:shadow-primary-500/30"
            }`}
          >
            {loading ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating article...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate Article with AI
              </>
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3 text-red-400">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Success Result */}
        {result && (
          <div className="bg-accent-500/10 border border-accent-500/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-accent-500 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Article generated successfully!</h3>
                <p className="text-dark-400 text-sm">The article has been published on the blog</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-dark-800 rounded-lg p-3">
                <span className="text-dark-400">Title:</span>
                <span className="text-white font-medium">{result.title}</span>
              </div>
              <div className="flex items-center justify-between bg-dark-800 rounded-lg p-3">
                <span className="text-dark-400">Slug:</span>
                <code className="text-primary-400">{result.slug}</code>
              </div>
              <a
                href={`/ro/blog/${result.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                View Article
              </a>
            </div>
          </div>
        )}

        {/* Stats/Info */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-dark-800 border border-dark-700 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-primary-400">Groq</div>
            <div className="text-dark-400 text-sm">Primary AI Provider</div>
          </div>
          <div className="bg-dark-800 border border-dark-700 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-accent-400">GPT-4</div>
            <div className="text-dark-400 text-sm">Fallback Provider</div>
          </div>
          <div className="bg-dark-800 border border-dark-700 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-purple-400">RO</div>
            <div className="text-dark-400 text-sm">Article Language</div>
          </div>
        </div>
      </div>
    </div>
  )
}
