
"use client";

import { useEffect, useMemo, useState } from "react";
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
  Clock3,
  LogIn,
  LogOut,
  Menu,
  X,
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
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadPage() {
      setLoading(true);
      setErrorMessage("");

      const [resourceResult, discussionResult, sessionResult] =
        await Promise.all([
          supabase
            .from("resources")
            .select(
              "id, title, subject, grade, resource_type, description, author, created_at, tags"
            )
            .order("created_at", { ascending: false })
            .limit(12),

          supabase
            .from("discussions")
            .select(
              "id, title, category, content, author, replies_count, is_solved, created_at"
            )
            .order("created_at", { ascending: false })
            .limit(12),

          supabase.auth.getSession(),
        ]);

      if (!mounted) return;

      if (resourceResult.error || discussionResult.error) {
        console.error(
          "Loading error:",
          resourceResult.error?.message,
          discussionResult.error?.message
        );
        setErrorMessage(
          "Some community content could not be loaded. Please check your connection or permissions."
        );
      }

      setResources(resourceResult.data ?? []);
      setDiscussions(discussionResult.data ?? []);
      setUserEmail(sessionResult.data.session?.user.email ?? null);
      setLoading(false);
    }

    loadPage();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user.email ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const filteredResources = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    if (!keyword) return resources;

    return resources.filter((item) =>
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
        .includes(keyword)
    );
  }, [resources, search]);

  const filteredDiscussions = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    if (!keyword) return discussions;

    return discussions.filter((item) =>
      [
        item.title,
        item.category,
        item.content,
        item.author,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [discussions, search]);

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      window.alert("Unable to sign out. Please try again.");
    } else {
      setUserEmail(null);
    }
  }

  function changeSection(name: string) {
    setActiveNav(name);
    setMobileMenuOpen(false);
    setSearch("");
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-CA", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function openLogin() {
    window.location.href = "/login";
  }

  function openRegister() {
    window.location.href = "/register";
  }

  return (
    <div className="min-h-screen bg-[#f7f8fb] text-slate-800">
      <div className="flex min-h-screen">
        {mobileMenuOpen && (
          <button
            aria-label="Close menu"
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 z-40 bg-black/30 md:hidden"
          />
        )}

        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white px-5 py-6 transition-transform md:static md:translate-x-0 ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="mb-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
                <BookOpen size={22} />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">
                  North Synapse
                </h1>
                <p className="text-xs text-slate-500">
                  Learn together.
                </p>
              </div>
            </div>

            <button
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg p-2 hover:bg-slate-100 md:hidden"
              aria-label="Close navigation"
            >
              <X size={20} />
            </button>
          </div>

          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Community
          </p>

          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = activeNav === item.name;

              return (
                <button
                  key={item.name}
                  onClick={() => changeSection(item.name)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${
                    active
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon size={19} />
                  {item.name}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto rounded-2xl bg-slate-50 p-4">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
              <Users size={19} />
            </div>
            <p className="text-sm font-semibold">A community for learners</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Share notes, exchange ideas, and study together.
            </p>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="flex h-[76px] items-center gap-4 px-5 md:px-9">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="rounded-lg p-2 hover:bg-slate-100 md:hidden"
                aria-label="Open navigation"
              >
                <Menu size={21} />
              </button>

              <div className="relative max-w-xl flex-1">
                <Search
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search notes and discussions..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-400 focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-2">
                {userEmail ? (
                  <>
                    <span className="hidden max-w-40 truncate text-sm text-slate-500 lg:block">
                      {userEmail}
                    </span>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium hover:bg-slate-50"
                    >
                      <LogOut size={16} />
                      <span className="hidden sm:inline">Sign out</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={openLogin}
                      className="rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
                    >
                      Sign in
                    </button>
                    <button
                      onClick={openRegister}
                      className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                    >
                      Join us
                    </button>
                  </>
                )}
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-7xl px-5 py-8 md:px-9 md:py-10">
            {activeNav === "Home" && (
              <>
                <section className="mb-9 overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 px-7 py-9 text-white md:px-10 md:py-12">
                  <div className="max-w-2xl">
                    <p className="mb-3 text-sm font-medium text-indigo-100">
                      NORTH SYNAPSE COMMUNITY
                    </p>
                    <h2 className="text-3xl font-bold leading-tight tracking-tight md:text-4xl">
                      Better learning starts
                      <br className="hidden sm:block" /> with sharing.
                    </h2>
                    <p className="mt-4 max-w-xl text-sm leading-6 text-indigo-100 md:text-base">
                      Discover student-made notes, ask questions, and
                      exchange ideas with a community that learns together.
                    </p>
                    <div className="mt-7 flex flex-wrap gap-3">
                      <button
                        onClick={() => changeSection("Resources")}
                        className="flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
                      >
                        <BookOpen size={17} />
                        Explore resources
                      </button>
                      <button
                        onClick={() => changeSection("Discussions")}
                        className="flex items-center gap-2 rounded-xl border border-white/40 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
                      >
                        <MessageSquare size={17} />
                        Join discussions
                      </button>
                    </div>
                  </div>
                </section>

                {errorMessage && (
                  <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    {errorMessage}
                  </div>
                )}

                <section className="mb-10">
                  <div className="mb-5 flex items-end justify-between gap-4">
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-indigo-600">
                        Shared knowledge
                      </p>
                      <h2 className="text-xl font-bold">Latest resources</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Notes and study materials shared by students.
                      </p>
                    </div>
                    <button
                      onClick={() => changeSection("Resources")}
                      className="shrink-0 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      View all
                    </button>
                  </div>

                  {loading ? (
                    <p className="py-8 text-sm text-slate-500">
                      Loading resources...
                    </p>
                  ) : filteredResources.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
                      <BookOpen
                        size={28}
                        className="mx-auto mb-3 text-slate-400"
                      />
                      <p className="font-semibold text-slate-700">
                        No resources to show yet
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Shared notes will appear here once available.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {filteredResources.slice(0, 6).map((item) => (
                        <article
                          key={item.id}
                          className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md"
                        >
                          <div className="mb-4 flex items-start justify-between gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                              <BookOpen size={20} />
                            </div>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
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
                              <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs text-indigo-700">
                                {item.subject}
                              </span>
                            )}
                            {item.grade && (
                              <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                                {item.grade}
                              </span>
                            )}
                          </div>

                          <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
                            <span className="truncate">
                              By {item.author || "Community member"}
                            </span>
                            <span className="shrink-0">
                              {formatDate(item.created_at)}
                            </span>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>

                <section>
                  <div className="mb-5 flex items-end justify-between gap-4">
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-indigo-600">
                        Exchange ideas
                      </p>
                      <h2 className="text-xl font-bold">
                        Community discussions
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Questions, advice, and conversations from students.
                      </p>
                    </div>
                    <button
                      onClick={() => changeSection("Discussions")}
                      className="shrink-0 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      View all
                    </button>
                  </div>

                  {loading ? (
                    <p className="py-8 text-sm text-slate-500">
                      Loading discussions...
                    </p>
                  ) : filteredDiscussions.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
                      <MessageSquare
                        size={28}
                        className="mx-auto mb-3 text-slate-400"
                      />
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
                        <article
                          key={item.id}
                          className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-indigo-200 hover:shadow-sm"
                        >
                          <div className="flex items-start gap-4">
                            <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 sm:flex">
                              <MessageSquare size={19} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                {item.category && (
                                  <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
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
                                <span>
                                  {item.author || "Community member"}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MessageCircle size={14} />
                                  {item.replies_count ?? 0} replies
                                </span>
                                <span>{formatDate(item.created_at)}</span>
                              </div>
                            </div>
                          </div>
                        </article>
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
                    <h2 className="text-2xl font-bold">Resources</h2>
                    <p className="mt-2 text-sm text-slate-500">
                      Browse notes and study materials shared by students.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (!userEmail) {
                        openLogin();
                      } else {
                        window.alert(
                          "The resource submission form will be added next."
                        );
                      }
                    }}
                    className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
                  >
                    <Plus size={17} />
                    Share a resource
                  </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredResources.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-2xl border border-slate-200 bg-white p-5"
                    >
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <BookOpen className="text-indigo-600" size={22} />
                        <span className="text-xs text-slate-500">
                          {formatDate(item.created_at)}
                        </span>
                      </div>
                      <h3 className="font-semibold">{item.title}</h3>
                      <p className="mt-2 text-sm text-slate-500">
                        {item.description || "No description provided."}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {item.subject && (
                          <span className="rounded-lg bg-indigo-50 px-2 py-1 text-xs text-indigo-700">
                            {item.subject}
                          </span>
                        )}
                        {item.grade && (
                          <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-600">
                            {item.grade}
                          </span>
                        )}
                      </div>
                      <p className="mt-4 text-xs text-slate-500">
                        Shared by {item.author || "Community member"}
                      </p>
                    </article>
                  ))}
                </div>

                {!loading && filteredResources.length === 0 && (
                  <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
                    No matching resources found.
                  </p>
                )}
              </section>
            )}

            {activeNav === "Discussions" && (
              <section>
                <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold">Discussions</h2>
                    <p className="mt-2 text-sm text-slate-500">
                      Ask questions and exchange ideas with other students.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (!userEmail) {
                        openLogin();
                      } else {
                        window.alert(
                          "The discussion creation form will be added next."
                        );
                      }
                    }}
                    className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
                  >
                    <Plus size={17} />
                    Start a discussion
                  </button>
                </div>

                <div className="space-y-3">
                  {filteredDiscussions.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-2xl border border-slate-200 bg-white p-5"
                    >
                      <div className="flex flex-wrap gap-2">
                        {item.category && (
                          <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs text-indigo-700">
                            {item.category}
                          </span>
                        )}
                        {item.is_solved && (
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700">
                            Solved
                          </span>
                        )}
                      </div>
                      <h3 className="mt-3 font-semibold">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {item.content || "Open discussion"}
                      </p>
                      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                        <span>
                          By {item.author || "Community member"}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle size={14} />
                          {item.replies_count ?? 0} replies
                        </span>
                        <span>{formatDate(item.created_at)}</span>
                      </div>
                    </article>
                  ))}
                </div>

                {!loading && filteredDiscussions.length === 0 && (
                  <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
                    No matching discussions found.
                  </p>
                )}
              </section>
            )}

            {!["Home", "Resources", "Discussions"].includes(activeNav) && (
              <section className="rounded-3xl border border-slate-200 bg-white px-6 py-14 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  {activeNav === "Study Rooms" && <Users size={26} />}
                  {activeNav === "Announcements" && <Megaphone size={26} />}
                  {activeNav === "Feedback" && <MessageCircle size={26} />}
                </div>
                <h2 className="text-2xl font-bold">{activeNav}</h2>
                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
                  This section will be connected to its database and interactive
                  features in the next development steps.
                </p>
              </section>
            )}

            <footer className="mt-12 border-t border-slate-200 py-6 text-center text-xs text-slate-400">
              North Synapse · A community built around learning together.
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
