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

interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  date: string;
  authorName: string;
  authorAvatar: string;
  images: string[];
}

interface ResourceItem {
  id: string;
  title: string;
  subject: string;
  grade: string;
  description: string;
  author: string;
}

interface FeedbackItem {
  id: string;
  rating: number;
  category: string;
  comment: string;
  userEmail: string;
  date: string;
}

export default function Home() {
  /* ==========================================================================
     2. GLOBAL & COMPONENT STATES
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

  // Multi-Select Filter State
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Sample Resources Data
  const [resources] = useState<ResourceItem[]>([
    { id: '1', title: 'AP Calculus BC Derivatives & Series Review', subject: 'Mathematics', grade: 'AP Courses', description: 'Comprehensive prep guide covering AP exam series convergence tests.', author: 'Alex Smith' },
    { id: '2', title: 'Waterloo Fermat Math Competition Solutions', subject: 'Mathematics', grade: 'Academic Competitions', description: 'Step-by-step solutions for past contest papers.', author: 'Jordan Lee' },
    { id: '3', title: 'French DELF B2 Grammar & Oral Guide', subject: 'French', grade: 'Grade 11', description: 'Oral exam key vocabulary and sentence structures.', author: 'Emily Zhang' },
    { id: '4', title: 'Business Management & Economics Fundamentals', subject: 'Business & Economics', grade: 'Grade 12', description: 'Summary notes for business case analysis and market models.', author: 'Chris Wong' },
  ]);

  // Feedback State
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
      authorName: 'North Synapse Official',
      authorAvatar: '',
      images: []
    },
    {
      id: '2',
      title: 'AP & Competition Prep Resource Categories Added',
      content: 'We updated our Resource Hub filter tags with AP Courses, Academic Competitions, French, and Geography!',
      date: 'Oct 24, 2026',
      authorName: 'North Synapse Official',
      authorAvatar: '',
      images: []
    }
  ]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Admin Check
  const isAdmin = user?.email?.toLowerCase().includes('northsynapse');

  /* ==========================================================================
     3. RECOVERY DETECTOR & SESSION EFFECT
     ========================================================================== */
  useEffect(() => {
    // Detect if user landed on website via Password Reset Email Token
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

  // Carousel Timer
  useEffect(() => {
    const bannerItemsCount = Math.min(announcements.length, 3);
    if (bannerItemsCount <= 1) return;

    const timer = setInterval(() => {
      setCurrentBannerIndex((prevIndex) => (prevIndex + 1) % bannerItemsCount);
    }, 10000);

    return () => clearInterval(timer);
  }, [announcements]);

  /* ==========================================================================
     4. HANDLERS
     ========================================================================== */
  function toggleSubjectFilter(sub: string) {
    if (selectedSubjects.includes(sub)) {
      setSelectedSubjects(selectedSubjects.filter(s => s !== sub));
    } else {
      setSelectedSubjects([...selectedSubjects, sub]);
    }
  }

  function toggleGradeFilter(grd: string) {
    if (selectedGrades.includes(grd)) {
      setSelectedGrades(selectedGrades.filter(g => g !== grd));
    } else {
      setSelectedGrades([...selectedGrades, grd]);
    }
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatarUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

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

        const { error } = await supabase.auth.signUp({
          email: authEmail.trim(),
          password: authPassword,
        });

        if (error) {
          if (error.message.includes('already registered')) {
            alert('This email is already registered. If you previously deleted this account, please use Sign In or Reset Password, or contact admin to clear backend history.');
          } else {
            alert('SignUp Failed: ' + error.message);
          }
        } else {
          alert('Registration successful! Redirecting to Dashboard.');
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
        alert('A password reset link has been sent to your email address! Please check your inbox.');
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
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        alert('Failed to update password: ' + error.message);
      } else {
        alert('Your password has been reset successfully! You are now logged in.');
        setShowResetNewPasswordModal(false);
        setNewPassword('');
        setActiveTab('dashboard');
      }
    } catch (err: any) {
      alert('Error updating password: ' + err.message);
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          avatar_url: avatarUrl,
          username: username,
          nickname: nickname,
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
      alert('Error updating profile: ' + err.message);
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleDeleteAccount() {
    const confirmDelete = window.confirm('Are you sure you want to delete this account? Your profile data will be permanently cleared.');
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
      alert('Account signed out and profile metadata erased.');
    } catch (err: any) {
      alert('Error during account deletion: ' + err.message);
    }
  }

  // Require Login for Feedback
  function handleAddFeedback(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      alert('Please sign in first before submitting feedback or reviews.');
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

    // Trigger Direct Email to Admin Mailbox
    const mailtoUrl = `mailto:northsynapse@gmail.com?subject=[North Synapse Feedback] ${feedbackCategory} - ${feedbackRating} Stars&body=User: ${user.email}%0D%0ARating: ${feedbackRating} Stars%0D%0ACategory: ${feedbackCategory}%0D%0A%0D%0AComment:%0D%0A${encodeURIComponent(feedbackComment)}`;
    window.open(mailtoUrl, '_blank');

    alert('Thank you for your feedback! It has been submitted and sent to northsynapse@gmail.com.');
  }

  /* ==========================================================================
     5. THEME & FILTER LIST DEFINITION
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
    'Mathematics',
    'Science',
    'ESL & Languages',
    'French',
    'History & Social Sciences',
    'Geography',
    'Business & Economics',
    'Art & Music',
    'Computer Science & Tech'
  ];

  const gradesList = [
    'Grade 9',
    'Grade 10',
    'Grade 11',
    'Grade 12',
    'AP Courses',
    'Academic Competitions'
  ];

  const filteredResources = resources.filter(res => {
    const matchesSubject = selectedSubjects.length === 0 || selectedSubjects.includes(res.subject);
    const matchesGrade = selectedGrades.length === 0 || selectedGrades.includes(res.grade);
    const matchesSearch = searchQuery === '' || res.title.toLowerCase().includes(searchQuery.toLowerCase()) || res.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesGrade && matchesSearch;
  });

  const topThreeAnnouncements = announcements.slice(0, 3);
  const avgRating = feedbacks.length > 0 ? (feedbacks.reduce((acc, f) => acc + f.rating, 0) / feedbacks.length).toFixed(1) : '5.0';

  return (
    <div style={{ backgroundColor: theme.bg, color: theme.textMain, minHeight: '100vh', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* Mobile Responsive Global CSS Injection */}
      <style jsx global>{`
        @media (max-width: 768px) {
          header {
            padding: 1rem !important;
            flex-direction: column !important;
            gap: 1rem !important;
          }
          nav {
            flex-wrap: wrap !important;
            justify-content: center !important;
            gap: 0.8rem !important;
          }
          main {
            padding: 1rem !important;
          }
          .responsive-flex-col {
            flex-direction: column !important;
            align-items: stretch !important;
          }
        }
      `}</style>

      {/* ===================================================================
          6. HEADER & NAVIGATION (RESPONSIVE)
          =================================================================== */}
      <header style={{ borderBottom: `1px solid ${theme.border}`, position: 'relative', zIndex: 10, padding: '1.2rem 3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        
        {/* --- BRAND LOGO --- */}
        <div 
          onClick={() => setActiveTab('resources')} 
          style={{ fontSize: '1.3rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer', letterSpacing: '-0.02em' }}
        >
          <svg width="30" height="30" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M75 25 C 50 10, 20 20, 25 45 C 30 70, 70 65, 75 80 C 80 95, 45 95, 25 80" stroke="#8B5CF6" strokeWidth="8" strokeLinecap="round"/>
            <path d="M25 25 L 75 80" stroke="#8B5CF6" strokeWidth="3" strokeDasharray="5 5" opacity="0.6"/>
            <path d="M75 25 L 25 80" stroke="#8B5CF6" strokeWidth="3" strokeDasharray="5 5" opacity="0.6"/>
            <circle cx="75" cy="25" r="7" fill="#8B5CF6"/>
            <circle cx="25" cy="45" r="5" fill="#8B5CF6"/>
            <circle cx="75" cy="80" r="7" fill="#8B5CF6"/>
            <circle cx="25" cy="80" r="5" fill="#8B5CF6"/>
            <circle cx="50" cy="52.5" r="5" fill="#8B5CF6"/>
          </svg>
          <span style={{ color: theme.textMain, fontWeight: '800' }}>North Synapse</span>
          {isAdmin && (
            <span style={{ backgroundColor: theme.accent, color: '#FFF', fontSize: '0.65rem', padding: '0.15rem 0.5rem', borderRadius: '10px', fontWeight: 'bold', marginLeft: '0.3rem' }}>OFFICIAL ADMIN</span>
          )}
        </div>

        {/* --- NAVIGATION TABS --- */}
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
              style={{
                background: 'none',
                border: 'none',
                color: activeTab === 'dashboard' ? theme.accent : theme.textMuted,
                fontWeight: activeTab === 'dashboard' ? '700' : '500',
                cursor: 'pointer',
                fontSize: '0.95rem',
                paddingBottom: '0.3rem',
                borderBottom: activeTab === 'dashboard' ? `2px solid ${theme.accent}` : '2px solid transparent'
              }}
            >
              Dashboard
            </button>
          )}
        </nav>

        {/* --- USER / AUTH ACTIONS --- */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)} 
            style={{ 
              padding: '0.5rem 1rem', 
              borderRadius: '8px', 
              border: `1px solid ${theme.border}`, 
              backgroundColor: theme.cardBg, 
              color: theme.textMain, 
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: '600'
            }}
          >
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </button>

          {user ? (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div 
                onClick={() => setActiveTab('dashboard')} 
                style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}
              >
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  backgroundColor: theme.accent,
                  backgroundImage: avatarUrl ? `url(${avatarUrl})` : 'none',
                  backgroundSize: 'cover',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '0.85rem',
                  color: '#FFF'
                }}>
                  {!avatarUrl && (nickname ? nickname[0].toUpperCase() : 'U')}
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{nickname || 'User'}</span>
              </div>
              <button 
                onClick={() => supabase.auth.signOut()} 
                style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', backgroundColor: 'transparent', border: `1px solid ${theme.border}`, color: theme.textMuted, cursor: 'pointer', fontSize: '0.85rem' }}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button 
              type="button"
              onClick={() => setShowAuthModal(true)} 
              style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.5rem 1.4rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* ===================================================================
          7. MAIN CONTENT AREA
          =================================================================== */}
      <main style={{ maxWidth: '1080px', margin: '0 auto', padding: '2rem' }}>
        
        {/* --- FIXED VERTICAL ROLLING BANNER (STRICTLY CENTERED ALIGNMENT) --- */}
        <div style={{ 
          backgroundColor: 'rgba(139, 92, 246, 0.08)', 
          border: `1px solid ${theme.accent}`, 
          borderRadius: '12px', 
          padding: '0 1.5rem', 
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          overflow: 'hidden',
          height: '48px',
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, overflow: 'hidden', height: '100%' }}>
            <span style={{ backgroundColor: theme.accent, color: '#FFF', fontSize: '0.75rem', fontWeight: 'bold', padding: '0.2rem 0.6rem', borderRadius: '6px', flexShrink: 0 }}>
              NOTICE ({currentBannerIndex + 1}/{topThreeAnnouncements.length})
            </span>

            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)', 
              transform: `translateY(-${currentBannerIndex * 48}px)`
            }}>
              {topThreeAnnouncements.map((item) => (
                <div key={item.id} style={{ height: '48px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '0.9rem', color: theme.textMain, fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: '48px' }}>
                    {item.title}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: theme.textMuted, flexShrink: 0, lineHeight: '48px' }}>
                    • {item.date}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={() => setActiveTab('announcements')} 
            style={{ background: 'none', border: 'none', color: theme.accent, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', flexShrink: 0 }}
          >
            View All →
          </button>
        </div>

        {/* --- RESOURCE HUB TAB --- */}
        {activeTab === 'resources' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            <div style={{ textAlign: 'center', padding: '0.5rem 0 0.5rem 0' }}>
              <span style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)', color: theme.accent, padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700', display: 'inline-block', marginBottom: '1rem' }}>
                Academic Platform for NTCI
              </span>
              <h1 style={{ fontSize: '2.5rem', fontWeight: '900', letterSpacing: '-0.03em', marginBottom: '0.8rem' }}>North Synapse</h1>
              <p style={{ color: theme.textMuted, fontSize: '1rem', maxWidth: '580px', margin: '0 auto', lineHeight: '1.5' }}>
                Browse verified course materials, AP guides, and contest prep by selecting subject categories below.
              </p>
            </div>

            {/* Search Bar */}
            <div style={{ position: 'relative', width: '100%' }}>
              <span style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)', color: theme.textMuted }}>🔍</span>
              <input 
                type="text" 
                placeholder="Search notes, topics, or study guide titles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '0.85rem 1rem 0.85rem 3rem', borderRadius: '10px', border: `1px solid ${theme.border}`, backgroundColor: theme.cardBg, color: theme.textMain, boxSizing: 'border-box', outline: 'none' }}
              />
            </div>

            {/* Multi-Select Tags Panel */}
            <div style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              
              <div>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: theme.textMuted, display: 'block', marginBottom: '0.6rem' }}>LEVEL &amp; ACADEMIC TRACK:</span>
                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                  {gradesList.map((grd) => {
                    const isSelected = selectedGrades.includes(grd);
                    return (
                      <button
                        key={grd}
                        onClick={() => toggleGradeFilter(grd)}
                        style={{
                          padding: '0.4rem 1rem',
                          borderRadius: '20px',
                          border: `1px solid ${isSelected ? theme.accent : theme.border}`,
                          backgroundColor: isSelected ? theme.accent : theme.bg,
                          color: isSelected ? '#FFF' : theme.textMain,
                          fontWeight: '600',
                          fontSize: '0.8rem',
                          cursor: 'pointer'
                        }}
                      >
                        {isSelected ? '✓ ' : ''}{grd}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: theme.textMuted, display: 'block', marginBottom: '0.6rem' }}>SUBJECT CATEGORIES:</span>
                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                  {subjectsList.map((sub) => {
                    const isSelected = selectedSubjects.includes(sub);
                    return (
                      <button
                        key={sub}
                        onClick={() => toggleSubjectFilter(sub)}
                        style={{
                          padding: '0.4rem 1rem',
                          borderRadius: '20px',
                          border: `1px solid ${isSelected ? theme.accent : theme.border}`,
                          backgroundColor: isSelected ? theme.accent : theme.bg,
                          color: isSelected ? '#FFF' : theme.textMain,
                          fontWeight: '600',
                          fontSize: '0.8rem',
                          cursor: 'pointer'
                        }}
                      >
                        {isSelected ? '✓ ' : ''}{sub}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Filtered Results Card Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredResources.length > 0 ? (
                filteredResources.map((res) => (
                  <div key={res.id} className="responsive-flex-col" style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.5rem' }}>
                        <span style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)', color: theme.accent, fontSize: '0.75rem', fontWeight: 'bold', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>{res.subject}</span>
                        <span style={{ backgroundColor: theme.bg, color: theme.textMuted, fontSize: '0.75rem', fontWeight: 'bold', padding: '0.2rem 0.6rem', borderRadius: '6px', border: `1px solid ${theme.border}` }}>{res.grade}</span>
                      </div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{res.title}</h3>
                      <p style={{ color: theme.textMuted, fontSize: '0.85rem', marginTop: '0.3rem' }}>{res.description}</p>
                      <span style={{ fontSize: '0.75rem', color: theme.textMuted, marginTop: '0.5rem', display: 'block' }}>Shared by: {res.author}</span>
                    </div>

                    <button style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem', flexShrink: 0 }}>
                      Download
                    </button>
                  </div>
                ))
              ) : (
                <div style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '16px', padding: '3rem 2rem', textAlign: 'center' }}>
                  <p style={{ color: theme.textMuted }}>No study resources match your selected subject/grade combination.</p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* --- STUDY LOUNGES TAB --- */}
        {activeTab === 'lounges' && (
          <div style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '16px', padding: '4rem 2rem', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '1rem' }}>Study Lounge</h2>
            <p style={{ color: theme.textMuted }}>Virtual study rooms and focus timers coming soon.</p>
          </div>
        )}

        {/* --- ANNOUNCEMENTS TAB --- */}
        {activeTab === 'announcements' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }}>Official Announcements &amp; Posters</h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {announcements.map((item) => (
                <div key={item.id} style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '16px', padding: '1.8rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                    <strong style={{ fontSize: '0.95rem', color: theme.accent }}>{item.authorName}</strong>
                    <span style={{ fontSize: '0.8rem', color: theme.textMuted }}>{item.date}</span>
                  </div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.8rem' }}>{item.title}</h3>
                  <p style={{ fontSize: '0.95rem', color: theme.textMain, lineHeight: '1.6' }}>{item.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- FEEDBACK & REVIEWS TAB (LOGIN GUARANTEED) --- */}
        {activeTab === 'feedback' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ borderBottom: `1px solid ${theme.border}`, paddingBottom: '1rem' }}>
              <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }}>Feedback &amp; Reviews</h1>
              <p style={{ color: theme.textMuted, fontSize: '0.9rem', marginTop: '0.3rem' }}>Submit star ratings and reviews directly to northsynapse@gmail.com.</p>
            </div>

            <form onSubmit={handleAddFeedback} style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '16px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Leave Your Feedback</h3>

              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Star Rating:</label>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span 
                      key={star} 
                      onClick={() => setFeedbackRating(star)} 
                      style={{ fontSize: '1.5rem', cursor: 'pointer', color: star <= feedbackRating ? '#F59E0B' : theme.textMuted }}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: theme.textMuted, marginBottom: '0.3rem' }}>Category</label>
                <select 
                  value={feedbackCategory} 
                  onChange={(e) => setFeedbackCategory(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain }}
                >
                  <option value="General Suggestion">General Suggestion</option>
                  <option value="Bug Report">Bug Report</option>
                  <option value="Resource Request">Resource Request</option>
                  <option value="Study Lounge Feature">Study Lounge Feature</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: theme.textMuted, marginBottom: '0.3rem' }}>Your Review / Feedback</label>
                <textarea 
                  required
                  rows={4}
                  placeholder="Let us know what you think or what features you'd like to see..."
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  style={{ width: '100%', padding: '0.7rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain, boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
              </div>

              <button type="submit" style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.8rem 2rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', alignSelf: 'flex-start' }}>
                Submit Review
              </button>
            </form>
          </div>
        )}

        {/* --- DISCUSSIONS TAB --- */}
        {activeTab === 'discussions' && (
          <div style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '16px', padding: '4rem 2rem', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '1rem' }}>Discussions</h2>
            <p style={{ color: theme.textMuted }}>Academic discussion board coming soon.</p>
          </div>
        )}

        {/* --- USER / ADMIN DASHBOARD TAB --- */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            <div className="responsive-flex-col" style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '16px', padding: '2.5rem', display: 'flex', gap: '2rem', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                <div style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  backgroundColor: theme.bg,
                  border: `2px solid ${theme.accent}`,
                  backgroundImage: avatarUrl ? `url(${avatarUrl})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: theme.accent,
                  flexShrink: 0
                }}>
                  {!avatarUrl && (nickname ? nickname[0].toUpperCase() : 'U')}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: 'bold' }}>{nickname || 'Anonymous Student'}</h1>
                    {isAdmin && (
                      <span style={{ backgroundColor: theme.accent, color: '#FFF', fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '10px', fontWeight: 'bold' }}>ADMIN ACCOUNT</span>
                    )}
                  </div>
                  <p style={{ color: theme.textMuted, fontSize: '0.9rem', marginTop: '0.2rem' }}>@{username || 'username'} • {grade || 'Grade Not Set'} • {gender || 'Gender Not Specified'}</p>
                  <p style={{ marginTop: '0.6rem', fontSize: '0.85rem' }}>{bio || 'No bio written yet.'}</p>
                </div>
              </div>

              <div style={{ backgroundColor: theme.bg, padding: '1rem 1.5rem', borderRadius: '12px', border: `1px solid ${theme.border}`, textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: theme.textMuted, display: 'block', textTransform: 'uppercase', fontWeight: 'bold' }}>Member Since</span>
                <strong style={{ fontSize: '1rem', color: theme.accent }}>{createdAt}</strong>
              </div>
            </div>

            {isAdmin && (
              <div style={{ backgroundColor: 'rgba(139, 92, 246, 0.05)', border: `1px solid ${theme.accent}`, borderRadius: '16px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: theme.accent }}>North Synapse Operational Analytics</h2>
                  <span style={{ backgroundColor: theme.cardBg, padding: '0.4rem 0.8rem', borderRadius: '8px', border: `1px solid ${theme.border}`, fontSize: '0.85rem', color: '#10B981', fontWeight: 'bold' }}>
                    ● Average Rating: {avgRating} / 5.0
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.2rem' }}>
                  <div style={{ padding: '1.2rem', backgroundColor: theme.cardBg, borderRadius: '12px', border: `1px solid ${theme.border}` }}>
                    <span style={{ fontSize: '0.8rem', color: theme.textMuted }}>Total Reviews Received</span>
                    <h3 style={{ fontSize: '1.8rem', fontWeight: '900', color: theme.accent, marginTop: '0.3rem' }}>{feedbacks.length} Reviews</h3>
                  </div>
                  <div style={{ padding: '1.2rem', backgroundColor: theme.cardBg, borderRadius: '12px', border: `1px solid ${theme.border}` }}>
                    <span style={{ fontSize: '0.8rem', color: theme.textMuted }}>Overall Platform Rating</span>
                    <h3 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#F59E0B', marginTop: '0.3rem' }}>★ {avgRating}</h3>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
              <button 
                onClick={() => setShowEditProfileModal(true)}
                style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.8rem 2rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem' }}
              >
                Edit Profile
              </button>
            </div>

          </div>
        )}

      </main>

      {/* ===================================================================
          8. EDIT PROFILE MODAL
          =================================================================== */}
      {showEditProfileModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999999 }}>
          <div style={{ backgroundColor: theme.cardBg, padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '480px', border: `1px solid ${theme.border}`, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Edit Profile Settings</h2>
              <button onClick={() => setShowEditProfileModal(false)} style={{ background: 'none', border: 'none', color: theme.textMain, cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
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
          9. AUTHENTICATION & FORGOT PASSWORD MODALS
          =================================================================== */}
      {showAuthModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999999 }}>
          <div style={{ backgroundColor: theme.cardBg, padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '420px', border: `1px solid ${theme.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{isSignUp ? 'Sign Up' : 'Sign In'}</h2>
              <button onClick={() => setShowAuthModal(false)} style={{ background: 'none', border: 'none', color: theme.textMain, cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
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
              <button onClick={() => setShowForgotPasswordModal(false)} style={{ background: 'none', border: 'none', color: theme.textMain, cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
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

      {/* Reset NEW Password Modal (Triggered via Email Token Link) */}
      {showResetNewPasswordModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999999 }}>
          <div style={{ backgroundColor: theme.cardBg, padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '400px', border: `1px solid ${theme.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: theme.accent }}>Set New Password</h2>
              <button onClick={() => setShowResetNewPasswordModal(false)} style={{ background: 'none', border: 'none', color: theme.textMain, cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
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
              <button onClick={() => setShowTermsModal(false)} style={{ background: 'none', border: 'none', color: theme.textMain, cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
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
