import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const dir = path.join(process.cwd(), 'public', 'levels');
    const files = await fs.readdir(dir);
    const jsonFiles = files.filter((f) => f.endsWith('.json'));
    const levels = await Promise.all(
      jsonFiles.map(async (file) => {
        const raw = await fs.readFile(path.join(dir, file), 'utf-8');
        const cfg = JSON.parse(raw);
        return {
          id: file.replace('.json', ''),
          name: cfg.name,
          par: cfg.par,
          start: cfg.start,
          hole: cfg.hole,
          model: cfg.model ?? '',
        } as const;
      })
    );
    return NextResponse.json(levels);
  } catch {
    return NextResponse.json({ error: 'Failed to read levels' }, { status: 500 });
  }
}
