"use client";
import { useEffect, useRef, useState } from "react";
import { saveVideo } from "@/lib/baseline/videos";
import Icon from "./Icons";
type Props = {
  onRecorded?: (blob: Blob) => void;
  lessonTitle?: string;
  onSaved?: () => void;
};
export default function StrokeRecorder({
  onRecorded,
  lessonTitle,
  onSaved,
}: Props) {
  const preview = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const mounted = useRef(true);
  const [recording, setRecording] = useState(false);
  const [starting, setStarting] = useState(false);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      stream.current?.getTracks().forEach((t) => t.stop());
      if (recorder.current?.state === "recording") recorder.current.stop();
    };
  }, []);
  useEffect(() => {
    if (!blob) {
      setUrl("");
      return;
    }
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  useEffect(() => {
    if (recording && preview.current && stream.current) {
      preview.current.srcObject = stream.current;
      preview.current.play().catch(() => {});
    }
  }, [recording]);
  async function start() {
    setError("");
    setStarting(true);
    setSaved(false);
    setBlob(null);
    try {
      if (
        !navigator.mediaDevices?.getUserMedia ||
        typeof MediaRecorder === "undefined"
      )
        throw new Error(
          "Recording is not supported here. Use your phone camera and add the clip instead.",
        );
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      if (!mounted.current) {
        s.getTracks().forEach((t) => t.stop());
        return;
      }
      stream.current = s;
      const mime = [
        "video/webm;codecs=vp9",
        "video/webm;codecs=vp8",
        "video/mp4",
      ].find((t) => MediaRecorder.isTypeSupported(t));
      const r = new MediaRecorder(s, mime ? { mimeType: mime } : undefined);
      recorder.current = r;
      chunks.current = [];
      r.ondataavailable = (e) => {
        if (e.data.size) chunks.current.push(e.data);
      };
      r.onstop = () => {
        s.getTracks().forEach((t) => t.stop());
        stream.current = null;
        if (!mounted.current) return;
        const video = new Blob(chunks.current, {
          type: r.mimeType || "video/webm",
        });
        setBlob(video);
        setRecording(false);
        onRecorded?.(video);
      };
      r.onerror = () => {
        s.getTracks().forEach((t) => t.stop());
        if (mounted.current) {
          setRecording(false);
          setError(
            "Recording stopped unexpectedly. Try again or add a clip from your device.",
          );
        }
      };
      r.start(1000);
      setRecording(true);
    } catch (e) {
      stream.current?.getTracks().forEach((t) => t.stop());
      setError(e instanceof Error ? e.message : "Could not access camera.");
    } finally {
      if (mounted.current) setStarting(false);
    }
  }
  async function save() {
    if (!blob) return;
    setSaving(true);
    try {
      await saveVideo({
        id: crypto.randomUUID(),
        title: lessonTitle || "Practice recording",
        createdAt: new Date().toISOString(),
        blob,
        notes: "",
      });
      setSaved(true);
      onSaved?.();
    } catch {
      setError("Could not save this clip. Download it to keep a copy.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="recorder">
      <div className="recorder-preview">
        {recording ? (
          <video ref={preview} muted playsInline autoPlay />
        ) : url ? (
          <video src={url} controls playsInline />
        ) : (
          <div className="empty-state">
            <Icon name="video" />
            <h3>See your next improvement</h3>
            <p>
              Record a short clip or add one from your phone. Camera access
              starts only when you press Record.
            </p>
          </div>
        )}
      </div>
      <div className="button-row">
        {recording ? (
          <button
            className="button danger"
            onClick={() => recorder.current?.stop()}
          >
            Stop recording
          </button>
        ) : (
          <button className="button" disabled={starting} onClick={start}>
            <Icon name="video" />
            {starting
              ? "Opening camera…"
              : url
                ? "Record again"
                : "Record a clip"}
          </button>
        )}
        {url && (
          <>
            <button
              className="button primary"
              disabled={saved || saving}
              onClick={save}
            >
              {saving
                ? "Saving…"
                : saved
                  ? "Saved to journal"
                  : "Save to journal"}
            </button>
            <a
              className="button"
              href={url}
              download={`baseline-recording.${blob?.type.includes("mp4") ? "mp4" : "webm"}`}
            >
              Download
            </a>
          </>
        )}
      </div>
      <p className="helper">
        Silent video. Recordings stay on this device unless you download and
        share them.
      </p>
      {error && (
        <p className="notice" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
