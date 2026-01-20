import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/utils/supabaseServerClient"

// Simple in-memory rate limiter (resets on server restart)
// For production, consider using Redis or Upstash
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX = 30 // Max 30 requests per minute per IP

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(ip)
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return false
  }
  
  if (record.count >= RATE_LIMIT_MAX) {
    return true
  }
  
  record.count++
  return false
}

// Validate slug format (alphanumeric, hyphens, underscores only)
function isValidSlug(slug: string): boolean {
  return /^[a-zA-Z0-9_-]{1,200}$/.test(slug)
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP first for rate limiting
    const forwardedFor = request.headers.get("x-forwarded-for")
    const realIp = request.headers.get("x-real-ip")
    const cfConnectingIp = request.headers.get("cf-connecting-ip")
    
    const clientIp = 
      cfConnectingIp || 
      realIp || 
      forwardedFor?.split(",")[0]?.trim() || 
      "unknown"

    // Rate limit check
    if (isRateLimited(clientIp)) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { slug } = body

    // Validate slug
    if (!slug || typeof slug !== "string" || !isValidSlug(slug)) {
      return NextResponse.json(
        { error: "Missing or invalid slug" },
        { status: 400 }
      )
    }

    // Create Supabase client with service role key
    const supabase = await createSupabaseServerClient()

    // Call the Supabase RPC function
    const { data, error } = await supabase.rpc("increment_project_view", {
      p_project_slug: slug,
      p_ip_address: clientIp,
    })

    if (error) {
      console.error("View tracking error:", error)
      return NextResponse.json(
        { error: "Failed to track view" },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("View tracking exception:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
