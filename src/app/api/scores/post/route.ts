import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { uid, levelId, strokes, par } = body ?? {};
    if (!uid || !levelId || typeof strokes !== 'number') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    type DocRef = { set: (data: unknown, opts?: unknown) => Promise<void> };
    type FirestoreDb = {
      doc: (path: string) => DocRef;
      collection: (name: string) => { doc: (id: string) => { collection: (name: string) => { doc: (id: string) => DocRef } } };
    };
    const db = adminDb() as unknown as FirestoreDb;
    const ref = db.doc(`users/${uid}/scores/${levelId}`);
    await ref.set({ strokes, par: par ?? null, timestamp: new Date() }, { merge: true });
    // Also update a flat leaderboard collection per level
    const lb = db.collection('leaderboard').doc(levelId).collection('entries').doc(uid);
    await lb.set({ uid, strokes, par: par ?? null, timestamp: new Date() }, { merge: true });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Failed to save score' }, { status: 500 });
  }
}
