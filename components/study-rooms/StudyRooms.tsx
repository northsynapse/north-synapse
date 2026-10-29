'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Crown, LockKeyhole, MessageCircle, Plus, Search, Send, Users, X, LogOut, ShieldAlert } from 'lucide-react';

type Room = {
  id: string; name: string; subject: string; description: string;
  isPrivate: boolean; roomCode?: string; createdAt: string;
  lastActivityAt: string; createdBy: string; ownerId: string | null;
  isSystemLobby: boolean; status: string; activeUsers: number;
};
type Person = {
  user_id: string; display_name: string; avatar_url: string;
  joined_at: string; last_seen_at: string; study_seconds: number;
};
type Message = {
  id: string; user_id: string; display_name: string; avatar_url: string;
  body: string; created_at: string;
};
type Props = {
  user: any; username: string; nickname: string; avatarUrl: string;
  isDarkMode: boolean; onSignIn: () => void;
};


export default function StudyRooms({ user, username, nickname, avatarUrl, isDarkMode, onSignIn }: Props) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [joinedRoom, setJoinedRoom] = useState<Room | null>(null);
  const [members, setMembers] = useState<Person[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [search, setSearch] = useState('');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [sortBy, setSortBy] = useState<'created' | 'active'>('created');
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newSubject, setNewSubject] = useState('General Study');
  const [newPrivate, setNewPrivate] = useState(false);
  const [goal, setGoal] = useState('');
  const [goalDraft, setGoalDraft] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [remainingSeconds, setRemainingSeconds] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [chatSending, setChatSending] = useState(false);
  const [notice, setNotice] = useState('');
  const [kickNotice, setKickNotice] = useState('');
  const [handoffUserId, setHandoffUserId] = useState('');
  const [showHandoff, setShowHandoff] = useState(false);
  const [privateRoomCode, setPrivateRoomCode] = useState('');

  const theme = {
    bg: isDarkMode ? '#0E1117' : '#F8FAFC',
    card: isDarkMode ? '#161B22' : '#FFFFFF',
    border: isDarkMode ? '#30363D' : '#E2E8F0',
    text: isDarkMode ? '#F0F6FC' : '#0F172A',
    muted: isDarkMode ? '#8B949E' : '#64748B',
    accent: '#8B5CF6',
    danger: '#EF4444',
  };
  const displayName = nickname || username || user?.email?.split('@')[0] || 'Student';
  const isOwner = !!joinedRoom && joinedRoom.ownerId === user?.id;
  const isSystemLobby = !!joinedRoom?.isSystemLobby;

  const formatDuration = (seconds: number) => {
    const safe = Math.max(0, Math.floor(seconds || 0));
    const hours = Math.floor(safe / 3600);
    const minutes = Math.floor((safe % 3600) / 60);
    const secs = safe % 60;
    return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}` : `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };
  const formatClock = (value: string) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const loadRooms = useCallback(async () => {
    const { data, error } = await supabase
      .from('study_rooms')
      .select('id,name,subject,description,is_private,room_code,created_at,last_activity_at,created_by,owner_id,is_system_lobby,status,empty_since')
      .eq('status', 'active');
    if (error) {
      console.error('加载自习室失败：', error.message);
      setNotice('Could not load study rooms. Check that the study-room migration has been applied.');
      return;
    }
    const rows = data || [];
    const ids = rows.map((room: any) => room.id);
    const { data: activeRows, error: activeError } = ids.length
      ? await supabase.from('study_room_presence').select('room_id,user_id,last_seen_at').in('room_id', ids).gte('last_seen_at', new Date(Date.now() - 120000).toISOString())
      : { data: [], error: null };
    if (activeError) console.error('读取房间在线人数失败：', activeError.message);
    const counts = new Map<string, number>();
    (activeRows || []).forEach((row: any) => counts.set(String(row.room_id), (counts.get(String(row.room_id)) || 0) + 1));
    setRooms(rows
      .filter((room: any) => !room.is_private || room.created_by === user?.id || room.owner_id === user?.id || room.is_system_lobby)
      .map((room: any) => ({
        id: String(room.id), name: room.name, subject: room.subject || 'General Study',
        description: room.description || '', isPrivate: !!room.is_private, roomCode: room.room_code || undefined,
        createdAt: room.created_at, lastActivityAt: room.last_activity_at || room.created_at,
        createdBy: room.created_by || '', ownerId: room.owner_id || null,
        isSystemLobby: !!room.is_system_lobby, status: room.status,
        activeUsers: counts.get(String(room.id)) || 0
      })));
  }, [user?.id]);

  const refreshRoom = useCallback(async (roomId: string) => {
    if (!user?.id) return;
    const { data: membership, error: membershipError } = await supabase
      .from('study_room_active_members')
      .select('room_id')
      .eq('room_id', roomId)
      .eq('user_id', user.id)
      .maybeSingle();
    if (membershipError) {
      console.error('检查自习室成员身份失败：', membershipError.message);
      return;
    }
    if (!membership) {
      setJoinedRoom(null); setMembers([]); setMessages([]); setTimerRunning(false);
      return;
    }
    const { data: roomRow, error: roomError } = await supabase.from('study_rooms')
      .select('id,name,subject,description,is_private,created_at,last_activity_at,created_by,owner_id,is_system_lobby,status,room_code')
      .eq('id', roomId).maybeSingle();
    if (roomError || !roomRow || roomRow.status !== 'active') {
      setJoinedRoom(null); setMembers([]); setMessages([]); setTimerRunning(false);
      setNotice('This study room has ended or is no longer available.');
      return;
    }
    if (roomRow.is_private) setPrivateRoomCode(roomRow.room_code || '');
    const { data: activeRows } = await supabase.from('study_room_active_members')
      .select('user_id,joined_at').eq('room_id', roomId).order('joined_at', { ascending: true });
    const { data: presenceRows, error: presenceError } = await supabase.from('study_room_presence')
      .select('user_id,display_name,avatar_url,joined_at,last_seen_at,study_seconds')
      .eq('room_id', roomId).gte('last_seen_at', new Date(Date.now() - 120000).toISOString());
    if (presenceError) console.error('读取在线成员失败：', presenceError.message);
    const activeMap = new Map((activeRows || []).map((x: any) => [x.user_id, x.joined_at]));
    const people = (presenceRows || []).map((p: any) => ({
      ...p, joined_at: activeMap.get(p.user_id) || p.joined_at
    })).sort((a: Person, b: Person) => {
      if (a.user_id === roomRow.owner_id) return -1;
      if (b.user_id === roomRow.owner_id) return 1;
      return new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime();
    });
    setMembers(people);
    const { data: messageRows, error: messageError } = await supabase.from('study_room_messages')
      .select('id,user_id,display_name,avatar_url,body,created_at')
      .eq('room_id', roomId).order('created_at', { ascending: true }).limit(150);
    if (!messageError) setMessages(messageRows || []);
    else console.error('读取聊天消息失败：', messageError.message);
    setJoinedRoom({
      id: String(roomRow.id), name: roomRow.name, subject: roomRow.subject || 'General Study',
      description: roomRow.description || '', isPrivate: !!roomRow.is_private,
      roomCode: roomRow.is_private ? roomRow.room_code || undefined : undefined,
      createdAt: roomRow.created_at, lastActivityAt: roomRow.last_activity_at || roomRow.created_at,
      createdBy: roomRow.created_by || '', ownerId: roomRow.owner_id || null,
      isSystemLobby: !!roomRow.is_system_lobby, status: roomRow.status, activeUsers: people.length
    });
  }, [user?.id]);

  useEffect(() => { void loadRooms(); }, [loadRooms]);

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    const loadPendingKickNotice = async () => {
      const { data, error } = await supabase
        .from('study_room_kick_events')
        .select('id,room_id,created_at')
        .eq('user_id', user.id)
        .is('acknowledged_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) {
        console.error('读取自习室踢出通知失败：', error.message);
        return;
      }
      if (active && data) setKickNotice('You were removed from this study room by the room owner.');
    };
    void loadPendingKickNotice();
    const channel = supabase.channel(`study-room-kick-events-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'study_room_kick_events', filter: `user_id=eq.${user.id}` }, () => {
        void loadPendingKickNotice();
      }).subscribe();
    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase.channel('study-room-directory')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'study_rooms' }, () => { void loadRooms(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'study_room_active_members' }, () => { void loadRooms(); })
      .subscribe();
    const timer = window.setInterval(() => { void loadRooms(); }, 15000);
    return () => { window.clearInterval(timer); void supabase.removeChannel(channel); };
  }, [user?.id, loadRooms]);

  useEffect(() => {
    const roomId = joinedRoom?.id;
    const userId = user?.id;
    if (!roomId || !userId) return;
    let active = true;
    const heartbeat = async () => {
      const { error } = await supabase.rpc('heartbeat_study_room', {
        p_room_id: roomId, p_display_name: displayName, p_avatar_url: avatarUrl || '', p_seconds: 0
      });
      if (error) console.error('自习室心跳失败：', error.message);
    };
    void heartbeat();
    const heartbeatTimer = window.setInterval(heartbeat, 30000);
    const pollTimer = window.setInterval(() => { if (active) void refreshRoom(roomId); }, 5000);
    const channel = supabase.channel(`study-room-${roomId}-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'study_room_active_members', filter: `room_id=eq.${roomId}` }, () => { if (active) void refreshRoom(roomId); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'study_room_messages', filter: `room_id=eq.${roomId}` }, () => { if (active) void refreshRoom(roomId); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'study_rooms', filter: `id=eq.${roomId}` }, () => { if (active) void refreshRoom(roomId); })
.subscribe();
    void refreshRoom(roomId);
    return () => {
      active = false; window.clearInterval(heartbeatTimer); window.clearInterval(pollTimer);
      void supabase.removeChannel(channel);
      void supabase.from('study_room_presence').delete().eq('room_id', roomId).eq('user_id', userId);
    };
  }, [joinedRoom?.id, user?.id, displayName, avatarUrl, refreshRoom]);

  useEffect(() => {
    if (!timerRunning) return;
    const timer = window.setInterval(() => setRemainingSeconds((value) => {
      if (value <= 1) { setTimerRunning(false); setNotice('Focus session complete. Well done!'); return 0; }
      return value - 1;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [timerRunning]);

  const sortedRooms = useMemo(() => {
    const visible = rooms.filter((room) => room.isSystemLobby || room.name.toLowerCase().includes(search.trim().toLowerCase()));
    visible.sort((a, b) => {
      if (a.isSystemLobby) return -1;
      if (b.isSystemLobby) return 1;
      if (sortBy === 'active') return b.activeUsers - a.activeUsers || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return visible;
  }, [rooms, search, sortBy]);

  async function joinRoom(room: Room, code?: string) {
    if (!user?.id) { onSignIn(); return; }
    if (loading) return;
    let joinCode = code;
    if (room.isPrivate && !joinCode) joinCode = room.roomCode || window.prompt('Enter the private room code') || undefined;
    if (room.isPrivate && !joinCode?.trim()) return;
    setLoading(true); setNotice('');
    const { error } = await supabase.rpc('join_study_room_v2', { p_room_id: room.id, p_room_code: joinCode || null });
    setLoading(false);
    if (error) { setNotice(error.message.includes('Invalid room code') ? 'That room code is incorrect.' : error.message); return; }
    setTimerRunning(false); setRemainingSeconds(durationMinutes * 60); setGoal(''); setGoalDraft('');
    await refreshRoom(room.id); await loadRooms();
  }

  async function joinByCode(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.id) { onSignIn(); return; }
    if (loading || !roomCodeInput.trim()) return;
    setLoading(true); setNotice('');
    const { data, error } = await supabase.rpc('join_private_study_room_v2', { p_room_code: roomCodeInput.trim().toUpperCase() });
    setLoading(false);
    const id = typeof data === 'string' ? data : data?.id;
    if (error || !id) { setNotice('No active private room matches that code.'); return; }
    setRoomCodeInput(''); setTimerRunning(false); setRemainingSeconds(durationMinutes * 60);
    await refreshRoom(String(id)); await loadRooms();
  }

  async function createRoom(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.id) { onSignIn(); return; }
    const cleanName = newName.trim();
    if (!cleanName || loading) return;
    setLoading(true); setNotice('');
    const roomCode = newPrivate ? crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase() : null;
    const { data, error } = await supabase.from('study_rooms').insert({
      name: cleanName, subject: newSubject, description: newDescription.trim(),
      is_private: newPrivate, room_code: roomCode, created_by: user.id,
      owner_id: user.id, status: 'active', is_system_lobby: false, empty_since: null
    }).select('id').single();
    if (error || !data?.id) {
      console.error('创建自习室失败：', error?.message);
      setNotice('Could not create the room. Confirm the migration is applied and room fields allow these values.');
      setLoading(false); return;
    }
    const roomId = String(data.id);
    const { error: joinError } = await supabase.rpc('join_study_room_v2', { p_room_id: roomId, p_room_code: roomCode });
    setLoading(false);
    if (joinError) { setNotice('The room was created, but joining failed: ' + joinError.message); return; }
    setShowCreate(false); setNewName(''); setNewDescription(''); setNewPrivate(false);
    setTimerRunning(false); setRemainingSeconds(durationMinutes * 60);
    await refreshRoom(roomId); await loadRooms();
  }

  async function leaveRoom(newOwnerId?: string) {
    if (!joinedRoom || !user?.id || loading) return;
    setLoading(true);
    const { error } = await supabase.rpc('leave_study_room_v2', { p_room_id: joinedRoom.id, p_new_owner_id: newOwnerId || null });
    setLoading(false);
    if (error) { setNotice('Could not leave the room: ' + error.message); return; }
    setJoinedRoom(null); setMembers([]); setMessages([]); setTimerRunning(false);
    setShowHandoff(false); setHandoffUserId(''); setPrivateRoomCode('');
    await loadRooms();
  }

  async function handleLeave() {
    if (!joinedRoom || !isOwner || isSystemLobby) { await leaveRoom(); return; }
    const others = members.filter((person) => person.user_id !== user?.id);
    if (!others.length) { await leaveRoom(); return; }
    setHandoffUserId(others[0].user_id);
    setShowHandoff(true);
  }

  async function kickMember(targetId: string) {
    if (!joinedRoom || !isOwner || targetId === user?.id || loading) return;
    if (!window.confirm('Remove this member from the study room?')) return;
    setLoading(true);
    const { error } = await supabase.rpc('kick_study_room_member_v2', { p_room_id: joinedRoom.id, p_target_user_id: targetId });
    setLoading(false);
    if (error) setNotice('Could not remove member: ' + error.message);
    else { setNotice('Member removed.'); await refreshRoom(joinedRoom.id); await loadRooms(); }
  }

  async function endRoom() {
    if (!joinedRoom || !isOwner || isSystemLobby || loading) return;
    if (!window.confirm('End this study room for everyone? This cannot be undone.')) return;
    setLoading(true);
    const { error } = await supabase.rpc('end_study_room_v2', { p_room_id: joinedRoom.id });
    setLoading(false);
    if (error) { setNotice('Could not end room: ' + error.message); return; }
    setJoinedRoom(null); setMembers([]); setMessages([]); setTimerRunning(false);
    setNotice('The study room has been ended.'); await loadRooms();
  }

  async function dismissKickNotice() {
    if (user?.id) {
      const { data } = await supabase
        .from('study_room_kick_events')
        .select('id')
        .eq('user_id', user.id)
        .is('acknowledged_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data?.id) {
        await supabase.from('study_room_kick_events')
          .update({ acknowledged_at: new Date().toISOString() })
          .eq('id', data.id);
      }
    }
    setKickNotice('');
  }

  async function saveGoal(e: React.FormEvent) {
    e.preventDefault();
    if (!joinedRoom || !user?.id) return;
    const cleanGoal = goalDraft.trim().slice(0, 500);
    const { error } = await supabase.from('study_room_goals').upsert({
      room_id: joinedRoom.id, user_id: user.id, goal: cleanGoal, updated_at: new Date().toISOString()
    }, { onConflict: 'room_id,user_id' });
    if (error) setNotice('Could not save your goal: ' + error.message);
    else { setGoal(cleanGoal); setNotice('Study goal saved.'); }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const body = chatInput.trim();
    if (!joinedRoom || !user?.id || !body || chatSending) return;
    setChatSending(true);
    const { error } = await supabase.from('study_room_messages').insert({
      room_id: joinedRoom.id, user_id: user.id, display_name: displayName,
      avatar_url: avatarUrl || '', body: body.slice(0, 1000)
    });
    setChatSending(false);
    if (error) setNotice('Could not send message: ' + error.message);
    else { setChatInput(''); await refreshRoom(joinedRoom.id); }
  }

  useEffect(() => {
    if (!joinedRoom || !user?.id) return;
    let active = true;
    void supabase.from('study_room_goals').select('goal').eq('room_id', joinedRoom.id).eq('user_id', user.id).maybeSingle()
      .then(({ data, error }) => {
        if (error) console.error('读取个人学习目标失败：', error.message);
        if (active && !error) { setGoal(data?.goal || ''); setGoalDraft(data?.goal || ''); }
      });
    return () => { active = false; };
  }, [joinedRoom?.id, user?.id]);

  const cardStyle: React.CSSProperties = { background: theme.card, border: '1px solid ' + theme.border, borderRadius: 14, padding: '1rem', minWidth: 0 };
  const buttonStyle: React.CSSProperties = { border: 0, borderRadius: 8, padding: '0.65rem 0.9rem', background: theme.accent, color: '#fff', cursor: 'pointer', fontWeight: 650 };
  const inputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '0.7rem', borderRadius: 8, border: '1px solid ' + theme.border, background: theme.bg, color: theme.text, minWidth: 0 };

  return <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', color: theme.text }}>
    <header style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
      <div><p style={{ color: theme.accent, fontSize: '.72rem', fontWeight: 800, letterSpacing: '.14em', margin: '0 0 .35rem' }}>NORTH SYNAPSE / STUDY LOUNGE</p><h1 style={{ margin: 0, fontSize: '2rem' }}>Study Rooms</h1><p style={{ color: theme.muted, margin: '.45rem 0 0' }}>Quiet accountability, personal focus timers, and text-only chat.</p></div>
      {!joinedRoom && <button type="button" style={buttonStyle} onClick={() => { if (!user?.id) onSignIn(); else setShowCreate(v => !v); }}><Plus size={16} style={{ verticalAlign: 'middle', marginRight: 6 }}/>{showCreate ? 'Cancel' : 'Create room'}</button>}
    </header>

    {notice && <div role="status" style={{ padding: '.75rem .9rem', borderRadius: 9, background: theme.card, border: '1px solid ' + theme.border, display: 'flex', justifyContent: 'space-between', gap: '.7rem' }}><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Dismiss" style={{ border: 0, background: 'transparent', color: theme.text }}><X size={16}/></button></div>}
    {kickNotice && <div role="dialog" aria-modal="true" aria-labelledby="study-room-kick-title" style={{ position: 'fixed', inset: 0, zIndex: 100001, background: 'rgba(0,0,0,.68)', display: 'grid', placeItems: 'center', padding: '1rem' }}><div style={{ ...cardStyle, width: 'min(100%, 420px)', borderColor: theme.danger }}><strong id="study-room-kick-title"><ShieldAlert size={17} style={{ verticalAlign: 'middle', marginRight: 7, color: theme.danger }}/>You were removed from the room</strong><p style={{ margin: '.55rem 0 0', color: theme.muted }}>{kickNotice}</p><button style={{ ...buttonStyle, marginTop: '1rem' }} onClick={() => void dismissKickNotice()}>Return to room directory</button></div></div>}

    {!joinedRoom ? <>
      <form onSubmit={joinByCode} style={{ ...cardStyle, display: 'flex', gap: '.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <label style={{ flex: '1 1 230px' }}><span style={{ display: 'block', fontSize: '.78rem', color: theme.muted, marginBottom: '.35rem' }}>JOIN WITH ROOM CODE</span><input value={roomCodeInput} onChange={e => setRoomCodeInput(e.target.value.toUpperCase().slice(0, 12))} placeholder="Enter private room code" style={inputStyle}/></label>
        <button style={buttonStyle} type="submit" disabled={loading}>{loading ? 'Joining…' : 'Join room'}</button>
      </form>

      {showCreate && <form onSubmit={createRoom} style={{ ...cardStyle, display: 'grid', gap: '.8rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Create a study room</h2>
        <label><span style={{ display: 'block', fontSize: '.8rem', color: theme.muted, marginBottom: '.35rem' }}>ROOM NAME</span><input required maxLength={100} value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Grade 11 Calculus Focus" style={inputStyle}/></label>
        <label><span style={{ display: 'block', fontSize: '.8rem', color: theme.muted, marginBottom: '.35rem' }}>SUBJECT</span><select value={newSubject} onChange={e => setNewSubject(e.target.value)} style={inputStyle}>{['General Study','Mathematics','Science','English & ESL','Computer Science & Tech','French','History & Social Sciences','Business & Economics'].map(x => <option key={x}>{x}</option>)}</select></label>
        <label><span style={{ display: 'block', fontSize: '.8rem', color: theme.muted, marginBottom: '.35rem' }}>DESCRIPTION / RULES</span><textarea maxLength={1000} rows={3} value={newDescription} onChange={e => setNewDescription(e.target.value)} placeholder="Purpose, rules, subject focus, or anything members should know." style={inputStyle}/></label>
        <label style={{ display: 'flex', gap: '.55rem', alignItems: 'center' }}><input type="checkbox" checked={newPrivate} onChange={e => setNewPrivate(e.target.checked)}/>Private room (requires a room code)</label>
        <button type="submit" disabled={loading || !newName.trim()} style={{ ...buttonStyle, opacity: loading ? .6 : 1 }}>{loading ? 'Creating…' : 'Create and enter room'}</button>
      </form>}

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '.7rem' }}>
        <label style={{ flex: '1 1 240px', position: 'relative' }}><Search size={16} style={{ position: 'absolute', top: 12, left: 12, color: theme.muted }}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search rooms by name" style={{ ...inputStyle, paddingLeft: 36 }}/></label>
        <label style={{ display: 'flex', gap: '.45rem', alignItems: 'center', color: theme.muted, fontSize: '.85rem' }}>Sort by <select value={sortBy} onChange={e => setSortBy(e.target.value as 'created' | 'active')} style={{ ...inputStyle, width: 'auto' }}><option value="created">Newest</option><option value="active">Online members</option></select></label>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
        {sortedRooms.map(room => <article key={room.id} style={{ ...cardStyle, borderColor: room.isSystemLobby ? theme.accent : theme.border }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '.6rem', alignItems: 'flex-start' }}><div><h2 style={{ margin: 0, fontSize: '1.1rem' }}>{room.name}</h2><p style={{ color: theme.muted, fontSize: '.8rem', margin: '.35rem 0' }}>{room.subject} · {room.activeUsers} online</p></div>{room.isPrivate ? <LockKeyhole size={17}/> : room.isSystemLobby ? <Users size={17}/> : null}</div>
          <p style={{ color: theme.muted, whiteSpace: 'pre-wrap', fontSize: '.87rem', minHeight: '2.7em' }}>{room.description || 'A quiet space to focus together.'}</p>
          <button type="button" style={buttonStyle} onClick={() => void joinRoom(room)} disabled={loading}>{loading ? 'Joining…' : room.isSystemLobby ? 'Enter public lobby' : 'Join room'}</button>
        </article>)}
        {sortedRooms.length === 0 && <p style={{ color: theme.muted }}>No rooms found. Create one to get started.</p>}
      </div>
    </> : <>
      <section style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0, flex: '1 1 280px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap' }}><h2 style={{ margin: 0 }}>{joinedRoom.name}</h2>{isOwner && <span style={{ background: theme.accent, color: '#fff', padding: '.18rem .5rem', borderRadius: 5, fontSize: '.72rem' }}><Crown size={12} style={{ verticalAlign: 'middle', marginRight: 4 }}/>OWNER</span>}{joinedRoom.isPrivate && <span style={{ color: theme.muted, fontSize: '.8rem' }}><LockKeyhole size={14} style={{ verticalAlign: 'middle', marginRight: 4 }}/>Private</span>}</div><p style={{ color: theme.muted, whiteSpace: 'pre-wrap', margin: '.45rem 0 0' }}>{joinedRoom.description}</p>{joinedRoom.isPrivate && <p style={{ margin: '.55rem 0 0', fontSize: '.82rem' }}>Room code: <strong style={{ letterSpacing: '.12em' }}>{privateRoomCode || (isOwner ? 'Loading…' : 'Private')}</strong></p>}</div>
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>{isOwner && !isSystemLobby && <button type="button" onClick={() => void endRoom()} style={{ ...buttonStyle, background: theme.danger }} disabled={loading}>End room</button>}<button type="button" onClick={() => void handleLeave()} style={{ ...buttonStyle, background: 'transparent', color: theme.text, border: '1px solid ' + theme.border }} disabled={loading}><LogOut size={15} style={{ verticalAlign: 'middle', marginRight: 5 }}/>Leave room</button></div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(190px, .85fr) minmax(260px, 1.2fr) minmax(260px, 1fr)', gap: '1rem', alignItems: 'stretch' }} className="ns-study-room-columns">
        <section style={{ ...cardStyle, maxHeight: '72vh', overflowY: 'auto' }}><h3 style={{ margin: '0 0 .35rem' }}>Members · {members.length} online</h3><p style={{ color: theme.muted, fontSize: '.78rem', margin: '0 0 1rem' }}>Owner first, then earliest join</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.9rem' }}>{members.map(person => <div key={person.user_id} style={{ display: 'flex', gap: '.55rem', alignItems: 'center' }}>
            {person.avatar_url ? <img src={person.avatar_url} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}/> : <div style={{ width: 36, height: 36, borderRadius: '50%', background: theme.bg, display: 'grid', placeItems: 'center', color: theme.accent, fontWeight: 800, flexShrink: 0 }}>{person.display_name.slice(0,1).toUpperCase()}</div>}
            <div style={{ minWidth: 0, flex: 1 }}><div style={{ fontWeight: 700, fontSize: '.86rem', overflowWrap: 'anywhere' }}>{person.display_name}{person.user_id === user?.id ? ' (You)' : ''}{person.user_id === joinedRoom.ownerId && <span style={{ color: theme.accent, fontSize: '.68rem' }}> · Owner</span>}</div><div style={{ color: theme.muted, fontSize: '.72rem' }}>Online {formatDuration(Math.max(0, Math.floor((Date.now() - new Date(person.joined_at).getTime()) / 1000)))}</div></div>
            {isOwner && person.user_id !== user?.id && <button type="button" title="Remove member" aria-label={`Remove ${person.display_name}`} onClick={() => void kickMember(person.user_id)} style={{ background: 'transparent', border: '1px solid ' + theme.border, borderRadius: 6, color: theme.danger, cursor: 'pointer', padding: '.25rem' }}><X size={14}/></button>}
          </div>)}</div>
        </section>

        <section style={{ ...cardStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '.85rem' }}><p style={{ color: theme.muted, fontSize: '.75rem', letterSpacing: '.12em', margin: 0 }}>PERSONAL FOCUS TIMER</p><div style={{ fontSize: 'clamp(2.5rem, 5vw, 3.8rem)', fontWeight: 850, fontVariantNumeric: 'tabular-nums', color: theme.accent }}>{formatDuration(remainingSeconds)}</div>
          <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', justifyContent: 'center' }}><label style={{ fontSize: '.8rem', color: theme.muted }}>Minutes <input type="number" min={1} max={240} value={durationMinutes} disabled={timerRunning} onChange={e => { const n = Math.max(1, Math.min(240, Number(e.target.value) || 1)); setDurationMinutes(n); setRemainingSeconds(n * 60); }} style={{ ...inputStyle, width: 90, display: 'inline-block', marginLeft: 5 }}/></label><button type="button" style={buttonStyle} onClick={() => setTimerRunning(v => !v)}>{timerRunning ? 'Pause' : 'Start'}</button><button type="button" style={{ ...buttonStyle, background: 'transparent', color: theme.text, border: '1px solid ' + theme.border }} onClick={() => { setTimerRunning(false); setRemainingSeconds(durationMinutes * 60); }}>Reset</button></div>
          <form onSubmit={saveGoal} style={{ width: '100%', textAlign: 'left', borderTop: '1px solid ' + theme.border, paddingTop: '1rem' }}><label style={{ display: 'block', fontWeight: 750, marginBottom: '.45rem' }}>My study goal</label><textarea rows={4} maxLength={500} value={goalDraft} onChange={e => setGoalDraft(e.target.value)} placeholder="What do you want to finish?" style={{ ...inputStyle, resize: 'vertical' }}/><button type="submit" style={{ ...buttonStyle, marginTop: '.55rem' }}>Save goal</button>{goal && <p style={{ color: theme.muted, fontSize: '.8rem', whiteSpace: 'pre-wrap' }}>Saved: {goal}</p>}</form>
          <p style={{ color: theme.muted, fontSize: '.75rem', margin: 0 }}>Personal timer and goal · no audio</p>
        </section>

        <section style={{ ...cardStyle, display: 'flex', flexDirection: 'column', minHeight: 440 }}><h3 style={{ margin: '0 0 .25rem' }}><MessageCircle size={16} style={{ verticalAlign: 'middle', marginRight: 5 }}/>Room chat</h3><p style={{ color: theme.muted, fontSize: '.78rem', margin: '0 0 1rem' }}>Text only · latest 150 messages</p>
          <div style={{ flex: 1, minHeight: 250, maxHeight: '54vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '.9rem' }}>{messages.map(message => <div key={message.id} style={{ display: 'flex', gap: '.55rem', alignItems: 'flex-start' }}>
            {message.avatar_url ? <img src={message.avatar_url} alt="" style={{ width: 29, height: 29, borderRadius: '50%', objectFit: 'cover' }}/> : <div style={{ width: 29, height: 29, borderRadius: '50%', display: 'grid', placeItems: 'center', background: theme.bg, color: theme.accent, fontWeight: 800, fontSize: '.75rem' }}>{message.display_name.slice(0,1).toUpperCase()}</div>}
            <div style={{ flex: 1, minWidth: 0 }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: '.5rem', alignItems: 'baseline' }}><strong style={{ fontSize: '.8rem' }}>{message.display_name}</strong><time style={{ color: theme.muted, fontSize: '.68rem', whiteSpace: 'nowrap' }}>{formatClock(message.created_at)}</time></div><p style={{ margin: '.25rem 0 0', fontSize: '.87rem', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{message.body}</p></div>
          </div>)}</div>
          <form onSubmit={sendMessage} style={{ display: 'flex', gap: '.45rem', marginTop: '1rem' }}><input value={chatInput} onChange={e => setChatInput(e.target.value)} maxLength={1000} placeholder="Write a message…" style={{ ...inputStyle, flex: 1 }}/><button type="submit" disabled={chatSending || !chatInput.trim()} style={{ ...buttonStyle, padding: '.65rem' }} aria-label="Send message"><Send size={16}/></button></form>
        </section>
      </div>
    </>}

    {showHandoff && joinedRoom && <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 100000, background: 'rgba(0,0,0,.7)', display: 'grid', placeItems: 'center', padding: '1rem' }}><div style={{ ...cardStyle, width: 'min(100%, 420px)' }}><h2 style={{ marginTop: 0 }}>Transfer room ownership</h2><p style={{ color: theme.muted }}>Choose the next owner. If you do not choose, the earliest remaining member becomes owner.</p><select value={handoffUserId} onChange={e => setHandoffUserId(e.target.value)} style={inputStyle}>{members.filter(p => p.user_id !== user?.id).map(p => <option key={p.user_id} value={p.user_id}>{p.display_name}</option>)}</select><div style={{ display: 'flex', justifyContent: 'flex-end', gap: '.6rem', marginTop: '1rem' }}><button type="button" style={{ ...buttonStyle, background: 'transparent', color: theme.text, border: '1px solid ' + theme.border }} onClick={() => setShowHandoff(false)}>Cancel</button><button type="button" style={buttonStyle} disabled={loading} onClick={() => void leaveRoom(handoffUserId || undefined)}>Transfer & leave</button><button type="button" style={{ ...buttonStyle, background: theme.muted }} disabled={loading} onClick={() => void leaveRoom()}>Default & leave</button></div></div></div>}

    <style>{`@media(max-width:900px){.ns-study-room-columns{grid-template-columns:minmax(0,1fr)!important}} `}</style>
  </div>;
}
