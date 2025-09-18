import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';

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
    // Try to get a stable display name for the user
    let name: string | null = null;
    try {
      type AdminUser = { uid: string; displayName?: string | null; email?: string | null };
      type AdminAuth = { getUser: (uid: string) => Promise<AdminUser> };
      const auth = adminAuth() as unknown as AdminAuth;
      const u = await auth.getUser(uid);
      name = u.displayName || (u.email ? u.email.split('@')[0] : null) || null;
    } catch {
      // ignore if admin not configured
    }
    const ref = db.doc(`users/${uid}/scores/${levelId}`);
    await ref.set({ strokes, par: par ?? null, timestamp: new Date() }, { merge: true });
    // Also update a flat leaderboard collection per level
    const lb = db.collection('leaderboard').doc(levelId).collection('entries').doc(uid);
  await lb.set({ uid, name: name ?? null, strokes, par: par ?? null, timestamp: new Date() }, { merge: true });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Failed to save score' }, { status: 500 });
  }
}
