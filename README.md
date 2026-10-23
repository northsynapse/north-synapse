'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// 直接填入你的真实 Supabase Key 与 URL，彻底解决环境变量找不到的问题
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rxnlrcfe.supabase.co'; // 如果你的 URL 格式不同，可在引号中更改
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_9aHZdWEJ6TMseemR9mQFjQ_b0ZgJoiW';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

type NavTab = 'resources' | 'lounges' | 'discussions';

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
  content: string;
  author: string;
  replies_count: number;
  is_solved: boolean;
  created_at: string;
}

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

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const FolderEmptyIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
    <line x1="9" y1="14" x2="15" y2="14"></line>
  </svg>
);

const MessageEmptyIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
  </svg>
);

export default function Home() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState<NavTab>('resources');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string>('ALL');

  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [discussions, setDiscussions] = useState<DiscussionPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data: resData } = await supabase.from('resources').select('*').order('created_at', { ascending: false });
    const { data: discData } = await supabase.from('discussions').select('*').order('created_at', { ascending: false });
    
    if (resData) setResources(resData);
    if (discData) setDiscussions(discData);
    setLoading(false);
  }

  async function handleAddResource() {
    const title = prompt('Enter resource title (e.g. Grade 12 Calculus Chapter 1 Notes):');
    if (!title) return;
    const course = prompt('Enter course code (e.g. MCV4U, ICS4U, SPH4U):', 'MCV4U') || 'MCV4U';

    const { error } = await supabase.from('resources').insert([
      { title, course_code: course.toUpperCase(), resource_type: 'Class Notes', author: 'NT Student' }
    ]);

    if (error) {
      alert('Failed to upload: ' + error.message);
    } else {
      fetchData();
    }
  }

  async function handleAddDiscussion() {
    const title = prompt('Enter topic title (e.g. Tips for Euclid Contest preparation?):');
    if (!title) return;
    const category = prompt('Enter category (Course Advice / Contest / OUAC / General):', 'Course Advice') || 'General';

    const { error } = await supabase.from('discussions').insert([
      { title, category, content: '', author: 'NT Student' }
    ]);

    if (error) {
      alert('Failed to post: ' + error.message);
    } else {
      fetchData();
    }
  }

  const filteredResources = resources.filter(item => {
    const matchesCourse = selectedCourse === 'ALL' || item.course_code === selectedCourse;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || item.course_code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCourse && matchesSearch;
  });

  const theme = {
    bg: isDarkMode ? '#12151A' : '#F8FAFC',
    cardBg: isDarkMode ? '#1C2029' : '#FFFFFF',
    border: isDarkMode ? '#2D3342' : '#E2E8F0',
    textMain: isDarkMode ? '#F8FAFC' : '#0F172A',
    textMuted: isDarkMode ? '#94A3B8' : '#64748B',
    accent: '#8B5CF6',
  };

  return (
    <div style={{ backgroundColor: theme.bg, color: theme.textMain, minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif', transition: 'all 0.25s ease' }}>
      
      {/* Header */}
      <header style={{ borderBottom: `1px solid ${theme.border}`, position: 'sticky', top: 0, backgroundColor: theme.bg, zIndex: 10, backdropFilter: 'blur(8px)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0.75rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }} onClick={() => setActiveTab('resources')}>
            <SynapseLogo color={theme.accent} size={38} />
            <span style={{ fontSize: '1.05rem', fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1 }}>
              North Synapse
            </span>
          </div>

          <nav style={{ display: 'flex', gap: '2rem', fontSize: '0.95rem', fontWeight: 500 }}>
            {[
              { key: 'resources', label: 'Resource Hub' },
              { key: 'lounges', label: 'Study Lounge' },
              { key: 'discussions', label: 'Discussions' },
            ].map((tab) => (
              <span
                key={tab.key}
                onClick={() => setActiveTab(tab.key as NavTab)}
                style={{
                  cursor: 'pointer',
                  color: activeTab === tab.key ? theme.accent : theme.textMuted,
                  borderBottom: activeTab === tab.key ? `2px solid ${theme.accent}` : '2px solid transparent',
                  paddingBottom: '0.25rem',
                  transition: 'all 0.2s',
                }}
              >
                {tab.label}
              </span>
            ))}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              style={{
                backgroundColor: theme.cardBg,
                color: theme.textMain,
                border: `1px solid ${theme.border}`,
                padding: '0.4rem 0.8rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.85rem',
              }}
            >
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
            <button
              style={{
                backgroundColor: theme.accent,
                color: '#FFFFFF',
                border: 'none',
                padding: '0.45rem 1rem',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.85rem',
              }}
            >
              Sign In
            </button>
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
        
        {/* RESOURCE HUB TAB */}
        {activeTab === 'resources' && (
          <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
                <input
                  type="text"
                  placeholder="Search notes, exam prep, course codes (e.g. ICS4U, SPH4U)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: theme.cardBg,
                    color: theme.textMain,
                    border: `1px solid ${theme.border}`,
                    padding: '0.75rem 1rem 0.75rem 2.5rem',
                    borderRadius: '8px',
                    outline: 'none',
                  }}
                />
                <div style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: theme.textMuted }}>
                  <SearchIcon />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {['ALL', 'ICS4U', 'SPH4U', 'MCV4U', 'SCH4U'].map((code) => (
                  <button
                    key={code}
                    onClick={() => setSelectedCourse(code)}
                    style={{
                      backgroundColor: selectedCourse === code ? theme.accent : theme.cardBg,
                      color: selectedCourse === code ? '#FFF' : theme.textMuted,
                      border: `1px solid ${selectedCourse === code ? theme.accent : theme.border}`,
                      padding: '0.5rem 0.9rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 500,
                    }}
                  >
                    {code}
                  </button>
                ))}
              </div>
            </div>

            {/* List or Empty State */}
            {filteredResources.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 2rem', backgroundColor: theme.cardBg, borderRadius: '12px', border: `1px solid ${theme.border}` }}>
                <div style={{ color: theme.textMuted, marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
                  <FolderEmptyIcon />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>No Resources Available</h3>
                <p style={{ color: theme.textMuted, fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto 1.5rem auto' }}>
                  Be the first to share course notes or study guides for this course.
                </p>
                <button
                  onClick={handleAddResource}
                  style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.65rem 1.4rem', borderRadius: '6px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Upload Resource
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filteredResources.map((res) => (
                  <div key={res.id} style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '8px', padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: theme.accent, backgroundColor: `${theme.accent}15`, padding: '0.15rem 0.5rem', borderRadius: '4px', marginRight: '0.5rem' }}>
                        {res.course_code}
                      </span>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'inline' }}>{res.title}</h3>
                      <p style={{ fontSize: '0.8rem', color: theme.textMuted, marginTop: '0.3rem' }}>Shared by @{res.author}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STUDY LOUNGE TAB */}
        {activeTab === 'lounges' && (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Study Lounge</h2>
              <p style={{ color: theme.textMuted, fontSize: '0.9rem' }}>The central virtual study room for the NTCI community.</p>
            </div>

            <div style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#10B981', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ width: '8px', height: '8px', backgroundColor: '#10B981', borderRadius: '50%' }}></span> ONLINE ROOM
                </span>
                <span style={{ fontSize: '0.85rem', color: theme.textMuted }}>Open Focus</span>
              </div>

              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>NTCI General Study Lounge</h3>
              <p style={{ fontSize: '0.95rem', color: theme.textMuted, marginBottom: '2rem', lineHeight: '1.5' }}>Open collaborative focus space for all subjects and grade levels.</p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${theme.border}`, paddingTop: '1.25rem' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 500, color: theme.textMuted }}>
                  0 / 100 Active Students
                </span>
                <button
                  onClick={() => alert('Connecting to General Study Lounge...')}
                  style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.6rem 1.4rem', borderRadius: '6px', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}
                >
                  Enter Lounge
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DISCUSSIONS TAB */}
        {activeTab === 'discussions' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Academic Forum</h2>
                <p style={{ color: theme.textMuted, fontSize: '0.9rem' }}>Discuss courses, contest preparation, and university applications.</p>
              </div>
              <button
                onClick={handleAddDiscussion}
                style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.65rem 1.2rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
              >
                + New Topic
              </button>
            </div>

            {discussions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 2rem', backgroundColor: theme.cardBg, borderRadius: '12px', border: `1px solid ${theme.border}` }}>
                <div style={{ color: theme.textMuted, marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
                  <MessageEmptyIcon />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>No Discussion Topics Yet</h3>
                <p style={{ color: theme.textMuted, fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto 1.5rem auto' }}>
                  Start the first academic topic or ask a course question.
                </p>
                <button
                  onClick={handleAddDiscussion}
                  style={{ backgroundColor: theme.accent, color: '#FFF', border: 'none', padding: '0.65rem 1.4rem', borderRadius: '6px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Start Discussion
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {discussions.map((post) => (
                  <div key={post.id} style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '8px', padding: '1.25rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: theme.accent, backgroundColor: `${theme.accent}15`, padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                      {post.category}
                    </span>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginTop: '0.5rem', marginBottom: '0.3rem' }}>{post.title}</h3>
                    <span style={{ fontSize: '0.8rem', color: theme.textMuted }}>Asked by @{post.author}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}