"use client";

import React, { useEffect, useState, useMemo } from 'react';

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

  const cardStyle: React.CSSProperties = useMemo(() => ({
    background: 'linear-gradient(160deg, rgba(16,18,24,0.78) 0%, rgba(26,29,36,0.55) 70%)',
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: '0 4px 18px -2px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.03) inset',
    backdropFilter: 'blur(9px)',
    WebkitBackdropFilter: 'blur(9px)',
    color: '#f8fafc',
    padding: '14px 14px 16px 14px',
    borderRadius: 18,
    minWidth: 250,
    fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
    fontSize: 14,
    lineHeight: 1.25,
  }), []);

  const titleStyle: React.CSSProperties = { fontWeight: 800, marginBottom: 10, letterSpacing: 0.5, fontSize: 15 };
  const muted = { opacity: 0.65 } as const;
  const rankBg = (i: number) => (i === 0 ? '#facc15' : i === 1 ? '#cbd5e1' : i === 2 ? '#b45309' : 'rgba(255,255,255,0.18)');

  const skeletonRow = (i: number) => (
    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: 0.55 }}>
      <div style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(255,255,255,0.12)' }} />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ height: 10, borderRadius: 4, background: 'rgba(255,255,255,0.12)', width: `${60 + i * 8}%` }} />
        <div style={{ height: 6, borderRadius: 4, background: 'rgba(255,255,255,0.08)', width: 40 }} />
      </div>
      <div style={{ width: 28, height: 12, borderRadius: 4, background: 'rgba(255,255,255,0.15)' }} />
      <div style={{ width: 34, height: 16, borderRadius: 999, background: 'rgba(255,255,255,0.09)' }} />
    </div>
  );

  if (error) return <div style={cardStyle}><div style={titleStyle}>Leaderboard</div><div style={{ color: '#f87171', fontSize: 12 }}>{error}</div></div>;

  return (
    <div style={cardStyle} aria-live="polite" aria-busy={loading}>
      <div style={titleStyle}>Leaderboard</div>
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array.from({ length: 5 }, (_, i) => skeletonRow(i))}
        </div>
      )}
      {!loading && !entries.length && (
        <div style={{ fontSize: 12, opacity: 0.7 }}>No scores yet.</div>
      )}
      {!loading && entries.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {entries.slice(0, 10).map((e, i) => {
            const name = e.name || `${e.uid.slice(0, 6)}…`;
            const rel = typeof e.par === 'number' ? e.strokes - e.par : null;
            const relStr = rel != null ? (rel === 0 ? 'E' : rel > 0 ? `+${rel}` : `${rel}`) : null;
            const relColor = rel === 0 ? '#e2e8f0' : rel! > 0 ? '#ef4444' : '#22c55e';
            return (
              <div key={e.uid} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 6, background: rankBg(i), color: i < 3 ? '#1f2937' : '#e5e7eb',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12,
                  boxShadow: i < 3 ? '0 0 0 1px rgba(0,0,0,0.25), 0 2px 4px -1px rgba(0,0,0,0.45)' : 'none'
                }}>{i + 1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 600 }}>{name}</div>
                  <div style={{ ...muted, fontSize: 11 }}>
                    {typeof e.par === 'number' ? `Par ${e.par}` : '—'}
                  </div>
                </div>
                <div style={{ fontWeight: 700 }}>{e.strokes}</div>
                {relStr && (
                  <div style={{
                    marginLeft: 4,
                    fontSize: 11,
                    padding: '2px 8px',
                    borderRadius: 999,
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'rgba(255,255,255,0.06)',
                    color: relColor,
                    fontWeight: 600,
                    letterSpacing: 0.3,
                    minWidth: 30,
                    textAlign: 'center'
                  }}>
                    {relStr}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
