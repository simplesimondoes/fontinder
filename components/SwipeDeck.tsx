"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
} from "framer-motion";
import Link from "next/link";
import fontsData from "@/lib/fonts.json";

type Font = { slug: string; name: string; image: string; w: number; h: number };

const FONTS = fontsData as Font[];
const SEEN_KEY = "fontinder:seen:v1";

function loadSeen(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || "[]"));
  } catch {
    return new Set();
  }
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function SwipeDeck() {
  const [deck, setDeck] = useState<Font[]>([]);
  const [index, setIndex] = useState(0);
  const [seenCount, setSeenCount] = useState(0);
  const [likes, setLikes] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const seen = loadSeen();
    setSeenCount(seen.size);
    const remaining = FONTS.filter((f) => !seen.has(f.slug));
    setDeck(shuffle(remaining));
    setReady(true);
  }, []);

  const markSeen = useCallback((slug: string) => {
    const seen = loadSeen();
    seen.add(slug);
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
    setSeenCount(seen.size);
  }, []);

  const handleVote = useCallback(
    (font: Font, kind: "like" | "nope") => {
      markSeen(font.slug);
      if (kind === "like") setLikes((l) => l + 1);
      setIndex((i) => i + 1);
      // fire-and-forget; UI shouldn't block on the network
      fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: font.slug, kind }),
        keepalive: true,
      }).catch(() => {});
    },
    [markSeen]
  );

  const current = deck[index];
  const next = deck[index + 1];
  const done = ready && !current;
  const totalDone = seenCount;

  if (!ready) {
    return (
      <div className="flex-1 grid place-items-center text-white/50">
        Loading fonts…
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* progress */}
      <div className="text-center text-xs text-white/50 mb-3">
        {totalDone} of {FONTS.length} fonts judged · {likes} kept this session
      </div>

      <div className="relative flex-1 min-h-[380px]">
        <AnimatePresence>
          {done ? (
            <DoneCard key="done" />
          ) : (
            <>
              {next && <BackgroundCard key={next.slug} font={next} />}
              <Card
                key={current!.slug}
                font={current!}
                onVote={(kind) => handleVote(current!, kind)}
              />
            </>
          )}
        </AnimatePresence>
      </div>

      {!done && current && (
        <div className="flex items-center justify-center gap-6 pt-5">
          <ActionButton
            label="Pass"
            color="bg-flame"
            emoji="✕"
            onClick={() => handleVote(current, "nope")}
          />
          <Link
            href="/leaderboard"
            className="text-xs text-white/40 hover:text-white/70 transition"
          >
            skip to results
          </Link>
          <ActionButton
            label="Keep"
            color="bg-like"
            emoji="♥"
            onClick={() => handleVote(current, "like")}
          />
        </div>
      )}
    </div>
  );
}

function Card({
  font,
  onVote,
}: {
  font: Font;
  onVote: (kind: "like" | "nope") => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-16, 16]);
  const likeOpacity = useTransform(x, [40, 140], [0, 1]);
  const nopeOpacity = useTransform(x, [-40, -140], [0, 1]);

  return (
    <motion.div
      className="absolute inset-0 no-select cursor-grab active:cursor-grabbing"
      style={{ x, rotate }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      initial={{ scale: 0.96, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ opacity: 0 }}
      onDragEnd={(_, info) => {
        if (info.offset.x > 120) onVote("like");
        else if (info.offset.x < -120) onVote("nope");
      }}
      whileTap={{ scale: 0.99 }}
    >
      <CardFace font={font}>
        <motion.div
          style={{ opacity: likeOpacity }}
          className="absolute top-6 left-6 border-4 border-like text-like font-extrabold text-3xl px-3 py-1 rounded-xl rotate-[-18deg]"
        >
          KEEP
        </motion.div>
        <motion.div
          style={{ opacity: nopeOpacity }}
          className="absolute top-6 right-6 border-4 border-flame text-flame font-extrabold text-3xl px-3 py-1 rounded-xl rotate-[18deg]"
        >
          PASS
        </motion.div>
      </CardFace>
    </motion.div>
  );
}

function BackgroundCard({ font }: { font: Font }) {
  return (
    <div className="absolute inset-0 scale-[0.94] translate-y-3 opacity-60 pointer-events-none">
      <CardFace font={font} />
    </div>
  );
}

function CardFace({
  font,
  children,
}: {
  font: Font;
  children?: React.ReactNode;
}) {
  return (
    <div className="relative h-full w-full rounded-3xl bg-white shadow-2xl overflow-hidden flex flex-col">
      <div className="flex-1 grid place-items-center p-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={font.image}
          alt={font.name}
          draggable={false}
          className="max-w-full max-h-full object-contain"
        />
      </div>
      <div className="px-5 py-4 bg-gradient-to-t from-black/5 to-transparent border-t border-black/5">
        <div className="text-gray-900 font-bold text-lg truncate">
          {font.name}
        </div>
        <div className="text-gray-400 text-xs">Tajima embroidery font</div>
      </div>
      {children}
    </div>
  );
}

function ActionButton({
  label,
  color,
  emoji,
  onClick,
}: {
  label: string;
  color: string;
  emoji: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`${color} h-16 w-16 rounded-full grid place-items-center text-2xl text-white shadow-lg shadow-black/30 active:scale-90 transition hover:brightness-110`}
    >
      {emoji}
    </button>
  );
}

function DoneCard() {
  return (
    <motion.div
      key="done"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="absolute inset-0 rounded-3xl bg-white/5 border border-white/10 grid place-items-center text-center p-8"
    >
      <div>
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-2xl font-extrabold mb-2">You judged them all!</h2>
        <p className="text-white/60 mb-6 text-sm">
          Thanks for swiping. See which fonts are winning.
        </p>
        <Link
          href="/leaderboard"
          className="inline-block bg-gradient-to-r from-flame to-sky font-semibold rounded-full px-6 py-3"
        >
          🏆 View leaderboard
        </Link>
      </div>
    </motion.div>
  );
}
