'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, BookOpen, User, Star, ArrowRight, ShieldCheck, 
  Menu, X, CheckCircle, ChevronRight, MessageSquare, AlertCircle, 
  FileText, Download, Share2, Bookmark, Filter, SlidersHorizontal,
  ThumbsUp, Eye, Sparkles, Database, Code, Globe, Lock, Activity,
  Quote, Copy, Check, Send, Award, ExternalLink, RefreshCw
} from 'lucide-react';

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
    fullText: `1. INTRODUCTION
Biological neural networks exhibit remarkable energy efficiency and adaptive capacity, largely driven by synaptic plasticity mechanisms such as Spike-Timing-Dependent Plasticity (STDP). Artificial Neural Networks (ANNs), despite their recent breakthroughs, continue to rely heavily on computationally expensive backpropagation algorithms.

2. SYNAPTIC PLASTICITY MODELING
We present the Synapse-Net framework, which integrates local weight update rules inspired by biological LTP (Long-Term Potentiation) and LTD (Long-Term Depression) into gradient descent optimizers.

3. EXPERIMENTAL RESULTS
Across six standardized benchmarks (including Neuromorphic-MNIST and Connectome-3D), Synapse-Net achieved superior generalization while reducing tensor memory overhead by 28.5%.`
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
    fullText: `1. OVERVIEW
Scalable quantum computation requires logical qubits protected against environmental decoherence. Topological quantum computing leverages non-Abelian anyons to store quantum information non-locally.

2. FAULT-TOLERANT PROTOCOLS
This paper formulates a 2D surface code lattice design capable of maintaining fidelity under a physical error threshold of 1.2%. We demonstrate real-time error detection via high-speed FPGA decoders.`
  },
  {
    id: 'res-003',
    title: 'Cellular Epigenomics & Dynamic Gene Regulation Pathways',
    abstract: 'Exploring non-coding RNA mechanisms, histone modifications, and chromatin remodeling pathways in early mammalian embryonic stem cell differentiation using single-cell ATAC-seq.',
    author: MOCK_AUTHORS[2],
    coAuthors: ['Dr. Michael Chang'],
    category: 'Biology',
    tags: ['Genomics', 'Epigenetics', 'CRISPR', 'Cell Biology'],
    rating: 4.7,
    downloads: 850,
    views: 2940,
    likes: 189,
    publishedAt: '2025-11-20',
    doi: '10.1016/j.cell.2025.11.015',
    isPeerReviewed: true,
    citationCount: 67,
    pdfUrl: '#',
    fullText: `1. INTRODUCTION
Epigenetic modifications govern cell fate determination without altering the underlying DNA sequence. Recent advances in single-cell assay technologies enable high-resolution mapping of chromatin accessibility.

2. SINGLE-CELL ANALYSIS
Using scATAC-seq across 50,000 differentiating mouse embryonic stem cells, we identified 1,200 novel distal enhancer elements regulating key pluripotency transcription factors.`
  },
  {
    id: 'res-004',
    title: 'Autonomous Graph Neural Networks for Molecular Discovery',
    abstract: 'Accelerating de novo drug discovery using dynamic geometric graph neural networks that predict ligand-protein binding affinity with sub-angstrom precision without requiring explicit docking simulations.',
    author: MOCK_AUTHORS[3],
    coAuthors: ['Dr. Clara Oswald', 'Prof. David Becker'],
    category: 'Computer Science',
    tags: ['Graph Neural Networks', 'Drug Discovery', 'Bioinformatics', 'AI'],
    rating: 4.95,
    downloads: 2150,
    views: 6800,
    likes: 520,
    publishedAt: '2026-03-04',
    doi: '10.1038/s41587-026-0104-9',
    isPeerReviewed: true,
    citationCount: 210,
    pdfUrl: '#',
    fullText: `1. ABSTRACT
Small molecule generation for novel pharmacological targets remains a major bottleneck in drug development. We introduce MolGraph-3D, an equivariant message passing neural network.

2. METHODOLOGY
MolGraph-3D represents atomic coordinates as continuous 3D point clouds, applying SO(3) rotational invariance to predict free energy of binding.`
  }
];

const INITIAL_DISCUSSIONS: Discussion[] = [
  { id: 'd1', resourceId: 'res-001', user: 'Prof. David K.', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100', comment: 'The synaptic decay rate formula in Equation 4 shows surprising alignment with empirical EEG recordings.', createdAt: '2 hours ago', likes: 14 },
  { id: 'd2', resourceId: 'res-001', user: 'Li Wei, Ph.D.', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=100', comment: 'Has anyone attempted replicating the PyTorch implementation on distributed GPU clusters?', createdAt: '5 hours ago', likes: 8 },
  { id: 'd3', resourceId: 'res-002', user: 'Dr. Rebecca Miller', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=100', comment: 'Section 3.2 syndrome decoding speed looks very promising for lattice surgeries.', createdAt: '1 day ago', likes: 19 }
];

const PLATFORM_STATS: PlatformStat[] = [
  { label: 'Indexed Publications', value: '128,450', change: '+12% this month', isPositive: true },
  { label: 'Verified Researchers', value: '45,210', change: '+8% this month', isPositive: true },
  { label: 'Node Reliability', value: '99.98%', change: 'Uptime optimal', isPositive: true },
  { label: 'Monthly Citations', value: '2,410,000', change: '+24% YoY', isPositive: true }
];

// ==========================================
// SECTION 3: 基础工具组件 (UTILITY COMPONENTS)
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
          className="w-full px-6 py-4 pl-14 pr-12 rounded-2xl bg-slate-900/90 border border-slate-700/80 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-xl transition-all shadow-2xl text-base"
        />
        <Search className="absolute left-5 top-5 text-purple-400 w-5 h-5" />
        {query && (
          <button 
            onClick={() => onSearchChange('')} 
            className="absolute right-4 top-4 text-slate-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        )}
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
// SECTION 4: 功能卡片与弹窗组件 (FEATURE & CARDS COMPONENTS)
// ==========================================
function ResourceCard({ 
  resource, 
  onSelect,
  isBookmarked,
  onToggleBookmark
}: { 
  resource: Resource; 
  onSelect: (r: Resource) => void;
  isBookmarked: boolean;
  onToggleBookmark: (id: string, e: React.MouseEvent) => void;
}) {
  return (
    <div 
      onClick={() => onSelect(resource)}
      className="group bg-slate-900/70 border border-slate-800/80 hover:border-purple-500/60 rounded-2xl p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10 flex flex-col justify-between backdrop-blur-md cursor-pointer relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-950/90 text-purple-300 border border-purple-800/60">
            {resource.category}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => onToggleBookmark(resource.id, e)}
              className={`p-1.5 rounded-lg border transition-all ${
                isBookmarked 
                  ? 'bg-purple-600 text-white border-purple-500' 
                  : 'bg-slate-800/50 text-slate-400 border-slate-700/50 hover:text-white'
              }`}
              title={isBookmarked ? '取消收藏' : '收藏论文'}
            >
              <Bookmark className="w-3.5 h-3.5 fill-current" />
            </button>
            <div className="flex items-center text-amber-400 text-xs font-semibold gap-1 bg-amber-950/30 px-2.5 py-1 rounded-full border border-amber-800/30">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              {resource.rating.toFixed(1)}
            </div>
          </div>
        </div>

        <h3 className="text-lg font-bold text-slate-100 mb-2 group-hover:text-purple-300 transition-colors line-clamp-2 leading-snug">
          {resource.title}
        </h3>

        <p className="text-slate-400 text-xs leading-relaxed mb-4 line-clamp-3">
          {resource.abstract}
        </p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {resource.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-[10px] bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded border border-slate-700/50">
              #{tag}
            </span>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <img src={resource.author.avatar} alt={resource.author.name} className="w-6 h-6 rounded-full object-cover border border-purple-500/30" />
          <span className="text-slate-300 truncate max-w-[120px]">{resource.author.name}</span>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1" title="阅读量"><Eye className="w-3.5 h-3.5" />{resource.views}</span>
          <span className="flex items-center gap-1" title="被引次数"><Quote className="w-3.5 h-3.5" />{resource.citationCount}</span>
          <span className="flex items-center gap-1" title="下载量"><Download className="w-3.5 h-3.5" />{resource.downloads}</span>
        </div>
      </div>
    </div>
  );
}

// 论文详情与互动模态弹窗组件
function ResourceDetailModal({ 
  resource, 
  onClose,
  discussions,
  onAddDiscussion,
  onNotify
}: { 
  resource: Resource; 
  onClose: () => void;
  discussions: Discussion[];
  onAddDiscussion: (resourceId: string, comment: string) => void;
  onNotify: (msg: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<'paper' | 'citations' | 'discussion'>('paper');
  const [citationFormat, setCitationFormat] = useState<'APA' | 'IEEE' | 'MLA' | 'BibTeX'>('APA');
  const [copied, setCopied] = useState(false);
  const [newComment, setNewComment] = useState('');

  // 格式化生成引用文本
  const citationText = useMemo(() => {
    const year = resource.publishedAt.split('-')[0];
    switch (citationFormat) {
      case 'APA':
        return `${resource.author.name}. (${year}). ${resource.title}. North Synapse Open Science. https://doi.org/${resource.doi}`;
      case 'IEEE':
        return `[1] ${resource.author.name}, "${resource.title}," North Synapse Pub., vol. 4, ${year}, doi: ${resource.doi}.`;
      case 'MLA':
        return `${resource.author.name}. "${resource.title}." North Synapse, ${year}, doi:${resource.doi}.`;
      case 'BibTeX':
        return `@article{${resource.id.replace('-', '_')}_${year},\n  author = {${resource.author.name}},\n  title = {${resource.title}},\n  journal = {North Synapse Platform},\n  year = {${year}},\n  doi = {${resource.doi}}\n}`;
      default:
        return '';
    }
  }, [resource, citationFormat]);

  const handleCopyCitation = () => {
    navigator.clipboard.writeText(citationText);
    setCopied(true);
    onNotify('引用剪贴板复制成功！');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    onAddDiscussion(resource.id, newComment);
    setNewComment('');
    onNotify('发表讨论成功！');
  };

  const resourceDiscussions = discussions.filter(d => d.resourceId === resource.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 relative shadow-2xl flex flex-col">
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 text-slate-400 hover:text-white p-2 rounded-full bg-slate-800/50 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-950 text-purple-300 border border-purple-800">
            {resource.category}
          </span>
          {resource.isPeerReviewed && (
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Peer Reviewed
            </span>
          )}
          <span className="text-xs text-slate-500 font-mono">DOI: {resource.doi}</span>
        </div>

        <h2 className="text-2xl font-bold text-white mb-4 leading-snug">{resource.title}</h2>

        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-800/80">
          <img src={resource.author.avatar} alt={resource.author.name} className="w-12 h-12 rounded-full object-cover border-2 border-purple-500" />
          <div>
            <p className="text-sm font-semibold text-slate-200">{resource.author.name}</p>
            <p className="text-xs text-slate-400">{resource.author.institution} • h-index: {resource.author.hIndex}</p>
            <p className="text-[11px] text-purple-400 font-mono">ORCID: {resource.author.orcid}</p>
          </div>
        </div>

        {/* 选项卡切换 */}
        <div className="flex border-b border-slate-800 gap-6 mb-6">
          <button 
            onClick={() => setActiveTab('paper')}
            className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'paper' ? 'border-purple-500 text-purple-300' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            全文与摘要
          </button>
          <button 
            onClick={() => setActiveTab('citations')}
            className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'citations' ? 'border-purple-500 text-purple-300' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            生成引用 (Cite)
          </button>
          <button 
            onClick={() => setActiveTab('discussion')}
            className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'discussion' ? 'border-purple-500 text-purple-300' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            学术讨论 ({resourceDiscussions.length})
          </button>
        </div>

        {/* 选项卡内容 */}
        <div className="flex-1 space-y-6 text-slate-300 text-sm">
          {activeTab === 'paper' && (
            <>
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">摘要 (Abstract)</h4>
                <p className="leading-relaxed text-slate-300 bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80">{resource.abstract}</p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">论文正文预览 (Full-text Preview)</h4>
                <pre className="whitespace-pre-wrap font-sans leading-relaxed text-slate-400 bg-slate-950/30 p-5 rounded-2xl border border-slate-800/60 text-xs">
                  {resource.fullText}
                </pre>
              </div>
            </>
          )}

          {activeTab === 'citations' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {(['APA', 'IEEE', 'MLA', 'BibTeX'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setCitationFormat(fmt)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      citationFormat === fmt 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>

              <div className="relative">
                <textarea
                  readOnly
                  rows={4}
                  value={citationText}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-slate-200 font-mono text-xs focus:outline-none"
                />
                <button
                  onClick={handleCopyCitation}
                  className="absolute right-3 top-3 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium flex items-center gap-1.5 transition-all shadow-md"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? '已复制' : '复制引用'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'discussion' && (
            <div className="space-y-6">
              <form onSubmit={handleCommentSubmit} className="flex gap-2">
                <input
                  type="text"
                  placeholder="针对该论文提出学术质疑或讨论..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <button 
                  type="submit" 
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-all"
                >
                  <Send className="w-3.5 h-3.5" /> 发表
                </button>
              </form>

              <div className="space-y-3">
                {resourceDiscussions.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6">暂无讨论，成为第一个发起同行讨论的学者吧。</p>
                ) : (
                  resourceDiscussions.map((disc) => (
                    <div key={disc.id} className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/80 flex items-start gap-3">
                      <img src={disc.avatar} alt={disc.user} className="w-8 h-8 rounded-full object-cover" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-slate-200">{disc.user}</span>
                          <span className="text-[10px] text-slate-500">{disc.createdAt}</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{disc.comment}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onNotify('PDF 下载流程已启动')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-all shadow-lg shadow-purple-600/30"
            >
              <Download className="w-4 h-4" /> 下载完整 PDF
            </button>
          </div>
          <button onClick={onClose} className="text-xs text-slate-400 hover:text-white">关闭弹窗</button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// SECTION 5: 横幅与统计区域 (HERO & STATS SECTIONS)
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
      <div className="absolute inset-0 bg-gradient-to-b from-purple-950/30 via-slate-950 to-slate-950 -z-10" />
      <div className="max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-900/40 border border-purple-700/50 text-purple-300 text-xs font-semibold mb-8 shadow-inner">
          <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
          新一代去中心化学术知识节点与协同平台
        </div>
        
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight mb-8 leading-tight">
          连接智慧，汇聚于 <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-300 to-purple-200">North Synapse</span>
        </h1>
        
        <p className="text-base sm:text-lg md:text-xl text-slate-300 mb-12 max-w-3xl mx-auto font-light leading-relaxed">
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
          <div key={stat.label} className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/50 backdrop-blur-sm">
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-xs text-slate-400 mt-1">{stat.label}</p>
            <span className="text-[10px] text-purple-400 mt-0.5 inline-block">{stat.change}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ==========================================
// SECTION 6: 导航栏与 Logo (HEADER & NAVIGATION)
// ==========================================
function Header({ bookmarkedCount }: { bookmarkedCount: number }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [useLogoImage, setUseLogoImage] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3 cursor-pointer">
          {useLogoImage ? (
            <img 
              src="/logo.png" 
              alt="North Synapse Logo" 
              style={{ width: '36px', height: '42px', objectFit: 'contain' }} 
              onError={() => setUseLogoImage(false)} 
            />
          ) : (
            /* 纯 SVG 代码绘制的 S 型双螺旋/神经突触 Logo */
            <svg 
              width="36" 
              height="42" 
              viewBox="0 0 100 115" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-[0_0_10px_rgba(167,139,250,0.5)]"
            >
              {/* S 型外侧主轨道 */}
              <path
                d="M 75,20 C 75,8 25,8 25,35 C 25,62 75,62 75,88 C 75,102 25,102 25,90"
                stroke="#A78BFA"
                strokeWidth="7"
                strokeLinecap="round"
                fill="none"
              />

              {/* 上半环内部 - DNA 阶梯/突触虚线 */}
              <line x1="38" y1="20" x2="62" y2="30" stroke="#A78BFA" strokeWidth="4" strokeDasharray="2 4" strokeLinecap="round" />
              <line x1="30" y1="28" x2="55" y2="38" stroke="#A78BFA" strokeWidth="4" strokeDasharray="2 4" strokeLinecap="round" />
              <line x1="26" y1="38" x2="48" y2="46" stroke="#A78BFA" strokeWidth="4" strokeDasharray="2 4" strokeLinecap="round" />

              {/* 下半环内部 - DNA 阶梯/突触虚线 */}
              <line x1="52" y1="64" x2="74" y2="72" stroke="#A78BFA" strokeWidth="4" strokeDasharray="2 4" strokeLinecap="round" />
              <line x1="45" y1="72" x2="70" y2="82" stroke="#A78BFA" strokeWidth="4" strokeDasharray="2 4" strokeLinecap="round" />
              <line x1="38" y1="80" x2="62" y2="90" stroke="#A78BFA" strokeWidth="4" strokeDasharray="2 4" strokeLinecap="round" />

              {/* 端点突触节点圆点 */}
              <circle cx="75" cy="20" r="4.5" fill="#A78BFA" />
              <circle cx="25" cy="35" r="4.5" fill="#A78BFA" />
              <circle cx="75" cy="88" r="4.5" fill="#A78BFA" />
              <circle cx="25" cy="90" r="4.5" fill="#A78BFA" />
            </svg>
          )}
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
          <div className="relative cursor-pointer p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors">
            <Bookmark className="w-4 h-4" />
            {bookmarkedCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {bookmarkedCount}
              </span>
            )}
          </div>
          <button className="text-sm font-medium text-slate-300 hover:text-white transition-colors px-3 py-2">
            登录
          </button>
          <button className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-purple-600/30 font-semibold">
            免费注册
          </button>
        </div>

        <button 
          className="md:hidden text-slate-400 hover:text-white p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-6 pt-4 pb-6 space-y-4 shadow-2xl">
          <a href="#discover" className="block text-slate-200 hover:text-purple-400 font-medium">发现论文</a>
          <a href="#publications" className="block text-slate-200 hover:text-purple-400 font-medium">学术出版</a>
          <a href="#network" className="block text-slate-200 hover:text-purple-400 font-medium">学者网络</a>
          <a href="#about" className="block text-slate-200 hover:text-purple-400 font-medium">关于我们</a>
          <div className="pt-4 border-t border-slate-800 flex flex-col gap-3">
            <button className="w-full text-center text-slate-300 py-2.5 font-medium border border-slate-700 rounded-xl">登录</button>
            <button className="w-full bg-purple-600 text-white py-2.5 rounded-xl font-semibold shadow-lg shadow-purple-600/30">免费注册</button>
          </div>
        </div>
      )}
    </header>
  );
}

// ==========================================
// SECTION 7: 主页面入口与页脚 (MAIN PAGE & FOOTER)
// ==========================================
export default function Page() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [discussions, setDiscussions] = useState<Discussion[]>(INITIAL_DISCUSSIONS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 显示 Toast 简短提示框
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 切换书签收藏状态
  const handleToggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarkedIds(prev => {
      const isBookmarked = prev.includes(id);
      if (isBookmarked) {
        showToast('已从收藏夹移除');
        return prev.filter(item => item !== id);
      } else {
        showToast('已添加至个人收藏夹');
        return [...prev, id];
      }
    });
  };

  // 添加新讨论
  const handleAddDiscussion = (resourceId: string, comment: string) => {
    const newDisc: Discussion = {
      id: `d-${Date.now()}`,
      resourceId,
      user: 'Anonymous Researcher',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100',
      comment,
      createdAt: '刚刚',
      likes: 0
    };
    setDiscussions(prev => [newDisc, ...prev]);
  };

  // 论文检索过滤逻辑
  const filteredResources = useMemo(() => {
    try {
      return MOCK_RESOURCES.filter((res) => {
        const matchesCategory = selectedCategory === 'All' || res.category === selectedCategory;
        const matchesQuery = !searchQuery.trim() || 
          res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          res.abstract.toLowerCase().includes(searchQuery.toLowerCase()) ||
          res.author.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          res.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

        return matchesCategory && matchesQuery;
      });
    } catch (err: unknown) {
      console.error('搜索计算产生异常:', err);
      return [];
    }
  }, [searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-purple-500 selection:text-white font-sans">
      <Header bookmarkedCount={bookmarkedIds.length} />
      
      <main className="flex-1">
        <HeroSection 
          query={searchQuery} 
          onSearchChange={setSearchQuery} 
          selectedCategory={selectedCategory} 
          onCategoryChange={setSelectedCategory} 
        />

        <section id="discover" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
            <div>
              <h2 className="text-3xl font-bold text-white tracking-tight">精选出版物 (Featured Publications)</h2>
              <p className="text-slate-400 text-sm mt-1">由 North Synapse 分布式节点实时索引的高影响学术文献。</p>
            </div>
            
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className="text-xs text-slate-500">找到 {filteredResources.length} 项成果</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            {filteredResources.map((res) => (
              <ResourceCard 
                key={res.id} 
                resource={res} 
                onSelect={(r) => setSelectedResource(r)}
                isBookmarked={bookmarkedIds.includes(res.id)}
                onToggleBookmark={handleToggleBookmark}
              />
            ))}
          </div>

          {filteredResources.length === 0 && (
            <div className="text-center py-24 bg-slate-900/40 rounded-3xl border border-slate-800/80">
              <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-200 text-lg font-semibold">未找到符合条件的论文成果</p>
              <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">请尝试重置关键词或在分类选项卡中切换至 "All" 查看更多文献。</p>
              <button 
                onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                className="mt-6 px-4 py-2 rounded-xl bg-purple-950 text-purple-300 border border-purple-800 text-xs font-semibold hover:bg-purple-900 transition-colors"
              >
                重置搜索条件
              </button>
            </div>
          )}
        </section>
      </main>

      {/* 论文详情模态弹窗 */}
      {selectedResource && (
        <ResourceDetailModal 
          resource={selectedResource} 
          onClose={() => setSelectedResource(null)}
          discussions={discussions}
          onAddDiscussion={handleAddDiscussion}
          onNotify={showToast}
        />
      )}

      {/* Toast 提示框 */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-purple-600 text-white px-5 py-3 rounded-2xl shadow-2xl text-xs font-semibold flex items-center gap-2 animate-bounce">
          <CheckCircle className="w-4 h-4" />
          {toastMessage}
        </div>
      )}

      {/* 底部页脚 */}
      <footer className="bg-slate-950 border-t border-slate-800/80 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-800/60">
            <div className="flex items-center space-x-3">
              <span className="text-lg font-bold text-white">North Synapse</span>
              <span className="text-xs text-slate-500 border-l border-slate-800 pl-3">学术知识网络平台</span>
            </div>
            <div className="flex space-x-8 text-xs text-slate-400">
              <a href="#" className="hover:text-purple-400 transition-colors">节点分布</a>
              <a href="#" className="hover:text-purple-400 transition-colors">API 接口文档</a>
              <a href="#" className="hover:text-purple-400 transition-colors">开源协议</a>
              <a href="#" className="hover:text-purple-400 transition-colors">安全性验证</a>
            </div>
          </div>
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} North Synapse Open Science. All rights reserved.</p>
            <div className="flex space-x-6">
              <a href="#" className="hover:text-slate-400">隐私政策</a>
              <a href="#" className="hover:text-slate-400">服务条款</a>
              <a href="#" className="hover:text-slate-400">联系支持</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
