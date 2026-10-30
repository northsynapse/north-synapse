'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { ShieldCheck, UserPlus, RefreshCw, Trash2, Eye, EyeOff, Search } from 'lucide-react';

type Props = { isDarkMode: boolean; isAdmin: boolean };
type Member = { user_id: string; email: string; username: string; nickname: string; created_at: string; team_role: string | null; badge_visible?: boolean };

export default function TeamManagement({ isDarkMode, isAdmin }: Props) {
  const [members, setMembers] = useState<Member[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('community_team');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const theme = { bg: isDarkMode ? '#0E1117' : '#F8FAFC', card: isDarkMode ? '#161B22' : '#FFFFFF', border: isDarkMode ? '#30363D' : '#E2E8F0', text: isDarkMode ? '#F0F6FC' : '#0F172A', muted: isDarkMode ? '#8B949E' : '#64748B', accent: '#8B5CF6' };

  const load = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    const [directory, team, activity] = await Promise.all([
      supabase.rpc('team_user_directory', { p_search: search.trim() }),
      supabase.from('team_members').select('user_id,role,badge_visible,created_at'),
      supabase.from('admin_activity_logs').select('id,action,target_user_id,details,created_at,actor_id').order('created_at', { ascending: false }).limit(30)
    ]);
    if (directory.error) setError(directory.error.message);
    const teamRows = team.data || [];
    const byId: Record<string, any> = {};
    teamRows.forEach((m: any) => { byId[m.user_id] = m; });
    setMembers((directory.data || []).filter((u: any) => u.team_role).map((u: any) => ({ ...u, badge_visible: byId[u.user_id]?.badge_visible ?? true, created_at: byId[u.user_id]?.created_at || u.created_at })));
    setLogs(activity.data || []);
    setLoading(false);
  }, [isAdmin, search]);

  useEffect(() => { void load(); }, [load]);

  async function manage(action: 'add' | 'update' | 'remove', targetEmail: string, targetRole?: string) {
    setSaving(true); setError(''); setSuccess('');
    const { error: actionError } = await supabase.rpc('admin_manage_team_member', { p_email: targetEmail, p_action: action, p_role: targetRole || null });
    if (actionError) setError(actionError.message);
    else {
      setSuccess(action === 'add' ? 'Team member added. A notification has been saved for their next visit.' : action === 'remove' ? 'Team membership removed. A notification has been saved.' : 'Team role updated. A notification has been saved.');
      if (action === 'add') setEmail('');
      await load();
    }
    setSaving(false);
  }

  async function changeBadge(member: Member, visible: boolean) {
    const { error: badgeError } = await supabase.rpc('admin_set_team_badge_visibility', { p_user_id: member.user_id, p_visible: visible });
    if (badgeError) setError(badgeError.message); else await load();
  }

  if (!isAdmin) return <p style={{ color: theme.muted }}>Administrator access required.</p>;

  return <div style={{ display: 'grid', gap: 18, color: theme.text }}>
    <header><p style={{ color: theme.accent, fontSize: 12, fontWeight: 800, letterSpacing: 2, margin: 0 }}>ADMINISTRATION</p><h1 style={{ fontSize: 28, margin: '5px 0' }}>Team Management</h1><p style={{ color: theme.muted, margin: 0 }}>Manage team membership, roles and public badges.</p></header>
    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12 }}>
      {[{ label: 'Core Team', count: members.filter(m => m.team_role === 'core_team').length }, { label: 'Community Team', count: members.filter(m => m.team_role === 'community_team').length }, { label: 'Total Members', count: members.length }].map(x => <div key={x.label} style={{ padding: 16, border: `1px solid ${theme.border}`, borderRadius: 13, background: theme.card }}><div style={{ color: theme.muted, fontSize: 13 }}>{x.label}</div><div style={{ fontSize: 30, fontWeight: 800 }}>{x.count}</div></div>)}
    </section>
    <section style={{ border: `1px solid ${theme.border}`, borderRadius: 14, background: theme.card, padding: 18, display: 'grid', gap: 12 }}>
      <h2 style={{ margin: 0, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}><UserPlus size={18}/> Add team member</h2>
      <form onSubmit={e => { e.preventDefault(); void manage('add', email, role); }} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2fr) minmax(150px,1fr) auto', gap: 9 }}>
        <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Registered account email" style={{ minWidth: 0, padding: 11, borderRadius: 8, border: `1px solid ${theme.border}`, background: theme.bg, color: theme.text }}/>
        <select value={role} onChange={e => setRole(e.target.value)} style={{ padding: 11, borderRadius: 8, border: `1px solid ${theme.border}`, background: theme.bg, color: theme.text }}><option value="core_team">Core Team</option><option value="community_team">Community Team</option></select>
        <button disabled={saving || !email.trim()} style={{ border: 0, borderRadius: 8, background: theme.accent, color: '#fff', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 7 }}><UserPlus size={16}/> Add</button>
      </form>
      <small style={{ color: theme.muted }}>The account must already be registered. The member receives a persistent notification showing the new role and every permission.</small>
      {error && <p role="alert" style={{ color: '#EF4444', margin: 0 }}>{error}</p>}{success && <p role="status" style={{ color: '#10B981', margin: 0 }}>{success}</p>}
    </section>
    <section style={{ border: `1px solid ${theme.border}`, borderRadius: 14, background: theme.card, padding: 18, display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}><h2 style={{ margin: 0, fontSize: 18 }}>Team members and permissions</h2><button onClick={() => void load()} style={{ border: `1px solid ${theme.border}`, background: 'transparent', color: theme.text, padding: '8px 10px', borderRadius: 8, display: 'flex', gap: 7, alignItems: 'center' }}><RefreshCw size={15}/> Refresh</button></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${theme.border}`, borderRadius: 8, padding: '0 10px' }}><Search size={16} color={theme.muted}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search accounts by email or name" style={{ flex: 1, minWidth: 0, padding: 10, border: 0, outline: 0, background: 'transparent', color: theme.text }}/></div>
      {loading ? <p style={{ color: theme.muted }}>Loading team...</p> : members.length === 0 ? <p style={{ color: theme.muted }}>No team members found.</p> : members.map(member => <article key={member.user_id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 12, alignItems: 'center', padding: '13px 0', borderTop: `1px solid ${theme.border}` }}>
        <div style={{ minWidth: 0 }}><strong>{member.nickname || member.username}</strong><div style={{ color: theme.muted, fontSize: 13, overflowWrap: 'anywhere' }}>{member.email}</div><div style={{ color: theme.muted, fontSize: 12 }}>@{member.username} · Joined {new Date(member.created_at).toLocaleDateString()}</div><div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>{(member.team_role === 'core_team' ? ['Platform statistics','Moderation','User management','User support','Activity logs'] : ['Platform statistics','Moderation','User support']).map(p => <span key={p} style={{ fontSize: 10, padding: '3px 7px', borderRadius: 20, background: theme.bg, color: theme.muted }}>{p}</span>)}</div></div>
        <div style={{ display: 'grid', gap: 7, justifyItems: 'end' }}>
          {member.team_role === 'administrator' ? <span style={{ fontSize: 12, fontWeight: 800, color: '#EF4444', padding: '7px 9px' }}>Administrator</span> : <select value={member.team_role || ''} onChange={e => void manage('update', member.email, e.target.value)} disabled={saving} style={{ maxWidth: 155, padding: 8, borderRadius: 8, border: `1px solid ${theme.border}`, background: theme.bg, color: theme.text }}><option value="core_team">Core Team</option><option value="community_team">Community Team</option></select>}
          <div style={{ display: 'flex', gap: 6 }}>
            {member.team_role !== 'administrator' && <button title={member.badge_visible ? 'Hide public badge' : 'Show public badge'} onClick={() => void changeBadge(member, !member.badge_visible)} style={{ border: `1px solid ${theme.border}`, background: 'transparent', color: theme.text, padding: 7, borderRadius: 7 }}>{member.badge_visible ? <Eye size={15}/> : <EyeOff size={15}/>}</button>}
            {member.team_role !== 'administrator' && <button title="Remove from team" onClick={() => { if (window.confirm(`Remove ${member.email} from the team?`)) void manage('remove', member.email); }} disabled={saving} style={{ border: '1px solid rgba(239,68,68,.4)', background: 'transparent', color: '#EF4444', padding: 7, borderRadius: 7 }}><Trash2 size={15}/></button>}
          </div>
        </div>
      </article>)}
    </section>
    <section style={{ border: `1px solid ${theme.border}`, borderRadius: 14, background: theme.card, padding: 18 }}>
      <h2 style={{ margin: '0 0 12px', fontSize: 18 }}>Recent activity</h2>
      {logs.length === 0 ? <p style={{ color: theme.muted }}>No administrative activity recorded yet.</p> : logs.map(log => <div key={log.id} style={{ padding: '9px 0', borderTop: `1px solid ${theme.border}`, fontSize: 13 }}><strong>{String(log.action).replaceAll('_',' ')}</strong><div style={{ color: theme.muted }}>{new Date(log.created_at).toLocaleString()} · {log.details?.email || log.target_user_id || 'Platform action'}</div></div>)}
    </section>
  </div>;
}
