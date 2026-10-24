'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

/* ==========================================================================
   1. SUPABASE CLIENT & CONFIGURATION
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
  authorAvatar: string;
  date: string;
  likes: number;
  bookmarks: number;
  likedByMe?: boolean;
  bookmarkedByMe?: boolean;
  comments: CommentItem[];
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

  // Resources Data State
  const [resources, setResources] = useState<ResourceItem[]>([
    {
      id: '1',
      title: 'AP Calculus BC Derivatives & Series Master Review',
      subject: 'Mathematics',
      grade: 'AP Courses',
      description: 'Comprehensive prep guide covering AP exam series convergence tests, Taylor polynomials, and parametric equations.',
      content: 'Detailed derivatives rules: (1) Product Rule: (uv)\' = u\'v + uv\'. (2) Quotient Rule: (u/v)\' = (u\'v - uv\') / v^2. Taylor Series Expansion for e^x = 1 + x + x^2/2! + x^3/3! + ... Make sure to practice ratio tests for interval of convergence!',
      authorName: 'Alex Smith',
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
      authorAvatar: '',
      date: 'Oct 23, 2026',
      likes: 19,
      bookmarks: 14,
      likedByMe: false,
      bookmarkedByMe: false,
      comments: []
    }
  ]);

  // Preview Modal State
  const [previewResource, setPreviewResource] = useState<ResourceItem | null>(null);
  const [showCommentsArea, setShowCommentsArea] = useState(true);
  const [newCommentText, setNewCommentText] = useState('');

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
     3. AUTHENTICATION & SESSION EFFECT
     ========================================================================== */
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash && (hash.includes('type=recovery') || hash.includes('access_token'))) {
        setShowResetNewPasswordModal(true);
      }
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        setCreatedAt(user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown');
        if (user.user_metadata) {
          setAvatarUrl(user.user_metadata.avatar_url || '');
          setUsername(user.user_metadata.username || '');
          setNickname(user.user_metadata.nickname || '');
          setGrade(user.user_metadata.grade || '');
          setGender(user.user_metadata.gender || '');
          setBio(user.user_metadata.bio || '');
        }
      }
    }).catch(() => {});

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setShowResetNewPasswordModal(true);
      }
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        setCreatedAt(currentUser.created_at ? new Date(currentUser.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown');
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

    return () => subscription.unsubscribe();
  }, []);

  // Banner Timer
  useEffect(() => {
    if (announcements.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % announcements.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [announcements]);

  /* ==========================================================================
     4. HANDLERS & AUTO SIGN-IN AFTER SIGN-UP
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

  // SIGN UP WITH AUTOMATIC AUTO SIGN IN & METADATA INIT
  async function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        if (!isStudentConfirmed) {
          alert('Please confirm that you are a student or alumni.');
          setLoading(false);
          return;
        }
        if (!hasAgreedTerms) {
          alert('Please review and agree to the Terms of Service.');
          setLoading(false);
          return;
        }

        const { error: signUpError } = await supabase.auth.signUp({
          email: authEmail.trim(),
          password: authPassword,
        });

        if (signUpError && signUpError.message.toLowerCase().includes('already registered')) {
          // Trigger unblock & auto sign in
          const { error: signInErr } = await supabase.auth.signInWithPassword({
            email: authEmail.trim(),
            password: authPassword,
          });

          if (signInErr) {
            alert('Account exists! Please check password or click Forgot Password.');
          } else {
            const defaultName = authEmail.split('@')[0].slice(0, 20);
            await supabase.auth.updateUser({
              data: {
                avatar_url: '',
                username: defaultName,
                nickname: defaultName,
                grade: 'Grade 12',
                gender: '',
                bio: ''
              }
            });
            alert('Signed up and logged in successfully!');
            setShowAuthModal(false);
            setActiveTab('dashboard');
          }
        } else if (signUpError) {
          alert('SignUp Error: ' + signUpError.message);
        } else {
          // Standard fresh signup -> Immediate login
          const { error: autoSignInErr } = await supabase.auth.signInWithPassword({
            email: authEmail.trim(),
            password: authPassword,
          });

          if (!autoSignInErr) {
            const defaultName = authEmail.split('@')[0].slice(0, 20);
            await supabase.auth.updateUser({
              data: {
                avatar_url: '',
                username: defaultName,
                nickname: defaultName,
                grade: 'Grade 12',
                gender: '',
                bio: ''
              }
            });
          }

          alert('Registration successful! You are now logged in.');
          setShowAuthModal(false);
          setActiveTab('dashboard');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail.trim(),
          password: authPassword,
        });

        if (error) {
          alert('SignIn Failed: ' + error.message);
        } else {
          setShowAuthModal(false);
          setAuthPassword('');
        }
      }
    } catch (err: any) {
      alert('Network Error: ' + (err.message || 'Failed to fetch'));
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!resetEmail.trim()) return;

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
        redirectTo: `${window.location.origin}/#type=recovery`,
      });

      if (error) {
        alert('Reset Password Error: ' + error.message);
      } else {
        alert('A password reset link has been sent to your email address!');
        setShowForgotPasswordModal(false);
        setResetEmail('');
      }
    } catch (err: any) {
      alert('Error sending reset email: ' + err.message);
    }
  }

  async function handleUpdateNewPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!newPassword.trim()) return;

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        alert('Failed to update password: ' + error.message);
      } else {
        alert('Your password has been reset successfully!');
        setShowResetNewPasswordModal(false);
        setNewPassword('');
        setActiveTab('dashboard');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  }

  // Profile Save with Strict Username / Nickname Validation
  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();

    if (username.startsWith(' ') || username.endsWith(' ')) {
      alert('Username cannot start or end with spaces.');
      return;
    }
    if (nickname.startsWith(' ') || nickname.endsWith(' ')) {
      alert('Nickname cannot start or end with spaces.');
      return;
    }

    if (username.length < 3 || username.length > 20) {
      alert('Username length must be between 3 and 20 characters.');
      return;
    }
    if (nickname.length < 2 || nickname.length > 30) {
      alert('Nickname length must be between 2 and 30 characters.');
      return;
    }

    setSavingProfile(true);

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          avatar_url: avatarUrl,
          username: username.trim(),
          nickname: nickname.trim(),
          grade: grade,
          gender: gender,
          bio: bio,
        }
      });

      if (error) {
        alert('Failed to update profile: ' + error.message);
      } else {
        alert('Profile saved successfully!');
        setShowEditProfileModal(false);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleDeleteAccount() {
    const confirmDelete = window.confirm('Are you sure you want to delete this account? Profile data will be cleared.');
    if (!confirmDelete) return;

    try {
      await supabase.auth.updateUser({
        data: {
          avatar_url: '',
          username: '',
          nickname: '',
          grade: '',
          gender: '',
          bio: '',
        }
      });

      setAvatarUrl('');
      setUsername('');
      setNickname('');
      setGrade('');
      setGender('');
      setBio('');

      await supabase.auth.signOut();
      setUser(null);
      setShowEditProfileModal(false);
      setActiveTab('resources');
      alert('Account signed out and metadata cleared.');
    } catch (err: any) {
      alert('Error during account deletion: ' + err.message);
    }
  }

  // TOGGLE LIKE & TOGGLE BOOKMARK (CAN UN-LIKE & UN-BOOKMARK)
  function handleLikeResource(id: string, e?: React.MouseEvent) {
    e?.stopPropagation();
    setResources(prev => prev.map(res => {
      if (res.id === id) {
        const isLiked = res.likedByMe;
        return {
          ...res,
          likes: isLiked ? res.likes - 1 : res.likes + 1,
          likedByMe: !isLiked
        };
      }
      return res;
    }));

    if (previewResource && previewResource.id === id) {
      const isLiked = previewResource.likedByMe;
      setPreviewResource(prev => prev ? {
        ...prev,
        likes: isLiked ? prev.likes - 1 : prev.likes + 1,
        likedByMe: !isLiked
      } : null);
    }
  }

  function handleBookmarkResource(id: string, e?: React.MouseEvent) {
    e?.stopPropagation();
    setResources(prev => prev.map(res => {
      if (res.id === id) {
        const isBookmarked = res.bookmarkedByMe;
        return {
          ...res,
          bookmarks: isBookmarked ? res.bookmarks - 1 : res.bookmarks + 1,
          bookmarkedByMe: !isBookmarked
        };
      }
      return res;
    }));

    if (previewResource && previewResource.id === id) {
      const isBookmarked = previewResource.bookmarkedByMe;
      setPreviewResource(prev => prev ? {
        ...prev,
        bookmarks: isBookmarked ? prev.bookmarks - 1 : prev.bookmarks + 1,
        bookmarkedByMe: !isBookmarked
      } : null);
    }
  }

  // Comment Handler with Toggle Like
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

    const updatedResource = {
      ...previewResource,
      comments: [...previewResource.comments, commentObj]
    };

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

  // Report Handler
  function triggerReportModal(targetType: 'resource' | 'comment', targetId: string, targetTitle: string, userEmail?: string, e?: React.MouseEvent) {
    e?.stopPropagation();
    if (!user) {
      alert('Please sign in first to report content.');
      setShowAuthModal(true);
      return;
    }
    setReportTarget({ type: targetType, id: targetId, title: targetTitle, userEmail });
    setShowReportModal(true);
  }

  function handleSubmitReport(e: React.FormEvent) {
    e.preventDefault();
    if (!reportTarget || !user) return;

    const newReport: ReportItem = {
      id: Date.now().toString(),
      targetType: reportTarget.type,
      targetId: reportTarget.id,
      targetTitle: reportTarget.title,
      reason: reportReason,
      details: reportDetails,
      reporterEmail: user.email || 'Anonymous',
      targetUserEmail: reportTarget.userEmail || 'Unknown User',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: 'pending'
    };

    setReports([newReport, ...reports]);

    const mailtoUrl = `mailto:northsynapse@gmail.com?subject=[REPORT SUBMITTED] ${reportTarget.type.toUpperCase()} - ${reportReason}&body=Reporter: ${user.email}%0D%0ATarget ID: ${reportTarget.id}%0D%0ATarget Title: ${encodeURIComponent(reportTarget.title)}%0D%0AReason: ${encodeURIComponent(reportReason)}%0D%0ADetails:%0D%0A${encodeURIComponent(reportDetails)}`;
    window.open(mailtoUrl, '_blank');

    setShowReportModal(false);
    setReportDetails('');
    alert('Report submitted successfully! Direct email sent to northsynapse@gmail.com.');
  }

  // Admin Resolve Report Handler
  function handleAdminResolveReport(reportId: string, action: 'delete' | 'dismiss') {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    if (action === 'delete') {
      if (report.targetType === 'resource') {
        setResources(prev => prev.filter(r => r.id !== report.targetId));
        if (previewResource?.id === report.targetId) setPreviewResource(null);
      } else if (report.targetType === 'comment' && previewResource) {
        const updatedComments = previewResource.comments.filter(c => c.id !== report.targetId);
        const updatedResource = { ...previewResource, comments: updatedComments };
        setPreviewResource(updatedResource);
        setResources(prev => prev.map(r => r.id === previewResource.id ? updatedResource : r));
      }

      const notifyMail = `mailto:${report.targetUserEmail}?subject=[North Synapse Moderation] Content Removed&body=Dear User,%0D%0A%0D%0AYour recent ${report.targetType} "${report.targetTitle}" was reported and flagged. After review, it has been removed.%0D%0A%0D%0ANorth Synapse Admin Team`;
      window.open(notifyMail, '_blank');

      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'resolved_deleted' } : r));
      alert('Content deleted and email notice drafted.');
    } else {
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'resolved_dismissed' } : r));
      alert('Report dismissed.');
    }
  }

  function handleAddFeedback(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      alert('Please sign in first before submitting feedback.');
      setShowAuthModal(true);
      return;
    }
    if (!feedbackComment.trim()) return;

    const newFb: FeedbackItem = {
      id: Date.now().toString(),
      rating: feedbackRating,
      category: feedbackCategory,
      comment: feedbackComment,
      userEmail: user?.email || 'Anonymous Student',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };

    setFeedbacks([newFb, ...feedbacks]);
    setFeedbackComment('');

    const mailtoUrl = `mailto:northsynapse@gmail.com?subject=[North Synapse Feedback] ${feedbackCategory} - ${feedbackRating} Stars&body=User: ${user.email}%0D%0ARating: ${feedbackRating} Stars%0D%0ACategory: ${feedbackCategory}%0D%0A%0D%0AComment:%0D%0A${encodeURIComponent(feedbackComment)}`;
    window.open(mailtoUrl, '_blank');

    alert('Thank you for your feedback! Sent directly to northsynapse@gmail.com.');
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

  const bookmarkedResources = resources.filter(r => r.bookmarkedByMe);
  const pendingReports = reports.filter(r => r.status === 'pending');

  return (
    <div style={{ backgroundColor: theme.bg, color: theme.textMain, minHeight: '100vh', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* ===================================================================
          6. HEADER & NAVIGATION
          =================================================================== */}
      <header style={{ borderBottom: `1px solid ${theme.border}`, padding: '1.2rem 3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        
        <div onClick={() => setActiveTab('resources')} style={{ fontSize: '1.3rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer', letterSpacing: '-0.02em' }}>
          <svg width="34" height="34" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M75 25 C 50 10, 20 20, 25 45 C 30 70, 70 65, 75 80 C 80 95, 45 95, 25 80" stroke="#8B5CF6" strokeWidth="8" strokeLinecap="round"/>
            <path d="M25 25 L 75 80" stroke="#8B5CF6" strokeWidth="3" strokeDasharray="5 5" opacity="0.6"/>
            <path d="M75 25 L 25 80" stroke="#8B5CF6" strokeWidth="3" strokeDasharray="5 5" opacity="0.6"/>
            <circle cx="75" cy="25" r="7" fill="#8B5CF6"/>
            <circle cx="25" cy="45" r="5" fill="#8B5CF6"/>
            <circle cx="75" cy="80" r="7" fill="#8B5CF6"/>
            <circle cx="25" cy="80" r="5" fill="#8B5CF6"/>
            <circle cx="50" cy="52.5" r="5" fill="#8B5CF6"/>
          </svg>
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
              <button onClick={() => supabase.auth.signOut()} style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', backgroundColor: 'transparent', border: `1px solid ${theme.border}`, color: theme.textMuted, cursor: 'pointer', fontSize: '0.85rem' }}>
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

      {/* ===================================================================
          7. MAIN CONTENT AREA
          =================================================================== */}
      <main style={{ maxWidth: '1080px', margin: '0 auto', padding: '2rem' }}>
        
        {/* --- PERFECTLY CENTERED BANNER --- */}
        <div style={{ 
          backgroundColor: 'rgba(139, 92, 246, 0.08)', 
          border: `1px solid ${theme.accent}`, 
          borderRadius: '12px', 
          padding: '0 1.5rem', 
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '52px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, overflow: 'hidden' }}>
            <span style={{ backgroundColor: theme.accent, color: '#FFF', fontSize: '0.75rem', fontWeight: 'bold', padding: '0.25rem 0.6rem', borderRadius: '6px', flexShrink: 0 }}>
              NOTICE ({currentBannerIndex + 1}/{announcements.length})
            </span>

            <div style={{ flex: 1, overflow: 'hidden', height: '52px', position: 'relative' }}>
              {announcements.map((item, idx) => (
                <div 
                  key={item.id} 
                  style={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: 0, 
                    width: '100%', 
                    height: '52px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.8rem',
                    opacity: idx === currentBannerIndex ? 1 : 0,
                    transform: idx === currentBannerIndex ? 'translateY(0)' : 'translateY(15px)',
                    transition: 'all 0.4s ease-in-out'
                  }}
                >
                  <span style={{ fontSize: '0.9rem', color: theme.textMain, fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.title}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: theme.textMuted, flexShrink: 0 }}>• {item.date}</span>
                </div>
              ))}
            </div>
          </div>

          <button onClick={() => setActiveTab('announcements')} style={{ background: 'none', border: 'none', color: theme.accent, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', flexShrink: 0 }}>
            View All
          </button>
        </div>

        {/* --- RESOURCE HUB TAB --- */}
        {activeTab === 'resources' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
              <span style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)', color: theme.accent, padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700', display: 'inline-block', marginBottom: '1rem' }}>
                Academic Platform for NTCI
              </span>
              <h1 style={{ fontSize: '2.5rem', fontWeight: '900', letterSpacing: '-0.03em', marginBottom: '0.8rem' }}>North Synapse Resource Hub</h1>
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
                      {selectedGrades.includes(grd) ? '[x] ' : ''}{grd}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: theme.textMuted, display: 'block', marginBottom: '0.6rem' }}>SUBJECT CATEGORIES:</span>
                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                  {subjectsList.map((sub) => (
                    <button key={sub} onClick={() => toggleSubjectFilter(sub)} style={{ padding: '0.4rem 1rem', borderRadius: '20px', border: `1px solid ${selectedSubjects.includes(sub) ? theme.accent : theme.border}`, backgroundColor: selectedSubjects.includes(sub) ? theme.accent : theme.bg, color: selectedSubjects.includes(sub) ? '#FFF' : theme.textMain, fontWeight: '600', fontSize: '0.8rem', cursor: 'pointer' }}>
                      {selectedSubjects.includes(sub) ? '[x] ' : ''}{sub}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Resource List Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredResources.map((res) => (
                <div key={res.id} onClick={() => setPreviewResource(res)} style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '1.5rem', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                    <div style={{ display: 'flex', gap: '0.6rem' }}>
                      <span style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)', color: theme.accent, fontSize: '0.75rem', fontWeight: 'bold', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>{res.subject}</span>
                      <span style={{ backgroundColor: theme.bg, color: theme.textMuted, fontSize: '0.75rem', fontWeight: 'bold', padding: '0.2rem 0.6rem', borderRadius: '6px', border: `1px solid ${theme.border}` }}>{res.grade}</span>
                    </div>

                    <button onClick={(e) => triggerReportModal('resource', res.id, res.title, res.authorName, e)} style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '0.8rem', cursor: 'pointer' }}>
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

        {/* --- OTHER TABS --- */}
        {activeTab === 'lounges' && <div style={{ textAlign: 'center', padding: '4rem 2rem' }}><h2>Study Lounge</h2><p style={{ color: theme.textMuted }}>Virtual study rooms coming soon.</p></div>}
        {activeTab === 'discussions' && <div style={{ textAlign: 'center', padding: '4rem 2rem' }}><h2>Discussions</h2><p style={{ color: theme.textMuted }}>Academic discussion board coming soon.</p></div>}

        {/* --- ANNOUNCEMENTS TAB --- */}
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

        {/* --- FEEDBACK TAB (WITH REPORT ISSUE CATEGORY) --- */}
        {activeTab === 'feedback' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }}>Feedback &amp; Issue Reporting</h1>
            <form onSubmit={handleAddFeedback} style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '16px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              
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

              <button type="submit" style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.8rem 2rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', alignSelf: 'flex-start' }}>Submit Feedback / Bug Report</button>
            </form>
          </div>
        )}

        {/* --- DASHBOARD TAB (WITH SAVED BOOKMARKS LIST) --- */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            <div style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '16px', padding: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 'bold' }}>{nickname || 'Student Profile'}</h1>
                <p style={{ color: theme.textMuted, fontSize: '0.9rem', marginTop: '0.2rem' }}>@{username || 'username'} • {grade || 'Grade Not Set'}</p>
              </div>
              <button onClick={() => setShowEditProfileModal(true)} style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.8rem 1.8rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Edit Profile</button>
            </div>

            {/* MY BOOKMARKED RESOURCES LIST */}
            <div style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '16px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>My Bookmarked Resources ({bookmarkedResources.length})</h2>

              {bookmarkedResources.length > 0 ? (
                bookmarkedResources.map((bm) => (
                  <div key={bm.id} onClick={() => setPreviewResource(bm)} style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}`, borderRadius: '10px', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: theme.accent, fontWeight: 'bold' }}>{bm.subject} • {bm.grade}</span>
                      <h4 style={{ fontSize: '1rem', fontWeight: 'bold', marginTop: '0.2rem' }}>{bm.title}</h4>
                      <p style={{ fontSize: '0.8rem', color: theme.textMuted }}>Shared by {bm.authorName} on {bm.date}</p>
                    </div>
                    <button style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.4rem 1rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                      Open Note
                    </button>
                  </div>
                ))
              ) : (
                <p style={{ color: theme.textMuted, fontSize: '0.85rem' }}>You haven't bookmarked any notes yet. Click "Save" on any resource card to view it here!</p>
              )}
            </div>

            {isAdmin && (
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px solid #EF4444', borderRadius: '16px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#EF4444' }}>Admin Moderation Panel ({pendingReports.length} Pending Reports)</h2>
                </div>

                {pendingReports.length > 0 ? (
                  pendingReports.map((rep) => (
                    <div key={rep.id} style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', backgroundColor: '#EF4444', color: '#FFF', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>{rep.targetType.toUpperCase()}</span>
                        <h4 style={{ fontSize: '1rem', fontWeight: 'bold', marginTop: '0.4rem' }}>Target: {rep.targetTitle}</h4>
                        <p style={{ fontSize: '0.85rem', color: theme.textMuted }}>Reason: <strong>{rep.reason}</strong> | Details: {rep.details || 'None provided'}</p>
                        <span style={{ fontSize: '0.75rem', color: theme.textMuted }}>Reported by: {rep.reporterEmail} • {rep.date}</span>
                      </div>

                      <div style={{ display: 'flex', gap: '0.8rem' }}>
                        <button onClick={() => handleAdminResolveReport(rep.id, 'delete')} style={{ backgroundColor: '#EF4444', color: '#FFF', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}>
                          Confirm &amp; Delete
                        </button>
                        <button onClick={() => handleAdminResolveReport(rep.id, 'dismiss')} style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}`, color: theme.textMain, padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
                          Dismiss
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ color: theme.textMuted, fontSize: '0.9rem' }}>No pending reports to review.</p>
                )}
              </div>
            )}

          </div>
        )}

      </main>

      {/* ===================================================================
          8. PREVIEW MODAL
          =================================================================== */}
      {previewResource && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999999 }}>
          <div style={{ backgroundColor: theme.cardBg, borderRadius: '16px', width: '90%', maxWidth: '960px', height: '80vh', border: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            
            <div style={{ padding: '1.2rem 2rem', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.75rem', backgroundColor: 'rgba(139, 92, 246, 0.15)', color: theme.accent, padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 'bold' }}>{previewResource.subject}</span>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 'bold', marginTop: '0.2rem' }}>{previewResource.title}</h2>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <button onClick={() => setShowCommentsArea(!showCommentsArea)} style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain, cursor: 'pointer', fontSize: '0.85rem' }}>
                  {showCommentsArea ? 'Hide Comments' : 'Show Comments'}
                </button>
                <button onClick={() => setPreviewResource(null)} style={{ background: 'none', border: 'none', color: theme.textMain, cursor: 'pointer', fontSize: '1.4rem' }}>X</button>
              </div>
            </div>

            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
              <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', borderRight: showCommentsArea ? `1px solid ${theme.border}` : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: `1px solid ${theme.border}` }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: theme.accent, color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                    {previewResource.authorName[0].toUpperCase()}
                  </div>
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.95rem' }}>{previewResource.authorName}</strong>
                    <span style={{ fontSize: '0.8rem', color: theme.textMuted }}>Posted on {previewResource.date}</span>
                  </div>
                </div>

                <div style={{ fontSize: '0.95rem', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                  {previewResource.content}
                </div>
              </div>

              {showCommentsArea && (
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
                        <p style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>{c.text}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <button onClick={() => handleLikeComment(c.id)} style={{ background: 'none', border: 'none', color: c.likedByMe ? theme.accent : theme.textMuted, fontWeight: c.likedByMe ? 'bold' : 'normal', cursor: 'pointer', fontSize: '0.75rem' }}>
                            {c.likedByMe ? 'Liked' : 'Like'} ({c.likes})
                          </button>
                          <button onClick={(e) => triggerReportModal('comment', c.id, c.text, c.authorName, e)} style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '0.75rem', cursor: 'pointer' }}>
                            Report
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ===================================================================
          9. REPORT MODAL
          =================================================================== */}
      {showReportModal && reportTarget && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999999 }}>
          <div style={{ backgroundColor: theme.cardBg, padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '420px', border: `1px solid ${theme.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#EF4444' }}>Report Content</h2>
              <button onClick={() => setShowReportModal(false)} style={{ background: 'none', border: 'none', color: theme.textMain, cursor: 'pointer' }}>X</button>
            </div>

            <form onSubmit={handleSubmitReport} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: theme.textMuted, marginBottom: '0.3rem' }}>Report Reason</label>
                <select value={reportReason} onChange={(e) => setReportReason(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain }}>
                  <option value="Academic Dishonesty">Academic Dishonesty / Unreleased Exam</option>
                  <option value="Insulting / Harassment">Insulting Language / Harassment</option>
                  <option value="Spam / Inappropriate">Spam / Inappropriate Content</option>
                  <option value="Other">Other Issues</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: theme.textMuted, marginBottom: '0.3rem' }}>Additional Details (Optional)</label>
                <textarea rows={3} placeholder="Provide specific context if needed..." value={reportDetails} onChange={(e) => setReportDetails(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain, boxSizing: 'border-box' }} />
              </div>

              <button type="submit" style={{ backgroundColor: '#EF4444', color: '#FFF', border: 'none', padding: '0.75rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                Submit Report
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================
          10. EDIT PROFILE MODAL
          =================================================================== */}
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
                  <label style={{ display: 'block', fontSize: '0.85rem', color: theme.textMuted, marginBottom: '0.3rem' }}>Username (3-20 chars, no leading/trailing space)</label>
                  <input type="text" required minLength={3} maxLength={20} value={username} onChange={(e) => setUsername(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain, boxSizing: 'border-box' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: theme.textMuted, marginBottom: '0.3rem' }}>Nickname (2-30 chars, no leading/trailing space)</label>
                  <input type="text" required minLength={2} maxLength={30} value={nickname} onChange={(e) => setNickname(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain, boxSizing: 'border-box' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: theme.textMuted, marginBottom: '0.3rem' }}>Grade</label>
                  <select required value={grade} onChange={(e) => setGrade(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain, boxSizing: 'border-box' }}>
                    <option value="">Select Grade</option>
                    <option value="Grade 9">Grade 9</option>
                    <option value="Grade 10">Grade 10</option>
                    <option value="Grade 11">Grade 11</option>
                    <option value="Grade 12">Grade 12</option>
                    <option value="Alumni">Alumni</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: theme.textMuted, marginBottom: '0.3rem' }}>Gender (Optional)</label>
                  <select value={gender} onChange={(e) => setGender(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain, boxSizing: 'border-box' }}>
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="non-binary">Non-binary</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: theme.textMuted, marginBottom: '0.3rem' }}>Bio</label>
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain, boxSizing: 'border-box', fontFamily: 'inherit' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                <button type="submit" disabled={savingProfile} style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.7rem 1.5rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>{savingProfile ? 'Saving...' : 'Save Profile Changes'}</button>
                <button type="button" onClick={handleDeleteAccount} style={{ background: 'none', border: '1px solid #EF4444', color: '#EF4444', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>Delete Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================
          11. AUTHENTICATION & RESET MODALS
          =================================================================== */}
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
                <input type="email" required placeholder="350403596@tdsb.ca" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain, boxSizing: 'border-box' }} />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <label style={{ fontSize: '0.85rem', color: theme.textMuted }}>Password</label>
                  {!isSignUp && (
                    <span onClick={() => { setShowAuthModal(false); setShowForgotPasswordModal(true); }} style={{ fontSize: '0.8rem', color: theme.accent, cursor: 'pointer' }}>Forgot Password?</span>
                  )}
                </div>
                <input type="password" required placeholder="••••••••" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain, boxSizing: 'border-box' }} />
              </div>

              {isSignUp && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '0.2rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <input type="checkbox" id="studentConfirm" required checked={isStudentConfirmed} onChange={(e) => setIsStudentConfirmed(e.target.checked)} style={{ marginTop: '0.2rem' }} />
                    <label htmlFor="studentConfirm" style={{ fontSize: '0.8rem', color: theme.textMuted, lineHeight: '1.3' }}>I confirm that I am a current student or alumni.</label>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <input type="checkbox" id="termsConfirm" required checked={hasAgreedTerms} onChange={(e) => setHasAgreedTerms(e.target.checked)} style={{ marginTop: '0.2rem' }} />
                    <label htmlFor="termsConfirm" style={{ fontSize: '0.8rem', color: theme.textMuted, lineHeight: '1.3' }}>
                      I agree to the <span onClick={() => setShowTermsModal(true)} style={{ color: theme.accent, textDecoration: 'underline', cursor: 'pointer', fontWeight: 'bold' }}>Terms of Service</span>.
                    </label>
                  </div>
                </div>
              )}

              <button type="submit" disabled={loading} style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.75rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', opacity: loading ? 0.6 : 1, marginTop: '0.5rem' }}>
                {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
              </button>
            </form>

            <p onClick={() => { setIsSignUp(!isSignUp); setIsStudentConfirmed(false); setHasAgreedTerms(false); }} style={{ color: theme.accent, marginTop: '1.2rem', cursor: 'pointer', textAlign: 'center', fontSize: '0.85rem' }}>
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </p>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999999 }}>
          <div style={{ backgroundColor: theme.cardBg, padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '400px', border: `1px solid ${theme.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Reset Password</h2>
              <button onClick={() => setShowForgotPasswordModal(false)} style={{ background: 'none', border: 'none', color: theme.textMain, cursor: 'pointer', fontSize: '1.2rem' }}>X</button>
            </div>

            <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: theme.textMuted, marginBottom: '0.3rem' }}>Enter your email address</label>
                <input type="email" required placeholder="your_email@tdsb.ca" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain, boxSizing: 'border-box' }} />
              </div>

              <button type="submit" style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.75rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                Send Reset Link
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Set New Password Modal */}
      {showResetNewPasswordModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999999 }}>
          <div style={{ backgroundColor: theme.cardBg, padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '400px', border: `1px solid ${theme.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: theme.accent }}>Set New Password</h2>
              <button onClick={() => setShowResetNewPasswordModal(false)} style={{ background: 'none', border: 'none', color: theme.textMain, cursor: 'pointer', fontSize: '1.2rem' }}>X</button>
            </div>

            <form onSubmit={handleUpdateNewPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: theme.textMuted, marginBottom: '0.3rem' }}>Enter Your New Password</label>
                <input 
                  type="password" 
                  required 
                  placeholder="••••••••" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain, boxSizing: 'border-box' }} 
                />
              </div>

              <button type="submit" style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.75rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                Update Password
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Terms Modal */}
      {showTermsModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999999 }}>
          <div style={{ backgroundColor: theme.cardBg, padding: '2rem', borderRadius: '16px', width: '90%', maxWidth: '520px', border: `1px solid ${theme.border}`, maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: `1px solid ${theme.border}`, paddingBottom: '0.8rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: theme.accent }}>Terms of Service &amp; Community Agreement</h2>
              <button onClick={() => setShowTermsModal(false)} style={{ background: 'none', border: 'none', color: theme.textMain, cursor: 'pointer', fontSize: '1.2rem' }}>X</button>
            </div>

            <div style={{ fontSize: '0.85rem', color: theme.textMuted, lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p>Welcome to <strong>North Synapse</strong>. Access is reserved for current students and alumni.</p>
              <p>Posting unreleased exam papers or engaging in academic dishonesty in public areas is strictly prohibited.</p>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => { setHasAgreedTerms(true); setShowTermsModal(false); }} style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}>
                I Understand &amp; Agree
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
