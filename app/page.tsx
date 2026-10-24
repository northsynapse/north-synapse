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

type NavTab = 'resources' | 'lounges' | 'discussions' | 'dashboard';

export default function Home() {
  /* ==========================================================================
     2. GLOBAL & COMPONENT STATES
     ========================================================================== */
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState<NavTab>('resources');

  const [user, setUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  
  // Auth Form State
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isStudentConfirmed, setIsStudentConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  // Profile Form State
  const [avatarUrl, setAvatarUrl] = useState('');
  const [username, setUsername] = useState('');
  const [nickname, setNickname] = useState('');
  const [grade, setGrade] = useState('');
  const [gender, setGender] = useState('');
  const [bio, setBio] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // File Input Ref for Avatar Upload
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /* ==========================================================================
     3. AUTHENTICATION & SESSION EFFECT
     ========================================================================== */
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user?.user_metadata) {
        setAvatarUrl(user.user_metadata.avatar_url || '');
        setUsername(user.user_metadata.username || '');
        setNickname(user.user_metadata.nickname || '');
        setGrade(user.user_metadata.grade || '');
        setGender(user.user_metadata.gender || '');
        setBio(user.user_metadata.bio || '');
      }
    }).catch(() => {});

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser?.user_metadata) {
        setAvatarUrl(currentUser.user_metadata.avatar_url || '');
        setUsername(currentUser.user_metadata.username || '');
        setNickname(currentUser.user_metadata.nickname || '');
        setGrade(currentUser.user_metadata.grade || '');
        setGender(currentUser.user_metadata.gender || '');
        setBio(currentUser.user_metadata.bio || '');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  /* ==========================================================================
     4. HANDLERS (AVATAR, AUTH, PROFILE, ACCOUNT DELETION)
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

  async function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        if (!isStudentConfirmed) {
          alert('Please confirm that you are an NTCI student or alumni to register.');
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
    const confirmDelete = window.confirm('Are you sure you want to delete your profile and sign out? This action cannot be undone.');
    if (!confirmDelete) return;

    try {
      await supabase.auth.signOut();
      setUser(null);
      setShowEditProfileModal(false);
      setActiveTab('resources');
      alert('Account signed out successfully.');
    } catch (err: any) {
      alert('Error during sign out: ' + err.message);
    }
  }

  /* ==========================================================================
     5. THEME DEFINITION
     ========================================================================== */
  const theme = {
    bg: isDarkMode ? '#12151A' : '#F8FAFC',
    cardBg: isDarkMode ? '#1C2029' : '#FFFFFF',
    border: isDarkMode ? '#2D3342' : '#E2E8F0',
    textMain: isDarkMode ? '#F8FAFC' : '#0F172A',
    textMuted: isDarkMode ? '#94A3B8' : '#64748B',
    accent: '#8B5CF6',
  };

  return (
    <div style={{ backgroundColor: theme.bg, color: theme.textMain, minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* ===================================================================
          6. HEADER & NAVIGATION (LOGO LOCATION HERE)
          =================================================================== */}
      <header style={{ borderBottom: `1px solid ${theme.border}`, position: 'relative', zIndex: 10, padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        
        {/* --- BRAND LOGO --- */}
        <div 
          onClick={() => setActiveTab('resources')} 
          style={{ fontSize: '1.25rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.7rem', cursor: 'pointer', letterSpacing: '-0.02em' }}
        >
          {/* Square NS Icon Badge */}
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: theme.accent,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFF',
            fontSize: '1rem',
            fontWeight: '900',
            boxShadow: '0 2px 8px rgba(139, 92, 246, 0.4)'
          }}>
            NS
          </div>
          <span style={{ color: theme.textMain }}>North<span style={{ color: theme.accent }}>Synapse</span></span>
        </div>

        {/* --- NAVIGATION TABS --- */}
        <nav style={{ display: 'flex', gap: '1.5rem' }}>
          {(['resources', 'lounges', 'discussions'] as NavTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: 'none',
                border: 'none',
                color: activeTab === tab ? theme.accent : theme.textMuted,
                fontWeight: activeTab === tab ? 'bold' : 'normal',
                cursor: 'pointer',
                textTransform: 'capitalize',
                paddingBottom: '0.2rem',
                borderBottom: activeTab === tab ? `2px solid ${theme.accent}` : 'none'
              }}
            >
              {tab === 'resources' ? 'Resource Hub' : tab === 'lounges' ? 'Study Lounges' : 'Discussions'}
            </button>
          ))}
          {user && (
            <button
              onClick={() => setActiveTab('dashboard')}
              style={{
                background: 'none',
                border: 'none',
                color: activeTab === 'dashboard' ? theme.accent : theme.textMuted,
                fontWeight: activeTab === 'dashboard' ? 'bold' : 'normal',
                cursor: 'pointer',
                paddingBottom: '0.2rem',
                borderBottom: activeTab === 'dashboard' ? `2px solid ${theme.accent}` : 'none'
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
              padding: '0.4rem 0.8rem', 
              borderRadius: '6px', 
              border: `1px solid ${theme.border}`, 
              backgroundColor: theme.cardBg, 
              color: theme.textMain, 
              cursor: 'pointer' 
            }}
          >
            {isDarkMode ? 'Light' : 'Dark'}
          </button>

          {user ? (
            <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
              <div 
                onClick={() => setActiveTab('dashboard')} 
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: theme.accent,
                  backgroundImage: avatarUrl ? `url(${avatarUrl})` : 'none',
                  backgroundSize: 'cover',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '0.8rem',
                  color: '#FFF'
                }}>
                  {!avatarUrl && (nickname ? nickname[0].toUpperCase() : 'U')}
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{nickname || 'User'}</span>
              </div>
              <button 
                onClick={() => supabase.auth.signOut()} 
                style={{ padding: '0.3rem 0.6rem', borderRadius: '6px', backgroundColor: 'transparent', border: `1px solid ${theme.border}`, color: theme.textMuted, cursor: 'pointer', fontSize: '0.8rem' }}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button 
              type="button"
              onClick={() => setShowAuthModal(true)} 
              style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.5rem 1.2rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* ===================================================================
          7. MAIN CONTENT AREA (TABS ROUTING)
          =================================================================== */}
      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
        
        {/* --- RESOURCE HUB TAB --- */}
        {activeTab === 'resources' && (
          <div style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '2rem', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Resource Hub</h2>
            <p style={{ color: theme.textMuted }}>No resources available yet.</p>
          </div>
        )}

        {/* --- STUDY LOUNGES TAB --- */}
        {activeTab === 'lounges' && (
          <div style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '2rem', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Study Lounges</h2>
            <p style={{ color: theme.textMuted }}>Virtual study spaces coming soon.</p>
          </div>
        )}

        {/* --- DISCUSSIONS TAB --- */}
        {activeTab === 'discussions' && (
          <div style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '2rem', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Discussions</h2>
            <p style={{ color: theme.textMuted }}>Academic discussion board coming soon.</p>
          </div>
        )}

        {/* --- USER DASHBOARD TAB (READ ONLY) --- */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* User Overview Profile Card */}
            <div style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '2rem', display: 'flex', gap: '2rem', alignItems: 'center' }}>
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
                <h1 style={{ fontSize: '1.6rem', fontWeight: 'bold' }}>{nickname || 'Anonymous Student'}</h1>
                <p style={{ color: theme.textMuted, fontSize: '0.9rem', marginTop: '0.2rem' }}>@{username || 'username'} • {grade || 'Grade Not Set'} • {gender || 'Gender Not Specified'}</p>
                <p style={{ marginTop: '0.6rem', fontSize: '0.85rem' }}>{bio || 'No bio written yet.'}</p>
              </div>
            </div>

            {/* User Activity Grid */}
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
          9. AUTHENTICATION MODAL (SIGN IN / SIGN UP)
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
          <div style={{ backgroundColor: theme.cardBg, padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '400px', border: `1px solid ${theme.border}` }}>
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
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
