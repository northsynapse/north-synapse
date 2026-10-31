'use client';

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Pin, Send, Users, Megaphone, Paperclip, FileText, X } from 'lucide-react';

type Props = { user: any; nickname: string; username: string; teamRole: string | null; isAdmin: boolean; isDarkMode: boolean };
type ChatMessage = { id: string; user_id: string; content: string; created_at: string; display_name: string; avatar_url: string; role: string; attachment?: { path: string; name: string; type: string; size: number; url?: string } | null };
type TeamNotice = { id: string; title: string; content: string; author_id: string; created_at: string; is_pinned: boolean; display_name: string; avatar_url: string; role: string };

export default function TeamChat({ user, nickname, username, teamRole, isAdmin, isDarkMode }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [notices, setNotices] = useState<TeamNotice[]>([]);
  const [draft, setDraft] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeBody, setNoticeBody] = useState('');
  const [showNoticeForm, setShowNoticeForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const theme = { bg: isDarkMode ? '#0E1117' : '#F8FAFC', card: isDarkMode ? '#161B22' : '#FFFFFF', border: isDarkMode ? '#30363D' : '#E2E8F0', text: isDarkMode ? '#F0F6FC' : '#0F172A', muted: isDarkMode ? '#8B949E' : '#64748B', accent: '#7B52E5' };
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
    const adminChecks = await Promise.all(ids.map(async (id) => ({ id, result: await supabase.rpc('is_platform_admin', { p_user_id: id }) })));
    adminChecks.forEach(({ id, result }) => { if (result.data === true) roleMap[id] = 'administrator'; });
    const hydratedMessages = await Promise.all(rows.map(async (m: any) => {
      let attachment = null;
      let visibleContent = m.content;
      if (typeof m.content === 'string' && m.content.startsWith('__NS_CHAT_ATTACHMENT__')) {
        try {
          const saved = JSON.parse(m.content.slice('__NS_CHAT_ATTACHMENT__'.length));
          const { data } = await supabase.storage.from('team-chat-attachments').createSignedUrl(saved.path, 3600);
          attachment = { ...saved, url: data?.signedUrl || '' };
          visibleContent = saved.caption || '';
        } catch {
          visibleContent = 'Attachment unavailable.';
        }
      }
      return { ...m, content: visibleContent, attachment, display_name: map[m.user_id]?.nickname || map[m.user_id]?.username || 'Team member', avatar_url: map[m.user_id]?.avatar_path || '', role: roleMap[m.user_id] === 'administrator' ? 'Administrator' : roleMap[m.user_id] === 'core_team' ? 'Core Team' : roleMap[m.user_id] === 'community_team' ? 'Community Team' : '' };
    }));
    setMessages(hydratedMessages);
    setNotices(noticeRows.map((n: any) => ({ ...n, display_name: map[n.author_id]?.nickname || map[n.author_id]?.username || 'Team member', avatar_url: map[n.author_id]?.avatar_path || '', role: roleMap[n.author_id] === 'administrator' ? 'Administrator' : roleMap[n.author_id] === 'core_team' ? 'Core Team' : roleMap[n.author_id] === 'community_team' ? 'Community Team' : '' })));
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

  useLayoutEffect(() => {
    const chat = chatScrollRef.current;
    if (!chat) return;

    // 等待消息列表完成本次 DOM 更新后，再将聊天区域定位到最底部。
    const frame = window.requestAnimationFrame(() => {
      chat.scrollTop = chat.scrollHeight;
    });

    return () => window.cancelAnimationFrame(frame);
  }, [messages, loading]);

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    const content = draft.trim();
    if ((!content && !selectedFile) || !user?.id || sending) return;
    if (selectedFile && selectedFile.size > 15 * 1024 * 1024) {
      setError('Files must be 15 MB or smaller.');
      return;
    }
    setSending(true);
    let messageContent = content;
    if (selectedFile) {
      const safeName = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = user.id + '/' + crypto.randomUUID() + '-' + safeName;
      const { error: uploadError } = await supabase.storage.from('team-chat-attachments').upload(path, selectedFile, { contentType: selectedFile.type || 'application/octet-stream', upsert: false });
      if (uploadError) {
        setError(uploadError.message);
        setSending(false);
        return;
      }
      messageContent = '__NS_CHAT_ATTACHMENT__' + JSON.stringify({ path, name: selectedFile.name, type: selectedFile.type, size: selectedFile.size, caption: content });
    }
    const { error: sendError } = await supabase.from('team_chat_messages').insert({ user_id: user.id, content: messageContent });
    if (sendError) setError(sendError.message);
    else { setDraft(''); setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; await load(); }
    setSending(false);
  }

  async function deleteMessage(messageId: string) {
    const { error: deleteError } = await supabase.from('team_chat_messages').update({ deleted_at: new Date().toISOString() }).eq('id', messageId);
    if (deleteError) setError(deleteError.message); else { await supabase.rpc('record_team_activity', { p_action: 'chat_message_deleted', p_target_user_id: null, p_details: { message_id: messageId } }); await load(); }
  }

  async function publishNotice(event: React.FormEvent) {
    event.preventDefault();
    if (!noticeTitle.trim() || !noticeBody.trim() || !user?.id) return;
    const { error: publishError } = await supabase.from('team_chat_announcements').insert({ author_id: user.id, title: noticeTitle.trim(), content: noticeBody.trim(), is_pinned: true });
    if (publishError) setError(publishError.message);
    else { await supabase.rpc('record_team_activity', { p_action: 'chat_announcement_published', p_target_user_id: null, p_details: { title: noticeTitle.trim() } }); setNoticeTitle(''); setNoticeBody(''); setShowNoticeForm(false); await load(); }
  }

  async function deleteNotice(item: TeamNotice) {
    if (!window.confirm('Delete this team announcement?')) return;
    const { error: deleteError } = await supabase.from('team_chat_announcements').delete().eq('id', item.id);
    if (deleteError) setError(deleteError.message); else { await supabase.rpc('record_team_activity', { p_action: 'chat_announcement_deleted', p_target_user_id: null, p_details: { announcement_id: item.id } }); await load(); }
  }

  async function togglePin(item: TeamNotice) {
    const { error: updateError } = await supabase.from('team_chat_announcements').update({ is_pinned: !item.is_pinned }).eq('id', item.id);
    if (updateError) setError(updateError.message); else { await supabase.rpc('record_team_activity', { p_action: 'chat_announcement_pin_changed', p_target_user_id: null, p_details: { announcement_id: item.id, is_pinned: !item.is_pinned } }); await load(); }
  }

  if (!allowed) return <div style={{ padding: 28, border: `1px solid ${theme.border}`, borderRadius: 16, color: theme.text }}>Team membership is required to access this private chat.</div>;

  return <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: 18, color: theme.text }}>
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <div><div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><Users size={22}/><h1 style={{ margin: 0, fontSize: 26 }}>North Synapse Team</h1></div><p style={{ color: theme.muted, margin: '6px 0 0' }}>Private team group chat</p></div>
      {isAdmin && <button onClick={() => setShowNoticeForm(v => !v)} style={{ border: 0, borderRadius: 9, padding: '10px 14px', background: theme.accent, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}><Megaphone size={16}/> Post announcement</button>}
    </header>
    {error && <p role="alert" style={{ color: '#EF4444' }}>{error}</p>}
    {isAdmin && showNoticeForm && <form onSubmit={publishNotice} style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 14, padding: 16, display: 'grid', gap: 10 }}>
      <h2 style={{ margin: 0, fontSize: 18 }}>New pinned announcement</h2>
      <input value={noticeTitle} onChange={e => setNoticeTitle(e.target.value)} placeholder="Announcement title" maxLength={180} required style={{ padding: 11, borderRadius: 8, border: `1px solid ${theme.border}`, background: theme.bg, color: theme.text }}/>
      <textarea value={noticeBody} onChange={e => setNoticeBody(e.target.value)} placeholder="Write an announcement for current and future team members..." rows={4} maxLength={8000} required style={{ padding: 11, borderRadius: 8, border: `1px solid ${theme.border}`, background: theme.bg, color: theme.text, resize: 'vertical' }}/>
      <div style={{ display: 'flex', gap: 8 }}><button disabled={!noticeTitle.trim() || !noticeBody.trim()} style={{ background: theme.accent, color: '#fff', border: 0, borderRadius: 8, padding: '9px 14px' }}>Publish and pin</button><button type="button" onClick={() => setShowNoticeForm(false)} style={{ background: 'transparent', color: theme.text, border: `1px solid ${theme.border}`, borderRadius: 8, padding: '9px 14px' }}>Cancel</button></div>
    </form>}
    <section style={{ display: 'grid', gap: 10 }}>
      <h2 style={{ margin: 0, fontSize: 17, display: 'flex', alignItems: 'center', gap: 8 }}><Pin size={17}/> Pinned announcements</h2>
      {notices.length === 0 ? <p style={{ color: theme.muted }}>No team announcements yet.</p> : notices.map(n => <article key={n.id} style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 15 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><strong>{n.title}</strong><div style={{ display: 'flex', gap: 8 }}>{isAdmin && <button onClick={() => void togglePin(n)} title={n.is_pinned ? 'Unpin announcement' : 'Pin announcement'} style={{ background: 'transparent', border: 0, color: theme.muted, cursor: 'pointer' }}><Pin size={16}/></button>}{isAdmin && <button onClick={() => void deleteNotice(n)} title="Delete announcement" style={{ background: 'transparent', border: 0, color: '#EF4444', cursor: 'pointer', fontSize: 12 }}>Delete</button>}</div></div>
        <p style={{ whiteSpace: 'pre-wrap', margin: '9px 0' }}>{n.content}</p><div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>{n.avatar_url ? <img src={n.avatar_url} alt="" style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }}/> : <span style={{ width: 22, height: 22, borderRadius: '50%', background: theme.bg, display: 'grid', placeItems: 'center', fontSize: 10 }}>{n.display_name.slice(0,1).toUpperCase()}</span>}<small style={{ color: theme.muted }}>{n.display_name}</small>{n.role && <span style={{ fontSize: 10, borderRadius: 20, padding: '2px 7px', background: n.role === 'Administrator' ? 'rgba(239,68,68,.13)' : 'rgba(139,92,246,.14)', color: n.role === 'Administrator' ? '#EF4444' : '#A78BFA' }}>{n.role}</span>}<small style={{ color: theme.muted }}>· {new Date(n.created_at).toLocaleString()}</small></div>
      </article>)}
    </section>
    <section style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px', borderBottom: `1px solid ${theme.border}`, fontWeight: 750 }}>Group chat</div>
      <div ref={chatScrollRef} style={{ padding: 22, minHeight: 420, maxHeight: '70vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {loading ? <p style={{ color: theme.muted }}>Loading messages…</p> : messages.length === 0 ? <p style={{ color: theme.muted, textAlign: 'center', margin: 'auto' }}>No messages yet. Start the conversation.</p> : messages.map(m => { const own = m.user_id === user.id; const canDelete = isAdmin || (own && Date.now() - new Date(m.created_at).getTime() <= 5 * 60 * 1000); const messageDate = new Date(m.created_at); const now = new Date(); const isToday = messageDate.getFullYear() === now.getFullYear() && messageDate.getMonth() === now.getMonth() && messageDate.getDate() === now.getDate(); const messageTime = messageDate.toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit', hour12: false }); const timeLabel = isToday ? messageTime : `${messageDate.getMonth() + 1}/${messageDate.getDate()} ${messageTime}`; return <div key={m.id} style={{ width: '100%', display: 'flex', justifyContent: own ? 'flex-end' : 'flex-start', gap: 10, alignItems: 'flex-start' }}>
          <div style={{ order: own ? 0 : 1, minWidth: 0, width: 'min(66.666%, 680px)', display: 'flex', flexDirection: 'column', alignItems: own ? 'flex-end' : 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: own ? 'flex-end' : 'flex-start', gap: 2, maxWidth: '100%', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: own ? 'flex-end' : 'flex-start', gap: 7, flexWrap: 'wrap', textAlign: own ? 'right' : 'left', width: '100%' }}>{own && m.role && <span style={{ fontSize: 11, borderRadius: 20, padding: '3px 8px', background: m.role === 'Administrator' ? 'rgba(239,68,68,.13)' : 'rgba(139,92,246,.14)', color: m.role === 'Administrator' ? '#EF4444' : '#A78BFA' }}>{m.role}</span>}<strong>{m.display_name}</strong>{!own && m.role && <span style={{ fontSize: 11, borderRadius: 20, padding: '3px 8px', background: m.role === 'Administrator' ? 'rgba(239,68,68,.13)' : 'rgba(139,92,246,.14)', color: m.role === 'Administrator' ? '#EF4444' : '#A78BFA' }}>{m.role}</span>}</div>
              <small style={{ color: theme.muted, textAlign: own ? 'right' : 'left', fontSize: 10, lineHeight: 1.3 }}>{timeLabel}</small>
            </div>
            <div style={{ width: '100%', display: 'flex', alignItems: 'flex-start', justifyContent: own ? 'flex-end' : 'flex-start', gap: 8, flexWrap: 'wrap' }}><div style={{ marginTop: 5, display: 'inline-block', maxWidth: '100%', background: own ? 'rgba(123,82,229,.13)' : theme.bg, border: `1px solid ${theme.border}`, borderRadius: own ? '12px 4px 12px 12px' : '4px 12px 12px 12px', padding: '10px 12px', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', textAlign: 'left' }}>
              {m.content && <div>{m.content}</div>}
              {m.attachment?.url && (m.attachment.type.startsWith('image/') ? <a href={m.attachment.url} target="_blank" rel="noreferrer"><img src={m.attachment.url} alt={m.attachment.name} style={{ display: 'block', maxWidth: 'min(100%, 360px)', maxHeight: 280, objectFit: 'contain', borderRadius: 8, marginTop: m.content ? 8 : 0 }}/></a> : <a href={m.attachment.url} target="_blank" rel="noreferrer" download={m.attachment.name} style={{ display: 'flex', alignItems: 'center', gap: 8, color: theme.accent, textDecoration: 'underline', overflowWrap: 'anywhere' }}><FileText size={18}/>{m.attachment.name} <small>({(m.attachment.size / 1024 / 1024).toFixed(1)} MB)</small></a>)}
            </div>{canDelete && <button onClick={() => void deleteMessage(m.id)} style={{ marginTop: 8, border: 0, background: 'transparent', color: '#EF4444', fontSize: 11, cursor: 'pointer' }}>Delete</button>}</div>
          {m.avatar_url ? <img src={m.avatar_url} alt="" style={{ order: own ? 1 : 0, width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}/> : <div style={{ order: own ? 1 : 0, width: 38, height: 38, flexShrink: 0, borderRadius: '50%', background: theme.bg, display: 'grid', placeItems: 'center', fontWeight: 700 }}>{m.display_name.slice(0,1).toUpperCase()}</div>}
          </div>
        </div>; })}
</div>
      <form onSubmit={sendMessage} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: 12, borderTop: `1px solid ${theme.border}` }}>
        <input ref={fileInputRef} type="file" accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.zip" hidden onChange={e => setSelectedFile(e.target.files?.[0] || null)}/>
        <button type="button" onClick={() => fileInputRef.current?.click()} aria-label="Attach image or file" title="Attach image or file" style={{ border: `1px solid ${theme.border}`, borderRadius: '50%', width: 42, height: 42, flexShrink: 0, background: 'transparent', color: theme.muted, display: 'grid', placeItems: 'center' }}><Paperclip size={18}/></button>
        <input value={draft} onChange={e => setDraft(e.target.value)} maxLength={5000} placeholder={`Message as ${myName}...`} style={{ flex: 1, minWidth: 0, border: `1px solid ${theme.border}`, borderRadius: 22, padding: '11px 15px', background: theme.bg, color: theme.text }}/>
        {selectedFile && <button type="button" onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} title="Remove attachment" style={{ border: 0, background: 'transparent', color: theme.muted, display: 'grid', placeItems: 'center' }}><X size={17}/></button>}
        <button disabled={(!draft.trim() && !selectedFile) || sending} aria-label="Send message" style={{ border: 0, borderRadius: '50%', width: 42, height: 42, flexShrink: 0, background: theme.accent, color: '#fff', display: 'grid', placeItems: 'center' }}><Send size={17}/></button>
      </form>
      {selectedFile && <div style={{ padding: '0 16px 12px', color: theme.muted, fontSize: 12 }}>Selected: {selectedFile.name} · {(selectedFile.size / 1024 / 1024).toFixed(1)} MB</div>}
    </section>
  </div>;
}
