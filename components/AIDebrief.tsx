"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import LoadingSpinner from "./LoadingSpinner";

type Match = {
  id: string;
  opponent: string;
  score: string;
  date: string;
  notes?: string;
};

type Video = {
  id: string;
  storage_url: string | null;
  created_at: string | null;
  lesson_title?: string | null;
};

export default function AIDebrief() {
  const supabase = createClient();

  const [processing, setProcessing] = useState(false);
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function analyze() {
    setProcessing(true);
    setAnalysis(null);
    setError(null);

    try {
      // Fetch latest match and latest video
      const { data: matchRows } = await supabase.from("matches").select("id, opponent, score, date, notes").order("date", { ascending: false }).limit(1);
      const latestMatch = (matchRows && matchRows[0]) as Match | undefined;

      const { data: videoRows } = await supabase.from("videos").select("id, storage_url, created_at, lesson_title").order("created_at", { ascending: false }).limit(1);
      const latestVideo = (videoRows && videoRows[0]) as Video | undefined;
      // Call server-side AI debrief endpoint
      const res = await fetch('/api/ai/debrief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: latestMatch?.id, videoId: latestVideo?.id }),
      });

      if (!res.ok) {
        // try to read JSON error message
        let msg = 'Service Unavailable';
        try {
          const j = await res.json();
          msg = j?.error || msg;
        } catch (e) {
          // ignore
        }
        setError(`Failed to generate debrief. ${msg}`);
        return;
      }

      const result = await res.json();
      if (!result?.success) {
        setError(result?.error || 'Processing Failed');
        return;
      }

      // Use the analysis object returned by the server (structured)
      setAnalysis(result.analysis || result || null);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Failed to analyze");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="rounded-2xl border border-baseline-border bg-baseline-dark-3/60 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="font-semibold text-baseline-text-primary">AI Performance Debrief</h4>
          <div className="text-xs text-baseline-text-dim">Analyze latest match & video for tactical advice</div>
        </div>
        <div>
          <button onClick={analyze} disabled={processing} className="px-3 py-1.5 rounded-lg bg-baseline-green text-black font-semibold">
            {processing ? "Analyzing..." : "Analyze Performance"}
          </button>
        </div>
      </div>

      {processing && (
        <div className="flex items-center gap-3 py-6">
          <LoadingSpinner size={2} />
          <div className="text-sm text-baseline-text-dim">Processing debrief...</div>
        </div>
      )}

      {error && <div className="text-sm text-red-400">{error}</div>}

      {analysis && typeof analysis === 'object' && (
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border border-baseline-border p-4 bg-baseline-dark-4">
            <h5 className="text-sm font-semibold text-baseline-text-primary mb-2">Tactical Evaluation</h5>
            <div className="text-sm text-baseline-text-secondary whitespace-pre-wrap">{analysis.tactical_evaluation || analysis.tactical || '—'}</div>
          </div>
          <div className="rounded-lg border border-baseline-border p-4 bg-baseline-dark-4">
            <h5 className="text-sm font-semibold text-baseline-text-primary mb-2">Technical Corrections</h5>
            <div className="text-sm text-baseline-text-secondary whitespace-pre-wrap">{analysis.technical_corrections || analysis.technical || '—'}</div>
          </div>
          <div className="rounded-lg border border-baseline-border p-4 bg-baseline-dark-4">
            <h5 className="text-sm font-semibold text-baseline-text-primary mb-2">Training Recommendations</h5>
            <div className="text-sm text-baseline-text-secondary whitespace-pre-wrap">{analysis.training_recommendations || analysis.training || '—'}</div>
          </div>
        </div>
      )}

      {analysis && typeof analysis === 'string' && (
        <div className="mt-3 prose prose-invert prose-sm text-baseline-text-secondary whitespace-pre-wrap">{analysis}</div>
      )}
    </div>
  );
}
