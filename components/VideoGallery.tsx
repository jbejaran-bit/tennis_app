"use client";
import { createRecordId } from "@/lib/baseline/record-id";
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { isVideoFile, listVideos, LocalVideo, saveVideo, videoFilename } from "@/lib/baseline/videos";
import StrokeRecorder from "./StrokeRecorder";
import Icon from "./Icons";
import { dateLabel } from "@/lib/baseline/data";
function VideoCard({ video }: { video: LocalVideo }) {
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState(video.notes);
  const [savedNotes,setSavedNotes]=useState(video.notes);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [playbackError, setPlaybackError] = useState(false);
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const u = URL.createObjectURL(video.blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [video.blob]);
  async function save() {
    if (saving) return;
    setSaving(true);
    try {
      await saveVideo({ ...video, notes });
      setSavedNotes(notes);setStatus("Notes saved.");
    } catch {
      setStatus("Could not save notes. Your clip is unchanged.");
    } finally {
      setSaving(false);
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
        aria-label={`Practice clip: ${video.title}`}
        onError={() => setPlaybackError(true)}
        onLoadedData={() => setPlaybackError(false)}
      />
      {playbackError && <p className="notice" role="alert">This browser could not play this clip. Your saved file is unchanged. Download it to watch in your device’s video player, or upload an MP4 version.</p>}
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
          disabled={saving}
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
        <button className="button" onClick={save} disabled={saving}>
          {saving ? "Saving notes…" : "Save notes"}
        </button>
        <button className="text-button" disabled={saving || notes===savedNotes} onClick={()=>{setNotes(savedNotes);setStatus("Unsaved note edits reset.");}}>Reset note edits</button>
        <a
          className="text-button"
          href={url}
          download={videoFilename(video)}
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
  const [error, setError] = useState("");
  const [storageError, setStorageError] = useState("");
  const [busy, setBusy] = useState(false);
  const [record, setRecord] = useState(false);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setVideos(await listVideos());
      setStorageError("");
    } catch {
      setStorageError(
        "Local video storage is unavailable. You can still record and download a clip.",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  async function add(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    if (!isVideoFile(file)) {
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
        id: createRecordId(),
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
          <div className="eyebrow">Practice videos</div>
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
      {storageError && <div className="notice" role="alert"><p>{storageError}</p><button className="text-button" onClick={load} disabled={loading}>{loading ? "Opening storage…" : "Retry local storage"}</button></div>}
      {loading ? (
        <div className="panel empty-state">Opening your journal…</div>
      ) : !storageError && !videos.length && !record ? (
        <div className="panel empty-state">
          <Icon name="video" />
          <h3>Add your first practice clip.</h3>
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
      </div>
    </div>
  );
}
