import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';

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
      type Entry = { uid: string; strokes: number; par?: number | null; timestamp?: unknown; name?: string | null };
      const data: Entry[] = snap.docs.map((d: { data: () => unknown }): Entry => d.data() as Entry);

      // Try to enrich entries with display names from Auth if not already present
      try {
        const needLookup = data.filter((e) => !e.name).map((e) => e.uid);
        if (needLookup.length) {
          const unique = Array.from(new Set(needLookup)).map((uid) => ({ uid }));
          type AdminUser = { uid: string; displayName?: string | null; email?: string | null };
          type AdminAuth = { getUsers: (ids: Array<{ uid: string }>) => Promise<{ users: AdminUser[]; notFound: Array<{ uid: string }> }> };
          const auth = adminAuth() as unknown as AdminAuth;
          const users = await auth.getUsers(unique);
          const nameByUid = new Map<string, string | null>();
          users.users.forEach((u: AdminUser) => {
            const n = u.displayName || (u.email ? u.email.split('@')[0] : null);
            nameByUid.set(u.uid, n ?? null);
          });
          users.notFound.forEach((nf: { uid: string }) => {
            // ensure key exists with null to avoid re-lookups
            if (typeof nf.uid === 'string') nameByUid.set(nf.uid, null);
          });
          data.forEach((e) => {
            if (!e.name) e.name = nameByUid.get(e.uid) ?? null;
          });
        }
      } catch {
        // If admin not configured or lookup fails, continue without names
      }

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
