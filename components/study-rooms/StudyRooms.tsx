'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Crown, LockKeyhole, MessageCircle, Plus, Search, Send, Users, X, LogOut, ShieldAlert } from 'lucide-react';

type Room = {
  id: string; name: string; subject: string; grade: string; description: string;
  isPrivate: boolean; roomCode?: string; createdAt: string;
  lastActivityAt: string; createdBy: string; createdByName?: string; ownerId: string | null;
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
  isDarkMode: boolean; onSignIn: () => void; onToggleTheme: () => void; onShowTerms: () => void;
};


export default function StudyRooms({ user, username, nickname, avatarUrl, isDarkMode, onSignIn, onToggleTheme, onShowTerms }: Props) {
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
  const [newGrade, setNewGrade] = useState('All grades');
  const [gradeFilter, setGradeFilter] = useState('All grades');
  const [subjectFilter, setSubjectFilter] = useState('All subjects');
  const [kickTargetId, setKickTargetId] = useState('');
  const [kickReason, setKickReason] = useState('');
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminEntryNotice, setAdminEntryNotice] = useState('');
  const [roomNotification, setRoomNotification] = useState<{ id: string; event_type: string; actor_name: string; room_name: string } | null>(null);
  const [handoffUserId, setHandoffUserId] = useState('');
  const [showHandoff, setShowHandoff] = useState(false);
  const [privateRoomCode, setPrivateRoomCode] = useState('');
  const [showMembersPanel, setShowMembersPanel] = useState(false);
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [showOwnerNotice, setShowOwnerNotice] = useState(false);
  const previousOwnerId = useRef<string | null>(null);

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
      .select('id,name,subject,grade,description,is_private,room_code,created_at,last_activity_at,created_by,owner_id,is_system_lobby,status,empty_since')
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
    // 提取房间创建者 ID，并去重
    const creatorIds = Array.from(new Set(rows.map((room: any) => room.created_by).filter(Boolean)));
    const { data: creatorRows, error: creatorError } = creatorIds.length
      ? await supabase.from('public_author_profiles').select('id,username,nickname').in('id', creatorIds)
      : { data: [], error: null };
    if (creatorError) console.error('读取自习室创建者失败：', creatorError.message);
    const creatorNames = new Map<string, string>((creatorRows || []).map((profile: any) => [profile.id, profile.nickname || profile.username || 'Student']));
    const counts = new Map<string, number>();
    (activeRows || []).forEach((row: any) => counts.set(String(row.room_id), (counts.get(String(row.room_id)) || 0) + 1));
    setRooms(rows
      .filter((room: any) => isAdmin || !room.is_private || room.created_by === user?.id || room.owner_id === user?.id || room.is_system_lobby)
      .map((room: any) => ({
        id: String(room.id), name: room.name, subject: room.subject || 'General Study', grade: room.grade || 'All grades',
        description: room.description || '', isPrivate: !!room.is_private, roomCode: room.room_code || undefined,
        createdAt: room.created_at, lastActivityAt: room.last_activity_at || room.created_at,
        createdBy: room.created_by || '', createdByName: creatorNames.get(room.created_by) || '', ownerId: room.owner_id || null,
        isSystemLobby: !!room.is_system_lobby, status: room.status,
        activeUsers: counts.get(String(room.id)) || 0
      })));
  }, [user?.id, isAdmin]);

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
    const { data: roomRow, error: roomError } = await supabase.from('study_rooms')
      .select('id,name,subject,grade,description,is_private,created_at,last_activity_at,created_by,owner_id,is_system_lobby,status,room_code')
      .eq('id', roomId).maybeSingle();
    if (roomError || !roomRow || roomRow.status !== 'active') {
      setJoinedRoom(null); setMembers([]); setMessages([]); setTimerRunning(false);
      setKickNotice('This study room has ended. You have been returned to the room directory.');
      return;
    }
    if (!membership) {
      setJoinedRoom(null); setMembers([]); setMessages([]); setTimerRunning(false);
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
    if (previousOwnerId.current !== null && previousOwnerId.current !== user.id && roomRow.owner_id === user.id) {
      setShowOwnerNotice(true);
    }
    previousOwnerId.current = roomRow.owner_id || null;
    setJoinedRoom({
      id: String(roomRow.id), name: roomRow.name, subject: roomRow.subject || 'General Study', grade: roomRow.grade || 'All grades',
      description: roomRow.description || '', isPrivate: !!roomRow.is_private,
      roomCode: roomRow.is_private ? roomRow.room_code || undefined : undefined,
      createdAt: roomRow.created_at, lastActivityAt: roomRow.last_activity_at || roomRow.created_at,
      createdBy: roomRow.created_by || '', ownerId: roomRow.owner_id || null,
      isSystemLobby: !!roomRow.is_system_lobby, status: roomRow.status, activeUsers: people.length
    });
  }, [user?.id]);

  useEffect(() => { void loadRooms(); }, [loadRooms]);

  // 使用数据库端的管理员校验函数确认权限
  useEffect(() => {
    if (!user?.id) { setIsAdmin(false); return; }
    let active = true;
    void supabase.rpc('is_current_user_admin').then(({ data, error }) => {
      if (!active) return;
      if (error) {
        console.error('验证管理员权限失败：', error.message);
        setIsAdmin(false);
      } else {
        setIsAdmin(data === true);
      }
    });
    return () => { active = false; };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    let loadingNotification = false;
    const loadPendingNotifications = async () => {
      if (loadingNotification) return;
      loadingNotification = true;
      const { data, error } = await supabase.from('study_room_notifications')
        .select('id,room_id,event_type,actor_name,room_name')
        .eq('user_id', user.id).is('acknowledged_at', null)
        .order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (error) { console.error('读取自习室通知失败：', error.message); loadingNotification = false; return; }
      if (active && data) {
        if (data.event_type === 'admin_entered') {
          const { data: membership } = await supabase.from('study_room_active_members')
            .select('user_id').eq('room_id', data.room_id).eq('user_id', user.id).maybeSingle();
          if (!membership) {
            await supabase.from('study_room_notifications').update({ acknowledged_at: new Date().toISOString() })
              .eq('id', data.id).is('acknowledged_at', null);
            loadingNotification = false;
            return;
          }
        }
        const { data: acknowledged } = await supabase.from('study_room_notifications')
          .update({ acknowledged_at: new Date().toISOString() }).eq('id', data.id)
          .is('acknowledged_at', null).select('id').maybeSingle();
        if (active && acknowledged) {
          setRoomNotification(data);
          if (data.event_type === 'admin_entered') {
            setAdminEntryNotice(`${data.actor_name} (North Synapse administrator) has entered “${data.room_name}”. The administrator can view this room's chat for moderation and safety purposes.`);
          } else {
            setKickNotice(`${data.actor_name} ended “${data.room_name}”. You have been returned to the room directory.`);
          }
        }
      }
      loadingNotification = false;
    };
    const loadPendingKickNotice = async () => {
      const { data, error } = await supabase.from('study_room_kick_events')
        .select('id,room_id,created_at,reason').eq('user_id', user.id)
        .is('acknowledged_at', null).order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (error) { console.error('读取自习室踢出通知失败：', error.message); return; }
      if (active && data) setKickNotice((data.reason || '').trim()
        ? `The room host removed you from this study room. Reason: ${data.reason}`
        : 'The room host removed you from this study room. This was a host action, not a system error.');
    };
    void loadPendingNotifications();
    void loadPendingKickNotice();
    const timer = window.setInterval(() => { void loadPendingNotifications(); void loadPendingKickNotice(); }, 3000);
    const channel = supabase.channel(`study-room-user-notifications-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'study_room_notifications', filter: `user_id=eq.${user.id}` }, () => { void loadPendingNotifications(); })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'study_room_kick_events', filter: `user_id=eq.${user.id}` }, () => { void loadPendingKickNotice(); })
      .subscribe();
    return () => { active = false; window.clearInterval(timer); void supabase.removeChannel(channel); };
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
    const channel = supabase.channel(`study-room-${roomId}-announcements`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'study_room_active_members', filter: `room_id=eq.${roomId}` }, () => { if (active) void refreshRoom(roomId); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'study_room_messages', filter: `room_id=eq.${roomId}` }, () => { if (active) void refreshRoom(roomId); })
      .on('broadcast', { event: 'admin_entered' }, ({ payload }) => {
        if (active && payload?.adminName) setAdminEntryNotice(`${payload.adminName} (North Synapse administrator) has entered this study room. The administrator can view this room's chat for moderation and safety purposes.`);
      })
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
      if (value <= 1) { setTimerRunning(false); setNotice('Focus session complete. Take a moment to review your progress or begin another session.'); return 0; }
      return value - 1;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [timerRunning]);

  const sortedRooms = useMemo(() => {
    const visible = rooms.filter((room) => room.isSystemLobby || (`${room.name} ${room.description} ${room.subject} ${room.grade} ${room.createdByName} ${room.createdBy}`.toLowerCase().includes(search.trim().toLowerCase()) && (gradeFilter === 'All grades' || room.grade === gradeFilter) && (subjectFilter === 'All subjects' || room.subject === subjectFilter)));
    visible.sort((a, b) => {
      if (a.isSystemLobby) return -1;
      if (b.isSystemLobby) return 1;
      if (sortBy === 'active') return b.activeUsers - a.activeUsers || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return visible;
  }, [rooms, search, sortBy, gradeFilter, subjectFilter]);

  async function announceAdminEntry(roomId: string, _roomName: string) {
    if (!isAdmin) return;
    const { error } = await supabase.rpc('notify_admin_entered_study_room', {
      p_room_id: roomId, p_admin_name: displayName
    });
    if (error) console.error('保存管理员进入通知失败：', error.message);
  }

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
    if (isAdmin) void announceAdminEntry(room.id, room.name);
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
    if (isAdmin) {
      const { data: roomInfo } = await supabase.from('study_rooms').select('name').eq('id', String(id)).maybeSingle();
      void announceAdminEntry(String(id), roomInfo?.name || 'a study room');
    }
  }

  async function createRoom(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.id) { onSignIn(); return; }
    const cleanName = newName.trim();
    if (!cleanName || loading) return;
    setLoading(true); setNotice('');
    const roomCode = newPrivate ? crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase() : null;
    const { data, error } = await supabase.from('study_rooms').insert({
      name: cleanName, subject: newSubject, grade: newGrade, description: newDescription.trim(),
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
    if (joinError) { setNotice('The room was created, but joining failed: ' + joinError.message); await loadRooms(); return; }
    setShowCreate(false); setNewName(''); setNewDescription(''); setNewPrivate(false); setNewGrade('All grades'); setNewSubject('General Study');
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
    previousOwnerId.current = null;
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
    setKickTargetId(targetId); setKickReason('');
  }

  async function confirmKickMember(e: React.FormEvent) {
    e.preventDefault();
    if (!joinedRoom || !isOwner || !kickTargetId || loading) return;
    setLoading(true);
    const { error } = await supabase.rpc('kick_study_room_member_v2', { p_room_id: joinedRoom.id, p_target_user_id: kickTargetId, p_reason: kickReason.trim() || null });
    setLoading(false);
    if (error) setNotice('Could not remove member: ' + error.message);
    else { setKickTargetId(''); setKickReason(''); setNotice('Member removed from the room.'); await refreshRoom(joinedRoom.id); await loadRooms(); }
  }

  async function endRoom() {
    if (!joinedRoom || (!isOwner && !isAdmin) || isSystemLobby || loading) return;
    if (!window.confirm('End this study room for everyone? This cannot be undone.')) return;
    setLoading(true);
    const { error } = await supabase.rpc('end_study_room_v2', { p_room_id: joinedRoom.id });
    setLoading(false);
    if (error) { setNotice('Could not end room: ' + error.message); return; }
    setJoinedRoom(null); setMembers([]); setMessages([]); setTimerRunning(false);
    previousOwnerId.current = null;
    if (!isAdmin) setKickNotice('You ended this study room.');
    await loadRooms();
  }

  async function dismissKickNotice() {
    if (roomNotification?.id) {
      await supabase.from('study_room_notifications').update({ acknowledged_at: new Date().toISOString() }).eq('id', roomNotification.id);
      setRoomNotification(null); setAdminEntryNotice(''); setKickNotice('');
      return;
    }
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
    else { setGoal(cleanGoal); setNotice('Your study intention has been saved.'); }
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

  return <div className={joinedRoom ? 'ns-study-room-workspace' : undefined} style={joinedRoom ? { position: 'fixed', inset: 0, zIndex: 99999, width: '100vw', height: '100dvh', overflow: 'hidden', padding: 'clamp(.5rem, 1.2vw, 1rem)', boxSizing: 'border-box', background: theme.bg, display: 'flex', flexDirection: 'column', gap: '.65rem', color: theme.text } : { display: 'flex', flexDirection: 'column', gap: '1.25rem', color: theme.text }}>
    {!joinedRoom && <header style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
      <div><p style={{ color: theme.accent, fontSize: '.72rem', fontWeight: 800, letterSpacing: '.14em', margin: '0 0 .35rem' }}>NORTH SYNAPSE / STUDY LOUNGE</p><h1 style={{ margin: 0, fontSize: '2rem' }}>Study Rooms</h1></div>
      {!joinedRoom && <button type="button" style={buttonStyle} onClick={() => { if (!user?.id) onSignIn(); else { setNotice(''); setShowCreate(true); } }}><Plus size={16} style={{ verticalAlign: 'middle', marginRight: 6 }}/>Create room</button>}
    </header>}

    {notice && <div role="dialog" aria-modal="true" aria-labelledby="study-room-notice-title" style={{ position: 'fixed', inset: 0, zIndex: 100003, background: 'rgba(3,6,14,.68)', backdropFilter: 'blur(7px)', display: 'grid', placeItems: 'center', padding: '1rem' }}><div style={{ ...cardStyle, width: 'min(100%, 430px)', boxShadow: '0 24px 80px rgba(0,0,0,.38)' }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}><h2 id="study-room-notice-title" style={{ margin: 0, fontSize: '1.15rem' }}>Study room notice</h2><button type="button" onClick={() => setNotice('')} aria-label="Close notice" style={{ background: 'transparent', color: theme.text, border: '1px solid ' + theme.border, borderRadius: 8, padding: '.35rem', cursor: 'pointer' }}><X size={16}/></button></div><p style={{ color: theme.muted, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{notice}</p><button type="button" style={{ ...buttonStyle, width: '100%' }} onClick={() => setNotice('')}>Got it</button></div></div>}
    {showOwnerNotice && joinedRoom && <div role="dialog" aria-modal="true" aria-labelledby="study-room-owner-title" style={{ position: 'fixed', inset: 0, zIndex: 100005, background: 'rgba(3,6,14,.7)', backdropFilter: 'blur(7px)', display: 'grid', placeItems: 'center', padding: '1rem' }}><div style={{ ...cardStyle, width: 'min(100%, 420px)', boxShadow: '0 24px 80px rgba(0,0,0,.38)', borderColor: theme.accent }}><h2 id="study-room-owner-title" style={{ marginTop: 0 }}><Crown size={18} style={{ verticalAlign: 'middle', marginRight: 7, color: theme.accent }}/>You are now the room owner</h2><p style={{ color: theme.muted, lineHeight: 1.6 }}>You have received host permissions for <strong>{joinedRoom.name}</strong>. You can manage members and end the room.</p><button type="button" style={{ ...buttonStyle, width: '100%' }} onClick={() => setShowOwnerNotice(false)}>Got it</button></div></div>}

    {adminEntryNotice && <div role="dialog" aria-modal="true" aria-labelledby="study-room-admin-entry-title" style={{ position: 'fixed', inset: 0, zIndex: 100004, background: 'rgba(3,6,14,.72)', backdropFilter: 'blur(7px)', display: 'grid', placeItems: 'center', padding: '1rem' }}><div style={{ ...cardStyle, width: 'min(100%, 430px)', borderColor: theme.accent, boxShadow: '0 24px 80px rgba(0,0,0,.38)' }}><h2 id="study-room-admin-entry-title" style={{ marginTop: 0, fontSize: '1.15rem' }}><ShieldAlert size={18} style={{ verticalAlign: 'middle', marginRight: 7, color: theme.accent }}/>Administrator entered</h2><p style={{ color: theme.muted, lineHeight: 1.6 }}>{adminEntryNotice}</p><button type="button" style={{ ...buttonStyle, width: '100%' }} onClick={() => { setAdminEntryNotice(''); setRoomNotification(null); }}>Got it</button></div></div>}
    {kickNotice && <div role="dialog" aria-modal="true" aria-labelledby="study-room-kick-title" style={{ position: 'fixed', inset: 0, zIndex: 100001, background: 'rgba(0,0,0,.68)', display: 'grid', placeItems: 'center', padding: '1rem' }}><div style={{ ...cardStyle, width: 'min(100%, 420px)', borderColor: theme.danger }}><strong id="study-room-kick-title"><ShieldAlert size={17} style={{ verticalAlign: 'middle', marginRight: 7, color: theme.danger }}/>{kickNotice.toLowerCase().includes('removed') ? 'Removed by room host' : 'Study room ended'}</strong><p style={{ margin: '.55rem 0 0', color: theme.muted }}>{kickNotice}</p><button style={{ ...buttonStyle, marginTop: '1rem' }} onClick={() => void dismissKickNotice()}>Return to room directory</button></div></div>}

    {!joinedRoom ? <>
      <form onSubmit={joinByCode} style={{ ...cardStyle, display: 'flex', gap: '.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <label style={{ flex: '1 1 230px' }}><span style={{ display: 'block', fontSize: '.78rem', color: theme.muted, marginBottom: '.35rem' }}>JOIN WITH ROOM CODE</span><input value={roomCodeInput} onChange={e => setRoomCodeInput(e.target.value.toUpperCase().slice(0, 12))} placeholder="Enter private room code" style={inputStyle}/></label>
        <button style={buttonStyle} type="submit" disabled={loading}>{loading ? 'Joining…' : 'Join room'}</button>
      </form>


      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '.7rem' }}>
        <label style={{ flex: '1 1 240px', position: 'relative' }}><Search size={16} style={{ position: 'absolute', top: 12, left: 12, color: theme.muted }}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search rooms by name" style={{ ...inputStyle, paddingLeft: 36 }}/></label>
        <select aria-label="Filter by subject" value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)} style={{ ...inputStyle, width: 'auto' }}>{['All subjects','General Study','Mathematics','Science','English & ESL','Computer Science & Tech','French','History & Social Sciences','Business & Economics'].map(x => <option key={x}>{x}</option>)}</select><select aria-label="Filter by grade" value={gradeFilter} onChange={e => setGradeFilter(e.target.value)} style={{ ...inputStyle, width: 'auto' }}>{['All grades','Grade 9','Grade 10','Grade 11','Grade 12'].map(x => <option key={x}>{x}</option>)}</select>
        <label style={{ display: 'flex', gap: '.45rem', alignItems: 'center', color: theme.muted, fontSize: '.85rem' }}>Sort by <select value={sortBy} onChange={e => setSortBy(e.target.value as 'created' | 'active')} style={{ ...inputStyle, width: 'auto' }}><option value="created">Newest</option><option value="active">Online members</option></select></label>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
        {sortedRooms.map(room => <article key={room.id} style={{ ...cardStyle, borderColor: room.isSystemLobby ? theme.accent : theme.border }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '.6rem', alignItems: 'flex-start' }}><div><h2 style={{ margin: 0, fontSize: '1.1rem' }}>{room.name}</h2><p style={{ color: theme.muted, fontSize: '.8rem', margin: '.35rem 0' }}>{room.subject} · {room.grade} · {room.activeUsers} online</p></div>{room.isPrivate ? <LockKeyhole size={17}/> : room.isSystemLobby ? <Users size={17}/> : null}</div>
          <p style={{ color: theme.muted, whiteSpace: 'pre-wrap', fontSize: '.87rem', minHeight: '2.7em' }}>{room.description || 'A quiet space to focus together.'}</p>{!room.isSystemLobby && <p style={{ color: theme.muted, fontSize: '.75rem', margin: '0 0 .5rem' }}>Created by {room.createdByName || 'Student'}</p>}{!room.isSystemLobby && user?.id && room.createdBy === user.id && <span style={{ display: 'inline-flex', marginBottom: '.65rem', padding: '.2rem .5rem', borderRadius: 999, background: isDarkMode ? 'rgba(139,92,246,.18)' : 'rgba(139,92,246,.1)', color: theme.accent, fontSize: '.72rem', fontWeight: 750 }}>Created by you</span>}
          <button type="button" style={buttonStyle} onClick={() => void joinRoom(room)} disabled={loading}>{loading ? 'Joining…' : !user?.id ? 'Sign in to join' : room.isSystemLobby ? 'Enter public lobby' : 'Join room'}</button>
        </article>)}
        {sortedRooms.length === 0 && user?.id && <p style={{ color: theme.muted }}>No study rooms match these filters.</p>}
      </div>
    </> : <>
      <section style={{ ...cardStyle, padding: '.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0, flex: '1 1 260px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap' }}><h1 style={{ margin: 0, fontSize: 'clamp(1.25rem, 2.5vw, 1.8rem)', letterSpacing: '-.025em' }}>{joinedRoom.name}</h1>{isOwner && <span style={{ background: theme.accent, color: '#fff', padding: '.15rem .45rem', borderRadius: 5, fontSize: '.68rem' }}><Crown size={11} style={{ verticalAlign: 'middle', marginRight: 4 }}/>HOST</span>}{joinedRoom.isPrivate && <span style={{ color: theme.muted, fontSize: '.75rem' }}><LockKeyhole size={13} style={{ verticalAlign: 'middle', marginRight: 4 }}/>Private</span>}</div><div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap', marginTop: '.3rem' }}><span style={{ border: '1px solid ' + theme.border, color: theme.muted, borderRadius: 999, padding: '.12rem .5rem', fontSize: '.7rem' }}>{joinedRoom.subject}</span><span style={{ border: '1px solid ' + theme.border, color: theme.muted, borderRadius: 999, padding: '.12rem .5rem', fontSize: '.7rem' }}>{joinedRoom.grade}</span></div>{joinedRoom.description && <p style={{ color: theme.muted, whiteSpace: 'pre-wrap', margin: '.25rem 0 0', fontSize: '.88rem' }}>{joinedRoom.description}</p>}{isOwner && joinedRoom.isPrivate && joinedRoom.roomCode && <p style={{ margin: '.45rem 0 0', fontSize: '.82rem', color: theme.accent, fontWeight: 700, overflowWrap: 'anywhere' }}>Room code: <code style={{ fontSize: '.9rem', letterSpacing: '.08em' }}>{joinedRoom.roomCode}</code></p>}</div>
        <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button type="button" title="Toggle members panel" onClick={() => setShowMembersPanel(v => !v)} style={{ ...buttonStyle, padding: '.45rem .6rem', background: showMembersPanel ? theme.accent : 'transparent', color: showMembersPanel ? '#fff' : theme.text, border: '1px solid ' + theme.border }}><Users size={14} style={{ verticalAlign: 'middle', marginRight: 4 }}/>Members</button>
          <button type="button" title="Toggle chat panel" onClick={() => setShowChatPanel(v => !v)} style={{ ...buttonStyle, padding: '.45rem .6rem', background: showChatPanel ? theme.accent : 'transparent', color: showChatPanel ? '#fff' : theme.text, border: '1px solid ' + theme.border }}><MessageCircle size={14} style={{ verticalAlign: 'middle', marginRight: 4 }}/>Chat</button>
          <button type="button" onClick={onToggleTheme} style={{ ...buttonStyle, padding: '.45rem .6rem', background: 'transparent', color: theme.text, border: '1px solid ' + theme.border }}>{isDarkMode ? 'Light' : 'Dark'}</button>
          <button type="button" onClick={onShowTerms} style={{ ...buttonStyle, padding: '.45rem .6rem', background: 'transparent', color: theme.text, border: '1px solid ' + theme.border }}>User notice</button>
          {(isOwner || isAdmin) && !isSystemLobby && <button type="button" onClick={() => void endRoom()} style={{ ...buttonStyle, padding: '.45rem .6rem', background: theme.danger }} disabled={loading}>End</button>}
          <button type="button" onClick={() => void handleLeave()} style={{ ...buttonStyle, padding: '.45rem .6rem', background: 'transparent', color: theme.text, border: '1px solid ' + theme.border }} disabled={loading}><LogOut size={14} style={{ verticalAlign: 'middle', marginRight: 4 }}/>Leave</button>
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: showMembersPanel && showChatPanel ? 'minmax(190px,.8fr) minmax(300px,1.2fr) minmax(280px,1fr)' : showMembersPanel || showChatPanel ? 'minmax(190px,.8fr) minmax(300px,1.2fr)' : 'minmax(0,1fr)', gap: '.75rem', alignItems: 'stretch', flex: 1, minHeight: 0 }} className="ns-study-room-columns">
        {showMembersPanel && <section className="ns-study-room-sidepanel ns-study-room-members" style={{ ...cardStyle, height: '100%', minHeight: 0, overflowY: 'auto' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '.75rem' }}><h3 style={{ margin: '0 0 .35rem' }}>Members · {members.length} online</h3><button type="button" aria-label="Close members panel" onClick={() => setShowMembersPanel(false)} style={{ border: '1px solid ' + theme.border, borderRadius: 8, padding: '.4rem', color: theme.text, background: 'transparent', cursor: 'pointer' }}><X size={17}/></button></div><p style={{ color: theme.muted, fontSize: '.78rem', margin: '0 0 1rem' }}>Owner first, then earliest join</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.9rem' }}>{members.map(person => <div key={person.user_id} style={{ display: 'flex', flexDirection: 'column', gap: '.25rem' }}><div style={{ display: 'flex', gap: '.55rem', alignItems: 'center' }}>
            {person.avatar_url ? <img src={person.avatar_url} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}/> : <div style={{ width: 36, height: 36, borderRadius: '50%', background: theme.bg, display: 'grid', placeItems: 'center', color: theme.accent, fontWeight: 800, flexShrink: 0 }}>{person.display_name.slice(0,1).toUpperCase()}</div>}
            <div style={{ minWidth: 0, flex: 1 }}><div style={{ fontWeight: 700, fontSize: '.86rem', overflowWrap: 'anywhere' }}>{person.display_name}{person.user_id === user?.id ? ' (You)' : ''}{person.user_id === joinedRoom.ownerId && <span style={{ color: theme.accent, fontSize: '.68rem' }}> · Owner</span>}</div><div style={{ color: theme.muted, fontSize: '.72rem' }}>Online {formatDuration(Math.max(0, Math.floor((Date.now() - new Date(person.joined_at).getTime()) / 1000)))}</div></div>
            {isOwner && person.user_id !== user?.id && <button type="button" title="Remove member" aria-label={`Remove ${person.display_name}`} onClick={() => void kickMember(person.user_id)} style={{ background: 'transparent', border: '1px solid ' + theme.border, borderRadius: 6, color: theme.danger, cursor: 'pointer', padding: '.25rem' }}><X size={14}/></button>}
          </div>
          {kickTargetId === person.user_id && <form onSubmit={confirmKickMember} style={{ marginTop: '.55rem', padding: '.75rem', border: '1px solid ' + theme.danger, borderRadius: 10, background: theme.bg }}><strong style={{ display: 'block', fontSize: '.88rem' }}>Remove {person.display_name}?</strong><p style={{ color: theme.muted, fontSize: '.78rem', margin: '.35rem 0 .6rem' }}>Optionally provide a reason. The member will see it in a notice.</p><textarea rows={2} maxLength={300} value={kickReason} onChange={e => setKickReason(e.target.value)} placeholder="Reason for removal (optional)" style={{ ...inputStyle, resize: 'vertical', fontSize: 16 }}/><div style={{ display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: '.5rem', marginTop: '.65rem' }}><button type="button" style={{ ...buttonStyle, background: 'transparent', color: theme.text, border: '1px solid ' + theme.border }} onClick={() => { setKickTargetId(''); setKickReason(''); }} disabled={loading}>Cancel</button><button type="submit" style={{ ...buttonStyle, background: theme.danger }} disabled={loading}>{loading ? 'Removing…' : 'Confirm remove'}</button></div></form>}
          </div>)}</div>
        </section>}

        <section className="ns-study-room-focus" style={{ ...cardStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '.85rem', minHeight: 0, overflowY: 'auto' }}><p style={{ color: theme.muted, fontSize: '.75rem', letterSpacing: '.12em', margin: 0 }}>PERSONAL FOCUS TIMER</p><div style={{ fontSize: 'clamp(2.5rem, 5vw, 3.8rem)', fontWeight: 850, fontVariantNumeric: 'tabular-nums', color: theme.accent }}>{formatDuration(remainingSeconds)}</div>
          <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', justifyContent: 'center' }}><label style={{ fontSize: '.8rem', color: theme.muted }}>Minutes <input type="number" min={1} max={240} value={durationMinutes} disabled={timerRunning} onChange={e => { const n = Math.max(1, Math.min(240, Number(e.target.value) || 1)); setDurationMinutes(n); setRemainingSeconds(n * 60); }} style={{ ...inputStyle, width: 90, display: 'inline-block', marginLeft: 5 }}/></label><button type="button" style={buttonStyle} onClick={() => setTimerRunning(v => !v)}>{timerRunning ? 'Pause' : 'Start'}</button><button type="button" style={{ ...buttonStyle, background: 'transparent', color: theme.text, border: '1px solid ' + theme.border }} onClick={() => { setTimerRunning(false); setRemainingSeconds(durationMinutes * 60); }}>Reset</button></div>
          <form onSubmit={saveGoal} style={{ width: '100%', textAlign: 'left', borderTop: '1px solid ' + theme.border, paddingTop: '1rem' }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: '.5rem', alignItems: 'baseline', marginBottom: '.45rem' }}><label htmlFor="study-intention" style={{ display: 'block', fontWeight: 750 }}>Session intention</label><span style={{ color: theme.muted, fontSize: '.7rem' }}>PERSONAL</span></div><p style={{ color: theme.muted, fontSize: '.78rem', lineHeight: 1.5, margin: '0 0 .6rem' }}>Define one clear outcome for this session. Keep it specific and achievable.</p><textarea id="study-intention" rows={3} maxLength={500} value={goalDraft} onChange={e => setGoalDraft(e.target.value)} placeholder="e.g. Finish 10 practice questions and review mistakes." style={{ ...inputStyle, resize: 'vertical' }}/><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '.5rem', marginTop: '.45rem' }}><span style={{ color: theme.muted, fontSize: '.7rem' }}>{goalDraft.length}/500</span><button type="submit" style={{ ...buttonStyle, padding: '.5rem .75rem' }}>Save intention</button></div>{goal && <div style={{ marginTop: '.75rem', padding: '.7rem', border: '1px solid ' + theme.border, borderRadius: 9, background: theme.bg }}><span style={{ display: 'block', color: theme.accent, fontSize: '.68rem', fontWeight: 800, letterSpacing: '.08em', marginBottom: '.3rem' }}>CURRENT INTENTION</span><p style={{ margin: 0, fontSize: '.84rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{goal}</p></div>}</form>
          <p style={{ color: theme.muted, fontSize: '.7rem', margin: 0 }}>This intention is private to your account.</p>
        </section>

        {showChatPanel && <section className="ns-study-room-sidepanel ns-study-room-chat" style={{ ...cardStyle, display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%', overflow: 'hidden' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '.75rem' }}><h3 style={{ margin: '0 0 .25rem' }}><MessageCircle size={16} style={{ verticalAlign: 'middle', marginRight: 5 }}/>Room chat</h3><button type="button" aria-label="Close chat panel" onClick={() => setShowChatPanel(false)} style={{ border: '1px solid ' + theme.border, borderRadius: 8, padding: '.4rem', color: theme.text, background: 'transparent', cursor: 'pointer', flexShrink: 0 }}><X size={17}/></button></div><p style={{ color: theme.muted, fontSize: '.78rem', margin: '0 0 1rem' }}>Text only · latest 150 messages</p>
          <div className="ns-study-room-messages" style={{ flex: 1, minHeight: 0, maxHeight: '54vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '.9rem' }}>{messages.map(message => <div key={message.id} style={{ display: 'flex', gap: '.55rem', alignItems: 'flex-start' }}>
            {message.avatar_url ? <img src={message.avatar_url} alt="" style={{ width: 29, height: 29, borderRadius: '50%', objectFit: 'cover' }}/> : <div style={{ width: 29, height: 29, borderRadius: '50%', display: 'grid', placeItems: 'center', background: theme.bg, color: theme.accent, fontWeight: 800, fontSize: '.75rem' }}>{message.display_name.slice(0,1).toUpperCase()}</div>}
            <div style={{ flex: 1, minWidth: 0 }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: '.5rem', alignItems: 'baseline' }}><strong style={{ fontSize: '.8rem' }}>{message.display_name}</strong><time style={{ color: theme.muted, fontSize: '.68rem', whiteSpace: 'nowrap' }}>{formatClock(message.created_at)}</time></div><p style={{ margin: '.25rem 0 0', fontSize: '.87rem', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{message.body}</p></div>
          </div>)}</div>
          <form onSubmit={sendMessage} className="ns-study-room-chat-form" style={{ display: 'flex', gap: '.45rem', marginTop: '1rem', flexShrink: 0 }}><input value={chatInput} onChange={e => setChatInput(e.target.value)} maxLength={1000} placeholder="Write a message…" style={{ ...inputStyle, flex: 1 }}/><button type="submit" disabled={chatSending || !chatInput.trim()} style={{ ...buttonStyle, padding: '.65rem' }} aria-label="Send message"><Send size={16}/></button></form>
        </section>}
      </div>
    </>}


    {showCreate && !joinedRoom && <div role="dialog" aria-modal="true" aria-labelledby="create-study-room-title" onMouseDown={e => { if (e.target === e.currentTarget && !loading) setShowCreate(false); }} style={{ position: 'fixed', inset: 0, zIndex: 100002, background: 'rgba(3, 6, 14, .76)', backdropFilter: 'blur(8px)', display: 'grid', placeItems: 'center', padding: '1rem' }}>
      <form onSubmit={createRoom} style={{ ...cardStyle, width: 'min(100%, 520px)', maxHeight: 'min(88vh, 760px)', overflowY: 'auto', display: 'grid', gap: '.9rem', boxShadow: '0 24px 80px rgba(0,0,0,.38)', borderColor: theme.accent }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
          <div><p style={{ margin: '0 0 .35rem', color: theme.accent, fontSize: '.7rem', fontWeight: 800, letterSpacing: '.14em' }}>NORTH SYNAPSE / STUDY LOUNGE</p><h2 id="create-study-room-title" style={{ margin: 0, fontSize: '1.35rem' }}>Create a study room</h2><p style={{ margin: '.4rem 0 0', color: theme.muted, fontSize: '.88rem' }}>Make a focused space to learn together.</p></div>
          <button type="button" aria-label="Close create room dialog" onClick={() => setShowCreate(false)} disabled={loading} style={{ border: '1px solid ' + theme.border, borderRadius: 8, padding: '.4rem', color: theme.text, background: 'transparent', cursor: 'pointer', flexShrink: 0 }}><X size={17}/></button>
        </div>
        <label><span style={{ display: 'block', fontSize: '.8rem', color: theme.muted, marginBottom: '.35rem' }}>ROOM NAME</span><input required maxLength={100} value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Grade 11 Calculus Focus" style={inputStyle}/></label>
        <label><span style={{ display: 'block', fontSize: '.8rem', color: theme.muted, marginBottom: '.35rem' }}>SUBJECT</span><select value={newSubject} onChange={e => setNewSubject(e.target.value)} style={inputStyle}>{['General Study','Mathematics','Science','English & ESL','Computer Science & Tech','French','History & Social Sciences','Business & Economics'].map(x => <option key={x}>{x}</option>)}</select></label>
        <label><span style={{ display: 'block', fontSize: '.8rem', color: theme.muted, marginBottom: '.35rem' }}>GRADE LEVEL</span><select value={newGrade} onChange={e => setNewGrade(e.target.value)} style={inputStyle}>{['All grades','Grade 9','Grade 10','Grade 11','Grade 12'].map(x => <option key={x}>{x}</option>)}</select></label>
        <label><span style={{ display: 'block', fontSize: '.8rem', color: theme.muted, marginBottom: '.35rem' }}>DESCRIPTION / RULES</span><textarea maxLength={1000} rows={3} value={newDescription} onChange={e => setNewDescription(e.target.value)} placeholder="Purpose, rules, or subject focus for members." style={{ ...inputStyle, resize: 'vertical' }}/></label>
        <label style={{ display: 'flex', gap: '.6rem', alignItems: 'center', padding: '.75rem', border: '1px solid ' + theme.border, borderRadius: 9, cursor: 'pointer' }}><input type="checkbox" checked={newPrivate} onChange={e => setNewPrivate(e.target.checked)}/><span><strong style={{ display: 'block', fontSize: '.9rem' }}>Private room</strong><span style={{ color: theme.muted, fontSize: '.78rem' }}>Only students with the room code can join.</span></span></label>
        {newPrivate && <p style={{ color: theme.muted, fontSize: '.8rem', margin: 0 }}>A room code will be generated automatically after creation.</p>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '.6rem', marginTop: '.2rem' }}><button type="button" onClick={() => setShowCreate(false)} disabled={loading} style={{ ...buttonStyle, background: 'transparent', color: theme.text, border: '1px solid ' + theme.border }}>Cancel</button><button type="submit" disabled={loading || !newName.trim()} style={{ ...buttonStyle, opacity: loading ? .6 : 1 }}>{loading ? 'Creating…' : 'Create and enter room'}</button></div>
      </form>
    </div>}

    {showHandoff && joinedRoom && <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 100000, background: 'rgba(0,0,0,.7)', display: 'grid', placeItems: 'center', padding: '1rem' }}><div style={{ ...cardStyle, width: 'min(100%, 420px)' }}><h2 style={{ marginTop: 0 }}>Transfer room ownership</h2><p style={{ color: theme.muted }}>Choose the next owner. If you do not choose, the earliest remaining member becomes owner.</p><select value={handoffUserId} onChange={e => setHandoffUserId(e.target.value)} style={inputStyle}>{members.filter(p => p.user_id !== user?.id).map(p => <option key={p.user_id} value={p.user_id}>{p.display_name}</option>)}</select><div style={{ display: 'flex', justifyContent: 'flex-end', gap: '.6rem', marginTop: '1rem' }}><button type="button" style={{ ...buttonStyle, background: 'transparent', color: theme.text, border: '1px solid ' + theme.border }} onClick={() => setShowHandoff(false)}>Cancel</button><button type="button" style={buttonStyle} disabled={loading} onClick={() => void leaveRoom(handoffUserId || undefined)}>Transfer & leave</button><button type="button" style={{ ...buttonStyle, background: theme.muted }} disabled={loading} onClick={() => void leaveRoom()}>Default & leave</button></div></div></div>}

    <style>{`@media(max-width:900px){
      .ns-study-room-workspace{overflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior:contain}
      .ns-study-room-columns{grid-template-columns:minmax(0,1fr)!important;flex:0 0 auto!important;min-height:auto!important;overflow:visible!important}
      .ns-study-room-focus{min-height:auto!important;overflow:visible!important;gap:.55rem!important;padding:.75rem!important}
      .ns-study-room-focus>div:nth-of-type(1){font-size:clamp(2.2rem,12vw,3.1rem)!important}
      .ns-study-room-sidepanel{position:fixed!important;z-index:100006!important;left:.65rem!important;right:.65rem!important;top:max(5.5rem,env(safe-area-inset-top))!important;bottom:max(.65rem,env(safe-area-inset-bottom))!important;height:auto!important;max-height:none!important;box-shadow:0 0 0 100vmax rgba(0,0,0,.48),0 18px 60px rgba(0,0,0,.32)!important;border-radius:16px!important}
      .ns-study-room-chat{overflow:hidden!important}
      .ns-study-room-messages{min-height:0!important;max-height:none!important;overscroll-behavior:contain}
      .ns-study-room-chat-form{padding-bottom:env(safe-area-inset-bottom);background:inherit}
      .ns-study-room-chat-form input{font-size:16px!important;min-width:0}
      .ns-study-room-chat-form button{flex-shrink:0;min-width:44px;min-height:44px}
      .ns-study-room-columns>section{scroll-margin-bottom:1rem}
    }
    @media(max-width:900px) and (max-height:740px){
      .ns-study-room-focus{gap:.35rem!important}
      .ns-study-room-focus p{margin-top:.1rem!important;margin-bottom:.1rem!important}
      .ns-study-room-focus textarea{min-height:56px!important}
      .ns-study-room-focus>div:nth-of-type(1){font-size:2.15rem!important}
    }`}</style>
  </div>;
}
