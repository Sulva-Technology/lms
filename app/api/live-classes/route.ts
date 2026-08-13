import { NextResponse } from 'next/server';
export async function POST(req: Request) {
    return NextResponse.json({ message: 'Use server action instead for creating' }, { status: 400 });
}
