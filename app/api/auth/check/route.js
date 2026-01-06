import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = cookies();
  const token = cookieStore.get('edit_token');
  
  const isAuthenticated = token?.value === process.env.EDIT_PASSWORD;
  
  return NextResponse.json({ authenticated: isAuthenticated });
}
