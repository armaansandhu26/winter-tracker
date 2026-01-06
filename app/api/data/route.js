import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// GET - Fetch all tracker data (public)
export async function GET() {
  try {
    const data = await kv.get('tracker-data');
    return NextResponse.json(data || { hours: {}, notes: {}, highlights: {} });
  } catch (error) {
    console.error('Failed to fetch data:', error);
    // Return empty data if KV not configured (for local dev)
    return NextResponse.json({ hours: {}, notes: {}, highlights: {} });
  }
}

// POST - Save tracker data (requires auth)
export async function POST(request) {
  try {
    // Check authentication
    const cookieStore = cookies();
    const token = cookieStore.get('edit_token');
    
    if (token?.value !== process.env.EDIT_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const data = await request.json();
    
    // Validate data structure
    if (!data || typeof data !== 'object') {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }
    
    await kv.set('tracker-data', data);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save data:', error);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}
