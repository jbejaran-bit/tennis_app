"use client";
import { FormEvent, useState } from "react";
import {
  drills,
  lessons,
  PracticeSession,
  today,
  dateLabel,
} from "@/lib/baseline/data";
import { SaveLocal } from "@/lib/baseline/useLocalData";
import Modal from "./Modal";
import Icon from "./Icons";
export function LessonsHub({
  onPractice,
}: {
  onPractice: (id: string) => void;
}) {
  const [active, setActive] = useState<string | null>(null);
  return (
    <div className="lesson-grid">
      {lessons.map((lesson, i) => (
        <article className="panel lesson-card" key={lesson.id}>
          <div className="lesson-art" aria-hidden="true">
            <span>0{i + 1}</span>
            <svg viewBox="0 0 240 130">
              <path d="M30 15h180v100H30zM30 65h180M65 15v100m110-100v100M65 40h110m-110 50h110M120 40v50" />
              <path
                className="ball-path"
                d={i % 2 ? "M80 98 Q 120 20 160 30" : "M75 95 Q 170 85 165 30"}
              />
              <circle cx={i % 2 ? 160 : 165} cy="30" r="5" />
            </svg>
          </div>
          <div className="eyebrow">
            {lesson.tag} / {lesson.level}
          </div>
          <h2>{lesson.title}</h2>
          <p>{lesson.description}</p>
          <button
            className="text-button"
            onClick={() => setActive(active === lesson.id ? null : lesson.id)}
            aria-expanded={active === lesson.id}
          >
            {active === lesson.id ? "Close guide" : "Read the pattern"}{" "}
            <Icon name="arrow" />
          </button>
          {active === lesson.id && (
            <div className="lesson-details">
              <ol>
                {lesson.cues.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ol>
              <div className="focus-note">
                <span>AFTER YOUR SESSION</span>
                <p>{lesson.question}</p>
              </div>
              <button
                className="button primary"
                onClick={() => onPractice(lesson.drill)}
              >
                Practice this pattern <Icon name="arrow" />
              </button>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
export default function TrainingHub({
  sessions,
  saveSessions,
  initialDrill,
  error,
}: {
  sessions: PracticeSession[];
  saveSessions: SaveLocal<PracticeSession[]>;
  initialDrill?: string;
  error?: string;
}) {
  const [filter, setFilter] = useState("All");
  const [active, setActive] = useState(initialDrill || "");
  const [log, setLog] = useState(false);
  const [notice, setNotice] = useState("");
  const drill = drills.find((d) => d.id === active);
  function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const minutes = Number(f.get("minutes"));
    if (!drill || !Number.isFinite(minutes) || minutes < 1 || minutes > 300)
      return;
    if (
      saveSessions((current) => [
        {
          id: crypto.randomUUID(),
          drillId: drill.id,
          date: String(f.get("date")),
          minutes,
          notes: String(f.get("notes")),
        },
        ...current,
      ])
    ) {
      setLog(false);
      setNotice(
        "Practice saved. Keep a note of the result to compare next time.",
      );
    }
  }
  return (
    <div className="training-layout">
      <div>
        <div className="filter-row" aria-label="Filter drills">
          {["All", "Solo", "Partner", "Wall"].map((f) => (
            <button
              key={f}
              className={`filter-chip ${f === filter ? "selected" : ""}`}
              onClick={() => setFilter(f)}
              aria-pressed={f === filter}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="drill-grid">
          {drills
            .filter((d) => filter === "All" || d.mode === filter)
            .map((d, i) => (
              <button
                key={d.id}
                className={`panel drill-card ${active === d.id ? "active" : ""}`}
                onClick={() => {
                  setActive(d.id);
                  setNotice("");
                }}
                aria-pressed={active === d.id}
              >
                <div className="section-heading">
                  <span className="drill-index">0{drills.indexOf(d) + 1}</span>
                  <span className="badge">{d.mode}</span>
                </div>
                <div className="eyebrow">{d.category}</div>
                <h3>{d.title}</h3>
                <p>{d.target}</p>
                <div className="drill-footer">
                  <span>{d.minutes} MIN</span>
                  <Icon name="arrow" />
                </div>
              </button>
            ))}
        </div>
        {sessions.length > 0 && (
          <section className="panel practice-history">
            <div className="section-heading">
              <h3>Practice journal</h3>
              <span className="badge">{sessions.length} SESSIONS</span>
            </div>
            {sessions.slice(0, 10).map((s) => (
              <div className="journal-row" key={s.id}>
                <div>
                  <b>
                    {drills.find((d) => d.id === s.drillId)?.title ||
                      "Practice session"}
                  </b>
                  <p>{s.notes || "No notes added"}</p>
                </div>
                <span>
                  {dateLabel(s.date)}
                  <br />
                  {s.minutes} min
                </span>
              </div>
            ))}
          </section>
        )}
      </div>
      <aside className="panel training-detail">
        {drill ? (
          <>
            <div className="eyebrow">YOUR NEXT SESSION</div>
            <h2>{drill.title}</h2>
            <div className="pill-row">
              <span className="badge">{drill.minutes} MIN</span>
              <span className="badge">{drill.mode.toUpperCase()}</span>
            </div>
            <p>{drill.detail}</p>
            <h4>Session structure</h4>
            <ol>
              {drill.rounds.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ol>
            <div className="focus-note">
              <span>ONE THING TO FOCUS ON</span>
              <p>{drill.cue}</p>
            </div>
            <p className="helper">Bring: {drill.equipment}</p>
            <button
              className="button primary full"
              onClick={() => setLog(true)}
            >
              <Icon name="check" />
              Log this practice
            </button>
          </>
        ) : (
          <div className="empty-state">
            <Icon name="training" />
            <h3>Choose your next drill</h3>
            <p>Pick a session to see its structure, target and coaching cue.</p>
          </div>
        )}
        {notice && (
          <p className="notice" role="status">
            {notice}
          </p>
        )}
      </aside>
      {log && drill && (
        <Modal title="Log your practice" onClose={() => setLog(false)}>
          <form onSubmit={save} className="form-stack">
            <p>{drill.title}</p>
            <div className="form-grid">
              <label className="field">
                Date
                <input
                  type="date"
                  name="date"
                  defaultValue={today()}
                  max={today()}
                  required
                />
              </label>
              <label className="field">
                Minutes practiced
                <input
                  type="number"
                  min="1"
                  max="300"
                  name="minutes"
                  defaultValue={drill.minutes}
                  required
                />
              </label>
            </div>
            <label className="field">
              Result & next-session note
              <textarea
                name="notes"
                maxLength={2000}
                rows={4}
                placeholder="e.g. 18/30 target hits. Wide serve needs more margin."
              />
            </label>
            {error && <p role="alert" className="notice">{error}</p>}
            <button className="button primary" type="submit">
              Save practice
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
