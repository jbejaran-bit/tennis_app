"use client";

import { useId } from "react";

interface RacquetVisualizerProps {
  frameColor: string;
  leatherGrip: boolean;
  lead12: number;
  lead39: number;
  leadThroat: number;
}

export default function RacquetVisualizer({
  frameColor,
  leatherGrip,
  lead12,
  lead39,
  leadThroat,
}: RacquetVisualizerProps) {
  // Create unique, non-colliding IDs for this specific racquet instance.
  const rawId = useId();
  const id = rawId.replace(/:/g, "");

  const dropShadowId = `${id}-drop-shadow`;
  const paintJobId = `${id}-paint-job`;
  const leadTapeId = `${id}-lead-tape`;
  const leatherId = `${id}-leather`;
  const syntheticId = `${id}-synthetic`;

  return (
    <div className="w-full flex justify-center items-center p-8 bg-neutral-900 rounded-xl border border-neutral-800 shadow-inner overflow-hidden">
      <svg viewBox="0 0 200 580" className="w-full h-full max-h-[450px]">
        <defs>
          <filter id={dropShadowId} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="15" stdDeviation="15" floodOpacity="0.4" />
          </filter>

          <linearGradient id={paintJobId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={frameColor} />
            <stop offset="70%" stopColor={frameColor} />
            <stop offset="100%" stopColor="#262626" />
          </linearGradient>

          <linearGradient id={leadTapeId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#d1d5db" />
            <stop offset="50%" stopColor="#f3f4f6" />
            <stop offset="100%" stopColor="#9ca3af" />
          </linearGradient>

          <linearGradient id={leatherId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#5c3a21" />
            <stop offset="50%" stopColor="#8b5a2b" />
            <stop offset="100%" stopColor="#4a2e1b" />
          </linearGradient>

          <linearGradient id={syntheticId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#171717" />
            <stop offset="50%" stopColor="#262626" />
            <stop offset="100%" stopColor="#0a0a0a" />
          </linearGradient>
        </defs>

        <g filter={`url(#${dropShadowId})`}>
          <g stroke="#ffffff" strokeWidth="1" opacity="0.2">
            {[...Array(16)].map((_, i) => (
              <line key={`v-${i}`} x1={45 + i * 7.5} y1="70" x2={45 + i * 7.5} y2="230" />
            ))}
            {[...Array(20)].map((_, i) => (
              <line key={`h-${i}`} x1="30" y1={65 + i * 8.5} x2="170" y2={65 + i * 8.5} />
            ))}
          </g>

          <ellipse cx="100" cy="150" rx="70" ry="100" fill="none" stroke={`url(#${paintJobId})`} strokeWidth="14" />

          <path d="M 40 100 A 70 100 0 0 1 160 100" fill="none" stroke="#171717" strokeWidth="16" strokeLinecap="round" />

          <path d="M 60 230 Q 100 260 85 360 L 115 360 Q 100 260 140 230" fill="none" stroke={`url(#${paintJobId})`} strokeWidth="14" strokeLinecap="round" />

          <path d="M 72 245 Q 100 260 128 245" fill="none" stroke={`url(#${paintJobId})`} strokeWidth="12" />

          <rect x="85" y="355" width="30" height="65" fill={`url(#${paintJobId})`} />

          <rect x="82" y="420" width="36" height="135" rx="2" fill={leatherGrip ? `url(#${leatherId})` : `url(#${syntheticId})`} />

          <g stroke="#000000" strokeWidth="1.5" opacity="0.5">
            {[...Array(12)].map((_, i) => (
              <line key={`grip-${i}`} x1="82" y1={430 + i * 11} x2="118" y2={445 + i * 11} />
            ))}
          </g>

          <rect x="79" y="555" width="42" height="12" rx="2" fill="#171717" />
          <line x1="79" y1="560" x2="121" y2="560" stroke="#ef4444" strokeWidth="1.5" />

          {lead12 > 0 && (
            <path d="M 70 55 A 70 100 0 0 1 130 55" fill="none" stroke={`url(#${leadTapeId})`} strokeWidth="16" strokeLinecap="round" />
          )}
          {lead39 > 0 && (
            <>
              <path d="M 168 120 A 70 100 0 0 1 168 180" fill="none" stroke={`url(#${leadTapeId})`} strokeWidth="16" strokeLinecap="round" />
              <path d="M 32 120 A 70 100 0 0 0 32 180" fill="none" stroke={`url(#${leadTapeId})`} strokeWidth="16" strokeLinecap="round" />
            </>
          )}
          {leadThroat > 0 && (
            <path d="M 80 250 Q 100 262 120 250" fill="none" stroke={`url(#${leadTapeId})`} strokeWidth="8" strokeLinecap="round" />
          )}
        </g>
      </svg>
    </div>
  );
}
