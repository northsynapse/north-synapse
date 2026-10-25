'use client';

import React, { useState, useMemo } from 'react';

// ==========================================
// SECTION 1: 类型与接口定义 (TYPES & INTERFACES)
// ==========================================
export interface Author {
  id: string;
  name: string;
  avatar: string;
  institution: string;
  hIndex: number;
  orcid: string;
}

export interface Resource {
  id: string;
  title: string;
  abstract: string;
  author: Author;
  coAuthors: string[];
  category: string;
  tags: string[];
  rating: number;
  downloads: number;
  views: number;
  likes: number;
  publishedAt: string;
  doi: string;
  isPeerReviewed: boolean;
  citationCount: number;
  pdfUrl: string;
  fullText: string;
}

export interface Discussion {
  id: string;
  resourceId: string;
  user: string;
  avatar: string;
  comment: string;
  createdAt: string;
  likes: number;
}

export interface PlatformStat {
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
}

// ==========================================
// SECTION 2: 模拟数据与初始状态 (MOCK DATA & INITIAL STATE)
// ==========================================
const MOCK_AUTHORS: Author[] = [
  { 
    id: 'a1', 
    name: 'Dr. Elena Rostova', 
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150', 
    institution: 'MIT Neuroscience Institute', 
    hIndex: 34,
    orcid: '0000-0002-1825-0097'
  },
  { 
    id: 'a2', 
    name: 'Prof. Marcus Vance', 
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150', 
    institution: 'Stanford Quantum Center', 
    hIndex: 42,
    orcid: '0000-0001-9014-4321'
  },
  { 
    id: 'a3', 
    name: 'Dr. Sarah Lin', 
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150', 
    institution: 'Harvard Genomic Lab', 
    hIndex: 29,
    orcid: '0000-0003-1120-8834'
  },
  { 
    id: 'a4', 
    name: 'Dr. Alex Chen', 
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150', 
    institution: 'ETH Zürich AI Lab', 
    hIndex: 38,
    orcid: '0000-0002-4411-9022'
  }
];

const MOCK_RESOURCES: Resource[] = [
  {
    id: 'res-001',
    title: 'Advanced Machine Learning Paradigms in Neuroscience',
    abstract: 'A comprehensive study on neural network architectures modeled after synaptic plasticity, exploring how biological dynamics optimize backpropagation in artificial intelligence models. Our empirical evaluation reveals a 34% speedup in convergence rates on large-scale neuroimaging datasets.',
    author: MOCK_AUTHORS[0],
    coAuthors: ['Prof. Alan Turing Jr.', 'Dr. Sophia Martinez'],
    category: 'Computer Science',
    tags: ['Machine Learning', 'Neuroscience', 'Synaptic Plasticity', 'Deep Learning'],
    rating: 4.9,
    downloads: 1240,
    views: 4320,
    likes: 312,
    publishedAt: '2026-01-15',
    doi: '10.1038/s41586-026-0812-x',
    isPeerReviewed: true,
    citationCount: 142,
    pdfUrl: '#',
    fullText: `1. INTRODUCTION\nBiological neural networks exhibit remarkable energy efficiency...\n\n2. SYNAPTIC PLASTICITY MODELING\nWe present the Synapse-Net framework...\n\n3. EXPERIMENTAL RESULTS\nAcross six standardized benchmarks...`
  },
  {
    id: 'res-002',
    title: 'Quantum Information Systems: Core Principles & Fault-Tolerant Architectures',
    abstract: 'Foundational framework for quantum state manipulation and algorithmic execution across topological qubit architectures with fault-tolerant error suppression using surface code syndromes.',
    author: MOCK_AUTHORS[1],
    coAuthors: ['Dr. Hiroshi Tanaka', 'Prof. Elizabeth Warren'],
    category: 'Physics',
    tags: ['Quantum Computing', 'Topological Physics', 'Qubits', 'Information Theory'],
    rating: 4.8,
    downloads: 980,
    views: 3100,
    likes: 245,
    publishedAt: '2026-02-01',
    doi: '10.1103/PhysRevX.2026.041002',
    isPeerReviewed: true,
    citationCount: 89,
    pdfUrl: '#',
    fullText: `1. OVERVIEW\nScalable quantum computation requires logical qubits...\n\n2. FAULT-TOLERANT PROTOCOLS\nThis paper formulates a 2D surface code lattice design...`
  }
];

const INITIAL_DISCUSSIONS: Discussion[] = [
  { id: 'd1', resourceId: 'res-001', user: 'Prof. David K.', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100', comment: 'The synaptic decay rate formula in Equation 4 shows surprising alignment with empirical EEG recordings.', createdAt: '2 hours ago', likes: 14 },
  { id: 'd2', resourceId: 'res-001', user: 'Li Wei, Ph.D.', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=100', comment: 'Has anyone attempted replicating the PyTorch implementation on distributed GPU clusters?', createdAt: '5 hours ago', likes: 8 }
];

const PLATFORM_STATS: PlatformStat[] = [
  { label: 'Indexed Publications', value: '128,450', change: '+12% this month', isPositive: true },
  { label: 'Verified Researchers', value: '45,210', change: '+8% this month', isPositive: true },
  { label: 'Node Reliability', value: '99.98%', change: 'Uptime optimal', isPositive: true },
  { label: 'Monthly Citations', value: '2,410,000', change: '+24% YoY', isPositive: true }
];

// ==========================================
// SECTION 3: 内联 SVG 图标与搜索组件
// ==========================================
function SearchBar({ 
  query, 
  onSearchChange,
  selectedCategory,
  onCategoryChange 
}: { 
  query: string; 
  onSearchChange: (q: string) => void;
  selectedCategory: string;
  onCategoryChange: (c: string) => void;
}) {
  const categories = ['All', 'Computer Science', 'Physics', 'Biology', 'Medicine', 'Mathematics'];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      <div className="relative w-full">
        <input
          type="text"
          value={query}
          placeholder="搜索学术论文、DOI、研究员或知识图谱..."
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full px-6 py-4 pl-14 pr-12 rounded-2xl bg-slate-900/90 border border-slate-700/80 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-xl transition-all shadow-2xl text-base"
        />
        <svg className="absolute left-5 top-5 w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      <div className="flex items-center justify-center gap-2 flex-wrap pt-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onCategoryChange(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              selectedCategory === cat
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 font-semibold'
                : 'bg-slate-900/70 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// SECTION 4: 功能卡片组件
// ==========================================
function ResourceCard({ 
  resource, 
  onSelect 
}: { 
  resource: Resource; 
  onSelect: (r: Resource) => void;
}) {
  return (
    <div 
      onClick={() => onSelect(resource)}
      className="group bg-slate-900/70 border border-slate-800/80 hover:border-purple-500/60 rounded-2xl p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10 flex flex-col justify-between backdrop-blur-md cursor-pointer relative overflow-hidden"
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-950/90 text-purple-300 border border-purple-800/60">
            {resource.category}
          </span>
          <span className="text-amber-400 text-xs font-semibold">★ {resource.rating.toFixed(1)}</span>
        </div>

        <h3 className="text-lg font-bold text-slate-100 mb-2 group-hover:text-purple-300 transition-colors line-clamp-2">
          {resource.title}
        </h3>

        <p className="text-slate-400 text-xs leading-relaxed mb-4 line-clamp-3">
          {resource.abstract}
        </p>
      </div>

      <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
        <span className="text-slate-300">{resource.author.name}</span>
        <span>{resource.downloads} 次下载</span>
      </div>
    </div>
  );
}

// ==========================================
// SECTION 5: HERO 横幅与平台数据
// ==========================================
function HeroSection({ 
  query, 
  onSearchChange, 
  selectedCategory, 
  onCategoryChange 
}: { 
  query: string; 
  onSearchChange: (q: string) => void; 
  selectedCategory: string; 
  onCategoryChange: (c: string) => void; 
}) {
  return (
    <section className="relative pt-28 pb-20 px-4 text-center overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight mb-8 leading-tight">
          连接智慧，汇聚于 <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-300 to-purple-200">North Synapse</span>
        </h1>
        
        <p className="text-base sm:text-lg text-slate-300 mb-12 max-w-3xl mx-auto font-light leading-relaxed">
          探索同行评审论文，实时进行跨学科算法演练，消除学术壁垒，加速全球科学研究的突破进程。
        </p>

        <SearchBar 
          query={query} 
          onSearchChange={onSearchChange} 
          selectedCategory={selectedCategory} 
          onCategoryChange={onCategoryChange} 
        />
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 pt-12 border-t border-slate-800/60">
        {PLATFORM_STATS.map((stat) => (
          <div key={stat.label} className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/50">
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-xs text-slate-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ==========================================
// SECTION 6: 导航栏与纯代码 SVG Logo
// ==========================================
function Header() {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3 cursor-pointer">
          {/* 纯 SVG 代码绘制的紫色 S 型双螺旋/突触 Logo */}
          <svg 
            width="36" 
            height="42" 
            viewBox="0 0 100 115" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-[0_0_10px_rgba(167,139,250,0.5)]"
          >
            <path
              d="M 75,20 C 75,8 25,8 25,35 C 25,62 75,62 75,88 C 75,102 25,102 25,90"
              stroke="#A78BFA"
              strokeWidth="7"
              strokeLinecap="round"
              fill="none"
            />
            <line x1="38" y1="20" x2="62" y2="30" stroke="#A78BFA" strokeWidth="4" strokeDasharray="2 4" strokeLinecap="round" />
            <line x1="30" y1="28" x2="55" y2="38" stroke="#A78BFA" strokeWidth="4" strokeDasharray="2 4" strokeLinecap="round" />
            <line x1="26" y1="38" x2="48" y2="46" stroke="#A78BFA" strokeWidth="4" strokeDasharray="2 4" strokeLinecap="round" />
            <line x1="52" y1="64" x2="74" y2="72" stroke="#A78BFA" strokeWidth="4" strokeDasharray="2 4" strokeLinecap="round" />
            <line x1="45" y1="72" x2="70" y2="82" stroke="#A78BFA" strokeWidth="4" strokeDasharray="2 4" strokeLinecap="round" />
            <line x1="38" y1="80" x2="62" y2="90" stroke="#A78BFA" strokeWidth="4" strokeDasharray="2 4" strokeLinecap="round" />
            <circle cx="75" cy="20" r="4.5" fill="#A78BFA" />
            <circle cx="25" cy="35" r="4.5" fill="#A78BFA" />
            <circle cx="75" cy="88" r="4.5" fill="#A78BFA" />
            <circle cx="25" cy="90" r="4.5" fill="#A78BFA" />
          </svg>
          <span className="text-xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-purple-200 bg-clip-text text-transparent">
            North Synapse
          </span>
        </div>

        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
          <a href="#discover" className="hover:text-purple-400 transition-colors">发现论文</a>
          <a href="#publications" className="hover:text-purple-400 transition-colors">学术出版</a>
          <a href="#network" className="hover:text-purple-400 transition-colors">学者网络</a>
          <a href="#about" className="hover:text-purple-400 transition-colors">关于我们</a>
        </nav>

        <div className="hidden md:flex items-center space-x-4">
          <button className="text-sm font-medium text-slate-300 hover:text-white px-3 py-2">登录</button>
          <button className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium px-5 py-2.5 rounded-xl font-semibold">免费注册</button>
        </div>
      </div>
    </header>
  );
}

// ==========================================
// SECTION 7: 主页面入口与页脚
// ==========================================
export default function Page() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

  const filteredResources = useMemo(() => {
    return MOCK_RESOURCES.filter((res) => {
      const matchesCategory = selectedCategory === 'All' || res.category === selectedCategory;
      const matchesQuery = !searchQuery.trim() || 
        res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        res.abstract.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header />
      
      <main className="flex-1">
        <HeroSection 
          query={searchQuery} 
          onSearchChange={setSearchQuery} 
          selectedCategory={selectedCategory} 
          onCategoryChange={setSelectedCategory} 
        />

        <section id="discover" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-3xl font-bold text-white mb-8">精选出版物 (Featured Publications)</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredResources.map((res) => (
              <ResourceCard 
                key={res.id} 
                resource={res} 
                onSelect={(r) => setSelectedResource(r)}
              />
            ))}
          </div>
        </section>
      </main>

      <footer className="bg-slate-950 border-t border-slate-800/80 py-12 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} North Synapse Open Science. All rights reserved.</p>
      </footer>
    </div>
  );
}
