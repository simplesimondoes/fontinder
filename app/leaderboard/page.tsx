"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Row = {
  slug: string;
  name: string;
  image: string;
  likes: number;
  nopes: number;
  total: number;
  pct: number;
  score: number;
};

export default function Leaderboard() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [totalVotes, setTotalVotes] = useState(0);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((d) => {
        setRows(d.board);
        setTotalVotes(d.totalVotes);
      })
      .catch(() => setRows([]));
  }, []);

  if (!rows) {
    return (
      <div className="flex-1 grid place-items-center text-white/50">
        Loading results…
      </div>
    );
  }

  const voted = rows.filter((r) => r.total > 0);
  const top25 = voted.slice(0, 25);

  return (
    <div className="py-2">
      <div className="text-center mb-5">
        <h1 className="text-2xl font-extrabold">🏆 Leaderboard</h1>
        <p className="text-white/50 text-sm mt-1">
          {totalVotes.toLocaleString()} votes · top 25 make the cut
        </p>
        <Link
          href="/"
          className="inline-block mt-3 text-sm bg-white/10 hover:bg-white/20 transition rounded-full px-4 py-2"
        >
          ← Back to swiping
        </Link>
      </div>

      {voted.length === 0 ? (
        <p className="text-center text-white/50 mt-10">
          No votes yet — be the first to swipe!
        </p>
      ) : (
        <ol className="space-y-2">
          {voted.map((r, i) => {
            const inCut = i < 25;
            return (
              <li
                key={r.slug}
                className={`flex items-center gap-3 rounded-2xl px-3 py-2 ${
                  inCut
                    ? "bg-gradient-to-r from-like/15 to-transparent border border-like/30"
                    : "bg-white/5"
                }`}
              >
                <div
                  className={`w-7 text-center font-bold ${
                    i === 0
                      ? "text-yellow-400"
                      : inCut
                      ? "text-like"
                      : "text-white/40"
                  }`}
                >
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="bg-white rounded-lg px-2 py-1 inline-block max-w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={r.image}
                      alt={r.name}
                      className="h-7 object-contain max-w-[200px]"
                    />
                  </div>
                  <div className="text-xs text-white/60 truncate mt-1">
                    {r.name}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-like">{r.pct}%</div>
                  <div className="text-[11px] text-white/40">
                    {r.likes}♥ / {r.total}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {top25.length === 25 && (
        <p className="text-center text-white/30 text-xs mt-6">
          Dashed line marks the top-25 cutoff for the designer.
        </p>
      )}
    </div>
  );
}
