import React from "react";
import { Link } from "react-router-dom";
import { Orbit as OrbitIcon, Play } from "lucide-react";

const QUALITIES = ["240p", "360p", "480p", "720p", "1080p"];

const RINGS = [
  { size: 300, duration: "24s" },
  { size: 440, duration: "38s", reverse: true },
  { size: 580, duration: "56s" },
];

function OrbitPanel({ headline, copy }) {
  return (
    <div className="relative hidden overflow-hidden border-l border-zinc-900 bg-[#050505] lg:flex lg:flex-col lg:justify-between lg:p-12">
      {/* grid backdrop */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }}
      />

      {/* orbit rings */}
      <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {RINGS.map(({ size, duration, reverse }) => (
          <div
            key={size}
            className="absolute rounded-full border border-white/10"
            style={{ width: size, height: size }}
          >
            <div
              className="absolute inset-0 animate-spin"
              style={{
                animationDuration: duration,
                animationDirection: reverse ? "reverse" : "normal",
              }}
            >
              <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-white shadow-[0_0_12px_2px_rgba(255,255,255,0.5)]" />
            </div>
          </div>
        ))}
      </div>

      {/* top spacer so content centers */}
      <div className="relative z-10" />

      {/* center: mini player */}
      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="relative aspect-video w-72 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-[0_0_80px_-20px_rgba(255,255,255,0.15)]">
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/40 via-transparent to-transparent" />
          <span className="absolute right-3 top-3 rounded-md border border-white/10 bg-black/60 px-2 py-0.5 font-mono text-[10px] text-zinc-300">
            Auto · 1080p
          </span>
          <span className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-black">
            <Play className="ml-0.5 h-5 w-5 fill-black" />
          </span>
          <div className="absolute inset-x-4 bottom-4 h-1 rounded-full bg-white/15">
            <div className="h-full w-2/5 rounded-full bg-white" />
          </div>
        </div>

        <h2 className="mt-10 text-2xl font-semibold tracking-tight text-white">{headline}</h2>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-zinc-400">{copy}</p>
      </div>

      {/* bottom: qualities */}
      <div className="relative z-10 flex items-center justify-center gap-2">
        {QUALITIES.map((q) => (
          <span
            key={q}
            className="rounded-full border border-zinc-800 bg-zinc-950/80 px-3 py-1 font-mono text-[11px] text-zinc-400"
          >
            {q}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function AuthShell({ children, headline, copy }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#09090b] p-4 text-zinc-100 selection:bg-white selection:text-black sm:p-6">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-zinc-800/80 bg-[#0a0a0a] lg:min-h-[640px] lg:grid-cols-2">
        <div className="flex flex-col justify-center p-8 sm:p-12">
          <Link to="/" className="mb-10 flex w-fit items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-black">
              <OrbitIcon className="h-[18px] w-[18px]" />
            </span>
            <span className="text-[15px] font-bold tracking-tight text-white">Orbit</span>
          </Link>
          {children}
        </div>

        <OrbitPanel headline={headline} copy={copy} />
      </div>
    </div>
  );
}