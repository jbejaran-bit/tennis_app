import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

type AIResponse = {
  tactical_evaluation: string;
  technical_corrections: string;
  training_recommendations: string;
};

export async function POST(req: Request) {
  try {
    const { matchId, videoId } = await req.json();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Server misconfigured: missing Supabase URL, anon key, or service role key" },
        { status: 500 }
      );
    }

    // Create an auth-aware client to validate session
    const cookieStore = await cookies();
    const supabaseAuth = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    });
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Admin client for secure data access
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

    // Fetch match and ensure ownership
    let matchData = null;
    if (matchId) {
      const { data, error } = await supabaseAdmin
        .from("matches")
        .select("*")
        .eq("id", matchId)
        .eq("user_id", user.id)
        .single();
      if (error) {
        console.error("Match fetch error", error.message);
        return NextResponse.json({ error: "Match not found or unauthorized" }, { status: 404 });
      }
      matchData = data;
    }

    // Fetch video and ensure ownership
    let videoData = null;
    if (videoId) {
      const { data, error } = await supabaseAdmin
        .from("videos")
        .select("*")
        .eq("id", videoId)
        .eq("user_id", user.id)
        .single();
      if (error) {
        console.error("Video fetch error", error.message);
        return NextResponse.json({ error: "Video not found or unauthorized" }, { status: 404 });
      }
      videoData = data;
    }

    // Optionally fetch user profile for UTR/height/weight
    const { data: profile } = await supabaseAdmin.from("profiles").select("utr_rating, height, weight").eq("id", user.id).maybeSingle();

    // Prepare prompt context
    const context = {
      matchStats: matchData ?? null,
      videoMetadata: videoData ?? null,
      profile: profile ?? null,
      timestamp: new Date().toISOString(),
    };

    // Call Anthropic via HTTP to avoid an extra runtime dependency.
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey) {
      console.error("Missing ANTHROPIC_API_KEY");
      return NextResponse.json({ error: "AI service not configured" }, { status: 503 });
    }

    function extractJSON(text: string): string | null {
      if (!text) return null;
      const cleaned = text.replace(/```json|```/gi, "").trim();
      const first = cleaned.indexOf("{");
      const last = cleaned.lastIndexOf("}");
      if (first === -1 || last === -1 || last < first) return null;
      return cleaned.substring(first, last + 1);
    }

    const systemPrompt = `You are a professional varsity tennis coach. Given match statistics, player profile (UTR, height, weight), and video metadata describing technique focus, produce a JSON object with keys: tactical_evaluation, technical_corrections, training_recommendations. Keep responses concise and actionable.`;

    const userPrompt = `Context:\n${JSON.stringify(context, null, 2)}\n\nInstruction:\nProvide a 3-part debrief: 1) Tactical Evaluation, 2) Technical Stroke Correction, 3) Training Recommendation. Return only valid JSON with the three keys.`;

    let aiText = "";
    let analysis: AIResponse | null = null;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
          "x-api-key": anthropicKey,
        },
        body: JSON.stringify({
          model: process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-latest",
          max_tokens: 800,
          temperature: 0.2,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Anthropic API error:", response.status, errorText);
        return NextResponse.json(
          { error: "AI generation failed after multiple attempts. Please try again." },
          { status: 502 }
        );
      }

      const msg = await response.json();

      aiText = msg?.content?.find((part: any) => part?.type === "text")?.text || JSON.stringify(msg);

      const jsonStr = extractJSON(aiText);
      if (!jsonStr) {
        console.error("No JSON found in AI response", aiText);
        return NextResponse.json({ error: 'AI generation failed after multiple attempts. Please try again.' }, { status: 502 });
      }

      analysis = JSON.parse(jsonStr) as AIResponse;
    } catch (err: any) {
      console.error("Anthropic SDK error:", err?.message || err);
      return NextResponse.json({ error: 'AI generation failed after multiple attempts. Please try again.' }, { status: 502 });
    }

    return NextResponse.json({ success: true, analysis, raw: aiText, context }, { status: 200 });
  } catch (error: any) {
    console.error("Debrief API Error:", error?.message || error);
    return NextResponse.json({ error: "Debrief generation failed" }, { status: 500 });
  }
}
