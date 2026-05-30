"use client";

import { useState } from "react";
import RacquetVisualizer from "./RacquetVisualizer";

const MODELS = [
  { name: "Pure Aero 98", color: "#eab308", baseWeight: 305, baseBalance: 31.5, baseSW: 320 },
  { name: "Pure Drive", color: "#3b82f6", baseWeight: 300, baseBalance: 32.0, baseSW: 320 },
  { name: "Pro Staff 97", color: "#ef4444", baseWeight: 315, baseBalance: 31.0, baseSW: 320 },
];

export default function RacquetLab() {
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const [overgrips, setOvergrips] = useState(1);
  const [hasLeatherGrip, setHasLeatherGrip] = useState(false);

  const [lead12, setLead12] = useState(0);
  const [lead39, setLead39] = useState(0);
  const [leadThroat, setLeadThroat] = useState(0);
  const [tailWeight, setTailWeight] = useState(0);
  const [stringWeight, setStringWeight] = useState(0);

  const OVERGRIP_PER = 5.5;
  const LEATHER_WT = 10;

  const DIST_12 = 68;
  const DIST_39 = 54;
  const DIST_THROAT = 33;
  const DIST_HANDLE = 7;
  const DIST_STRINGS = 53;
  const DIST_OVERGRIP = 10;

  const parseGramInput = (value: string): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
  };

  const overgripTotalWeight = overgrips * OVERGRIP_PER;
  const leatherMass = hasLeatherGrip ? LEATHER_WT : 0;

  const totalAddedMass = overgripTotalWeight + leatherMass + lead12 + lead39 + leadThroat + tailWeight + stringWeight;
  const finalWeight = Math.max(1, selectedModel.baseWeight + totalAddedMass);

  const baseMoment = selectedModel.baseWeight * selectedModel.baseBalance;
  const addedMoment = (lead12 * DIST_12) + (lead39 * DIST_39) + (leadThroat * DIST_THROAT) + ((leatherMass + tailWeight) * DIST_HANDLE) + (overgripTotalWeight * DIST_OVERGRIP) + (stringWeight * DIST_STRINGS);
  const finalBalance = (baseMoment + addedMoment) / finalWeight;

  const calcSWShift = (mass: number, dist: number) => mass * Math.pow(dist - 10, 2) / 1000;

  const swShift = calcSWShift(lead12, DIST_12) +
                  calcSWShift(lead39, DIST_39) +
                  calcSWShift(leadThroat, DIST_THROAT) +
                  calcSWShift(leatherMass + tailWeight, DIST_HANDLE) +
                  calcSWShift(overgripTotalWeight, DIST_OVERGRIP) +
                  calcSWShift(stringWeight, DIST_STRINGS);

  const finalSW = selectedModel.baseSW + swShift;

  const balancePercent = Math.max(0, Math.min(100, ((finalBalance - 30) / (35 - 30)) * 100));

  return (
    <div className="flex flex-col lg:flex-row gap-8 overflow-hidden">
      <div className="w-full lg:w-5/12 space-y-6">
        <h3 className="text-xl font-bold text-white">Frame Visualizer</h3>
        <RacquetVisualizer
          frameColor={selectedModel.color}
          leatherGrip={hasLeatherGrip}
          lead12={lead12}
          lead39={lead39}
          leadThroat={leadThroat}
        />

        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl">
          <div className="flex justify-between text-xs font-bold text-neutral-400 mb-2 uppercase tracking-wider">
            <span>Head Light (HL)</span>
            <span>Head Heavy (HH)</span>
          </div>
          <div className="relative h-2 bg-neutral-800 rounded-full w-full">
            <div className="absolute top-0 bottom-0 w-px bg-neutral-600 left-[85.8%] z-0" />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-lime-400 rounded-full shadow-[0_0_10px_rgba(163,230,53,0.5)] z-10 transition-all duration-500"
              style={{ left: `calc(${balancePercent}% - 8px)` }}
            />
          </div>
          <p className="text-center text-lime-400 font-mono text-sm mt-3">{finalBalance.toFixed(2)} cm</p>
        </div>
      </div>

      <div className="w-full lg:w-7/12 flex flex-col gap-6">
        <div className="grid grid-cols-3 gap-4 bg-neutral-900 border border-neutral-800 p-6 rounded-xl">
          <div>
            <p className="text-sm text-neutral-400">Weight</p>
            <p className="text-3xl font-bold text-white">{Math.round(finalWeight)}g</p>
            <p className="text-xs text-neutral-500 mt-1">Base: {selectedModel.baseWeight}g</p>
          </div>
          <div>
            <p className="text-sm text-neutral-400">Balance</p>
            <p className="text-3xl font-bold text-white">{finalBalance.toFixed(1)}<span className="text-xl">cm</span></p>
            <p className="text-xs text-neutral-500 mt-1">Base: {selectedModel.baseBalance}cm</p>
          </div>
          <div>
            <p className="text-sm text-neutral-400">Swingweight</p>
            <p className="text-3xl font-bold text-lime-400">{Math.round(finalSW)}</p>
            <p className="text-xs text-neutral-500 mt-1">Base: {selectedModel.baseSW}</p>
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl space-y-6">
          <div>
            <label className="text-sm font-bold text-white">Base Frame</label>
            <select
              className="w-full mt-2 bg-neutral-950 border border-neutral-800 text-white p-3 rounded-lg focus:ring-lime-400 focus:border-lime-400 outline-none"
              onChange={(e) => {
                const model = MODELS.find((m) => m.name === e.target.value);
                if (model) setSelectedModel(model);
              }}
            >
              {MODELS.map((model) => (
                <option key={model.name} value={model.name}>{model.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-neutral-800 pt-6 items-center">
            <div className="flex items-center gap-3">
              <label className="text-white text-sm">Overgrips</label>
              <select value={overgrips} onChange={(e) => setOvergrips(Number(e.target.value))} className="bg-neutral-950 border border-neutral-800 text-white p-2 rounded">
                <option value={0}>0</option>
                <option value={1}>1</option>
                <option value={2}>2</option>
              </select>
              <span className="text-xs text-neutral-500">5.5g each</span>
            </div>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input type="checkbox" checked={hasLeatherGrip} onChange={(e) => setHasLeatherGrip(e.target.checked)} className="w-5 h-5 rounded border-neutral-700 text-lime-400 bg-neutral-950" />
              <span className="text-white text-sm">Leather Grip (+10g)</span>
            </label>
          </div>

          <div className="space-y-4 border-t border-neutral-800 pt-6">
            <h4 className="text-sm font-bold text-white mb-4">Mass Distribution (Lead / Tungsten)</h4>

            <div className="flex items-center justify-between">
              <label className="text-sm text-neutral-400">12 o'clock (Tip)</label>
              <input type="number" min="0" step="0.5" value={lead12} onChange={(e) => setLead12(parseGramInput(e.target.value))} className="w-24 bg-neutral-950 border border-neutral-800 text-white p-2 rounded text-center" />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm text-neutral-400">3 & 9 o'clock (Sides)</label>
              <input type="number" min="0" step="0.5" value={lead39} onChange={(e) => setLead39(parseGramInput(e.target.value))} className="w-24 bg-neutral-950 border border-neutral-800 text-white p-2 rounded text-center" />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm text-neutral-400">Throat Bridge</label>
              <input type="number" min="0" step="0.5" value={leadThroat} onChange={(e) => setLeadThroat(parseGramInput(e.target.value))} className="w-24 bg-neutral-950 border border-neutral-800 text-white p-2 rounded text-center" />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm text-neutral-400">Butt Cap (Silicone/Putty)</label>
              <input type="number" min="0" step="0.5" value={tailWeight} onChange={(e) => setTailWeight(parseGramInput(e.target.value))} className="w-24 bg-neutral-950 border border-neutral-800 text-white p-2 rounded text-center" />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm text-neutral-400">String Weight</label>
              <input type="number" min="0" step="0.5" value={stringWeight} onChange={(e) => setStringWeight(parseGramInput(e.target.value))} className="w-24 bg-neutral-950 border border-neutral-800 text-white p-2 rounded text-center" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
