'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// 去掉 export 关键字，解决 Next.js 页面导出类型的报错
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rxnlrcfe.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_9aHZdWEJ6TMseemR9mQFjQ_b0ZgJoiW';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

type NavTab = 'resources' | 'lounges' | 'discussions' | 'profile';

export default function Home() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState<NavTab>('resources');

  const [user, setUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isStudentConfirmed, setIsStudentConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    }).catch(() => {});

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

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

        const { data, error } = await supabase.auth.signUp({
          email: authEmail.trim(),
          password: authPassword,
        });

        if (error) {
          alert('SignUp Failed: ' + error.message);
        } else {
          alert('注册成功！');
          setShowAuthModal(false);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
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
      alert('Network/Cors Error: ' + (err.message || 'Failed to fetch'));
    } finally {
      setLoading(false);
    }
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
    <div style={{ backgroundColor: theme.bg, color: theme.textMain, minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* Header */}
      <header style={{ borderBottom: `1px solid ${theme.border}`, position: 'relative', zIndex: 10, padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: theme.accent }}></div>
          North Synapse
        </div>

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
        </nav>

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
            <button 
              onClick={() => supabase.auth.signOut()} 
              style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', backgroundColor: 'transparent', border: `1px solid ${theme.border}`, color: theme.textMain, cursor: 'pointer' }}
            >
              Sign Out
            </button>
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

      {/* Hero */}
      <div style={{ padding: '3rem 2rem 1rem 2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 'bold' }}>North Synapse</h1>
        <p style={{ color: theme.textMuted, marginTop: '0.5rem' }}>A centralized workspace for verified course resources, virtual study rooms, and academic peer discussions.</p>
      </div>

      {/* Main Content */}
      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
        {activeTab === 'resources' && (
          <div style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '2rem', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Resource Hub</h2>
            <p style={{ color: theme.textMuted }}>No resources available yet.</p>
          </div>
        )}

        {activeTab === 'lounges' && (
          <div style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '2rem', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Study Lounges</h2>
            <p style={{ color: theme.textMuted }}>Virtual study spaces coming soon.</p>
          </div>
        )}

        {activeTab === 'discussions' && (
          <div style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '2rem', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Discussions</h2>
            <p style={{ color: theme.textMuted }}>Academic discussion board coming soon.</p>
          </div>
        )}
      </main>

      {/* Auth Modal */}
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
                  <input
                    type="checkbox"
                    id="studentConfirm"
                    required
                    checked={isStudentConfirmed}
                    onChange={(e) => setIsStudentConfirmed(e.target.checked)}
                    style={{ marginTop: '0.2rem' }}
                  />
                  <label htmlFor="studentConfirm" style={{ fontSize: '0.8rem', color: theme.textMuted, lineHeight: '1.3' }}>
                    I confirm that I am a current student or alumni of NTCI, and I agree to uphold academic integrity.
                  </label>
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.7rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', opacity: loading ? 0.6 : 1, marginTop: '0.5rem' }}
              >
                {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
              </button>
            </form>

            <p 
              onClick={() => { setIsSignUp(!isSignUp); setIsStudentConfirmed(false); }} 
              style={{ color: theme.accent, marginTop: '1.2rem', cursor: 'pointer', textAlign: 'center', fontSize: '0.85rem' }}
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
