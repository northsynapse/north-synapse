'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';

type NavTab = 'resources' | 'lounges' | 'announcements' | 'discussions' | 'feedback' | 'dashboard' | 'admin';

interface CommentItem {
  id: string;
  authorEmail?: string;
  authorName: string;
  authorAvatar: string;
  text: string;
  date: string;
  likes: number;
  likedByMe?: boolean;
}

interface ResourceAttachment {
  name: string;
  type: string;
  url: string;
  file?: File;
}

interface ResourceItem {
  id: string;
  title: string;
  subject: string;
  grade: string;
  description: string;
  content: string;
  authorName: string;
  authorEmail?: string;
  authorId?: string;
  authorAvatar: string;
  tags?: string[];
  date: string;
  createdAt?: string;
  likes: number;
  bookmarks: number;
  likedByMe?: boolean;
  bookmarkedByMe?: boolean;
  comments: CommentItem[];
  attachments?: ResourceAttachment[];
}

interface DiscussionItem {
  id: string;
  title: string;
  content: string;
  authorEmail: string;
  authorId?: string;
  authorName: string;
  authorAvatar?: string;
  date: string;
  createdAt?: string;
  repliesCount: number;
  replies: CommentItem[];
  bookmarkedByMe?: boolean;
  bookmarks?: number;
}

interface LoungeRoom {
  id: string;
  name: string;
  subject: string;
  activeUsers: number;
  description: string;
  isPrivate: boolean;
  roomCode?: string;
  createdAt: string;
  lastActivityAt: string;
  createdBy: string;
}

interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  date: string;
  authorName: string;
}

export default function Home() {
  /* ==========================================================================
     1. 全局状态 (GLOBAL STATES)
     ========================================================================== */
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState<NavTab>('resources');

  // 用户与弹窗状态
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminMetrics, setAdminMetrics] = useState<any>(null);
  const [adminFeedback, setAdminFeedback] = useState<any[]>([]);
  const [adminRatings, setAdminRatings] = useState<any[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [siteRating, setSiteRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showCreateResourceModal, setShowCreateResourceModal] = useState(false);
  const [showCreateDiscussionModal, setShowCreateDiscussionModal] = useState(false);

  // 认证表单
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isStudentConfirmed, setIsStudentConfirmed] = useState(false);
  const [hasAgreedTerms, setHasAgreedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [publicProfile, setPublicProfile] = useState<any>(null);
  const [resourceAttachments, setResourceAttachments] = useState<ResourceAttachment[]>([]);
  const [driveResourceUrl, setDriveResourceUrl] = useState('');
  const [richContentHtml, setRichContentHtml] = useState('');
  const richEditorRef = useRef<HTMLDivElement | null>(null);
  const resourceFilesRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);

  // 个人资料
  const [avatarUrl, setAvatarUrl] = useState('');
  const [username, setUsername] = useState('');
  const [nickname, setNickname] = useState('');
  const [grade, setGrade] = useState('');
  const [gender, setGender] = useState('Prefer not to say');
  const [bio, setBio] = useState('');
  // 累计登录期间网站处于前台的使用时间（秒）
  const [usageSeconds, setUsageSeconds] = useState(0);

  // 筛选与搜索
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // 新建资源/讨论表单
  const [newResTitle, setNewResTitle] = useState('');
  const [newResSubject, setNewResSubject] = useState('Mathematics');
  const [newResGrade, setNewResGrade] = useState('Grade 12');
  const [newResDescription, setNewResDescription] = useState('');
  const [newResContent, setNewResContent] = useState('');
  const [selectedResourceTags, setSelectedResourceTags] = useState<string[]>([]);
  const resourceTagOptions = ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'AP Courses', 'Academic Competitions', 'Mathematics', 'Science', 'English & ESL', 'French', 'History & Social Sciences', 'Geography', 'Business & Economics', 'Art & Music', 'Computer Science & Tech'];

  const [newDiscTitle, setNewDiscTitle] = useState('');
  const [newDiscContent, setNewDiscContent] = useState('');

  // 自习室与番茄钟
  const [joinedRoom, setJoinedRoom] = useState<LoungeRoom | null>(null);
  const [lounges, setLounges] = useState<LoungeRoom[]>([]);
  const [roomSearchQuery, setRoomSearchQuery] = useState('');
  const [roomSortBy, setRoomSortBy] = useState<'created' | 'active'>('created');
  const [showCreateRoomForm, setShowCreateRoomForm] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomSubject, setNewRoomSubject] = useState('General Study');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [newRoomIsPrivate, setNewRoomIsPrivate] = useState(false);
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [roomListLoading, setRoomListLoading] = useState(false);
  const [roomActionLoading, setRoomActionLoading] = useState(false);
  const [pomodoroTime, setPomodoroTime] = useState(1500); // 25 分钟
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [roomPresence, setRoomPresence] = useState<any[]>([]);
  const [roomMessages, setRoomMessages] = useState<any[]>([]);
  const [roomChatInput, setRoomChatInput] = useState('');
  const [roomStudySeconds, setRoomStudySeconds] = useState(0);
  const [roomSending, setRoomSending] = useState(false);
  const [roomRosterHidden, setRoomRosterHidden] = useState(false);
  const [roomGoal, setRoomGoal] = useState('');
  const [roomGoalDraft, setRoomGoalDraft] = useState('');
  const [roomGoalSaving, setRoomGoalSaving] = useState(false);

  // 反馈与引用格式
  const [feedbackCategory, setFeedbackCategory] = useState('General Suggestion');
  const [feedbackComment, setFeedbackComment] = useState('');
  const [citationFormat, setCitationFormat] = useState<'APA' | 'IEEE' | 'MLA' | 'BibTeX'>('APA');

  // 本地持久化数据读取
  // 社区笔记和讨论仅从 Supabase 加载，不使用浏览器缓存或硬编码示例作为数据源。
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [discussions, setDiscussions] = useState<DiscussionItem[]>([]);



  // 官方公告以 Supabase 数据库为唯一来源，避免公告只存在于前端代码。
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);

  useEffect(() => {
    let active = true;
    const loadAnnouncements = async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('id,title,content,author_name,created_at')
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      if (!active) return;
      if (error) {
        console.error('Unable to load announcements from database:', error.message);
        setAnnouncements([]);
        return;
      }
      setAnnouncements((data || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        content: item.content,
        authorName: item.author_name || 'North Synapse Official',
        date: new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      })));
    };
    void loadAnnouncements();
    return () => { active = false; };
  }, []);

  const [previewResource, setPreviewResource] = useState<ResourceItem | null>(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [selectedDiscussion, setSelectedDiscussion] = useState<DiscussionItem | null>(null);
  const [newReplyText, setNewReplyText] = useState('');
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  // Dashboard 默认仅展示前 4 项，避免个人内容过多时页面过长。
  const [expandedDashboardSections, setExpandedDashboardSections] = useState<Record<string, boolean>>({});
  const DASHBOARD_PREVIEW_LIMIT = 4;

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 管理员身份由 Supabase 受保护的角色表确认。

  // 用户名和昵称的长度限制
  const USERNAME_MIN = 3;
  const USERNAME_MAX = 30;
  const NICKNAME_MIN = 2;
  const NICKNAME_MAX = 24;

  // 去除首尾空白，保留名称内部的空格和符号
  function normalizeName(value: string): string {
    return value.trim();
  }

  // 按 Unicode 字符计算长度，避免将部分 emoji 错算成两个字符
  function getCharacterLength(value: string): number {
    return Array.from(value).length;
  }

  // 兼容较旧 TypeScript 编译目标：拒绝控制字符，但允许国际文字、数字、空格和常见符号
  function hasInvalidCharacters(value: string): boolean {
    return /[\u0000-\u001F\u007F-\u009F]/.test(value);
  }

  function validateUsername(value: string): string | null {
    const clean = normalizeName(value);
    const length = getCharacterLength(clean);

    if (!clean) return 'Username cannot be empty.';
    if (length < USERNAME_MIN || length > USERNAME_MAX) {
      return `Username must be ${USERNAME_MIN}–${USERNAME_MAX} characters long.`;
    }
    if (hasInvalidCharacters(clean)) {
      return 'Username contains unsupported control characters.';
    }
    return null;
  }

  function validateNickname(value: string): string | null {
    const clean = normalizeName(value);
    const length = getCharacterLength(clean);

    if (!clean) return 'Nickname cannot be empty.';
    if (length < NICKNAME_MIN || length > NICKNAME_MAX) {
      return `Nickname must be ${NICKNAME_MIN}–${NICKNAME_MAX} characters long.`;
    }
    if (hasInvalidCharacters(clean)) {
      return 'Nickname contains unsupported control characters.';
    }
    return null;
  }

  /* ==========================================================================
     2. 副作用与数据同步
     ========================================================================== */
  useEffect(() => {
    // 旧版 ns_accounts 曾将密码明文保存在浏览器中；停止使用并清除这份旧缓存。
    if (typeof window !== 'undefined') localStorage.removeItem('ns_accounts');

    // 统一使用 Supabase Auth 恢复登录状态，不再从本地账号缓存恢复身份。
    let active = true;
    const applyAuthUser = (authUser: any) => {
      if (!active) return;
      if (!authUser) {
        setUser(null);
        return;
      }

      const metadata = authUser.user_metadata || {};
      const email = authUser.email || '';
      const defaultName = email.split('@')[0] || 'Student';
      const profile = {
        id: authUser.id,
        email,
        username: metadata.username || defaultName,
        nickname: metadata.nickname || metadata.username || defaultName,
        grade: metadata.grade || '',
        gender: metadata.gender || 'Prefer not to say',
        bio: metadata.bio || '',
        avatarUrl: metadata.avatarUrl || '',
        totalStudySeconds: Number(metadata.totalStudySeconds) || 0
      };

      setUser(profile);
      setUsername(profile.username);
      setNickname(profile.nickname);
      setGrade(profile.grade);
      setGender(profile.gender);
      setAvatarUrl(profile.avatarUrl);
      setBio(profile.bio);
      setUsageSeconds(profile.totalStudySeconds);
    };

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) console.error('Unable to restore Supabase session:', error.message);
      applyAuthUser(data.session?.user ?? null);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      applyAuthUser(session?.user ?? null);
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let active = true;
    setIsAdmin(false);
    if (!user?.id) return () => { active = false; };
    supabase.rpc('is_current_user_admin').then(({ data, error }) => {
      if (!active) return;
      if (error) { console.error('Unable to verify administrator role:', error.message); setIsAdmin(false); }
      else {
        const admin = data === true;
        setIsAdmin(admin);
        // 管理员登录后直接进入管理主页，不再落到学生资源主页。
        if (admin) setActiveTab('admin');
      }
    });
    return () => { active = false; };
  }, [user?.id]);

  // 登录后从 profiles 表恢复个人资料；不再把 Auth metadata 当作个人资料主数据源。
  useEffect(() => {
    const userId = user?.id;
    if (!userId) return;
    let active = true;
    const loadProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('email,username,nickname,grade,gender,bio,avatar_path,total_study_seconds')
        .eq('id', userId)
        .maybeSingle();
      if (!active) return;
      if (error) {
        console.error('Unable to load profile from database:', error.message);
        return;
      }
      if (!data) return;
      const savedUsername = data.username || user?.email?.split('@')[0] || 'Student';
      const savedNickname = data.nickname || savedUsername;
      setUsername(savedUsername);
      setNickname(savedNickname);
      setGrade(data.grade || '');
      setGender(data.gender || 'Prefer not to say');
      setBio(data.bio || '');
      setAvatarUrl(data.avatar_path || '');
      setUsageSeconds(Math.max(0, Number(data.total_study_seconds) || 0));
      setUser((previous: any) => previous?.id === userId ? {
        ...previous,
        email: data.email || previous.email,
        username: savedUsername,
        nickname: savedNickname,
        grade: data.grade || '',
        gender: data.gender || 'Prefer not to say',
        bio: data.bio || '',
        avatarUrl: data.avatar_path || '',
        totalStudySeconds: Math.max(0, Number(data.total_study_seconds) || 0)
      } : previous);
    };
    void loadProfile();
    return () => { active = false; };
  }, [user?.id]);

  // 无论是否登录都从数据库加载全部社区内容；登录状态只影响个人互动状态。
  useEffect(() => {
    const userId = user?.id || null;
    let active = true;

    const loadCommunityData = async () => {
      const [resourcesResult, discussionsResult, profilesResult] = await Promise.all([
        supabase.from('resources').select('*').order('created_at', { ascending: false }),
        supabase.from('discussions').select('*').order('created_at', { ascending: false }),
        user?.id ? supabase.from('profiles').select('id,email,username,nickname,avatar_path') : supabase.from('public_author_profiles').select('id,username,nickname,avatar_path')
      ]);
      if (!active) return;
      if (resourcesResult.error || discussionsResult.error || profilesResult.error) {
        console.error('Unable to load community data:', resourcesResult.error?.message || discussionsResult.error?.message || profilesResult.error?.message);
        // 数据库读取失败时不继续展示无法互动的本地演示内容，避免点赞、收藏和评论看似失效。
        setResources([]);
        setDiscussions([]);
        return;
      }

      const profileMap = new Map((profilesResult.data || []).map((p: any) => [p.id, p]));
      const resourceIds = (resourcesResult.data || []).map((r: any) => r.id);
      const discussionIds = (discussionsResult.data || []).map((d: any) => d.id);
      const [attachmentsResult, commentsResult, repliesResult, likesResult, bookmarksResult, discussionBookmarksResult] = await Promise.all([
        resourceIds.length ? supabase.from('resource_attachments').select('*').in('resource_id', resourceIds) : Promise.resolve({ data: [], error: null } as any),
        resourceIds.length ? supabase.from('resource_comments').select('*').in('resource_id', resourceIds).order('created_at') : Promise.resolve({ data: [], error: null } as any),
        discussionIds.length ? supabase.from('discussion_replies').select('*').in('discussion_id', discussionIds).order('created_at') : Promise.resolve({ data: [], error: null } as any),
        resourceIds.length ? supabase.from('resource_likes').select('resource_id,user_id').in('resource_id', resourceIds) : Promise.resolve({ data: [], error: null } as any),
        resourceIds.length ? supabase.from('resource_bookmarks').select('resource_id,user_id').in('resource_id', resourceIds) : Promise.resolve({ data: [], error: null } as any),
        discussionIds.length ? supabase.from('discussion_bookmarks').select('discussion_id,user_id').in('discussion_id', discussionIds) : Promise.resolve({ data: [], error: null } as any)
      ]);
      const commentIds = (commentsResult.data || []).map((x: any) => x.id);
      const replyIds = (repliesResult.data || []).map((x: any) => x.id);
      const [commentLikesResult, replyLikesResult] = await Promise.all([
        commentIds.length ? supabase.from('comment_likes').select('comment_id,user_id').in('comment_id', commentIds) : Promise.resolve({ data: [], error: null } as any),
        replyIds.length ? supabase.from('reply_likes').select('reply_id,user_id').in('reply_id', replyIds) : Promise.resolve({ data: [], error: null } as any)
      ]);
      if (!active) return;
      const profiles = profileMap as Map<string, any>;
      const likes = likesResult.data || [];
      const bookmarks = bookmarksResult.data || [];
      const discussionBookmarks = discussionBookmarksResult.data || [];
      const formatDate = (value: string) => new Date(value).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });

      const mappedResources: ResourceItem[] = (resourcesResult.data || []).map((r: any) => {
        const author = profiles.get(r.author_id);
        const comments = (commentsResult.data || []).filter((x: any) => x.resource_id === r.id).map((x: any) => {
          const p = profiles.get(x.author_id);
          const commentLikes = commentLikesResult.data || [];
          return { id: x.id, authorEmail: p?.email || '', authorName: p?.nickname || p?.username || 'Student', authorAvatar: p?.avatar_path || '', text: x.body, date: formatDate(x.created_at), likes: commentLikes.filter((like: any) => like.comment_id === x.id).length, likedByMe: commentLikes.some((like: any) => like.comment_id === x.id && like.user_id === userId) };
        });
        return {
          id: r.id, title: r.title, subject: r.subject || '', grade: r.grade || '', description: r.description || '', content: r.content || '', tags: Array.isArray(r.tags) ? r.tags : [],
          authorName: r.author_id ? (author?.nickname || author?.username || 'Student') : 'Deleted account', authorEmail: author?.email || '', authorId: r.author_id || '', authorAvatar: author?.avatar_path || '',
          date: formatDate(r.created_at), createdAt: r.created_at, likes: likes.filter((x: any) => x.resource_id === r.id).length,
          bookmarks: bookmarks.filter((x: any) => x.resource_id === r.id).length,
          likedByMe: likes.some((x: any) => x.resource_id === r.id && x.user_id === userId),
          bookmarkedByMe: bookmarks.some((x: any) => x.resource_id === r.id && x.user_id === userId),
          comments,
          attachments: (attachmentsResult.data || []).filter((x: any) => x.resource_id === r.id).map((x: any) => ({
            name: x.name,
            type: x.content_type || 'application/octet-stream',
            url: x.external_url || (x.storage_path ? supabase.storage.from('resource-attachments').getPublicUrl(x.storage_path).data.publicUrl : '')
          }))
        };
      });
      const mappedDiscussions: DiscussionItem[] = (discussionsResult.data || []).map((d: any) => {
        const author = profiles.get(d.author_id);
        const replies = (repliesResult.data || []).filter((x: any) => x.discussion_id === d.id).map((x: any) => {
          const p = profiles.get(x.author_id);
          const replyLikes = replyLikesResult.data || [];
          return { id: x.id, authorEmail: p?.email || '', authorName: p?.nickname || p?.username || 'Student', authorAvatar: p?.avatar_path || '', text: x.content, date: formatDate(x.created_at), likes: replyLikes.filter((like: any) => like.reply_id === x.id).length, likedByMe: replyLikes.some((like: any) => like.reply_id === x.id && like.user_id === userId) };
        });
        return {
          id: d.id, title: d.title, content: d.content, authorEmail: author?.email || '', authorId: d.author_id || undefined, authorName: d.author_id ? (author?.nickname || author?.username || 'Student') : 'Deleted account', authorAvatar: author?.avatar_path || '',
          date: formatDate(d.created_at), createdAt: d.created_at, repliesCount: replies.length, replies,
          bookmarkedByMe: discussionBookmarks.some((x: any) => x.discussion_id === d.id && x.user_id === userId),
          bookmarks: discussionBookmarks.filter((x: any) => x.discussion_id === d.id).length
        };
      });
      // 数据库查询已按 created_at 倒序；把数据库内容放在前面，确保最新发布的笔记/讨论优先显示。
      // 只展示从 Supabase 成功读取的正式内容；本地演示数据没有数据库 ID，无法持久化评论、点赞或收藏。
      setResources(mappedResources);
      setDiscussions(mappedDiscussions);
    };

    void loadCommunityData();
    return () => { active = false; };
  }, [user?.id]);

  // 在线心跳：前台每 30 秒更新一次，超过两分钟未更新视为离线。
  useEffect(() => {
    const userId = user?.id;
    if (!userId || typeof window === 'undefined') return;
    const heartbeat = async () => {
      if (document.visibilityState !== 'visible') return;
      const { error } = await supabase.from('user_presence').upsert(
        { user_id: userId, last_seen_at: new Date().toISOString() }, { onConflict: 'user_id' }
      );
      if (error) console.error('Unable to update online presence:', error.message);
    };
    void heartbeat();
    const timer = window.setInterval(heartbeat, 30000);
    const onVisibility = () => { if (document.visibilityState === 'visible') void heartbeat(); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', onVisibility); };
  }, [user?.id]);

  useEffect(() => {
    if (!isAdmin || activeTab !== 'admin') return;
    let active = true;
    setAdminLoading(true);
    const load = async () => {
      const [metrics, feedback, ratings] = await Promise.all([
        supabase.rpc('admin_dashboard_metrics'),
        supabase.from('site_feedback').select('id,user_id,category,details,status,created_at').order('created_at', { ascending: false }).limit(100),
        supabase.from('site_ratings').select('user_id,rating,comment,updated_at').order('updated_at', { ascending: false }).limit(100)
      ]);
      if (!active) return;
      if (metrics.error) console.error('Admin metrics error:', metrics.error.message); else setAdminMetrics(metrics.data || null);
      if (feedback.error) console.error('Admin feedback error:', feedback.error.message); else setAdminFeedback(feedback.data || []);
      if (ratings.error) console.error('Admin ratings error:', ratings.error.message); else setAdminRatings(ratings.data || []);
      setAdminLoading(false);
    };
    void load();
    return () => { active = false; };
  }, [isAdmin, activeTab]);

  // 用户发布的内容与收藏由 Supabase 持久化，不再依赖浏览器 localStorage。


  useEffect(() => {
    if (announcements.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % announcements.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [announcements]);

  // 登录后统计网站前台活跃时间，并将累计值定期保存到 Supabase profiles。
  useEffect(() => {
    const userId = user?.id;
    if (!userId || typeof window === 'undefined') {
      setUsageSeconds(0);
      return;
    }

    let active = true;
    let totalSeconds = 0;
    let timer: number | undefined;

    const startTracking = async () => {
      // 兼容迁移前已注册、但尚未生成 profiles 行的账号。
      const { data: existingProfile, error: profileReadError } = await supabase
        .from('profiles')
        .select('total_study_seconds')
        .eq('id', userId)
        .maybeSingle();

      if (!active) return;

      if (profileReadError) {
        console.error('Unable to load saved study time:', profileReadError.message);
      }

      let savedSeconds = existingProfile?.total_study_seconds;
      if (!existingProfile && !profileReadError) {
        const { error: createProfileError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: user?.email || '',
            username: user?.username || '',
            nickname: user?.nickname || user?.username || ''
          });

        if (createProfileError) {
          console.error('Unable to initialize user profile:', createProfileError.message);
        }
      }

      // 重新读取，以使用数据库中实际保存的累计值。
      const { data, error } = await supabase
        .from('profiles')
        .select('total_study_seconds')
        .eq('id', userId)
        .maybeSingle();

      if (!active) return;

      if (error) {
        console.error('Unable to load saved study time:', error.message);
      }

      savedSeconds = data?.total_study_seconds ?? savedSeconds;
      totalSeconds = Math.max(0, Number(savedSeconds ?? user?.totalStudySeconds) || 0);
      setUsageSeconds(totalSeconds);
      setUser((previous: any) => previous?.id === userId
        ? { ...previous, totalStudySeconds: totalSeconds }
        : previous);

      // 仅当网站标签页处于前台时累计；每 30 秒将新增时间写入数据库。
      timer = window.setInterval(async () => {
        if (!active || document.visibilityState !== 'visible') return;

        totalSeconds += 30;
        setUsageSeconds(totalSeconds);
        setUser((previous: any) => previous?.id === userId
          ? { ...previous, totalStudySeconds: totalSeconds }
          : previous);

        const { data: savedTotal, error: saveError } = await supabase.rpc('add_study_time', { p_seconds: 30 });
        if (saveError) {
          console.error('Unable to save study time:', saveError.message);
        } else if (savedTotal !== null && savedTotal !== undefined) {
          totalSeconds = Math.max(totalSeconds, Number(savedTotal) || 0);
          setUsageSeconds(totalSeconds);
          setUser((previous: any) => previous?.id === userId ? { ...previous, totalStudySeconds: totalSeconds } : previous);
        }
      }, 30000);
    };

    void startTracking();

    return () => {
      active = false;
      if (timer !== undefined) window.clearInterval(timer);
    };
  }, [user?.id]);

  useEffect(() => {
    let timer: any = null;
    if (isTimerRunning && pomodoroTime > 0) {
      timer = setInterval(() => setPomodoroTime(prev => prev - 1), 1000);
    } else if (pomodoroTime === 0) {
      setIsTimerRunning(false);
      alert('Focus session completed! Time to take a 5-minute break.');
      setPomodoroTime(1500);
    }
    return () => clearInterval(timer);
  }, [isTimerRunning, pomodoroTime]);

  // 自习室列表来自数据库，名称、创建时间和最近活动时间都持久化。
  useEffect(() => {
    let active = true;
    const loadRooms = async () => {
      setRoomListLoading(true);
      const { data, error } = await supabase
        .from('study_rooms')
        .select('id,name,subject,description,is_private,room_code,created_at,last_activity_at,created_by')
        .order(roomSortBy === 'created' ? 'created_at' : 'last_activity_at', { ascending: false });
      if (!active) return;
      setRoomListLoading(false);
      if (error) {
        console.error('Unable to load study rooms:', error.message);
        setLounges([]);
        return;
      }
      const roomRows = data || [];
      const ids = roomRows.map((room: any) => room.id);
      const { data: presenceRows } = ids.length
        ? await supabase.from('study_room_presence').select('room_id,user_id,last_seen_at').in('room_id', ids.map(String)).gte('last_seen_at', new Date(Date.now() - 90000).toISOString())
        : { data: [] as any[] };
      if (!active) return;
      setLounges(roomRows.map((room: any) => ({
        id: String(room.id), name: room.name, subject: room.subject || 'General Study',
        description: room.description || '', isPrivate: Boolean(room.is_private),
        roomCode: room.created_by === user?.id ? room.room_code : undefined,
        createdAt: room.created_at, lastActivityAt: room.last_activity_at || room.created_at,
        createdBy: room.created_by || '',
        activeUsers: (presenceRows || []).filter((person: any) => person.room_id === String(room.id)).length
      })));
    };
    void loadRooms();
    return () => { active = false; };
  }, [roomSortBy, user?.id]);

  // 自习室在线名单与聊天记录从 Supabase 读取；在线状态定期心跳更新，聊天消息长期保存。
  useEffect(() => {
    const roomId = joinedRoom?.id;
    const userId = user?.id;
    if (!roomId || !userId) {
      setRoomPresence([]);
      setRoomMessages([]);
      return;
    }
    let active = true;
    const displayName = nickname || username || user.email?.split('@')[0] || 'Student';
    const refreshRoomData = async () => {
      const { data: presence, error: presenceError } = await supabase
        .from('study_room_presence')
        .select('user_id, display_name, avatar_url, joined_at, last_seen_at, study_seconds')
        .eq('room_id', roomId)
        .gte('last_seen_at', new Date(Date.now() - 90000).toISOString())
        .order('study_seconds', { ascending: false });
      if (!presenceError && active) setRoomPresence([...(presence || [])].sort((a, b) => (Number(b.study_seconds) || 0) - (Number(a.study_seconds) || 0)));
      const { data: messages, error: messagesError } = await supabase
        .from('study_room_messages')
        .select('id, user_id, display_name, avatar_url, body, created_at')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(100);
      if (!messagesError && active) setRoomMessages(messages || []);
    };
    const heartbeat = async (seconds = 0) => {
      const { data, error } = await supabase.rpc('heartbeat_study_room', {
        p_room_id: roomId,
        p_display_name: displayName,
        p_avatar_url: avatarUrl || '',
        p_seconds: seconds
      });
      if (error) console.error('Unable to update study room presence:', error.message);
      else if (typeof data === 'number' && active) setRoomStudySeconds(data);
      await refreshRoomData();
    };
    void heartbeat(0);
    void (async () => {
      const { data, error } = await supabase.from('study_room_goals').select('goal').eq('room_id', roomId).eq('user_id', userId).maybeSingle();
      if (error) console.error('Unable to load study room goal:', error.message);
      if (active && !error) { setRoomGoal(data?.goal || ''); setRoomGoalDraft(data?.goal || ''); }
    })();
    const pollTimer = window.setInterval(() => { void refreshRoomData(); }, 5000);
    const heartbeatTimer = window.setInterval(() => { void heartbeat(30); }, 30000);
    return () => {
      active = false;
      window.clearInterval(pollTimer);
      window.clearInterval(heartbeatTimer);
      void supabase.from('study_room_presence').delete().eq('room_id', roomId).eq('user_id', userId);
    };
  }, [joinedRoom?.id, user?.id, nickname, username, user?.email, avatarUrl]);

  async function createStudyRoom(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.id) { setShowAuthModal(true); return; }
    const name = newRoomName.trim();
    if (!name || roomActionLoading) return;
    setRoomActionLoading(true);
    const roomId = crypto.randomUUID();
    const roomCode = newRoomIsPrivate ? Math.random().toString(36).slice(2, 8).toUpperCase() : null;
    const { data, error } = await supabase.from('study_rooms').insert({
      id: roomId, name, subject: newRoomSubject, description: newRoomDescription.trim(),
      is_private: newRoomIsPrivate, room_code: roomCode, created_by: user.id
    }).select('id,name,subject,description,is_private,room_code,created_at,last_activity_at,created_by').single();
    if (error || !data) {
      console.error('Unable to create study room:', error?.message);
      setRoomActionLoading(false);
      alert('Could not create the study room. Please check that the latest study-room migration has been run.');
      return;
    }
    const { error: memberError } = await supabase.from('study_room_members').insert({ room_id: data.id, user_id: user.id });
    setRoomActionLoading(false);
    if (memberError) {
      console.error('Unable to add room owner as a member:', memberError.message);
      alert('The room was created, but joining it failed. Please try joining it again.');
      return;
    }
    const room: LoungeRoom = {
      id: String(data.id), name: data.name, subject: data.subject || 'General Study',
      description: data.description || '', isPrivate: Boolean(data.is_private),
      roomCode: data.room_code || undefined, createdAt: data.created_at,
      lastActivityAt: data.last_activity_at || data.created_at, createdBy: data.created_by || '', activeUsers: 0
    };
    setLounges(previous => [room, ...previous.filter(item => item.id !== room.id)]);
    setNewRoomName(''); setNewRoomDescription(''); setNewRoomSubject('General Study');
    setNewRoomIsPrivate(false); setShowCreateRoomForm(false); setRoomStudySeconds(0); setJoinedRoom(room);
  }

  async function joinStudyRoom(room: LoungeRoom) {
    if (!user?.id) { setShowAuthModal(true); return; }
    setRoomActionLoading(true);
    const { error } = await supabase.from('study_room_members').upsert(
      { room_id: room.id, user_id: user.id }, { onConflict: 'room_id,user_id', ignoreDuplicates: true }
    );
    setRoomActionLoading(false);
    if (error) {
      console.error('Unable to join study room:', error.message);
      alert('Could not join this study room. If it is private, make sure you have the correct room code.');
      return;
    }
    setRoomStudySeconds(0);
    setJoinedRoom(room);
  }

  async function joinPrivateRoomByCode(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.id) { setShowAuthModal(true); return; }
    const code = roomCodeInput.trim().toUpperCase();
    if (!code || roomActionLoading) return;
    setRoomActionLoading(true);
    const { data: joinedRows, error } = await supabase.rpc('join_private_study_room', { p_room_code: code });
    const room = Array.isArray(joinedRows) ? joinedRows[0] : joinedRows;
    setRoomActionLoading(false);
    if (error || !room) {
      console.error('Unable to join private study room:', error?.message);
      alert('No private study room was found for that room code.');
      return;
    }
    const joined: LoungeRoom = {
      id: String(room.id), name: room.name, subject: room.subject || 'General Study',
      description: room.description || '', isPrivate: true, roomCode: undefined,
      createdAt: room.created_at, lastActivityAt: room.last_activity_at || room.created_at,
      createdBy: room.created_by || '', activeUsers: 0
    };
    setRoomCodeInput('');
    setLounges(previous => [joined, ...previous.filter(item => item.id !== joined.id)]);
    setRoomStudySeconds(0);
    setJoinedRoom(joined);
  }

  async function saveRoomGoal(e: React.FormEvent) {
    e.preventDefault();
    if (!joinedRoom || !user?.id || roomGoalSaving) return;
    setRoomGoalSaving(true);
    const goal = roomGoalDraft.trim().slice(0, 500);
    const { error } = await supabase.from('study_room_goals').upsert({
      room_id: joinedRoom.id, user_id: user.id, goal, updated_at: new Date().toISOString()
    }, { onConflict: 'room_id,user_id' });
    setRoomGoalSaving(false);
    if (error) {
      console.error('Unable to save study room goal:', error.message);
      alert('Could not save your study goal. Please make sure the latest study-room migration has been run.');
      return;
    }
    setRoomGoal(goal);
  }

  async function sendRoomMessage(e: React.FormEvent) {
    e.preventDefault();
    const body = roomChatInput.trim();
    if (!body || !joinedRoom || !user?.id || roomSending) return;
    setRoomSending(true);
    const { error } = await supabase.from('study_room_messages').insert({
      room_id: joinedRoom.id,
      user_id: user.id,
      display_name: nickname || username || user.email?.split('@')[0] || 'Student',
      avatar_url: avatarUrl || '',
      body
    });
    setRoomSending(false);
    if (error) {
      console.error('Unable to send study room message:', error.message);
      alert('Could not send message. Please try again.');
      return;
    }
    setRoomChatInput('');
    const { data } = await supabase.from('study_room_messages')
      .select('id, user_id, display_name, avatar_url, body, created_at')
      .eq('room_id', joinedRoom.id).order('created_at', { ascending: true }).limit(100);
    setRoomMessages(data || []);
  }

  /* ==========================================================================
     3. 业务处理函数
     ========================================================================== */
  // 登录与注册统一走 Supabase Auth，浏览器不再保存密码。
  async function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const cleanEmail = authEmail.trim().toLowerCase();
    const cleanPassword = authPassword;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      alert('Please enter a valid email address.');
      setLoading(false);
      return;
    }
    if (cleanPassword.length < 8) {
      alert('Password must be at least 8 characters long.');
      setLoading(false);
      return;
    }
    if (isSignUp && (!isStudentConfirmed || !hasAgreedTerms)) {
      alert('Please confirm that you are a student and accept the Terms of Service.');
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: cleanPassword,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              is_student: true,
              accepted_user_notice: true,
              accepted_at: new Date().toISOString()
            }
          }
        });

        if (error) {
          alert(error.message);
          return;
        }
        if (!data.session) {
          alert('Registration received. Please check your email to confirm your account, then sign in.');
          setIsSignUp(false);
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword
        });
        if (error) {
          alert(error.message);
          return;
        }
      }

      setShowAuthModal(false);
      setAuthPassword('');
      setActiveTab('dashboard');
    } catch (error) {
      console.error('Authentication failed:', error);
      alert('Unable to complete authentication right now. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.id) {
      alert('Please sign in to save your profile.');
      return;
    }

    // 保存前检查用户名和昵称，防止空白、超长或包含控制字符的内容。
    const cleanUsername = normalizeName(username);
    const cleanNickname = normalizeName(nickname);
    const usernameError = validateUsername(cleanUsername);
    if (usernameError) { alert(usernameError); return; }
    const nicknameError = validateNickname(cleanNickname);
    if (nicknameError) { alert(nicknameError); return; }

    // 个人资料以 profiles 数据表为唯一来源，避免只存在浏览器或 Auth metadata 中。
    const profileRow = {
      id: user.id,
      email: user.email || '',
      username: cleanUsername,
      nickname: cleanNickname,
      grade: grade,
      gender: gender,
      bio: bio.trim(),
      avatar_path: avatarUrl || null
    };
    const { error } = await supabase.from('profiles').upsert(profileRow, { onConflict: 'id' });
    if (error) {
      console.error('Profile save failed:', error.message);
      alert('Could not save your profile to the database. Please try again.');
      return;
    }

    const updatedUser = {
      ...user,
      username: cleanUsername,
      nickname: cleanNickname,
      grade,
      gender,
      bio: bio.trim(),
      avatarUrl: avatarUrl
    };
    setUser(updatedUser);
    alert('Profile updated successfully!');
    setShowEditProfileModal(false);
  }

  async function handleSubmitFeedback(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.id) { alert('Please sign in to submit feedback.'); setShowAuthModal(true); return; }
    if (!feedbackComment.trim()) return;
    setFeedbackSubmitting(true);
    const { error } = await supabase.from('site_feedback').insert({ user_id: user.id, category: feedbackCategory, details: feedbackComment.trim() });
    if (error) {
      console.error('Feedback submission failed:', error.message);
      alert('Feedback could not be submitted. Please try again.');
      setFeedbackSubmitting(false);
      return;
    }
    if (siteRating > 0) {
      const { error: ratingError } = await supabase.from('site_ratings').upsert({ user_id: user.id, rating: siteRating, comment: ratingComment.trim() }, { onConflict: 'user_id' });
      if (ratingError) console.error('Rating submission failed:', ratingError.message);
    }
    setFeedbackComment(''); setRatingComment(''); setSiteRating(0); setFeedbackSubmitting(false);
    alert('Thank you! Your feedback has been submitted.');
  }

  async function handleUpdateFeedbackStatus(id: string, status: 'Pending' | 'Reviewed' | 'Resolved') {
    const { error } = await supabase.from('site_feedback').update({ status }).eq('id', id);
    if (error) { console.error('Unable to update feedback:', error.message); alert('Could not update feedback status.'); return; }
    setAdminFeedback(items => items.map(item => item.id === id ? { ...item, status } : item));
    const { data } = await supabase.rpc('admin_dashboard_metrics');
    if (data) setAdminMetrics(data);
  }

  async function refreshAdminDashboard() {
    if (!isAdmin) return;
    setAdminLoading(true);
    const [metrics, feedback, ratings] = await Promise.all([
      supabase.rpc('admin_dashboard_metrics'),
      supabase.from('site_feedback').select('id,user_id,category,details,status,created_at').order('created_at', { ascending: false }).limit(100),
      supabase.from('site_ratings').select('user_id,rating,comment,updated_at').order('updated_at', { ascending: false }).limit(100)
    ]);
    if (metrics.data) setAdminMetrics(metrics.data);
    if (feedback.data) setAdminFeedback(feedback.data);
    if (ratings.data) setAdminRatings(ratings.data);
    setAdminLoading(false);
  }

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert('Unable to sign out right now. Please try again.');
      return;
    }
    setUser(null);
    setActiveTab('resources');
    alert('Logged out successfully.');
  }

  async function handleDeleteAccount() {
    if (!user?.id) {
      alert('Please sign in before deleting your account.');
      return;
    }

    const confirmed = window.confirm(
      'Permanently delete your account? Your profile, comments, replies, likes, bookmarks, feedback, and ratings will be deleted. Your published notes and discussions will remain visible as “Deleted account”. This cannot be undone.'
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      // 先删除当前账号，再清除浏览器会话；数据库函数会保留并匿名化公开帖子。
      const { error } = await supabase.rpc('delete_current_account');
      if (error) {
        console.error('Account deletion failed:', error.message);
        alert('Account deletion failed. Please try again or contact the site administrator.');
        return;
      }

      await supabase.auth.signOut();
      setUser(null);
      setPublicProfile(null);
      setShowEditProfileModal(false);
      setActiveTab('resources');
      setAvatarUrl('');
      setUsername('');
      setNickname('');
      setGrade('');
      setGender('Prefer not to say');
      setBio('');
      setUsageSeconds(0);
      alert('Your account and personal data have been permanently deleted. Your published notes and discussions remain anonymously visible.');
    } catch (error) {
      console.error('Account deletion failed:', error);
      alert('Account deletion failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // 仅保留富文本编辑器允许的格式，避免将任意脚本写入页面。
  function sanitizeRichHtml(input: string) {
    if (typeof window === 'undefined') return input.replace(/<[^>]*>/g, '');
    const parsed = new DOMParser().parseFromString(input, 'text/html');
    const allowed = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'P', 'BR', 'UL', 'OL', 'LI', 'SPAN', 'DIV']);
    const walk = (node: Node) => {
      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeType === Node.ELEMENT_NODE) {
          const element = child as HTMLElement;
          if (!allowed.has(element.tagName)) {
            element.replaceWith(...Array.from(element.childNodes));
            return;
          }
          Array.from(element.attributes).forEach((attribute) => {
            if (element.tagName === 'SPAN' && attribute.name === 'style') {
              const color = element.style.color;
              element.removeAttribute('style');
              if (/^(#[0-9a-f]{3,8}|rgb\([\d\s,%]+\)|[a-z]+)$/i.test(color)) element.style.color = color;
            } else {
              element.removeAttribute(attribute.name);
            }
          });
          walk(element);
        } else if (child.nodeType !== Node.TEXT_NODE) {
          child.parentNode?.removeChild(child);
        }
      });
    };
    walk(parsed.body);
    return parsed.body.innerHTML;
  }

  async function openPublicProfile(name: string, email?: string, profileId?: string) {
    // 公开资料直接从 profiles 读取，避免旧版 localStorage 缓存与主页数据库数据不一致。
    if (!email && !profileId) {
      setPublicProfile({ username: name, nickname: name, grade: '', gender: '', bio: '', avatarUrl: '', createdAt: '', totalStudySeconds: 0, resources: [], discussions: [] });
      return;
    }

    const profileQuery = email
      ? supabase.from('profiles').select('id,email,username,nickname,grade,gender,bio,avatar_path,created_at,total_study_seconds').eq('email', email)
      : supabase.from('public_author_profiles').select('id,username,nickname,grade,gender,bio,avatar_path,created_at').eq('id', profileId);
    const { data, error } = await profileQuery.maybeSingle();

    if (error) {
      console.error('Unable to load public profile:', error.message);
      alert('Could not load this profile. Please try again.');
      return;
    }

    // 账号已注销或没有对应 profile 时，不展示可点击的个人主页信息。
    if (!data) {
      setPublicProfile({ username: name, nickname: name, grade: '', gender: '', bio: '', avatarUrl: '', createdAt: '', totalStudySeconds: 0, resources: [], discussions: [] });
      return;
    }

    setPublicProfile({
      id: data.id,
      // 公开资料视图不会暴露邮箱；仅登录用户自己的 profiles 查询可能包含邮箱。
      email: email ? ((data as any).email || '') : '',
      username: data.username || name,
      nickname: data.nickname || data.username || name,
      grade: data.grade || '',
      gender: data.gender || '',
      bio: data.bio || '',
      avatarUrl: data.avatar_path || '',
      createdAt: data.created_at ? new Date(data.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
      // 公开资料视图不包含平台使用时长，默认显示为 0。
      totalStudySeconds: email ? Math.max(0, Number((data as any).total_study_seconds) || 0) : 0,
      resources: resources.filter((item) => item.authorId === data.id),
      discussions: discussions.filter((item) => item.authorId === data.id)
    });
  }

  function handleResourceFileSelection(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      if (file.size > 20 * 1024 * 1024) {
        alert(`${file.name} is larger than 20 MB. Please add it using a Google Drive share link instead.`);
        return;
      }
      // 文件先保留在表单状态，提交笔记时再上传到 Supabase Storage。
      const localUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : '';
      setResourceAttachments((previous) => [...previous, { name: file.name, type: file.type || 'application/octet-stream', url: localUrl, file }]);
    });
    e.target.value = '';
  }

  function addDriveLink() {
    const url = driveResourceUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      alert('Please enter a valid https:// or http:// share link.');
      return;
    }
    setResourceAttachments((previous) => [...previous, { name: url.includes('drive.google.com') ? 'Google Drive resource' : 'External resource link', type: 'text/uri-list', url }]);
    setDriveResourceUrl('');
  }

  async function handleCreateResourceSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isAdmin) return;
    if (!user) {
      alert('Please sign in first.');
      setShowAuthModal(true);
      return;
    }
    const editorHtml = richEditorRef.current ? sanitizeRichHtml(richEditorRef.current.innerHTML) : sanitizeRichHtml(richContentHtml || newResContent);
    const plainContent = richEditorRef.current ? (richEditorRef.current.innerText || '').trim() : newResContent.trim();
    if (!newResTitle.trim() || (!plainContent && !editorHtml && resourceAttachments.length === 0)) return;

    const { data: saved, error } = await supabase.from('resources').insert({
      author_id: user.id, title: newResTitle.trim(), subject: newResSubject, grade: newResGrade,
      description: newResDescription.trim() || plainContent.slice(0, 90) + '...', content: editorHtml || plainContent, tags: selectedResourceTags
    }).select('*').single();
    if (error || !saved) { console.error('Publish failed:', error?.message, error?.details, error?.hint); alert(`The note could not be saved. ${error?.message || 'Please try again.'}`); return; }

    const attachmentRows: Array<Record<string, any>> = [];
    for (const attachment of resourceAttachments) {
      if (attachment.file) {
        const safeName = attachment.file.name.replace(/[^a-zA-Z0-9._-]+/g, '_');
        const storagePath = `${user.id}/${saved.id}/${crypto.randomUUID()}-${safeName}`;
        const { error: uploadError } = await supabase.storage
          .from('resource-attachments')
          .upload(storagePath, attachment.file, { contentType: attachment.type || 'application/octet-stream', upsert: false });
        if (uploadError) {
          console.error('Attachment upload failed:', uploadError.message);
          await supabase.from('resources').delete().eq('id', saved.id).eq('author_id', user.id);
          const isSizeLimitError = /size|payload|limit|too large/i.test(uploadError.message);
          alert(isSizeLimitError
            ? `Could not upload "${attachment.name}" because it exceeds the current storage upload limit. Please use a Google Drive share link, or ask the site administrator to check the Supabase Storage file-size limit.`
            : `Could not upload "${attachment.name}": ${uploadError.message}`);
          return;
        }
        attachmentRows.push({
          resource_id: saved.id, author_id: user.id, name: attachment.name,
          content_type: attachment.type || 'application/octet-stream', storage_path: storagePath, external_url: null
        });
      } else {
        attachmentRows.push({
          resource_id: saved.id, author_id: user.id, name: attachment.name,
          content_type: attachment.type || 'application/octet-stream', external_url: attachment.url, storage_path: null
        });
      }
    }
    if (attachmentRows.length) {
      const { error: attachmentError } = await supabase.from('resource_attachments').insert(attachmentRows);
      if (attachmentError) {
        console.error('Attachment metadata save failed:', attachmentError.message);
        await supabase.from('resources').delete().eq('id', saved.id).eq('author_id', user.id);
        alert('Could not save attachment information. Your note was not published. Please try again.');
        return;
      }
    }

    const newRes: ResourceItem = {
      id: saved.id, title: saved.title, subject: saved.subject, grade: saved.grade,
      description: saved.description, content: saved.content, tags: selectedResourceTags, attachments: [...resourceAttachments],
      authorName: nickname || username || user.email.split('@')[0], authorEmail: user.email, authorAvatar: avatarUrl,
      date: new Date(saved.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }),
      createdAt: saved.created_at, likes: 0, bookmarks: 0, likedByMe: false, bookmarkedByMe: false, comments: []
    };
    setResources(prev => [newRes, ...prev.filter(item => item.id !== newRes.id)]);
    setShowCreateResourceModal(false);
    setNewResTitle('');
    setNewResDescription('');
    setNewResContent('');
    setSelectedResourceTags([]);
    setRichContentHtml('');
    setResourceAttachments([]);
    setDriveResourceUrl('');
    if (richEditorRef.current) richEditorRef.current.innerHTML = '';
    alert('Academic resource note published!');
  }

  async function handleCreateDiscussionSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isAdmin) return;
    if (!user) {
      alert('Please sign in first.');
      setShowAuthModal(true);
      return;
    }
    if (!newDiscTitle.trim() || !newDiscContent.trim()) return;

    const { data: saved, error } = await supabase.from('discussions').insert({
      author_id: user.id, title: newDiscTitle.trim(), content: newDiscContent.trim()
    }).select('*').single();
    if (error || !saved) { console.error('Discussion save failed:', error?.message); alert('The discussion could not be saved. Please try again.'); return; }
    const newDisc: DiscussionItem = {
      id: saved.id, title: saved.title, content: saved.content, authorEmail: user.email,
      authorName: nickname || username || user.email.split('@')[0],
      date: new Date(saved.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }),
      createdAt: saved.created_at, repliesCount: 0, replies: [], bookmarkedByMe: false, bookmarks: 0
    };
    setDiscussions(prev => [newDisc, ...prev.filter(item => item.id !== newDisc.id)]);
    setShowCreateDiscussionModal(false);
    setNewDiscTitle('');
    setNewDiscContent('');
    alert('Discussion topic posted!');
  }

  async function handleAddDiscussionReply(e: React.FormEvent) {
    e.preventDefault();
    if (isAdmin) return;
    if (!user) {
      alert('Please sign in to reply.');
      setShowAuthModal(true);
      return;
    }
    if (!newReplyText.trim() || !selectedDiscussion) return;

    if (!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(selectedDiscussion.id)) { alert('Replies are available on database-published discussions.'); return; }
    const { data: savedReply, error } = await supabase.from('discussion_replies').insert({
      discussion_id: selectedDiscussion.id, author_id: user.id, content: newReplyText.trim()
    }).select('*').single();
    if (error || !savedReply) { console.error('Reply save failed:', error?.message); alert('Could not save reply. Please try again.'); return; }
    const replyObj: CommentItem = {
      id: savedReply.id, authorEmail: user.email, authorName: nickname || username || user.email.split('@')[0],
      authorAvatar: avatarUrl, text: savedReply.content,
      date: new Date(savedReply.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), likes: 0
    };

    const updatedDisc = {
      ...selectedDiscussion,
      repliesCount: selectedDiscussion.repliesCount + 1,
      replies: [...selectedDiscussion.replies, replyObj]
    };

    setSelectedDiscussion(updatedDisc);
    setDiscussions(prev => prev.map(d => d.id === selectedDiscussion.id ? updatedDisc : d));
    setNewReplyText('');
  }

  async function handleLikeResource(id: string, e?: React.MouseEvent) {
    e?.stopPropagation();
    if (isAdmin) return;
    if (!user?.id) { alert('Please sign in to like notes.'); setShowAuthModal(true); return; }
    const resource = resources.find(item => item.id === id);
    if (!resource || !/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(id)) return;
    const wasLiked = !!resource.likedByMe;
    const result = wasLiked
      ? await supabase.from('resource_likes').delete().eq('resource_id', id).eq('user_id', user.id)
      : await supabase.from('resource_likes').insert({ resource_id: id, user_id: user.id });
    if (result.error) { console.error('Like update failed:', result.error.message); alert('Could not update like. Please try again.'); return; }
    setResources(prev => prev.map(res => res.id === id ? { ...res, likes: Math.max(0, res.likes + (wasLiked ? -1 : 1)), likedByMe: !wasLiked } : res));
  }

  async function handleBookmarkResource(id: string, e?: React.MouseEvent) {
    e?.stopPropagation();
    if (isAdmin) return;
    if (!user?.id) { alert('Please sign in first to save notes to your profile.'); setShowAuthModal(true); return; }
    const resource = resources.find(item => item.id === id);
    if (!resource || !/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(id)) return;
    const wasSaved = !!resource.bookmarkedByMe;
    const result = wasSaved
      ? await supabase.from('resource_bookmarks').delete().eq('resource_id', id).eq('user_id', user.id)
      : await supabase.from('resource_bookmarks').insert({ resource_id: id, user_id: user.id });
    if (result.error) { console.error('Bookmark update failed:', result.error.message); alert('Could not update saved notes. Please try again.'); return; }
    setResources(prev => prev.map(res => res.id === id ? { ...res, bookmarks: Math.max(0, res.bookmarks + (wasSaved ? -1 : 1)), bookmarkedByMe: !wasSaved } : res));
  }

  async function handleBookmarkDiscussion(id: string, e?: React.MouseEvent) {
    e?.stopPropagation();
    if (isAdmin) return;
    if (!user?.id) { alert('Please sign in first to save discussions to your profile.'); setShowAuthModal(true); return; }
    const discussion = discussions.find(item => item.id === id);
    if (!discussion || !/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(id)) return;
    const wasSaved = !!discussion.bookmarkedByMe;
    const result = wasSaved
      ? await supabase.from('discussion_bookmarks').delete().eq('discussion_id', id).eq('user_id', user.id)
      : await supabase.from('discussion_bookmarks').insert({ discussion_id: id, user_id: user.id });
    if (result.error) { console.error('Discussion bookmark update failed:', result.error.message); alert('Could not update saved discussions. Please try again.'); return; }
    const update = (d: DiscussionItem) => d.id === id ? { ...d, bookmarkedByMe: !wasSaved, bookmarks: Math.max(0, (d.bookmarks || 0) + (wasSaved ? -1 : 1)) } : d;
    setDiscussions(prev => prev.map(update));
    setSelectedDiscussion(prev => prev ? update(prev) : prev);
  }

  // 评论作者可以删除自己的评论；管理员可以删除任意评论，便于后续处理举报。
  async function handleDeleteResourceComment(resourceId: string, commentId: string) {
    const resource = resources.find(item => item.id === resourceId);
    const comment = resource?.comments.find(item => item.id === commentId);
    if (!user?.id || !comment || (!isAdmin && comment.authorEmail?.toLowerCase() !== user.email?.toLowerCase())) return;
    if (!window.confirm('Delete this comment? This cannot be undone.')) return;
    if (!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(commentId)) return;
    let deleteQuery = supabase.from('resource_comments').delete().eq('id', commentId);
    if (!isAdmin) deleteQuery = deleteQuery.eq('author_id', user.id);
    const { error } = await deleteQuery;
    if (error) { console.error('Comment delete failed:', error.message); alert('Could not delete comment. Please try again.'); return; }
    const updateResource = (item: ResourceItem): ResourceItem => ({ ...item, comments: item.comments.filter(entry => entry.id !== commentId) });
    setResources(prev => prev.map(item => item.id === resourceId ? updateResource(item) : item));
    setPreviewResource(prev => prev && prev.id === resourceId ? updateResource(prev) : prev);
  }

  // 回复作者可以删除自己的回复；管理员可以删除任意回复。
  async function handleDeleteDiscussionReply(discussionId: string, replyId: string) {
    const discussion = discussions.find(item => item.id === discussionId);
    const reply = discussion?.replies.find(item => item.id === replyId);
    if (!user?.id || !reply || (!isAdmin && reply.authorEmail?.toLowerCase() !== user.email?.toLowerCase())) return;
    if (!window.confirm('Delete this reply? This cannot be undone.')) return;
    if (!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(replyId)) return;
    let deleteQuery = supabase.from('discussion_replies').delete().eq('id', replyId);
    if (!isAdmin) deleteQuery = deleteQuery.eq('author_id', user.id);
    const { error } = await deleteQuery;
    if (error) { console.error('Reply delete failed:', error.message); alert('Could not delete reply. Please try again.'); return; }
    const updateDiscussion = (item: DiscussionItem): DiscussionItem => {
      const replies = item.replies.filter(entry => entry.id !== replyId);
      return { ...item, replies, repliesCount: replies.length };
    };
    setDiscussions(prev => prev.map(item => item.id === discussionId ? updateDiscussion(item) : item));
    setSelectedDiscussion(prev => prev && prev.id === discussionId ? updateDiscussion(prev) : prev);
  }

  // 发布者可以删除自己的笔记；管理员可以删除任何笔记。
  function handleDeleteResource(resourceId: string) {
    const resource = resources.find(item => item.id === resourceId);
    if (!user?.id || !resource || (!isAdmin && resource.authorEmail?.toLowerCase() !== user.email?.toLowerCase())) return;
    if (!window.confirm('Delete this note? Its comments and attachments will also be removed.')) return;
    if (!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(resourceId)) { alert('This sample note is not stored in the database.'); return; }
    let deleteQuery = supabase.from('resources').delete().eq('id', resourceId);
    if (!isAdmin) deleteQuery = deleteQuery.eq('author_id', user.id);
    void deleteQuery.then(({ error }) => {
      if (error) { console.error('Resource delete failed:', error.message); alert('Could not delete the note. Please try again.'); return; }
      setResources(prev => prev.filter(item => item.id !== resourceId));
    });
    setPreviewResource(prev => prev?.id === resourceId ? null : prev);
  }

  function handleDeleteDiscussion(discussionId: string) {
    const discussion = discussions.find(item => item.id === discussionId);
    if (!user?.id || !discussion || (!isAdmin && discussion.authorEmail?.toLowerCase() !== user.email?.toLowerCase())) return;
    if (!window.confirm('Delete this discussion and all its replies? This cannot be undone.')) return;
    if (!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(discussionId)) { alert('This sample discussion is not stored in the database.'); return; }
    let deleteQuery = supabase.from('discussions').delete().eq('id', discussionId);
    if (!isAdmin) deleteQuery = deleteQuery.eq('author_id', user.id);
    void deleteQuery.then(({ error }) => {
      if (error) { console.error('Discussion delete failed:', error.message); alert('Could not delete the discussion. Please try again.'); return; }
      setDiscussions(prev => prev.filter(item => item.id !== discussionId));
    });
    setSelectedDiscussion(prev => prev?.id === discussionId ? null : prev);
  }

  async function handleLikeResourceComment(resourceId: string, commentId: string) {
    if (isAdmin) return;
    if (!user?.id) { alert('Please sign in to like comments.'); setShowAuthModal(true); return; }
    const comment = resources.find(item => item.id === resourceId)?.comments.find(item => item.id === commentId);
    if (!comment || !/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(commentId)) return;
    const wasLiked = !!comment.likedByMe;
    const result = wasLiked
      ? await supabase.from('comment_likes').delete().eq('comment_id', commentId).eq('user_id', user.id)
      : await supabase.from('comment_likes').insert({ comment_id: commentId, user_id: user.id });
    if (result.error) { console.error('Comment like failed:', result.error.message); alert('Could not update comment like. Please try again.'); return; }
    const updateResource = (resource: ResourceItem): ResourceItem => ({
      ...resource,
      comments: resource.comments.map(item => item.id === commentId
        ? { ...item, likedByMe: !wasLiked, likes: Math.max(0, (item.likes || 0) + (wasLiked ? -1 : 1)) }
        : item)
    });
    setResources(prev => prev.map(resource => resource.id === resourceId ? updateResource(resource) : resource));
    setPreviewResource(prev => prev?.id === resourceId ? updateResource(prev) : prev);
  }

  async function handleLikeDiscussionReply(discussionId: string, replyId: string) {
    if (isAdmin) return;
    if (!user?.id) { alert('Please sign in to like replies.'); setShowAuthModal(true); return; }
    const reply = discussions.find(item => item.id === discussionId)?.replies.find(item => item.id === replyId);
    if (!reply || !/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(replyId)) return;
    const wasLiked = !!reply.likedByMe;
    const result = wasLiked
      ? await supabase.from('reply_likes').delete().eq('reply_id', replyId).eq('user_id', user.id)
      : await supabase.from('reply_likes').insert({ reply_id: replyId, user_id: user.id });
    if (result.error) { console.error('Reply like failed:', result.error.message); alert('Could not update reply like. Please try again.'); return; }
    const updateDiscussion = (discussion: DiscussionItem): DiscussionItem => ({
      ...discussion,
      replies: discussion.replies.map(item => item.id === replyId
        ? { ...item, likedByMe: !wasLiked, likes: Math.max(0, (item.likes || 0) + (wasLiked ? -1 : 1)) }
        : item)
    });
    setDiscussions(prev => prev.map(item => item.id === discussionId ? updateDiscussion(item) : item));
    setSelectedDiscussion(prev => prev?.id === discussionId ? updateDiscussion(prev) : prev);
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      alert('Please sign in to comment.');
      setShowAuthModal(true);
      return;
    }
    if (!newCommentText.trim() || !previewResource) return;

    if (!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(previewResource.id)) { alert('Comments are available on database-published notes.'); return; }
    const { error: profileEnsureError } = await supabase.from('profiles').upsert({ id: user.id, email: user.email || '', username: username || user.email?.split('@')[0] || 'Student', nickname: nickname || username || user.email?.split('@')[0] || 'Student' }, { onConflict: 'id' });
    if (profileEnsureError) console.error('Profile ensure before comment failed:', profileEnsureError.message);

    const commentBody = newCommentText.trim();
    const { data: savedComment, error } = await supabase.from('resource_comments').insert({
      resource_id: previewResource.id,
      author_id: user.id,
      body: commentBody
    }).select('id,resource_id,author_id,body,created_at').single();
    if (error || !savedComment) { console.error('Comment save failed:', error?.message, error?.details, error?.hint); alert(`Could not save comment: ${error?.message || 'Unknown database error'}`); return; }
    const commentObj: CommentItem = {
      id: savedComment.id, authorEmail: user.email, authorName: nickname || username || user.email.split('@')[0],
      authorAvatar: avatarUrl, text: savedComment.body,
      date: new Date(savedComment.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }),
      likes: 0, likedByMe: false
    };

    const updatedResource = { ...previewResource, comments: [...previewResource.comments, commentObj] };
    setPreviewResource(updatedResource);
    setResources(prev => prev.map(r => r.id === previewResource.id ? updatedResource : r));
    setNewCommentText('');
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !user?.id) return;
    if (!file.type.startsWith('image/')) {
      alert('Please choose an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Avatar images must be 5 MB or smaller.');
      return;
    }
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '_');
    const storagePath = `${user.id}/${crypto.randomUUID()}-${safeName}`;
    const { error } = await supabase.storage
      .from('profile-avatars')
      .upload(storagePath, file, { contentType: file.type, upsert: false });
    if (error) {
      console.error('Avatar upload failed:', error.message);
      alert('Could not upload your avatar. Please try again.');
      return;
    }
    setAvatarUrl(supabase.storage.from('profile-avatars').getPublicUrl(storagePath).data.publicUrl);
  }

  /* ==========================================================================
     4. 主题样式与计算
     ========================================================================== */
  const theme = {
    bg: isDarkMode ? '#0E1117' : '#F8FAFC',
    cardBg: isDarkMode ? '#161B22' : '#FFFFFF',
    border: isDarkMode ? '#21262D' : '#E2E8F0',
    textMain: isDarkMode ? '#F0F6FC' : '#0F172A',
    textMuted: isDarkMode ? '#8B949E' : '#64748B',
    accent: '#8B5CF6',
  };

  const subjectsList = ['Mathematics', 'Science', 'English & ESL', 'French', 'History & Social Sciences', 'Geography', 'Business & Economics', 'Art & Music', 'Computer Science & Tech'];
  const gradesList = ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'AP Courses', 'Academic Competitions'];

  const filteredResources = resources.filter(res => {
    const resourceTags = res.tags || [];
    const matchesSubject = selectedSubjects.length === 0 || selectedSubjects.some(tag => resourceTags.includes(tag));
    const matchesGrade = selectedGrades.length === 0 || selectedGrades.some(tag => resourceTags.includes(tag));
    const matchesSearch = searchQuery === '' || res.title.toLowerCase().includes(searchQuery.toLowerCase()) || res.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesGrade && matchesSearch;
  });
  const [resourceSort, setResourceSort] = useState<'newest' | 'likes' | 'comments' | 'bookmarks'>('newest');
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  // 登录用户的界面偏好保存在数据库中，可在不同设备恢复。
  useEffect(() => {
    let active = true;
    const userId = user?.id;
    setPreferencesLoaded(false);
    if (!userId) return () => { active = false; };

    const loadPreferences = async () => {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('preferences')
        .eq('user_id', userId)
        .maybeSingle();
      if (!active) return;
      if (error) {
        console.error('Unable to load saved preferences:', error.message);
        setPreferencesLoaded(true);
        return;
      }
      const saved = data?.preferences || {};
      if (typeof saved.isDarkMode === 'boolean') setIsDarkMode(saved.isDarkMode);
      if (['newest', 'likes', 'comments', 'bookmarks'].includes(saved.resourceSort)) {
        setResourceSort(saved.resourceSort);
      }
      if (Array.isArray(saved.selectedSubjects)) setSelectedSubjects(saved.selectedSubjects.filter((v: unknown) => typeof v === 'string'));
      if (Array.isArray(saved.selectedGrades)) setSelectedGrades(saved.selectedGrades.filter((v: unknown) => typeof v === 'string'));
      setPreferencesLoaded(true);
    };
    void loadPreferences();
    return () => { active = false; };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || !preferencesLoaded) return;
    const preferences = { isDarkMode, resourceSort, selectedSubjects, selectedGrades };
    const savePreferences = async () => {
      const { error } = await supabase.from('user_preferences').upsert({
        user_id: user.id,
        preferences,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
      if (error) console.error('Unable to save preferences:', error.message);
    };
    void savePreferences();
  }, [user?.id, preferencesLoaded, isDarkMode, resourceSort, selectedSubjects, selectedGrades]);
  const sortedFilteredResources = [...filteredResources].sort((a, b) => {
    // 有搜索关键词时，优先显示标题和描述与关键词更匹配的帖子。
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      const relevanceScore = (item: ResourceItem) => {
        const title = item.title.toLowerCase();
        const description = item.description.toLowerCase();
        const tags = (item.tags || []).map(tag => tag.toLowerCase());
        let score = 0;
        if (title === query) score += 100;
        else if (title.startsWith(query)) score += 60;
        else if (title.includes(query)) score += 40;
        if (description.includes(query)) score += 15;
        if (tags.some(tag => tag === query)) score += 35;
        else if (tags.some(tag => tag.includes(query))) score += 20;
        return score;
      };
      const scoreDifference = relevanceScore(b) - relevanceScore(a);
      if (scoreDifference !== 0) return scoreDifference;
    }
    if (resourceSort === 'likes') return b.likes - a.likes;
    if (resourceSort === 'comments') return b.comments.length - a.comments.length;
    if (resourceSort === 'bookmarks') return b.bookmarks - a.bookmarks;
    const timestamp = (item: ResourceItem) => {
      const value = item.createdAt ? new Date(item.createdAt).getTime() : new Date(item.date).getTime();
      return Number.isFinite(value) ? value : 0;
    };
    return timestamp(b) - timestamp(a);
  });

  const citationText = useMemo(() => {
    if (!previewResource) return '';
    switch (citationFormat) {
      case 'APA':
        return `${previewResource.authorName}. (${previewResource.date.split(' ').pop()}). ${previewResource.title}. North Synapse Academic Platform.`;
      case 'IEEE':
        return `[1] ${previewResource.authorName}, "${previewResource.title}," North Synapse Academic Hub, ${previewResource.date}.`;
      case 'MLA':
        return `${previewResource.authorName}. "${previewResource.title}." North Synapse, ${previewResource.date}.`;
      case 'BibTeX':
        return `@article{northsynapse_${previewResource.id},\n  author = {${previewResource.authorName}},\n  title = {${previewResource.title}},\n  journal = {North Synapse Hub},\n  year = {2026}\n}`;
    }
  }, [previewResource, citationFormat]);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const myResources = resources.filter(r => r.authorEmail === user?.email);
  const bookmarkedResources = resources.filter(r => r.bookmarkedByMe);
  const myDiscussions = discussions.filter(d => d.authorEmail?.toLowerCase() === user?.email?.toLowerCase());
  const joinedDate = user?.createdAt || user?.joinedAt || 'Not available';
  const formatDuration = (seconds: number) => {
    const totalMinutes = Math.floor(Math.max(0, seconds) / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return hours > 0 ? `${hours} hr ${minutes} min` : `${minutes} min`;
  };

  return (
    <div style={{ backgroundColor: theme.bg, color: theme.textMain, minHeight: '100vh', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* 顶部 Header */}
      <header className="ns-site-header" style={{ borderBottom: `1px solid ${theme.border}`, padding: '1.2rem 3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div onClick={() => setActiveTab('resources')} style={{ fontSize: '1.4rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer' }}>
          <svg width="34" height="38" viewBox="0 0 100 110" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M 75,20 C 75,10 25,10 25,35 C 25,60 75,60 75,85 C 75,100 25,100 25,90" stroke="#A78BFA" strokeWidth="6" strokeLinecap="round" fill="none" />
            <circle cx="75" cy="20" r="4.5" fill="#A78BFA" />
            <circle cx="25" cy="35" r="4.5" fill="#A78BFA" />
            <circle cx="75" cy="85" r="4.5" fill="#A78BFA" />
          </svg>
          <span>North Synapse</span>
          {isAdmin && <span style={{ backgroundColor: theme.accent, color: '#FFF', fontSize: '0.65rem', padding: '0.15rem 0.5rem', borderRadius: '10px', fontWeight: 'bold' }}>ADMIN</span>}
        </div>

        <nav className="ns-main-nav" style={{ display: 'flex', gap: '1.6rem' }}>
          {((isAdmin ? ['resources', 'lounges', 'announcements', 'discussions'] : ['resources', 'lounges', 'announcements', 'discussions', 'feedback']) as NavTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: 'none',
                border: 'none',
                color: activeTab === tab ? theme.accent : theme.textMuted,
                fontWeight: activeTab === tab ? '700' : '500',
                cursor: 'pointer',
                fontSize: '0.95rem',
                borderBottom: activeTab === tab ? `2px solid ${theme.accent}` : '2px solid transparent',
                textTransform: 'capitalize'
              }}
            >
              {tab === 'resources' ? 'Resource Hub' : tab === 'lounges' ? 'Study Lounge' : tab}
            </button>
          ))}
          {user && !isAdmin && (
            <button onClick={() => setActiveTab('dashboard')} style={{ background: 'none', border: 'none', color: activeTab === 'dashboard' ? theme.accent : theme.textMuted, fontWeight: activeTab === 'dashboard' ? '700' : '500', cursor: 'pointer', fontSize: '0.95rem', borderBottom: activeTab === 'dashboard' ? `2px solid ${theme.accent}` : '2px solid transparent' }}>
              Dashboard
            </button>
          )}
          {isAdmin && <button onClick={() => setActiveTab('admin')} style={{ background: 'none', border: 'none', color: activeTab === 'admin' ? theme.accent : theme.textMuted, fontWeight: activeTab === 'admin' ? '700' : '500', cursor: 'pointer', fontSize: '0.95rem', borderBottom: activeTab === 'admin' ? `2px solid ${theme.accent}` : '2px solid transparent' }}>Admin</button>}
        </nav>

        <div className="ns-header-actions" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button className="ns-theme-toggle" onClick={() => setIsDarkMode(!isDarkMode)} style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: `1px solid ${theme.border}`, backgroundColor: theme.cardBg, color: theme.textMain, cursor: 'pointer', fontSize: '0.85rem' }}>
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </button>

          {user ? (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <span onClick={() => setActiveTab(isAdmin ? 'admin' : 'dashboard')} style={{ fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer', color: theme.accent }}>
                {nickname || 'User'}
              </span>
              <button onClick={handleSignOut} style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', backgroundColor: 'transparent', border: `1px solid ${theme.border}`, color: theme.textMuted, cursor: 'pointer', fontSize: '0.85rem' }}>
                Sign Out
              </button>
            </div>
          ) : (
            <button onClick={() => setShowAuthModal(true)} style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.5rem 1.4rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}>
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* 主界面区域 */}
      <main style={{ maxWidth: '1080px', margin: '0 auto', padding: '2rem' }}>
        
        {/* 公告轮播栏 */}
        <div className="ns-notice-banner" style={{ backgroundColor: 'rgba(139, 92, 246, 0.08)', border: `1px solid ${theme.accent}`, borderRadius: '12px', padding: '0 1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '52px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, overflow: 'hidden' }}>
            <span className="ns-notice-count" style={{ backgroundColor: theme.accent, color: '#FFF', fontSize: '0.75rem', fontWeight: 'bold', padding: '0.25rem 0.6rem', borderRadius: '6px', flexShrink: 0 }}>
              NOTICE ({currentBannerIndex + 1}/{announcements.length})
            </span>

            <div style={{ flex: 1, overflow: 'hidden', height: '52px', position: 'relative' }}>
              {announcements.map((item, idx) => (
                <div key={item.id} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '52px', display: 'flex', alignItems: 'center', gap: '0.8rem', opacity: idx === currentBannerIndex ? 1 : 0, transform: idx === currentBannerIndex ? 'translateY(0)' : 'translateY(15px)', transition: 'all 0.4s ease-in-out' }}>
                  <span className="ns-notice-title" style={{ fontSize: '0.9rem', color: theme.textMain, fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</span>
                  <span className="ns-notice-date" style={{ fontSize: '0.8rem', color: theme.textMuted, flexShrink: 0 }}>• {item.date}</span>
                </div>
              ))}
            </div>
          </div>

          <button className="ns-notice-viewall" onClick={() => setActiveTab('announcements')} style={{ background: 'none', border: 'none', color: theme.accent, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', flexShrink: 0 }}>
            View All
          </button>
        </div>

        {/* RESOURCE HUB 视图 */}
        {activeTab === 'resources' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)', color: theme.accent, padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700', display: 'inline-block', marginBottom: '0.5rem' }}>
                  Academic Platform
                </span>
                <h1 style={{ fontSize: '2.2rem', fontWeight: '900' }}>North Synapse Resource Hub</h1>
              </div>

              {!isAdmin && <button onClick={() => { if (!user) { alert('Please sign in first.'); setShowAuthModal(true); return; } setShowCreateResourceModal(true); }} style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.75rem 1.6rem', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
                + Share Notes / Resource
              </button>}
            </div>

            <input 
              type="text" 
              placeholder="Search notes, topics, or study guide titles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '10px', border: `1px solid ${theme.border}`, backgroundColor: theme.cardBg, color: theme.textMain, outline: 'none' }}
            />

            <div style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: theme.textMuted, display: 'block', marginBottom: '0.6rem' }}>LEVEL &amp; TRACK:</span>
                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                  {gradesList.map((grd) => (
                    <button key={grd} onClick={() => setSelectedGrades(prev => prev.includes(grd) ? prev.filter(g => g !== grd) : [...prev, grd])} style={{ padding: '0.4rem 1rem', borderRadius: '20px', border: `1px solid ${selectedGrades.includes(grd) ? theme.accent : theme.border}`, backgroundColor: selectedGrades.includes(grd) ? theme.accent : theme.bg, color: selectedGrades.includes(grd) ? '#FFF' : theme.textMain, fontWeight: '600', fontSize: '0.8rem', cursor: 'pointer' }}>
                      {grd}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: theme.textMuted, display: 'block', marginBottom: '0.6rem' }}>SUBJECT CATEGORIES:</span>
                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                  {subjectsList.map((sub) => (
                    <button key={sub} onClick={() => setSelectedSubjects(prev => prev.includes(sub) ? prev.filter(s => s !== sub) : [...prev, sub])} style={{ padding: '0.4rem 1rem', borderRadius: '20px', border: `1px solid ${selectedSubjects.includes(sub) ? theme.accent : theme.border}`, backgroundColor: selectedSubjects.includes(sub) ? theme.accent : theme.bg, color: selectedSubjects.includes(sub) ? '#FFF' : theme.textMain, fontWeight: '600', fontSize: '0.8rem', cursor: 'pointer' }}>
                      {sub}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.7rem', marginBottom: '0.4rem' }}>
              <label htmlFor="resource-sort" style={{ color: theme.textMuted, fontSize: '0.85rem' }}>Sort by</label>
              <select id="resource-sort" value={resourceSort} onChange={(e) => setResourceSort(e.target.value as typeof resourceSort)} style={{ background: theme.cardBg, color: theme.textMain, border: `1px solid ${theme.border}`, borderRadius: 8, padding: '0.55rem 0.7rem' }}>
                <option value="newest">Publish time</option><option value="likes">Likes</option><option value="comments">Comments</option><option value="bookmarks">Saves</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {sortedFilteredResources.map((res) => (
                <div key={res.id} onClick={() => setPreviewResource(res)} style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '1.5rem', cursor: 'pointer' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.4rem' }}>{res.title}</h3>
                  <p style={{ color: theme.textMuted, fontSize: '0.9rem', marginBottom: '0.6rem' }}>{res.description}</p>
              {!!res.tags?.length && <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1rem' }}>{res.tags.map(tag => <span key={tag} style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', borderRadius: 5, background: theme.bg, color: theme.accent, border: `1px solid ${theme.border}` }}>{tag}</span>)}</div>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${theme.border}`, paddingTop: '0.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', minWidth: 0 }}>
                      {res.authorAvatar ? <img src={res.authorAvatar} alt="" style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover' }} /> : <div style={{ width: 30, height: 30, borderRadius: '50%', background: theme.bg, display: 'grid', placeItems: 'center', fontWeight: 700 }}>{(res.authorName || 'S').slice(0, 1).toUpperCase()}</div>}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                        {res.authorId ? <button type="button" onClick={(e) => { e.stopPropagation(); openPublicProfile(res.authorName, res.authorEmail, res.authorId); }} style={{ color: theme.textMain, background: 'none', border: 0, padding: 0, cursor: 'pointer', textAlign: 'left', font: 'inherit', fontWeight: 600 }}>{res.authorName}</button> : <span style={{ fontWeight: 600 }}>{res.authorName}</span>}
                        <span style={{ fontSize: '0.72rem', color: theme.textMuted }}>{res.date}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      {(isAdmin || user?.email?.toLowerCase() === res.authorEmail?.toLowerCase()) && <button type="button" onClick={(e) => { e.stopPropagation(); handleDeleteResource(res.id); }} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}>Delete</button>}
                      {isAdmin ? <span style={{ color: theme.textMuted, fontSize: '0.85rem' }}>Likes ({res.likes})</span> : <button onClick={(e) => handleLikeResource(res.id, e)} style={{ background: 'none', border: 'none', color: res.likedByMe ? theme.accent : theme.textMuted, cursor: 'pointer' }}>Like ({res.likes})</button>}
                      {isAdmin ? <span style={{ color: theme.textMuted, fontSize: '0.85rem' }}>Saves ({res.bookmarks})</span> : <button onClick={(e) => handleBookmarkResource(res.id, e)} style={{ background: 'none', border: 'none', color: res.bookmarkedByMe ? theme.accent : theme.textMuted, cursor: 'pointer' }}>Save ({res.bookmarks})</button>}
                      <span style={{ color: theme.textMuted, fontSize: '0.85rem' }}>Comments ({res.comments.length})</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STUDY LOUNGE 视图 */}
        {activeTab === 'lounges' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.4rem' }}>Quiet Study Rooms</h1>
              <p style={{ color: theme.textMuted, margin: 0 }}>A calm space to focus together. No audio, just study time and text chat.</p>
            </div>
            {joinedRoom ? (
              <div className="ns-study-room-grid" style={{ display: 'grid', gridTemplateColumns: roomRosterHidden ? 'minmax(0, 1.15fr) minmax(280px, 1fr)' : 'minmax(180px, 0.85fr) minmax(280px, 1.35fr) minmax(240px, 1fr)', gap: '1rem', alignItems: 'stretch' }}>
                {!roomRosterHidden && <section style={{ background: theme.cardBg, border: '1px solid ' + theme.border, borderRadius: '14px', padding: '1rem', minHeight: '460px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}><h3 style={{ marginTop: 0, marginBottom: '0.35rem' }}>In this room</h3><button type="button" onClick={() => setRoomRosterHidden(true)} aria-label="Hide room members" title="Hide room members" style={{ border: '1px solid ' + theme.border, background: 'transparent', color: theme.textMain, borderRadius: '7px', padding: '0.3rem 0.5rem', cursor: 'pointer' }}>Hide</button></div>
                  <p style={{ color: theme.textMuted, fontSize: '0.8rem', marginTop: 0 }}>{roomPresence.length} online · longest study time first</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                    {[...roomPresence].sort((a, b) => (Number(b.study_seconds) || 0) - (Number(a.study_seconds) || 0)).map((person) => (
                      <div key={person.user_id} style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
                        {person.avatar_url ? <img src={person.avatar_url} alt="" style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} /> : <div style={{ width: 38, height: 38, borderRadius: '50%', display: 'grid', placeItems: 'center', background: theme.bg, color: theme.accent, fontWeight: 800, flexShrink: 0 }}>{(person.display_name || 'S').slice(0, 1).toUpperCase()}</div>}
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '0.9rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{person.display_name}{person.user_id === user?.id ? ' (You)' : ''}</div>
                          <div style={{ fontSize: '0.75rem', color: theme.textMuted }}>Here for {formatTimer(Math.max(0, Number(person.study_seconds) || 0))}</div>
                          <div style={{ fontSize: '0.7rem', color: theme.textMuted }}>Joined {person.joined_at ? new Date(person.joined_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</div>
                        </div>
                      </div>
                    ))}
                    {roomPresence.length === 0 && <p style={{ color: theme.textMuted, fontSize: '0.85rem' }}>Loading the room...</p>}
                  </div>
                </section>}
                <section style={{ background: theme.cardBg, border: '1px solid ' + theme.border, borderRadius: '14px', padding: '1rem', minHeight: '460px' }}>
                  <h3 style={{ marginTop: 0, marginBottom: '0.35rem' }}>In this room</h3>
                  <p style={{ color: theme.textMuted, fontSize: '0.8rem', marginTop: 0 }}>{roomPresence.length} online · earliest join first</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                    {roomPresence.map((person) => (
                      <div key={person.user_id} style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
                        {person.avatar_url ? <img src={person.avatar_url} alt="" style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} /> : <div style={{ width: 38, height: 38, borderRadius: '50%', display: 'grid', placeItems: 'center', background: theme.bg, color: theme.accent, fontWeight: 800, flexShrink: 0 }}>{(person.display_name || 'S').slice(0, 1).toUpperCase()}</div>}
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '0.9rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{person.display_name}{person.user_id === user?.id ? ' (You)' : ''}</div>
                          <div style={{ fontSize: '0.75rem', color: theme.textMuted }}>Here for {formatTimer(Math.max(0, Number(person.study_seconds) || 0))}</div>
                          <div style={{ fontSize: '0.7rem', color: theme.textMuted }}>Joined {person.joined_at ? new Date(person.joined_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</div>
                        </div>
                      </div>
                    ))}
                    {roomPresence.length === 0 && <p style={{ color: theme.textMuted, fontSize: '0.85rem' }}>Loading the room...</p>}
                  </div>
                </section>

                <section style={{ background: theme.cardBg, border: '1px solid ' + theme.border, borderRadius: '14px', padding: '1.5rem 1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ color: theme.textMuted, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Focus session</div>
                  <h2 style={{ margin: '0.6rem 0' }}>{joinedRoom.name}</h2>
                  <div style={{ fontSize: 'clamp(2.8rem, 5vw, 4rem)', lineHeight: 1.1, fontWeight: 900, fontVariantNumeric: 'tabular-nums', color: theme.accent, margin: '1rem 0' }}>{formatTimer(pomodoroTime)}</div>
                  <div style={{ color: theme.textMuted, fontSize: '0.9rem' }}>{isTimerRunning ? 'Focus in progress' : 'Ready when you are'}</div>
                  <form onSubmit={saveRoomGoal} style={{ width: '100%', maxWidth: '440px', textAlign: 'left', marginTop: '1rem', padding: '1rem', borderRadius: '12px', background: theme.bg, border: '1px solid ' + theme.border }}>
                    <label htmlFor="study-room-goal" style={{ display: 'block', fontWeight: 750, fontSize: '0.9rem', marginBottom: '0.5rem' }}>My study goal</label>
                    <textarea id="study-room-goal" value={roomGoalDraft} onChange={e => setRoomGoalDraft(e.target.value)} maxLength={500} rows={3} placeholder="What do you want to finish in this session?" style={{ boxSizing: 'border-box', width: '100%', resize: 'vertical', padding: '0.7rem', borderRadius: '8px', border: '1px solid ' + theme.border, background: theme.cardBg, color: theme.textMain }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginTop: '0.55rem' }}><span style={{ color: theme.textMuted, fontSize: '0.72rem' }}>{roomGoal ? 'Saved to your account' : 'Only visible to you'}</span><button type="submit" disabled={roomGoalSaving || roomGoalDraft.trim() === roomGoal} style={{ background: theme.accent, color: '#fff', border: 'none', borderRadius: '8px', padding: '0.5rem 0.8rem', cursor: 'pointer', opacity: roomGoalSaving || roomGoalDraft.trim() === roomGoal ? 0.55 : 1 }}>{roomGoalSaving ? 'Saving…' : 'Save goal'}</button></div>
                  </form>
                  {roomRosterHidden && <button type="button" onClick={() => setRoomRosterHidden(false)} style={{ marginTop: '0.8rem', border: '1px solid ' + theme.border, background: 'transparent', color: theme.textMain, borderRadius: '8px', padding: '0.55rem 0.8rem', cursor: 'pointer' }}>Show room members ({roomPresence.length})</button>}
                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.6rem', margin: '1.25rem 0' }}>
                    <button onClick={() => setIsTimerRunning(!isTimerRunning)} style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.65rem 1.1rem', borderRadius: '9px', fontWeight: 'bold', cursor: 'pointer' }}>{isTimerRunning ? 'Pause' : 'Start focus'}</button>
                    <button onClick={() => { setIsTimerRunning(false); setPomodoroTime(1500); }} style={{ background: 'transparent', color: theme.textMain, border: '1px solid ' + theme.border, padding: '0.65rem 1rem', borderRadius: '9px', cursor: 'pointer' }}>Reset</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.75rem', width: '100%', maxWidth: '360px' }}>
                    <div style={{ background: theme.bg, borderRadius: '10px', padding: '0.9rem 0.5rem' }}><div style={{ color: theme.textMuted, fontSize: '0.75rem' }}>This room session</div><strong style={{ fontSize: '1.25rem' }}>{formatTimer(roomStudySeconds)}</strong></div>
                    <div style={{ background: theme.bg, borderRadius: '10px', padding: '0.9rem 0.5rem' }}><div style={{ color: theme.textMuted, fontSize: '0.75rem' }}>Total study time</div><strong style={{ fontSize: '1.25rem' }}>{formatTimer(usageSeconds)}</strong></div>
                  </div>
                  <p style={{ color: theme.textMuted, fontSize: '0.75rem', marginTop: '1rem' }}>Silent by design · No audio features</p>
                  <button onClick={() => { setIsTimerRunning(false); setJoinedRoom(null); setRoomStudySeconds(0); }} style={{ marginTop: '0.5rem', background: 'transparent', border: 'none', color: theme.textMuted, cursor: 'pointer', textDecoration: 'underline' }}>Leave room</button>
                </section>

                <section style={{ background: theme.cardBg, border: '1px solid ' + theme.border, borderRadius: '14px', padding: '1rem', minHeight: '460px', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <h3 style={{ marginTop: 0, marginBottom: '0.25rem' }}>Room chat</h3>
                  <p style={{ color: theme.textMuted, fontSize: '0.8rem', marginTop: 0 }}>Text only · Messages are saved</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', overflowY: 'auto', flex: 1, maxHeight: '370px', paddingRight: '0.2rem' }}>
                    {roomMessages.map((message) => (
                      <div key={message.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                        {message.avatar_url ? <img src={message.avatar_url} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} /> : <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'grid', placeItems: 'center', background: theme.bg, color: theme.accent, fontSize: '0.75rem', fontWeight: 800, flexShrink: 0 }}>{(message.display_name || 'S').slice(0, 1).toUpperCase()}</div>}
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.4rem', alignItems: 'baseline' }}><strong style={{ fontSize: '0.8rem' }}>{message.display_name}</strong><span style={{ color: theme.textMuted, fontSize: '0.68rem', whiteSpace: 'nowrap' }}>{new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
                          <p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', margin: '0.2rem 0 0', fontSize: '0.86rem' }}>{message.body}</p>
                        </div>
                      </div>
                    ))}
                    {roomMessages.length === 0 && <p style={{ color: theme.textMuted, fontSize: '0.85rem' }}>No messages yet. Keep the room quiet and focused.</p>}
                  </div>
                  <form onSubmit={sendRoomMessage} style={{ display: 'flex', gap: '0.45rem', marginTop: '1rem' }}>
                    <input value={roomChatInput} onChange={(e) => setRoomChatInput(e.target.value)} maxLength={1000} placeholder="Write a message..." aria-label="Room chat message" style={{ minWidth: 0, flex: 1, padding: '0.7rem', borderRadius: '8px', border: '1px solid ' + theme.border, background: theme.bg, color: theme.textMain }} />
                    <button type="submit" disabled={roomSending || !roomChatInput.trim()} style={{ border: 'none', borderRadius: '8px', padding: '0.7rem 0.85rem', background: theme.accent, color: '#fff', cursor: roomSending ? 'wait' : 'pointer', opacity: roomSending || !roomChatInput.trim() ? 0.6 : 1 }}>Send</button>
                  </form>
                </section>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <input value={roomSearchQuery} onChange={e => setRoomSearchQuery(e.target.value)} placeholder="Search study rooms by name" aria-label="Search study rooms by name" style={{ flex: '1 1 240px', minWidth: 0, padding: '0.7rem', borderRadius: 8, border: '1px solid ' + theme.border, background: theme.bg, color: theme.textMain }} />
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: theme.textMuted, fontSize: '0.85rem' }}>Sort by
                    <select value={roomSortBy} onChange={e => setRoomSortBy(e.target.value as 'created' | 'active')} style={{ padding: '0.65rem', borderRadius: 8, border: '1px solid ' + theme.border, background: theme.bg, color: theme.textMain }}>
                      <option value="created">Creation date</option><option value="active">Recent activity</option>
                    </select>
                  </label>
                  <button type="button" onClick={() => setShowCreateRoomForm(value => !value)} style={{ background: theme.accent, color: '#fff', border: 0, borderRadius: 8, padding: '0.7rem 0.9rem', cursor: 'pointer' }}>{showCreateRoomForm ? 'Cancel' : '+ Create room'}</button>
                </div>
                <form onSubmit={joinPrivateRoomByCode} style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', padding: '0.9rem', border: '1px solid ' + theme.border, borderRadius: 10, background: theme.cardBg }}>
                  <input value={roomCodeInput} onChange={e => setRoomCodeInput(e.target.value.toUpperCase().slice(0, 12))} placeholder="Enter private room code" aria-label="Private room code" style={{ flex: '1 1 200px', minWidth: 0, padding: '0.65rem', borderRadius: 8, border: '1px solid ' + theme.border, background: theme.bg, color: theme.textMain, letterSpacing: '0.08em' }} />
                  <button type="submit" disabled={roomActionLoading || !roomCodeInput.trim()} style={{ background: theme.accent, color: '#fff', border: 0, borderRadius: 8, padding: '0.65rem 1rem', cursor: 'pointer', opacity: roomActionLoading ? 0.6 : 1 }}>{roomActionLoading ? 'Joining…' : 'Join with code'}</button>
                </form>
                {showCreateRoomForm && <form onSubmit={createStudyRoom} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', padding: '1rem', border: '1px solid ' + theme.border, borderRadius: 10, background: theme.cardBg }}>
                  <h3 style={{ margin: 0 }}>Create a study room</h3>
                  <input required maxLength={100} value={newRoomName} onChange={e => setNewRoomName(e.target.value)} placeholder="Room name" style={{ padding: '0.7rem', borderRadius: 8, border: '1px solid ' + theme.border, background: theme.bg, color: theme.textMain }} />
                  <select value={newRoomSubject} onChange={e => setNewRoomSubject(e.target.value)} style={{ padding: '0.7rem', borderRadius: 8, border: '1px solid ' + theme.border, background: theme.bg, color: theme.textMain }}>
                    {['General Study', 'Mathematics', 'Science', 'English & ESL', 'Computer Science & Tech', 'French', 'History & Social Sciences'].map(subject => <option key={subject} value={subject}>{subject}</option>)}
                  </select>
                  <textarea maxLength={500} rows={3} value={newRoomDescription} onChange={e => setNewRoomDescription(e.target.value)} placeholder="What will this room focus on?" style={{ padding: '0.7rem', borderRadius: 8, border: '1px solid ' + theme.border, background: theme.bg, color: theme.textMain }} />
                  <label style={{ display: 'flex', gap: '0.55rem', alignItems: 'center' }}><input type="checkbox" checked={newRoomIsPrivate} onChange={e => setNewRoomIsPrivate(e.target.checked)} />Private room (invite with a room code)</label>
                  <button type="submit" disabled={roomActionLoading || !newRoomName.trim()} style={{ background: theme.accent, color: '#fff', border: 0, borderRadius: 8, padding: '0.75rem', cursor: 'pointer', opacity: roomActionLoading ? 0.6 : 1 }}>{roomActionLoading ? 'Creating…' : 'Create room'}</button>
                </form>}
                {roomListLoading ? <p style={{ color: theme.textMuted }}>Loading study rooms…</p> : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                    {lounges.filter(room => !room.isPrivate || room.createdBy === user?.id).filter(room => room.name.toLowerCase().includes(roomSearchQuery.trim().toLowerCase())).sort((a, b) => roomSortBy === 'created' ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() : new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime()).map(room => (
                      <div key={room.id} style={{ backgroundColor: theme.cardBg, border: '1px solid ' + theme.border, borderRadius: '14px', padding: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}><h3 style={{ margin: 0 }}>{room.name}</h3><span style={{ fontSize: '0.72rem', color: theme.textMuted }}>{room.isPrivate ? 'Private' : 'Public'}</span></div>
                        <p style={{ color: theme.textMuted, fontSize: '0.8rem', margin: '0.5rem 0' }}>{room.subject} · {room.activeUsers} online</p>
                        <p style={{ fontSize: '0.85rem', color: theme.textMuted, margin: '0 0 1rem', whiteSpace: 'pre-wrap' }}>{room.description || 'A quiet space to focus together.'}</p>
                        <p style={{ fontSize: '0.72rem', color: theme.textMuted, margin: '0 0 0.8rem' }}>Created {new Date(room.createdAt).toLocaleDateString()}</p>
                        <button disabled={roomActionLoading} onClick={() => void joinStudyRoom(room)} style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', width: '100%', opacity: roomActionLoading ? 0.6 : 1 }}>Join Study Room</button>
                        {room.isPrivate && room.createdBy === user?.id && room.roomCode && <p style={{ margin: '0.75rem 0 0', fontSize: '0.82rem' }}>Room code: <strong style={{ letterSpacing: '0.1em' }}>{room.roomCode}</strong></p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <style>{'@media (max-width: 900px) { .ns-study-room-grid { grid-template-columns: 1fr !important; } }'}</style>
          </div>
        )}

        {/* DISCUSSIONS 视图 */}
        {activeTab === 'discussions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>Academic Peer Discussions</h1>
              {!isAdmin && <button onClick={() => { if (!user) { alert('Please sign in first.'); setShowAuthModal(true); return; } setShowCreateDiscussionModal(true); }} style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.7rem 1.5rem', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
                + Start New Topic
              </button>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {discussions.map((disc) => (
                <div key={disc.id} onClick={() => setSelectedDiscussion(disc)} style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '1.5rem', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.8rem' }}>
                    {disc.authorAvatar ? <img src={disc.authorAvatar} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} /> : <div style={{ width: 32, height: 32, borderRadius: '50%', background: theme.bg, display: 'grid', placeItems: 'center', fontWeight: 700 }}>{(disc.authorName || 'S').slice(0, 1).toUpperCase()}</div>}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}><span style={{ fontSize: '0.85rem', fontWeight: 650 }}>{disc.authorName}</span><span style={{ fontSize: '0.75rem', color: theme.textMuted }}>{disc.date}</span></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.8rem', marginBottom: '0.5rem' }}>
                    <strong style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{disc.title}</strong>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', flexShrink: 0 }}>
                      {(isAdmin || user?.email?.toLowerCase() === disc.authorEmail?.toLowerCase()) && <button type="button" onClick={(e) => { e.stopPropagation(); handleDeleteDiscussion(disc.id); }} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}>Delete</button>}
                      <span style={{ fontSize: '0.8rem', color: theme.accent, fontWeight: 'bold' }}>{disc.repliesCount} Replies</span>
                      {!isAdmin && <button type="button" onClick={(e) => handleBookmarkDiscussion(disc.id, e)} aria-label={disc.bookmarkedByMe ? 'Remove saved discussion' : 'Save discussion'} style={{ border: `1px solid ${theme.border}`, borderRadius: '7px', padding: '0.35rem 0.55rem', background: disc.bookmarkedByMe ? 'rgba(139,92,246,0.14)' : 'transparent', color: disc.bookmarkedByMe ? theme.accent : theme.textMuted, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        {disc.bookmarkedByMe ? '★ Saved' : '☆ Save'}
                      </button>}
                    </div>
                  </div>
                  <p style={{ fontSize: '0.9rem', color: theme.textMuted, marginBottom: '0.8rem' }}>{disc.content}</p>
                  <span style={{ fontSize: '0.75rem', color: theme.textMuted }}>Posted by {disc.authorEmail ? <button type="button" onClick={(e) => { e.stopPropagation(); openPublicProfile(disc.authorName, disc.authorEmail); }} style={{ color: theme.textMuted, background: 'none', border: 0, padding: 0, cursor: 'pointer', textDecoration: 'none', font: 'inherit' }}>{disc.authorName}</button> : <span>{disc.authorName}</span>} on {disc.date}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ANNOUNCEMENTS 视图 */}
        {activeTab === 'announcements' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }}>Official Announcements</h1>
            {announcements.map((item) => (
              <div key={item.id} style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '16px', padding: '1.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                  <strong style={{ color: theme.accent }}>{item.authorName}</strong>
                  <span style={{ fontSize: '0.8rem', color: theme.textMuted }}>{item.date}</span>
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{item.title}</h3>
                <p style={{ marginTop: '0.5rem', color: theme.textMain }}>{item.content}</p>
              </div>
            ))}
          </div>
        )}

        {/* FEEDBACK 视图 */}
        {!isAdmin && activeTab === 'feedback' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div><h1 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '0.5rem' }}>Feedback &amp; Site Rating</h1><p style={{ color: theme.textMuted, margin: 0 }}>Share ideas, report issues, or rate your experience with North Synapse.</p></div>
            <form onSubmit={handleSubmitFeedback} style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '16px', padding: 'clamp(1rem, 4vw, 2rem)', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div><label style={{ display: 'block', fontSize: '0.85rem', color: theme.textMuted, marginBottom: '0.4rem' }}>Category</label><select value={feedbackCategory} onChange={(e) => setFeedbackCategory(e.target.value)} style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain }}><option value="General Suggestion">General Suggestion</option><option value="Report Issue / Bug">Report Issue / Bug</option><option value="Content Request">Content Request</option></select></div>
              <div><label style={{ display: 'block', fontSize: '0.85rem', color: theme.textMuted, marginBottom: '0.4rem' }}>Your rating (optional)</label><div role="radiogroup" aria-label="Site rating" style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>{[1,2,3,4,5].map(value => <button key={value} type="button" aria-label={`Rate ${value} out of 5`} aria-pressed={siteRating === value} onClick={() => setSiteRating(value)} style={{ border: `1px solid ${theme.border}`, borderRadius: '8px', padding: '0.45rem 0.7rem', background: siteRating >= value ? 'rgba(250, 204, 21, 0.16)' : theme.bg, color: siteRating >= value ? '#EAB308' : theme.textMuted, cursor: 'pointer', fontSize: '1.25rem' }}>★</button>)}<span style={{ alignSelf: 'center', color: theme.textMuted, fontSize: '0.85rem' }}>{siteRating ? `${siteRating}/5` : 'Choose 1–5 stars'}</span></div></div>
              <div><label style={{ display: 'block', fontSize: '0.85rem', color: theme.textMuted, marginBottom: '0.4rem' }}>Rating comment (optional)</label><input value={ratingComment} onChange={(e) => setRatingComment(e.target.value)} maxLength={2000} placeholder="What shaped your rating?" style={{ width: '100%', padding: '0.7rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain, boxSizing: 'border-box' }} /></div>
              <div><label style={{ display: 'block', fontSize: '0.85rem', color: theme.textMuted, marginBottom: '0.4rem' }}>Details</label><textarea required maxLength={5000} rows={4} placeholder="Describe your suggestion or issue..." value={feedbackComment} onChange={(e) => setFeedbackComment(e.target.value)} style={{ width: '100%', padding: '0.7rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain, boxSizing: 'border-box' }} /></div>
              <button disabled={feedbackSubmitting} type="submit" style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.8rem 2rem', borderRadius: '8px', fontWeight: 'bold', cursor: feedbackSubmitting ? 'wait' : 'pointer', opacity: feedbackSubmitting ? 0.7 : 1, alignSelf: 'flex-start' }}>{feedbackSubmitting ? 'Submitting…' : 'Submit Feedback'}</button>
              {!user && <p style={{ color: theme.textMuted, fontSize: '0.85rem', margin: 0 }}>Please sign in to submit feedback or a rating.</p>}
            </form>
          </div>
        )}

        {/* 管理员控制台 */}
        {activeTab === 'admin' && (
          !isAdmin ? <div style={{ padding: '2rem', border: `1px solid ${theme.border}`, borderRadius: '14px', background: theme.cardBg }}><h1>Administrator access required</h1><p style={{ color: theme.textMuted }}>Your account does not have permission to open this dashboard.</p><button type="button" onClick={() => setActiveTab('resources')} style={{ background: theme.accent, color: '#fff', border: 0, borderRadius: '8px', padding: '0.7rem 1rem', cursor: 'pointer' }}>Return to Resource Hub</button></div> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}><div><p style={{ color: theme.accent, fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.12em', margin: '0 0 0.4rem' }}>NORTH SYNAPSE / ADMIN</p><h1 style={{ fontSize: '2rem', fontWeight: 850, margin: 0 }}>Platform Overview</h1><p style={{ color: theme.textMuted, margin: '0.5rem 0 0' }}>Platform metrics, feedback management, and site ratings.</p></div><button type="button" onClick={() => void refreshAdminDashboard()} disabled={adminLoading} style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, color: theme.textMain, borderRadius: '9px', padding: '0.7rem 1rem', cursor: 'pointer' }}>{adminLoading ? 'Refreshing…' : 'Refresh data'}</button></div>
              <section style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', border: `1px solid ${theme.border}`, borderRadius: '14px', background: theme.cardBg, padding: '1rem 1.2rem' }}>
                {avatarUrl ? <img src={avatarUrl} alt="Administrator avatar" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: '50%' }} /> : <div style={{ width: 64, height: 64, borderRadius: '50%', display: 'grid', placeItems: 'center', background: theme.bg, color: theme.accent, fontSize: '1.5rem', fontWeight: 800 }}>{(nickname || username || '?').slice(0, 1).toUpperCase()}</div>}
                <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                  <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{nickname || 'Administrator'}</h2>
                  <p style={{ color: theme.textMuted, margin: '0.25rem 0', fontSize: '0.85rem' }}>@{username || 'username'} · {grade || 'Grade not specified'} · {gender || 'Gender not specified'}</p>
                  {bio.trim() && <p style={{ color: theme.textMuted, margin: '0.35rem 0 0', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{bio}</p>}
                </div>
                <button type="button" onClick={() => setShowEditProfileModal(true)} style={{ background: theme.accent, color: '#fff', border: 0, borderRadius: '8px', padding: '0.7rem 1rem', cursor: 'pointer', fontWeight: 700 }}>Edit Profile</button>
              </section>
              {adminLoading && !adminMetrics ? <p style={{ color: theme.textMuted }}>Loading dashboard data…</p> : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '0.9rem' }}>{[
                { label: 'Registered accounts', value: adminMetrics?.registered_users ?? '—', note: 'All registered accounts' },
                { label: 'Online now', value: adminMetrics?.online_users ?? '—', note: 'Active in the last 2 minutes' },
                { label: 'Average site rating', value: adminMetrics?.rating_count ? `${Number(adminMetrics.average_rating).toFixed(2)} / 5` : '—', note: `${adminMetrics?.rating_count ?? 0} submitted ratings` },
                { label: 'Pending feedback', value: adminMetrics?.pending_feedback ?? '—', note: `${adminMetrics?.total_feedback ?? 0} total submissions` }
              ].map(m => <div key={m.label} style={{ padding: '1.2rem', borderRadius: '13px', border: `1px solid ${theme.border}`, background: theme.cardBg }}><div style={{ color: theme.textMuted, fontSize: '0.82rem', marginBottom: '0.75rem' }}>{m.label}</div><div style={{ fontSize: '2rem', lineHeight: 1.1, fontWeight: 850, overflowWrap: 'anywhere' }}>{m.value}</div><div style={{ color: theme.textMuted, fontSize: '0.75rem', marginTop: '0.65rem' }}>{m.note}</div></div>)}</div>}
              <section style={{ border: `1px solid ${theme.border}`, borderRadius: '14px', background: theme.cardBg, padding: 'clamp(1rem, 3vw, 1.5rem)' }}><div style={{ marginBottom: '1rem' }}><h2 style={{ margin: 0, fontSize: '1.2rem' }}>Feedback inbox</h2><p style={{ margin: '0.3rem 0 0', color: theme.textMuted, fontSize: '0.85rem' }}>Newest 100 submissions</p></div>
                {adminFeedback.length === 0 ? <p style={{ color: theme.textMuted }}>No feedback submissions yet.</p> : <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>{adminFeedback.map(item => <article key={item.id} style={{ border: `1px solid ${theme.border}`, borderRadius: '10px', padding: '1rem' }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}><div><strong>{item.category}</strong><div style={{ color: theme.textMuted, fontSize: '0.75rem', marginTop: '0.25rem' }}>{new Date(item.created_at).toLocaleString()} · Account {String(item.user_id).slice(0,8)}</div></div><select aria-label="Feedback status" value={item.status} onChange={e => void handleUpdateFeedbackStatus(item.id,e.target.value as 'Pending'|'Reviewed'|'Resolved')} style={{ padding: '0.4rem', borderRadius: '7px', border: `1px solid ${theme.border}`, background: theme.bg, color: theme.textMain }}><option>Pending</option><option>Reviewed</option><option>Resolved</option></select></div><p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', margin: '0.85rem 0 0', lineHeight: 1.55 }}>{item.details}</p></article>)}</div>}
              </section>
              <section style={{ border: `1px solid ${theme.border}`, borderRadius: '14px', background: theme.cardBg, padding: 'clamp(1rem, 3vw, 1.5rem)' }}><h2 style={{ margin: '0 0 0.3rem', fontSize: '1.2rem' }}>Recent site ratings</h2><p style={{ margin: '0 0 1rem', color: theme.textMuted, fontSize: '0.85rem' }}>One current rating per account.</p>
                {adminRatings.length === 0 ? <p style={{ color: theme.textMuted }}>No ratings submitted yet.</p> : adminRatings.map(item => <div key={item.user_id} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', borderBottom: `1px solid ${theme.border}`, padding: '0.75rem 0', flexWrap: 'wrap' }}><div><strong style={{ color: '#EAB308' }}>{'★'.repeat(Number(item.rating))}{'☆'.repeat(5-Number(item.rating))} <span style={{ color: theme.textMain }}>{item.rating}/5</span></strong>{item.comment && <p style={{ margin: '0.35rem 0 0', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{item.comment}</p>}</div><span style={{ color: theme.textMuted, fontSize: '0.75rem' }}>{new Date(item.updated_at).toLocaleDateString()}</span></div>)}
              </section>
            </div>
          )
        )}

        {/* DASHBOARD 视图 */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="ns-profile-card" style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '16px', padding: 'clamp(1rem, 4vw, 2rem)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1.25rem', flexWrap: 'wrap' }}>
              <div style={{ minWidth: 0, flex: '1 1 240px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  {avatarUrl ? <img src={avatarUrl} alt="Profile avatar" style={{ width: '76px', height: '76px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${theme.border}` }} /> : <div style={{ width: '76px', height: '76px', borderRadius: '50%', display: 'grid', placeItems: 'center', flexShrink: 0, backgroundColor: theme.bg, color: theme.accent, fontSize: '1.8rem', fontWeight: 800 }}>{(nickname || username || '?').slice(0, 1).toUpperCase()}</div>}
                  <div style={{ minWidth: 0 }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', overflowWrap: 'anywhere', margin: 0 }}>{nickname || 'Student Profile'}</h1>
                    <p style={{ color: theme.textMuted, fontSize: '0.85rem', marginTop: '0.2rem', overflowWrap: 'anywhere' }}>@{username || 'username'}</p>
                    <p style={{ color: theme.textMuted, fontSize: '0.85rem', marginTop: '0.35rem' }}>{grade || 'Grade not specified'} · {gender || 'Gender not specified'}</p>
                  </div>
                </div>
                {bio.trim() && <p style={{ fontSize: '0.9rem', marginTop: '0.8rem', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{bio}</p>}
              </div>
              <button onClick={() => setShowEditProfileModal(true)} style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.8rem 1.2rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', minHeight: '44px' }}>
                Edit Profile
              </button>
              <div className="ns-profile-stats" style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.75rem', marginTop: '0.25rem' }}>
                {[
                  { label: 'Member Since', value: joinedDate },
                  { label: 'Time on Platform', value: formatDuration(usageSeconds) },
                  { label: 'Resources Shared', value: String(myResources.length) },
                  { label: 'Saved Resources', value: String(bookmarkedResources.length) },
                  { label: 'Discussions Started', value: String(myDiscussions.length) },
                  { label: 'Account Email', value: user?.email || 'Not available' },
                ].map(stat => <div key={stat.label} style={{ minWidth: 0, padding: '0.9rem', borderRadius: '10px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg }}><div style={{ fontSize: '0.75rem', color: theme.textMuted, marginBottom: '0.35rem' }}>{stat.label}</div><div style={{ fontSize: '0.95rem', fontWeight: 650, overflowWrap: 'anywhere' }}>{stat.value}</div></div>)}
              </div>
            </div>

            <div style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '16px', padding: '1.8rem' }}>
              <h2 title="Show all or fewer" onClick={() => setExpandedDashboardSections(p => ({ ...p, resources: !p.resources }))} style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem', cursor: myResources.length > DASHBOARD_PREVIEW_LIMIT ? 'pointer' : 'default' }}>My Published Resources ({myResources.length}){myResources.length > DASHBOARD_PREVIEW_LIMIT ? (expandedDashboardSections.resources ? ' · Show less' : ' · Show all') : ''}</h2>
              {myResources.length > 0 ? (
                myResources.slice(0, expandedDashboardSections.resources ? undefined : DASHBOARD_PREVIEW_LIMIT).map(res => (
                  <button type="button" key={res.id} onClick={() => setPreviewResource(res)} style={{ width: '100%', textAlign: 'left', backgroundColor: theme.bg, border: `1px solid ${theme.border}`, borderRadius: '10px', padding: '1rem', marginBottom: '0.5rem', color: theme.textMain, cursor: 'pointer' }}>
                    <strong>{res.title}</strong>
                    <p style={{ margin: '0.35rem 0 0', color: theme.textMuted, fontSize: '0.85rem' }}>Open note</p>
                  </button>
                ))
              ) : (
                <p style={{ color: theme.textMuted, fontSize: '0.85rem' }}>You haven&apos;t shared any resources yet.</p>
              )}
            </div>

            <div style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '16px', padding: '1.8rem' }}>
              <h2 title="Show all or fewer" onClick={() => setExpandedDashboardSections(p => ({ ...p, discussions: !p.discussions }))} style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem', cursor: myDiscussions.length > DASHBOARD_PREVIEW_LIMIT ? 'pointer' : 'default' }}>My Published Discussions ({myDiscussions.length}){myDiscussions.length > DASHBOARD_PREVIEW_LIMIT ? (expandedDashboardSections.discussions ? ' · Show less' : ' · Show all') : ''}</h2>
              {myDiscussions.length > 0 ? (
                myDiscussions.slice(0, expandedDashboardSections.discussions ? undefined : DASHBOARD_PREVIEW_LIMIT).map(disc => (
                  <button type="button" key={disc.id} onClick={() => setSelectedDiscussion(disc)} style={{ width: '100%', textAlign: 'left', backgroundColor: theme.bg, border: `1px solid ${theme.border}`, borderRadius: '10px', padding: '1rem', marginBottom: '0.5rem', color: theme.textMain, cursor: 'pointer' }}>
                    <strong>{disc.title}</strong>
                    <p style={{ margin: '0.35rem 0 0', color: theme.textMuted, fontSize: '0.85rem' }}>{disc.repliesCount} replies · Open discussion</p>
                  </button>
                ))
              ) : (
                <p style={{ color: theme.textMuted, fontSize: '0.85rem' }}>You haven&apos;t started any discussions yet.</p>
              )}
            </div>

            <div style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '16px', padding: '1.8rem' }}>
              <h2 title="Show all or fewer" onClick={() => setExpandedDashboardSections(p => ({ ...p, bookmarks: !p.bookmarks }))} style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem', cursor: bookmarkedResources.length > DASHBOARD_PREVIEW_LIMIT ? 'pointer' : 'default' }}>My Saved Bookmarks ({bookmarkedResources.length}){bookmarkedResources.length > DASHBOARD_PREVIEW_LIMIT ? (expandedDashboardSections.bookmarks ? ' · Show less' : ' · Show all') : ''}</h2>
              {bookmarkedResources.length > 0 ? (
                bookmarkedResources.slice(0, expandedDashboardSections.bookmarks ? undefined : DASHBOARD_PREVIEW_LIMIT).map(bm => (
                  <button type="button" key={bm.id} onClick={() => setPreviewResource(bm)} style={{ width: '100%', textAlign: 'left', backgroundColor: theme.bg, border: `1px solid ${theme.border}`, borderRadius: '10px', padding: '1rem', marginBottom: '0.5rem', color: theme.textMain, cursor: 'pointer' }}>
                    <strong>{bm.title}</strong>
                    <p style={{ margin: '0.35rem 0 0', color: theme.textMuted, fontSize: '0.85rem' }}>{bm.subject} · {bm.grade} · Open note</p>
                  </button>
                ))
              ) : (
                <p style={{ color: theme.textMuted, fontSize: '0.85rem' }}>You haven&apos;t bookmarked any notes yet.</p>
              )}
            </div>

            <div style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '16px', padding: '1.8rem' }}>
              <h2 title="Show all or fewer" onClick={() => setExpandedDashboardSections(p => ({ ...p, savedDiscussions: !p.savedDiscussions }))} style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem', cursor: discussions.filter(d => d.bookmarkedByMe).length > DASHBOARD_PREVIEW_LIMIT ? 'pointer' : 'default' }}>My Saved Discussions ({discussions.filter(d => d.bookmarkedByMe).length}){discussions.filter(d => d.bookmarkedByMe).length > DASHBOARD_PREVIEW_LIMIT ? (expandedDashboardSections.savedDiscussions ? ' · Show less' : ' · Show all') : ''}</h2>
              {discussions.filter(d => d.bookmarkedByMe).length > 0 ? (
                discussions.filter(d => d.bookmarkedByMe).slice(0, expandedDashboardSections.savedDiscussions ? undefined : DASHBOARD_PREVIEW_LIMIT).map(disc => (
                  <button type="button" key={disc.id} onClick={() => setSelectedDiscussion(disc)} style={{ width: '100%', textAlign: 'left', backgroundColor: theme.bg, border: `1px solid ${theme.border}`, borderRadius: '10px', padding: '1rem', marginBottom: '0.5rem', color: theme.textMain, cursor: 'pointer' }}>
                    <strong>{disc.title}</strong>
                    <p style={{ margin: '0.35rem 0 0', color: theme.textMuted, fontSize: '0.85rem' }}>{disc.repliesCount} replies · Open discussion</p>
                  </button>
                ))
              ) : (
                <p style={{ color: theme.textMuted, fontSize: '0.85rem' }}>You haven&apos;t saved any discussions yet.</p>
              )}
            </div>
          </div>
        )}

      </main>

      {/* 常驻的用户须知入口：登录前后都能打开 */}
      <footer style={{ maxWidth: '1080px', margin: '0 auto', padding: '1rem 1rem 2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', color: theme.textMuted, fontSize: '0.85rem' }}>
        <span>North Synapse · Student Learning Community</span>
        <button type="button" onClick={() => setShowTermsModal(true)} style={{ background: 'transparent', border: `1px solid ${theme.border}`, color: theme.textMain, padding: '0.55rem 0.85rem', borderRadius: '8px', cursor: 'pointer', minHeight: '40px' }}>Terms of Service & User Notice</button>
      </footer>

      {showTermsModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.78)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000000, padding: '1rem' }}>
          <div style={{ backgroundColor: theme.cardBg, color: theme.textMain, width: '100%', maxWidth: '620px', maxHeight: '90dvh', overflowY: 'auto', borderRadius: '14px', border: `1px solid ${theme.border}`, padding: 'clamp(1rem, 4vw, 1.75rem)', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Terms of Service & User Notice</h2>
              <button type="button" onClick={() => setShowTermsModal(false)} aria-label="Close user notice" style={{ background: 'transparent', border: 'none', color: theme.textMain, cursor: 'pointer', fontSize: '1.2rem', padding: '0.4rem' }}>✕</button>
            </div>
            <p style={{ color: theme.textMuted, fontSize: '0.9rem', lineHeight: 1.6 }}>North Synapse is a student learning-community prototype. Please read these guidelines before using the platform.</p>
            <ol style={{ paddingLeft: '1.3rem', lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              <li><strong>Academic purpose:</strong> Share learning notes, resources, and constructive academic discussion.</li>
              <li><strong>Respect others:</strong> Do not harass, threaten, discriminate against, impersonate, or reveal another person’s private information.</li>
              <li><strong>Share responsibly:</strong> Only upload content you created or have permission to share. Respect copyright and school rules.</li>
              <li><strong>Appropriate content:</strong> Do not post illegal, dangerous, hateful, sexually explicit, or otherwise inappropriate material.</li>
              <li><strong>Privacy:</strong> Never publish passwords, home addresses, phone numbers, student numbers, or other sensitive information.</li>
              <li><strong>Accuracy and attribution:</strong> Credit original authors and do not present someone else’s work as your own.</li>
              <li><strong>Prototype limitation:</strong> This version stores account and profile data in this browser. It is not a production-grade secure account system; avoid entering confidential information.</li>
            </ol>
            <button type="button" onClick={() => setShowTermsModal(false)} style={{ width: '100%', marginTop: '1rem', backgroundColor: theme.accent, color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', minHeight: '44px' }}>I Understand</button>
          </div>
        </div>
      )}

      {/* 预览与学术引用弹窗 */}
      {previewResource && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999999, padding: '0.6rem', boxSizing: 'border-box' }}>
          <div style={{ backgroundColor: theme.cardBg, borderRadius: '16px', width: '100%', maxWidth: '960px', height: '90dvh', border: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '1.2rem 2rem', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>{previewResource.title}</h2>
              <button onClick={() => setPreviewResource(null)} style={{ background: 'none', border: 'none', color: theme.textMain, cursor: 'pointer', fontSize: '1.4rem' }}>X</button>
            </div>

            <div className="ns-resource-preview-body" style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
              <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', borderRight: `1px solid ${theme.border}` }}>
                <div style={{ fontSize: '0.95rem', lineHeight: '1.7', overflowWrap: 'anywhere', marginBottom: '1.25rem' }} dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(previewResource.content || '') }} />
                {!!previewResource.attachments?.length && <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginBottom: '1.5rem' }}><h3 style={{ margin: 0 }}>Attachments & links</h3>{previewResource.attachments.map((file, index) => {
                  const isPdf = file.type === 'application/pdf' || /\.pdf(?:$|\?)/i.test(file.url);
                  const driveMatch = file.url.match(/drive\.google\.com\/file\/d\/([^/]+)/i);
                  const docsMatch = file.url.match(/docs\.google\.com\/(document|spreadsheets|presentation)\/d\/([^/]+)/i);
                  const embedUrl = driveMatch ? `https://drive.google.com/file/d/${driveMatch[1]}/preview` : docsMatch ? `https://docs.google.com/${docsMatch[1]}/d/${docsMatch[2]}/preview` : file.url;
                  const canEmbed = (file.url.startsWith('data:') && isPdf) || /^https?:\/\//i.test(file.url);
                  return <div key={`${file.name}-${index}`} style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                    <a href={file.url} target="_blank" rel="noreferrer" download={file.url.startsWith('data:') ? file.name : undefined} style={{ color: theme.accent, overflowWrap: 'anywhere' }}>📎 {file.name} · Open in new tab</a>
                    {file.type.startsWith('image/') && file.url && <img src={file.url} alt={file.name} style={{ maxWidth: '100%', maxHeight: 420, objectFit: 'contain', borderRadius: 8 }} />}
                    {canEmbed && ((isPdf && file.url.startsWith('data:')) || /^https?:\/\//i.test(file.url)) && <iframe title={`Preview: ${file.name}`} src={embedUrl} loading="lazy" style={{ width: '100%', height: '520px', border: `1px solid ${theme.border}`, borderRadius: '8px', background: '#fff' }} sandbox="allow-scripts allow-same-origin allow-forms allow-popups" />}
                    {!canEmbed && <p style={{ color: theme.textMuted, fontSize: '0.85rem' }}>This file can be opened in a new tab.</p>}
                  </div>;
                })}</div>}


              </div>

              <div className="ns-resource-comments" style={{ width: '360px', backgroundColor: theme.bg, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 'bold' }}>Comments ({previewResource.comments.length})</h3>
                <form onSubmit={handleAddComment} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <textarea rows={3} placeholder="Write a comment..." value={newCommentText} onChange={(e) => setNewCommentText(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.cardBg, color: theme.textMain, boxSizing: 'border-box' }} />
                  <button type="submit" style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.5rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', alignSelf: 'flex-end' }}>Post Comment</button>
                </form>

                {previewResource.comments.map((c) => (
                  <div key={c.id} style={{ backgroundColor: theme.cardBg, padding: '0.8rem', borderRadius: '8px', border: `1px solid ${theme.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {c.authorEmail ? <button type="button" onClick={() => openPublicProfile(c.authorName, c.authorEmail)} style={{ color: theme.textMain, background: 'none', border: 0, padding: 0, cursor: 'pointer', textDecoration: 'none', font: 'inherit' }}>{c.authorName}</button> : <span>{c.authorName}</span>}
                      <span style={{ color: theme.textMuted, fontSize: '0.72rem' }}>{c.date}</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', marginTop: '0.3rem' }}>{c.text}</p>
                    {(isAdmin || user?.email?.toLowerCase() === c.authorEmail?.toLowerCase()) && <button type="button" onClick={() => handleDeleteResourceComment(previewResource.id, c.id)} style={{ marginTop: '0.25rem', marginLeft: '0.4rem', padding: '0.25rem 0.5rem', borderRadius: '6px', border: `1px solid ${theme.border}`, background: 'transparent', color: '#EF4444', cursor: 'pointer', fontSize: '0.8rem' }}>Delete</button>}
                    {!isAdmin && <button type="button" onClick={() => handleLikeResourceComment(previewResource.id, c.id)} aria-label={c.likedByMe ? 'Unlike comment' : 'Like comment'} style={{ marginTop: '0.25rem', padding: '0.25rem 0.5rem', borderRadius: '6px', border: `1px solid ${theme.border}`, background: c.likedByMe ? 'rgba(139,92,246,0.14)' : 'transparent', color: c.likedByMe ? theme.accent : theme.textMuted, cursor: 'pointer', fontSize: '0.8rem' }}>
                      {c.likedByMe ? '♥ Liked' : '♡ Like'} · {c.likes || 0}
                    </button>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 讨论回复弹窗 */}
      {selectedDiscussion && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999999 }}>
          <div style={{ backgroundColor: theme.cardBg, borderRadius: '16px', width: '90%', maxWidth: '680px', maxHeight: '80vh', border: `1px solid ${theme.border}`, padding: '2rem', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>{selectedDiscussion.title}</h2>
              <button onClick={() => setSelectedDiscussion(null)} style={{ background: 'none', border: 'none', color: theme.textMain, cursor: 'pointer', fontSize: '1.2rem' }}>X</button>
            </div>

            <p style={{ fontSize: '0.95rem', marginBottom: '1.5rem', whiteSpace: 'pre-wrap' }}>{selectedDiscussion.content}</p>

            <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: '1rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem' }}>Replies ({selectedDiscussion.repliesCount})</h3>

              {!isAdmin && <form onSubmit={handleAddDiscussionReply} style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.5rem' }}>
                <input type="text" placeholder="Write a reply..." value={newReplyText} onChange={(e) => setNewReplyText(e.target.value)} style={{ flex: 1, padding: '0.6rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain }} />
                <button type="submit" style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Reply</button>
              </form>}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {selectedDiscussion.replies.map(r => (
                  <div key={r.id} style={{ backgroundColor: theme.bg, padding: '0.8rem', borderRadius: '8px', border: `1px solid ${theme.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                      {r.authorEmail ? <button type="button" onClick={() => openPublicProfile(r.authorName, r.authorEmail)} style={{ fontSize: '0.85rem', color: theme.textMain, background: 'none', border: 0, padding: 0, cursor: 'pointer', textDecoration: 'none', font: 'inherit' }}>{r.authorName}</button> : <span style={{ fontSize: '0.85rem' }}>{r.authorName}</span>}
                      <span style={{ fontSize: '0.75rem', color: theme.textMuted }}>{r.date}</span>
                    </div>
                    <p style={{ fontSize: '0.85rem' }}>{r.text}</p>
                    {(isAdmin || user?.email?.toLowerCase() === r.authorEmail?.toLowerCase()) && <button type="button" onClick={() => handleDeleteDiscussionReply(selectedDiscussion.id, r.id)} style={{ marginTop: '0.25rem', marginLeft: '0.4rem', padding: '0.25rem 0.5rem', borderRadius: '6px', border: `1px solid ${theme.border}`, background: 'transparent', color: '#EF4444', cursor: 'pointer', fontSize: '0.8rem' }}>Delete</button>}
                    {!isAdmin && <button type="button" onClick={() => handleLikeDiscussionReply(selectedDiscussion.id, r.id)} aria-label={r.likedByMe ? 'Unlike reply' : 'Like reply'} style={{ marginTop: '0.25rem', padding: '0.25rem 0.5rem', borderRadius: '6px', border: `1px solid ${theme.border}`, background: r.likedByMe ? 'rgba(139,92,246,0.14)' : 'transparent', color: r.likedByMe ? theme.accent : theme.textMuted, cursor: 'pointer', fontSize: '0.8rem' }}>
                      {r.likedByMe ? '♥ Liked' : '♡ Like'} · {r.likes || 0}
                    </button>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 登录/注册弹窗 */}
      {showAuthModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999999 }}>
          <div style={{ backgroundColor: theme.cardBg, padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '420px', border: `1px solid ${theme.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2>{isSignUp ? 'Sign Up' : 'Sign In'}</h2>
              <button onClick={() => setShowAuthModal(false)} style={{ background: 'none', border: 'none', color: theme.textMain, cursor: 'pointer' }}>X</button>
            </div>

            <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: theme.textMuted, marginBottom: '0.3rem' }}>Email</label>
                <input type="email" required placeholder="student@tdsb.ca" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain, boxSizing: 'border-box' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: theme.textMuted, marginBottom: '0.3rem' }}>Password</label>
                <input type="password" required placeholder="••••••••" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain, boxSizing: 'border-box' }} />
              </div>

              {isSignUp && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.8rem', color: theme.textMuted }}>
                    <input type="checkbox" required checked={isStudentConfirmed} onChange={(e) => setIsStudentConfirmed(e.target.checked)} /> Confirm Student/Alumni
                  </label>
                  <label style={{ fontSize: '0.8rem', color: theme.textMuted, display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                    <input type="checkbox" required checked={hasAgreedTerms} onChange={(e) => setHasAgreedTerms(e.target.checked)} /> I agree to the Terms of Service. <button type="button" onClick={() => setShowTermsModal(true)} style={{ color: theme.accent, border: 0, background: 'transparent', padding: 0, cursor: 'pointer', textDecoration: 'underline' }}>What does this mean?</button>
                  </label>
                </div>
              )}

              <button type="submit" disabled={loading} style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.75rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
              </button>
            </form>

            <p onClick={() => setIsSignUp(!isSignUp)} style={{ color: theme.accent, marginTop: '1rem', cursor: 'pointer', textAlign: 'center', fontSize: '0.85rem' }}>
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </p>
          </div>
        </div>
      )}

      {/* 编辑资料与注销弹窗 */}
      {showEditProfileModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999999 }}>
          <div style={{ backgroundColor: theme.cardBg, padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '480px', border: `1px solid ${theme.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
              <h2>Edit Profile</h2>
              <button onClick={() => setShowEditProfileModal(false)} style={{ background: 'none', border: 'none', color: theme.textMain, cursor: 'pointer' }}>X</button>
            </div>

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <input type="file" ref={fileInputRef} accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
                <button type="button" onClick={() => fileInputRef.current?.click()} style={{ padding: '0.5rem 1rem', borderRadius: '6px', backgroundColor: theme.bg, border: `1px solid ${theme.border}`, color: theme.textMain, cursor: 'pointer' }}>
                  {avatarUrl ? 'Change Avatar' : 'Upload Avatar'}
                </button>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: theme.textMuted, marginBottom: '0.3rem' }}>Username</label>
                <input type="text" required minLength={USERNAME_MIN} maxLength={USERNAME_MAX} value={username} onChange={(e) => setUsername(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain, boxSizing: 'border-box' }} />
          <p style={{ color: theme.textMuted, fontSize: '0.75rem', margin: '0.3rem 0 0' }}>3–30 characters. Letters, numbers, spaces, and common symbols are allowed.</p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: theme.textMuted, marginBottom: '0.3rem' }}>Nickname</label>
                <input type="text" required minLength={NICKNAME_MIN} maxLength={NICKNAME_MAX} value={nickname} onChange={(e) => setNickname(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain, boxSizing: 'border-box' }} />
          <p style={{ color: theme.textMuted, fontSize: '0.75rem', margin: '0.3rem 0 0' }}>2–24 characters. Nicknames do not have to be unique.</p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: theme.textMuted, marginBottom: '0.3rem' }}>Grade (optional)</label>
                <select value={grade} onChange={(e) => setGrade(e.target.value)} style={{ width: '100%', padding: '0.7rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain, boxSizing: 'border-box' }}>
                  <option value="">Prefer not to specify</option>
                  <option value="Grade 9">Grade 9</option>
                  <option value="Grade 10">Grade 10</option>
                  <option value="Grade 11">Grade 11</option>
                  <option value="Grade 12">Grade 12</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: theme.textMuted, marginBottom: '0.3rem' }}>Gender (optional)</label>
                <select value={gender} onChange={(e) => setGender(e.target.value)} style={{ width: '100%', padding: '0.7rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain, boxSizing: 'border-box' }}>
                  <option value="">Prefer not to specify</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                  <option value="Self-describe">Self-describe</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: theme.textMuted, marginBottom: '0.3rem' }}>Bio (optional)</label>
                <textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain, boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                <button type="submit" style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.7rem 1.5rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Save Profile
                </button>
                <button type="button" onClick={handleDeleteAccount} style={{ backgroundColor: 'transparent', border: '1px solid #EF4444', color: '#EF4444', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
                  Delete Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 发布资源弹窗 */}
      {showCreateResourceModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999999 }}>
          <div style={{ backgroundColor: theme.cardBg, padding: 'clamp(1rem, 4vw, 2rem)', borderRadius: '12px', width: '100%', maxWidth: '540px', maxHeight: '92dvh', overflowY: 'auto', boxSizing: 'border-box', border: `1px solid ${theme.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
              <h2>Share Resource Note</h2>
              <button onClick={() => setShowCreateResourceModal(false)} style={{ background: 'none', border: 'none', color: theme.textMain, cursor: 'pointer' }}>X</button>
            </div>

            <form onSubmit={handleCreateResourceSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input type="text" required placeholder="Title" value={newResTitle} onChange={(e) => setNewResTitle(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain, boxSizing: 'border-box' }} />
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 700 }}>Note content</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', padding: '0.55rem', border: `1px solid ${theme.border}`, borderBottom: 0, borderRadius: '8px 8px 0 0', background: theme.bg }}>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { richEditorRef.current?.focus(); document.execCommand('bold'); }} style={{ padding: '0.4rem 0.65rem', fontWeight: 800, borderRadius: 5, border: `1px solid ${theme.border}`, background: theme.cardBg, color: theme.textMain }}>B</button>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { richEditorRef.current?.focus(); document.execCommand('italic'); }} style={{ padding: '0.4rem 0.65rem', fontStyle: 'italic', borderRadius: 5, border: `1px solid ${theme.border}`, background: theme.cardBg, color: theme.textMain }}>I</button>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { richEditorRef.current?.focus(); document.execCommand('underline'); }} style={{ padding: '0.4rem 0.65rem', textDecoration: 'underline', borderRadius: 5, border: `1px solid ${theme.border}`, background: theme.cardBg, color: theme.textMain }}>U</button>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem', color: theme.textMain }}>Text colour <input aria-label="Text colour" type="color" defaultValue="#8B5CF6" onChange={(e) => { richEditorRef.current?.focus(); document.execCommand('foreColor', false, e.target.value); }} style={{ width: 32, height: 30, padding: 0, border: 0, background: 'transparent' }} /></label>
                </div>
                <div ref={richEditorRef} contentEditable suppressContentEditableWarning onInput={(e) => { const html = sanitizeRichHtml(e.currentTarget.innerHTML); setRichContentHtml(html); setNewResContent(e.currentTarget.innerText); }} data-placeholder="Write your notes here…" style={{ minHeight: 150, maxHeight: 360, overflowY: 'auto', padding: '0.8rem', border: `1px solid ${theme.border}`, borderRadius: '0 0 8px 8px', outline: 'none', color: theme.textMain, background: theme.bg, overflowWrap: 'anywhere' }} />
                <p style={{ fontSize: '0.75rem', color: theme.textMuted, margin: '0.4rem 0 0' }}>Select text to apply colour, bold, italic or underline. Rich formatting is saved with the note.</p>
              </div>
              <div style={{ border: `1px solid ${theme.border}`, borderRadius: 8, padding: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <strong>Tags (optional)</strong>
                <span style={{ fontSize: '0.78rem', color: theme.textMuted }}>Choose one or more grade levels and subjects, just like the Resource Hub filters.</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                  {resourceTagOptions.map(tag => <button key={tag} type="button" onClick={() => setSelectedResourceTags(previous => previous.includes(tag) ? previous.filter(item => item !== tag) : [...previous, tag])} style={{ padding: '0.4rem 0.65rem', borderRadius: 18, border: `1px solid ${selectedResourceTags.includes(tag) ? theme.accent : theme.border}`, background: selectedResourceTags.includes(tag) ? theme.accent : theme.bg, color: selectedResourceTags.includes(tag) ? '#FFF' : theme.textMain, cursor: 'pointer', fontSize: '0.82rem' }}>{tag}</button>)}
                </div>
              </div>
              <div style={{ border: `1px solid ${theme.border}`, borderRadius: 8, padding: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <strong>Attachments (optional)</strong>
                <input ref={resourceFilesRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.txt,.csv,.xls,.xlsx" onChange={handleResourceFileSelection} style={{ display: 'none' }} />
                <button type="button" onClick={() => resourceFilesRef.current?.click()} style={{ alignSelf: 'flex-start', padding: '0.55rem 0.9rem', borderRadius: 7, border: `1px solid ${theme.border}`, background: theme.bg, color: theme.textMain, cursor: 'pointer' }}>Choose files</button>
                {resourceAttachments.length > 0 && <ul style={{ margin: 0, paddingLeft: '1.2rem', color: theme.textMuted, fontSize: '0.82rem' }}>{resourceAttachments.map((file, index) => <li key={`${file.name}-${index}`}>{file.name}</li>)}</ul>}
                <p style={{ color: theme.textMuted, fontSize: '0.75rem', margin: 0 }}>Images, PDF, Word and PowerPoint files up to 20 MB each can be attached directly. For larger files, use a share link.</p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}><input type="url" value={driveResourceUrl} onChange={(e) => setDriveResourceUrl(e.target.value)} placeholder="Google Drive / Docs / Slides share URL" style={{ flex: '1 1 220px', minWidth: 0, padding: '0.65rem', borderRadius: 6, border: `1px solid ${theme.border}`, background: theme.bg, color: theme.textMain }} /><button type="button" onClick={addDriveLink} style={{ padding: '0.65rem 0.9rem', borderRadius: 6, border: 0, background: theme.accent, color: '#fff', cursor: 'pointer' }}>Add link</button></div>
                {resourceAttachments.map((file, index) => <div key={`${file.name}-${index}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}><span style={{ flex: 1, overflowWrap: 'anywhere', fontSize: '0.85rem' }}>📎 {file.name}</span><button type="button" onClick={() => setResourceAttachments((previous) => previous.filter((_, i) => i !== index))} style={{ border: 0, background: 'transparent', color: '#EF4444', cursor: 'pointer' }}>Remove</button></div>)}
              </div>
              <button type="submit" style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.75rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Publish Note</button>
            </form>
          </div>
        </div>
      )}

      {/* 发起讨论弹窗 */}
      {showCreateDiscussionModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999999 }}>
          <div style={{ backgroundColor: theme.cardBg, padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '480px', border: `1px solid ${theme.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
              <h2>Start Discussion</h2>
              <button onClick={() => setShowCreateDiscussionModal(false)} style={{ background: 'none', border: 'none', color: theme.textMain, cursor: 'pointer' }}>X</button>
            </div>

            <form onSubmit={handleCreateDiscussionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input type="text" required placeholder="Topic Title" value={newDiscTitle} onChange={(e) => setNewDiscTitle(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain, boxSizing: 'border-box' }} />
              <textarea required rows={4} placeholder="Content" value={newDiscContent} onChange={(e) => setNewDiscContent(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain, boxSizing: 'border-box' }} />
              <button type="submit" style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.75rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Post Topic</button>
            </form>
          </div>
        </div>
      )}


      {/* 公开个人主页：只显示用户公开资料，不显示邮箱 */}
      {publicProfile && (
        <div onClick={() => setPublicProfile(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000002, padding: '1rem' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, maxHeight: '85dvh', overflowY: 'auto', background: theme.cardBg, color: theme.textMain, border: `1px solid ${theme.border}`, borderRadius: 16, padding: 'clamp(1rem, 4vw, 1.6rem)', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}><h2 style={{ margin: 0 }}>Student Profile</h2><button type="button" onClick={() => setPublicProfile(null)} aria-label="Close profile" style={{ border: 0, background: 'transparent', color: theme.textMain, fontSize: '1.25rem', cursor: 'pointer' }}>✕</button></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.2rem 0' }}>
              {publicProfile.avatarUrl ? <img src={publicProfile.avatarUrl} alt="Profile avatar" style={{ width: 76, height: 76, objectFit: 'cover', borderRadius: '50%' }} /> : <div style={{ width: 76, height: 76, borderRadius: '50%', display: 'grid', placeItems: 'center', background: theme.bg, fontSize: '1.7rem' }}>👤</div>}
              <div><h3 style={{ margin: 0 }}>{publicProfile.nickname || publicProfile.username || 'Student'}</h3><p style={{ color: theme.textMuted, margin: '0.25rem 0' }}>@{publicProfile.username || 'student'}</p></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.7rem' }}>
              <div style={{ background: theme.bg, borderRadius: 9, padding: '0.8rem' }}><small style={{ color: theme.textMuted }}>Grade</small><div>{publicProfile.grade || 'Not specified'}</div></div>
              <div style={{ background: theme.bg, borderRadius: 9, padding: '0.8rem' }}><small style={{ color: theme.textMuted }}>Gender</small><div>{publicProfile.gender && publicProfile.gender !== 'Prefer not to say' ? publicProfile.gender : 'Not specified'}</div></div>
              <div style={{ background: theme.bg, borderRadius: 9, padding: '0.8rem' }}><small style={{ color: theme.textMuted }}>Joined</small><div>{publicProfile.createdAt || 'Not available'}</div></div>
              <div style={{ background: theme.bg, borderRadius: 9, padding: '0.8rem' }}><small style={{ color: theme.textMuted }}>Platform time</small><div>{Math.floor((Number(publicProfile.totalStudySeconds) || 0) / 3600)}h {Math.floor(((Number(publicProfile.totalStudySeconds) || 0) % 3600) / 60)}m</div></div>
            </div>
            <div style={{ marginTop: '1rem' }}><strong>About</strong><p style={{ color: theme.textMuted, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{publicProfile.bio || 'This student has not added a bio yet.'}</p></div>
            <p style={{ color: theme.textMuted, fontSize: '0.75rem' }}>Email addresses are private and are not shown on public profiles.</p>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          /* 在窄屏设备上保持公告标题清晰可读。 */
          .ns-notice-banner {
            padding: 0 0.55rem !important;
            gap: 0.4rem !important;
            height: 48px !important;
          }

          .ns-notice-count {
            font-size: 0.58rem !important;
            padding: 0.22rem 0.35rem !important;
          }

          .ns-notice-title {
            font-size: 0.68rem !important;
            white-space: normal !important;
            line-height: 1.2 !important;
            overflow: hidden !important;
            display: -webkit-box !important;
            -webkit-line-clamp: 2 !important;
            -webkit-box-orient: vertical !important;
          }

          .ns-notice-date,
          .ns-notice-viewall {
            display: none !important;
          }

          * {
            min-width: 0;
          }

          header {
            box-sizing: border-box !important;
            width: 100% !important;
            padding: 0.85rem 1rem !important;
            gap: 0.75rem !important;
            flex-wrap: wrap !important;
          }

          header > div:first-child {
            flex: 0 1 auto !important;
            gap: 0.45rem !important;
            font-size: 1.05rem !important;
          }

          /* 登录/注册入口在手机端固定靠右，品牌区域可收缩以避免挤压按钮。 */
          .ns-header-actions {
            margin-left: auto !important;
            flex: 0 0 auto !important;
            justify-content: flex-end !important;
          }

          header > div:first-child svg {
            width: 25px !important;
            flex-shrink: 0 !important;
          }

          header nav {
            order: 3 !important;
            flex: 1 1 100% !important;
            width: 100% !important;
            max-width: 100% !important;
            gap: 1.1rem !important;
            overflow-x: auto !important;
            white-space: nowrap !important;
            scrollbar-width: none;
            padding: 0.15rem 0 0.35rem !important;
          }

          header nav::-webkit-scrollbar {
            display: none;
          }

          header nav button {
            flex-shrink: 0 !important;
            white-space: nowrap !important;
            font-size: 0.82rem !important;
          }

          header > div:last-child {
            gap: 0.45rem !important;
            flex: 0 1 auto !important;
          }

          header > div:last-child button {
            padding: 0.5rem 0.65rem !important;
            white-space: nowrap !important;
            font-size: 0.78rem !important;
          }

          header > div:last-child span {
            max-width: 5.5rem !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            white-space: nowrap !important;
          }

          main {
            box-sizing: border-box !important;
            width: 100% !important;
            max-width: 1080px !important;
            padding: 1rem !important;
            margin: 0 auto !important;
          }

          main > div:first-child {
            max-width: 100% !important;
          }

          main > div:first-child > div:first-child {
            box-sizing: border-box !important;
            width: 100% !important;
            padding: 0 0.75rem !important;
            gap: 0.5rem !important;
          }

          main h1 {
            font-size: 1.65rem !important;
            line-height: 1.2 !important;
            overflow-wrap: anywhere !important;
          }

          main input,
          main select,
          main textarea {
            max-width: 100% !important;
          }

          main > div > div {
            box-sizing: border-box;
          }

          main button {
            max-width: 100%;
          }

          /* 资源中心标题与分享按钮 */
          main > div > div:first-child {
            gap: 1rem !important;
          }

          /* 资源卡片及其信息自动换行，避免溢出 */
          main > div > div > div {
            min-width: 0;
          }

          main [style*="justify-content: space-between"] {
            flex-wrap: wrap !important;
            gap: 0.65rem !important;
          }

          /* 弹窗适配手机屏幕 */
          [style*="position: fixed"][style*="width: 100vw"] {
            box-sizing: border-box !important;
            padding: 0.65rem !important;
            align-items: center !important;
          }

          [style*="max-width: 960px"] {
            box-sizing: border-box !important;
            width: 100% !important;
            height: 92dvh !important;
            max-height: 92dvh !important;
          }

          [style*="max-width: 960px"] > div:first-child {
            padding: 0.85rem 1rem !important;
            gap: 0.5rem !important;
          }

          [style*="max-width: 960px"] > div:first-child h2 {
            font-size: 1rem !important;
            overflow-wrap: anywhere !important;
          }

          [style*="max-width: 960px"] > div:nth-child(2) {
            flex-direction: column !important;
            overflow-y: auto !important;
          }

          [style*="max-width: 960px"] > div:nth-child(2) > div {
            box-sizing: border-box !important;
            width: 100% !important;
            flex: 0 0 auto !important;
            padding: 1rem !important;
            border-right: none !important;
          }

          [style*="max-width: 680px"] {
            box-sizing: border-box !important;
            width: 100% !important;
            max-height: 92dvh !important;
            padding: 1.1rem !important;
          }

          [style*="max-width: 420px"],
          [style*="max-width: 480px"] {
            box-sizing: border-box !important;
            width: 100% !important;
            max-height: 92dvh !important;
            overflow-y: auto !important;
            padding: 1.2rem !important;
          }
        }
        @media (max-width: 600px) { .ns-profile-stats { grid-template-columns: minmax(0, 1fr) !important; } .ns-profile-card > button { width: 100% !important; } }

          @media (max-width: 700px) {
            .ns-resource-preview-body { flex-direction: column !important; overflow-y: auto !important; }
            .ns-resource-preview-body > div:first-child { overflow: visible !important; border-right: 0 !important; border-bottom: 1px solid var(--ns-border, #333) !important; padding: 1rem !important; }
            .ns-resource-comments { width: auto !important; max-width: 100% !important; padding: 1rem !important; overflow: visible !important; }
          }
      `}</style>

    </div>
  );
}


