"use client";

import React, { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  onRecorded?: (blob: Blob) => void;
  lessonTitle?: string;
};

export default function StrokeRecorder({ onRecorded, lessonTitle }: Props) {
  const supabase = createClient();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recordedChunksRef = useRef<BlobPart[]>([]);

  useEffect(() => {
    return () => {
      // Cleanup stream and object URLs on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    };
  }, [recordedUrl]);

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        await videoRef.current.play();
      }

      recordedChunksRef.current = [];
      const options: MediaRecorderOptions = { mimeType: "video/webm;codecs=vp9" };
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, options);
      } catch (e) {
        recorder = new MediaRecorder(stream);
      }

      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) recordedChunksRef.current.push(ev.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        setRecordedUrl(url);
        if (onRecorded) onRecorded(blob);
        // stop camera tracks
        if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;

        // Start upload to Supabase Storage in background
        (async () => {
          try {
            setUploading(true);
            setUploadUrl(null);
            // determine user id if available
            let userId = "anonymous";
            try {
              const { data } = await supabase.auth.getUser();
              if (data?.user?.id) userId = data.user.id;
            } catch (e) {
              // ignore
            }

            const path = `${userId}/${Date.now()}.webm`;
            const { error: upErr } = await supabase.storage.from("stroke-videos").upload(path, blob, {
              cacheControl: "3600",
              upsert: false,
              contentType: blob.type,
            });
            if (upErr) {
              console.error("Supabase upload error", upErr);
              setError(upErr.message || "Upload failed");
            } else {
              // Obtain public URL (works for public buckets)
              try {
                const { data: pub } = supabase.storage.from("stroke-videos").getPublicUrl(path);
                setUploadUrl(pub.publicUrl || null);
                console.log("Uploaded to storage:", pub.publicUrl);
                // Insert a metadata record into the `videos` table
                try {
                  const lesson = (typeof (arguments[0]) === 'undefined' ? null : null); // placeholder to keep TS happy
                } catch (e) {}
                try {
                  const { error: insertErr } = await supabase.from("videos").insert([
                    {
                      user_id: userId,
                      lesson_title: lessonTitle || null,
                      storage_url: pub.publicUrl,
                      created_at: new Date().toISOString(),
                    },
                  ]);
                  if (insertErr) {
                    console.error('Failed to insert video metadata', insertErr);
                  } else {
                    console.log('Saved video metadata to videos table');
                  }
                } catch (e) {
                  console.error('Error inserting video metadata', e);
                }
              } catch (e) {
                console.warn("Could not get public URL", e);
              }
            }
          } catch (e: any) {
            console.error(e);
            setError(e?.message || "Upload failed");
          } finally {
            setUploading(false);
          }
        })();
      };

      recorder.start();
      setRecording(true);
      setRecordedUrl(null);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Could not access camera");
    }
  }

  function stopRecording() {
    try {
      mediaRecorderRef.current?.stop();
    } catch (err) {
      console.error(err);
    }
    setRecording(false);
  }

  function downloadRecording() {
    if (!recordedUrl) return;
    const a = document.createElement("a");
    a.href = recordedUrl;
    a.download = `stroke_${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 text-green-400">
      <div className="flex gap-3 mb-3">
        <button
          type="button"
          onClick={startRecording}
          disabled={recording}
          className="px-4 py-2 rounded-lg bg-green-500 text-black font-semibold disabled:opacity-50"
        >
          Record
        </button>
        <button
          type="button"
          onClick={stopRecording}
          disabled={!recording}
          className="px-4 py-2 rounded-lg border border-neutral-800"
        >
          Stop
        </button>
        {recordedUrl && !uploading && (
          <>
            <button type="button" onClick={downloadRecording} className="px-3 py-2 rounded-lg border border-neutral-800">
              Download
            </button>
          </>
        )}
        {uploading && (
          <div className="px-3 py-2 rounded-lg border border-neutral-800 text-xs font-mono text-baseline-text-dim">Uploading...</div>
        )}
      </div>

      <div className="w-full rounded-md overflow-hidden border border-neutral-800">
        {/* Live preview while recording; recorded playback when available */}
        {!recordedUrl ? (
          <video ref={videoRef} className="w-full h-[320px] bg-black object-cover" />
        ) : (
          <video src={recordedUrl} controls className="w-full h-[320px] bg-black object-cover" />
        )}
      </div>

      {uploadUrl && (
        <p className="text-sm text-baseline-text-dim mt-2">
          Uploaded: <a href={uploadUrl} target="_blank" rel="noreferrer" className="underline text-baseline-green">View</a>
        </p>
      )}

      {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
    </div>
  );
}
