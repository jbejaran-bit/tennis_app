"use client";
import { FormEvent, useState } from "react";
import {
  Match,
  surfaces,
  today,
  dateLabel,
  isLegacyDemo,
} from "@/lib/baseline/data";
import Modal from "./Modal";
import Icon from "./Icons";
export function MatchForm({
  initial,
  onSave,
  onClose,
}: {
  initial?: Match;
  onSave: (m: Match) => void;
  onClose: () => void;
}) {
  function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const optional = (k: string) =>
      String(f.get(k)).trim() === "" ? null : Number(f.get(k));
    onSave({
      id: initial?.id || crypto.randomUUID(),
      opponent: String(f.get("opponent")).trim(),
      score: String(f.get("score")).trim(),
      surface: String(f.get("surface")),
      date: String(f.get("date")),
      result: f.get("result") as Match["result"],
      style: String(f.get("style")),
      firstServe: optional("firstServe"),
      unforcedErrors: optional("unforcedErrors"),
      notes: String(f.get("notes")),
      focus: String(f.get("focus")),
      setup: String(f.get("setup")),
    });
  }
  return (
    <Modal title={initial ? "Edit match" : "Log a match"} onClose={onClose}>
      <form className="form-stack" onSubmit={save}>
        <div className="form-grid">
          <label className="field">
            Opponent
            <input
              name="opponent"
              required
              maxLength={100}
              defaultValue={initial?.opponent}
              placeholder="Opponent name"
              autoFocus
            />
          </label>
          <label className="field">
            Date
            <input
              type="date"
              name="date"
              required
              max={today()}
              defaultValue={initial?.date || today()}
            />
          </label>
          <label className="field">
            Score (your score first)
            <input
              name="score"
              required
              maxLength={100}
              defaultValue={initial?.score}
              placeholder="6–4, 3–6, 7–5"
            />
          </label>
          <label className="field">
            Result
            <select name="result" defaultValue={initial?.result || "win"}>
              <option value="win">Won</option>
              <option value="loss">Lost</option>
            </select>
          </label>
          <label className="field">
            Court surface
            <select name="surface" defaultValue={initial?.surface || "hard"}>
              {Object.entries(surfaces).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Opponent style
            <select name="style" defaultValue={initial?.style || "Unknown"}>
              {[
                "Unknown",
                "All-Court",
                "Aggressive Baseliner",
                "Counterpuncher",
                "Serve & Volley",
              ].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="form-divider">
          Optional stats · leave blank if you did not track them
        </div>
        <div className="form-grid">
          <label className="field">
            First serves in (%)
            <input
              name="firstServe"
              type="number"
              min="0"
              max="100"
              step=".1"
              defaultValue={initial?.firstServe ?? ""}
              placeholder="Not tracked"
            />
          </label>
          <label className="field">
            Unforced errors
            <input
              name="unforcedErrors"
              type="number"
              min="0"
              max="999"
              step="1"
              defaultValue={initial?.unforcedErrors ?? ""}
              placeholder="Not tracked"
            />
          </label>
          <label className="field">
            Racket / string setup
            <input
              name="setup"
              defaultValue={initial?.setup}
              maxLength={150}
              placeholder="Which setup did you use?"
            />
          </label>
          <label className="field">
            Next practice focus
            <input
              name="focus"
              defaultValue={initial?.focus}
              maxLength={200}
              placeholder="One thing to work on"
            />
          </label>
        </div>
        <label className="field">
          Match notes
          <textarea
            name="notes"
            defaultValue={initial?.notes}
            rows={3}
            maxLength={3000}
            placeholder="What worked? What broke down under pressure?"
          />
        </label>
        <div className="button-row">
          <button type="submit" className="button primary">
            Save match
          </button>
          <button type="button" className="button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}
export default function MatchHub({
  matches,
  onLog,
  onEdit,
  onPractice,
}: {
  matches: Match[];
  onLog: () => void;
  onEdit: (m: Match) => void;
  onPractice: (id: string) => void;
}) {
  const [selected, setSelected] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const visible = matches
    .filter(
      (m) =>
        m.opponent.toLowerCase().includes(query.toLowerCase()) &&
        (filter === "all" || m.result === filter),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  const active = visible.find((m) => m.id === selected) || visible[0];
  return (
    <div className="match-layout">
      <section className="panel match-log">
        <div className="section-heading">
          <h2>Your match log</h2>
          <button className="button primary" onClick={onLog}>
            <Icon name="plus" />
            Log match
          </button>
        </div>
        <div className="match-filters">
          <label className="sr-only" htmlFor="match-search">
            Search opponents
          </label>
          <input
            id="match-search"
            placeholder="Search opponents…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <label className="sr-only" htmlFor="match-filter">
            Filter results
          </label>
          <select
            id="match-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All results</option>
            <option value="win">Wins</option>
            <option value="loss">Losses</option>
          </select>
        </div>
        {!visible.length ? (
          <div className="empty-state">
            <Icon name="matches" />
            <h3>
              {matches.length
                ? "No matching matches"
                : "Your story starts on court"}
            </h3>
            <p>
              {matches.length
                ? "Try another opponent or result filter."
                : "Log a match to build a picture of your game. Only track the stats you actually know."}
            </p>
            {!matches.length && (
              <button className="button" onClick={onLog}>
                Log your first match
              </button>
            )}
          </div>
        ) : (
          <div className="match-list">
            {visible.map((m) => (
              <button
                key={m.id}
                className={`match-row ${active?.id === m.id ? "active" : ""}`}
                onClick={() => setSelected(m.id)}
              >
                <span className={`result-mark ${m.result}`}>
                  {m.result === "win" ? "W" : "L"}
                </span>
                <span className="match-person">
                  <b>vs {m.opponent}</b>
                  <small>
                    {dateLabel(m.date)} · {surfaces[m.surface]}
                    {isLegacyDemo(m) ? " · Sample" : ""}
                  </small>
                </span>
                <span className="match-score">{m.score}</span>
                <Icon name="arrow" />
              </button>
            ))}
          </div>
        )}
      </section>
      <aside className="panel match-review">
        {active ? (
          <>
            <div className="section-heading">
              <div className="eyebrow">MATCH REFLECTION</div>
              <button className="text-button" onClick={() => onEdit(active)}>
                Edit
              </button>
            </div>
            <h2>vs {active.opponent}</h2>
            <p>
              {active.score} · {surfaces[active.surface]}
            </p>
            {isLegacyDemo(active) && (
              <p className="notice">
                Sample match from the original app. Excluded from your
                performance totals.
              </p>
            )}
            <div className="review-stats">
              <div>
                <strong>
                  {active.firstServe === null ? "—" : active.firstServe + "%"}
                </strong>
                <span>First serves in</span>
              </div>
              <div>
                <strong>{active.unforcedErrors ?? "—"}</strong>
                <span>Unforced errors</span>
              </div>
            </div>
            <h4>Your match notes</h4>
            <p className="preserve-lines">
              {active.notes ||
                "No notes yet. Add the patterns you noticed while they are fresh."}
            </p>
            {active.setup && (
              <div className="focus-note">
                <span>SETUP USED</span>
                <p>{active.setup}</p>
              </div>
            )}
            <div className="focus-note">
              <span>NEXT PRACTICE FOCUS</span>
              <p>
                {active.focus ||
                  "Choose one repeatable pattern to work on, then track it in your next session."}
              </p>
            </div>
            <h4>A starting point for practice</h4>
            <p>
              {active.firstServe !== null
                ? "You recorded " +
                  active.firstServe +
                  "% first serves in. A target drill gives you a repeatable way to practice placement and compare sessions."
                : "You did not track serve percentage. Try a rally drill with a simple, countable target for your next session."}
            </p>
            <button
              className="button primary full"
              onClick={() =>
                onPractice(active.firstServe !== null ? "serve" : "depth")
              }
            >
              Open suggested drill <Icon name="arrow" />
            </button>
            <p className="helper">
              Reflection based on your entries. Match stats alone cannot reveal
              stroke mechanics.
            </p>
          </>
        ) : (
          <div className="empty-state">
            <h3>A clearer next step</h3>
            <p>
              Select a match to review your notes and choose a practice focus.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
