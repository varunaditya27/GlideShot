import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const levelId = searchParams.get('levelId');
    const uid = searchParams.get('uid');
    type QuerySnap = { docs: Array<{ id: string; data: () => unknown }> };
    type FirestoreDb = {
      collection: (name: string) => {
        doc: (id: string) => {
          collection: (name: string) => { get: () => Promise<QuerySnap> };
        };
      };
      doc: (path: string) => unknown;
    };
    const db = adminDb() as unknown as FirestoreDb;

    if (levelId) {
  const snap = await db.collection('leaderboard').doc(levelId).collection('entries').get();
      type Entry = { uid: string; strokes: number; par?: number | null; timestamp?: unknown };
  const data: Entry[] = snap.docs.map((d: { data: () => unknown }): Entry => d.data() as Entry);
      data.sort((a, b) => (a.strokes ?? Number.POSITIVE_INFINITY) - (b.strokes ?? Number.POSITIVE_INFINITY));
      return NextResponse.json(data);
    }

    if (uid) {
  const snap = await db.collection('users').doc(uid).collection('scores').get();
      type Score = { levelId: string; strokes: number; par?: number | null; timestamp?: unknown };
  const data: Score[] = snap.docs.map(
    (d: { id: string; data: () => unknown }): Score => ({ levelId: d.id, ...(d.data() as Omit<Score, 'levelId'>) })
  );
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: 'Provide levelId or uid' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch scores' }, { status: 500 });
  }
}
