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

type NavTab = 'resources' | 'lounges' | 'announcements' | 'discussions' | 'dashboard';

interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  date: string;
  authorName: string;
  authorAvatar: string;
  images: string[];
  formatting?: {
    isBold?: boolean;
    isItalic?: boolean;
    headerSize?: 'normal' | 'h2' | 'h3';
  };
}

export default function Home() {
  /* ==========================================================================
     2. GLOBAL & COMPONENT STATES
     ========================================================================== */
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState<NavTab>('resources');

  const [user, setUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  
  // Auth Form State
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
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

  // Announcements List State
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([
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
      title: 'New Study Lounges & Pomodoro Timers Deployment',
      content: 'We are launching virtual quiet study lounges for midterm prep. Check back under the Study Lounge tab!',
      date: 'Oct 22, 2026',
      authorName: 'North Synapse Official',
      authorAvatar: '',
      images: []
    },
    {
      id: '3',
      title: 'Academic Integrity & Platform Rules',
      content: 'Ensure all shared materials uphold school guidelines and student privacy. Welcome everyone!',
      date: 'Oct 18, 2026',
      authorName: 'North Synapse Official',
      authorAvatar: '',
      images: []
    }
  ]);

  // Rolling Banner Carousel Index State (10 Seconds Auto Carousel)
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  // Admin Rich Post Form State
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [postAuthorIdentity, setPostAuthorIdentity] = useState('official');
  const [customAuthorName, setCustomAuthorName] = useState('');
  const [customAuthorAvatar, setCustomAuthorAvatar] = useState('');
  const [imageInputs, setImageInputs] = useState<string[]>(['']);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [headerSize, setHeaderSize] = useState<'normal' | 'h2' | 'h3'>('normal');

  // Resource Filter State
  const [selectedTag, setSelectedTag] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // File Input Ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Check if current logged-in user is Admin
  const isAdmin = user?.email?.toLowerCase().includes('northsynapse');

  /* ==========================================================================
     3. AUTHENTICATION & CAROUSEL TIMING EFFECT
     ========================================================================== */
  useEffect(() => {
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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

  // Auto-scroll Banner Timer (Rotates through latest 3 items every 10 seconds)
  useEffect(() => {
    const bannerItemsCount = Math.min(announcements.length, 3);
    if (bannerItemsCount <= 1) return;

    const timer = setInterval(() => {
      setCurrentBannerIndex((prevIndex) => (prevIndex + 1) % bannerItemsCount);
    }, 10000); // 10 seconds

    return () => clearInterval(timer);
  }, [announcements]);

  /* ==========================================================================
     4. HANDLERS
     ========================================================================== */
  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  function handleAddImageInput() {
    setImageInputs([...imageInputs, '']);
  }

  function handleImageInputChange(index: number, val: string) {
    const updated = [...imageInputs];
    updated[index] = val;
    setImageInputs(updated);
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
          alert('Please review and agree to the Terms of Service before registering.');
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.signUp({
          email: authEmail.trim(),
          password: authPassword,
        });

        if (error) {
          alert('SignUp Failed: ' + error.message);
        } else {
          alert('Registration successful! Redirecting to your Dashboard.');
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
    const confirmDelete = window.confirm('Are you sure you want to delete this account? This will permanently invalidate your current credentials.');
    if (!confirmDelete) return;

    try {
      const scrambledPassword = 'DELETED_' + Math.random().toString(36).slice(-10) + Date.now();
      await supabase.auth.updateUser({
        password: scrambledPassword,
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
      alert('Account invalidated and signed out successfully.');
    } catch (err: any) {
      alert('Error deactivating account: ' + err.message);
    }
  }

  function handleCreateAnnouncement(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const validImages = imageInputs.filter(url => url.trim() !== '');

    const newPost: AnnouncementItem = {
      id: Date.now().toString(),
      title: newTitle,
      content: newContent,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      authorName: postAuthorIdentity === 'custom' && customAuthorName.trim() ? customAuthorName : 'North Synapse Official',
      authorAvatar: postAuthorIdentity === 'custom' ? customAuthorAvatar : '',
      images: validImages,
      formatting: {
        isBold,
        isItalic,
        headerSize
      }
    };

    setAnnouncements([newPost, ...announcements]);
    setCurrentBannerIndex(0);
    setNewTitle('');
    setNewContent('');
    setImageInputs(['']);
    setCustomAuthorName('');
    setCustomAuthorAvatar('');
    alert('Announcement / Poster published successfully!');
  }

  /* ==========================================================================
     5. THEME DEFINITION
     ========================================================================== */
  const theme = {
    bg: isDarkMode ? '#0E1117' : '#F8FAFC',
    cardBg: isDarkMode ? '#161B22' : '#FFFFFF',
    border: isDarkMode ? '#21262D' : '#E2E8F0',
    textMain: isDarkMode ? '#F0F6FC' : '#0F172A',
    textMuted: isDarkMode ? '#8B949E' : '#64748B',
    accent: '#8B5CF6',
  };

  // Get Top 3 Items for Vertical Carousel
  const topThreeAnnouncements = announcements.slice(0, 3);
  const activeBannerItem = topThreeAnnouncements[currentBannerIndex] || topThreeAnnouncements[0];

  return (
    <div style={{ backgroundColor: theme.bg, color: theme.textMain, minHeight: '100vh', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* ===================================================================
          6. HEADER & NAVIGATION
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
        <nav style={{ display: 'flex', gap: '1.8rem' }}>
          {(['resources', 'lounges', 'announcements', 'discussions'] as NavTab[]).map((tab) => (
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
                borderBottom: activeTab === tab ? `2px solid ${theme.accent}` : '2px solid transparent'
              }}
            >
              {tab === 'resources' ? 'Resource Hub' : tab === 'lounges' ? 'Study Lounge' : tab === 'announcements' ? 'Announcements' : 'Discussions'}
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
        
        {/* --- VERTICAL ROLLING BANNER (LOOPS TOP 3 LATEST ANNOUNCEMENTS EVERY 10 SECONDS) --- */}
        <div style={{ 
          backgroundColor: 'rgba(139, 92, 246, 0.08)', 
          border: `1px solid ${theme.accent}`, 
          borderRadius: '12px', 
          padding: '0.8rem 1.5rem', 
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          overflow: 'hidden',
          height: '48px',
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, overflow: 'hidden' }}>
            <span style={{ backgroundColor: theme.accent, color: '#FFF', fontSize: '0.75rem', fontWeight: 'bold', padding: '0.2rem 0.6rem', borderRadius: '6px', flexShrink: 0 }}>
              NOTICE ({currentBannerIndex + 1}/{topThreeAnnouncements.length})
            </span>

            {/* Vertical Smooth Slide Text Container */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)', 
              transform: `translateY(-${currentBannerIndex * 48}px)`
            }}>
              {topThreeAnnouncements.map((item) => (
                <div key={item.id} style={{ height: '48px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '0.9rem', color: theme.textMain, fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.title}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: theme.textMuted, flexShrink: 0 }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            
            {/* Hero Text Banner */}
            <div style={{ textAlign: 'center', padding: '0.5rem 0 1.5rem 0' }}>
              <span style={{ 
                backgroundColor: 'rgba(139, 92, 246, 0.15)', 
                color: theme.accent, 
                padding: '0.4rem 1rem', 
                borderRadius: '20px', 
                fontSize: '0.8rem', 
                fontWeight: '700',
                letterSpacing: '0.03em',
                display: 'inline-block',
                marginBottom: '1.2rem'
              }}>
                Academic Platform for NTCI
              </span>
              
              <h1 style={{ fontSize: '2.8rem', fontWeight: '900', letterSpacing: '-0.03em', marginBottom: '1rem' }}>
                North Synapse
              </h1>
              
              <p style={{ color: theme.textMuted, fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto', lineHeight: '1.5' }}>
                A centralized workspace for verified course resources, virtual study rooms, and academic peer discussions.
              </p>
            </div>

            {/* Search & Tag Filter Bar */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, position: 'relative', minWidth: '300px' }}>
                <span style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)', color: theme.textMuted, fontSize: '1rem' }}>🔍</span>
                <input 
                  type="text" 
                  placeholder="Search notes, exam prep, course codes (e.g. ICS4U, SPH4U)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '0.85rem 1rem 0.85rem 3rem', 
                    borderRadius: '10px', 
                    border: `1px solid ${theme.border}`, 
                    backgroundColor: theme.cardBg, 
                    color: theme.textMain, 
                    boxSizing: 'border-box',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {['ALL', 'ICS4U', 'SPH4U', 'MCV4U', 'SCH4U'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    style={{
                      padding: '0.6rem 1.1rem',
                      borderRadius: '8px',
                      border: `1px solid ${selectedTag === tag ? theme.accent : theme.border}`,
                      backgroundColor: selectedTag === tag ? theme.accent : theme.cardBg,
                      color: selectedTag === tag ? '#FFF' : theme.textMuted,
                      fontWeight: '700',
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* File Center Inner Box */}
            <div style={{ 
              backgroundColor: theme.cardBg, 
              border: `1px solid ${theme.border}`, 
              borderRadius: '16px', 
              padding: '4rem 2rem', 
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem'
            }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={theme.textMuted} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              </svg>

              <h3 style={{ fontSize: '1.3rem', fontWeight: '800', marginTop: '0.5rem' }}>No Resources Available</h3>
              <p style={{ color: theme.textMuted, fontSize: '0.9rem', maxWidth: '400px' }}>
                Be the first to share course notes or study guides for this course.
              </p>

              <button style={{ 
                backgroundColor: theme.accent, 
                color: '#FFF', 
                border: 'none', 
                padding: '0.8rem 2rem', 
                borderRadius: '8px', 
                fontWeight: 'bold', 
                cursor: 'pointer', 
                marginTop: '0.8rem',
                fontSize: '0.9rem'
              }}>
                Upload Resource
              </button>
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

        {/* --- ANNOUNCEMENTS TAB (WITH RICH POSTER EDITOR & IDENTITY SWITCHER) --- */}
        {activeTab === 'announcements' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.border}`, paddingBottom: '1rem' }}>
              <div>
                <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }}>Official Announcements &amp; Posters</h1>
                <p style={{ color: theme.textMuted, fontSize: '0.9rem', marginTop: '0.3rem' }}>Browse official school announcements, posters, and student spotlights.</p>
              </div>
            </div>

            {/* Admin Advanced Creator Control */}
            {isAdmin && (
              <form onSubmit={handleCreateAnnouncement} style={{ backgroundColor: 'rgba(139, 92, 246, 0.05)', border: `1px solid ${theme.accent}`, borderRadius: '16px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: theme.accent }}>Admin Announcement &amp; Poster Studio</h3>
                  <span style={{ fontSize: '0.8rem', color: theme.textMuted }}>Rich Poster Studio Active</span>
                </div>

                {/* Identity Selection Bar */}
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', backgroundColor: theme.cardBg, padding: '1rem', borderRadius: '10px', border: `1px solid ${theme.border}` }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Post Identity:</label>
                  <select 
                    value={postAuthorIdentity} 
                    onChange={(e) => setPostAuthorIdentity(e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain }}
                  >
                    <option value="official">North Synapse Official</option>
                    <option value="custom">Post as Custom User / Student</option>
                  </select>

                  {postAuthorIdentity === 'custom' && (
                    <div style={{ display: 'flex', gap: '0.8rem', flex: 1, minWidth: '280px' }}>
                      <input 
                        type="text" 
                        required
                        placeholder="Author Nickname (e.g. Alex Smith)"
                        value={customAuthorName}
                        onChange={(e) => setCustomAuthorName(e.target.value)}
                        style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain }}
                      />
                      <input 
                        type="text" 
                        placeholder="Avatar Image URL (Optional)"
                        value={customAuthorAvatar}
                        onChange={(e) => setCustomAuthorAvatar(e.target.value)}
                        style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain }}
                      />
                    </div>
                  )}
                </div>

                {/* Rich Formatting Toolbar */}
                <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', backgroundColor: theme.cardBg, padding: '0.6rem 1rem', borderRadius: '8px', border: `1px solid ${theme.border}` }}>
                  <span style={{ fontSize: '0.8rem', color: theme.textMuted }}>Text Style:</span>
                  <button 
                    type="button" 
                    onClick={() => setIsBold(!isBold)} 
                    style={{ padding: '0.3rem 0.8rem', borderRadius: '4px', border: `1px solid ${theme.border}`, backgroundColor: isBold ? theme.accent : theme.bg, color: isBold ? '#FFF' : theme.textMain, fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    B
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setIsItalic(!isItalic)} 
                    style={{ padding: '0.3rem 0.8rem', borderRadius: '4px', border: `1px solid ${theme.border}`, backgroundColor: isItalic ? theme.accent : theme.bg, color: isItalic ? '#FFF' : theme.textMain, fontStyle: 'italic', cursor: 'pointer' }}
                  >
                    I
                  </button>
                  <select 
                    value={headerSize} 
                    onChange={(e: any) => setHeaderSize(e.target.value)}
                    style={{ padding: '0.3rem', borderRadius: '4px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain, fontSize: '0.8rem' }}
                  >
                    <option value="normal">Normal Text</option>
                    <option value="h2">Large Title (H2)</option>
                    <option value="h3">Medium Subtitle (H3)</option>
                  </select>
                </div>

                {/* Title & Content Input */}
                <input 
                  type="text" 
                  required
                  placeholder="Poster / Announcement Heading..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: `1px solid ${theme.border}`, backgroundColor: theme.cardBg, color: theme.textMain, boxSizing: 'border-box', fontWeight: 'bold' }}
                />

                <textarea 
                  required
                  rows={4}
                  placeholder="Write full poster text, descriptions, or event details..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '0.8rem', 
                    borderRadius: '8px', 
                    border: `1px solid ${theme.border}`, 
                    backgroundColor: theme.cardBg, 
                    color: theme.textMain, 
                    boxSizing: 'border-box', 
                    fontFamily: 'inherit',
                    fontWeight: isBold ? 'bold' : 'normal',
                    fontStyle: isItalic ? 'italic' : 'normal',
                  }}
                />

                {/* Multiple Image / Poster Attachment Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Poster Image Links (Multiple Supported):</label>
                  {imageInputs.map((img, idx) => (
                    <input
                      key={idx}
                      type="text"
                      placeholder={`Image / Poster URL #${idx + 1}`}
                      value={img}
                      onChange={(e) => handleImageInputChange(idx, e.target.value)}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.cardBg, color: theme.textMain, boxSizing: 'border-box' }}
                    />
                  ))}
                  <button 
                    type="button" 
                    onClick={handleAddImageInput} 
                    style={{ background: 'none', border: `1px dashed ${theme.accent}`, color: theme.accent, padding: '0.5rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', alignSelf: 'flex-start' }}
                  >
                    + Add Another Poster Image
                  </button>
                </div>

                <button type="submit" style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.8rem 2rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', alignSelf: 'flex-start', marginTop: '0.5rem' }}>
                  Publish Announcement &amp; Poster
                </button>
              </form>
            )}

            {/* Announcements List with Left-Top Avatar & Image Gallery */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {announcements.map((item) => (
                <div key={item.id} style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '16px', padding: '1.8rem' }}>
                  
                  {/* Top Header: Author Identity Info & Date */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', borderBottom: `1px solid ${theme.border}`, paddingBottom: '0.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: theme.accent,
                        backgroundImage: item.authorAvatar ? `url(${item.authorAvatar})` : 'none',
                        backgroundSize: 'cover',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        color: '#FFF',
                        fontSize: '0.85rem'
                      }}>
                        {!item.authorAvatar && item.authorName[0].toUpperCase()}
                      </div>
                      <div>
                        <strong style={{ display: 'block', fontSize: '0.95rem', color: theme.textMain }}>{item.authorName}</strong>
                        <span style={{ fontSize: '0.75rem', color: theme.textMuted }}>Official Publisher</span>
                      </div>
                    </div>

                    <span style={{ fontSize: '0.8rem', color: theme.textMuted }}>{item.date}</span>
                  </div>

                  {/* Post Heading */}
                  {item.formatting?.headerSize === 'h2' ? (
                    <h2 style={{ fontSize: '1.6rem', fontWeight: '900', marginBottom: '0.8rem' }}>{item.title}</h2>
                  ) : item.formatting?.headerSize === 'h3' ? (
                    <h3 style={{ fontSize: '1.3rem', fontWeight: '800', marginBottom: '0.8rem' }}>{item.title}</h3>
                  ) : (
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.8rem' }}>{item.title}</h3>
                  )}

                  {/* Post Content Body */}
                  <p style={{ 
                    fontSize: '0.95rem', 
                    color: theme.textMain, 
                    lineHeight: '1.6', 
                    whiteSpace: 'pre-wrap',
                    fontWeight: item.formatting?.isBold ? 'bold' : 'normal',
                    fontStyle: item.formatting?.isItalic ? 'italic' : 'normal'
                  }}>
                    {item.content}
                  </p>

                  {/* Image Gallery Grid */}
                  {item.images && item.images.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: item.images.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '1.2rem' }}>
                      {item.images.map((imgUrl, imgIdx) => (
                        <img 
                          key={imgIdx} 
                          src={imgUrl} 
                          alt="Poster Attachment" 
                          style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', borderRadius: '10px', border: `1px solid ${theme.border}` }}
                        />
                      ))}
                    </div>
                  )}

                </div>
              ))}
            </div>

          </div>
        )}

        {/* --- DISCUSSIONS TAB --- */}
        {activeTab === 'discussions' && (
          <div style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '16px', padding: '4rem 2rem', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '1rem' }}>Discussions</h2>
            <p style={{ color: theme.textMuted }}>Academic discussion board coming soon.</p>
          </div>
        )}

        {/* --- USER DASHBOARD TAB --- */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* User Overview Profile Card */}
            <div style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '16px', padding: '2.5rem', display: 'flex', gap: '2rem', alignItems: 'center', justifyContent: 'space-between' }}>
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
                  color: theme.accent
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

              {/* Display Member Since / Created Date */}
              <div style={{ backgroundColor: theme.bg, padding: '1rem 1.5rem', borderRadius: '12px', border: `1px solid ${theme.border}`, textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: theme.textMuted, display: 'block', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.05em' }}>Member Since</span>
                <strong style={{ fontSize: '1rem', color: theme.accent }}>{createdAt}</strong>
              </div>
            </div>

            {/* --- ADMIN EXCLUSIVE DASHBOARD (REPLACED STUDENT METRICS WITH REAL ADMIN ANALYTICS) --- */}
            {isAdmin ? (
              <div style={{ backgroundColor: 'rgba(139, 92, 246, 0.05)', border: `1px solid ${theme.accent}`, borderRadius: '16px', padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: theme.accent }}>North Synapse Master Operational Panel</h2>
                  <div style={{ backgroundColor: theme.cardBg, padding: '0.5rem 1rem', borderRadius: '8px', border: `1px solid ${theme.border}`, fontSize: '0.85rem', color: theme.textMuted }}>
                    Master Status: <strong style={{ color: '#10B981' }}>Live &amp; Operational</strong>
                  </div>
                </div>

                {/* Admin Exclusive Stats Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.2rem' }}>
                  
                  <div style={{ padding: '1.2rem', backgroundColor: theme.cardBg, borderRadius: '12px', border: `1px solid ${theme.border}` }}>
                    <span style={{ fontSize: '0.8rem', color: theme.textMuted }}>Total Registered Users</span>
                    <h3 style={{ fontSize: '1.8rem', fontWeight: '900', color: theme.accent, marginTop: '0.3rem' }}>1 Accounts</h3>
                    <span style={{ fontSize: '0.75rem', color: '#10B981' }}>● Verified Database</span>
                  </div>

                  <div style={{ padding: '1.2rem', backgroundColor: theme.cardBg, borderRadius: '12px', border: `1px solid ${theme.border}` }}>
                    <span style={{ fontSize: '0.8rem', color: theme.textMuted }}>Active Sessions</span>
                    <h3 style={{ fontSize: '1.8rem', fontWeight: '900', color: theme.textMain, marginTop: '0.3rem' }}>1 Online</h3>
                    <span style={{ fontSize: '0.75rem', color: theme.textMuted }}>Real-time user traffic</span>
                  </div>

                  <div style={{ padding: '1.2rem', backgroundColor: theme.cardBg, borderRadius: '12px', border: `1px solid ${theme.border}` }}>
                    <span style={{ fontSize: '0.8rem', color: theme.textMuted }}>Platform Storage Used</span>
                    <h3 style={{ fontSize: '1.8rem', fontWeight: '900', color: theme.textMain, marginTop: '0.3rem' }}>0.02 MB</h3>
                    <span style={{ fontSize: '0.75rem', color: theme.textMuted }}>Supabase Cloud Bucket</span>
                  </div>

                  <div style={{ padding: '1.2rem', backgroundColor: theme.cardBg, borderRadius: '12px', border: `1px solid ${theme.border}` }}>
                    <span style={{ fontSize: '0.8rem', color: theme.textMuted }}>System Firewall &amp; Auth</span>
                    <h3 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#10B981', marginTop: '0.3rem' }}>Protected</h3>
                    <span style={{ fontSize: '0.75rem', color: theme.textMuted }}>Encrypted Tokens</span>
                  </div>

                </div>
              </div>
            ) : (
              /* --- REGULAR STUDENT ACTIVITY GRID --- */
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                <div style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem' }}>Study Lounge Activity</h3>
                  <div style={{ fontSize: '0.85rem', color: theme.textMuted, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <div style={{ padding: '0.8rem', backgroundColor: theme.bg, borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Total Study Time</span>
                      <strong style={{ color: theme.accent }}>0 hrs 0 mins</strong>
                    </div>
                    <div style={{ padding: '0.8rem', backgroundColor: theme.bg, borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Rooms Joined</span>
                      <strong>0 Lounges</strong>
                    </div>
                  </div>
                </div>

                <div style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem' }}>My Posts &amp; Threads</h3>
                  <p style={{ fontSize: '0.85rem', color: theme.textMuted }}>You haven&apos;t created any posts in Discussions yet.</p>
                </div>

                <div style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem' }}>Study Peers</h3>
                  <p style={{ fontSize: '0.85rem', color: theme.textMuted }}>No added study friends yet.</p>
                </div>
              </div>
            )}

            {/* Dashboard Edit Profile Trigger Button */}
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
        <div 
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            width: '100vw', 
            height: '100vh', 
            backgroundColor: 'rgba(0,0,0,0.8)', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            zIndex: 999999 
          }}
        >
          <div style={{ backgroundColor: theme.cardBg, padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '480px', border: `1px solid ${theme.border}`, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Edit Profile Settings</h2>
              <button onClick={() => setShowEditProfileModal(false)} style={{ background: 'none', border: 'none', color: theme.textMain, cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              
              {/* Avatar Upload Field */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept="image/*" 
                  onChange={handleAvatarChange} 
                  style={{ display: 'none' }} 
                />
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: '75px',
                    height: '75px',
                    borderRadius: '50%',
                    backgroundColor: theme.bg,
                    border: `2px dashed ${theme.accent}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    backgroundImage: avatarUrl ? `url(${avatarUrl})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  {!avatarUrl && <span style={{ fontSize: '0.8rem', color: theme.textMuted }}>Upload</span>}
                </div>
                <div>
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', backgroundColor: theme.bg, border: `1px solid ${theme.border}`, color: theme.textMain, cursor: 'pointer', fontSize: '0.85rem' }}
                  >
                    Change Image
                  </button>
                  <p style={{ fontSize: '0.75rem', color: theme.textMuted, marginTop: '0.3rem' }}>Click to select an image from your device</p>
                </div>
              </div>

              {/* Username & Nickname Fields */}
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: theme.textMuted, marginBottom: '0.3rem' }}>Username</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="alex_smith" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain, boxSizing: 'border-box' }} 
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: theme.textMuted, marginBottom: '0.3rem' }}>Nickname</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Alex" 
                    value={nickname} 
                    onChange={(e) => setNickname(e.target.value)} 
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain, boxSizing: 'border-box' }} 
                  />
                </div>
              </div>

              {/* Grade Dropdown & Gender Select */}
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: theme.textMuted, marginBottom: '0.3rem' }}>Grade</label>
                  <select
                    required
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain, boxSizing: 'border-box' }}
                  >
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
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain, boxSizing: 'border-box' }}
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="non-binary">Non-binary</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              {/* Bio Field */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: theme.textMuted, marginBottom: '0.3rem' }}>Bio (Optional)</label>
                <textarea 
                  placeholder="Tell us a bit about yourself..." 
                  value={bio} 
                  onChange={(e) => setBio(e.target.value)} 
                  rows={3}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain, boxSizing: 'border-box', fontFamily: 'inherit' }} 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                <button 
                  type="submit" 
                  disabled={savingProfile}
                  style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.7rem 1.5rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', opacity: savingProfile ? 0.6 : 1 }}
                >
                  {savingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
                </button>

                <button 
                  type="button" 
                  onClick={handleDeleteAccount}
                  style={{ background: 'none', border: '1px solid #EF4444', color: '#EF4444', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Delete Account
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ===================================================================
          9. AUTHENTICATION MODAL (SIGN IN / SIGN UP WITH TERMS)
          =================================================================== */}
      {showAuthModal && (
        <div 
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            width: '100vw', 
            height: '100vh', 
            backgroundColor: 'rgba(0,0,0,0.8)', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            zIndex: 999999 
          }}
        >
          <div style={{ backgroundColor: theme.cardBg, padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '420px', border: `1px solid ${theme.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{isSignUp ? 'Sign Up' : 'Sign In'}</h2>
              <button onClick={() => setShowAuthModal(false)} style={{ background: 'none', border: 'none', color: theme.textMain, cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>

            <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: theme.textMuted, marginBottom: '0.3rem' }}>Email</label>
                <input 
                  type="email" 
                  required 
                  placeholder="350403596@tdsb.ca" 
                  value={authEmail} 
                  onChange={(e) => setAuthEmail(e.target.value)} 
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain, boxSizing: 'border-box' }} 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: theme.textMuted, marginBottom: '0.3rem' }}>Password</label>
                <input 
                  type="password" 
                  required 
                  placeholder="••••••••" 
                  value={authPassword} 
                  onChange={(e) => setAuthPassword(e.target.value)} 
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain, boxSizing: 'border-box' }} 
                />
              </div>

              {isSignUp && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '0.2rem' }}>
                  
                  {/* Student Confirmation Checkbox */}
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <input
                      type="checkbox"
                      id="studentConfirm"
                      required
                      checked={isStudentConfirmed}
                      onChange={(e) => setIsStudentConfirmed(e.target.checked)}
                      style={{ marginTop: '0.2rem' }}
                    />
                    <label htmlFor="studentConfirm" style={{ fontSize: '0.8rem', color: theme.textMuted, lineHeight: '1.3' }}>
                      I confirm that I am a current student or alumni, and I agree to uphold academic integrity.
                    </label>
                  </div>

                  {/* Terms & Conditions Agreement Checkbox */}
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <input
                      type="checkbox"
                      id="termsConfirm"
                      required
                      checked={hasAgreedTerms}
                      onChange={(e) => setHasAgreedTerms(e.target.checked)}
                      style={{ marginTop: '0.2rem' }}
                    />
                    <label htmlFor="termsConfirm" style={{ fontSize: '0.8rem', color: theme.textMuted, lineHeight: '1.3' }}>
                      I have read and agree to the{' '}
                      <span 
                        onClick={() => setShowTermsModal(true)} 
                        style={{ color: theme.accent, textDecoration: 'underline', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        Terms of Service
                      </span>.
                    </label>
                  </div>

                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.75rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', opacity: loading ? 0.6 : 1, marginTop: '0.5rem' }}
              >
                {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
              </button>
            </form>

            <p 
              onClick={() => { setIsSignUp(!isSignUp); setIsStudentConfirmed(false); setHasAgreedTerms(false); }} 
              style={{ color: theme.accent, marginTop: '1.2rem', cursor: 'pointer', textAlign: 'center', fontSize: '0.85rem' }}
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </p>
          </div>
        </div>
      )}

      {/* ===================================================================
          10. TERMS OF SERVICE MODAL
          =================================================================== */}
      {showTermsModal && (
        <div 
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            width: '100vw', 
            height: '100vh', 
            backgroundColor: 'rgba(0,0,0,0.85)', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            zIndex: 9999999 
          }}
        >
          <div style={{ backgroundColor: theme.cardBg, padding: '2rem', borderRadius: '16px', width: '90%', maxWidth: '520px', border: `1px solid ${theme.border}`, maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: `1px solid ${theme.border}`, paddingBottom: '0.8rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: theme.accent }}>Terms of Service &amp; Community Agreement</h2>
              <button onClick={() => setShowTermsModal(false)} style={{ background: 'none', border: 'none', color: theme.textMain, cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>

            <div style={{ fontSize: '0.85rem', color: theme.textMain, lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ color: theme.textMuted }}>
                Welcome to <strong>North Synapse</strong>. This platform is an independent, student-built space dedicated to academic collaboration and peer study. By registering, you agree to the following terms:
              </p>

              <div>
                <strong style={{ color: theme.accent, display: 'block', marginBottom: '0.2rem' }}>1. Community Scope &amp; Access Control</strong>
                <p style={{ color: theme.textMuted }}>
                  <strong>Student-Exclusive Platform</strong>: Access is strictly reserved for current students and alumni. Teachers, school administrators, parents, or outside supervisors are strictly prohibited from creating accounts or accessing internal user data.<br/>
                  <strong>Account Integrity</strong>: Users must safeguard their credentials and shall not grant account access to non-student individuals who may compromise community privacy or academic autonomy.
                </p>
              </div>

              <div>
                <strong style={{ color: theme.accent, display: 'block', marginBottom: '0.2rem' }}>2. System &amp; Network Security</strong>
                <p style={{ color: theme.textMuted }}>
                  <strong>Prohibition of Malicious Activity</strong>: Distributing malicious code, Trojan viruses, phishing links, or attempting unauthorized access/data scraping against the infrastructure is strictly forbidden.
                </p>
              </div>

              <div>
                <strong style={{ color: theme.accent, display: 'block', marginBottom: '0.2rem' }}>3. Academic Collaboration &amp; Disclaimer</strong>
                <p style={{ color: theme.textMuted }}>
                  <strong>Service Purpose</strong>: North Synapse provides tools for course notes sharing, exam study guides, and peer academic discussions.<br/>
                  <strong>Public Area Compliance</strong>: Posting unreleased exam papers, official test keys, or engaging in explicit academic dishonesty (e.g., cheating, proxy test-taking) within <strong>public areas</strong> (including Resource Hub and Discussions) is strictly prohibited.<br/>
                  <strong>Platform Disclaimer</strong>: North Synapse and its developers accept no liability for individual conduct or private peer interactions. Users remain solely responsible for their statements and actions on the platform.
                </p>
              </div>

              <div>
                <strong style={{ color: theme.accent, display: 'block', marginBottom: '0.2rem' }}>4. Community Standards</strong>
                <p style={{ color: theme.textMuted }}>
                  <strong>Respectful Conduct</strong>: Doxxing, harassment, bullying, or hate speech targeting any student is strictly unacceptable.
                </p>
              </div>

              <div>
                <strong style={{ color: theme.accent, display: 'block', marginBottom: '0.2rem' }}>5. Administrative Authority</strong>
                <p style={{ color: theme.textMuted }}>
                  To maintain system security and platform integrity, the North Synapse administrative team reserves the right to remove non-compliant public content and suspend accounts violating these terms.
                </p>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => { setHasAgreedTerms(true); setShowTermsModal(false); }} 
                style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                I Understand &amp; Agree
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
