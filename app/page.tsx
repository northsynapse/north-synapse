'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rxnlrcfe.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_9aHZdWEJ6TMseemR9mQFjQ_b0ZgJoiW';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

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
      
      {/* Header 导航栏 */}
      <header style={{ borderBottom: `1px solid ${theme.border}`, position: 'relative', zIndex: 10, padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>North Synapse</div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => setIsDarkMode(!isDarkMode)} style={{ padding: '0.4rem 0.8rem', borderRadius: '6px' }}>
            {isDarkMode ? 'Light' : 'Dark'}
          </button>

          {user ? (
            <button onClick={() => supabase.auth.signOut()} style={{ padding: '0.4rem 0.8rem' }}>Sign Out</button>
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
      <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>North Synapse</h1>
        <p style={{ color: theme.textMuted, marginTop: '1rem' }}>Academic Platform for NTCI</p>
      </div>

      {/* 登录/注册 Modal */}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{isSignUp ? 'Sign Up' : 'Sign In'}</h2>
              <button onClick={() => setShowAuthModal(false)} style={{ background: 'none', border: 'none', color: theme.textMain, cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>

            <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input 
                type="email" 
                required 
                placeholder="your.email@example.com" 
                value={authEmail} 
                onChange={(e) => setAuthEmail(e.target.value)} 
                style={{ padding: '0.6rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain }} 
              />
              <input 
                type="password" 
                required 
                placeholder="••••••••" 
                value={authPassword} 
                onChange={(e) => setAuthPassword(e.target.value)} 
                style={{ padding: '0.6rem', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.textMain }} 
              />

              {isSignUp && (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <input
                    type="checkbox"
                    id="studentConfirm"
                    required
                    checked={isStudentConfirmed}
                    onChange={(e) => setIsStudentConfirmed(e.target.checked)}
                  />
                  <label htmlFor="studentConfirm" style={{ fontSize: '0.8rem', color: theme.textMuted }}>
                    I confirm that I am a current student or alumni of NTCI.
                  </label>
                </div>
              )}

              <button 
                type="submit" 
                style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.7rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                {isSignUp ? 'Create Account' : 'Sign In'}
              </button>
            </form>

            <p 
              onClick={() => { setIsSignUp(!isSignUp); setIsStudentConfirmed(false); }} 
              style={{ color: theme.accent, marginTop: '1rem', cursor: 'pointer', textAlign: 'center', fontSize: '0.85rem' }}
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
