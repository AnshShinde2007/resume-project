import { NextResponse } from 'next/server';

const LANGUAGE_IDS = { javascript: 102, typescript: 101, python: 100, java: 91, cpp: 105, go: 107 } as const;

export async function POST(request: Request) {
  const { code, language, stdin = '' } = await request.json();
  if (typeof code !== 'string' || code.length > 50_000 || !(language in LANGUAGE_IDS) || typeof stdin !== 'string' || stdin.length > 10_000) {
    return NextResponse.json({ error: 'Invalid code, language, or input.' }, { status: 400 });
  }

  const baseUrl = process.env.JUDGE0_URL || 'https://ce.judge0.com';
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (process.env.JUDGE0_AUTH_TOKEN) headers['X-Auth-Token'] = process.env.JUDGE0_AUTH_TOKEN;

  try {
    const submitted = await fetch(`${baseUrl}/submissions?base64_encoded=false&wait=false`, {
      method: 'POST', headers,
      body: JSON.stringify({ source_code: code, language_id: LANGUAGE_IDS[language as keyof typeof LANGUAGE_IDS], stdin, cpu_time_limit: 5, wall_time_limit: 10 }),
    });
    if (!submitted.ok) throw new Error(`Judge0 submission failed (${submitted.status})`);
    return NextResponse.json(await submitted.json());
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Judge0 request failed.' }, { status: 502 });
  }
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token');
  if (!token || !/^[\w-]{1,100}$/.test(token)) return NextResponse.json({ error: 'Invalid submission token.' }, { status: 400 });
  const headers: Record<string, string> = {};
  if (process.env.JUDGE0_AUTH_TOKEN) headers['X-Auth-Token'] = process.env.JUDGE0_AUTH_TOKEN;
  const baseUrl = process.env.JUDGE0_URL || 'https://ce.judge0.com';
  try {
    const response = await fetch(`${baseUrl}/submissions/${token}?base64_encoded=false`, { headers, cache: 'no-store' });
    return NextResponse.json(await response.json(), { status: response.status });
  } catch {
    return NextResponse.json({ error: 'Judge0 request failed.' }, { status: 502 });
  }
}
