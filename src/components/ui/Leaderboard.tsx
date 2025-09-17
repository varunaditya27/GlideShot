"use client";

import React, { useEffect, useState } from 'react';

interface Entry {
  uid: string;
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

  return (
    <div style={{ background: 'rgba(0,0,0,0.5)', color: 'white', padding: 12, borderRadius: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Leaderboard</div>
      <ol style={{ margin: 0, paddingLeft: 18 }}>
        {entries.map((e, i) => (
          <li key={e.uid} style={{ marginBottom: 4 }}>
            <span style={{ width: 20, display: 'inline-block' }}>{i + 1}.</span> {e.uid.slice(0, 6)}… — {e.strokes} strokes
            {typeof e.par === 'number' ? ` (par ${e.par})` : ''}
          </li>
        ))}
      </ol>
    </div>
  );
}
