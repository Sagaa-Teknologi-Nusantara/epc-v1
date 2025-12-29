import { NextResponse } from 'next/server';
import { seedDatabase } from '@/lib/seed';

export async function POST() {
    const result = await seedDatabase();

    if (result.success) {
        return NextResponse.json(result, { status: 200 });
    } else {
        return NextResponse.json(result, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json(
        { message: 'Use POST method to trigger database seeding' },
        { status: 405 }
    );
}
