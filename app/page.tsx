"use client";

/* =========================================================
   NORTH SYNAPSE
   主页面：导航、资源中心、自习室、讨论区、公告、反馈、个人主页
   注意：当前为前端原型，数据暂存在页面状态中，刷新后会重置。
   ========================================================= */

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Activity,
  ArrowDownUp,
  ArrowRight,
  Bell,
  BookOpen,
  Bookmark,
  Check,
  ChevronDown,
  Clock3,
  FileText,
  Flag,
  Hash,
  Heart,
  Home,
  LogIn,
  Menu,
  MessageCircle,
  Moon,
  Plus,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sun,
  Users,
  X,
  Zap,
} from "lucide-react";

// 1. 定义数据类型
type Section =
  | "Overview"
  | "Research Hub"
  | "Study Lounge"
  | "Discussions"
  | "Announcements"
  | "Feedback"
  | "Dashboard";

type Resource = {
  id: number;
  title: string;
  description: string;
  subject: string;
  grade: string;
  author: string;
  date: string;
  likes: number;
  saves: number;
};

type Discussion = {
  id: number;
  title: string;
  body: string;
  category: string;
  author: string;
  replies: number;
  votes: number;
};

type StudyRoom = {
  id: number;
  name: string;
  creator: string;
  subject: string;
  privacy: "Public" | "Private";
  online: number;
};

// 2. 示例内容：之后会改为从 Supabase 数据库读取
const initialResources: Resource[] = [
  {
    id: 1,
    title: "Functions — Complete Review",
    description:
      "A structured review of function notation, transformations, domain, range, and inverse functions.",
    subject: "Mathematics",
    grade: "Grade 11",
    author: "Alex Chen",
    date: "Oct 24, 2026",
    likes: 24,
    saves: 38,
  },
  {
    id: 2,
    title: "Chemistry: Naming Compounds",
    description:
      "A concise reference for ionic compounds, molecular compounds, and polyatomic ions.",
    subject: "Science",
    grade: "Grade 10",
    author: "Jamie W.",
    date: "Oct 23, 2026",
    likes: 19,
    saves: 31,
  },
  {
    id: 3,
    title: "How to Prepare for English Essays",
    description:
      "Planning an argument, selecting evidence, organizing paragraphs, and revising a first draft.",
    subject: "English",
    grade: "Grade 10",
    author: "Morgan L.",
    date: "Oct 22, 2026",
    likes: 16,
    saves: 27,
  },
  {
    id: 4,
    title: "Python Problem-Solving Notes",
    description:
      "Useful patterns for lists, loops, dictionaries, and introductory competitive programming.",
    subject: "Computer Science",
    grade: "Grade 11",
    author: "Taylor K.",
    date: "Oct 21, 2026",
    likes: 32,
    saves: 42,
  },
  {
    id: 5,
    title: "Physics Formula Reference",
    description:
      "An organized reference for motion, forces, energy, and common unit conversions.",
    subject: "Science",
    grade: "Grade 11",
    author: "Sam R.",
    date: "Oct 20, 2026",
    likes: 13,
    saves: 20,
  },
  {
    id: 6,
    title: "Study Planning That Actually Works",
    description:
      "A practical weekly planning template for assignments, review sessions, and deadlines.",
    subject: "Study Skills",
    grade: "All Grades",
    author: "Jordan P.",
    date: "Oct 19, 2026",
    likes: 21,
    saves: 36,
  },
];

const initialDiscussions: Discussion[] = [
  {
    id: 1,
    title: "How do you organize your study schedule?",
    body: "I am trying to balance homework, test preparation, and personal projects. What works for you?",
    category: "Study Tips",
    author: "StudySeeker",
    replies: 12,
    votes: 18,
  },
  {
    id: 2,
    title: "Advice for choosing Grade 11 courses",
    body: "What should students consider when planning prerequisites and future university programs?",
    category: "Course Selection",
    author: "NorthStar",
    replies: 8,
    votes: 14,
  },
  {
    id: 3,
    title: "Share your favourite coding resources",
    body: "Looking for useful websites and projects for students who want to improve their programming skills.",
    category: "Computer Science",
    author: "ByteSized",
    replies: 15,
    votes: 27,
  },
];

const initialRooms: StudyRoom[] = [
  {
    id: 1,
    name: "The Common Room",
    creator: "North Synapse",
    subject: "General Study",
    privacy: "Public",
    online: 12,
  },
  {
    id: 2,
    name: "Math Focus",
    creator: "Alex Chen",
    subject: "Mathematics",
    privacy: "Public",
    online: 5,
  },
  {
    id: 3,
    name: "Quiet Coding",
    creator: "Taylor K.",
    subject: "Computer Science",
    privacy: "Public",
    online: 3,
  },
];

const navItems: { name: Section; icon: typeof Home }[] = [
  { name: "Overview", icon: Home },
  { name: "Research Hub", icon: BookOpen },
  { name: "Study Lounge", icon: Clock3 },
  { name: "Discussions", icon: MessageCircle },
  { name: "Announcements", icon: Bell },
  { name: "Feedback", icon: Heart },
  { name: "Dashboard", icon: Users },
];

const subjects = [
  "All Subjects",
  "Mathematics",
  "Science",
  "English",
  "Computer Science",
  "Study Skills",
];

const grades = ["All Grades", "Grade 9", "Grade 10", "Grade 11", "Grade 12"];

export default function HomePage() {
  // 3. 页面状态
  const [section, setSection] = useState<Section>("Overview");
  const [darkMode, setDarkMode] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // 登录状态
  const [username, setUsername] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [isStudent, setIsStudent] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  // 资源中心状态
  const [resources, setResources] = useState(initialResources);
  const [query, setQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("All Subjects");
  const [gradeFilter, setGradeFilter] = useState("All Grades");
  const [sortBy, setSortBy] = useState("Newest");
  const [likedIds, setLikedIds] = useState<number[]>([]);
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const [resourceModalOpen, setResourceModalOpen] = useState(false);
  const [resourceTitle, setResourceTitle] = useState("");
  const [resourceDescription, setResourceDescription] = useState("");
  const [resourceSubject, setResourceSubject] = useState("Mathematics");
  const [resourceGrade, setResourceGrade] = useState("Grade 10");

  // 资源详情状态
  const [previewResource, setPreviewResource] = useState<Resource | null>(
    null
  );
  const [commentText, setCommentText] = useState("");
  const [resourceComments, setResourceComments] = useState<
    Record<number, string[]>
  >({});

  // 讨论区状态
  const [discussions, setDiscussions] = useState(initialDiscussions);
  const [discussionModalOpen, setDiscussionModalOpen] = useState(false);
  const [discussionTitle, setDiscussionTitle] = useState("");
  const [discussionBody, setDiscussionBody] = useState("");
  const [discussionCategory, setDiscussionCategory] = useState("Study Tips");

  // 自习室状态
  const [rooms, setRooms] = useState(initialRooms);
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [roomSubject, setRoomSubject] = useState("General Study");
  const [roomPrivacy, setRoomPrivacy] = useState<"Public" | "Private">(
    "Public"
  );
  const [activeRoom, setActiveRoom] = useState<number | null>(null);

  // 公告、反馈与通用提示
  const [announcementText, setAnnouncementText] = useState(
    "Welcome to North Synapse — a place to learn, share, and grow together."
  );
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [toast, setToast] = useState("");

  // 4. 通用辅助函数
  function notify(message: string) {
    setToast(message);
  }

  function navigate(next: Section) {
    setSection(next);
    setMobileNavOpen(false);
    setToast("");
  }

  function requireLogin() {
    if (!loggedIn) {
      setAuthMode("login");
      setAuthOpen(true);
      return false;
    }
    return true;
  }

  // 5. 使用 Supabase 处理真实注册与登录
  async function handleAuth() {
    if (!authEmail.trim() || !authPassword.trim()) {
      notify("Please enter your email and password.");
      return;
    }

    if (authMode === "register" && (!isStudent || !acceptedTerms)) {
      notify("Please confirm student eligibility and accept the Terms.");
      return;
    }

    if (!supabase) {
      notify("Authentication is not configured. Please try again later.");
      return;
    }

    try {
      if (authMode === "register") {
        const { data, error } = await supabase.auth.signUp({
          email: authEmail.trim(),
          password: authPassword,
        });

        if (error) {
          notify(error.message);
          return;
        }

        setAuthOpen(false);
        setAuthEmail("");
        setAuthPassword("");
        setIsStudent(false);
        setAcceptedTerms(false);

        notify(
          data.session
            ? "Account created successfully."
            : "Please check your email to confirm your account."
        );
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: authEmail.trim(),
        password: authPassword,
      });

      if (error) {
        notify(error.message);
        return;
      }

      setUsername(data.user.email?.split("@")[0] ?? "Student");
      setLoggedIn(true);
      setAuthOpen(false);
      setAuthEmail("");
      setAuthPassword("");
      notify("Signed in successfully.");
    } catch {
      notify("Something went wrong. Please try again.");
    }
  }

  async function handleLogout() {
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        notify(error.message);
        return;
      }
    }

    setLoggedIn(false);
    setUsername("");
    setActiveRoom(null);
    notify("You have signed out.");
  }
    // 6. 资源中心：搜索、筛选、排序
  const filteredResources = resources
    .filter((item) => {
      const searchText =
        `${item.title} ${item.description} ${item.author} ${item.subject}`.toLowerCase();

      return (
        searchText.includes(query.toLowerCase()) &&
        (subjectFilter === "All Subjects" ||
          item.subject === subjectFilter) &&
        (gradeFilter === "All Grades" || item.grade === gradeFilter)
      );
    })
    .sort((a, b) => {
      if (sortBy === "Most Liked") return b.likes - a.likes;
      if (sortBy === "Most Saved") return b.saves - a.saves;
      return b.id - a.id;
    });

  function toggleLike(id: number) {
    if (!requireLogin()) return;

    const alreadyLiked = likedIds.includes(id);

    setLikedIds((current) =>
      alreadyLiked ? current.filter((item) => item !== id) : [...current, id]
    );

    setResources((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, likes: item.likes + (alreadyLiked ? -1 : 1) }
          : item
      )
    );
  }

  function toggleSave(id: number) {
    if (!requireLogin()) return;

    const alreadySaved = savedIds.includes(id);

    setSavedIds((current) =>
      alreadySaved ? current.filter((item) => item !== id) : [...current, id]
    );

    setResources((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, saves: item.saves + (alreadySaved ? -1 : 1) }
          : item
      )
    );
  }

  function publishResource() {
    if (!requireLogin()) return;

    if (!resourceTitle.trim() || !resourceDescription.trim()) {
      notify("Please complete the resource title and description.");
      return;
    }

    const newResource: Resource = {
      id: Date.now(),
      title: resourceTitle.trim(),
      description: resourceDescription.trim(),
      subject: resourceSubject,
      grade: resourceGrade,
      author: username,
      date: new Date().toLocaleDateString("en-CA", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      likes: 0,
      saves: 0,
    };

    setResources((current) => [newResource, ...current]);
    setResourceTitle("");
    setResourceDescription("");
    setResourceModalOpen(false);
    setSection("Research Hub");
    notify("Resource added to this demo session.");
  }

  // 7. 讨论区：发布与举报
  function publishDiscussion() {
    if (!requireLogin()) return;

    if (!discussionTitle.trim() || !discussionBody.trim()) {
      notify("Please complete your discussion title and text.");
      return;
    }

    const item: Discussion = {
      id: Date.now(),
      title: discussionTitle.trim(),
      body: discussionBody.trim(),
      category: discussionCategory,
      author: username,
      replies: 0,
      votes: 0,
    };

    setDiscussions((current) => [item, ...current]);
    setDiscussionTitle("");
    setDiscussionBody("");
    setDiscussionModalOpen(false);
    notify("Discussion published in this demo session.");
  }

  function reportContent(title: string) {
    if (!requireLogin()) return;
    notify(`Demo report prepared for review: "${title}".`);
  }

  function voteDiscussion(id: number) {
    if (!requireLogin()) return;

    setDiscussions((current) =>
      current.map((item) =>
        item.id === id ? { ...item, votes: item.votes + 1 } : item
      )
    );
  }

  // 8. 自习室：创建、进入与退出
  function createRoom() {
    if (!requireLogin()) return;

    if (!roomName.trim()) {
      notify("Please enter a room name.");
      return;
    }

    const newRoom: StudyRoom = {
      id: Date.now(),
      name: roomName.trim(),
      creator: username,
      subject: roomSubject,
      privacy: roomPrivacy,
      online: 1,
    };

    setRooms((current) => [...current, newRoom]);
    setRoomName("");
    setRoomModalOpen(false);
    setActiveRoom(newRoom.id);
    notify("Room created in this demo session.");
  }

  // 9. 页面顶部
  function renderTopbar() {
    return (
      <header className="topbar">
        <div className="top-actions">
          <button
            className="icon-button mobile-menu"
            aria-label="Open navigation"
            onClick={() => setMobileNavOpen((open) => !open)}
          >
            <Menu size={17} />
          </button>

          <div className="breadcrumb">
            <span>North Synapse</span>
            <span>/</span>
            <strong>{section}</strong>
          </div>
        </div>

        <div className="top-actions">
          <button
            className="icon-button"
            aria-label="Toggle theme"
            onClick={() => setDarkMode((value) => !value)}
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <button
            className="icon-button"
            aria-label="Announcements"
            onClick={() => navigate("Announcements")}
          >
            <Bell size={16} />
          </button>

          {loggedIn ? (
            <button className="user-chip" onClick={() => navigate("Dashboard")}>
              <span className="avatar">{username.charAt(0).toUpperCase()}</span>
              <span>{username}</span>
              <ChevronDown size={13} />
            </button>
          ) : (
            <button
              className="button button-primary"
              onClick={() => {
                setAuthMode("login");
                setAuthOpen(true);
              }}
            >
              <LogIn size={14} />
              Sign in
            </button>
          )}
        </div>
      </header>
    );
  }

  // 10. 左侧导航
  function renderSidebar() {
    return (
      <aside className={`sidebar ${mobileNavOpen ? "sidebar-open" : ""}`}>
        <button className="brand" onClick={() => navigate("Overview")}>
          <span className="brand-mark">
            <svg viewBox="0 0 48 52" aria-hidden="true">
              <path d="M8 12 L8 40 L24 40 L24 26 L40 26 L40 40" />
              <path d="M8 12 L24 12 L24 26" />
              <circle cx="8" cy="12" r="3" />
              <circle cx="24" cy="12" r="3" />
              <circle cx="24" cy="26" r="3" />
              <circle cx="40" cy="26" r="3" />
              <circle cx="40" cy="40" r="3" />
            </svg>
          </span>

          <span className="brand-name">
            North <b>Synapse</b>
            <small>LEARN · CONNECT · GROW</small>
          </span>
        </button>

        <div className="side-label">YOUR COMMUNITY</div>

        <nav className="side-nav">
          {navItems.map(({ name, icon: Icon }) => (
            <button
              key={name}
              className={`nav-item ${section === name ? "active" : ""}`}
              onClick={() => navigate(name)}
            >
              <Icon size={16} />
              <span>{name}</span>
              {section === name && <span className="nav-dot" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="community-card">
            <strong>A community that thinks.</strong>
            <p>
              Share knowledge, discover ideas, and make school life a little
              easier together.
            </p>
            <span>
              <i className="online-dot" /> Built for NTCI students
            </span>
          </div>

          {loggedIn && (
            <button
              className="button button-ghost button-wide"
              onClick={handleLogout}
            >
              Sign out
            </button>
          )}

          <div className="sidebar-foot">
            <span className="tiny-logo">N</span>
            <span>North Synapse</span>
            <span className="version">BETA · 0.1</span>
          </div>
        </div>
      </aside>
    );
  }

  // 11. 首页 Overview
  function renderOverview() {
    return (
      <div className="page-enter">
        <div className="page-heading">
          <div>
            <div className="eyebrow">
              <span className="eyebrow-line" />
              YOUR LEARNING COMMUNITY
            </div>
            <h1>Think better, <span>together.</span></h1>
            <p className="page-description">
              A shared space for NTCI students to exchange knowledge,
              discover resources, and grow together.
            </p>
          </div>

          <button
            className="button button-primary"
            onClick={() => {
              setAuthMode(loggedIn ? "login" : "register");
              setAuthOpen(true);
            }}
          >
            {loggedIn ? "Explore community" : "Join the community"}
            <ArrowRight size={15} />
          </button>
        </div>

        <div className="hero-panel">
          <div className="hero-copy">
            <span className="hero-tag">
              <Zap size={13} /> YOUR IDEAS BELONG HERE
            </span>
            <h2>Knowledge grows when it is shared.</h2>
            <p>
              Find study materials, exchange perspectives, and meet people
              who care about learning as much as you do.
            </p>
            <div className="hero-actions">
              <button
                className="button button-primary"
                onClick={() => navigate("Research Hub")}
              >
                Explore resources <ArrowRight size={14} />
              </button>
              <button
                className="button button-secondary"
                onClick={() => navigate("Discussions")}
              >
                Join a discussion
              </button>
            </div>
          </div>

          <div className="hero-graphic" aria-hidden="true">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="orbit orbit-three" />
            <div className="hero-node node-one" />
            <div className="hero-node node-two" />
            <div className="hero-node node-three" />
            <div className="hero-node node-four" />
            <div className="hero-center">
              <Activity size={36} />
            </div>
          </div>
        </div>

        <div className="section-heading">
          <div>
            <h2>Explore North Synapse</h2>
            <p>Everything you need to make learning more connected.</p>
          </div>
        </div>

        <div className="feature-grid">
          <button
            className="feature-card"
            onClick={() => navigate("Research Hub")}
          >
            <span className="feature-icon"><BookOpen size={20} /></span>
            <h3>Research Hub</h3>
            <p>Share notes, find resources, and save useful study materials.</p>
            <span className="feature-link">Explore resources <ArrowRight size={13} /></span>
          </button>

          <button
            className="feature-card"
            onClick={() => navigate("Study Lounge")}
          >
            <span className="feature-icon"><Clock3 size={20} /></span>
            <h3>Study Lounge</h3>
            <p>Find a quiet space to focus or study alongside other students.</p>
            <span className="feature-link">Find a room <ArrowRight size={13} /></span>
          </button>

          <button
            className="feature-card"
            onClick={() => navigate("Discussions")}
          >
            <span className="feature-icon"><MessageCircle size={20} /></span>
            <h3>Discussions</h3>
            <p>Ask questions, share advice, and learn from your community.</p>
            <span className="feature-link">Start a conversation <ArrowRight size={13} /></span>
          </button>
        </div>

        <div className="section-heading">
          <div>
            <h2>Recently shared</h2>
            <p>Resources from the student community.</p>
          </div>
          <button className="inline-link" onClick={() => navigate("Research Hub")}>
            View all <ArrowRight size={13} />
          </button>
        </div>

        <div className="resource-list">
          {initialResources.slice(0, 3).map((item) => (
            <button
              key={item.id}
              className="resource-row"
              onClick={() => {
                setPreviewResource(item);
                navigate("Research Hub");
              }}
            >
              <span className="resource-file-icon"><FileText size={18} /></span>
              <span className="resource-row-main">
                <strong>{item.title}</strong>
                <span>{item.subject} · {item.grade} · by {item.author}</span>
              </span>
              <span className="resource-row-stats">
                <Heart size={13} /> {item.likes}
              </span>
              <ArrowRight size={14} />
            </button>
          ))}
        </div>
      </div>
    );
  }
    // 12. Research Hub
  function renderResearchHub() {
    return (
      <div className="page-enter">
        <div className="page-heading">
          <div>
            <div className="eyebrow">
              <span className="eyebrow-line" />
              THE KNOWLEDGE LIBRARY
            </div>
            <h1>
              Research <span className="gradient-text">Hub.</span>
            </h1>
            <p className="page-subtitle">
              Student-made notes, study guides, and ideas worth sharing.
            </p>
          </div>

          <button
            className="button button-primary"
            onClick={() => {
              if (requireLogin()) setResourceModalOpen(true);
            }}
          >
            <Plus size={15} /> Publish a resource
          </button>
        </div>

        <label className="hub-search">
          <Search size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search notes, subjects, keywords, or authors..."
          />
          <span className="muted-small">
            {filteredResources.length} RESULTS
          </span>
        </label>

        <div className="filter-panel">
          <div className="filter-row">
            <span className="filter-label">SUBJECT</span>
            <div className="filter-chips">
              {subjects.map((subject) => (
                <button
                  key={subject}
                  className={`chip ${
                    subjectFilter === subject ? "selected" : ""
                  }`}
                  onClick={() => setSubjectFilter(subject)}
                >
                  {subject}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-row">
            <span className="filter-label">GRADE</span>
            <div className="filter-chips">
              {grades.map((grade) => (
                <button
                  key={grade}
                  className={`chip ${
                    gradeFilter === grade ? "selected" : ""
                  }`}
                  onClick={() => setGradeFilter(grade)}
                >
                  {grade}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-bottom">
            <span>{filteredResources.length} resources found</span>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
              }}
            >
              <ArrowDownUp size={13} />
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                style={{ width: "auto", padding: "6px", fontSize: 10 }}
              >
                <option>Newest</option>
                <option>Most Liked</option>
                <option>Most Saved</option>
              </select>
            </label>
          </div>
        </div>

        <div className="section-title-row">
          <div>
            <h2>All resources</h2>
            <p>Created by students, for students.</p>
          </div>
        </div>

        {filteredResources.length === 0 ? (
          <div className="panel empty-dashboard">
            <Search size={25} />
            <h3>No resources found</h3>
            <p>Try another keyword or change your filters.</p>
            <button
              className="button button-secondary"
              onClick={() => {
                setQuery("");
                setSubjectFilter("All Subjects");
                setGradeFilter("All Grades");
              }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="resource-grid">
            {filteredResources.map((resource) => (
              <article className="resource-card" key={resource.id}>
                <div className="resource-card-top">
                  <span className="badge">{resource.subject}</span>
                  <button
                    className="icon-button"
                    aria-label="Report resource"
                    onClick={() => reportContent(resource.title)}
                  >
                    <Flag size={13} />
                  </button>
                </div>

                <h3 style={{ marginTop: 16, fontSize: 15 }}>
                  {resource.title}
                </h3>
                <p>{resource.description}</p>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 8,
                    marginBottom: 14,
                  }}
                >
                  <span className="muted-small">{resource.grade}</span>
                  <span className="muted-small">{resource.date}</span>
                </div>

                <div className="resource-card-actions">
                  <span className="muted-small">{resource.author}</span>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      className="icon-button"
                      aria-label="Like resource"
                      onClick={() => toggleLike(resource.id)}
                      style={{
                        color: likedIds.includes(resource.id)
                          ? "var(--purple)"
                          : undefined,
                      }}
                    >
                      <Heart
                        size={14}
                        fill={
                          likedIds.includes(resource.id)
                            ? "currentColor"
                            : "none"
                        }
                      />
                      {resource.likes}
                    </button>

                    <button
                      className="icon-button"
                      aria-label="Save resource"
                      onClick={() => toggleSave(resource.id)}
                      style={{
                        color: savedIds.includes(resource.id)
                          ? "var(--purple)"
                          : undefined,
                      }}
                    >
                      <Bookmark
                        size={14}
                        fill={
                          savedIds.includes(resource.id)
                            ? "currentColor"
                            : "none"
                        }
                      />
                      {resource.saves}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 13. Study Lounge
  function renderStudyLounge() {
    const room = rooms.find((item) => item.id === activeRoom);

    return (
      <div className="page-enter">
        <div className="page-heading">
          <div>
            <div className="eyebrow">
              <span className="eyebrow-line" />
              FOCUS TOGETHER
            </div>
            <h1>
              Study <span className="gradient-text">Lounge.</span>
            </h1>
            <p className="page-subtitle">
              Find a quiet corner, set an intention, and get things done.
            </p>
          </div>

          <button
            className="button button-primary"
            onClick={() => {
              if (requireLogin()) setRoomModalOpen(true);
            }}
          >
            <Plus size={15} /> Create a room
          </button>
        </div>

        {room ? (
          <div className="panel">
            <button
              className="button button-ghost"
              onClick={() => setActiveRoom(null)}
            >
              <ArrowRight
                size={14}
                style={{ transform: "rotate(180deg)" }}
              />{" "}
              Back to rooms
            </button>

            <div style={{ textAlign: "center", padding: "35px 10px" }}>
              <span className="avatar" style={{ width: 60, height: 60 }}>
                <Clock3 size={26} />
              </span>

              <h2 style={{ marginTop: 20 }}>{room.name}</h2>
              <p className="page-subtitle">
                {room.subject} · {room.privacy} room
              </p>

              <div style={{ margin: "22px auto", maxWidth: 340 }}>
                <FocusTimer />
              </div>

              <p className="muted-small">
                This timer runs in your browser only. Live room presence and
                chat will be added with backend integration.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <span>AVAILABLE ROOMS</span>
                <strong>{rooms.length}</strong>
                <span>Study spaces in this demo</span>
              </div>

              <div className="stat-card">
                <span>PUBLIC ROOMS</span>
                <strong>
                  {rooms.filter((item) => item.privacy === "Public").length}
                </strong>
                <span>Open to join</span>
              </div>

              <div className="stat-card">
                <span>YOUR FOCUS</span>
                <strong>25 min</strong>
                <span>Suggested focus session</span>
              </div>

              <div className="stat-card">
                <span>ROOM STATUS</span>
                <strong>Ready</strong>
                <span>Choose a room to begin</span>
              </div>
            </div>

            <div style={{ height: 30 }} />

            <div className="section-title-row">
              <div>
                <h2>Find your space</h2>
                <p>Choose a room that fits your study mood.</p>
              </div>
            </div>

            <div className="room-grid">
              {rooms.map((item) => (
                <article className="room-card" key={item.id}>
                  <div className="resource-card-top">
                    <span className="avatar">
                      <Users size={17} />
                    </span>
                    <span className="badge">{item.privacy}</span>
                  </div>

                  <h3 style={{ marginTop: 17 }}>{item.name}</h3>
                  <p>{item.subject}</p>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      margin: "15px 0",
                    }}
                  >
                    <span className="muted-small">
                      HOST: {item.creator}
                    </span>
                    <span className="muted-small">
                      <Users size={12} /> {item.online} online*
                    </span>
                  </div>

                  <button
                    className="button button-secondary button-wide"
                    onClick={() => {
                      if (item.privacy === "Private") {
                        notify(
                          "Private room codes will be connected to the backend."
                        );
                        return;
                      }

                      setActiveRoom(item.id);
                    }}
                  >
                    Enter room <ArrowRight size={14} />
                  </button>
                </article>
              ))}
            </div>

            <p className="muted-small" style={{ marginTop: 15 }}>
              *Sample counts only; live presence is not connected yet.
            </p>
          </>
        )}
      </div>
    );
  }

  // 14. 讨论区
  function renderDiscussions() {
    return (
      <div className="page-enter">
        <div className="page-heading">
          <div>
            <div className="eyebrow">
              <span className="eyebrow-line" />
              STUDENT VOICES
            </div>
            <h1>
              Discussions<span className="gradient-text">.</span>
            </h1>
            <p className="page-subtitle">
              Ask questions, exchange perspectives, and help each other out.
            </p>
          </div>

          <button
            className="button button-primary"
            onClick={() => {
              if (requireLogin()) setDiscussionModalOpen(true);
            }}
          >
            <Plus size={15} /> New discussion
          </button>
        </div>

        <div className="hub-search">
          <MessageCircle size={17} />
          <span style={{ fontSize: 11, color: "var(--muted)" }}>
            Be curious. Be constructive. Keep the conversation respectful.
          </span>
        </div>

        <div style={{ display: "grid", gap: 13 }}>
          {discussions.map((item) => (
            <article className="discussion-card" key={item.id}>
              <div className="resource-card-top">
                <span className="badge">
                  <Hash size={11} /> {item.category}
                </span>

                <button
                  className="icon-button"
                  aria-label="Report discussion"
                  onClick={() => reportContent(item.title)}
                >
                  <Flag size={13} />
                </button>
              </div>

              <h3 style={{ marginTop: 15, fontSize: 16 }}>{item.title}</h3>
              <p>{item.body}</p>

              <div className="resource-card-actions">
                <span className="muted-small">
                  Posted by {item.author}
                </span>

                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  <button
                    className="button button-ghost button-small"
                    onClick={() => voteDiscussion(item.id)}
                  >
                    <ArrowRight
                      size={13}
                      style={{ transform: "rotate(-90deg)" }}
                    />
                    {item.votes}
                  </button>

                  <span className="muted-small">
                    <MessageCircle size={12} /> {item.replies} replies
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    );
  }

  // 15. 公告
  function renderAnnouncements() {
    return (
      <div className="page-enter">
        <div className="page-heading">
          <div>
            <div className="eyebrow">
              <span className="eyebrow-line" />
              COMMUNITY UPDATES
            </div>
            <h1>
              Announcements<span className="gradient-text">.</span>
            </h1>
            <p className="page-subtitle">
              Updates and information for the North Synapse community.
            </p>
          </div>
        </div>

        <article className="notice-card">
          <div className="resource-card-top">
            <span className="badge">
              <Bell size={12} /> COMMUNITY NOTICE
            </span>
            <span className="muted-small">LATEST UPDATE</span>
          </div>

          <h2 style={{ marginTop: 22, fontSize: 22 }}>
            Welcome to North Synapse
          </h2>

          <p style={{ lineHeight: 1.9, color: "var(--muted)" }}>
            {announcementText}
          </p>

          <div className="resource-card-actions">
            <span className="muted-small">North Synapse Team</span>
            <span className="muted-small">Community update</span>
          </div>
        </article>

        <div style={{ height: 15 }} />

        <div className="panel">
          <h3>Community guidelines</h3>
          <p>
            North Synapse is a space for learning, sharing, and constructive
            discussion. Please respect other students, protect personal
            information, and report inappropriate content when necessary.
          </p>
        </div>
      </div>
    );
  }
  
