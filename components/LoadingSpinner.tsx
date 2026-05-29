"use client";

import React from "react";

export default function LoadingSpinner({ size = 8 }: { size?: number }) {
  const s = `${size}rem`;
  return (
    <div style={{ width: s, height: s }} className="border-2 border-baseline-green border-t-transparent rounded-full animate-spin" />
  );
}
