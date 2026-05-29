"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type VideoRecord = {
  id: string;
  user_id: string | null;
  lesson_title: string | null;
  storage_url: string | null;
  created_at: string | null;
};

export default function VideoGallery() {
  const supabase = createClient();

  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("videos")
          .select("id, user_id, lesson_title, storage_url, created_at")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Failed to load videos", error);
          if (mounted) setError(error.message || "Failed to load videos");
        } else if (mounted) {
          setVideos((data as VideoRecord[]) || []);
        }
      } catch (e: any) {
        console.error(e);
        if (mounted) setError(e?.message || "Failed to load videos");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="p-6 rounded-2xl border border-baseline-border bg-baseline-dark-3/40 text-baseline-text-dim">
        <div className="w-8 h-8 border-2 border-baseline-green border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-center mt-3">Loading video gallery...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl border border-red-600 bg-baseline-dark-3/40 text-red-400">
        <p className="text-sm">Error loading videos: {error}</p>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="p-6 rounded-2xl border border-baseline-border bg-baseline-dark-3/40 text-baseline-text-dim">
        <p className="text-sm">No recordings yet. Record a lesson to populate your gallery.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {videos.map((v) => (
        <div key={v.id} className="rounded-lg border border-baseline-border bg-baseline-dark-4 p-3">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <div className="text-xs text-baseline-text-dim">{v.lesson_title || 'Lesson'}</div>
              <div className="text-sm font-semibold text-baseline-text-primary">
                {v.created_at ? new Date(v.created_at).toLocaleString() : '—'}
              </div>
            </div>
            <div className="text-xs text-baseline-text-dim">{v.user_id ? 'Uploaded' : 'Unknown'}</div>
          </div>

          {v.storage_url ? (
            <video src={v.storage_url} controls className="w-full h-48 bg-black rounded-md object-cover" />
          ) : (
            <div className="w-full h-48 bg-neutral-900 rounded-md flex items-center justify-center text-sm text-baseline-text-dim">No video URL</div>
          )}

        </div>
      ))}
    </div>
  );
}
