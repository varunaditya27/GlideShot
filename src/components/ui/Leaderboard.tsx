"use client";

import React, { useEffect, useState } from 'react';

interface Entry {
  uid: string;
  name?: string | null;
  strokes: number;
  par?: number | null;
  timestamp?: string;
}

export default function Leaderboard({ levelId }: { levelId: string }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/scores/get?levelId=${encodeURIComponent(levelId)}`);
        if (!res.ok) throw new Error(await res.text());
        const data = (await res.json()) as Entry[];
        if (!cancelled) setEntries(data.slice(0, 10));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load leaderboard';
        if (!cancelled) setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (levelId) load();
    return () => { cancelled = true; };
  }, [levelId]);

  if (loading) return <div style={{ color: 'white' }}>Loading leaderboard…</div>;
  if (error) return <div style={{ color: 'tomato' }}>{error}</div>;
  if (!entries.length) return <div style={{ color: 'white' }}>No scores yet.</div>;

  const cardStyle: React.CSSProperties = {
    background: 'rgba(12,12,14,0.55)',
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
    color: '#f7f7f7',
    padding: 12,
    borderRadius: 12,
    minWidth: 240,
  };
  const muted = { opacity: 0.75 } as const;
  const rankBg = (i: number) => (i === 0 ? '#facc15' : i === 1 ? '#cbd5e1' : i === 2 ? '#b45309' : 'rgba(255,255,255,0.18)');

  return (
    <div style={cardStyle}>
      <div style={{ fontWeight: 800, marginBottom: 8, letterSpacing: 0.3 }}>Leaderboard</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {entries.slice(0, 10).map((e, i) => {
          const name = e.name || `${e.uid.slice(0, 6)}…`;
          const rel = typeof e.par === 'number' ? e.strokes - e.par : null;
          const relStr = rel != null ? (rel === 0 ? 'E' : rel > 0 ? `+${rel}` : `${rel}`) : null;
          return (
            <div key={e.uid} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 22, height: 22, borderRadius: 6, background: rankBg(i), color: i < 3 ? '#1f2937' : '#e5e7eb',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12,
              }}>{i + 1}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                <div style={{ ...muted, fontSize: 12 }}>
                  {typeof e.par === 'number' ? `Par ${e.par}` : '—'}
                </div>
              </div>
              <div style={{ fontWeight: 800 }}>{e.strokes}</div>
              {relStr && (
                <div style={{ marginLeft: 6, fontSize: 12, padding: '2px 6px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.18)', opacity: 0.85 }}>
                  {relStr}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
