
"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  MessageSquare,
  Users,
  Megaphone,
  MessageCircle,
  Search,
  Plus,
  GraduationCap,
  Bookmark,
  Heart,
  CalendarDays,
  UserRound,
  Settings,
  LogIn,
  LogOut,
  Menu,
  X,
  ArrowUpRight,
  FileText,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";

type Resource = {
  id: string;
  title: string;
  subject: string | null;
  grade: string | null;
  resource_type: string | null;
  description: string | null;
  author: string | null;
  author_id: string | null;
  created_at: string;
  tags: string[] | null;
};

type Discussion = {
  id: string;
  title: string;
  category: string | null;
  content: string | null;
  author: string | null;
  replies_count: number | null;
  is_solved: boolean | null;
  created_at: string;
};

type Profile = {
  username: string | null;
  nickname: string | null;
  display_name: string | null;
  grade_level: string | null;
  gender: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: string | null;
};

const navigation = [
  { name: "Home", icon: BookOpen },
  { name: "Resources", icon: GraduationCap },
  { name: "Discussions", icon: MessageSquare },
  { name: "Study Rooms", icon: Users },
  { name: "Announcements", icon: Megaphone },
  { name: "Feedback", icon: MessageCircle },
];

export default function HomePage() {
  const [activeNav, setActiveNav] = useState("Home");
  const [search, setSearch] = useState("");
  const [resources, setResources] = useState<Resource[]>([]);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [myResources, setMyResources] = useState<Resource[]>([]);
  const [bookmarkedResources, setBookmarkedResources] = useState<Resource[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [joinedAt, setJoinedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [editNickname, setEditNickname] = useState("");
  const [editGender, setEditGender] = useState("");
  const [editGrade, setEditGrade] = useState("");
  const [editBio, setEditBio] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadCommunity() {
      setLoading(true);
      setErrorMessage("");

      const [resourceResult, discussionResult, sessionResult] =
        await Promise.all([
          supabase
            .from("resources")
            .select(
              "id, title, subject, grade, resource_type, description, author, author_id, created_at, tags"
            )
            .order("created_at", { ascending: false })
            .limit(30),

          supabase
            .from("discussions")
            .select(
              "id, title, category, content, author, replies_count, is_solved, created_at"
            )
            .order("created_at", { ascending: false })
            .limit(30),

          supabase.auth.getSession(),
        ]);

      if (!mounted) return;

      if (resourceResult.error || discussionResult.error) {
        console.error(
          "Community loading error:",
          resourceResult.error?.message,
          discussionResult.error?.message
        );
        setErrorMessage(
          "Some community content could not be loaded. Check your connection and database permissions."
        );
      }

      setResources(resourceResult.data ?? []);
      setDiscussions(discussionResult.data ?? []);

      const user = sessionResult.data.session?.user ?? null;
      setUserId(user?.id ?? null);
      setUserEmail(user?.email ?? null);
      setJoinedAt(user?.created_at ?? null);
      setLoading(false);
    }

    loadCommunity();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setUserId(user?.id ?? null);
      setUserEmail(user?.email ?? null);
      setJoinedAt(user?.created_at ?? null);

      if (!user) {
        setProfile(null);
        setMyResources([]);
        setBookmarkedResources([]);
        setActiveNav("Home");
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setMyResources([]);
      setBookmarkedResources([]);
      return;
    }

    let mounted = true;

    async function loadProfile() {
      setProfileLoading(true);
      setProfileError("");

      const [profileResult, ownResourcesResult, bookmarksResult] =
        await Promise.all([
          supabase
            .from("profiles")
            .select(
              "username, nickname, display_name, grade_level, gender, avatar_url, bio, role"
            )
            .eq("id", userId)
            .maybeSingle(),

          supabase
            .from("resources")
            .select(
              "id, title, subject, grade, resource_type, description, author, author_id, created_at, tags"
            )
            .eq("author_id", userId)
            .order("created_at", { ascending: false }),

          supabase
            .from("resource_bookmarks")
            .select("resource_id")
            .eq("user_id", userId),
        ]);

      if (!mounted) return;

      if (profileResult.error) {
        console.error("Profile loading error:", profileResult.error.message);
        setProfileError("Your profile could not be loaded.");
      } else {
        setProfile(profileResult.data);
        if (profileResult.data) {
          setEditNickname(
            profileResult.data.nickname ||
            profileResult.data.display_name ||
            profileResult.data.username ||
            ""
          );
          setEditGender(profileResult.data.gender || "");
          setEditGrade(profileResult.data.grade_level || "");
          setEditBio(profileResult.data.bio || "");
        }
      }

      if (ownResourcesResult.error) {
        console.error(
          "Your resources loading error:",
          ownResourcesResult.error.message
        );
        setProfileError((previous) =>
          previous || "Your posts could not be loaded. Check database permissions."
        );
      } else {
        setMyResources(ownResourcesResult.data ?? []);
      }

      if (bookmarksResult.error) {
        console.error(
          "Bookmarks loading error:",
          bookmarksResult.error.message
        );
        setProfileError((previous) =>
          previous || "Bookmarks could not be loaded. Check database permissions."
        );
        setBookmarkedResources([]);
      } else {
        const ids = (bookmarksResult.data ?? []).map(
          (item) => item.resource_id
        );

        if (ids.length === 0) {
          setBookmarkedResources([]);
        } else {
          const savedResult = await supabase
            .from("resources")
            .select(
              "id, title, subject, grade, resource_type, description, author, author_id, created_at, tags"
            )
            .in("id", ids)
            .order("created_at", { ascending: false });

          if (!mounted) return;

          if (savedResult.error) {
            console.error(
              "Saved resources error:",
              savedResult.error.message
            );
            setProfileError((previous) =>
              previous || "Saved resources could not be displayed."
            );
          } else {
            setBookmarkedResources(savedResult.data ?? []);
          }
        }
      }

      setProfileLoading(false);
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [userId]);

  const filteredResources = resources.filter((item) =>
    [
      item.title,
      item.subject,
      item.grade,
      item.resource_type,
      item.description,
      item.author,
      ...(item.tags ?? []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase().trim())
  );

  const filteredDiscussions = discussions.filter((item) =>
    [item.title, item.category, item.content, item.author]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase().trim())
  );

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-CA", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function navigate(name: string) {
    setActiveNav(name);
    setSearch("");
    setMobileMenuOpen(false);
  }

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      window.alert("Unable to sign out. Please try again.");
      return;
    }

    setUserId(null);
    setUserEmail(null);
    setProfile(null);
    setActiveNav("Home");
  }

  function requireLogin(action: string) {
    if (!userId) {
      window.location.href = "/login";
      return;
    }

    window.alert(`${action} will be connected in the next development step.`);
  }

  const displayName =
    profile?.nickname ||
    profile?.display_name ||
    profile?.username ||
    userEmail?.split("@")[0] ||
    "Community member";

  const initials = displayName.trim().charAt(0).toUpperCase() || "N";

  function ResourceCard({ item }: { item: Resource }) {
    return (
      <article className="group rounded-2xl border border-violet-100 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-100/70">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
            <FileText size={21} />
          </div>
          <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">
            {item.resource_type || "Study notes"}
          </span>
        </div>

        <h3 className="line-clamp-2 font-semibold leading-6 text-slate-900">
          {item.title}
        </h3>
        <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">
          {item.description || "No description provided."}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {item.subject && (
            <span className="rounded-lg bg-violet-50 px-2.5 py-1 text-xs text-violet-700">
              {item.subject}
            </span>
          )}
          {item.grade && (
            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
              {item.grade}
            </span>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs text-slate-500">
          <span className="truncate">By {item.author || "Student"}</span>
          <span className="shrink-0">{formatDate(item.created_at)}</span>
        </div>
      </article>
    );
  }

  function DiscussionCard({ item }: { item: Discussion }) {
    return (
      <article className="rounded-2xl border border-violet-100 bg-white p-5 transition hover:border-violet-200 hover:shadow-md hover:shadow-violet-100/60">
        <div className="flex items-start gap-4">
          <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 sm:flex">
            <MessageSquare size={19} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {item.category && (
                <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">
                  {item.category}
                </span>
              )}
              {item.is_solved && (
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  Solved
                </span>
              )}
            </div>
            <h3 className="mt-2 font-semibold leading-6 text-slate-900">
              {item.title}
            </h3>
            <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500">
              {item.content || "Open discussion"}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
              <span>{item.author || "Student"}</span>
              <span className="flex items-center gap-1">
                <MessageCircle size={14} />
                {item.replies_count ?? 0} replies
              </span>
              <span>{formatDate(item.created_at)}</span>
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f5ff] text-slate-800">
      {mobileMenuOpen && (
        <button
          aria-label="Close navigation"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/40 md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[250px] flex-col bg-[#30205f] px-4 py-5 text-white shadow-xl shadow-violet-950/10 transition-transform duration-200 md:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-8 flex items-center justify-between px-2">
          <button
            onClick={() => navigate("Home")}
            className="flex items-center gap-3 text-left"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-400 text-white shadow-lg shadow-violet-950/20">
              <BookOpen size={23} />
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight">North Synapse</p>
              <p className="text-xs text-violet-200">Learn together.</p>
            </div>
          </button>

          <button
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-lg p-2 text-violet-200 hover:bg-white/10 md:hidden"
            aria-label="Close menu"
          >
            <X size={19} />
          </button>
        </div>

        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-violet-300">
          Community
        </p>

        <nav className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = activeNav === item.name;

            return (
              <button
                key={item.name}
                onClick={() => navigate(item.name)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${
                  active
                    ? "bg-violet-400 text-white shadow-md shadow-violet-950/20"
                    : "text-violet-100/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon size={19} strokeWidth={1.8} />
                {item.name}
              </button>
            );
          })}
        </nav>

        <div className="my-5 border-t border-white/10" />

        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-violet-300">
          Personal
        </p>

        <nav className="space-y-1">
          <button
            onClick={() => navigate("Profile")}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${
              activeNav === "Profile"
                ? "bg-violet-400 text-white"
                : "text-violet-100/80 hover:bg-white/10 hover:text-white"
            }`}
          >
            <UserRound size={19} />
            My Profile
          </button>
          <button
            onClick={() => navigate("Settings")}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${
              activeNav === "Settings"
                ? "bg-violet-400 text-white"
                : "text-violet-100/80 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Settings size={19} />
            Settings
          </button>
        </nav>

        <div className="mt-auto rounded-2xl border border-white/10 bg-white/[0.07] p-4">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-violet-400/20 text-violet-200">
            <Users size={19} />
          </div>
          <p className="text-sm font-semibold">Learn as a community</p>
          <p className="mt-1 text-xs leading-5 text-violet-200/75">
            Share knowledge. Ask questions. Grow together.
          </p>
        </div>
      </aside>

      <main className="min-h-screen min-w-0 md:ml-[250px]">
        <header className="sticky top-0 z-30 border-b border-violet-100 bg-white/90 backdrop-blur-xl">
          <div className="flex min-h-[76px] items-center gap-3 px-4 sm:px-6 lg:px-9">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg p-2 text-violet-800 hover:bg-violet-50 md:hidden"
              aria-label="Open navigation"
            >
              <Menu size={21} />
            </button>

            <div className="relative max-w-xl flex-1">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-violet-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search notes and discussions..."
                className="w-full rounded-xl border border-violet-100 bg-violet-50/60 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
              />
            </div>

            {userId ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate("Profile")}
                  className="flex items-center gap-2 rounded-xl p-1.5 pr-2 hover:bg-violet-50"
                  title="My Profile"
                >
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Profile avatar"
                      className="h-9 w-9 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-200 text-sm font-bold text-violet-800">
                      {initials}
                    </span>
                  )}
                  <span className="hidden max-w-32 truncate text-sm font-medium text-slate-700 sm:block">
                    {displayName}
                  </span>
                </button>
                <button
                  onClick={handleSignOut}
                  className="rounded-xl border border-violet-100 p-2.5 text-slate-500 transition hover:bg-violet-50 hover:text-violet-800"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOut size={17} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={() => (window.location.href = "/login")}
                  className="rounded-xl px-3 py-2.5 text-sm font-medium text-violet-800 hover:bg-violet-50"
                >
                  Sign in
                </button>
                <button
                  onClick={() => (window.location.href = "/register")}
                  className="rounded-xl bg-violet-700 px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-800 sm:px-4"
                >
                  Join us
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="mx-auto max-w-[1400px] px-4 py-7 sm:px-6 lg:px-9 lg:py-9">
          {errorMessage && (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {errorMessage}
            </div>
          )}

          {activeNav === "Home" && (
            <>
              <section className="relative mb-9 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#39266e] via-[#6043ad] to-[#8b70dc] px-6 py-9 text-white shadow-xl shadow-violet-200/70 sm:px-9 lg:px-12 lg:py-12">
                <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border border-white/10" />
                <div className="pointer-events-none absolute -right-2 -top-10 h-44 w-44 rounded-full border border-white/10" />
                <div className="relative max-w-2xl">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-violet-200">
                    North Synapse Community
                  </p>
                  <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-[42px]">
                    Knowledge grows
                    <br className="hidden sm:block" /> when we share it.
                  </h1>
                  <p className="mt-4 max-w-xl text-sm leading-6 text-violet-100 sm:text-base">
                    Discover student-made notes, ask questions, and exchange
                    ideas with a community that learns together.
                  </p>
                  <div className="mt-7 flex flex-wrap gap-3">
                    <button
                      onClick={() => navigate("Resources")}
                      className="flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-violet-800 transition hover:bg-violet-50"
                    >
                      Explore resources <ArrowUpRight size={17} />
                    </button>
                    <button
                      onClick={() => navigate("Discussions")}
                      className="flex items-center gap-2 rounded-xl border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                      <MessageSquare size={17} /> Join discussions
                    </button>
                  </div>
                </div>
              </section>

              <section className="mb-10">
                <div className="mb-5 flex items-end justify-between gap-4">
                  <div>
                    <p className="mb-1 text-xs font-bold uppercase tracking-[0.15em] text-violet-600">
                      Shared knowledge
                    </p>
                    <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                      Latest resources
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Notes and study materials shared by students.
                    </p>
                  </div>
                  <button
                    onClick={() => navigate("Resources")}
                    className="shrink-0 text-sm font-semibold text-violet-700 hover:text-violet-900"
                  >
                    View all →
                  </button>
                </div>

                {loading ? (
                  <p className="py-8 text-sm text-slate-500">
                    Loading resources...
                  </p>
                ) : filteredResources.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-violet-200 bg-white px-6 py-10 text-center">
                    <BookOpen className="mx-auto mb-3 text-violet-400" size={28} />
                    <p className="font-semibold text-slate-700">
                      No resources to show yet
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Student-shared notes will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredResources.slice(0, 6).map((item) => (
                      <ResourceCard key={item.id} item={item} />
                    ))}
                  </div>
                )}
              </section>

              <section>
                <div className="mb-5 flex items-end justify-between gap-4">
                  <div>
                    <p className="mb-1 text-xs font-bold uppercase tracking-[0.15em] text-violet-600">
                      Exchange ideas
                    </p>
                    <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                      Community discussions
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Questions, advice, and conversations from students.
                    </p>
                  </div>
                  <button
                    onClick={() => navigate("Discussions")}
                    className="shrink-0 text-sm font-semibold text-violet-700 hover:text-violet-900"
                  >
                    View all →
                  </button>
                </div>

                {loading ? (
                  <p className="py-8 text-sm text-slate-500">
                    Loading discussions...
                  </p>
                ) : filteredDiscussions.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-violet-200 bg-white px-6 py-10 text-center">
                    <MessageSquare className="mx-auto mb-3 text-violet-400" size={28} />
                    <p className="font-semibold text-slate-700">
                      No discussions to show yet
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Community conversations will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredDiscussions.slice(0, 5).map((item) => (
                      <DiscussionCard key={item.id} item={item} />
                    ))}
                  </div>
                )}
              </section>
            </>
          )}

          {activeNav === "Resources" && (
            <section>
              <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-[0.15em] text-violet-600">
                    Resource library
                  </p>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    Resources
                  </h1>
                  <p className="mt-2 text-sm text-slate-500">
                    Browse notes and study materials shared by students.
                  </p>
                </div>
                <button
                  onClick={() => requireLogin("Resource submission")}
                  className="flex items-center gap-2 rounded-xl bg-violet-700 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-violet-800"
                >
                  <Plus size={17} /> Share a resource
                </button>
              </div>
              {loading ? (
                <p className="py-8 text-sm text-slate-500">Loading resources...</p>
              ) : filteredResources.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-violet-200 bg-white p-10 text-center text-sm text-slate-500">
                  No matching resources found.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredResources.map((item) => (
                    <ResourceCard key={item.id} item={item} />
                  ))}
                </div>
              )}
            </section>
          )}

          {activeNav === "Discussions" && (
            <section>
              <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-[0.15em] text-violet-600">
                    Student conversations
                  </p>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    Discussions
                  </h1>
                  <p className="mt-2 text-sm text-slate-500">
                    Ask questions and exchange ideas with other students.
                  </p>
                </div>
                <button
                  onClick={() => requireLogin("Discussion creation")}
                  className="flex items-center gap-2 rounded-xl bg-violet-700 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-800"
                >
                  <Plus size={17} /> Start a discussion
                </button>
              </div>
              {loading ? (
                <p className="py-8 text-sm text-slate-500">Loading discussions...</p>
              ) : filteredDiscussions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-violet-200 bg-white p-10 text-center text-sm text-slate-500">
                  No matching discussions found.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredDiscussions.map((item) => (
                    <DiscussionCard key={item.id} item={item} />
                  ))}
                </div>
              )}
            </section>
          )}

          {activeNav === "Profile" && (
            <section>
              {!userId ? (
                <div className="rounded-3xl border border-violet-100 bg-white px-6 py-14 text-center shadow-sm">
                  <UserRound className="mx-auto mb-4 text-violet-500" size={36} />
                  <h1 className="text-2xl font-bold">Your profile</h1>
                  <p className="mt-2 text-sm text-slate-500">
                    Sign in to view your personal profile and saved resources.
                  </p>
                  <button
                    onClick={() => (window.location.href = "/login")}
                    className="mt-6 rounded-xl bg-violet-700 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-800"
                  >
                    <span className="flex items-center gap-2">
                      <LogIn size={16} /> Sign in
                    </span>
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="mb-1 text-xs font-bold uppercase tracking-[0.15em] text-violet-600">
                        Your space
                      </p>
                      <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                        My Profile
                      </h1>
                    </div>
                    <button
                      onClick={() => navigate("Settings")}
                      className="flex items-center gap-2 rounded-xl border border-violet-200 bg-white px-4 py-3 text-sm font-semibold text-violet-800 hover:bg-violet-50"
                    >
                      <Settings size={17} /> Profile settings
                    </button>
                  </div>

                  <div className="mb-7 overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-sm">
                    <div className="h-28 bg-gradient-to-r from-[#39266e] via-[#6949b9] to-[#a38be8]" />
                    <div className="px-6 pb-6 sm:px-8">
                      <div className="-mt-11 flex flex-wrap items-end gap-4">
                        {profile?.avatar_url ? (
                          <img
                            src={profile.avatar_url}
                            alt="Profile avatar"
                            className="h-24 w-24 rounded-2xl border-4 border-white bg-white object-cover shadow-md"
                          />
                        ) : (
                          <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-white bg-violet-100 text-3xl font-bold text-violet-800 shadow-md">
                            {initials}
                          </div>
                        )}
                        <div className="min-w-0 flex-1 pb-1">
                          <h2 className="text-xl font-bold text-slate-900">
                            {displayName}
                          </h2>
                          <p className="mt-1 break-all text-sm text-slate-500">
                            {userEmail}
                          </p>
                        </div>
                      </div>

                      <p className="mt-5 max-w-2xl text-sm leading-6 text-slate-600">
                        {profile?.bio || "This student has not added a bio yet."}
                      </p>

                      <div className="mt-5 flex flex-wrap gap-2">
                        {profile?.grade_level && (
                          <span className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700">
                            {profile.grade_level}
                          </span>
                        )}
                        {profile?.gender && (
                          <span className="rounded-full bg-pink-50 px-3 py-1.5 text-xs font-medium text-pink-700">
                            {profile.gender}
                          </span>
                        )}
                        {profile?.role && (
                          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                            {profile.role}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-600">
                          <CalendarDays size={13} />
                          Joined {joinedAt ? formatDate(joinedAt) : "Recently"}
                        </span>
                      </div>

                      {!profile && !profileLoading && (
                        <p className="mt-4 text-xs leading-5 text-amber-700">
                          No profile record was found for this account. Some
                          profile fields may appear after a profile row is created.
                        </p>
                      )}
                    </div>
                  </div>

                  {profileError && (
                    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      {profileError}
                    </div>
                  )}

                  <div className="mb-8 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-violet-100 bg-white p-5">
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                        <FileText size={20} />
                      </div>
                      <p className="text-2xl font-bold text-slate-900">
                        {myResources.length}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">Resources shared</p>
                    </div>
                    <div className="rounded-2xl border border-violet-100 bg-white p-5">
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                        <Bookmark size={20} />
                      </div>
                      <p className="text-2xl font-bold text-slate-900">
                        {bookmarkedResources.length}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">Saved resources</p>
                    </div>
                    <div className="rounded-2xl border border-violet-100 bg-white p-5">
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                        <MessageSquare size={20} />
                      </div>
                      <p className="text-2xl font-bold text-slate-900">—</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Discussions started
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Will be connected next
                      </p>
                    </div>
                  </div>

                  <section className="mb-8">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">
                          My shared resources
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                          Notes and materials you have posted.
                        </p>
                      </div>
                    </div>
                    {profileLoading ? (
                      <p className="py-6 text-sm text-slate-500">
                        Loading your profile...
                      </p>
                    ) : myResources.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-violet-200 bg-white p-7 text-sm text-slate-500">
                        You have not shared any resources yet.
                      </div>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {myResources.map((item) => (
                          <ResourceCard key={item.id} item={item} />
                        ))}
                      </div>
                    )}
                  </section>

                  <section>
                    <div className="mb-4">
                      <h2 className="text-lg font-bold text-slate-900">
                        Saved resources
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Materials you have bookmarked for later.
                      </p>
                    </div>
                    {profileLoading ? (
                      <p className="py-6 text-sm text-slate-500">
                        Loading saved resources...
                      </p>
                    ) : bookmarkedResources.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-violet-200 bg-white p-7 text-sm text-slate-500">
                        Your saved resources will appear here when you bookmark
                        materials.
                      </div>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {bookmarkedResources.map((item) => (
                          <ResourceCard key={item.id} item={item} />
                        ))}
                      </div>
                    )}
                  </section>
                </>
              )}
            </section>
          )}


          {activeNav === "Settings" && (
            <section>
              <p className="mb-1 text-xs font-bold uppercase tracking-[0.15em] text-violet-600">
                ACCOUNT
              </p>
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Settings
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Manage your profile and account information.
              </p>
          
              <div className="mt-6 rounded-2xl border border-violet-100 bg-white p-6 shadow-sm">
                <h2 className="font-semibold text-slate-900">
                  Personal information
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Update the information other students see on your profile.
                </p>
          
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      Nickname
                    </span>
                    <input
                      value={editNickname}
                      onChange={(e) => setEditNickname(e.target.value)}
                      maxLength={40}
                      placeholder="Your nickname"
                      className="w-full rounded-xl border border-violet-200 px-4 py-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                    />
                  </label>
          
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      Gender
                    </span>
                    <select
                      value={editGender}
                      onChange={(e) => setEditGender(e.target.value)}
                      className="w-full rounded-xl border border-violet-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                    >
                      <option value="">Prefer not to say</option>
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Non-binary">Non-binary</option>
                      <option value="Other">Other</option>
                    </select>
                  </label>
          
                  <label className="block sm:col-span-2">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      Grade
                    </span>
                    <select
                      value={editGrade}
                      onChange={(e) => setEditGrade(e.target.value)}
                      className="w-full rounded-xl border border-violet-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                    >
                      <option value="">Select your grade</option>
                      <option value="Grade 9">Grade 9</option>
                      <option value="Grade 10">Grade 10</option>
                      <option value="Grade 11">Grade 11</option>
                      <option value="Grade 12">Grade 12</option>
                      <option value="Other">Other</option>
                    </select>
                  </label>
          
                  <label className="block sm:col-span-2">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      About me
                    </span>
                    <textarea
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      maxLength={300}
                      rows={4}
                      placeholder="Tell the community a little about yourself..."
                      className="w-full resize-y rounded-xl border border-violet-200 px-4 py-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                    />
                    <span className="mt-1 block text-right text-xs text-slate-400">
                      {editBio.length}/300
                    </span>
                  </label>
                </div>
          
                {profileError && (
                  <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                    {profileError}
                  </p>
                )}
          
                {profileSuccess && (
                  <p className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
                    {profileSuccess}
                  </p>
                )}
          
                <button
                  type="button"
                  disabled={savingProfile || !userId}
                  onClick={handleSaveProfile}
                  className="mt-6 rounded-xl bg-violet-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingProfile ? "Saving..." : "Save changes"}
                </button>
              </div>
          
              <div className="mt-5 rounded-2xl border border-violet-100 bg-white p-6">
                <h2 className="font-semibold text-slate-900">Account details</h2>
                <p className="mt-2 break-all text-sm text-slate-500">
                  {userEmail || "You are not signed in."}
                </p>
          
                {userId && (
                  <button
                    onClick={handleSignOut}
                    className="mt-5 flex items-center gap-2 rounded-xl border border-violet-200 px-4 py-2.5 text-sm font-medium text-violet-800 hover:bg-violet-50"
                  >
                    <LogOut size={16} /> Sign out
                  </button>
                )}
              </div>
            </section>
          )}

          {![
            "Home",
            "Resources",
            "Discussions",
            "Profile",
            "Settings",
          ].includes(activeNav) && (
            <section className="rounded-3xl border border-violet-100 bg-white px-6 py-14 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                {activeNav === "Study Rooms" && <Users size={26} />}
                {activeNav === "Announcements" && <Megaphone size={26} />}
                {activeNav === "Feedback" && <MessageCircle size={26} />}
              </div>
              <h1 className="text-2xl font-bold text-slate-900">{activeNav}</h1>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
                This section will be connected to its database and interactive
                features in the next development steps.
              </p>
            </section>
          )}

          <footer className="mt-12 border-t border-violet-100 py-6 text-center text-xs text-slate-400">
            North Synapse · A community built around learning together.
          </footer>
        </div>
      </main>
    </div>
  );
}
