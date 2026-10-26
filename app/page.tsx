
"use client";

/* =========================================================
   NORTH SYNAPSE
   主页面：导航、资源中心、自习室、讨论区、公告、反馈、个人主页
   注意：当前为前端原型，数据暂存在页面状态中，刷新后会重置。
   ========================================================= */

import { useState } from "react";
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

  // 登录状态：当前仅为演示，不代表真实账号验证
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

  // 5. 演示登录：下一步将接入 Supabase Auth
  function handleAuth() {
    if (!authEmail.trim() || !authPassword.trim()) {
      notify("Please enter your email and password.");
      return;
    }

    if (authMode === "register" && (!isStudent || !acceptedTerms)) {
      notify("Please confirm student eligibility and accept the Terms.");
      return;
    }

    const name = authEmail.split("@")[0];
    setUsername(name);
    setLoggedIn(true);
    setAuthOpen(false);
    setAuthEmail("");
    setAuthPassword("");
    notify(
      authMode === "register"
        ? "Demo account created. Real registration will be connected next."
        : "Demo login successful. Real authentication will be connected next."
    );
  }

  function handleLogout() {
    setLoggedIn(false);
    setUsername("");
    setActiveRoom(null);
    notify("You have signed out of this demo.");
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
      <aside
        className={`sidebar ${mobileNavOpen ? "sidebar-open" : ""}`}
      >
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
            <button className="button button-ghost button-wide" onClick={handleLogout}>
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
            <h1>
              Think together.
              <br />
              <span className="gradient-text">Go further.</span>
            </h1>
            <p className="page-subtitle">
              A space for NTCI students to exchange ideas, share resources, and
              learn at their own pace.
            </p>
          </div>

          <button
            className="button button-primary"
            onClick={() => {
              if (requireLogin()) {
                setSection("Research Hub");
                setResourceModalOpen(true);
              }
            }}
          >
            <Plus size={15} />
            Share a resource
          </button>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <span>LEARNING RESOURCES</span>
            <strong>{resources.length}</strong>
            <span>Notes shared by students</span>
          </div>
          <div className="stat-card">
            <span>DISCUSSIONS</span>
            <strong>{discussions.length}</strong>
            <span>Ideas in the community</span>
          </div>
          <div className="stat-card">
            <span>STUDY ROOMS</span>
            <strong>{rooms.length}</strong>
            <span>Spaces to focus together</span>
          </div>
          <div className="stat-card">
            <span>YOUR SAVED NOTES</span>
            <strong>{savedIds.length}</strong>
            <span>Saved in this session</span>
          </div>
        </div>

        <div style={{ height: 30 }} />

        <div className="section-title-row">
          <div>
            <h2>Explore the community</h2>
            <p>Find the right space for what you need today.</p>
          </div>
        </div>

        <div className="resource-grid">
          {[
            {
              title: "Research Hub",
              description:
                "Discover notes, revision guides, and student-created learning resources.",
              icon: BookOpen,
              target: "Research Hub" as Section,
              label: "EXPLORE RESOURCES",
            },
            {
              title: "Study Lounge",
              description:
                "Join a study room, set a focus goal, and work alongside others.",
              icon: Clock3,
              target: "Study Lounge" as Section,
              label: "FIND YOUR SPACE",
            },
            {
              title: "Discussions",
              description:
                "Exchange advice on courses, school life, and learning strategies.",
              icon: MessageCircle,
              target: "Discussions" as Section,
              label: "JOIN THE CONVERSATION",
            },
          ].map(({ title, description, icon: Icon, target, label }) => (
            <button
              key={title}
              className="resource-card"
              style={{ textAlign: "left", cursor: "pointer" }}
              onClick={() => navigate(target)}
            >
              <div className="resource-card-top">
                <span className="avatar">
                  <Icon size={18} />
                </span>
                <ArrowRight size={16} />
              </div>
              <h3 style={{ marginTop: 20, fontSize: 17 }}>{title}</h3>
              <p>{description}</p>
              <div className="resource-card-actions">
                <span className="muted-small">{label}</span>
                <ArrowRight size={14} />
              </div>
            </button>
          ))}
        </div>

        <div style={{ height: 30 }} />

        <div className="section-title-row">
          <div>
            <h2>Recently shared</h2>
            <p>Fresh ideas from the Research Hub.</p>
          </div>
          <button
            className="button button-ghost"
            onClick={() => navigate("Research Hub")}
          >
            View all <ArrowRight size={14} />
          </button>
        </div>

        <div className="resource-grid">
          {resources.slice(0, 3).map((resource) => (
            <article className="resource-card" key={resource.id}>
              <div className="resource-card-top">
                <span className="badge">{resource.subject}</span>
                <span className="muted-small">{resource.grade}</span>
              </div>
              <h3 style={{ marginTop: 15, fontSize: 14 }}>{resource.title}</h3>
              <p>{resource.description}</p>
              <div className="resource-card-actions">
                <span className="muted-small">{resource.author}</span>
                <span className="muted-small">{resource.likes} likes</span>
              </div>
            </article>
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
          <span className="muted-small">{filteredResources.length} RESULTS</span>
        </label>

        <div className="filter-panel">
          <div className="filter-row">
            <span className="filter-label">SUBJECT</span>
            <div className="filter-chips">
              {subjects.map((subject) => (
                <button
                  key={subject}
                  className={`chip ${subjectFilter === subject ? "selected" : ""}`}
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
                  className={`chip ${gradeFilter === grade ? "selected" : ""}`}
                  onClick={() => setGradeFilter(grade)}
                >
                  {grade}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-bottom">
            <span>{filteredResources.length} resources found</span>
            <label style={{ display: "flex", alignItems: "center", gap: 7 }}>
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
                    <span className="muted-small">HOST: {item.creator}</span>
                    <span className="muted-small">
                      <Users size={12} /> {item.online} online*
                    </span>
                  </div>
                  <button
                    className="button button-secondary button-wide"
                    onClick={() => {
                      if (item.privacy === "Private") {
                        notify("Private room codes will be connected to the backend.");
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
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
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
            Share ideas respectfully. Constructive criticism of courses and
            teaching is welcome, but personal attacks, harassment, and
            knowingly false claims are not.
          </p>
          <p>
            Use the report option when content may violate community rules.
            Reports and moderation decisions will be handled through the
            administrative system once it is connected.
          </p>
        </div>
      </div>
    );
  }

  // 16. 反馈页面
  function renderFeedback() {
    return (
      <div className="page-enter">
        <div className="page-heading">
          <div>
            <div className="eyebrow">
              <span className="eyebrow-line" />
              HELP US IMPROVE
            </div>
            <h1>
              Your feedback<span className="gradient-text">.</span>
            </h1>
            <p className="page-subtitle">
              Your thoughts can help make this community better for everyone.
            </p>
          </div>
        </div>

        <div className="panel">
          <h2 style={{ fontSize: 18 }}>How is your experience?</h2>
          <p className="page-subtitle">
            Choose a rating, then tell us what you think.
          </p>

          <div style={{ display: "flex", gap: 8, margin: "22px 0" }}>
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                className="icon-button"
                aria-label={`Rate ${rating} stars`}
                onClick={() => setFeedbackRating(rating)}
                style={{
                  width: 44,
                  height: 44,
                  color:
                    feedbackRating >= rating
                      ? "#f5bd4f"
                      : "var(--muted)",
                  borderColor:
                    feedbackRating >= rating
                      ? "rgba(245,189,79,0.5)"
                      : undefined,
                }}
              >
                <span style={{ fontSize: 22 }}>
                  {feedbackRating >= rating ? "★" : "☆"}
                </span>
              </button>
            ))}
          </div>

          <label className="field-label" htmlFor="feedback">
            YOUR FEEDBACK
          </label>
          <textarea
            id="feedback"
            className="textarea"
            value={feedbackText}
            onChange={(event) => setFeedbackText(event.target.value)}
            placeholder="What works well? What could be improved?"
          />

          <div style={{ height: 15 }} />

          <button
            className="button button-primary"
            onClick={() => {
              if (!feedbackRating) {
                notify("Please select a rating first.");
                return;
              }
              if (!feedbackText.trim()) {
                notify("Please write a short message.");
                return;
              }
              notify(
                "Feedback captured in this demo only. Email delivery will be configured later."
              );
              setFeedbackRating(0);
              setFeedbackText("");
            }}
          >
            <Send size={14} /> Submit feedback
          </button>
        </div>
      </div>
    );
  }

  // 17. 个人主页
  function renderDashboard() {
    return (
      <div className="page-enter">
        <div className="page-heading">
          <div>
            <div className="eyebrow">
              <span className="eyebrow-line" />
              YOUR SPACE
            </div>
            <h1>
              Dashboard<span className="gradient-text">.</span>
            </h1>
            <p className="page-subtitle">
              Your activity and learning contributions.
            </p>
          </div>
        </div>

        {!loggedIn ? (
          <div className="panel empty-dashboard">
            <Users size={27} />
            <h2>Your space, your progress.</h2>
            <p>
              Sign in to access your profile, contributions, and saved
              resources.
            </p>
            <button
              className="button button-primary"
              onClick={() => {
                setAuthMode("login");
                setAuthOpen(true);
              }}
            >
              <LogIn size={14} /> Sign in
            </button>
          </div>
        ) : (
          <>
            <div className="profile-cover" />
            <div className="panel" style={{ borderTop: 0, borderRadius: "0 0 13px 13px" }}>
              <div className="profile-main">
                <span
                  className="avatar"
                  style={{
                    width: 76,
                    height: 76,
                    fontSize: 25,
                    border: "4px solid var(--panel)",
                  }}
                >
                  {username.charAt(0).toUpperCase()}
                </span>
                <div className="profile-identity">
                  <h1>{username}</h1>
                  <p>North Synapse community member</p>
                </div>
                <button
                  className="button button-secondary"
                  onClick={() => notify("Profile editing will be connected to the database next.")}
                >
                  <Settings size={14} /> Edit profile
                </button>
              </div>
            </div>

            <div style={{ height: 15 }} />

            <div className="stats-grid">
              <div className="stat-card">
                <span>PUBLISHED RESOURCES</span>
                <strong>
                  {resources.filter((item) => item.author === username).length}
                </strong>
              </div>
              <div className="stat-card">
                <span>LIKED BY OTHERS</span>
                <strong>
                  {resources
                    .filter((item) => item.author === username)
                    .reduce((sum, item) => sum + item.likes, 0)}
                </strong>
              </div>
              <div className="stat-card">
                <span>SAVED RESOURCES</span>
                <strong>{savedIds.length}</strong>
              </div>
              <div className="stat-card">
                <span>DISCUSSIONS</span>
                <strong>
                  {discussions.filter((item) => item.author === username).length}
                </strong>
              </div>
            </div>

            <div style={{ height: 20 }} />

            <div className="dashboard-columns">
              <div className="panel">
                <h3>Your published resources</h3>
                {resources.filter((item) => item.author === username).length ===
                0 ? (
                  <p className="page-subtitle" style={{ marginTop: 15 }}>
                    Your shared resources will appear here.
                  </p>
                ) : (
                  resources
                    .filter((item) => item.author === username)
                    .map((item) => (
                      <div className="account-detail" key={item.id}>
                        <b>{item.title}</b>
                        <span>
                          {item.likes} likes · {item.saves} saves
                        </span>
                      </div>
                    ))
                )}
              </div>

              <div className="panel">
                <h3>Saved resources</h3>
                {resources
                  .filter((item) => savedIds.includes(item.id))
                  .map((item) => (
                    <div className="account-detail" key={item.id}>
                      <b>{item.title}</b>
                      <span>{item.subject}</span>
                    </div>
                  ))}
                {savedIds.length === 0 && (
                  <p className="page-subtitle" style={{ marginTop: 15 }}>
                    Save a resource to find it here.
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // 18. 简易专注计时器
  function FocusTimer() {
    const [minutes, setMinutes] = useState(25);
    const [seconds, setSeconds] = useState(0);
    const [running, setRunning] = useState(false);

    // 计时器逻辑会在后续版本中单独完善
    function resetTimer() {
      setRunning(false);
      setMinutes(25);
      setSeconds(0);
    }

    return (
      <div className="panel">
        <span className="muted-small">FOCUS TIMER</span>
        <div
          style={{
            fontSize: 48,
            fontWeight: 800,
            letterSpacing: -2,
            margin: "15px 0",
          }}
        >
          {String(minutes).padStart(2, "0")}:
          {String(seconds).padStart(2, "0")}
        </div>
        <p className="page-subtitle">
          {running ? "Focus session in progress" : "Ready when you are"}
        </p>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 8,
            marginTop: 15,
          }}
        >
          <button
            className="button button-primary"
            onClick={() => {
              setRunning((value) => !value);
              notify("The timer controls are a visual prototype for now.");
            }}
          >
            {running ? "Pause" : "Start focus"}
          </button>
          <button className="button button-secondary" onClick={resetTimer}>
            Reset
          </button>
        </div>
      </div>
    );
  }

  // 19. 统一选择页面
  function renderSection() {
    switch (section) {
      case "Overview":
        return renderOverview();
      case "Research Hub":
        return renderResearchHub();
      case "Study Lounge":
        return renderStudyLounge();
      case "Discussions":
        return renderDiscussions();
      case "Announcements":
        return renderAnnouncements();
      case "Feedback":
        return renderFeedback();
      case "Dashboard":
        return renderDashboard();
      default:
        return renderOverview();
    }
  }

  // 20. 页面主体
  return (
    <div className={`app ${darkMode ? "" : "light"}`}>
      {renderSidebar()}

      <div className="main-shell">
        {renderTopbar()}

        <button
          className="announcement-strip"
          onClick={() => navigate("Announcements")}
        >
          <span className="announcement-pill">UPDATE</span>
          <span className="announcement-title">{announcementText}</span>
          <ArrowRight size={14} />
        </button>

        {toast && (
          <div className="toast">
            <Check size={14} />
            <span>{toast}</span>
            <button
              className="icon-button"
              aria-label="Dismiss message"
              onClick={() => setToast("")}
            >
              <X size={13} />
            </button>
          </div>
        )}

        <main className="content">{renderSection()}</main>

        <footer className="site-footer">
          <span className="footer-mark">N</span>
          <span>North Synapse</span>
          <span>Learn · Connect · Grow</span>
          <button
            className="inline-link"
            onClick={() => setTermsOpen(true)}
          >
            Terms of Use
          </button>
          <span>© 2026</span>
        </footer>
      </div>

      {/* 21. 登录与注册弹窗 */}
      {authOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setAuthOpen(false);
          }}
        >
          <div className="modal-window">
            <div className="auth-modal">
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  className="icon-button"
                  aria-label="Close login"
                  onClick={() => setAuthOpen(false)}
                >
                  <X size={15} />
                </button>
              </div>

              <span
                className="avatar"
                style={{ width: 52, height: 52, margin: "5px auto 18px" }}
              >
                <Zap size={23} />
              </span>

              <h2>{authMode === "login" ? "Welcome back." : "Join the community."}</h2>
              <p className="modal-subtitle">
                {authMode === "login"
                  ? "Continue your learning journey."
                  : "Create an account for NTCI students."}
              </p>

              <div className="form-stack" style={{ textAlign: "left", marginTop: 22 }}>
                <label className="field-label" htmlFor="auth-email">
                  EMAIL ADDRESS
                </label>
                <input
                  id="auth-email"
                  className="input"
                  type="email"
                  value={authEmail}
                  onChange={(event) => setAuthEmail(event.target.value)}
                  placeholder="you@example.com"
                />

                <label className="field-label" htmlFor="auth-password">
                  PASSWORD
                </label>
                <input
                  id="auth-password"
                  className="input"
                  type="password"
                  value={authPassword}
                  onChange={(event) => setAuthPassword(event.target.value)}
                  placeholder="Enter your password"
                />

                {authMode === "register" && (
                  <>
                    <label className="check-row">
                      <input
                        type="checkbox"
                        checked={isStudent}
                        onChange={(event) => setIsStudent(event.target.checked)}
                      />
                      <span>
                        I confirm that I am currently a student at North
                        Toronto Collegiate Institute.
                      </span>
                    </label>

                    <label className="check-row">
                      <input
                        type="checkbox"
                        checked={acceptedTerms}
                        onChange={(event) =>
                          setAcceptedTerms(event.target.checked)
                        }
                      />
                      <span>
                        I have read and agree to the{" "}
                        <button
                          className="inline-link"
                          onClick={() => setTermsOpen(true)}
                        >
                          Terms of Use
                        </button>
                        .
                      </span>
                    </label>
                  </>
                )}

                <button
                  className="button button-primary button-wide"
                  style={{ marginTop: 8 }}
                  onClick={handleAuth}
                >
                  {authMode === "login" ? "Sign in" : "Create account"}{" "}
                  <ArrowRight size={14} />
                </button>
              </div>

              <p className="modal-subtitle" style={{ marginTop: 20 }}>
                {authMode === "login"
                  ? "New to North Synapse?"
                  : "Already have an account?"}{" "}
                <button
                  className="inline-link"
                  onClick={() =>
                    setAuthMode((mode) =>
                      mode === "login" ? "register" : "login"
                    )
                  }
                >
                  {authMode === "login" ? "Create an account" : "Sign in"}
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 22. 使用条款弹窗 */}
      {termsOpen && (
        <div className="modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setTermsOpen(false);
        }}>
          <div className="modal-window">
            <div className="terms-modal">
              <div className="modal-heading">
                <div>
                  <h2>Terms of Use</h2>
                  <p className="modal-subtitle">
                    A respectful space for learning and exchange.
                  </p>
                </div>
                <button
                  className="icon-button"
                  aria-label="Close terms"
                  onClick={() => setTermsOpen(false)}
                >
                  <X size={15} />
                </button>
              </div>

              <div className="terms-scroll">
                <section>
                  <h3>1. Eligibility</h3>
                  <p>
                    North Synapse is intended for current students at North
                    Toronto Collegiate Institute. Users must provide truthful
                    information when creating an account.
                  </p>
                </section>
                <section>
                  <h3>2. Respectful discussion</h3>
                  <p>
                    Respectful disagreement and constructive criticism are
                    welcome. Harassment, targeted personal attacks, and
                    knowingly fabricated claims are not permitted.
                  </p>
                </section>
                <section>
                  <h3>3. Content and moderation</h3>
                  <p>
                    Users are responsible for their contributions. Content
                    that violates community rules may be removed, and accounts
                    may be warned or restricted when appropriate.
                  </p>
                </section>
                <section>
                  <h3>4. Reporting</h3>
                  <p>
                    Users may report content they believe violates these terms.
                    Reports should be made honestly and in good faith.
                  </p>
                </section>
                <section>
                  <h3>5. Privacy and account deletion</h3>
                  <p>
                    Account deletion should remove personal data where
                    applicable. Limited records may be retained when reasonably
                    necessary for safety, moderation, or legal obligations.
                  </p>
                </section>
              </div>

              <button
                className="button button-primary button-wide"
                style={{ marginTop: 18 }}
                onClick={() => setTermsOpen(false)}
              >
                I understand
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 23. 发布学习资源弹窗 */}
      {resourceModalOpen && (
        <div className="modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setResourceModalOpen(false);
        }}>
          <div className="modal-window">
            <div className="standard-modal">
              <div className="modal-heading">
                <div>
                  <h2>Share a resource</h2>
                  <p className="modal-subtitle">
                    Help another student understand something new.
                  </p>
                </div>
                <button
                  className="icon-button"
                  aria-label="Close"
                  onClick={() => setResourceModalOpen(false)}
                >
                  <X size={15} />
                </button>
              </div>

              <div className="form-stack">
                <label className="field-label" htmlFor="resource-title">
                  TITLE
                </label>
                <input
                  id="resource-title"
                  className="input"
                  value={resourceTitle}
                  onChange={(event) => setResourceTitle(event.target.value)}
                  placeholder="Give your resource a clear title"
                />

                <label className="field-label" htmlFor="resource-description">
                  DESCRIPTION
                </label>
                <textarea
                  id="resource-description"
                  className="textarea"
                  value={resourceDescription}
                  onChange={(event) =>
                    setResourceDescription(event.target.value)
                  }
                  placeholder="What will other students learn?"
                />

                <label className="field-label" htmlFor="resource-subject">
                  SUBJECT
                </label>
                <select
                  id="resource-subject"
                  value={resourceSubject}
                  onChange={(event) => setResourceSubject(event.target.value)}
                >
                  {subjects.slice(1).map((subject) => (
                    <option key={subject}>{subject}</option>
                  ))}
                </select>

                <label className="field-label" htmlFor="resource-grade">
                  GRADE
                </label>
                <select
                  id="resource-grade"
                  value={resourceGrade}
                  onChange={(event) => setResourceGrade(event.target.value)}
                >
                  {grades.slice(1).map((grade) => (
                    <option key={grade}>{grade}</option>
                  ))}
                  <option>All Grades</option>
                </select>

                <button
                  className="button button-primary button-wide"
                  onClick={publishResource}
                  style={{ marginTop: 10 }}
                >
                  <FileText size={14} /> Publish resource
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 24. 发布讨论弹窗 */}
      {discussionModalOpen && (
        <div className="modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setDiscussionModalOpen(false);
        }}>
          <div className="modal-window">
            <div className="standard-modal">
              <div className="modal-heading">
                <div>
                  <h2>Start a discussion</h2>
                  <p className="modal-subtitle">
                    Ask a question or start a thoughtful conversation.
                  </p>
                </div>
                <button
                  className="icon-button"
                  aria-label="Close"
                  onClick={() => setDiscussionModalOpen(false)}
                >
                  <X size={15} />
                </button>
              </div>

              <div className="form-stack">
                <label className="field-label" htmlFor="discussion-title">
                  TITLE
                </label>
                <input
                  id="discussion-title"
                  className="input"
                  value={discussionTitle}
                  onChange={(event) => setDiscussionTitle(event.target.value)}
                  placeholder="What would you like to discuss?"
                />

                <label className="field-label" htmlFor="discussion-category">
                  CATEGORY
                </label>
                <select
                  id="discussion-category"
                  value={discussionCategory}
                  onChange={(event) =>
                    setDiscussionCategory(event.target.value)
                  }
                >
                  <option>Study Tips</option>
                  <option>Course Selection</option>
                  <option>Computer Science</option>
                  <option>School Life</option>
                  <option>General Discussion</option>
                </select>

                <label className="field-label" htmlFor="discussion-body">
                  DETAILS
                </label>
                <textarea
                  id="discussion-body"
                  className="textarea"
                  value={discussionBody}
                  onChange={(event) => setDiscussionBody(event.target.value)}
                  placeholder="Add context to help others respond."
                />

                <button
                  className="button button-primary button-wide"
                  onClick={publishDiscussion}
                  style={{ marginTop: 10 }}
                >
                  <Send size={14} /> Publish discussion
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 25. 创建自习室弹窗 */}
      {roomModalOpen && (
        <div className="modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setRoomModalOpen(false);
        }}>
          <div className="modal-window">
            <div className="standard-modal">
              <div className="modal-heading">
                <div>
                  <h2>Create a study room</h2>
                  <p className="modal-subtitle">
                    Make a space to focus with other students.
                  </p>
                </div>
                <button
                  className="icon-button"
                  aria-label="Close"
                  onClick={() => setRoomModalOpen(false)}
                >
                  <X size={15} />
                </button>
              </div>

              <div className="form-stack">
                <label className="field-label" htmlFor="room-name">
                  ROOM NAME
                </label>
                <input
                  id="room-name"
                  className="input"
                  value={roomName}
                  onChange={(event) => setRoomName(event.target.value)}
                  placeholder="e.g. Afternoon Math Focus"
                />

                <label className="field-label" htmlFor="room-subject">
                  STUDY TOPIC
                </label>
                <select
                  id="room-subject"
                  value={roomSubject}
                  onChange={(event) => setRoomSubject(event.target.value)}
                >
                  <option>General Study</option>
                  <option>Mathematics</option>
                  <option>Science</option>
                  <option>English</option>
                  <option>Computer Science</option>
                  <option>Exam Preparation</option>
                </select>

                <label className="field-label" htmlFor="room-privacy">
                  ACCESS
                </label>
                <select
                  id="room-privacy"
                  value={roomPrivacy}
                  onChange={(event) =>
                    setRoomPrivacy(event.target.value as "Public" | "Private")
                  }
                >
                  <option value="Public">Public — anyone can join</option>
                  <option value="Private">Private — invite code required</option>
                </select>

                {roomPrivacy === "Private" && (
                  <p className="modal-subtitle">
                    Private room code generation and verification will be
                    implemented with the database.
                  </p>
                )}

                <button
                  className="button button-primary button-wide"
                  onClick={createRoom}
                  style={{ marginTop: 10 }}
                >
                  <Plus size={14} /> Create room
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
