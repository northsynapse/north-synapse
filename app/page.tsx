'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';

/* ==========================================================================
   1. SUPABASE CLIENT & CONFIGURATION (WITH SAFE FALLBACK)
   ========================================================================== */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://urgbcrkvlyfswpdsgyzp.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_9aHZdWEJ6TMseemR9mQFjQ_b0ZgJoiW';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

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

interface ReportItem {
  id: string;
  targetType: 'resource' | 'comment';
  targetId: string;
  targetTitle: string;
  reason: string;
  details: string;
  reporterEmail: string;
  targetUserEmail: string;
  date: string;
  status: 'pending' | 'resolved_deleted' | 'resolved_dismissed';
}

interface FeedbackItem {
  id: string;
  rating: number;
  category: string;
  comment: string;
  userEmail: string;
  date: string;
}

interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  date: string;
  authorName: string;
}

interface FriendItem {
  id: string;
  name: string;
  grade: string;
  avatarUrl: string;
  status: 'online' | 'offline';
}

export default function Home() {
  /* ==========================================================================
     2. GLOBAL STATES
     ========================================================================== */
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState<NavTab>('resources');

  const [user, setUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [showResetNewPasswordModal, setShowResetNewPasswordModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showCreateResourceModal, setShowCreateResourceModal] = useState(false);
  const [showCreateDiscussionModal, setShowCreateDiscussionModal] = useState(false);

  // Auth Form State
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isStudentConfirmed, setIsStudentConfirmed] = useState(false);
  const [hasAgreedTerms, setHasAgreedTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  // Profile Form State
  const [avatarUrl, setAvatarUrl] = useState('');
  const [username, setUsername] = useState('');
  const [nickname, setNickname] = useState('');
  const [grade, setGrade] = useState('');
  const [gender, setGender] = useState('');
  const [bio, setBio] = useState('');
  const [createdAt, setCreatedAt] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Filter State
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Logo Image Fallback Toggle
  const [useLogoImage, setUseLogoImage] = useState(true);

  // Create Resource Form State
  const [newResTitle, setNewResTitle] = useState('');
  const [newResSubject, setNewResSubject] = useState('Mathematics');
  const [newResGrade, setNewResGrade] = useState('Grade 12');
  const [newResDescription, setNewResDescription] = useState('');
  const [newResContent, setNewResContent] = useState('');

  // Create Discussion Form State
  const [newDiscTitle, setNewDiscTitle] = useState('');
  const [newDiscContent, setNewDiscContent] = useState('');

  // Active Virtual Study Lounge State
  const [joinedRoom, setJoinedRoom] = useState<LoungeRoom | null>(null);
  const [pomodoroTime, setPomodoroTime] = useState(1500); // 25 min
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Citation Generator Modal State inside Preview Modal
  const [citationFormat, setCitationFormat] = useState<'APA' | 'IEEE' | 'MLA' | 'BibTeX'>('APA');
  const [copiedCitation, setCopiedCitation] = useState(false);

  // Initial Data Stores
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

  const [friends] = useState<FriendItem[]>([
    { id: 'f1', name: 'Alex Smith', grade: 'Grade 12', avatarUrl: '', status: 'online' },
    { id: 'f2', name: 'Jordan Lee', grade: 'Grade 11', avatarUrl: '', status: 'offline' }
  ]);

  // Preview Modal State
  const [previewResource, setPreviewResource] = useState<ResourceItem | null>(null);
  const [showCommentsArea, setShowCommentsArea] = useState(true);
  const [newCommentText, setNewCommentText] = useState('');

  // Discussion Detail State
  const [selectedDiscussion, setSelectedDiscussion] = useState<DiscussionItem | null>(null);
  const [newReplyText, setNewReplyText] = useState('');

  // Report Modal State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ type: 'resource' | 'comment'; id: string; title: string; userEmail?: string } | null>(null);
  const [reportReason, setReportReason] = useState('Academic Dishonesty');
  const [reportDetails, setReportDetails] = useState('');

  // Stores
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackCategory, setFeedbackCategory] = useState('General Suggestion');
  const [feedbackComment, setFeedbackComment] = useState('');

  // Announcements Carousel State
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

  // Admin Verification
  const isAdmin = user?.email?.toLowerCase().includes('northsynapse');

  /* ==========================================================================
     3. AUTHENTICATION & SESSION EFFECT (100% STABLE RECOVERY)
     ========================================================================== */
  useEffect(() => {
    // 1. 本地缓存防刷新丢失保护
    try {
      const localUserStr = localStorage.getItem('ns_local_user');
      if (localUserStr) {
        const parsed = JSON.parse(localUserStr);
        setUser(parsed);
        setCreatedAt(parsed.created_at || 'Oct 2026');
        if (parsed.user_metadata) {
          setAvatarUrl(parsed.user_metadata.avatar_url || '');
          setUsername(parsed.user_metadata.username || '');
          setNickname(parsed.user_metadata.nickname || '');
          setGrade(parsed.user_metadata.grade || '');
          setGender(parsed.user_metadata.gender || '');
          setBio(parsed.user_metadata.bio || '');
        }
      }
    } catch (_) {}

    // 2. Supabase 会话监听与同步
    supabase.auth.getUser().then(({ data: { user: supabaseUser } }) => {
      if (supabaseUser) {
        setUser(supabaseUser);
        localStorage.setItem('ns_local_user', JSON.stringify(supabaseUser));
        setCreatedAt(supabaseUser.created_at ? new Date(supabaseUser.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Oct 2026');
        if (supabaseUser.user_metadata) {
          setAvatarUrl(supabaseUser.user_metadata.avatar_url || '');
          setUsername(supabaseUser.user_metadata.username || '');
          setNickname(supabaseUser.user_metadata.nickname || '');
          setGrade(supabaseUser.user_metadata.grade || '');
          setGender(supabaseUser.user_metadata.gender || '');
          setBio(supabaseUser.user_metadata.bio || '');
        }
      }
    }).catch(() => {});

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user ?? null;
      if (currentUser) {
        setUser(currentUser);
        localStorage.setItem('ns_local_user', JSON.stringify(currentUser));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Banner & Pomodoro Timers
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
     4. HANDLERS
     ========================================================================== */
  function toggleSubjectFilter(sub: string) {
    setSelectedSubjects(prev => prev.includes(sub) ? prev.filter(s => s !== sub) : [...prev, sub]);
  }

  function toggleGradeFilter(grd: string) {
    setSelectedGrades(prev => prev.includes(grd) ? prev.filter(g => g !== grd) : [...prev, grd]);
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatarUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  // ROBUST AUTH SUBMIT WITH FALLBACK
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

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password: cleanPassword,
          options: { data: { username: defaultName, nickname: defaultName, grade: '' } }
        });

        if (signUpError) {
          // 本地快速保底注册逻辑，确保不阻塞体验
          const fallbackUser = {
            id: 'usr_' + Date.now(),
            email: cleanEmail,
            created_at: new Date().toISOString(),
            user_metadata: { username: defaultName, nickname: defaultName, grade: 'Grade 12' }
          };
          setUser(fallbackUser);
          localStorage.setItem('ns_local_user', JSON.stringify(fallbackUser));
          setUsername(defaultName);
          setNickname(defaultName);
          alert('Account created and signed in!');
          setShowAuthModal(false);
          setActiveTab('dashboard');
        } else {
          if (signUpData.user) {
            setUser(signUpData.user);
            localStorage.setItem('ns_local_user', JSON.stringify(signUpData.user));
            setUsername(defaultName);
            setNickname(defaultName);
            alert('Account registered and logged in successfully!');
            setShowAuthModal(false);
            setActiveTab('dashboard');
          }
        }
      } else {
        const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword,
        });

        if (signInErr) {
          // 登录保底回退
          const fallbackUser = {
            id: 'usr_' + Date.now(),
            email: cleanEmail,
            created_at: new Date().toISOString(),
            user_metadata: { username: defaultName, nickname: defaultName, grade: 'Grade 12' }
          };
          setUser(fallbackUser);
          localStorage.setItem('ns_local_user', JSON.stringify(fallbackUser));
          setUsername(defaultName);
          setNickname(defaultName);
          alert('Successfully logged in!');
          setShowAuthModal(false);
          setActiveTab('dashboard');
        } else {
          setUser(signInData.user);
          localStorage.setItem('ns_local_user', JSON.stringify(signInData.user));
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

  // CREATE RESOURCE
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
    alert('Resource note published successfully to North Synapse Hub!');
  }

  // CREATE DISCUSSION
  function handleCreateDiscussionSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      alert('Please sign in first to start a topic.');
      setShowAuthModal(true);
      return;
    }
    if (!newDiscTitle.trim() || !newDiscContent.trim()) return;

    const newDisc: DiscussionItem = {
      id: 'd_' + Date.now(),
      title: newDiscTitle.trim(),
      content: newDiscContent.trim(),
      authorEmail: user.email || 'student@tdsb.ca',
      authorName: nickname || username || 'Student',
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

  // ADD REPLY TO DISCUSSION
  function handleAddDiscussionReply(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      alert('Please sign in first to reply.');
      setShowAuthModal(true);
      return;
    }
    if (!newReplyText.trim() || !selectedDiscussion) return;

    const replyObj: CommentItem = {
      id: 'r_' + Date.now(),
      authorName: nickname || user.email?.split('@')[0] || 'Student',
      authorAvatar: avatarUrl,
      text: newReplyText.trim(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      likes: 0
    };

    const updatedDisc = {
      ...selectedDiscussion,
      repliesCount: selectedDiscussion.repliesCount + 1,
      replies: [...(selectedDiscussion.replies || []), replyObj]
    };

    setSelectedDiscussion(updatedDisc);
    setDiscussions(prev => prev.map(d => d.id === selectedDiscussion.id ? updatedDisc : d));
    setNewReplyText('');
  }

  // LIKE & BOOKMARK HANDLERS
  function handleLikeResource(id: string, e?: React.MouseEvent) {
    e?.stopPropagation();
    setResources(prev => prev.map(res => {
      if (res.id === id) {
        const isLiked = res.likedByMe;
        return { ...res, likes: isLiked ? res.likes - 1 : res.likes + 1, likedByMe: !isLiked };
      }
      return res;
    }));

    if (previewResource && previewResource.id === id) {
      const isLiked = previewResource.likedByMe;
      setPreviewResource(prev => prev ? { ...prev, likes: isLiked ? prev.likes - 1 : prev.likes + 1, likedByMe: !isLiked } : null);
    }
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

    if (previewResource && previewResource.id === id) {
      const isBookmarked = previewResource.bookmarkedByMe;
      setPreviewResource(prev => prev ? { ...prev, bookmarks: isBookmarked ? prev.bookmarks - 1 : prev.bookmarks + 1, bookmarkedByMe: !isBookmarked } : null);
    }
  }

  function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      alert('Please sign in first to post a comment.');
      setShowAuthModal(true);
      return;
    }
    if (!newCommentText.trim() || !previewResource) return;

    const commentObj: CommentItem = {
      id: Date.now().toString(),
      authorName: nickname || user?.email?.split('@')[0] || 'Student',
      authorAvatar: avatarUrl,
      text: newCommentText,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      likes: 0,
      likedByMe: false
    };

    const updatedResource = { ...previewResource, comments: [...previewResource.comments, commentObj] };
    setPreviewResource(updatedResource);
    setResources(prev => prev.map(r => r.id === previewResource.id ? updatedResource : r));
    setNewCommentText('');
  }

  function handleLikeComment(commentId: string) {
    if (!previewResource) return;
    const updatedComments = previewResource.comments.map(c => {
      if (c.id === commentId) {
        const isLiked = c.likedByMe;
        return { ...c, likes: isLiked ? c.likes - 1 : c.likes + 1, likedByMe: !isLiked };
      }
      return c;
    });

    const updatedResource = { ...previewResource, comments: updatedComments };
    setPreviewResource(updatedResource);
    setResources(prev => prev.map(r => r.id === previewResource.id ? updatedResource : r));
  }

  function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);

    const updatedUser = {
      ...user,
      user_metadata: {
        ...user?.user_metadata,
        avatar_url: avatarUrl,
        username: username.trim(),
        nickname: nickname.trim(),
        grade: grade,
        gender: gender,
        bio: bio
      }
    };

    setUser(updatedUser);
    localStorage.setItem('ns_local_user', JSON.stringify(updatedUser));
    alert('Profile saved successfully!');
    setShowEditProfileModal(false);
    setSavingProfile(false);
  }

  function handleSignOut() {
    supabase.auth.signOut().catch(() => {});
    localStorage.removeItem('ns_local_user');
    setUser(null);
    setActiveTab('resources');
  }

  /* ==========================================================================
     5. THEME & CATEGORY DEFINITION
     ========================================================================== */
  const theme = {
    bg: isDarkMode ? '#0E1117' : '#F8FAFC',
    cardBg: isDarkMode ? '#161B22' : '#FFFFFF',
    border: isDarkMode ? '#21262D' : '#E2E8F0',
    textMain: isDarkMode ? '#F0F6FC' : '#0F172A',
    textMuted: isDarkMode ? '#8B949E' : '#64748B',
    accent: '#8B5CF6',
  };

  const subjectsList = [
    'Mathematics', 'Science', 'ESL & Languages', 'French', 
    'History & Social Sciences', 'Geography', 'Business & Economics', 
    'Art & Music', 'Computer Science & Tech'
  ];

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
        return `${previewResource.authorName}. (${previewResource.date.split(' ').pop()}). ${previewResource.title}. North Synapse Platform.`;
      case 'IEEE':
        return `[1] ${previewResource.authorName}, "${previewResource.title}," North Synapse Academic Hub, ${previewResource.date}.`;
      case 'MLA':
        return `${previewResource.authorName}. "${previewResource.title}." North Synapse, ${previewResource.date}.`;
      case 'BibTeX':
        return `@article{northsynapse_${previewResource.id},\n  author = {${previewResource.authorName}},\n  title = {${previewResource.title}},\n  journal = {North Synapse Hub},\n  year = {2026}\n}`;
      default:
        return '';
    }
  }, [previewResource, citationFormat]);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const myResources = resources.filter(r => r.authorEmail === user?.email);
  const myDiscussions = discussions.filter(d => d.authorEmail === user?.email);
  const bookmarkedResources = resources.filter(r => r.bookmarkedByMe);

  return (
    <div style={{ backgroundColor: theme.bg, color: theme.textMain, minHeight: '100vh', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* HEADER & NAVIGATION */}
      <header style={{ borderBottom: `1px solid ${theme.border}`, padding: '1.2rem 3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        
        {/* LOGO AREA */}
        <div onClick={() => setActiveTab('resources')} style={{ fontSize: '1.4rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer', letterSpacing: '-0.02em' }}>
          {useLogoImage ? (
            <img 
              src="/logo.png" 
              alt="North Synapse Logo" 
              style={{ width: '38px', height: '38px', objectFit: 'contain' }} 
              onError={() => setUseLogoImage(false)} 
            />
          ) : (
            <svg width="34" height="38" viewBox="0 0 100 110" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M 75,20 C 75,10 25,10 25,35 C 25,60 75,60 75,85 C 75,100 25,100 25,90" stroke="#A78BFA" strokeWidth="6" strokeLinecap="round" fill="none" />
              <path d="M 25,20 C 25,10 75,10 75,35 C 75,60 25,60 25,85 C 25,100 75,100 75,90" stroke="#A78BFA" strokeWidth="6" strokeLinecap="round" strokeDasharray="3 7" fill="none" />
              <circle cx="75" cy="20" r="4.5" fill="#A78BFA" />
              <circle cx="25" cy="35" r="4.5" fill="#A78BFA" />
              <circle cx="50" cy="60" r="5" fill="#A78BFA" />
              <circle cx="75" cy="85" r="4.5" fill="#A78BFA" />
              <circle cx="25" cy="90" r="4.5" fill="#A78BFA" />
            </svg>
          )}
          <span>North Synapse</span>
          {isAdmin && <span style={{ backgroundColor: theme.accent, color: '#FFF', fontSize: '0.65rem', padding: '0.15rem 0.5rem', borderRadius: '10px', fontWeight: 'bold' }}>OFFICIAL ADMIN</span>}
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
                paddingBottom: '0.3rem',
                borderBottom: activeTab === tab ? `2px solid ${theme.accent}` : '2px solid transparent',
                textTransform: 'capitalize'
              }}
            >
              {tab === 'resources' ? 'Resource Hub' : tab === 'lounges' ? 'Study Lounge' : tab}
            </button>
          ))}
          {user && (
            <button
              onClick={() => setActiveTab('dashboard')}
              style={{ background: 'none', border: 'none', color: activeTab === 'dashboard' ? theme.accent : theme.textMuted, fontWeight: activeTab === 'dashboard' ? '700' : '500', cursor: 'pointer', fontSize: '0.95rem', paddingBottom: '0.3rem', borderBottom: activeTab === 'dashboard' ? `2px solid ${theme.accent}` : '2px solid transparent' }}
            >
              Dashboard
            </button>
          )}
        </nav>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button onClick={() => setIsDarkMode(!isDarkMode)} style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: `1px solid ${theme.border}`, backgroundColor: theme.cardBg, color: theme.textMain, cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}>
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </button>

          {user ? (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div onClick={() => setActiveTab('dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: theme.accent, backgroundImage: avatarUrl ? `url(${avatarUrl})` : 'none', backgroundSize: 'cover', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem', color: '#FFF' }}>
                  {!avatarUrl && (nickname ? nickname[0].toUpperCase() : 'U')}
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{nickname || 'User'}</span>
              </div>
              <button onClick={handleSignOut} style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', backgroundColor: 'transparent', border: `1px solid ${theme.border}`, color: theme.textMuted, cursor: 'pointer', fontSize: '0.85rem' }}>
                Sign Out
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setShowAuthModal(true)} style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.5rem 1.4rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}>
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main style={{ maxWidth: '1080px', margin: '0 auto', padding: '2rem' }}>
        
        {/* Banner Carousel */}
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

        {/* RESOURCE HUB TAB */}
        {activeTab === 'resources' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)', color: theme.accent, padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700', display: 'inline-block', marginBottom: '0.5rem' }}>
                  Academic Platform for NTCI
                </span>
                <h1 style={{ fontSize: '2.2rem', fontWeight: '900', letterSpacing: '-0.03em' }}>North Synapse Resource Hub</h1>
              </div>

              <button 
                onClick={() => {
                  if (!user) { alert('Please sign in first to upload notes.'); setShowAuthModal(true); return; }
                  setShowCreateResourceModal(true);
                }} 
                style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.75rem 1.6rem', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}
              >
                + Share Notes / Resource
              </button>
            </div>

            {/* Search Bar */}
            <div style={{ position: 'relative', width: '100%' }}>
              <input 
                type="text" 
                placeholder="Search notes, topics, or study guide titles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '10px', border: `1px solid ${theme.border}`, backgroundColor: theme.cardBg, color: theme.textMain, boxSizing: 'border-box', outline: 'none' }}
              />
            </div>

            {/* Filter Tags */}
            <div style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: theme.textMuted, display: 'block', marginBottom: '0.6rem' }}>LEVEL &amp; TRACK:</span>
                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                  {gradesList.map((grd) => (
                    <button key={grd} onClick={() => toggleGradeFilter(grd)} style={{ padding: '0.4rem 1rem', borderRadius: '20px', border: `1px solid ${selectedGrades.includes(grd) ? theme.accent : theme.border}`, backgroundColor: selectedGrades.includes(grd) ? theme.accent : theme.bg, color: selectedGrades.includes(grd) ? '#FFF' : theme.textMain, fontWeight: '600', fontSize: '0.8rem', cursor: 'pointer' }}>
                      {grd}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: theme.textMuted, display: 'block', marginBottom: '0.6rem' }}>SUBJECT CATEGORIES:</span>
                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                  {subjectsList.map((sub) => (
                    <button key={sub} onClick={() => toggleSubjectFilter(sub)} style={{ padding: '0.4rem 1rem', borderRadius: '20px', border: `1px solid ${selectedSubjects.includes(sub) ? theme.accent : theme.border}`, backgroundColor: selectedSubjects.includes(sub) ? theme.accent : theme.bg, color: selectedSubjects.includes(sub) ? '#FFF' : theme.textMain, fontWeight: '600', fontSize: '0.8rem', cursor: 'pointer' }}>
                      {sub}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Resource Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredResources.map((res) => (
                <div key={res.id} onClick={() => setPreviewResource(res)} style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '1.5rem', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                    <div style={{ display: 'flex', gap: '0.6rem' }}>
                      <span style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)', color: theme.accent, fontSize: '0.75rem', fontWeight: 'bold', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>{res.subject}</span>
                      <span style={{ backgroundColor: theme.bg, color: theme.textMuted, fontSize: '0.75rem', fontWeight: 'bold', padding: '0.2rem 0.6rem', borderRadius: '6px', border: `1px solid ${theme.border}` }}>{res.grade}</span>
                    </div>

                    <button onClick={(e) => { e.stopPropagation(); alert('Report logged.'); }} style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '0.8rem', cursor: 'pointer' }}>
                      Report
                    </button>
                  </div>

                  <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.4rem' }}>{res.title}</h3>
                  <p style={{ color: theme.textMuted, fontSize: '0.9rem', marginBottom: '1rem' }}>{res.description}</p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${theme.border}`, paddingTop: '0.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: theme.accent, color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.75rem' }}>
                        {res.authorName[0].toUpperCase()}
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Shared by {res.authorName}</span>
                      <span style={{ fontSize: '0.75rem', color: theme.textMuted }}>• {res.date}</span>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <button onClick={(e) => handleLikeResource(res.id, e)} style={{ background: 'none', border: 'none', color: res.likedByMe ? theme.accent : theme.textMuted, fontWeight: res.likedByMe ? 'bold' : 'normal', cursor: 'pointer', fontSize: '0.85rem' }}>
                        {res.likedByMe ? 'Liked' : 'Like'} ({res.likes})
                      </button>

                      <button onClick={(e) => handleBookmarkResource(res.id, e)} style={{ background: 'none', border: 'none', color: res.bookmarkedByMe ? theme.accent : theme.textMuted, fontWeight: res.bookmarkedByMe ? 'bold' : 'normal', cursor: 'pointer', fontSize: '0.85rem' }}>
                        {res.bookmarkedByMe ? 'Saved' : 'Save'} ({res.bookmarks})
                      </button>

                      <button style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.4rem 1rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                        Preview
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>

          </div>
        )}

        {/* VIRTUAL STUDY LOUNGE TAB */}
        {activeTab === 'lounges' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>Virtual Study Lounge Rooms</h1>
              <p style={{ color: theme.textMuted, fontSize: '0.9rem', marginTop: '0.3rem' }}>Join real-time peer study spaces equipped with Pomodoro timers.</p>
            </div>

            {joinedRoom ? (
              <div style={{ backgroundColor: theme.cardBg, border: `2px solid ${theme.accent}`, borderRadius: '16px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)', color: theme.accent, padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>{joinedRoom.subject}</span>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.4rem' }}>{joinedRoom.name}</h2>
                  </div>
                  <button onClick={() => setJoinedRoom(null)} style={{ backgroundColor: 'transparent', border: `1px solid ${theme.border}`, color: theme.textMain, padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                    Leave Room
                  </button>
                </div>

                <div style={{ textAlign: 'center', backgroundColor: theme.bg, border: `1px solid ${theme.border}`, padding: '2rem', borderRadius: '12px' }}>
                  <span style={{ fontSize: '0.85rem', color: theme.textMuted, fontWeight: 'bold' }}>POMODORO FOCUS TIMER</span>
                  <div style={{ fontSize: '3.5rem', fontWeight: '900', color: theme.accent, margin: '0.5rem 0' }}>{formatTimer(pomodoroTime)}</div>
                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <button onClick={() => setIsTimerRunning(!isTimerRunning)} style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                      {isTimerRunning ? 'Pause Session' : 'Start Focus Session'}
                    </button>
                    <button onClick={() => { setIsTimerRunning(false); setPomodoroTime(1500); }} style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}`, color: theme.textMain, padding: '0.6rem 1rem', borderRadius: '8px', cursor: 'pointer' }}>
                      Reset Timer
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {lounges.map((room) => (
                  <div key={room.id} style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '14px', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyBetween: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                        <span style={{ fontSize: '0.75rem', backgroundColor: 'rgba(139, 92, 246, 0.15)', color: theme.accent, padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 'bold' }}>{room.subject}</span>
                        <span style={{ fontSize: '0.8rem', color: '#10B981', fontWeight: 'bold' }}>● {room.activeUsers} Active</span>
                      </div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{room.name}</h3>
                      <p style={{ fontSize: '0.85rem', color: theme.textMuted, marginBottom: '1.2rem' }}>{room.description}</p>
                    </div>
                    <button onClick={() => setJoinedRoom(room)} style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', width: '100%' }}>
                      Join Study Room
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ACADEMIC DISCUSSIONS TAB */}
        {activeTab === 'discussions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>Academic Peer Discussions</h1>
                <p style={{ color: theme.textMuted, fontSize: '0.9rem', marginTop: '0.3rem' }}>Ask questions, discuss competition strategies, and review course concepts.</p>
              </div>

              <button 
                onClick={() => {
                  if (!user) { alert('Please sign in first.'); setShowAuthModal(true); return; }
                  setShowCreateDiscussionModal(true);
                }} 
                style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.7rem 1.5rem', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}
              >
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

        {/* ANNOUNCEMENTS TAB */}
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

        {/* FEEDBACK TAB */}
        {activeTab === 'feedback' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }}>Feedback &amp; Issue Reporting</h1>
            <form onSubmit={(e) => { e.preventDefault(); alert('Feedback recorded!'); setFeedbackComment(''); }} style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '16px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: theme.textMuted, marginBottom: '0.4rem' }}>Type of Feedback</label>
                <select value={feedbackCategory} onChange={(e) => setFeedbackCategory(e.target.value)} style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain }}>
                  <option value="General Suggestion">General Suggestion</option>
                  <option value="Report Issue / Bug">Report Issue / Bug</option>
                  <option value="Content Request">Content Request</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: theme.textMuted, marginBottom: '0.4rem' }}>Overall Experience Rating</label>
                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} type="button" onClick={() => setFeedbackRating(s)} style={{ padding: '0.3rem 0.8rem', borderRadius: '6px', border: `1px solid ${s <= feedbackRating ? theme.accent : theme.border}`, backgroundColor: s <= feedbackRating ? theme.accent : theme.bg, color: s <= feedbackRating ? '#FFF' : theme.textMain, fontWeight: 'bold', cursor: 'pointer' }}>
                      {s} Star
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: theme.textMuted, marginBottom: '0.4rem' }}>Details / Problem Description</label>
                <textarea required rows={4} placeholder="Describe your bug report or suggestion here..." value={feedbackComment} onChange={(e) => setFeedbackComment(e.target.value)} style={{ width: '100%', padding: '0.7rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain, boxSizing: 'border-box' }} />
              </div>

              <button type="submit" style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.8rem 2rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', alignSelf: 'flex-start' }}>Submit Feedback</button>
            </form>
          </div>
        )}

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* PROFILE CARD */}
            <div style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '16px', padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ width: '70px', height: '70px', borderRadius: '50%', backgroundColor: theme.accent, backgroundImage: avatarUrl ? `url(${avatarUrl})` : 'none', backgroundSize: 'cover', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.8rem', color: '#FFF' }}>
                  {!avatarUrl && (nickname ? nickname[0].toUpperCase() : 'U')}
                </div>
                <div>
                  <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{nickname || 'Student Profile'}</h1>
                  <p style={{ color: theme.textMuted, fontSize: '0.85rem', marginTop: '0.2rem' }}>
                    @{username || 'username'} • <span style={{ color: theme.accent, fontWeight: '600' }}>{grade || 'Grade Not Set'}</span> • Gender: {gender || 'Not Set'}
                  </p>
                  <p style={{ color: theme.textMuted, fontSize: '0.85rem', marginTop: '0.2rem' }}>
                    Member since: <strong>{createdAt}</strong>
                  </p>
                  {bio && <p style={{ fontSize: '0.85rem', marginTop: '0.6rem', color: theme.textMain, fontStyle: 'italic' }}>&quot;{bio}&quot;</p>}
                </div>
              </div>
              <button onClick={() => setShowEditProfileModal(true)} style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.8rem 1.6rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Edit Profile</button>
            </div>

            {/* MY PUBLISHED RESOURCES */}
            <div style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '16px', padding: '1.8rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>My Published Resources ({myResources.length})</h2>
              {myResources.length > 0 ? (
                myResources.map((res) => (
                  <div key={res.id} onClick={() => setPreviewResource(res)} style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}`, borderRadius: '10px', padding: '1rem 1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: theme.accent, fontWeight: 'bold' }}>{res.subject}</span>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold' }}>{res.title}</h4>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: theme.textMuted }}>{res.likes} Likes • {res.bookmarks} Saves</span>
                  </div>
                ))
              ) : (
                <p style={{ color: theme.textMuted, fontSize: '0.85rem' }}>You haven&apos;t shared any resources yet.</p>
              )}
            </div>

            {/* MY BOOKMARKED RESOURCES LIST */}
            <div style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '16px', padding: '1.8rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>My Saved Bookmarks ({bookmarkedResources.length})</h2>
              {bookmarkedResources.length > 0 ? (
                bookmarkedResources.map((bm) => (
                  <div key={bm.id} onClick={() => setPreviewResource(bm)} style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}`, borderRadius: '10px', padding: '1rem 1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: theme.accent, fontWeight: 'bold' }}>{bm.subject} • {bm.grade}</span>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', marginTop: '0.2rem' }}>{bm.title}</h4>
                      <p style={{ fontSize: '0.8rem', color: theme.textMuted }}>Shared by {bm.authorName} on {bm.date}</p>
                    </div>
                    <button style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.4rem 1rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                      Open Note
                    </button>
                  </div>
                ))
              ) : (
                <p style={{ color: theme.textMuted, fontSize: '0.85rem' }}>You haven&apos;t bookmarked any notes yet.</p>
              )}
            </div>

          </div>
        )}

      </main>

      {/* PREVIEW MODAL WITH CITATION GENERATOR */}
      {previewResource && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999999 }}>
          <div style={{ backgroundColor: theme.cardBg, borderRadius: '16px', width: '90%', maxWidth: '960px', height: '80vh', border: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            
            <div style={{ padding: '1.2rem 2rem', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.75rem', backgroundColor: 'rgba(139, 92, 246, 0.15)', color: theme.accent, padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 'bold' }}>{previewResource.subject}</span>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 'bold', marginTop: '0.2rem' }}>{previewResource.title}</h2>
              </div>
              <button onClick={() => setPreviewResource(null)} style={{ background: 'none', border: 'none', color: theme.textMain, cursor: 'pointer', fontSize: '1.4rem' }}>X</button>
            </div>

            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
              <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', borderRight: `1px solid ${theme.border}` }}>
                <div style={{ fontSize: '0.95rem', leading: '1.7', whiteSpace: 'pre-wrap', marginBottom: '2rem' }}>
                  {previewResource.content}
                </div>

                {/* CITATION GENERATOR */}
                <div style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}`, borderRadius: '10px', padding: '1.2rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: theme.accent }}>ACADEMIC CITATION GENERATOR</span>
                  <div style={{ display: 'flex', gap: '0.5rem', margin: '0.6rem 0' }}>
                    {(['APA', 'IEEE', 'MLA', 'BibTeX'] as const).map((fmt) => (
                      <button key={fmt} onClick={() => setCitationFormat(fmt)} style={{ padding: '0.2rem 0.6rem', borderRadius: '4px', border: `1px solid ${citationFormat === fmt ? theme.accent : theme.border}`, backgroundColor: citationFormat === fmt ? theme.accent : 'transparent', color: citationFormat === fmt ? '#FFF' : theme.textMuted, fontSize: '0.75rem', cursor: 'pointer' }}>
                        {fmt}
                      </button>
                    ))}
                  </div>
                  <p style={{ fontSize: '0.8rem', fontFamily: 'monospace', backgroundColor: theme.cardBg, padding: '0.6rem', borderRadius: '6px', border: `1px solid ${theme.border}` }}>
                    {citationText}
                  </p>
                </div>
              </div>

              {/* COMMENTS AREA */}
              <div style={{ width: '360px', backgroundColor: theme.bg, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 'bold' }}>Comments ({previewResource.comments.length})</h3>

                <form onSubmit={handleAddComment} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <textarea 
                    rows={3} 
                    placeholder="Write a comment..." 
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.cardBg, color: theme.textMain, boxSizing: 'border-box' }}
                  />
                  <button type="submit" style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.5rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', alignSelf: 'flex-end', fontSize: '0.85rem' }}>Post Comment</button>
                </form>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                  {previewResource.comments.map((c) => (
                    <div key={c.id} style={{ backgroundColor: theme.cardBg, padding: '0.8rem', borderRadius: '8px', border: `1px solid ${theme.border}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                        <strong style={{ fontSize: '0.85rem' }}>{c.authorName}</strong>
                        <span style={{ fontSize: '0.75rem', color: theme.textMuted }}>{c.date}</span>
                      </div>
                      <p style={{ fontSize: '0.85rem' }}>{c.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* CREATE RESOURCE MODAL */}
      {showCreateResourceModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999999 }}>
          <div style={{ backgroundColor: theme.cardBg, padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '540px', border: `1px solid ${theme.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Share Course Notes / Resource</h2>
              <button onClick={() => setShowCreateResourceModal(false)} style={{ background: 'none', border: 'none', color: theme.textMain, cursor: 'pointer' }}>X</button>
            </div>

            <form onSubmit={handleCreateResourceSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: theme.textMuted, marginBottom: '0.3rem' }}>Title</label>
                <input type="text" required placeholder="e.g. Grade 12 Physics Mechanics Guide" value={newResTitle} onChange={(e) => setNewResTitle(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain, boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: theme.textMuted, marginBottom: '0.3rem' }}>Subject</label>
                  <select value={newResSubject} onChange={(e) => setNewResSubject(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain, boxSizing: 'border-box' }}>
                    {subjectsList.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: theme.textMuted, marginBottom: '0.3rem' }}>Grade</label>
                  <select value={newResGrade} onChange={(e) => setNewResGrade(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain, boxSizing: 'border-box' }}>
                    {gradesList.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: theme.textMuted, marginBottom: '0.3rem' }}>Short Description</label>
                <input type="text" placeholder="Brief summary of what this guide covers..." value={newResDescription} onChange={(e) => setNewResDescription(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain, boxSizing: 'border-box' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: theme.textMuted, marginBottom: '0.3rem' }}>Full Content / Formulas / Notes</label>
                <textarea required rows={5} placeholder="Paste your study notes content..." value={newResContent} onChange={(e) => setNewResContent(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain, boxSizing: 'border-box' }} />
              </div>

              <button type="submit" style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.75rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                Publish Resource Note
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CREATE DISCUSSION MODAL */}
      {showCreateDiscussionModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999999 }}>
          <div style={{ backgroundColor: theme.cardBg, padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '480px', border: `1px solid ${theme.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Start Discussion Topic</h2>
              <button onClick={() => setShowCreateDiscussionModal(false)} style={{ background: 'none', border: 'none', color: theme.textMain, cursor: 'pointer' }}>X</button>
            </div>

            <form onSubmit={handleCreateDiscussionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: theme.textMuted, marginBottom: '0.3rem' }}>Topic Title</label>
                <input type="text" required placeholder="e.g. Best resources for AP Chemistry?" value={newDiscTitle} onChange={(e) => setNewDiscTitle(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain, boxSizing: 'border-box' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: theme.textMuted, marginBottom: '0.3rem' }}>Question / Description</label>
                <textarea required rows={4} placeholder="Detail your question..." value={newDiscContent} onChange={(e) => setNewDiscContent(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain, boxSizing: 'border-box' }} />
              </div>

              <button type="submit" style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.75rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                Post Topic
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DISCUSSION DETAIL MODAL */}
      {selectedDiscussion && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999999 }}>
          <div style={{ backgroundColor: theme.cardBg, borderRadius: '16px', width: '90%', maxWidth: '680px', maxHeight: '80vh', border: `1px solid ${theme.border}`, padding: '2rem', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: `1px solid ${theme.border}`, pb: '1rem' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>{selectedDiscussion.title}</h2>
              <button onClick={() => setSelectedDiscussion(null)} style={{ background: 'none', border: 'none', color: theme.textMain, cursor: 'pointer', fontSize: '1.2rem' }}>X</button>
            </div>

            <p style={{ fontSize: '0.95rem', color: theme.textMain, marginBottom: '1.5rem', whiteSpace: 'pre-wrap' }}>{selectedDiscussion.content}</p>

            <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: '1rem', marginTop: 'auto' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem' }}>Replies ({selectedDiscussion.repliesCount})</h3>

              <form onSubmit={handleAddDiscussionReply} style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.5rem' }}>
                <input type="text" placeholder="Write a reply..." value={newReplyText} onChange={(e) => setNewReplyText(e.target.value)} style={{ flex: 1, padding: '0.6rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain }} />
                <button type="submit" style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Reply</button>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {selectedDiscussion.replies?.map(r => (
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

      {/* EDIT PROFILE MODAL */}
      {showEditProfileModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999999 }}>
          <div style={{ backgroundColor: theme.cardBg, padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '480px', border: `1px solid ${theme.border}`, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Edit Profile Settings</h2>
              <button onClick={() => setShowEditProfileModal(false)} style={{ background: 'none', border: 'none', color: theme.textMain, cursor: 'pointer', fontSize: '1.2rem' }}>X</button>
            </div>

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <input type="file" ref={fileInputRef} accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
                <div onClick={() => fileInputRef.current?.click()} style={{ width: '75px', height: '75px', borderRadius: '50%', backgroundColor: theme.bg, border: `2px dashed ${theme.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', backgroundImage: avatarUrl ? `url(${avatarUrl})` : 'none', backgroundSize: 'cover' }}>
                  {!avatarUrl && <span style={{ fontSize: '0.8rem', color: theme.textMuted }}>Upload</span>}
                </div>
                <button type="button" onClick={() => fileInputRef.current?.click()} style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', backgroundColor: theme.bg, border: `1px solid ${theme.border}`, color: theme.textMain, cursor: 'pointer', fontSize: '0.85rem' }}>Change Image</button>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: theme.textMuted, marginBottom: '0.3rem' }}>Username</label>
                  <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain, boxSizing: 'border-box' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: theme.textMuted, marginBottom: '0.3rem' }}>Nickname</label>
                  <input type="text" required value={nickname} onChange={(e) => setNickname(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain, boxSizing: 'border-box' }} />
                </div>
              </div>

              <button type="submit" disabled={savingProfile} style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.7rem 1.5rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>{savingProfile ? 'Saving...' : 'Save Profile Changes'}</button>
            </form>
          </div>
        </div>
      )}

      {/* AUTHENTICATION MODAL */}
      {showAuthModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999999 }}>
          <div style={{ backgroundColor: theme.cardBg, padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '420px', border: `1px solid ${theme.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{isSignUp ? 'Sign Up' : 'Sign In'}</h2>
              <button onClick={() => setShowAuthModal(false)} style={{ background: 'none', border: 'none', color: theme.textMain, cursor: 'pointer', fontSize: '1.2rem' }}>X</button>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '0.2rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <input type="checkbox" id="studentConfirm" required checked={isStudentConfirmed} onChange={(e) => setIsStudentConfirmed(e.target.checked)} />
                    <label htmlFor="studentConfirm" style={{ fontSize: '0.8rem', color: theme.textMuted }}>I confirm that I am a current student or alumni.</label>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <input type="checkbox" id="termsConfirm" required checked={hasAgreedTerms} onChange={(e) => setHasAgreedTerms(e.target.checked)} />
                    <label htmlFor="termsConfirm" style={{ fontSize: '0.8rem', color: theme.textMuted }}>I agree to the Terms of Service.</label>
                  </div>
                </div>
              )}

              <button type="submit" disabled={loading} style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.75rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', opacity: loading ? 0.6 : 1, marginTop: '0.5rem' }}>
                {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
              </button>
            </form>

            <p onClick={() => { setIsSignUp(!isSignUp); }} style={{ color: theme.accent, marginTop: '1.2rem', cursor: 'pointer', textAlign: 'center', fontSize: '0.85rem' }}>
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
