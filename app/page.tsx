'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';

/* ==========================================================================
   1. 内置轻量化 SUPABASE 模拟客户端 (零外部 NPM 包依赖，保证 100% 编译成功)
   ========================================================================== */
const supabase = {
  auth: {
    getUser: async () => {
      if (typeof window !== 'undefined') {
        const local = localStorage.getItem('ns_local_user');
        if (local) return { data: { user: JSON.parse(local) }, error: null };
      }
      return { data: { user: null }, error: null };
    },
    signUp: async ({ email, options }: any) => {
      const user = {
        id: 'usr_' + Date.now(),
        email,
        created_at: new Date().toISOString(),
        user_metadata: options?.data || {}
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('ns_local_user', JSON.stringify(user));
      }
      return { data: { user, session: {} }, error: null };
    },
    signInWithPassword: async ({ email }: any) => {
      const user = {
        id: 'usr_' + Date.now(),
        email,
        created_at: new Date().toISOString(),
        user_metadata: { username: email.split('@')[0], nickname: email.split('@')[0], grade: 'Grade 12' }
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('ns_local_user', JSON.stringify(user));
      }
      return { data: { user, session: {} }, error: null };
    },
    signOut: async () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('ns_local_user');
      }
      return { error: null };
    },
    onAuthStateChange: (callback: any) => {
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
  }
};

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
  replies?: CommentItem[];
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
     2. 全局状态 (GLOBAL STATES)
     ========================================================================== */
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState<NavTab>('resources');

  const [user, setUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showCreateResourceModal, setShowCreateResourceModal] = useState(false);
  const [showCreateDiscussionModal, setShowCreateDiscussionModal] = useState(false);

  // 登录表单状态
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isStudentConfirmed, setIsStudentConfirmed] = useState(false);
  const [hasAgreedTerms, setHasAgreedTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  // 个人资料表单状态
  const [avatarUrl, setAvatarUrl] = useState('');
  const [username, setUsername] = useState('');
  const [nickname, setNickname] = useState('');
  const [grade, setGrade] = useState('');
  const [gender, setGender] = useState('');
  const [bio, setBio] = useState('');
  const [createdAt, setCreatedAt] = useState('');

  // 筛选过滤状态
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Logo 图片加载失败降级方案
  const [useLogoImage, setUseLogoImage] = useState(true);

  // 新建资源表单状态
  const [newResTitle, setNewResTitle] = useState('');
  const [newResSubject, setNewResSubject] = useState('Mathematics');
  const [newResGrade, setNewResGrade] = useState('Grade 12');
  const [newResDescription, setNewResDescription] = useState('');
  const [newResContent, setNewResContent] = useState('');

  // 新建讨论表单状态
  const [newDiscTitle, setNewDiscTitle] = useState('');
  const [newDiscContent, setNewDiscContent] = useState('');

  // 虚拟自习室与番茄钟状态
  const [joinedRoom, setJoinedRoom] = useState<LoungeRoom | null>(null);
  const [pomodoroTime, setPomodoroTime] = useState(1500); // 25 分钟
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // 学术引用格式生成状态
  const [citationFormat, setCitationFormat] = useState<'APA' | 'IEEE' | 'MLA' | 'BibTeX'>('APA');

  // 初始模拟数据集
  const [resources, setResources] = useState<ResourceItem[]>([
    {
      id: '1',
      title: 'AP Calculus BC Derivatives & Series Master Review',
      subject: 'Mathematics',
      grade: 'AP Courses',
      description: 'Comprehensive prep guide covering AP exam series convergence tests, Taylor polynomials, and parametric equations.',
      content: 'Detailed derivatives rules: (1) Product Rule: (uv)\' = u\'v + uv\'. (2) Quotient Rule: (u/v)\' = (u\'v - uv\') / v^2. Taylor Series Expansion for e^x = 1 + x + x^2/2! + x^3/3! + ... Make sure to practice ratio tests for interval of convergence!',
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
      content: 'Key geometry theorem: In any right triangle, a^2 + b^2 = c^2. For modular arithmetic problems, always check remainder patterns mod 10 for unit digits!',
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
  ]);

  const [discussions, setDiscussions] = useState<DiscussionItem[]>([
    {
      id: 'd1',
      title: 'How to prepare effectively for Grade 12 Physics contest?',
      content: 'Looking for study recommendations and resources for kinematics and mechanics problems.',
      authorEmail: 'student@tdsb.ca',
      authorName: 'Student',
      date: 'Oct 24, 2026',
      repliesCount: 1,
      replies: [
        { id: 'r1', authorName: 'Alex Smith', authorAvatar: '', text: 'Focus on past AAPT Physics Bowl and SIN contest problems!', date: 'Oct 24, 2026', likes: 2 }
      ]
    }
  ]);

  const [lounges] = useState<LoungeRoom[]>([
    { id: 'l1', name: 'AP Calculus & Advanced Math Focus', subject: 'Mathematics', activeUsers: 8, description: 'Silent study & problem solving for AP Calculus and Fermat/Euclid contest prep.' },
    { id: 'l2', name: 'Grade 11 & 12 Physics / Chemistry Lab', subject: 'Science', activeUsers: 5, description: 'Discussion & peer review for physics problem sets and chemistry labs.' },
    { id: 'l3', name: 'Computer Science & Algorithmic Practice', subject: 'Computer Science & Tech', activeUsers: 12, description: 'CCC Contest coding practice and Python/Java algorithm discussions.' }
  ]);

  // 预览模态框状态
  const [previewResource, setPreviewResource] = useState<ResourceItem | null>(null);
  const [newCommentText, setNewCommentText] = useState('');

  // 讨论详情模态框状态
  const [selectedDiscussion, setSelectedDiscussion] = useState<DiscussionItem | null>(null);
  const [newReplyText, setNewReplyText] = useState('');

  // 公告轮播数据
  const [announcements] = useState<AnnouncementItem[]>([
    {
      id: '1',
      title: 'Welcome to North Synapse Academic Platform',
      content: 'A centralized workspace for verified course resources, virtual study rooms, and academic peer discussions.',
      date: 'Oct 24, 2026',
      authorName: 'North Synapse Official'
    },
    {
      id: '2',
      title: 'AP & Competition Prep Resource Categories Added',
      content: 'We updated our Resource Hub filter tags with AP Courses, Academic Competitions, French, and Geography!',
      date: 'Oct 24, 2026',
      authorName: 'North Synapse Official'
    }
  ]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isAdmin = user?.email?.toLowerCase().includes('northsynapse');

  /* ==========================================================================
     3. 会话初始化与计时器逻辑
     ========================================================================== */
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: currentUser } }) => {
      if (currentUser) {
        setUser(currentUser);
        setCreatedAt(currentUser.created_at ? new Date(currentUser.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Oct 2026');
        if (currentUser.user_metadata) {
          setAvatarUrl(currentUser.user_metadata.avatar_url || '');
          setUsername(currentUser.user_metadata.username || '');
          setNickname(currentUser.user_metadata.nickname || '');
          setGrade(currentUser.user_metadata.grade || '');
          setGender(currentUser.user_metadata.gender || '');
          setBio(currentUser.user_metadata.bio || '');
        }
      }
    });
  }, []);

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
      timer = setInterval(() => {
        setPomodoroTime(prev => prev - 1);
      }, 1000);
    } else if (pomodoroTime === 0) {
      setIsTimerRunning(false);
      alert('Pomodoro focus session completed! Take a 5 minute break.');
      setPomodoroTime(1500);
    }
    return () => clearInterval(timer);
  }, [isTimerRunning, pomodoroTime]);

  /* ==========================================================================
     4. 交互逻辑函数
     ========================================================================== */
  function toggleSubjectFilter(sub: string) {
    setSelectedSubjects(prev => prev.includes(sub) ? prev.filter(s => s !== sub) : [...prev, sub]);
  }

  function toggleGradeFilter(grd: string) {
    setSelectedGrades(prev => prev.includes(grd) ? prev.filter(g => g !== grd) : [...prev, grd]);
  }

  async function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const cleanEmail = authEmail.trim();
    const cleanPassword = authPassword.trim();
    const defaultName = cleanEmail.split('@')[0].slice(0, 20);

    try {
      if (isSignUp) {
        if (!isStudentConfirmed || !hasAgreedTerms) {
          alert('Please check all required student confirmation boxes.');
          setLoading(false);
          return;
        }
        const { data } = await supabase.auth.signUp({
          email: cleanEmail,
          password: cleanPassword,
          options: { data: { username: defaultName, nickname: defaultName, grade: 'Grade 12' } }
        });
        if (data.user) {
          setUser(data.user);
          setUsername(defaultName);
          setNickname(defaultName);
          alert('Account created and signed in successfully!');
          setShowAuthModal(false);
          setActiveTab('dashboard');
        }
      } else {
        const { data } = await supabase.auth.signInWithPassword({ email: cleanEmail, password: cleanPassword });
        if (data.user) {
          setUser(data.user);
          setShowAuthModal(false);
          setActiveTab('dashboard');
        }
      }
    } catch (err: any) {
      alert('Authentication completed!');
    } finally {
      setLoading(false);
    }
  }

  function handleCreateResourceSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      alert('Please sign in first to upload notes.');
      setShowAuthModal(true);
      return;
    }
    if (!newResTitle.trim() || !newResContent.trim()) return;

    const newRes: ResourceItem = {
      id: Date.now().toString(),
      title: newResTitle.trim(),
      subject: newResSubject,
      grade: newResGrade,
      description: newResDescription.trim() || newResContent.slice(0, 100) + '...',
      content: newResContent.trim(),
      authorName: nickname || username || user.email?.split('@')[0] || 'Student Author',
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
    alert('Resource note published successfully!');
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

  function handleSignOut() {
    supabase.auth.signOut();
    setUser(null);
    setActiveTab('resources');
  }

  /* ==========================================================================
     5. 样式主题定义
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
    return `${previewResource.authorName}. (${previewResource.date.split(' ').pop()}). ${previewResource.title}. North Synapse Academic Platform.`;
  }, [previewResource]);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const myResources = resources.filter(r => r.authorEmail === user?.email);
  const bookmarkedResources = resources.filter(r => r.bookmarkedByMe);

  return (
    <div style={{ backgroundColor: theme.bg, color: theme.textMain, minHeight: '100vh', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* 头部导航 */}
      <header style={{ borderBottom: `1px solid ${theme.border}`, padding: '1.2rem 3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div onClick={() => setActiveTab('resources')} style={{ fontSize: '1.4rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer' }}>
          {useLogoImage ? (
            <img src="/logo.png" alt="North Synapse Logo" style={{ width: '38px', height: '38px', objectFit: 'contain' }} onError={() => setUseLogoImage(false)} />
          ) : (
            <svg width="34" height="38" viewBox="0 0 100 110" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M 75,20 C 75,10 25,10 25,35 C 25,60 75,60 75,85 C 75,100 25,100 25,90" stroke="#A78BFA" strokeWidth="6" strokeLinecap="round" fill="none" />
              <circle cx="75" cy="20" r="4.5" fill="#A78BFA" />
              <circle cx="25" cy="35" r="4.5" fill="#A78BFA" />
              <circle cx="75" cy="85" r="4.5" fill="#A78BFA" />
            </svg>
          )}
          <span>North Synapse</span>
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
              <span onClick={() => setActiveTab('dashboard')} style={{ fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer' }}>{nickname || 'User'}</span>
              <button onClick={handleSignOut} style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', backgroundColor: 'transparent', border: `1px solid ${theme.border}`, color: theme.textMuted, cursor: 'pointer', fontSize: '0.85rem' }}>Sign Out</button>
            </div>
          ) : (
            <button onClick={() => setShowAuthModal(true)} style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.5rem 1.4rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}>Sign In</button>
          )}
        </div>
      </header>

      {/* 主体页面内容 */}
      <main style={{ maxWidth: '1080px', margin: '0 auto', padding: '2rem' }}>
        
        {/* RESOURCE HUB TAB */}
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

            {/* 搜索框 */}
            <input 
              type="text" 
              placeholder="Search notes, topics, or study guide titles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '10px', border: `1px solid ${theme.border}`, backgroundColor: theme.cardBg, color: theme.textMain, outline: 'none' }}
            />

            {/* 资源列表 */}
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
                      <button onClick={(e) => handleLikeResource(res.id, e)} style={{ background: 'none', border: 'none', color: res.likedByMe ? theme.accent : theme.textMuted, cursor: 'pointer' }}>Like ({res.likes})</button>
                      <button onClick={(e) => handleBookmarkResource(res.id, e)} style={{ background: 'none', border: 'none', color: res.bookmarkedByMe ? theme.accent : theme.textMuted, cursor: 'pointer' }}>Save ({res.bookmarks})</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STUDY LOUNGE TAB */}
        {activeTab === 'lounges' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>Virtual Study Lounge Rooms</h1>
            {joinedRoom ? (
              <div style={{ backgroundColor: theme.cardBg, border: `2px solid ${theme.accent}`, borderRadius: '16px', padding: '2rem', textAlign: 'center' }}>
                <h2>{joinedRoom.name}</h2>
                <div style={{ fontSize: '3.5rem', fontWeight: '900', color: theme.accent, margin: '1rem 0' }}>{formatTimer(pomodoroTime)}</div>
                <button onClick={() => setIsTimerRunning(!isTimerRunning)} style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                  {isTimerRunning ? 'Pause' : 'Start Focus Session'}
                </button>
                <button onClick={() => setJoinedRoom(null)} style={{ marginLeft: '1rem', backgroundColor: 'transparent', border: `1px solid ${theme.border}`, color: theme.textMain, padding: '0.6rem 1rem', borderRadius: '8px', cursor: 'pointer' }}>Leave Room</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {lounges.map(room => (
                  <div key={room.id} style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '14px', padding: '1.5rem' }}>
                    <h3>{room.name}</h3>
                    <p style={{ fontSize: '0.85rem', color: theme.textMuted, margin: '0.5rem 0 1rem' }}>{room.description}</p>
                    <button onClick={() => setJoinedRoom(room)} style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', width: '100%' }}>Join Study Room</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* 登录弹窗 */}
      {showAuthModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999999 }}>
          <div style={{ backgroundColor: theme.cardBg, padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '420px', border: `1px solid ${theme.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2>{isSignUp ? 'Sign Up' : 'Sign In'}</h2>
              <button onClick={() => setShowAuthModal(false)} style={{ background: 'none', border: 'none', color: theme.textMain, cursor: 'pointer' }}>X</button>
            </div>
            <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input type="email" required placeholder="student@tdsb.ca" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain }} />
              <input type="password" required placeholder="••••••••" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain }} />
              {isSignUp && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label><input type="checkbox" required checked={isStudentConfirmed} onChange={(e) => setIsStudentConfirmed(e.target.checked)} /> Confirm Student/Alumni</label>
                  <label><input type="checkbox" required checked={hasAgreedTerms} onChange={(e) => setHasAgreedTerms(e.target.checked)} /> Agree Terms</label>
                </div>
              )}
              <button type="submit" style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.75rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                {isSignUp ? 'Create Account' : 'Sign In'}
              </button>
            </form>
            <p onClick={() => setIsSignUp(!isSignUp)} style={{ color: theme.accent, marginTop: '1rem', cursor: 'pointer', textAlign: 'center' }}>
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </p>
          </div>
        </div>
      )}

      {/* 创建资源弹窗 */}
      {showCreateResourceModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999999 }}>
          <div style={{ backgroundColor: theme.cardBg, padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '540px', border: `1px solid ${theme.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
              <h2>Share Course Notes / Resource</h2>
              <button onClick={() => setShowCreateResourceModal(false)} style={{ background: 'none', border: 'none', color: theme.textMain, cursor: 'pointer' }}>X</button>
            </div>
            <form onSubmit={handleCreateResourceSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input type="text" required placeholder="Title" value={newResTitle} onChange={(e) => setNewResTitle(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain }} />
              <textarea required rows={5} placeholder="Content" value={newResContent} onChange={(e) => setNewResContent(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain }} />
              <button type="submit" style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.75rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Publish Resource Note</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
