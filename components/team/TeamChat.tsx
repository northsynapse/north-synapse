'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Pin, Send, Users, Megaphone, MoreHorizontal } from 'lucide-react';

type Props = { user: any; nickname: string; username: string; avatarUrl: string; teamRole: string | null; isAdmin: boolean; isDarkMode: boolean };
type ChatMessage = { id: string; user_id: string; content: string; created_at: string; display_name: string; avatar_url: string; role: string };
type TeamNotice = { id: string; title: string; content: string; author_id: string; created_at: string; is_pinned: boolean; display_name: string };

export default function TeamChat({ user, nickname, username, avatarUrl, teamRole, isAdmin, isDarkMode }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [notices, setNotices] = useState<TeamNotice[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [draft, setDraft] = useState('');
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeBody, setNoticeBody] = useState('');
  const [showNoticeForm, setShowNoticeForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const theme = { bg: isDarkMode ? '#0E1117' : '#F8FAFC', card: isDarkMode ? '#161B22' : '#FFFFFF', border: isDarkMode ? '#30363D' : '#E2E8F0', text: isDarkMode ? '#F0F6FC' : '#0F172A', muted: isDarkMode ? '#8B949E' : '#64748B', accent: '#8B5CF6' };
  const allowed = !!user && (!!teamRole || isAdmin);
  const myName = nickname || username || user?.email?.split('@')[0] || 'Team member';

  const load = useCallback(async () => {
    if (!allowed) return;
    setLoading(true);
    const [messageResult, noticeResult] = await Promise.all([
      supabase.from('team_chat_messages').select('id,user_id,content,created_at').is('deleted_at', null).order('created_at', { ascending: true }).limit(300),
      supabase.from('team_chat_announcements').select('id,author_id,title,content,created_at,is_pinned').order('is_pinned', { ascending: false }).order('created_at', { ascending: false }).limit(50)
    ]);
    if (messageResult.error) setError(messageResult.error.message);
    const rows = messageResult.data || [];
    const noticeRows = noticeResult.data || [];
    const ids = Array.from(new Set([...rows.map((m: any) => m.user_id), ...noticeRows.map((n: any) => n.author_id)]));
    const { data: people } = ids.length ? await supabase.from('profiles').select('id,username,nickname,avatar_path').in('id', ids) : { data: [] as any[] };
    const { data: team } = ids.length ? await supabase.from('team_members').select('user_id,role').in('user_id', ids) : { data: [] as any[] };
    const map: Record<string, any> = {};
    (people || []).forEach((p: any) => { map[p.id] = p; });
    const roleMap: Record<string, string> = {};
    (team || []).forEach((t: any) => { roleMap[t.user_id] = t.role; });
    setProfiles(map);
    setMessages(rows.map((m: any) => ({ ...m, display_name: map[m.user_id]?.nickname || map[m.user_id]?.username || 'Team member', avatar_url: map[m.user_id]?.avatar_path || '', role: m.user_id === user.id && isAdmin ? 'Administrator' : roleMap[m.user_id] === 'core_team' ? 'Core Team' : roleMap[m.user_id] === 'community_team' ? 'Community Team' : '' })));
    setNotices(noticeRows.map((n: any) => ({ ...n, display_name: map[n.author_id]?.nickname || map[n.author_id]?.username || 'Team member' })));
    setLoading(false);
  }, [allowed, user?.id, isAdmin]);

  useEffect(() => {
    void load();
    if (!allowed) return;
    const channel = supabase.channel('north-synapse-team-chat')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_chat_messages' }, () => void load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_chat_announcements' }, () => void load())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [load, allowed]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length]);

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || !user?.id || sending) return;
    setSending(true);
    const { error: sendError } = await supabase.from('team_chat_messages').insert({ user_id: user.id, content });
    if (sendError) setError(sendError.message);
    else { setDraft(''); await load(); }
    setSending(false);
  }

  async function publishNotice(event: React.FormEvent) {
    event.preventDefault();
    if (!noticeTitle.trim() || !noticeBody.trim() || !user?.id) return;
    const { error: publishError } = await supabase.from('team_chat_announcements').insert({ author_id: user.id, title: noticeTitle.trim(), content: noticeBody.trim(), is_pinned: true });
    if (publishError) setError(publishError.message);
    else { setNoticeTitle(''); setNoticeBody(''); setShowNoticeForm(false); await load(); }
  }

  async function togglePin(item: TeamNotice) {
    const { error: updateError } = await supabase.from('team_chat_announcements').update({ is_pinned: !item.is_pinned }).eq('id', item.id);
    if (updateError) setError(updateError.message); else await load();
  }

  if (!allowed) return <div style={{ padding: 28, border: `1px solid ${theme.border}`, borderRadius: 16, color: theme.text }}>Team membership is required to access this private chat.</div>;

  return <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: 18, color: theme.text }}>
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <div><div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><Users size={22}/><h1 style={{ margin: 0, fontSize: 26 }}>North Synapse Team</h1></div><p style={{ color: theme.muted, margin: '6px 0 0' }}>Private team group chat</p></div>
      <button onClick={() => setShowNoticeForm(v => !v)} style={{ border: 0, borderRadius: 9, padding: '10px 14px', background: theme.accent, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}><Megaphone size={16}/> Post announcement</button>
    </header>
    {error && <p role="alert" style={{ color: '#EF4444' }}>{error}</p>}
    {showNoticeForm && <form onSubmit={publishNotice} style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 14, padding: 16, display: 'grid', gap: 10 }}>
      <h2 style={{ margin: 0, fontSize: 18 }}>New pinned announcement</h2>
      <input value={noticeTitle} onChange={e => setNoticeTitle(e.target.value)} placeholder="Announcement title" maxLength={180} required style={{ padding: 11, borderRadius: 8, border: `1px solid ${theme.border}`, background: theme.bg, color: theme.text }}/>
      <textarea value={noticeBody} onChange={e => setNoticeBody(e.target.value)} placeholder="Write an announcement for current and future team members..." rows={4} maxLength={8000} required style={{ padding: 11, borderRadius: 8, border: `1px solid ${theme.border}`, background: theme.bg, color: theme.text, resize: 'vertical' }}/>
      <div style={{ display: 'flex', gap: 8 }}><button disabled={!noticeTitle.trim() || !noticeBody.trim()} style={{ background: theme.accent, color: '#fff', border: 0, borderRadius: 8, padding: '9px 14px' }}>Publish and pin</button><button type="button" onClick={() => setShowNoticeForm(false)} style={{ background: 'transparent', color: theme.text, border: `1px solid ${theme.border}`, borderRadius: 8, padding: '9px 14px' }}>Cancel</button></div>
    </form>}
    <section style={{ display: 'grid', gap: 10 }}>
      <h2 style={{ margin: 0, fontSize: 17, display: 'flex', alignItems: 'center', gap: 8 }}><Pin size={17}/> Pinned announcements</h2>
      {notices.length === 0 ? <p style={{ color: theme.muted }}>No team announcements yet.</p> : notices.map(n => <article key={n.id} style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 15 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><strong>{n.title}</strong><button onClick={() => void togglePin(n)} title={n.is_pinned ? 'Unpin announcement' : 'Pin announcement'} style={{ background: 'transparent', border: 0, color: theme.muted, cursor: 'pointer' }}><Pin size={16}/></button></div>
        <p style={{ whiteSpace: 'pre-wrap', margin: '9px 0' }}>{n.content}</p><small style={{ color: theme.muted }}>Posted by {n.display_name} · {new Date(n.created_at).toLocaleString()}</small>
      </article>)}
    </section>
    <section style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px', borderBottom: `1px solid ${theme.border}`, fontWeight: 750 }}>Group chat</div>
      <div style={{ padding: 16, minHeight: 280, maxHeight: '58vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {loading ? <p style={{ color: theme.muted }}>Loading messages…</p> : messages.length === 0 ? <p style={{ color: theme.muted, textAlign: 'center', margin: 'auto' }}>No messages yet. Start the conversation.</p> : messages.map(m => <div key={m.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          {m.avatar_url ? <img src={m.avatar_url} alt="" style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover' }}/> : <div style={{ width: 38, height: 38, borderRadius: '50%', background: theme.bg, display: 'grid', placeItems: 'center', fontWeight: 700 }}>{m.display_name.slice(0,1).toUpperCase()}</div>}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}><strong>{m.display_name}</strong>{m.role && <span style={{ fontSize: 11, borderRadius: 20, padding: '3px 8px', background: m.role === 'Administrator' ? 'rgba(239,68,68,.13)' : 'rgba(139,92,246,.14)', color: m.role === 'Administrator' ? '#EF4444' : '#A78BFA' }}>{m.role}</span>}<small style={{ color: theme.muted }}>{new Date(m.created_at).toLocaleString()}</small></div>
            <div style={{ marginTop: 5, display: 'inline-block', maxWidth: '100%', background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: '4px 12px 12px 12px', padding: '10px 12px', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{m.content}</div>
          </div>
        </div>)}
        <div ref={bottomRef}/>
      </div>
      <form onSubmit={sendMessage} style={{ display: 'flex', gap: 9, padding: 12, borderTop: `1px solid ${theme.border}` }}>
        <input value={draft} onChange={e => setDraft(e.target.value)} maxLength={5000} placeholder={`Message as ${myName}...`} style={{ flex: 1, minWidth: 0, border: `1px solid ${theme.border}`, borderRadius: 22, padding: '11px 15px', background: theme.bg, color: theme.text }}/>
        <button disabled={!draft.trim() || sending} aria-label="Send message" style={{ border: 0, borderRadius: '50%', width: 42, height: 42, background: theme.accent, color: '#fff', display: 'grid', placeItems: 'center' }}><Send size={17}/></button>
      </form>
    </section>
  </div>;
}
