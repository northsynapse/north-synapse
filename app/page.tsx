'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';

type NavTab = 'resources' | 'lounges' | 'announcements' | 'discussions' | 'feedback' | 'dashboard';

interface CommentItem {
  id: string;
  authorName: string;
  authorAvatar: string;
  text: string;
  date: string;
  likes: number;
  likedByMe?: boolean;
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

  // 仅指定邮箱拥有管理员标识
  const isAdmin = user?.email?.trim().toLowerCase() === 'northsynapse@gmail.com';

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
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('ns_user');
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          setUser(parsed);
          setUsername(parsed.username || '');
          setNickname(parsed.nickname || parsed.username || '');
          setGrade(parsed.grade || '');
          setAvatarUrl(parsed.avatarUrl || '');
          setBio(parsed.bio || '');
          setUsageSeconds(Number(parsed.totalStudySeconds) || 0);
        } catch (_) {}
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ns_resources', JSON.stringify(resources));
    }
  }, [resources]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ns_discussions', JSON.stringify(discussions));
    }
  }, [discussions]);

  useEffect(() => {
    if (announcements.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % announcements.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [announcements]);

  // 每 30 秒累计一次网站使用时间；切到后台时暂停计时。
  useEffect(() => {
    if (!user?.email || typeof window === 'undefined') return;
    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      setUsageSeconds((current) => {
        const next = current + 30;
        setUser((previous: any) => {
          if (!previous?.email) return previous;
          const updated = { ...previous, totalStudySeconds: next };
          localStorage.setItem('ns_user', JSON.stringify(updated));
          try {
            const accounts = JSON.parse(localStorage.getItem('ns_accounts') || '[]');
            if (Array.isArray(accounts)) {
              localStorage.setItem('ns_accounts', JSON.stringify(accounts.map((account: any) =>
                account.email?.toLowerCase() === String(previous.email).toLowerCase()
                  ? { ...account, profile: updated }
                  : account
              )));
            }
          } catch (_) {}
          return updated;
        });
        return next;
      });
    }, 30000);
    return () => window.clearInterval(timer);
  }, [user?.email]);

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
  // 本地演示版账号存储。正式上线前应改用服务端认证，不能将密码明文保存在浏览器中。
  function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const cleanEmail = authEmail.trim().toLowerCase();
    const cleanPassword = authPassword;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      alert('Please enter a valid email address.');
      setLoading(false);
      return;
    }
    if (cleanPassword.length < 6) {
      alert('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    if (isSignUp && (!isStudentConfirmed || !hasAgreedTerms)) {
      alert('Please confirm that you are a student and accept the Terms of Service.');
      setLoading(false);
      return;
    }

    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    type LocalAccount = {
      email: string;
      password: string;
      profile: any;
    };

    let accounts: LocalAccount[] = [];
    try {
      accounts = JSON.parse(localStorage.getItem('ns_accounts') || '[]');
      if (!Array.isArray(accounts)) accounts = [];
    } catch (_) {
      accounts = [];
    }

    const accountIndex = accounts.findIndex(
      (account) => account.email?.toLowerCase() === cleanEmail
    );

    if (isSignUp) {
      if (accountIndex !== -1) {
        alert('An account with this email already exists. Please sign in.');
        setLoading(false);
        return;
      }

      // 如果旧版本仍保留着同邮箱的资料，则注册时沿用这些资料。
      let legacyProfile: any = null;
      try {
        const savedUser = JSON.parse(localStorage.getItem('ns_user') || 'null');
        if (savedUser?.email?.toLowerCase() === cleanEmail) legacyProfile = savedUser;
      } catch (_) {}

      const defaultName = cleanEmail.split('@')[0];
      const profile = {
        ...(legacyProfile || {}),
        email: cleanEmail,
        username: legacyProfile?.username || defaultName,
        nickname: legacyProfile?.nickname || legacyProfile?.username || defaultName,
        grade: legacyProfile?.grade || '',
        gender: legacyProfile?.gender || 'Prefer not to say',
        bio: legacyProfile?.bio || '',
        avatarUrl: legacyProfile?.avatarUrl || '',
        createdAt: legacyProfile?.createdAt || new Date().toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric'
        }),
        totalStudySeconds: Number(legacyProfile?.totalStudySeconds) || 0
      };

      accounts.push({ email: cleanEmail, password: cleanPassword, profile });
      localStorage.setItem('ns_accounts', JSON.stringify(accounts));
      localStorage.setItem('ns_user', JSON.stringify(profile));
      setUser(profile);
      setUsername(profile.username);
      setNickname(profile.nickname);
      setGrade(profile.grade);
      setGender(profile.gender);
      setBio(profile.bio);
      setAvatarUrl(profile.avatarUrl);
      setUsageSeconds(Number(profile.totalStudySeconds) || 0);
      alert('Registration successful! Logged in as ' + cleanEmail);
    } else {
      if (accountIndex === -1) {
        alert('No account with this email was found on this browser. Please sign up first.');
        setLoading(false);
        return;
      }

      const account = accounts[accountIndex];
      if (account.password !== cleanPassword) {
        alert('Incorrect email or password. Please try again.');
        setLoading(false);
        return;
      }

      const profile = account.profile || { email: cleanEmail, username: cleanEmail.split('@')[0] };
      localStorage.setItem('ns_user', JSON.stringify(profile));
      setUser(profile);
      setUsername(profile.username || '');
      setNickname(profile.nickname || profile.username || '');
      setGrade(profile.grade || '');
      setGender(profile.gender || 'Prefer not to say');
      setBio(profile.bio || '');
      setAvatarUrl(profile.avatarUrl || '');
      setUsageSeconds(Number(profile.totalStudySeconds) || 0);
      alert('Welcome back, ' + (profile.nickname || profile.username || cleanEmail) + '!');
    }

    setShowAuthModal(false);
    setAuthPassword('');
    setActiveTab('dashboard');
    setLoading(false);
  }

  function handleSaveProfile(e: React.FormEvent) {
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

    setUser(updatedUser);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ns_user', JSON.stringify(updatedUser));

      // 同步更新账号档案，确保退出后重新登录仍能恢复修改过的资料。
      try {
        const accounts = JSON.parse(localStorage.getItem('ns_accounts') || '[]');
        const accountIndex = Array.isArray(accounts)
          ? accounts.findIndex((account: any) => account.email?.toLowerCase() === updatedUser.email?.toLowerCase())
          : -1;
        if (accountIndex !== -1) {
          accounts[accountIndex].profile = updatedUser;
          localStorage.setItem('ns_accounts', JSON.stringify(accounts));
        }
      } catch (_) {
        // 主档案已保存；如果账号缓存损坏，避免阻止界面继续使用。
      }
    }

    alert('Profile updated successfully!');
    setShowEditProfileModal(false);
  }

  function handleSignOut() {
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ns_user');
    }
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

  function handleCreateResourceSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      alert('Please sign in first.');
      setShowAuthModal(true);
      return;
    }
    if (!newResTitle.trim() || !newResContent.trim()) return;

    const newRes: ResourceItem = {
      id: Date.now().toString(),
      title: newResTitle.trim(),
      subject: newResSubject,
      grade: newResGrade,
      description: newResDescription.trim() || newResContent.slice(0, 90) + '...',
      content: newResContent.trim(),
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
    alert('Academic resource note published!');
  }

  function handleCreateDiscussionSubmit(e: React.FormEvent) {
    e.preventDefault();
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
      replies: []
    };

    setDiscussions([newDisc, ...discussions]);
    setShowCreateDiscussionModal(false);
    setNewDiscTitle('');
    setNewDiscContent('');
    alert('Discussion topic posted!');
  }

  function handleAddDiscussionReply(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      alert('Please sign in to reply.');
      setShowAuthModal(true);
      return;
    }
    if (!newReplyText.trim() || !selectedDiscussion) return;

    const replyObj: CommentItem = {
      id: 'r_' + Date.now(),
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

  function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      alert('Please sign in to comment.');
      setShowAuthModal(true);
      return;
    }
    if (!newCommentText.trim() || !previewResource) return;

    const commentObj: CommentItem = {
      id: Date.now().toString(),
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

  const subjectsList = ['Mathematics', 'Science', 'ESL & Languages', 'French', 'History & Social Sciences', 'Geography', 'Business & Economics', 'Art & Music', 'Computer Science & Tech'];
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

              <button onClick={() => { if (!user) { alert('Please sign in first.'); setShowAuthModal(true); return; } setShowCreateResourceModal(true); }} style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.75rem 1.6rem', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
                + Share Notes / Resource
              </button>
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
                    <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Shared by {res.authorName}</span>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button onClick={(e) => handleLikeResource(res.id, e)} style={{ background: 'none', border: 'none', color: res.likedByMe ? theme.accent : theme.textMuted, cursor: 'pointer' }}>
                        Like ({res.likes})
                      </button>
                      <button onClick={(e) => handleBookmarkResource(res.id, e)} style={{ background: 'none', border: 'none', color: res.bookmarkedByMe ? theme.accent : theme.textMuted, cursor: 'pointer' }}>
                        Save ({res.bookmarks})
                      </button>
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
              <button onClick={() => { if (!user) { alert('Please sign in first.'); setShowAuthModal(true); return; } setShowCreateDiscussionModal(true); }} style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.7rem 1.5rem', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
                + Start New Topic
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {discussions.map((disc) => (
                <div key={disc.id} onClick={() => setSelectedDiscussion(disc)} style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '1.5rem', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <strong style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{disc.title}</strong>
                    <span style={{ fontSize: '0.8rem', color: theme.accent, fontWeight: 'bold' }}>{disc.repliesCount} Replies</span>
                  </div>
                  <p style={{ fontSize: '0.9rem', color: theme.textMuted, marginBottom: '0.8rem' }}>{disc.content}</p>
                  <span style={{ fontSize: '0.75rem', color: theme.textMuted }}>Posted by {disc.authorName} on {disc.date}</span>
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
            <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }}>Feedback &amp; Issue Reporting</h1>
            <form onSubmit={(e) => { e.preventDefault(); alert('Thank you! Your feedback has been recorded locally.'); setFeedbackComment(''); }} style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '16px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: theme.textMuted, marginBottom: '0.4rem' }}>Category</label>
                <select value={feedbackCategory} onChange={(e) => setFeedbackCategory(e.target.value)} style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain }}>
                  <option value="General Suggestion">General Suggestion</option>
                  <option value="Report Issue / Bug">Report Issue / Bug</option>
                  <option value="Content Request">Content Request</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: theme.textMuted, marginBottom: '0.4rem' }}>Details</label>
                <textarea required rows={4} placeholder="Describe your suggestion..." value={feedbackComment} onChange={(e) => setFeedbackComment(e.target.value)} style={{ width: '100%', padding: '0.7rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain, boxSizing: 'border-box' }} />
              </div>
              <button type="submit" style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.8rem 2rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', alignSelf: 'flex-start' }}>Submit Feedback</button>
            </form>
          </div>
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
                  <div key={res.id} style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}`, borderRadius: '10px', padding: '1rem', marginBottom: '0.5rem' }}>
                    <strong>{res.title}</strong>
                  </div>
                ))
              ) : (
                <p style={{ color: theme.textMuted, fontSize: '0.85rem' }}>You haven&apos;t shared any resources yet.</p>
              )}
            </div>

            <div style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '16px', padding: '1.8rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>My Saved Bookmarks ({bookmarkedResources.length})</h2>
              {bookmarkedResources.length > 0 ? (
                bookmarkedResources.map(bm => (
                  <div key={bm.id} style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}`, borderRadius: '10px', padding: '1rem', marginBottom: '0.5rem' }}>
                    <strong>{bm.title}</strong>
                  </div>
                ))
              ) : (
                <p style={{ color: theme.textMuted, fontSize: '0.85rem' }}>You haven&apos;t bookmarked any notes yet.</p>
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
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999999 }}>
          <div style={{ backgroundColor: theme.cardBg, borderRadius: '16px', width: '90%', maxWidth: '960px', height: '80vh', border: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '1.2rem 2rem', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>{previewResource.title}</h2>
              <button onClick={() => setPreviewResource(null)} style={{ background: 'none', border: 'none', color: theme.textMain, cursor: 'pointer', fontSize: '1.4rem' }}>X</button>
            </div>

            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
              <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', borderRight: `1px solid ${theme.border}` }}>
                <div style={{ fontSize: '0.95rem', lineHeight: '1.7', whiteSpace: 'pre-wrap', marginBottom: '2rem' }}>
                  {previewResource.content}
                </div>

                <div style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}`, borderRadius: '10px', padding: '1.2rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: theme.accent }}>ACADEMIC CITATION GENERATOR</span>
                  <div style={{ display: 'flex', gap: '0.5rem', margin: '0.6rem 0' }}>
                    {(['APA', 'IEEE', 'MLA', 'BibTeX'] as const).map((fmt) => (
                      <button key={fmt} onClick={() => setCitationFormat(fmt)} style={{ padding: '0.22rem 0.6rem', borderRadius: '4px', border: `1px solid ${citationFormat === fmt ? theme.accent : theme.border}`, backgroundColor: citationFormat === fmt ? theme.accent : 'transparent', color: citationFormat === fmt ? '#FFF' : theme.textMuted, fontSize: '0.75rem', cursor: 'pointer' }}>
                        {fmt}
                      </button>
                    ))}
                  </div>
                  <p style={{ fontSize: '0.8rem', fontFamily: 'monospace', backgroundColor: theme.cardBg, padding: '0.6rem', borderRadius: '6px', border: `1px solid ${theme.border}` }}>
                    {citationText}
                  </p>
                </div>
              </div>

              <div style={{ width: '360px', backgroundColor: theme.bg, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 'bold' }}>Comments ({previewResource.comments.length})</h3>
                <form onSubmit={handleAddComment} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <textarea rows={3} placeholder="Write a comment..." value={newCommentText} onChange={(e) => setNewCommentText(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.cardBg, color: theme.textMain, boxSizing: 'border-box' }} />
                  <button type="submit" style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.5rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', alignSelf: 'flex-end' }}>Post Comment</button>
                </form>

                {previewResource.comments.map((c) => (
                  <div key={c.id} style={{ backgroundColor: theme.cardBg, padding: '0.8rem', borderRadius: '8px', border: `1px solid ${theme.border}` }}>
                    <strong>{c.authorName}</strong>
                    <p style={{ fontSize: '0.85rem', marginTop: '0.3rem' }}>{c.text}</p>
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

              <form onSubmit={handleAddDiscussionReply} style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.5rem' }}>
                <input type="text" placeholder="Write a reply..." value={newReplyText} onChange={(e) => setNewReplyText(e.target.value)} style={{ flex: 1, padding: '0.6rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain }} />
                <button type="submit" style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Reply</button>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {selectedDiscussion.replies.map(r => (
                  <div key={r.id} style={{ backgroundColor: theme.bg, padding: '0.8rem', borderRadius: '8px', border: `1px solid ${theme.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                      <strong style={{ fontSize: '0.85rem' }}>{r.authorName}</strong>
                      <span style={{ fontSize: '0.75rem', color: theme.textMuted }}>{r.date}</span>
                    </div>
                    <p style={{ fontSize: '0.85rem' }}>{r.text}</p>
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
                  <label style={{ fontSize: '0.8rem', color: theme.textMuted }}>
                    <input type="checkbox" required checked={hasAgreedTerms} onChange={(e) => setHasAgreedTerms(e.target.checked)} /> Agree Terms of Service
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
          <div style={{ backgroundColor: theme.cardBg, padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '540px', border: `1px solid ${theme.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
              <h2>Share Resource Note</h2>
              <button onClick={() => setShowCreateResourceModal(false)} style={{ background: 'none', border: 'none', color: theme.textMain, cursor: 'pointer' }}>X</button>
            </div>

            <form onSubmit={handleCreateResourceSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input type="text" required placeholder="Title" value={newResTitle} onChange={(e) => setNewResTitle(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain, boxSizing: 'border-box' }} />
              <textarea required rows={5} placeholder="Content / Formulas / Notes" value={newResContent} onChange={(e) => setNewResContent(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain, boxSizing: 'border-box' }} />
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
      `}</style>

    </div>
  );
}


