
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Bell,
  BookOpen,
  CalendarDays,
  Clock3,
  Compass,
  FileText,
  Flame,
  GraduationCap,
  LayoutDashboard,
  LogOut,
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
  ChevronDown,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";

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

type Discussion = {
  id: string;
  title: string;
  category: string | null;
  content: string;
  author: string;
  replies_count: number;
  is_solved: boolean;
  created_at: string;
};

const discussionColors = ["#dce8ff", "#f8e3d9", "#e2f5f0", "#f0ebff"];

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

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [discussionsLoading, setDiscussionsLoading] = useState(true);
  const [discussionError, setDiscussionError] = useState("");

  useEffect(() => {
  let mounted = true;

  async function loadDiscussions() {
    setDiscussionsLoading(true);
    setDiscussionError("");

    const { data, error } = await supabase
      .from("discussions")
      .select(
        "id, title, category, content, author, replies_count, is_solved, created_at"
      )
      .order("created_at", { ascending: false });

    if (!mounted) return;

    if (error) {
      console.error("Unable to load discussions:", error.message);
      setDiscussionError("Unable to load discussions. Please try again later.");
    } else {
      setDiscussions(data ?? []);
    }

    setDiscussionsLoading(false);
  }

  loadDiscussions();

  return () => {
    mounted = false;
  };
}, []);
  async function handleSignOut() {
    if (signingOut) return;

    setSigningOut(true);

    const { error } = await supabase.auth.signOut();

    setSigningOut(false);

    if (error) {
      window.alert("Unable to sign out. Please try again.");
      return;
    }

    setShowAccountMenu(false);
    setActiveNav("Dashboard");
  }

  function toggleTheme() {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
  }

  const filteredDiscussions = discussions.filter((discussion) =>
    `${discussion.title} ${discussion.content} ${discussion.category ?? ""} ${discussion.author}`
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
            onClick={() => {
              setActiveNav("Dashboard");
              setMobileMenu(false);
            }}
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
            onClick={() => {
              setActiveNav("Dashboard");
              setMobileMenu(false);
            }}
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

          <div className="mt-4 border-t border-[var(--border)] pt-4">
            {authLoading ? (
              <p className="px-2 py-3 text-xs text-[var(--muted)]">
                Checking account...
              </p>
            ) : userEmail ? (
              <div className="flex items-center gap-3 px-2 py-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e7e0ff] text-[#6941c6]">
                  <GraduationCap size={18} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold">{userEmail}</p>
                  <p className="text-[10px] text-[var(--muted)]">
                    Signed in
                  </p>
                </div>

                <button
                  onClick={handleSignOut}
                  disabled={signingOut}
                  aria-label="Sign out"
                  title="Sign out"
                  className="rounded-lg p-2 text-[var(--muted)] hover:bg-[var(--surface-secondary)] disabled:opacity-50"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link
                  href="/login"
                  className="flex w-full items-center justify-center rounded-xl border border-[var(--border)] px-4 py-2.5 text-xs font-semibold hover:bg-[var(--surface-secondary)]"
                >
                  Log In
                </Link>

                <Link
                  href="/register"
                  className="flex w-full items-center justify-center rounded-xl bg-[#8250ed] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#7040d9]"
                >
                  Sign Up
                </Link>
              </div>
            )}
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
                    You&apos;re all caught up. New community notifications
                    will appear here.
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

            <div className="relative">
              {authLoading ? (
                <div className="h-9 w-20 animate-pulse rounded-xl bg-[var(--surface-secondary)]" />
              ) : userEmail ? (
                <>
                  <button
                    onClick={() => setShowAccountMenu(!showAccountMenu)}
                    className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-[var(--surface-secondary)]"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e7e0ff] text-xs font-bold text-[#6941c6]">
                      {userEmail.charAt(0).toUpperCase()}
                    </span>

                    <span className="hidden max-w-[180px] text-left sm:block">
                      <span className="block truncate text-xs font-bold">
                        {userEmail}
                      </span>
                      <span className="block text-[10px] text-[var(--muted)]">
                        Signed in
                      </span>
                    </span>

                    <ChevronDown
                      size={14}
                      className="text-[var(--muted)]"
                    />
                  </button>

                  {showAccountMenu && (
                    <div className="absolute right-0 top-12 z-50 w-44 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-xl">
                      <button
                        onClick={() => {
                          setActiveNav("My Profile");
                          setShowAccountMenu(false);
                        }}
                        className="w-full rounded-lg px-3 py-2 text-left text-xs hover:bg-[var(--surface-secondary)]"
                      >
                        My Profile
                      </button>

                      <button
                        onClick={handleSignOut}
                        disabled={signingOut}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-red-500 hover:bg-[var(--surface-secondary)] disabled:opacity-50"
                      >
                        <LogOut size={14} />
                        {signingOut ? "Signing out..." : "Log Out"}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="rounded-xl px-3 py-2 text-xs font-semibold text-[var(--muted)] hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]"
                  >
                    Log In
                  </Link>

                  <Link
                    href="/register"
                    className="rounded-xl bg-[#8250ed] px-3 py-2 text-xs font-semibold text-white hover:bg-[#7040d9]"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
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
                    {userEmail
                      ? "Welcome back"
                      : "Welcome to North Synapse"}{" "}
                    <span>✦</span>
                  </h1>

                  <p className="mt-1.5 text-sm text-[var(--muted)]">
                    {userEmail
                      ? "A little progress every day adds up to something great."
                      : "A learning community built for curious minds."}
                  </p>
                </div>

                <div className="relative">
                  {userEmail ? (
                    <>
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
                    </>
                  ) : (
                    <Link
                      href="/register"
                      className="flex items-center justify-center gap-2 rounded-xl bg-[#8250ed] px-4 py-3 text-xs font-semibold text-white shadow-lg shadow-purple-200/30 transition hover:bg-[#7040d9]"
                    >
                      <Sparkles size={16} />
                      Join the community
                      <ArrowRight size={14} />
                    </Link>
                  )}
                </div>
              </div>

              {!userEmail && (
                <div className="mb-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)] sm:p-8">
                  <div className="max-w-2xl">
                    <p className="text-xs font-bold uppercase tracking-[1.8px] text-[var(--primary)]">
                      LEARN · SHARE · GROW
                    </p>

                    <h2 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
                      Your next idea could help someone else learn.
                    </h2>

                    <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                      Join North Synapse to connect with fellow students,
                      exchange learning resources, and take part in
                      thoughtful academic discussions.
                    </p>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <Link
                        href="/register"
                        className="rounded-xl bg-[#8250ed] px-5 py-3 text-sm font-semibold text-white hover:bg-[#7040d9]"
                      >
                        Create an account
                      </Link>

                      <Link
                        href="/login"
                        className="rounded-xl border border-[var(--border)] px-5 py-3 text-sm font-semibold hover:bg-[var(--surface-secondary)]"
                      >
                        I already have an account
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  {
                    title: "Active courses",
                    value: "3",
                    detail: "Courses in your workspace",
                    icon: BookOpen,
                    iconBg: "#f0eaff",
                    iconColor: "#8250ed",
                    change: "2",
                  },
                  {
                    title: "Study time",
                    value: "8.5",
                    suffix: "hrs",
                    detail: "This week",
                    icon: Clock3,
                    iconBg: "#e1f5f0",
                    iconColor: "#258f82",
                    change: "12%",
                  },
                  {
                    title: "Learning streak",
                    value: "5",
                    suffix: "days",
                    detail: "Your personal best is 8",
                    icon: Flame,
                    iconBg: "#fff0dd",
                    iconColor: "#d78b35",
                  },
                  {
                    title: "Community contributions",
                    value: "12",
                    detail: "Posts and shared resources",
                    icon: Users,
                    iconBg: "#e5efff",
                    iconColor: "#4c82d9",
                    change: "4",
                  },
                ].map((stat) => {
                  const Icon = stat.icon;

                  return (
                    <div
                      key={stat.title}
                      className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]"
                    >
                      <div className="flex items-start justify-between">
                        <span
                          className="flex h-10 w-10 items-center justify-center rounded-xl"
                          style={{
                            backgroundColor: stat.iconBg,
                            color: stat.iconColor,
                          }}
                        >
                          <Icon size={19} />
                        </span>

                        {stat.change && (
                          <span className="flex items-center gap-1 rounded-full bg-[#e5f6ee] px-2 py-1 text-[10px] font-bold text-[#248763]">
                            <ArrowUpRight size={12} />
                            {stat.change}
                          </span>
                        )}
                      </div>

                      <p className="mt-4 text-xs font-medium text-[var(--muted)]">
                        {stat.title}
                      </p>

                      <p className="mt-1 text-[29px] font-extrabold tracking-tight">
                        {stat.value}
                        {stat.suffix && (
                          <span className="ml-1 text-sm font-semibold">
                            {stat.suffix}
                          </span>
                        )}
                      </p>

                      <p className="mt-1 text-[10px] text-[var(--muted)]">
                        {stat.detail}
                      </p>
                    </div>
                  );
                })}
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

                    <section>
                      <SectionHeading
                        title="Community discussions"
                        action="Explore all"
                        onAction={() => setActiveNav("Discussions")}
                      />
                  
                    <div className="space-y-4">
                      {discussionsLoading ? (
                        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
                          <p className="text-sm text-[var(--muted)]">
                            Loading discussions...
                          </p>
                        </div>
                      ) : discussionError ? (
                        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
                          <p className="text-sm font-semibold">
                            Unable to load discussions
                          </p>
                          <p className="mt-1 text-xs text-[var(--muted)]">
                            Please check your connection and try again later.
                          </p>
                        </div>
                      ) : filteredDiscussions.length === 0 ? (
                        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
                          <Search
                            size={24}
                            className="mx-auto text-[var(--muted)]"
                          />
                          <p className="mt-3 text-sm font-semibold">
                            {search.trim()
                              ? "No discussions found"
                              : "No discussions yet"}
                          </p>
                          <p className="mt-1 text-xs text-[var(--muted)]">
                            {search.trim()
                              ? "Try another search term."
                              : "Be the first to start a discussion."}
                          </p>
                        </div>
                      ) : (
                        filteredDiscussions.map((discussion, index) => (
                          <article
                            key={discussion.id}
                            className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)] sm:p-6"
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-slate-700"
                                style={{
                                  backgroundColor:
                                    discussionColors[index % discussionColors.length],
                                }}
                              >
                                {(discussion.author || "NS")
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </div>
                  
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-xs font-bold">
                                    {discussion.author || "Anonymous"}
                                  </span>
                  
                                  <span className="text-[10px] text-[var(--muted)]">
                                    {new Date(
                                      discussion.created_at
                                    ).toLocaleDateString("en-CA", {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </span>
                  
                                  {discussion.is_solved && (
                                    <span className="rounded-md bg-[#e5f6ee] px-2 py-0.5 text-[10px] font-semibold text-[#248763]">
                                      Solved
                                    </span>
                                  )}
                                </div>
                  
                                <h3 className="mt-2 text-sm font-bold leading-relaxed">
                                  {discussion.title}
                                </h3>
                  
                                <p className="mt-1.5 whitespace-pre-wrap break-words text-xs leading-6 text-[var(--muted)]">
                                  {discussion.content}
                                </p>
                  
                                <div className="mt-4 flex flex-wrap items-center gap-3">
                                  <span className="rounded-lg bg-[var(--primary-soft)] px-2.5 py-1 text-[10px] font-semibold text-[var(--primary)]">
                                    {discussion.category || "General"}
                                  </span>
                  
                                  <span className="flex items-center gap-1 text-[10px] text-[var(--muted)]">
                                    <MessageCircle size={13} />
                                    {discussion.replies_count ?? 0} replies
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
                      Find new perspectives, ask questions, and contribute
                      to your learning community.
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
                  (() => {
                    const Icon = section.icon;
                    return <Icon size={28} />;
                  })()
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

              {activeNav === "My Profile" && userEmail && (
                <p className="mt-3 text-sm text-[var(--muted)]">
                  Signed in as {userEmail}
                </p>
              )}

              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[var(--muted)]">
                This section is being prepared. Its full functionality will
                be added in the next stages of the rebuild.
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
