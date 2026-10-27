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
  const [gender, setGender] = useState('');
  const [bio, setBio] = useState('');

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

  // 判断是否为管理员（邮箱中包含 northsynapse）
  const isAdmin = user?.email?.toLowerCase().includes('northsynapse');
  // Username and Nickname validation
  const USERNAME_MIN = 3;
  const USERNAME_MAX = 30;
  const NICKNAME_MIN = 2;
  const NICKNAME_MAX = 24;
  
  function normalizeName(value: string): string {
    return value.trim();
  }
  
  function getCharacterLength(value: string): number {
    return Array.from(value).length;
  }
  
  function hasInvalidCharacters(value: string): boolean {
    // Reject control, formatting, and other Unicode "Other" characters.
    // Ordinary international letters, numbers, spaces, punctuation, and symbols are allowed.
    return /\p{C}/u.test(value);
  }
  
  function validateUsername(value: string): string | null {
    const clean = normalizeName(value);
    const length = getCharacterLength(clean);
  
    if (!clean) return 'Username cannot be empty.';
    if (length < USERNAME_MIN || length > USERNAME_MAX) {
      return `Username must be ${USERNAME_MIN}–${USERNAME_MAX} characters long.`;
    }
    if (!/\S/u.test(clean)) return 'Username cannot contain only spaces.';
    if (hasInvalidCharacters(clean)) {
      return 'Username contains unsupported characters.';
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
    if (!/\S/u.test(clean)) return 'Nickname cannot contain only spaces.';
    if (hasInvalidCharacters(clean)) {
      return 'Nickname contains unsupported characters.';
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
          setGender(parsed.gender || '');
          setAvatarUrl(parsed.avatarUrl || '');
          setBio(parsed.bio || '');
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
  async function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const cleanEmail = authEmail.trim().toLowerCase();
    const cleanPassword = authPassword;

    try {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        alert('Please enter a valid email address.');
        return;
      }
      if (cleanPassword.length < 8) {
        alert('Password must be at least 8 characters long.');
        return;
      }
      if (isSignUp && (!isStudentConfirmed || !hasAgreedTerms)) {
        alert('Please confirm that you are a student/alumni and accept the Terms of Service.');
        return;
      }

      // Front-end demo account registry. Production authentication should use Supabase Auth.
      const accounts: Array<{ email: string; passwordHash: string; user: any }> =
        JSON.parse(localStorage.getItem('ns_accounts') || '[]');
      const existing = accounts.find((account) => account.email === cleanEmail);
      const passwordHash = await hashPassword(cleanPassword);

      if (isSignUp) {
        if (existing) {
          alert('An account with this email already exists. Please sign in instead.');
          return;
        }
        
        const defaultName = cleanEmail.split('@')[0];
        const defaultUsernameError = validateUsername(defaultName);
        
        if (defaultUsernameError) {
          alert(
            'Your email prefix cannot be used as the default username. ' +
            'Please use an email with a prefix of 3–30 supported characters.'
          );
          return;
        }
        
        const usernameTaken = accounts.some(
          (account) =>
            normalizeName(account.user?.username || '').toLocaleLowerCase() ===
            defaultName.toLocaleLowerCase()
        );
        
        if (usernameTaken) {
          alert(
            'The username generated from your email is already taken. ' +
            'Please sign up with another email address.'
          );
          return;
        }
        const defaultName = cleanEmail.split('@')[0];
        const userObj = {
          email: cleanEmail,
          username: defaultName,
          nickname: defaultName,
          grade: '',
          gender: '',
          bio: '',
          avatarUrl: '',
          createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        };
        localStorage.setItem('ns_accounts', JSON.stringify([...accounts, { email: cleanEmail, passwordHash, user: userObj }]));
        setUser(userObj);
        setUsername(defaultName);
        setNickname(defaultName);
        setGrade('');
        setGender('');
        setBio('');
        setAvatarUrl('');
        localStorage.setItem('ns_user', JSON.stringify(userObj));
        alert('Registration successful!');
      } else {
        if (!existing || existing.passwordHash !== passwordHash) {
          alert('Incorrect email or password. Please try again.');
          return;
        }
        const userObj = existing.user;
        setUser(userObj);
        setUsername(userObj.username || '');
        setNickname(userObj.nickname || userObj.username || '');
        setGrade(userObj.grade || '');
        setGender(userObj.gender || '');
        setBio(userObj.bio || '');
        setAvatarUrl(userObj.avatarUrl || '');
        localStorage.setItem('ns_user', JSON.stringify(userObj));
        alert('Welcome back, ' + (userObj.nickname || userObj.username || cleanEmail.split('@')[0]) + '!');
      }
      setShowAuthModal(false);
      setAuthPassword('');
      setActiveTab('dashboard');
    } catch (error) {
      console.error('Authentication error:', error);
      alert('Unable to process this account. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function hashPassword(password: string) {
    const data = new TextEncoder().encode(password);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
  }

function handleSaveProfile(e: React.FormEvent) {
  e.preventDefault();

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

  // Check usernames among locally registered accounts.
  const accounts: Array<{ email: string; passwordHash: string; user: any }> =
    JSON.parse(localStorage.getItem('ns_accounts') || '[]');

  const duplicateUsername = accounts.some(
    (account) =>
      account.email !== String(user?.email || '').toLowerCase() &&
      normalizeName(account.user?.username || '').toLocaleLowerCase() ===
        cleanUsername.toLocaleLowerCase()
  );

  if (duplicateUsername) {
    alert('This username is already taken. Please choose another one.');
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
      const accounts: Array<{ email: string; passwordHash: string; user: any }> =
        JSON.parse(localStorage.getItem('ns_accounts') || '[]');
      localStorage.setItem('ns_accounts', JSON.stringify(accounts.map((account) =>
        account.email === String(user?.email || '').toLowerCase() ? { ...account, user: updatedUser } : account
      )));
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

    if (typeof window !== 'undefined') {
      const accounts: Array<{ email: string; passwordHash: string; user: any }> =
        JSON.parse(localStorage.getItem('ns_accounts') || '[]');
      localStorage.setItem('ns_accounts', JSON.stringify(accounts.filter((account) => account.email !== String(user?.email || '').toLowerCase())));
      localStorage.removeItem('ns_user');
    }
    setUser(null);
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
        <div style={{ backgroundColor: 'rgba(139, 92, 246, 0.08)', border: `1px solid ${theme.accent}`, borderRadius: '12px', padding: '0 1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '52px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, overflow: 'hidden' }}>
            <span style={{ backgroundColor: theme.accent, color: '#FFF', fontSize: '0.75rem', fontWeight: 'bold', padding: '0.25rem 0.6rem', borderRadius: '6px', flexShrink: 0 }}>
              NOTICE ({currentBannerIndex + 1}/{announcements.length})
            </span>

            <div style={{ flex: 1, overflow: 'hidden', height: '52px', position: 'relative' }}>
              {announcements.map((item, idx) => (
                <div key={item.id} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '52px', display: 'flex', alignItems: 'center', gap: '0.8rem', opacity: idx === currentBannerIndex ? 1 : 0, transform: idx === currentBannerIndex ? 'translateY(0)' : 'translateY(15px)', transition: 'all 0.4s ease-in-out' }}>
                  <span style={{ fontSize: '0.9rem', color: theme.textMain, fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</span>
                  <span style={{ fontSize: '0.8rem', color: theme.textMuted, flexShrink: 0 }}>• {item.date}</span>
                </div>
              ))}
            </div>
          </div>

          <button onClick={() => setActiveTab('announcements')} style={{ background: 'none', border: 'none', color: theme.accent, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', flexShrink: 0 }}>
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
            <div style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '16px', padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', overflowWrap: 'anywhere' }}>{nickname || 'Profile'}</h1>
                <p style={{ color: theme.textMuted, fontSize: '0.85rem', marginTop: '0.2rem', overflowWrap: 'anywhere' }}>@{username || 'username'}</p>
                {(grade || gender) && <p style={{ color: theme.textMuted, fontSize: '0.85rem', marginTop: '0.35rem' }}>{[grade, gender].filter(Boolean).join(' · ')}</p>}
                {bio.trim() && <p style={{ fontSize: '0.9rem', marginTop: '0.65rem', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{bio}</p>}
              </div>
              <button onClick={() => setShowEditProfileModal(true)} style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.8rem 1.6rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                Edit Profile
              </button>
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
                <input type="password" required minLength={8} placeholder="At least 8 characters" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain, boxSizing: 'border-box' }} />
              </div>

              {isSignUp && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.8rem', color: theme.textMuted }}>
                    <input type="checkbox" required checked={isStudentConfirmed} onChange={(e) => setIsStudentConfirmed(e.target.checked)} /> Confirm Student/Alumni
                  </label>
                  <label style={{ fontSize: '0.8rem', color: theme.textMuted, display: 'flex', alignItems: 'flex-start', gap: '0.45rem' }}>
                    <input type="checkbox" required checked={hasAgreedTerms} onChange={(e) => setHasAgreedTerms(e.target.checked)} style={{ marginTop: '0.15rem' }} />
                    <span>I agree to the <button type="button" onClick={() => setShowTermsModal(true)} style={{ background: 'none', border: 'none', padding: 0, color: theme.accent, textDecoration: 'underline', cursor: 'pointer' }}>Terms of Service / User Notice</button>.</span>
                  </label>
                </div>
              )}

              <button type="submit" disabled={loading} style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.75rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
              </button>
            </form>

            <p onClick={() => { setIsSignUp(!isSignUp); setHasAgreedTerms(false); setIsStudentConfirmed(false); }} style={{ color: theme.accent, marginTop: '1rem', cursor: 'pointer', textAlign: 'center', fontSize: '0.85rem' }}>
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </p>
          </div>
        </div>
      )}

      {/* Terms of Service / User Notice modal */}
      {showTermsModal && (
        <div onClick={() => setShowTermsModal(false)} style={{ position: 'fixed', inset: 0, padding: '1rem', backgroundColor: 'rgba(0,0,0,0.82)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000001 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: theme.cardBg, color: theme.textMain, border: `1px solid ${theme.border}`, borderRadius: '14px', padding: 'clamp(1rem, 4vw, 2rem)', width: '100%', maxWidth: '620px', maxHeight: '85dvh', overflowY: 'auto', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0 }}>Terms of Service & User Notice</h2>
              <button type="button" onClick={() => setShowTermsModal(false)} aria-label="Close terms" style={{ background: 'none', border: 'none', color: theme.textMain, cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>
            <p style={{ color: theme.textMuted, fontSize: '0.85rem' }}>Please read these basic rules before using North Synapse.</p>
            <ol style={{ paddingLeft: '1.3rem', lineHeight: 1.65, display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              <li><strong>Academic purpose:</strong> Use this platform to share study notes, learning resources, and constructive academic discussion.</li>
              <li><strong>Respect others:</strong> Do not harass, threaten, discriminate against, impersonate, or reveal another person&apos;s private information.</li>
              <li><strong>Share responsibly:</strong> Only upload material you created or have permission to share. Respect copyright and school rules.</li>
              <li><strong>Appropriate content:</strong> Do not post illegal, dangerous, hateful, sexually explicit, or otherwise inappropriate material.</li>
              <li><strong>Privacy:</strong> Do not publish passwords, home addresses, phone numbers, student numbers, private messages, or other sensitive information.</li>
              <li><strong>Accuracy and attribution:</strong> Credit original authors, label your own work clearly, and do not present someone else&apos;s work as yours.</li>
              <li><strong>Moderation:</strong> Content may be reviewed or removed if it violates these rules. Repeated misuse may result in access restrictions.</li>
              <li><strong>Account responsibility:</strong> Keep your login details private and use only an account you are authorized to access.</li>
              <li><strong>Prototype notice:</strong> Some features may still be under development. Do not rely on this prototype to store confidential or important information.</li>
            </ol>
            <button type="button" onClick={() => setShowTermsModal(false)} style={{ width: '100%', marginTop: '1rem', backgroundColor: theme.accent, color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>Close</button>
          </div>
        </div>
      )}

      {/* 编辑资料与注销弹窗 */}
      {showEditProfileModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999999 }}>
          <div style={{ backgroundColor: theme.cardBg, padding: 'clamp(1rem, 4vw, 2rem)', borderRadius: '12px', width: '90%', maxWidth: '520px', maxHeight: '90dvh', overflowY: 'auto', border: `1px solid ${theme.border}`, boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
              <h2>Edit Profile</h2>
              <button onClick={() => setShowEditProfileModal(false)} style={{ background: 'none', border: 'none', color: theme.textMain, cursor: 'pointer' }}>X</button>
            </div>

            <p style={{ color: theme.textMuted, fontSize: '0.85rem', margin: '0 0 1.2rem' }}>Customize how other students see you. Grade, gender, and bio are optional.</p>
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', padding: '1rem', border: `1px solid ${theme.border}`, borderRadius: '10px', backgroundColor: theme.bg }}>
                {avatarUrl ? <img src={avatarUrl} alt="Profile avatar preview" style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover' }} /> : <div style={{ width: '64px', height: '64px', borderRadius: '50%', display: 'grid', placeItems: 'center', backgroundColor: theme.cardBg, color: theme.accent, fontSize: '1.5rem', fontWeight: 800 }}>{(nickname || username || '?').slice(0, 1).toUpperCase()}</div>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1, minWidth: '150px' }}>
                  <input type="file" ref={fileInputRef} accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
                  <button type="button" onClick={() => fileInputRef.current?.click()} style={{ padding: '0.55rem 0.8rem', borderRadius: '6px', backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, color: theme.textMain, cursor: 'pointer', alignSelf: 'flex-start' }}>
                    {avatarUrl ? 'Change Profile Photo' : 'Choose Profile Photo'}
                  </button>
                  <span style={{ color: theme.textMuted, fontSize: '0.75rem' }}>On phones, choose a photo from your photo library. On computers, choose an image file.</span>
                </div>
              </div>


              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: theme.textMuted, marginBottom: '0.3rem' }}>Username</label>
                <input
                  type="text"
                  required
                  minLength={USERNAME_MIN}
                  maxLength={USERNAME_MAX}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain, boxSizing: 'border-box' }}
                />
                <p style={{ color: theme.textMuted, fontSize: '0.75rem', margin: '0.3rem 0 0' }}>
                  3–30 characters. Letters, numbers, spaces, and common symbols are allowed.
                </p>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: theme.textMuted, marginBottom: '0.3rem' }}>Nickname</label>
                <input
                  type="text"
                  required
                  minLength={NICKNAME_MIN}
                  maxLength={NICKNAME_MAX}
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain, boxSizing: 'border-box' }}
                />
                <p style={{ color: theme.textMuted, fontSize: '0.75rem', margin: '0.3rem 0 0' }}>
                  2–24 characters. You can use the same nickname as another student.
                </p>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: theme.textMuted, marginBottom: '0.3rem' }}>Grade (optional)</label>
                <select value={grade} onChange={(e) => setGrade(e.target.value)} style={{ width: '100%', padding: '0.7rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain, boxSizing: 'border-box' }}>
                  <option value="">Not specified</option>
                  {['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'Alumni'].map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: theme.textMuted, marginBottom: '0.3rem' }}>Gender (optional)</label>
                <select value={gender} onChange={(e) => setGender(e.target.value)} style={{ width: '100%', padding: '0.7rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain, boxSizing: 'border-box' }}>
                  <option value="">Not specified</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                  <option value="Self-describe">Self-describe</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: theme.textMuted, marginBottom: '0.3rem' }}>Bio</label>
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

          /* Resource Hub title and share button */
          main > div > div:first-child {
            gap: 1rem !important;
          }

          /* Resource cards and their metadata wrap instead of overflowing */
          main > div > div > div {
            min-width: 0;
          }

          main [style*="justify-content: space-between"] {
            flex-wrap: wrap !important;
            gap: 0.65rem !important;
          }

          /* Modals fit the phone viewport */
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
      `}</style>

    </div>
  );
}
