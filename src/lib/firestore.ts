// Server-backed save via Next.js API to keep credentials secure
export const saveScore = async (userId: string, levelId: string, strokes: number, par: number) => {
  try {
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
  }
};
