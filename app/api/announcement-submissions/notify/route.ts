import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const authorization = request.headers.get('authorization') || '';
  const accessToken = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!accessToken) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
  if (authError || !user) {
    return NextResponse.json({ error: 'Invalid session.' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const title = typeof body?.title === 'string' ? body.title.trim() : '';
  const content = typeof body?.content === 'string' ? body.content.trim() : '';
  const submitter = typeof body?.submitter === 'string' ? body.submitter.trim() : 'Student';
  if (!title || !content || title.length > 180 || content.length > 10000) {
    return NextResponse.json({ error: 'Invalid announcement details.' }, { status: 400 });
  }

  if (!resendApiKey || !fromEmail) {
    return NextResponse.json({
      sent: false,
      configurationRequired: true,
      error: 'Email notification is not configured yet.'
    }, { status: 503 });
  }

  const safe = (value: string) => value.replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char] || char);

  const emailResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: fromEmail,
      to: ['northsynapse@gmail.com'],
      subject: `Announcement review: ${title}`,
      html: `<h2>New announcement submission</h2><p><strong>Title:</strong> ${safe(title)}</p><p><strong>Submitted by:</strong> ${safe(submitter)} (${safe(user.email || 'No email')})</p><div style="white-space:pre-wrap">${safe(content)}</div><p>Sign in to North Synapse and open Admin → Announcement review to approve or reject this submission.</p>`
    })
  });

  if (!emailResponse.ok) {
    const detail = await emailResponse.text();
    console.error('Announcement review email failed:', detail);
    return NextResponse.json({ sent: false, error: 'The submission was saved, but the review email could not be sent.' }, { status: 502 });
  }

  return NextResponse.json({ sent: true });
}
