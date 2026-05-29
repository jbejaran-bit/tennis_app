"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [skillLevel, setSkillLevel] = useState<string | null>(null);
  const [utr, setUtr] = useState<number>(8.0);
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [hand, setHand] = useState("Right");
  const [gender, setGender] = useState("Male");
  const [loading, setLoading] = useState(false);

  const levels = ["Beginner", "Intermediate", "Advanced", "Pro"];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!skillLevel) return;
    
    setLoading(true);

    // Get the current logged-in user
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // Update the profiles table you just created in Supabase!
      await supabase.from("profiles").update({
        skill_level: skillLevel,
        utr_rating: utr,
        height: parseFloat(height || "0"),
        weight: parseFloat(weight || "0"),
        dominant_hand: hand,
        gender: gender,
        onboarding_completed: true,
      }).eq("id", user.id);
    }

    // Redirect to the main dashboard
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 text-white">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-2xl">
        
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-black font-bold text-xl">B</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Welcome to Baseline</h1>
          <p className="text-neutral-400 text-sm">Let's calibrate your AI coach.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Skill Level Selection */}
          <div>
            <label className="block text-sm font-semibold text-neutral-300 mb-3 uppercase tracking-wider">
              Current Skill Level
            </label>
            <div className="grid grid-cols-2 gap-3">
              {levels.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setSkillLevel(level)}
                  className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                    skillLevel === level
                      ? "bg-green-500/10 border-green-500 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.2)]"
                      : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-600"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Physical Attributes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-neutral-300 mb-2">Height (cm)</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="e.g. 185"
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-300 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-300 mb-2">Weight (kg)</label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g. 78"
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-300 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-300 mb-2">Handedness</label>
              <select
                value={hand}
                onChange={(e) => setHand(e.target.value)}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-300 focus:outline-none"
              >
                <option>Right</option>
                <option>Left</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-300 mb-2">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-300 focus:outline-none"
              >
                <option>Male</option>
                <option>Female</option>
              </select>
            </div>
          </div>

          {/* UTR Slider */}
          <div>
            <div className="flex justify-between items-end mb-3">
              <label className="block text-sm font-semibold text-neutral-300 uppercase tracking-wider">
                Current UTR
              </label>
              <span className="text-2xl font-bold text-green-400">{utr.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="16.5"
              step="0.5"
              value={utr}
              onChange={(e) => setUtr(parseFloat(e.target.value))}
              className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-green-500"
            />
            <div className="flex justify-between text-xs text-neutral-500 mt-2">
              <span>1.0 (Beginner)</span>
              <span>16.5 (Pro)</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={!skillLevel || loading}
            className="w-full py-3.5 rounded-xl bg-green-500 text-black font-bold text-sm uppercase tracking-widest hover:bg-green-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Saving Profile..." : "Enter Dashboard →"}
          </button>
        </form>

      </div>
    </div>
  );
}
