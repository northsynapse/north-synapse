
"use client";

import { useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Compass,
  FileText,
  Flame,
  GraduationCap,
  LayoutDashboard,
  Menu,
  MessageCircle,
  Moon,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Users,
  X,
} from "lucide-react";

const navigation = [
  { label: "Dashboard", icon: LayoutDashboard, group: "Workspace" },
  { label: "Resources", icon: BookOpen, group: "Workspace" },
  { label: "Discussions", icon: MessageCircle, group: "Workspace" },
  { label: "Study Rooms", icon: Users, group: "Workspace" },
  { label: "Announcements", icon: Bell, group: "Community" },
  { label: "Feedback", icon: MessageCircle, group: "Community" },
];

const courses = [
  {
    code: "MCR3U",
    name: "Functions",
    detail: "Unit 04 · Trigonometry",
    progress: 72,
    color: "#8b6cf6",
    background: "#f0ebff",
    symbol: "ƒ",
  },
  {
    code: "ICS3U",
    name: "Computer Science",
    detail: "Unit 03 · Software Design",
    progress: 58,
    color: "#299d91",
    background: "#e2f5f0",
    symbol: "</>",
  },
  {
    code: "SPH3U",
    name: "Physics",
    detail: "Unit 02 · Dynamics",
    progress: 41,
    color: "#e49a43",
    background: "#fff0dd",
    symbol: "↗",
  },
];

const discussions = [
  {
    initials: "JL",
    name: "Jason Liu",
    time: "12 min ago",
    color: "#dce8ff",
    title: "A different way to understand transformations",
    text: "I made a quick visual explanation of function transformations. Sharing it here in case anyone finds it useful!",
    tag: "Mathematics",
    replies: 8,
    likes: 14,
  },
  {
    initials: "AM",
    name: "Ava Martin",
    time: "36 min ago",
    color: "#f8e3d9",
    title: "Useful resources for learning Python",
    text: "Collected a few practice websites and notes for anyone starting with functions and object-oriented programming.",
    tag: "Computer Science",
    replies: 12,
    likes: 21,
  },
];

const announcements = [
  {
    category: "COMMUNITY",
    title: "Welcome to the new learning space",
    detail: "Explore resources, share ideas, and learn together.",
    color: "#8250ed",
  },
  {
    category: "REMINDER",
    title: "Keep discussions constructive",
    detail: "Give helpful feedback and respect different perspectives.",
    color: "#299d91",
  },
];

function SectionHeading({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-base font-bold tracking-tight">{title}</h2>
      {action && (
        <button
          onClick={onAction}
          className="flex items-center gap-1 text-xs font-semibold text-[var(--primary)] hover:opacity-75"
        >
          {action} <ArrowRight size={14} />
        </button>
      )}
    </div>
  );
}

export default function Home() {
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [search, setSearch] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  function toggleTheme() {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
  }

  const filteredDiscussions = discussions.filter((discussion) =>
    `${discussion.title} ${discussion.text} ${discussion.tag} ${discussion.name}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const section = navigation.find((item) => item.label === activeNav);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {mobileMenu && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setMobileMenu(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col border-r border-[var(--border)] bg-[var(--surface)] transition-transform duration-200 lg:translate-x-0 ${
          mobileMenu ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-[82px] items-center justify-between px-6">
          <button
            className="flex items-center gap-3 text-left"
            onClick={() => setActiveNav("Dashboard")}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#8250ed] text-white shadow-md shadow-purple-200/40">
              <Activity size={23} strokeWidth={2.2} />
            </span>
            <span>
              <span className="block text-[17px] font-extrabold tracking-tight">
                North Synapse
              </span>
              <span className="block text-[10px] font-semibold uppercase tracking-[2px] text-[var(--muted)]">
                Learn together
              </span>
            </span>
          </button>
          <button
            aria-label="Close menu"
            className="rounded-lg p-2 hover:bg-[var(--surface-secondary)] lg:hidden"
            onClick={() => setMobileMenu(false)}
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-4 pt-5">
          <button
            onClick={() => setActiveNav("Dashboard")}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
              activeNav === "Dashboard"
                ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                : "text-[var(--muted)] hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]"
            }`}
          >
            <LayoutDashboard size={18} />
            Dashboard
            {activeNav === "Dashboard" && (
              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />
            )}
          </button>
        </div>

        {["Workspace", "Community"].map((group) => (
          <div className="px-4 pt-7" key={group}>
            <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[1.8px] text-[var(--muted)]">
              {group}
            </p>
            <div className="space-y-1">
              {navigation
                .filter(
                  (item) =>
                    item.group === group && item.label !== "Dashboard"
                )
                .map((item) => {
                  const Icon = item.icon;
                  const active = activeNav === item.label;
                  return (
                    <button
                      key={item.label}
                      onClick={() => {
                        setActiveNav(item.label);
                        setMobileMenu(false);
                      }}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition ${
                        active
                          ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                          : "text-[var(--muted)] hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]"
                      }`}
                    >
                      <Icon size={17} />
                      {item.label}
                      {item.label === "Discussions" && (
                        <span className="ml-auto rounded-md bg-[var(--surface-secondary)] px-1.5 py-0.5 text-[10px]">
                          8
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>
          </div>
        ))}

        <div className="mx-4 mt-8 border-t border-[var(--border)] pt-6">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[1.8px] text-[var(--muted)]">
            Personal
          </p>
          <button
            onClick={() => setActiveNav("My Profile")}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium ${
              activeNav === "My Profile"
                ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                : "text-[var(--muted)] hover:bg-[var(--surface-secondary)]"
            }`}
          >
            <GraduationCap size={17} />
            My Profile
          </button>
          <button
            onClick={() => setActiveNav("Settings")}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium ${
              activeNav === "Settings"
                ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                : "text-[var(--muted)] hover:bg-[var(--surface-secondary)]"
            }`}
          >
            <Settings size={17} />
            Settings
          </button>
        </div>

        <div className="mt-auto p-4">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-[var(--primary)]">
                <Sparkles size={16} />
              </span>
              <span className="text-xs font-bold">A space to grow</span>
            </div>
            <p className="mb-3 text-[11px] leading-relaxed text-[var(--muted)]">
              Share what you know. Discover what you don&apos;t.
            </p>
            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--border)]">
              <div className="h-full w-[68%] rounded-full bg-[var(--primary)]" />
            </div>
            <p className="mt-2 text-[10px] text-[var(--muted)]">
              Community is growing
            </p>
          </div>
          <div className="mt-4 flex items-center gap-3 rounded-xl px-2 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e7e0ff] text-xs font-bold text-[#6941c6]">
              SL
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold">Student Member</p>
              <p className="text-[10px] text-[var(--muted)]">Learning account</p>
            </div>
            <button
              aria-label="Account options"
              onClick={() => setActiveNav("My Profile")}
              className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--surface-secondary)]"
            >
              <MoreHorizontal size={18} />
            </button>
          </div>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-[248px]">
        <header className="sticky top-0 z-30 flex h-[74px] items-center justify-between gap-4 border-b border-[var(--border)] bg-[var(--surface)]/95 px-4 backdrop-blur-xl sm:px-7 xl:px-10">
          <div className="flex min-w-0 items-center gap-3">
            <button
              aria-label="Open navigation"
              onClick={() => setMobileMenu(true)}
              className="rounded-xl p-2 hover:bg-[var(--surface-secondary)] lg:hidden"
            >
              <Menu size={20} />
            </button>
            <div className="relative hidden w-[min(36vw,340px)] sm:block">
              <Search
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search discussions..."
                className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] pl-10 pr-4 text-xs outline-none transition focus:border-[var(--primary)]"
              />
              <span className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-[var(--border)] px-1.5 py-0.5 text-[10px] text-[var(--muted)] md:block">
                /
              </span>
            </div>
            <span className="truncate text-sm font-bold sm:hidden">
              {activeNav}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <button
              aria-label="Toggle theme"
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] text-[var(--muted)] transition hover:bg-[var(--surface-secondary)]"
            >
              {darkMode ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <div className="relative">
              <button
                aria-label="Notifications"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface-secondary)]"
              >
                <Bell size={17} />
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#ef8068]" />
              </button>
              {showNotifications && (
                <div className="absolute right-0 top-12 z-50 w-64 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xl">
                  <p className="font-bold">Notifications</p>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
                    You&apos;re all caught up. New community notifications will
                    appear here.
                  </p>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="mt-3 text-xs font-semibold text-[var(--primary)]"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
            <div className="hidden h-8 w-px bg-[var(--border)] sm:block" />
            <button
              onClick={() => setActiveNav("My Profile")}
              className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-[var(--surface-secondary)]"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e7e0ff] text-[11px] font-bold text-[#6941c6]">
                SL
              </span>
              <span className="hidden text-left sm:block">
                <span className="block text-xs font-bold">Student</span>
                <span className="block text-[10px] text-[var(--muted)]">
                  Member
                </span>
              </span>
              <ChevronDown
                size={14}
                className="hidden text-[var(--muted)] sm:block"
              />
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-[1600px] p-4 sm:p-7 xl:p-10">
          {activeNav === "Dashboard" ? (
            <>
              <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-xs font-medium text-[var(--muted)]">
                    <CalendarDays size={14} />
                    YOUR LEARNING SPACE
                  </div>
                  <h1 className="text-[27px] font-extrabold tracking-tight sm:text-[32px]">
                    Good to have you here <span>✦</span>
                  </h1>
                  <p className="mt-1.5 text-sm text-[var(--muted)]">
                    A little progress every day adds up to something great.
                  </p>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowCreateMenu(!showCreateMenu)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#8250ed] px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-purple-200/30 transition hover:bg-[#7040d9]"
                  >
                    <Plus size={16} />
                    Create something
                    <ChevronDown size={14} />
                  </button>
                  {showCreateMenu && (
                    <div className="absolute right-0 top-12 z-20 w-52 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-xl">
                      {[
                        ["Discussion", MessageCircle],
                        ["Resource", FileText],
                        ["Study room", Users],
                      ].map(([label, Icon]) => {
                        const ItemIcon = Icon as typeof Plus;
                        return (
                          <button
                            key={label as string}
                            onClick={() => {
                              setActiveNav(
                                label === "Discussion"
                                  ? "Discussions"
                                  : label === "Resource"
                                    ? "Resources"
                                    : "Study Rooms"
                              );
                              setShowCreateMenu(false);
                            }}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs hover:bg-[var(--surface-secondary)]"
                          >
                            <ItemIcon size={16} />
                            {label as string}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]">
                  <div className="flex items-start justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0eaff] text-[#8250ed]">
                      <BookOpen size={19} />
                    </span>
                    <span className="flex items-center gap-1 rounded-full bg-[#e5f6ee] px-2 py-1 text-[10px] font-bold text-[#248763]">
                      <ArrowUpRight size={12} /> 2
                    </span>
                  </div>
                  <p className="mt-4 text-xs font-medium text-[var(--muted)]">
                    Active courses
                  </p>
                  <p className="mt-1 text-[29px] font-extrabold tracking-tight">
                    3
                  </p>
                  <p className="mt-1 text-[10px] text-[var(--muted)]">
                    Courses in your workspace
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]">
                  <div className="flex items-start justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e1f5f0] text-[#258f82]">
                      <Clock3 size={19} />
                    </span>
                    <span className="flex items-center gap-1 rounded-full bg-[#e5f6ee] px-2 py-1 text-[10px] font-bold text-[#248763]">
                      <ArrowUpRight size={12} /> 12%
                    </span>
                  </div>
                  <p className="mt-4 text-xs font-medium text-[var(--muted)]">
                    Study time
                  </p>
                  <p className="mt-1 text-[29px] font-extrabold tracking-tight">
                    8.5<span className="ml-1 text-sm font-semibold">hrs</span>
                  </p>
                  <p className="mt-1 text-[10px] text-[var(--muted)]">
                    This week
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]">
                  <div className="flex items-start justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff0dd] text-[#d78b35]">
                      <Flame size={19} />
                    </span>
                    <span className="rounded-full bg-[var(--surface-secondary)] px-2 py-1 text-[10px] font-semibold text-[var(--muted)]">
                      Keep going
                    </span>
                  </div>
                  <p className="mt-4 text-xs font-medium text-[var(--muted)]">
                    Learning streak
                  </p>
                  <p className="mt-1 text-[29px] font-extrabold tracking-tight">
                    5<span className="ml-1 text-sm font-semibold">days</span>
                  </p>
                  <p className="mt-1 text-[10px] text-[var(--muted)]">
                    Your personal best is 8
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]">
                  <div className="flex items-start justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e5efff] text-[#4c82d9]">
                      <Users size={19} />
                    </span>
                    <span className="flex items-center gap-1 rounded-full bg-[#e5f6ee] px-2 py-1 text-[10px] font-bold text-[#248763]">
                      <ArrowUpRight size={12} /> 4
                    </span>
                  </div>
                  <p className="mt-4 text-xs font-medium text-[var(--muted)]">
                    Community contributions
                  </p>
                  <p className="mt-1 text-[29px] font-extrabold tracking-tight">
                    12
                  </p>
                  <p className="mt-1 text-[10px] text-[var(--muted)]">
                    Posts and shared resources
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 items-start gap-7 2xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.85fr)]">
                <div className="min-w-0 space-y-8">
                  <section>
                    <SectionHeading
                      title="Your learning journey"
                      action="All courses"
                      onAction={() => setActiveNav("Resources")}
                    />
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      {courses.map((course) => (
                        <button
                          key={course.code}
                          onClick={() => setActiveNav("Resources")}
                          className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 text-left shadow-[var(--shadow)] transition hover:-translate-y-0.5 hover:border-[var(--primary)]/40"
                        >
                          <div className="mb-5 flex items-center justify-between">
                            <span
                              className="flex h-11 w-11 items-center justify-center rounded-xl text-sm font-bold"
                              style={{
                                backgroundColor: course.background,
                                color: course.color,
                              }}
                            >
                              {course.symbol}
                            </span>
                            <MoreHorizontal
                              size={18}
                              className="text-[var(--muted)]"
                            />
                          </div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                            {course.code}
                          </p>
                          <h3 className="mt-1 text-sm font-bold">
                            {course.name}
                          </h3>
                          <p className="mt-1 text-[11px] text-[var(--muted)]">
                            {course.detail}
                          </p>
                          <div className="mt-5 flex items-center justify-between text-[10px]">
                            <span className="text-[var(--muted)]">
                              Progress
                            </span>
                            <span className="font-bold">
                              {course.progress}%
                            </span>
                          </div>
                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--surface-secondary)]">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${course.progress}%`,
                                backgroundColor: course.color,
                              }}
                            />
                          </div>
                          <div className="mt-4 flex items-center justify-between text-[10px] font-semibold text-[var(--muted)]">
                            <span>Continue learning</span>
                            <ArrowRight
                              size={14}
                              className="transition group-hover:translate-x-1"
                            />
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>

                  <section>
                    <SectionHeading
                      title="Community discussions"
                      action="Explore all"
                      onAction={() => setActiveNav("Discussions")}
                    />
                    <div className="space-y-4">
                      {filteredDiscussions.length > 0 ? (
                        filteredDiscussions.map((discussion) => (
                          <article
                            key={discussion.title}
                            className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)] sm:p-6"
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-slate-700"
                                style={{
                                  backgroundColor: discussion.color,
                                }}
                              >
                                {discussion.initials}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-xs font-bold">
                                    {discussion.name}
                                  </span>
                                  <span className="text-[10px] text-[var(--muted)]">
                                    {discussion.time}
                                  </span>
                                </div>
                                <h3 className="mt-2 text-sm font-bold leading-relaxed">
                                  {discussion.title}
                                </h3>
                                <p className="mt-1.5 text-xs leading-6 text-[var(--muted)]">
                                  {discussion.text}
                                </p>
                                <div className="mt-4 flex flex-wrap items-center gap-3">
                                  <span className="rounded-lg bg-[var(--primary-soft)] px-2.5 py-1 text-[10px] font-semibold text-[var(--primary)]">
                                    {discussion.tag}
                                  </span>
                                  <span className="flex items-center gap-1 text-[10px] text-[var(--muted)]">
                                    <MessageCircle size={13} />
                                    {discussion.replies} replies
                                  </span>
                                  <span className="flex items-center gap-1 text-[10px] text-[var(--muted)]">
                                    <ArrowUpRight size={13} />
                                    {discussion.likes} helpful
                                  </span>
                                </div>
                              </div>
                              <button
                                aria-label="Discussion options"
                                className="rounded-lg p-1 text-[var(--muted)] hover:bg-[var(--surface-secondary)]"
                              >
                                <MoreHorizontal size={18} />
                              </button>
                            </div>
                          </article>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
                          <Search
                            size={24}
                            className="mx-auto text-[var(--muted)]"
                          />
                          <p className="mt-3 text-sm font-semibold">
                            No discussions found
                          </p>
                          <p className="mt-1 text-xs text-[var(--muted)]">
                            Try another search term.
                          </p>
                        </div>
                      )}
                    </div>
                  </section>
                </div>

                <div className="min-w-0 space-y-7">
                  <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]">
                    <SectionHeading title="Weekly activity" />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[28px] font-extrabold tracking-tight">
                          8.5 hrs
                        </p>
                        <p className="mt-1 text-[11px] text-[var(--muted)]">
                          Time invested this week
                        </p>
                      </div>
                      <span className="flex items-center gap-1 rounded-lg bg-[#e5f6ee] px-2 py-1 text-[10px] font-bold text-[#248763]">
                        <ArrowUpRight size={12} /> 12%
                      </span>
                    </div>
                    <div className="mt-6 flex h-[110px] items-end justify-between gap-2">
                      {[
                        { day: "M", height: 40 },
                        { day: "T", height: 65 },
                        { day: "W", height: 48 },
                        { day: "T", height: 82 },
                        { day: "F", height: 58 },
                        { day: "S", height: 96 },
                        { day: "S", height: 28 },
                      ].map((item, index) => (
                        <div
                          key={`${item.day}-${index}`}
                          className="flex flex-1 flex-col items-center gap-2"
                        >
                          <div className="flex h-[88px] w-full items-end">
                            <div
                              className={`w-full rounded-t-md transition-opacity hover:opacity-70 ${
                                index === 5
                                  ? "bg-[#8250ed]"
                                  : "bg-[var(--primary-soft)]"
                              }`}
                              style={{ height: `${item.height}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-[var(--muted)]">
                            {item.day}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]">
                    <SectionHeading
                      title="Community board"
                      action="View all"
                      onAction={() => setActiveNav("Announcements")}
                    />
                    <div className="space-y-5">
                      {announcements.map((announcement) => (
                        <div
                          key={announcement.title}
                          className="flex gap-3"
                        >
                          <span
                            className="mt-1 h-2 w-2 shrink-0 rounded-full"
                            style={{
                              backgroundColor: announcement.color,
                            }}
                          />
                          <div>
                            <p
                              className="text-[9px] font-bold tracking-[1.2px]"
                              style={{
                                color: announcement.color,
                              }}
                            >
                              {announcement.category}
                            </p>
                            <h3 className="mt-1 text-xs font-bold leading-relaxed">
                              {announcement.title}
                            </h3>
                            <p className="mt-1 text-[11px] leading-relaxed text-[var(--muted)]">
                              {announcement.detail}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#7750df] to-[#9b7af5] p-5 text-white shadow-lg shadow-purple-200/20">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                      <Compass size={21} />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-[1.6px] text-white/70">
                      Discover more
                    </p>
                    <h3 className="mt-2 text-lg font-bold leading-snug">
                      Knowledge grows when it is shared.
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-white/80">
                      Find new perspectives, ask questions, and contribute to
                      your learning community.
                    </p>
                    <button
                      onClick={() => setActiveNav("Discussions")}
                      className="mt-5 flex items-center gap-2 rounded-xl bg-white px-3.5 py-2.5 text-xs font-bold text-[#7040d9] transition hover:bg-white/90"
                    >
                      Explore discussions <ArrowRight size={14} />
                    </button>
                  </section>
                </div>
              </div>
            </>
          ) : (
            <section className="mx-auto max-w-2xl py-16 text-center sm:py-24">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
                {section ? (
                  <section.icon size={28} />
                ) : activeNav === "My Profile" ? (
                  <GraduationCap size={28} />
                ) : activeNav === "Settings" ? (
                  <Settings size={28} />
                ) : (
                  <ShieldCheck size={28} />
                )}
              </div>
              <p className="mt-6 text-xs font-bold uppercase tracking-[2px] text-[var(--primary)]">
                North Synapse
              </p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
                {activeNav}
              </h1>
              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[var(--muted)]">
                This section is being prepared. Its full functionality will be
                added in the next stages of the rebuild.
              </p>
              <button
                onClick={() => setActiveNav("Dashboard")}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#8250ed] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#7040d9]"
              >
                <LayoutDashboard size={15} /> Back to Dashboard
              </button>
            </section>
          )}

          <footer className="mt-12 flex flex-col justify-between gap-2 border-t border-[var(--border)] py-5 text-[10px] text-[var(--muted)] sm:flex-row sm:items-center">
            <p>© 2026 North Synapse. Built for curious minds.</p>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#36b58a]" />
                Community-first learning
              </span>
              <span>Version 1.0</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
