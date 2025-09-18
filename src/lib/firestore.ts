// Server-backed save via Next.js API to keep credentials secure
let inFlightKey: string | null = null;
export const saveScore = async (userId: string, levelId: string, strokes: number, par: number) => {
  try {
    const key = `${userId}:${levelId}:${strokes}`;
    if (inFlightKey === key) return; // prevent spamming
    inFlightKey = key;
    const res = await fetch('/api/scores/post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: userId, levelId, strokes, par }),
    });
    if (!res.ok) {
      const msg = await res.text();
      throw new Error(`Failed to save score: ${res.status} ${msg}`);
    }
    console.log('Score saved successfully!');
  } catch (error) {
    console.error('Error saving score: ', error);
  } finally {
    // release after a short tick to collapse any bursts in the same event loop
    setTimeout(() => { inFlightKey = null; }, 0);
  }
};
