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
  authorAvatar: string;
  date: string;
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
  authorName: string;
  date: string;
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

  const [newDiscTitle, setNewDiscTitle] = useState('');
  const [newDiscContent, setNewDiscContent] = useState('');

  // 自习室与番茄钟
  const [joinedRoom, setJoinedRoom] = useState<LoungeRoom | null>(null);
  const [pomodoroTime, setPomodoroTime] = useState(1500); // 25 分钟
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // 反馈与引用格式
  const [feedbackCategory, setFeedbackCategory] = useState('General Suggestion');
  const [feedbackComment, setFeedbackComment] = useState('');
  const [citationFormat, setCitationFormat] = useState<'APA' | 'IEEE' | 'MLA' | 'BibTeX'>('APA');

  // 本地持久化数据读取
  const [resources, setResources] = useState<ResourceItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ns_resources');
      if (saved) {
        try { return JSON.parse(saved); } catch (_) {}
      }
    }
    return [
      {
        id: '1',
        title: 'AP Calculus BC Derivatives & Series Master Review',
        subject: 'Mathematics',
        grade: 'AP Courses',
        description: 'Comprehensive prep guide covering AP exam series convergence tests, Taylor polynomials, and parametric equations.',
        content: 'Detailed derivatives rules:\n(1) Product Rule: (uv)\' = u\'v + uv\'.\n(2) Quotient Rule: (u/v)\' = (u\'v - uv\') / v^2.\n\nTaylor Series Expansion for e^x = 1 + x + x^2/2! + x^3/3! + ... Make sure to practice ratio tests for interval of convergence!',
        authorName: 'Alex Smith',
        authorEmail: 'alex.smith@tdsb.ca',
        authorAvatar: '',
        date: 'Oct 24, 2026',
        likes: 12,
        bookmarks: 8,
        likedByMe: false,
        bookmarkedByMe: false,
        comments: [
          { id: 'c1', authorName: 'Jordan Lee', authorAvatar: '', text: 'This saved my midterm review! Thanks!', date: 'Oct 24, 2026', likes: 3, likedByMe: false }
        ]
      },
      {
        id: '2',
        title: 'Waterloo Fermat Math Competition Past Solutions',
        subject: 'Mathematics',
        grade: 'Academic Competitions',
        description: 'Step-by-step solutions for past Waterloo contest papers with key shortcut tricks.',
        content: 'Key geometry theorem: In any right triangle, a^2 + b^2 = c^2.\nFor modular arithmetic problems, always check remainder patterns mod 10 for unit digits!',
        authorName: 'Jordan Lee',
        authorEmail: 'jordan.lee@tdsb.ca',
        authorAvatar: '',
        date: 'Oct 23, 2026',
        likes: 19,
        bookmarks: 14,
        likedByMe: false,
        bookmarkedByMe: false,
        comments: []
      }
    ];
  });

  const [discussions, setDiscussions] = useState<DiscussionItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ns_discussions');
      if (saved) {
        try { return JSON.parse(saved); } catch (_) {}
      }
    }
    return [
      {
        id: 'd1',
        title: 'How to prepare effectively for Grade 12 Physics contest?',
        content: 'Looking for study recommendations and resources for kinematics and mechanics problems.',
        authorEmail: 'student@tdsb.ca',
        authorName: 'Alex Student',
        date: 'Oct 24, 2026',
        repliesCount: 1,
        replies: [
          { id: 'r1', authorName: 'Alex Smith', authorAvatar: '', text: 'Focus on past AAPT Physics Bowl and SIN contest problems!', date: 'Oct 24, 2026', likes: 2 }
        ]
      }
    ];
  });

  const [lounges] = useState<LoungeRoom[]>([
    { id: 'l1', name: 'AP Calculus & Advanced Math Focus', subject: 'Mathematics', activeUsers: 8, description: 'Silent study & problem solving for AP Calculus and Fermat/Euclid contest prep.' },
    { id: 'l2', name: 'Grade 11 & 12 Physics / Chemistry Lab', subject: 'Science', activeUsers: 5, description: 'Discussion & peer review for physics problem sets and chemistry labs.' },
    { id: 'l3', name: 'Computer Science & Algorithmic Practice', subject: 'Computer Science & Tech', activeUsers: 12, description: 'CCC Contest coding practice and Python/Java algorithm discussions.' }
  ]);

  const [announcements] = useState<AnnouncementItem[]>([
    { id: '1', title: 'Welcome to North Synapse Academic Platform', content: 'A centralized workspace for verified course resources, virtual study rooms, and academic peer discussions.', date: 'Oct 24, 2026', authorName: 'North Synapse Official' },
    { id: '2', title: 'AP & Competition Prep Resource Categories Added', content: 'We updated our Resource Hub filter tags with AP Courses, Academic Competitions, French, and Geography!', date: 'Oct 24, 2026', authorName: 'North Synapse Official' }
  ]);

  const [previewResource, setPreviewResource] = useState<ResourceItem | null>(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [selectedDiscussion, setSelectedDiscussion] = useState<DiscussionItem | null>(null);
  const [newReplyText, setNewReplyText] = useState('');
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

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
      else setIsAdmin(data === true);
    });
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

        const { error: saveError } = await supabase
          .from('profiles')
          .update({ total_study_seconds: totalSeconds })
          .eq('id', userId);

        if (saveError) {
          console.error('Unable to save study time:', saveError.message);
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
    // 保存前检查用户名和昵称，防止空白、超长或包含控制字符的内容
    const cleanUsername = normalizeName(username);
    const cleanNickname = normalizeName(nickname);
    const usernameError = validateUsername(cleanUsername);
    if (usernameError) {
      alert(usernameError);
      return;
    }
    const nicknameError = validateNickname(cleanNickname);
    if (nicknameError) {
      alert(nicknameError);
      return;
    }

    const updatedUser = {
      ...user,
      username: cleanUsername,
      nickname: cleanNickname,
      grade: grade,
      gender: gender,
      bio: bio.trim(),
      avatarUrl: avatarUrl
    };

    // 将基础个人资料写入 Supabase Auth 用户元数据，避免只保存在当前浏览器。
    // 头像若为 base64 暂不写入元数据，后续应改用 Supabase Storage。
    const { error } = await supabase.auth.updateUser({
      data: {
        username: updatedUser.username,
        nickname: updatedUser.nickname,
        grade: updatedUser.grade,
        gender: updatedUser.gender,
        bio: updatedUser.bio,
        ...(updatedUser.avatarUrl?.startsWith('http') ? { avatarUrl: updatedUser.avatarUrl } : {})
      }
    });

    if (error) {
      alert('Could not save your profile to the server. Please try again.');
      return;
    }

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

  function handleDeleteAccount() {
    if (!window.confirm('Are you sure you want to delete this account? All local session data will be reset.')) return;

    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ns_user');
    }
    setShowEditProfileModal(false);
    setActiveTab('resources');
    alert('Account deleted and session cleared.');
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

  function openPublicProfile(name: string, email?: string) {
    let found: any = null;
    try {
      const accounts = JSON.parse(localStorage.getItem('ns_accounts') || '[]');
      if (Array.isArray(accounts)) {
        const account = accounts.find((item: any) =>
          (email && item.email?.toLowerCase() === email.toLowerCase()) ||
          item.profile?.username?.toLowerCase() === name.toLowerCase() ||
          item.profile?.nickname?.toLowerCase() === name.toLowerCase()
        );
        found = account?.profile || null;
      }
    } catch (_) {}
    if (!found && user && (user.email?.toLowerCase() === email?.toLowerCase() || user.username?.toLowerCase() === name.toLowerCase() || user.nickname?.toLowerCase() === name.toLowerCase())) found = user;
    setPublicProfile(found || { username: name, nickname: name, grade: '', gender: '', bio: '', avatarUrl: '', createdAt: '', totalStudySeconds: 0, resources: [], discussions: [] });
  }

  function handleResourceFileSelection(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      if (file.size > 2 * 1024 * 1024) {
        alert(`${file.name} is larger than 2 MB. For large files, upload it to Google Drive and paste a share link instead.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => setResourceAttachments((previous) => [...previous, { name: file.name, type: file.type || 'application/octet-stream', url: String(reader.result || '') }]);
      reader.readAsDataURL(file);
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

  function handleCreateResourceSubmit(e: React.FormEvent) {
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

    const newRes: ResourceItem = {
      id: Date.now().toString(),
      title: newResTitle.trim(),
      subject: newResSubject,
      grade: newResGrade,
      description: newResDescription.trim() || plainContent.slice(0, 90) + '...',
      content: editorHtml || plainContent,
      attachments: [...resourceAttachments],
      authorName: nickname || username || user.email.split('@')[0],
      authorEmail: user.email,
      authorAvatar: avatarUrl,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      likes: 0,
      bookmarks: 0,
      likedByMe: false,
      bookmarkedByMe: false,
      comments: []
    };

    setResources([newRes, ...resources]);
    setShowCreateResourceModal(false);
    setNewResTitle('');
    setNewResDescription('');
    setNewResContent('');
    setRichContentHtml('');
    setResourceAttachments([]);
    setDriveResourceUrl('');
    if (richEditorRef.current) richEditorRef.current.innerHTML = '';
    alert('Academic resource note published!');
  }

  function handleCreateDiscussionSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isAdmin) return;
    if (!user) {
      alert('Please sign in first.');
      setShowAuthModal(true);
      return;
    }
    if (!newDiscTitle.trim() || !newDiscContent.trim()) return;

    const newDisc: DiscussionItem = {
      id: 'd_' + Date.now(),
      title: newDiscTitle.trim(),
      content: newDiscContent.trim(),
      authorEmail: user.email,
      authorName: nickname || username || user.email.split('@')[0],
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      repliesCount: 0,
      replies: [],
      bookmarkedByMe: false,
      bookmarks: 0
    };

    setDiscussions([newDisc, ...discussions]);
    setShowCreateDiscussionModal(false);
    setNewDiscTitle('');
    setNewDiscContent('');
    alert('Discussion topic posted!');
  }

  function handleAddDiscussionReply(e: React.FormEvent) {
    e.preventDefault();
    if (isAdmin) return;
    if (!user) {
      alert('Please sign in to reply.');
      setShowAuthModal(true);
      return;
    }
    if (!newReplyText.trim() || !selectedDiscussion) return;

    const replyObj: CommentItem = {
      id: 'r_' + Date.now(),
      authorEmail: user.email,
      authorName: nickname || username || user.email.split('@')[0],
      authorAvatar: avatarUrl,
      text: newReplyText.trim(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      likes: 0
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

  function handleLikeResource(id: string, e?: React.MouseEvent) {
    e?.stopPropagation();
    if (isAdmin) return;
    setResources(prev => prev.map(res => {
      if (res.id === id) {
        const isLiked = res.likedByMe;
        return { ...res, likes: isLiked ? res.likes - 1 : res.likes + 1, likedByMe: !isLiked };
      }
      return res;
    }));
  }

  function handleBookmarkResource(id: string, e?: React.MouseEvent) {
    e?.stopPropagation();
    if (isAdmin) return;
    if (!user) {
      alert('Please sign in first to save notes to your profile.');
      setShowAuthModal(true);
      return;
    }
    setResources(prev => prev.map(res => {
      if (res.id === id) {
        const isBookmarked = res.bookmarkedByMe;
        return { ...res, bookmarks: isBookmarked ? res.bookmarks - 1 : res.bookmarks + 1, bookmarkedByMe: !isBookmarked };
      }
      return res;
    }));
  }

  function handleBookmarkDiscussion(id: string, e?: React.MouseEvent) {
    e?.stopPropagation();
    if (isAdmin) return;
    if (!user) {
      alert('Please sign in first to save discussions to your profile.');
      setShowAuthModal(true);
      return;
    }
    setDiscussions(prev => prev.map(d => {
      if (d.id !== id) return d;
      const isBookmarked = !!d.bookmarkedByMe;
      return { ...d, bookmarkedByMe: !isBookmarked, bookmarks: Math.max(0, (d.bookmarks || 0) + (isBookmarked ? -1 : 1)) };
    }));
    setSelectedDiscussion(prev => {
      if (!prev || prev.id !== id) return prev;
      const isBookmarked = !!prev.bookmarkedByMe;
      return { ...prev, bookmarkedByMe: !isBookmarked, bookmarks: Math.max(0, (prev.bookmarks || 0) + (isBookmarked ? -1 : 1)) };
    });
  }

  // 仅允许评论作者删除自己的评论，并同步更新笔记列表与当前预览。
  function handleDeleteResourceComment(resourceId: string, commentId: string) {
    const resource = resources.find(item => item.id === resourceId);
    const comment = resource?.comments.find(item => item.id === commentId);
    if (!user || !comment || comment.authorEmail?.toLowerCase() !== user.email?.toLowerCase()) return;
    if (!window.confirm('Delete this comment? This cannot be undone.')) return;
    const updateResource = (item: ResourceItem): ResourceItem => ({
      ...item,
      comments: item.comments.filter(entry => entry.id !== commentId)
    });
    setResources(prev => prev.map(item => item.id === resourceId ? updateResource(item) : item));
    setPreviewResource(prev => prev && prev.id === resourceId ? updateResource(prev) : prev);
  }

  // 仅允许回复作者删除自己的回复，并重新计算回复数量。
  function handleDeleteDiscussionReply(discussionId: string, replyId: string) {
    const discussion = discussions.find(item => item.id === discussionId);
    const reply = discussion?.replies.find(item => item.id === replyId);
    if (!user || !reply || reply.authorEmail?.toLowerCase() !== user.email?.toLowerCase()) return;
    if (!window.confirm('Delete this reply? This cannot be undone.')) return;
    const updateDiscussion = (item: DiscussionItem): DiscussionItem => {
      const replies = item.replies.filter(entry => entry.id !== replyId);
      return { ...item, replies, repliesCount: replies.length };
    };
    setDiscussions(prev => prev.map(item => item.id === discussionId ? updateDiscussion(item) : item));
    setSelectedDiscussion(prev => prev && prev.id === discussionId ? updateDiscussion(prev) : prev);
  }

  // 仅允许发布者删除自己的笔记或讨论主题。
  function handleDeleteResource(resourceId: string) {
    const resource = resources.find(item => item.id === resourceId);
    if (!user || !resource || resource.authorEmail?.toLowerCase() !== user.email?.toLowerCase()) return;
    if (!window.confirm('Delete this note? Its comments and attachments will also be removed.')) return;
    setResources(prev => prev.filter(item => item.id !== resourceId));
    setPreviewResource(prev => prev?.id === resourceId ? null : prev);
  }

  function handleDeleteDiscussion(discussionId: string) {
    const discussion = discussions.find(item => item.id === discussionId);
    if (!user || !discussion || discussion.authorEmail?.toLowerCase() !== user.email?.toLowerCase()) return;
    if (!window.confirm('Delete this discussion and all its replies? This cannot be undone.')) return;
    setDiscussions(prev => prev.filter(item => item.id !== discussionId));
    setSelectedDiscussion(prev => prev?.id === discussionId ? null : prev);
  }

  function handleLikeResourceComment(resourceId: string, commentId: string) {
    if (isAdmin) return;
    if (!user) {
      alert('Please sign in to like comments.');
      setShowAuthModal(true);
      return;
    }
    const updateResource = (resource: ResourceItem): ResourceItem => ({
      ...resource,
      comments: resource.comments.map(comment => {
        if (comment.id !== commentId) return comment;
        const liked = !!comment.likedByMe;
        return { ...comment, likedByMe: !liked, likes: Math.max(0, (comment.likes || 0) + (liked ? -1 : 1)) };
      })
    });
    setResources(prev => prev.map(resource => resource.id === resourceId ? updateResource(resource) : resource));
    setPreviewResource(prev => prev && prev.id === resourceId ? updateResource(prev) : prev);
  }

  function handleLikeDiscussionReply(discussionId: string, replyId: string) {
    if (isAdmin) return;
    if (!user) {
      alert('Please sign in to like replies.');
      setShowAuthModal(true);
      return;
    }
    const updateDiscussion = (discussion: DiscussionItem): DiscussionItem => ({
      ...discussion,
      replies: discussion.replies.map(reply => {
        if (reply.id !== replyId) return reply;
        const liked = !!reply.likedByMe;
        return { ...reply, likedByMe: !liked, likes: Math.max(0, (reply.likes || 0) + (liked ? -1 : 1)) };
      })
    });
    setDiscussions(prev => prev.map(discussion => discussion.id === discussionId ? updateDiscussion(discussion) : discussion));
    setSelectedDiscussion(prev => prev && prev.id === discussionId ? updateDiscussion(prev) : prev);
  }

  function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (isAdmin) return;
    if (!user) {
      alert('Please sign in to comment.');
      setShowAuthModal(true);
      return;
    }
    if (!newCommentText.trim() || !previewResource) return;

    const commentObj: CommentItem = {
      id: Date.now().toString(),
      authorEmail: user.email,
      authorName: nickname || username || user.email.split('@')[0],
      authorAvatar: avatarUrl,
      text: newCommentText.trim(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      likes: 0,
      likedByMe: false
    };

    const updatedResource = { ...previewResource, comments: [...previewResource.comments, commentObj] };
    setPreviewResource(updatedResource);
    setResources(prev => prev.map(r => r.id === previewResource.id ? updatedResource : r));
    setNewCommentText('');
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatarUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
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
    const matchesSubject = selectedSubjects.length === 0 || selectedSubjects.includes(res.subject);
    const matchesGrade = selectedGrades.length === 0 || selectedGrades.includes(res.grade);
    const matchesSearch = searchQuery === '' || res.title.toLowerCase().includes(searchQuery.toLowerCase()) || res.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesGrade && matchesSearch;
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
      <header style={{ borderBottom: `1px solid ${theme.border}`, padding: '1.2rem 3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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

        <nav style={{ display: 'flex', gap: '1.6rem' }}>
          {(['resources', 'lounges', 'announcements', 'discussions', 'feedback'] as NavTab[]).map((tab) => (
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
          {user && (
            <button onClick={() => setActiveTab('dashboard')} style={{ background: 'none', border: 'none', color: activeTab === 'dashboard' ? theme.accent : theme.textMuted, fontWeight: activeTab === 'dashboard' ? '700' : '500', cursor: 'pointer', fontSize: '0.95rem', borderBottom: activeTab === 'dashboard' ? `2px solid ${theme.accent}` : '2px solid transparent' }}>
              Dashboard
            </button>
          )}
          {isAdmin && <button onClick={() => setActiveTab('admin')} style={{ background: 'none', border: 'none', color: activeTab === 'admin' ? theme.accent : theme.textMuted, fontWeight: activeTab === 'admin' ? '700' : '500', cursor: 'pointer', fontSize: '0.95rem', borderBottom: activeTab === 'admin' ? `2px solid ${theme.accent}` : '2px solid transparent' }}>Admin</button>}
        </nav>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button onClick={() => setIsDarkMode(!isDarkMode)} style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: `1px solid ${theme.border}`, backgroundColor: theme.cardBg, color: theme.textMain, cursor: 'pointer', fontSize: '0.85rem' }}>
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </button>

          {user ? (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <span onClick={() => setActiveTab('dashboard')} style={{ fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer', color: theme.accent }}>
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredResources.map((res) => (
                <div key={res.id} onClick={() => setPreviewResource(res)} style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '1.5rem', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.6rem' }}>
                    <span style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)', color: theme.accent, fontSize: '0.75rem', fontWeight: 'bold', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>{res.subject}</span>
                    <span style={{ backgroundColor: theme.bg, color: theme.textMuted, fontSize: '0.75rem', fontWeight: 'bold', padding: '0.2rem 0.6rem', borderRadius: '6px', border: `1px solid ${theme.border}` }}>{res.grade}</span>
                  </div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.4rem' }}>{res.title}</h3>
                  <p style={{ color: theme.textMuted, fontSize: '0.9rem', marginBottom: '1rem' }}>{res.description}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${theme.border}`, paddingTop: '0.8rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Shared by <button type="button" onClick={(e) => { e.stopPropagation(); openPublicProfile(res.authorName, res.authorEmail); }} style={{ color: theme.textMain, background: 'none', border: 0, padding: 0, cursor: 'pointer', textDecoration: 'none', font: 'inherit' }}>{res.authorName}</button></span>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      {user?.email?.toLowerCase() === res.authorEmail?.toLowerCase() && <button type="button" onClick={(e) => { e.stopPropagation(); handleDeleteResource(res.id); }} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}>Delete</button>}
                      {!isAdmin && <button onClick={(e) => handleLikeResource(res.id, e)} style={{ background: 'none', border: 'none', color: res.likedByMe ? theme.accent : theme.textMuted, cursor: 'pointer' }}>
                        Like ({res.likes})
                      </button>}
                      {!isAdmin && <button onClick={(e) => handleBookmarkResource(res.id, e)} style={{ background: 'none', border: 'none', color: res.bookmarkedByMe ? theme.accent : theme.textMuted, cursor: 'pointer' }}>
                        Save ({res.bookmarks})
                      </button>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STUDY LOUNGE 视图 */}
        {activeTab === 'lounges' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>Virtual Study Lounge Rooms</h1>
            {joinedRoom ? (
              <div style={{ backgroundColor: theme.cardBg, border: `2px solid ${theme.accent}`, borderRadius: '16px', padding: '2rem', textAlign: 'center' }}>
                <h2>{joinedRoom.name}</h2>
                <div style={{ fontSize: '3.5rem', fontWeight: '900', color: theme.accent, margin: '1rem 0' }}>{formatTimer(pomodoroTime)}</div>
                <button onClick={() => setIsTimerRunning(!isTimerRunning)} style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                  {isTimerRunning ? 'Pause Session' : 'Start Focus Session'}
                </button>
                <button onClick={() => setJoinedRoom(null)} style={{ marginLeft: '1rem', backgroundColor: 'transparent', border: `1px solid ${theme.border}`, color: theme.textMain, padding: '0.6rem 1rem', borderRadius: '8px', cursor: 'pointer' }}>
                  Leave Room
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {lounges.map(room => (
                  <div key={room.id} style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '14px', padding: '1.5rem' }}>
                    <h3>{room.name}</h3>
                    <p style={{ fontSize: '0.85rem', color: theme.textMuted, margin: '0.5rem 0 1rem' }}>{room.description}</p>
                    <button onClick={() => setJoinedRoom(room)} style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', width: '100%' }}>
                      Join Study Room
                    </button>
                  </div>
                ))}
              </div>
            )}
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.8rem', marginBottom: '0.5rem' }}>
                    <strong style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{disc.title}</strong>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', flexShrink: 0 }}>
                      {user?.email?.toLowerCase() === disc.authorEmail?.toLowerCase() && <button type="button" onClick={(e) => { e.stopPropagation(); handleDeleteDiscussion(disc.id); }} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}>Delete</button>}
                      <span style={{ fontSize: '0.8rem', color: theme.accent, fontWeight: 'bold' }}>{disc.repliesCount} Replies</span>
                      {!isAdmin && <button type="button" onClick={(e) => handleBookmarkDiscussion(disc.id, e)} aria-label={disc.bookmarkedByMe ? 'Remove saved discussion' : 'Save discussion'} style={{ border: `1px solid ${theme.border}`, borderRadius: '7px', padding: '0.35rem 0.55rem', background: disc.bookmarkedByMe ? 'rgba(139,92,246,0.14)' : 'transparent', color: disc.bookmarkedByMe ? theme.accent : theme.textMuted, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        {disc.bookmarkedByMe ? '★ Saved' : '☆ Save'}
                      </button>}
                    </div>
                  </div>
                  <p style={{ fontSize: '0.9rem', color: theme.textMuted, marginBottom: '0.8rem' }}>{disc.content}</p>
                  <span style={{ fontSize: '0.75rem', color: theme.textMuted }}>Posted by <button type="button" onClick={(e) => { e.stopPropagation(); openPublicProfile(disc.authorName, disc.authorEmail); }} style={{ color: theme.textMuted, background: 'none', border: 0, padding: 0, cursor: 'pointer', textDecoration: 'none', font: 'inherit' }}>{disc.authorName}</button> on {disc.date}</span>
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
        {activeTab === 'feedback' && (
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
              <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>My Published Resources ({myResources.length})</h2>
              {myResources.length > 0 ? (
                myResources.map(res => (
                  <button type="button" key={res.id} onClick={() => setPreviewResource(res)} style={{ width: '100%', textAlign: 'left', backgroundColor: theme.bg, border: `1px solid ${theme.border}`, borderRadius: '10px', padding: '1rem', marginBottom: '0.5rem', color: theme.textMain, cursor: 'pointer' }}>
                    <strong>{res.title}</strong>
                    <p style={{ margin: '0.35rem 0 0', color: theme.textMuted, fontSize: '0.85rem' }}>{res.subject} · {res.grade} · Open note</p>
                  </button>
                ))
              ) : (
                <p style={{ color: theme.textMuted, fontSize: '0.85rem' }}>You haven&apos;t shared any resources yet.</p>
              )}
            </div>

            <div style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '16px', padding: '1.8rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>My Published Discussions ({myDiscussions.length})</h2>
              {myDiscussions.length > 0 ? (
                myDiscussions.map(disc => (
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
              <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>My Saved Bookmarks ({bookmarkedResources.length})</h2>
              {bookmarkedResources.length > 0 ? (
                bookmarkedResources.map(bm => (
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
              <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>My Saved Discussions ({discussions.filter(d => d.bookmarkedByMe).length})</h2>
              {discussions.filter(d => d.bookmarkedByMe).length > 0 ? (
                discussions.filter(d => d.bookmarkedByMe).map(disc => (
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
                    {file.type.startsWith('image/') && file.url.startsWith('data:') && <img src={file.url} alt={file.name} style={{ maxWidth: '100%', maxHeight: 420, objectFit: 'contain', borderRadius: 8 }} />}
                    {canEmbed && ((isPdf && file.url.startsWith('data:')) || /^https?:\/\//i.test(file.url)) && <iframe title={`Preview: ${file.name}`} src={embedUrl} loading="lazy" style={{ width: '100%', height: '520px', border: `1px solid ${theme.border}`, borderRadius: '8px', background: '#fff' }} sandbox="allow-scripts allow-same-origin allow-forms allow-popups" />}
                    {!canEmbed && <p style={{ color: theme.textMuted, fontSize: '0.85rem' }}>This file can be opened in a new tab.</p>}
                  </div>;
                })}</div>}


              </div>

              <div className="ns-resource-comments" style={{ width: '360px', backgroundColor: theme.bg, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 'bold' }}>Comments ({previewResource.comments.length})</h3>
                {!isAdmin && <form onSubmit={handleAddComment} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <textarea rows={3} placeholder="Write a comment..." value={newCommentText} onChange={(e) => setNewCommentText(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.cardBg, color: theme.textMain, boxSizing: 'border-box' }} />
                  <button type="submit" style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.5rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', alignSelf: 'flex-end' }}>Post Comment</button>
                </form>}

                {previewResource.comments.map((c) => (
                  <div key={c.id} style={{ backgroundColor: theme.cardBg, padding: '0.8rem', borderRadius: '8px', border: `1px solid ${theme.border}` }}>
                    <button type="button" onClick={() => openPublicProfile(c.authorName, c.authorEmail)} style={{ color: theme.textMain, background: 'none', border: 0, padding: 0, cursor: 'pointer', textDecoration: 'none', font: 'inherit' }}>{c.authorName}</button>
                    <p style={{ fontSize: '0.85rem', marginTop: '0.3rem' }}>{c.text}</p>
                    {user?.email?.toLowerCase() === c.authorEmail?.toLowerCase() && <button type="button" onClick={() => handleDeleteResourceComment(previewResource.id, c.id)} style={{ marginTop: '0.25rem', marginLeft: '0.4rem', padding: '0.25rem 0.5rem', borderRadius: '6px', border: `1px solid ${theme.border}`, background: 'transparent', color: '#EF4444', cursor: 'pointer', fontSize: '0.8rem' }}>Delete</button>}
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
                      <button type="button" onClick={() => openPublicProfile(r.authorName, r.authorEmail)} style={{ fontSize: '0.85rem', color: theme.textMain, background: 'none', border: 0, padding: 0, cursor: 'pointer', textDecoration: 'none', font: 'inherit' }}>{r.authorName}</button>
                      <span style={{ fontSize: '0.75rem', color: theme.textMuted }}>{r.date}</span>
                    </div>
                    <p style={{ fontSize: '0.85rem' }}>{r.text}</p>
                    {user?.email?.toLowerCase() === r.authorEmail?.toLowerCase() && <button type="button" onClick={() => handleDeleteDiscussionReply(selectedDiscussion.id, r.id)} style={{ marginTop: '0.25rem', marginLeft: '0.4rem', padding: '0.25rem 0.5rem', borderRadius: '6px', border: `1px solid ${theme.border}`, background: 'transparent', color: '#EF4444', cursor: 'pointer', fontSize: '0.8rem' }}>Delete</button>}
                    {user?.email?.toLowerCase() === r.authorEmail?.toLowerCase() && <button type="button" onClick={() => handleDeleteDiscussionReply(selectedDiscussion.id, r.id)} style={{ marginTop: '0.25rem', marginLeft: '0.4rem', padding: '0.25rem 0.5rem', borderRadius: '6px', border: `1px solid ${theme.border}`, background: 'transparent', color: '#EF4444', cursor: 'pointer', fontSize: '0.8rem' }}>Delete</button>}
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
                <strong>Attachments (optional)</strong>
                <input ref={resourceFilesRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.txt,.csv,.xls,.xlsx" onChange={handleResourceFileSelection} style={{ width: '100%', color: theme.textMain }} />
                <p style={{ color: theme.textMuted, fontSize: '0.75rem', margin: 0 }}>Images, PDF, Word and PowerPoint files up to 2 MB each can be attached directly. For larger files, use a share link.</p>
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
            flex: 1 1 42% !important;
            gap: 0.45rem !important;
            font-size: 1.05rem !important;
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


