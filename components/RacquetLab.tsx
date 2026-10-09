"use client";
import { useEffect, useState } from "react";
import RacquetVisualizer from "./RacquetVisualizer";
import Icon from "./Icons";
import {
  MODELS,
  Setup,
  newSetup,
  calculateSetup,
  balanceLabel,
  isSetup,
} from "@/lib/baseline/racquet";
import { downloadJson } from "@/lib/baseline/data";
import { useLocalData } from "@/lib/baseline/useLocalData";
const validSetups = (v: unknown): v is Setup[] =>
  Array.isArray(v) && v.every(isSetup);
export default function RacquetLab() {
  const [setup, setSetup] = useState<Setup>(newSetup);
  const saved = useLocalData<Setup[]>("baseline_setups_v2", [], validSetups);
  const [compareId, setCompareId] = useState("");
  const [message, setMessage] = useState("");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("baseline_setup_draft_v2");
      if (raw) {
        const v = JSON.parse(raw);
        if (isSetup(v)) setSetup(v);
      }
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready && isSetup(setup)) {
      try {
        localStorage.setItem("baseline_setup_draft_v2", JSON.stringify(setup));
      } catch {}
    }
  }, [setup, ready]);
  const update = (patch: Partial<Setup>) => {
    setSetup((s) => ({ ...s, ...patch }));
    setMessage("");
  };
  const result = calculateSetup(setup);
  const comparison = saved.value.find((s) => s.id === compareId);
  const compared = comparison ? calculateSetup(comparison) : null;
  const valid = isSetup(setup);
  const number = (
    key: keyof Setup,
    label: string,
    min: number,
    max: number,
    step = 0.5,
    help?: string,
  ) => (
    <label className="field">
      {label}
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={setup[key] as number}
        onChange={(e) => update({ [key]: Number(e.target.value) })}
      />
      {help && <small>{help}</small>}
    </label>
  );
  const save = () => {
    if (!valid || !setup.name.trim()) {
      setMessage("Enter a setup name and valid starting specs.");
      return;
    }
    const item = {
      ...setup,
      id: setup.id || crypto.randomUUID(),
      name: setup.name.trim(),
    };
    if (
      saved.save((current) => [
        ...current.filter((s) => s.id !== item.id),
        item,
      ])
    ) {
      setSetup(item);
      setMessage("Setup saved on this device.");
    }
  };
  return (
    <div className="lab-layout">
      <div className="lab-visual panel">
        <div className="eyebrow">YOUR FRAME / LIVE ESTIMATE</div>
        <h2>{setup.model === "Custom frame" ? setup.name : setup.model}</h2>
        <RacquetVisualizer
          frameColor={setup.color}
          leatherGrip={setup.leather > 0}
          lead12={setup.lead12}
          lead39={setup.lead39}
          leadThroat={setup.throat}
        />
        <div className="balance-readout">
          <span>HEAD LIGHT</span>
          <b>{valid ? balanceLabel(result.hl) : "Check inputs"}</b>
          <span>HEAD HEAVY</span>
        </div>
        <div className="balance-track">
          <i
            style={{
              left: `${Math.max(0, Math.min(100, 50 + (result.balance - setup.length / 2) * 7))}%`,
            }}
          />
          <span />
        </div>
        <div className="lab-note">
          Your real racket can differ from catalog specs. Use a scale and
          balance measurement to improve these estimates.
        </div>
        <details className="method-note">
          <summary>How the estimates work</summary>
          <p>
            Weight and balance use added mass and its distance from the butt.
            Swingweight change uses ΔSW = mass (kg) × (distance − 10 cm)². Each
            addition is a point-mass approximation; strings and grips are
            distributed in reality. Twistweight and stiffness are not estimated.
          </p>
          <p>
            Starter catalog values are unstrung estimates carried over from the
            original app; model years and individual frames vary. Check your
            exact model before comparing. Only enter a starting swingweight
            measured in the same condition as the starting weight and balance.
          </p>
          <a
            href="https://twu.tennis-warehouse.com/learning_center/customizationReverse.php"
            target="_blank"
            rel="noreferrer"
          >
            Tennis Warehouse University methodology ↗
          </a>
        </details>
      </div>
      <div className="lab-controls">
        <div className="lab-stats" aria-live="polite">
          <div>
            <span>Estimated weight</span>
            <strong>
              {valid ? result.weight.toFixed(1) : "—"}
              <small> g</small>
            </strong>
            <em>+{result.added.toFixed(1)} g added</em>
          </div>
          <div>
            <span>Estimated balance</span>
            <strong>
              {valid ? result.balance.toFixed(2) : "—"}
              <small> cm</small>
            </strong>
            <em>From the butt cap</em>
          </div>
          <div>
            <span>
              {result.swingweight === null
                ? "Swingweight change"
                : "Estimated swingweight"}
            </span>
            <strong className="lime">
              {valid
                ? result.swingweight === null
                  ? "+" + result.swChange.toFixed(1)
                  : result.swingweight.toFixed(1)
                : "—"}
            </strong>
            <em>
              {result.swingweight === null
                ? "kg·cm² · baseline unknown"
                : "kg·cm² · 10 cm axis"}
            </em>
          </div>
        </div>
        <section className="panel">
          <div className="section-heading">
            <h3>
              <span className="step-number">01</span> Starting racket
            </h3>
            <span className="badge">EDITABLE SPECS</span>
          </div>
          <label className="field">
            Frame model
            <select
              value={setup.model}
              onChange={(e) => {
                const m = MODELS.find((m) => m.name === e.target.value);
                update(
                  m
                    ? {
                        model: m.name,
                        color: m.color,
                        baseWeight: m.baseWeight,
                        baseBalance: m.baseBalance,
                        baseSW: null,
                        condition: "unstrung",
                        strings: 16,
                        length: 68.58,
                        id: "",
                        name: m.name.split(" (")[0] + " setup",
                      }
                    : { model: "Custom frame", id: "", name: "Custom setup" },
                );
              }}
            >
              {MODELS.map((m) => (
                <option key={m.name}>{m.name}</option>
              ))}
              <option>Custom frame</option>
            </select>
          </label>
          <div className="form-grid mt-4">
            <label className="field">
              Starting condition
              <select
                value={setup.condition}
                onChange={(e) => {
                  const condition = e.target.value as Setup["condition"];
                  update({
                    condition,
                    strings: condition === "ready" ? 0 : 16,
                    baseSW: null,
                  });
                }}
              >
                <option value="unstrung">Unstrung frame</option>
                <option value="ready">Already strung / measured setup</option>
              </select>
            </label>
            {number("length", "Length (cm)", 50, 80, 0.01)}
          </div>
          <p className="helper">
            {setup.condition === "ready"
              ? "Enter the weight and balance of your complete starting racket below. Add only accessories not already included."
              : "Starting specs include the factory grip, but no strings. The additions below are counted separately."}
          </p>
          <div className="form-grid three">
            {number("baseWeight", "Starting weight (g)", 100, 600, 0.1)}
            {number(
              "baseBalance",
              "Starting balance (cm)",
              1,
              setup.length,
              0.01,
            )}
            <label className="field">
              Starting SW (optional)
              <input
                type="number"
                min="0"
                max="800"
                step=".1"
                placeholder="Unknown"
                value={setup.baseSW ?? ""}
                onChange={(e) =>
                  update({
                    baseSW:
                      e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              />
            </label>
          </div>
        </section>
        <section className="panel">
          <div className="section-heading">
            <h3>
              <span className="step-number">02</span> Customize the feel
            </h3>
            <button
              className="text-button"
              onClick={() =>
                update({
                  lead12: 0,
                  lead39: 0,
                  throat: 0,
                  butt: 0,
                  leather: 0,
                  overgrips: 0,
                  strings: 0,
                })
              }
            >
              Clear additions
            </button>
          </div>
          <div className="addition-grid">
            {number(
              "lead12",
              "12 o’clock · tip (g)",
              0,
              100,
              0.5,
              "More weight far from the hand has a larger SW effect.",
            )}
            {number(
              "lead39",
              "3 + 9 o’clock · total (g)",
              0,
              100,
              0.5,
              "Combined mass: split equally between both sides.",
            )}
            {number("throat", "Throat (g)", 0, 100, 0.5)}
            {number("butt", "Inside butt cap (g)", 0, 100, 0.5)}
            {number(
              "overgrips",
              "Extra overgrips",
              0,
              5,
              1,
              "5.5 g each, approximate.",
            )}
            {number(
              "leather",
              "Grip replacement · net added (g)",
              0,
              100,
              0.5,
              "New grip weight minus the removed grip weight.",
            )}
            {number(
              "strings",
              "Additional string mass (g)",
              0,
              40,
              0.5,
              "Use 0 if strings are included in the starting specs.",
            )}
          </div>
        </section>
        <section className="panel">
          <div className="section-heading">
            <h3>
              <span className="step-number">03</span> Save & compare
            </h3>
            <span className="badge">{saved.value.length} SAVED</span>
          </div>
          <div className="form-grid">
            <label className="field">
              Setup name
              <input
                maxLength={80}
                value={setup.name}
                onChange={(e) => update({ name: e.target.value })}
                placeholder="Match day / 2 g at 12"
              />
            </label>
            <label className="field">
              Strings & gauge
              <input
                maxLength={100}
                value={setup.stringName}
                onChange={(e) => update({ stringName: e.target.value })}
                placeholder="e.g. Tour Bite 1.25"
              />
            </label>
          </div>
          <div className="form-grid mt-4">
            <label className="field">
              Tension (include unit)
              <input
                value={setup.tension}
                maxLength={60}
                onChange={(e) => update({ tension: e.target.value })}
                placeholder="e.g. 23 / 22 kg"
              />
            </label>
            <label className="field">
              On-court notes
              <input
                value={setup.notes}
                maxLength={500}
                onChange={(e) => update({ notes: e.target.value })}
                placeholder="What changed in the feel?"
              />
            </label>
          </div>
          <div className="button-row">
            <button
              className="button primary"
              disabled={!valid || !saved.ready || !!saved.error}
              onClick={save}
            >
              <Icon name="check" />
              {setup.id ? "Update setup" : "Save setup"}
            </button>
            <button
              className="button"
              disabled={!valid}
              onClick={() => {
                setSetup({ ...setup, id: "", name: setup.name + " copy" });
                setMessage("Copy ready. Give it a name and save.");
              }}
            >
              Make a copy
            </button>
            <button
              className="button"
              disabled={!valid}
              onClick={() =>
                downloadJson("baseline-racket-setup.json", {
                  setup,
                  estimates: result,
                  method: "Point-mass estimate; 10 cm swingweight axis",
                })
              }
            >
              <Icon name="download" />
              Export specs
            </button>
          </div>
          {(message || saved.error || !valid) && (
            <p role="status" className="notice">
              {saved.error ||
                (!valid
                  ? "Check the starting specs and additions: values must be within the shown limits."
                  : message)}
            </p>
          )}
          {saved.value.length > 0 && (
            <>
              <div className="form-grid mt-4">
                <label className="field">
                  Load saved setup
                  <select
                    value={setup.id}
                    onChange={(e) => {
                      const s = saved.value.find(
                        (s) => s.id === e.target.value,
                      );
                      if (s) {
                        setSetup(s);
                        setMessage("Saved setup loaded.");
                      }
                    }}
                  >
                    <option value="">Choose a saved setup</option>
                    {saved.value.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  Compare current setup with
                  <select
                    value={compareId}
                    onChange={(e) => setCompareId(e.target.value)}
                  >
                    <option value="">Choose a comparison</option>
                    {saved.value.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {comparison && compared && valid && (
                <div className="table-wrap">
                  <table>
                    <caption>
                      Current setup compared with {comparison.name}
                    </caption>
                    <thead>
                      <tr>
                        <th>Spec</th>
                        <th>Current</th>
                        <th>Saved</th>
                        <th>Difference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["Weight (g)", result.weight, compared.weight],
                        ["Balance (cm)", result.balance, compared.balance],
                        ["Added SW (kg·cm²)", result.swChange, compared.swChange],
                        [
                          "Swingweight",
                          result.swingweight,
                          compared.swingweight,
                        ],
                      ].map(([label, a, b]) => (
                        <tr key={String(label)}>
                          <th>{label}</th>
                          <td>
                            {a === null ? "Unknown" : Number(a).toFixed(1)}
                          </td>
                          <td>
                            {b === null ? "Unknown" : Number(b).toFixed(1)}
                          </td>
                          <td>
                            {a === null || b === null
                              ? "—"
                              : `${Number(a) - Number(b) >= 0 ? "+" : ""}${(Number(a) - Number(b)).toFixed(1)}`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="muted">Added SW compares the effect of your additions. It does not compare total swingweight when either starting SW is unknown.</p>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
