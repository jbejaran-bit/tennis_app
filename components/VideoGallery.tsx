"use client";
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { listVideos, LocalVideo, saveVideo } from "@/lib/baseline/videos";
import StrokeRecorder from "./StrokeRecorder";
import Icon from "./Icons";
import { dateLabel } from "@/lib/baseline/data";
type CloudVideo = {
  id: string;
  lesson_title: string;
  storage_url: string;
  created_at: string;
};
function VideoCard({ video }: { video: LocalVideo }) {
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState(video.notes);
  const [status, setStatus] = useState("");
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const u = URL.createObjectURL(video.blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [video.blob]);
  async function save() {
    try {
      await saveVideo({ ...video, notes });
      setStatus("Notes saved.");
    } catch {
      setStatus("Could not save notes. Your clip is unchanged.");
    }
  }
  return (
    <article className="panel video-card">
      <video
        ref={ref}
        src={url || undefined}
        controls
        playsInline
        preload="metadata"
      />
      <div className="section-heading">
        <div>
          <h3>{video.title}</h3>
          <small>{dateLabel(video.createdAt)} · On this device</small>
        </div>
        <label className="field compact">
          Speed
          <select
            aria-label={`Playback speed for ${video.title}`}
            defaultValue="1"
            onChange={(e) => {
              if (ref.current)
                ref.current.playbackRate = Number(e.target.value);
            }}
          >
            <option value=".25">0.25×</option>
            <option value=".5">0.5×</option>
            <option value="1">1×</option>
          </select>
        </label>
      </div>
      <label className="field">
        Observation
        <textarea
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            setStatus("");
          }}
          maxLength={3000}
          rows={2}
          placeholder="What do you notice? One cue for next time…"
        />
      </label>
      <div className="button-row">
        <button className="button" onClick={save}>
          Save notes
        </button>
        <a
          className="text-button"
          href={url}
          download={
            video.title.replace(/[^\w -]/g, "") +
            (video.blob.type.includes("mp4") ? ".mp4" : ".webm")
          }
        >
          Download <Icon name="download" />
        </a>
      </div>
      {status && (
        <p className="helper" role="status">
          {status}
        </p>
      )}
    </article>
  );
}
export default function VideoGallery() {
  const [videos, setVideos] = useState<LocalVideo[]>([]);
  const [cloud, setCloud] = useState<CloudVideo[]>([]);
  const [error, setError] = useState("");
  const [cloudMessage, setCloudMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [record, setRecord] = useState(false);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    try {
      setVideos(await listVideos());
    } catch {
      setError(
        "Local video storage is unavailable. You can still record and download a clip.",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  const loadCloud = useCallback(async () => {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
      return;
    setCloudMessage("Checking saved cloud clips…");
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setCloudMessage("");
        return;
      }
      const { data, error } = await supabase
        .from("videos")
        .select("id,lesson_title,storage_url,created_at")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .abortSignal(AbortSignal.timeout(8000));
      if (error) throw error;
      setCloud(
        (data || []).filter(
          (v) =>
            typeof v.storage_url === "string" &&
            v.storage_url.startsWith("https://"),
        ),
      );
      setCloudMessage("");
    } catch {
      setCloudMessage(
        "Cloud clips are unavailable right now. Your local journal still works.",
      );
    }
  }, []);
  useEffect(() => {
    load();
    loadCloud();
  }, [load, loadCloud]);
  async function add(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    if (!file.type.startsWith("video/")) {
      setError("Choose a video file.");
      e.target.value = "";
      return;
    }
    if (file.size > 150 * 1024 * 1024) {
      setError("Choose a clip under 150 MB. Trim a shorter segment first.");
      e.target.value = "";
      return;
    }
    setBusy(true);
    try {
      await saveVideo({
        id: crypto.randomUUID(),
        title: file.name.replace(/\.[^.]+$/, ""),
        blob: file,
        createdAt: new Date().toISOString(),
        notes: "",
      });
      await load();
    } catch {
      setError(
        "Could not save the clip. Device storage may be full. The original file is unchanged.",
      );
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }
  return (
    <div className="video-hub">
      <section className="panel video-intro">
        <div>
          <div className="eyebrow">WATCH. NOTICE. PRACTICE.</div>
          <h2>Your video journal</h2>
          <p>
            Keep short practice clips, slow them down, and leave one useful
            observation.
          </p>
          <p className="helper">
            New clips are stored in this browser, up to 150 MB each. Download a
            backup before clearing browser data.
          </p>
        </div>
        <div className="button-row">
          <label
            className={`button primary file-button ${busy ? "disabled" : ""}`}
          >
            <Icon name="plus" />
            {busy ? "Saving clip…" : "Add a clip"}
            <input
              aria-label="Add a video clip"
              type="file"
              accept="video/*"
              disabled={busy}
              onChange={add}
            />
          </label>
          <button
            className="button"
            onClick={() => setRecord(!record)}
            aria-expanded={record}
          >
            <Icon name="video" />
            {record ? "Close recorder" : "Record"}
          </button>
        </div>
      </section>
      {record && (
        <section className="panel">
          <StrokeRecorder onSaved={load} />
        </section>
      )}
      {error && (
        <p className="notice" role="alert">
          {error}
        </p>
      )}
      {cloudMessage && (
        <div className="notice">
          {cloudMessage}
          <button className="text-button" onClick={loadCloud}>
            Retry cloud clips
          </button>
        </div>
      )}
      {loading ? (
        <div className="panel empty-state">Opening your journal…</div>
      ) : !videos.length && !cloud.length && !record ? (
        <div className="panel empty-state">
          <Icon name="video" />
          <h3>One clip. One thing to improve.</h3>
          <p>
            Add a serve, rally, or footwork clip to begin. Your videos will
            appear here.
          </p>
        </div>
      ) : null}
      <div className="video-grid">
        {videos.map((v) => (
          <VideoCard key={v.id} video={v} />
        ))}
        {cloud.map((v) => (
          <article className="panel video-card" key={v.id}>
            <video
              src={v.storage_url}
              controls
              playsInline
              preload="metadata"
            />
            <h3>{v.lesson_title || "Saved practice clip"}</h3>
            <p>{dateLabel(v.created_at)} · Cloud recording</p>
          </article>
        ))}
      </div>
    </div>
  );
}
