'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Supabase 初始化
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rxnlrcfe.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_9aHZdWEJ6TMseemR9mQFjQ_b0ZgJoiW';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

type NavTab = 'resources' | 'lounges' | 'discussions' | 'profile';

interface Profile {
  id: string;
  username: string;
  nickname: string;
  grade_level: string;
  gender?: string;
}

interface ResourceItem {
  id: string;
  title: string;
  course_code: string;
  resource_type: string;
  author: string;
  created_at: string;
}

interface DiscussionPost {
  id: string;
  title: string;
  category: string;
  author: string;
  created_at: string;
}

// 神经网络 Logo Icon
const SynapseLogo = ({ color = '#8B5CF6', size = 38 }: { color?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M75 25 C60 10, 35 10, 25 25 C15 40, 25 50, 50 50 C75 50, 85 60, 75 75 C65 90, 40 90, 25 75"
      stroke={color}
      strokeWidth="5"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M25 25 L50 50 L75 25 M25 75 L50 50 L75 75 M35 15 L65 35 M35 65 L65 85"
      stroke={color}
      strokeWidth="2.5"
      strokeOpacity="0.8"
      strokeDasharray="3 3"
      fill="none"
    />
    <circle cx="25" cy="25" r="5" fill={color} />
    <circle cx="75" cy="25" r="5" fill={color} />
    <circle cx="50" cy="50" r="5.5" fill={color} />
    <circle cx="25" cy="75" r="5" fill={color} />
    <circle cx="75" cy="75" r="5" fill={color} />
    <circle cx="35" cy="15" r="3.5" fill={color} />
    <circle cx="65" cy="35" r="3.5" fill={color} />
    <circle cx="35" cy="65" r="3.5" fill={color} />
    <circle cx="65" cy="85" r="3.5" fill={color} />
  </svg>
);

export default function Home() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState<NavTab>('resources');

  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [discussions, setDiscussions] = useState<DiscussionPost[]>([]);

  // Auth & Profile States
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  
  // Auth Form State
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isStudentConfirmed, setIsStudentConfirmed] = useState(false);

  // Profile Setup Form State
  const [formUsername, setFormUsername] = useState('');
  const [formNickname, setFormNickname] = useState('');
  const [formGrade, setFormGrade] = useState('Grade 12');
  const [formGender, setFormGender] = useState('Prefer not to say');

  useEffect(() => {
    fetchData();

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) fetchUserProfile(user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchUserProfile(currentUser.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchData() {
    const { data: resData } = await supabase.from('resources').select('*').order('created_at', { ascending: false });
    const { data: discData } = await supabase.from('discussions').select('*').order('created_at', { ascending: false });
    if (resData) setResources(resData);
    if (discData) setDiscussions(discData);
  }

  async function fetchUserProfile(userId: string) {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) {
      setProfile(data);
      setFormUsername(data.username || '');
      setFormNickname(data.nickname || '');
      setFormGrade(data.grade_level || 'Grade 12');
      setFormGender(data.gender || 'Prefer not to say');
    } else if (error && error.code === 'PGRST116') {
      setShowProfileSetup(true);
    }
  }

  // 注册或登录提交
  async function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSignUp) {
      if (!isStudentConfirmed) {
        alert('Please confirm that you are an NTCI student or alumni to register.');
        return;
      }

      const { error } = await supabase.auth.signUp({
        email: authEmail,
        password: authPassword,
      });
      if (error) {
        alert('SignUp Failed: ' + error.message);
      } else {
        alert('注册成功！验证邮件已发送到你的邮箱，请前往邮箱点击验证链接后再登录！');
        setShowAuthModal(false);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: authPassword,
      });
      if (error) {
        alert('SignIn Failed: ' + error.message);
      } else {
        setShowAuthModal(false);
        setAuthPassword('');
      }
    }
  }

  // 保存 Profile 个人信息
  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    const newProfile = {
      id: user.id,
      username: formUsername.trim().toLowerCase(),
      nickname: formNickname.trim(),
      grade_level: formGrade,
      gender: formGender,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase.from('profiles').upsert(newProfile);

    if (error) {
      alert('Save Profile Failed: ' + error.message);
    } else {
      setProfile(newProfile as Profile);
      setShowProfileSetup(false);
      alert('Profile successfully saved!');
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setActiveTab('resources');
  }

  const theme = {
    bg: isDarkMode ? '#12151A' : '#F8FAFC',
    cardBg: isDarkMode ? '#1C2029' : '#FFFFFF',
    border: isDarkMode ? '#2D3342' : '#E2E8F0',
    textMain: isDarkMode ? '#F8FAFC' : '#0F172A',
    textMuted: isDarkMode ? '#94A3B8' : '#64748B',
    accent: '#8B5CF6',
  };

  return (
    <div style={{ backgroundColor: theme.bg, color: theme.textMain, minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Header 导航栏 */}
      <header style={{ borderBottom: `1px solid ${theme.border}`, position: 'sticky', top: 0, backgroundColor: theme.bg, zIndex: 10 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0.75rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }} onClick={() => setActiveTab('resources')}>
            <SynapseLogo color={theme.accent} size={38} />
            <span style={{ fontSize: '1.05rem', fontWeight: 600 }}>North Synapse</span>
          </div>

          <nav style={{ display: 'flex', gap: '2rem', fontSize: '0.95rem', fontWeight: 500 }}>
            <span onClick={() => setActiveTab('resources')} style={{ cursor: 'pointer', color: activeTab === 'resources' ? theme.accent : theme.textMuted }}>Resource Hub</span>
            <span onClick={() => setActiveTab('lounges')} style={{ cursor: 'pointer', color: activeTab === 'lounges' ? theme.accent : theme.textMuted }}>Study Lounge</span>
            <span onClick={() => setActiveTab('discussions')} style={{ cursor: 'pointer', color: activeTab === 'discussions' ? theme.accent : theme.textMuted }}>Discussions</span>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={() => setIsDarkMode(!isDarkMode)} style={{ backgroundColor: theme.cardBg, color: theme.textMain, border: `1px solid ${theme.border}`, padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
              {isDarkMode ? 'Light' : 'Dark'}
            </button>

            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span
                  onClick={() => setActiveTab('profile')}
                  style={{ fontSize: '0.85rem', fontWeight: 600, color: theme.accent, cursor: 'pointer', borderBottom: activeTab === 'profile' ? `2px solid ${theme.accent}` : 'none' }}
                >
                  @{profile?.nickname || profile?.username || user.email?.split('@')[0]}
                </span>
                <button onClick={handleSignOut} style={{ backgroundColor: 'transparent', color: theme.textMuted, border: `1px solid ${theme.border}`, padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>
                  Sign Out
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowAuthModal(true)} 
                style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.45rem 1rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section style={{ borderBottom: `1px solid ${theme.border}`, padding: '3.5rem 1.5rem', textAlign: 'center', backgroundColor: isDarkMode ? '#161A22' : '#F1F5F9' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ display: 'inline-block', backgroundColor: `${theme.accent}20`, color: theme.accent, fontSize: '0.8rem', fontWeight: 600, padding: '0.25rem 0.75rem', borderRadius: '20px', marginBottom: '1rem' }}>
            Academic Platform for NTCI
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.8rem', letterSpacing: '-0.03em' }}>
            North Synapse
          </h1>
          <p style={{ color: theme.textMuted, fontSize: '1.05rem', lineHeight: '1.6', margin: '0 auto' }}>
            A centralized workspace for verified course resources, virtual study rooms, and academic peer discussions.
          </p>
        </div>
      </section>

      {/* Main Container */}
      <main style={{ maxWidth: '1100px', margin: '2.5rem auto', padding: '0 1.5rem' }}>
        
        {/* RESOURCE HUB */}
        {activeTab === 'resources' && (
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1rem' }}>Resource Hub</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {resources.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: theme.cardBg, borderRadius: '8px', border: `1px solid ${theme.border}` }}>
                  <p style={{ color: theme.textMuted }}>No resources available yet.</p>
                </div>
              ) : (
                resources.map((res) => (
                  <div key={res.id} style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '8px', padding: '1.25rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: theme.accent }}>{res.course_code}</span>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginTop: '0.2rem' }}>{res.title}</h3>
                    <p style={{ fontSize: '0.8rem', color: theme.textMuted, marginTop: '0.4rem' }}>Uploaded by @{res.author}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* STUDY LOUNGE TAB */}
        {activeTab === 'lounges' && (
          <div style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>NTCI General Study Lounge</h3>
            <p style={{ fontSize: '0.95rem', color: theme.textMuted, marginBottom: '1.5rem' }}>Open focus room for study sessions.</p>
            <button onClick={() => alert('Entering room...')} style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.6rem 1.4rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
              Enter Lounge
            </button>
          </div>
        )}

        {/* DISCUSSIONS TAB */}
        {activeTab === 'discussions' && (
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1rem' }}>Academic Discussions</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {discussions.map((post) => (
                <div key={post.id} style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '8px', padding: '1.25rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: theme.accent }}>{post.category}</span>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginTop: '0.3rem' }}>{post.title}</h3>
                  <span style={{ fontSize: '0.8rem', color: theme.textMuted }}>Asked by @{post.author}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PROFILE TAB (个人资料页面) */}
        {activeTab === 'profile' && user && (
          <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>My Student Profile</h2>
              <button onClick={() => setShowProfileSetup(true)} style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.4rem 0.9rem', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
                Edit Profile
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', fontSize: '0.95rem' }}>
              <div style={{ borderBottom: `1px solid ${theme.border}`, paddingBottom: '0.8rem' }}>
                <span style={{ color: theme.textMuted, fontSize: '0.85rem', display: 'block' }}>Email Address</span>
                <strong>{user.email}</strong>
              </div>
              <div style={{ borderBottom: `1px solid ${theme.border}`, paddingBottom: '0.8rem' }}>
                <span style={{ color: theme.textMuted, fontSize: '0.85rem', display: 'block' }}>Username</span>
                <strong>@{profile?.username || 'Not set'}</strong>
              </div>
              <div style={{ borderBottom: `1px solid ${theme.border}`, paddingBottom: '0.8rem' }}>
                <span style={{ color: theme.textMuted, fontSize: '0.85rem', display: 'block' }}>Display Nickname</span>
                <strong>{profile?.nickname || 'Not set'}</strong>
              </div>
              <div style={{ borderBottom: `1px solid ${theme.border}`, paddingBottom: '0.8rem' }}>
                <span style={{ color: theme.textMuted, fontSize: '0.85rem', display: 'block' }}>Grade / Status</span>
                <strong>{profile?.grade_level || 'Not set'}</strong>
              </div>
              <div>
                <span style={{ color: theme.textMuted, fontSize: '0.85rem', display: 'block' }}>Gender</span>
                <strong>{profile?.gender || 'Prefer not to say'}</strong>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Auth Modal (登录/注册弹窗) */}
      {showAuthModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999999 }}>
          <div style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '2rem', width: '90%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{isSignUp ? 'Sign Up' : 'Sign In'}</h2>
              <button onClick={() => setShowAuthModal(false)} style={{ background: 'none', border: 'none', color: theme.textMuted, fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>
            
            <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: theme.textMuted, marginBottom: '0.3rem' }}>Email</label>
                <input 
                  type="email" 
                  required 
                  placeholder="your.email@example.com" 
                  value={authEmail} 
                  onChange={(e) => setAuthEmail(e.target.value)} 
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain, boxSizing: 'border-box' }} 
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
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain, boxSizing: 'border-box' }} 
                />
              </div>

              {/* 仅在注册模式下显示的身份承诺勾选框 */}
              {isSignUp && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginTop: '0.2rem' }}>
                  <input
                    type="checkbox"
                    id="studentConfirm"
                    required
                    checked={isStudentConfirmed}
                    onChange={(e) => setIsStudentConfirmed(e.target.checked)}
                    style={{ marginTop: '0.2rem', cursor: 'pointer' }}
                  />
                  <label htmlFor="studentConfirm" style={{ fontSize: '0.8rem', color: theme.textMuted, lineHeight: '1.4', cursor: 'pointer' }}>
                    I confirm that I am a current student or alumni of NTCI, and I agree to uphold academic integrity.
                  </label>
                </div>
              )}

              <button 
                type="submit" 
                disabled={isSignUp && !isStudentConfirmed}
                style={{ 
                  backgroundColor: (isSignUp && !isStudentConfirmed) ? '#4B5563' : theme.accent, 
                  color: '#FFF', 
                  border: 'none', 
                  padding: '0.75rem', 
                  borderRadius: '6px', 
                  fontWeight: 600, 
                  cursor: (isSignUp && !isStudentConfirmed) ? 'not-allowed' : 'pointer', 
                  marginTop: '0.5rem',
                  opacity: (isSignUp && !isStudentConfirmed) ? 0.6 : 1
                }}
              >
                {isSignUp ? 'Create Account' : 'Sign In'}
              </button>
            </form>

            <p onClick={() => { setIsSignUp(!isSignUp); setIsStudentConfirmed(false); }} style={{ color: theme.accent, marginTop: '1rem', cursor: 'pointer', textAlign: 'center', fontSize: '0.85rem' }}>
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </p>
          </div>
        </div>
      )}

      {/* Profile Setup Modal (个人档案设置弹窗) */}
      {(showProfileSetup || (user && !profile && activeTab === 'profile')) && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999999, backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '2rem', width: '90%', maxWidth: '450px' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem' }}>Setup Your Student Profile</h2>
            <p style={{ fontSize: '0.85rem', color: theme.textMuted, marginBottom: '1.5rem' }}>Set up your public identity for North Synapse.</p>

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: theme.textMuted, marginBottom: '0.3rem' }}>Username (Unique Handle)</label>
                <input type="text" required placeholder="e.g. alex_nt" value={formUsername} onChange={(e) => setFormUsername(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain, boxSizing: 'border-box' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: theme.textMuted, marginBottom: '0.3rem' }}>Display Nickname</label>
                <input type="text" required placeholder="e.g. Alex" value={formNickname} onChange={(e) => setFormNickname(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain, boxSizing: 'border-box' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: theme.textMuted, marginBottom: '0.3rem' }}>Grade / Status</label>
                <select value={formGrade} onChange={(e) => setFormGrade(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain, boxSizing: 'border-box' }}>
                  <option value="Grade 9">Grade 9</option>
                  <option value="Grade 10">Grade 10</option>
                  <option value="Grade 11">Grade 11</option>
                  <option value="Grade 12">Grade 12</option>
                  <option value="Alumni">Alumni (毕业生)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: theme.textMuted, marginBottom: '0.3rem' }}>Gender (Optional)</label>
                <select value={formGender} onChange={(e) => setFormGender(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain, boxSizing: 'border-box' }}>
                  <option value="Prefer not to say">Prefer not to say (保密)</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-binary">Non-binary</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                {profile && (
                  <button type="button" onClick={() => setShowProfileSetup(false)} style={{ flex: 1, backgroundColor: 'transparent', border: `1px solid ${theme.border}`, color: theme.textMain, padding: '0.7rem', borderRadius: '6px', cursor: 'pointer' }}>
                    Cancel
                  </button>
                )}
                <button type="submit" style={{ flex: 1, backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.7rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
