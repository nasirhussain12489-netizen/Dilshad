import React, { useState, useMemo } from 'react';
import {
  Award,
  BookOpen,
  Crown,
  Download,
  ExternalLink,
  Eye,
  FileText,
  GraduationCap,
  Home,
  Image as ImageIcon,
  LayoutGrid,
  Library,
  Lock,
  Mail,
  Search,
  Sparkles,
  Trophy,
  Users,
  X,
  ChevronLeft,
  ChevronRight,
  Share2,
  Sliders,
  Upload,
  Check,
} from 'lucide-react';
import {
  AdminUser,
  ClassCode,
  FeedPostRecord,
  LibraryCategoryName,
  LibraryResourceRecord,
  ParticipantRecord,
  PosterRecord,
  PublicBootstrapData,
  WeeklyResultRecord,
  isAiAssistantEnabled,
  isResourcePubliclyVisible,
} from '../types.ts';
import { IlmLogo, downloadPosterAsPng } from './IlmLogo.tsx';
import { PosterStageCard } from './PosterStageCard.tsx';
import { PosterPhotoshopStudio } from './PosterPhotoshopStudio.tsx';
import { ILM_JUNIOR_PROJECTS } from '../lib/ilmJuniorProjects.ts';

export type PublicTab =
  | 'home'
  | 'classes'
  | 'officers'
  | 'posters'
  | 'feed'
  | 'results'
  | 'library'
  | 'about'
  | 'contact';

const VALID_CLASSES: ClassCode[] = ['U1', 'U2', 'U3', 'U4', 'U5', 'U6'];

const LIBRARY_CATEGORIES: LibraryCategoryName[] = [
  'Books',
  'Articles',
  'Journals',
  'Research Papers',
  'Notes',
  'Presentations',
  'Videos',
  'Images',
  'Audio',
  'Code Snippets',
  'Bookmarks',
];

interface PublicWebsiteProps {
  data: PublicBootstrapData;
  currentAdmin: AdminUser | null;
  onOpenAdminLogin: () => void;
  onSwitchToDashboard: () => void;
  onRefreshData?: () => void;
}

export const PublicWebsite: React.FC<PublicWebsiteProps> = ({
  data,
  currentAdmin,
  onOpenAdminLogin,
  onSwitchToDashboard,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<PublicTab>('home');
  const [featuredPosterIndex, setFeaturedPosterIndex] = useState(0);
  const [studioPoster, setStudioPoster] = useState<PosterRecord | null>(null);
  const [copiedFeedId, setCopiedFeedId] = useState<number | null>(null);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Class view state
  const [selectedClass, setSelectedClass] = useState<ClassCode>('U2');
  const [participantSearch, setParticipantSearch] = useState('');

  // Posters view filters
  const [posterClassFilter, setPosterClassFilter] = useState<'ALL' | ClassCode>(
    'ALL'
  );
  const [posterCategoryFilter, setPosterCategoryFilter] =
    useState<string>('ALL');
  const [inspectedPoster, setInspectedPoster] = useState<PosterRecord | null>(
    null
  );

  // Feed view filters & Full Post Viewer Modal
  const [feedClassFilter, setFeedClassFilter] = useState<'ALL' | ClassCode>(
    'ALL'
  );
  const [feedSearch, setFeedSearch] = useState('');
  const [inspectedFeedPost, setInspectedFeedPost] =
    useState<FeedPostRecord | null>(null);
  const [showAllHomeFeed, setShowAllHomeFeed] = useState(false);

  // Weekly Results filters
  const [resultCategoryFilter, setResultCategoryFilter] = useState<
    'ALL' | 'Best Speaker' | 'Best Naat'
  >('ALL');
  const [resultClassFilter, setResultClassFilter] = useState<'ALL' | ClassCode>(
    'ALL'
  );
  const [resultSearch, setResultSearch] = useState('');
  const [inspectedResult, setInspectedResult] =
    useState<WeeklyResultRecord | null>(null);

  // Digital Library filters
  const [libraryScopeFilter, setLibraryScopeFilter] = useState<
    'ALL' | 'COMMON' | ClassCode
  >('ALL');
  const [libraryCategoryFilter, setLibraryCategoryFilter] = useState<
    'ALL' | LibraryCategoryName
  >('ALL');
  const [librarySearch, setLibrarySearch] = useState('');
  const [librarySort, setLibrarySort] = useState<'newest' | 'title'>('newest');
  const [previewResource, setPreviewResource] =
    useState<LibraryResourceRecord | null>(null);

  // Selected Participant Public Profile Modal
  const [inspectedParticipant, setInspectedParticipant] =
    useState<ParticipantRecord | null>(null);
  const [selectedAboutProject, setSelectedAboutProject] = useState<
    'ALL' | number
  >('ALL');

  const canManageClass = (clsCode: ClassCode): boolean => {
    if (!currentAdmin) return false;
    if (
      currentAdmin.role === 'SUPER_ADMIN' ||
      currentAdmin.role === 'TEACHER'
    ) {
      return true;
    }
    return (
      currentAdmin.role === 'CLASS_ADMIN' &&
      currentAdmin.assignedClass === clsCode
    );
  };

  const getClientAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const token = sessionStorage.getItem('ilm_admin_session_token');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  };

  const aiAssistantEnabled = isAiAssistantEnabled(data.settings.aiAssistantEnabled);

  const handleAiChatSubmit = async () => {
    const trimmed = aiQuestion.trim();
    if (!trimmed) {
      setAiError('Please type a question before sending.');
      return;
    }

    setAiBusy(true);
    setAiError(null);
    setAiAnswer('');

    try {
      const res = await fetch('/api/public/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      });

      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.error || 'The AI assistant is unavailable right now.');
      }

      setAiAnswer(payload.answer || 'No answer was returned.');
      setAiQuestion('');
    } catch (err: any) {
      setAiError(err.message || 'Unable to contact the AI assistant.');
    } finally {
      setAiBusy(false);
    }
  };

  // Sequence of published posters for the Home Featured Poster showcase
  const featuredSequence = useMemo(() => {
    const published = data.posters.filter(
      (p) => p.publicationStatus === 'PUBLISHED' && p.participantCount > 0
    );
    return published.length > 0 ? published : data.posters;
  }, [data.posters]);

  const currentFeaturedPoster =
    featuredSequence.length > 0
      ? featuredSequence[featuredPosterIndex % featuredSequence.length]
      : null;

  const handleNextPoster = () => {
    if (featuredSequence.length === 0) return;
    setFeaturedPosterIndex((prev) => (prev + 1) % featuredSequence.length);
  };

  const handlePrevPoster = () => {
    if (featuredSequence.length === 0) return;
    setFeaturedPosterIndex(
      (prev) => (prev - 1 + featuredSequence.length) % featuredSequence.length
    );
  };

  // Latest Best Speaker & Best Naat
  const latestBestSpeaker = useMemo(
    () =>
      data.weeklyResults.find((r) => r.resultCategory === 'Best Speaker') ||
      null,
    [data.weeklyResults]
  );

  const latestBestNaat = useMemo(
    () =>
      data.weeklyResults.find((r) => r.resultCategory === 'Best Naat') || null,
    [data.weeklyResults]
  );

  // Filtered Posters
  const filteredPosters = useMemo(() => {
    return data.posters.filter((p) => {
      if (posterClassFilter !== 'ALL' && p.classCode !== posterClassFilter)
        return false;
      if (
        posterCategoryFilter !== 'ALL' &&
        p.categoryName !== posterCategoryFilter
      )
        return false;
      return true;
    });
  }, [data.posters, posterClassFilter, posterCategoryFilter]);

  // Filtered Feed Posts
  const filteredFeedPosts = useMemo(() => {
    return data.feedPosts.filter((fp) => {
      if (feedClassFilter !== 'ALL' && fp.classCode !== feedClassFilter)
        return false;
      if (feedSearch.trim()) {
        const q = feedSearch.toLowerCase();
        return (
          fp.title.toLowerCase().includes(q) ||
          fp.caption.toLowerCase().includes(q) ||
          fp.classCode.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [data.feedPosts, feedClassFilter, feedSearch]);

  // Filtered Weekly Results
  const filteredResults = useMemo(() => {
    return data.weeklyResults.filter((r) => {
      if (
        resultCategoryFilter !== 'ALL' &&
        r.resultCategory !== resultCategoryFilter
      )
        return false;
      if (resultClassFilter !== 'ALL' && r.winnerClass !== resultClassFilter)
        return false;
      if (resultSearch.trim()) {
        const q = resultSearch.toLowerCase();
        return (
          r.winnerName.toLowerCase().includes(q) ||
          r.weekLabel.toLowerCase().includes(q) ||
          r.winnerClass.toLowerCase().includes(q) ||
          (r.remarks || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [
    data.weeklyResults,
    resultCategoryFilter,
    resultClassFilter,
    resultSearch,
  ]);

  const publicLibraryResources = useMemo(
    () =>
      data.libraryResources.filter((item) =>
        isResourcePubliclyVisible(item.publicationStatus)
      ),
    [data.libraryResources]
  );

  // Filtered Library Resources
  const filteredLibrary = useMemo(() => {
    const list = publicLibraryResources.filter((item) => {
      if (
        libraryScopeFilter !== 'ALL' &&
        item.libraryScope !== libraryScopeFilter
      )
        return false;
      if (
        libraryCategoryFilter !== 'ALL' &&
        item.category !== libraryCategoryFilter
      )
        return false;
      if (librarySearch.trim()) {
        const q = librarySearch.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.author.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
        );
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (librarySort === 'title') {
        return a.title.localeCompare(b.title);
      }
      return (
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });
  }, [
    publicLibraryResources,
    libraryScopeFilter,
    libraryCategoryFilter,
    librarySearch,
    librarySort,
  ]);

  const handleDownloadResource = (res: LibraryResourceRecord) => {
    if (res.fileUrl.startsWith('http')) {
      window.open(res.fileUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    if (res.fileUrl.startsWith('/')) {
      const link = document.createElement('a');
      link.href = res.fileUrl;
      link.download = `${res.title.replace(/\s+/g, '_')}.${res.fileType.toLowerCase()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }
    // Synthesize downloadable document for embedded text/code resources
    const content = `ILM — INTEGRATED LEARNING MASTER\nDIGITAL LIBRARY RESOURCE\n========================================\nTitle: ${res.title}\nCategory: ${res.category}\nLibrary Scope: ${res.libraryScope}\nAuthor: ${res.author}\nFormat: ${res.fileType} (${res.fileSize})\n\nDescription:\n${res.description}\n\nContent / Excerpt:\n${
      res.contentPreview || 'Official ILM educational resource.'
    }\n`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const ext = res.category === 'Code Snippets' ? 'ts' : 'txt';
    link.href = url;
    link.download = `ILM_${res.libraryScope}_${res.title.replace(
      /[^a-zA-Z0-9_-]/g,
      '_'
    )}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const handleDownloadFeedPost = (fp: FeedPostRecord) => {
    const link = document.createElement('a');
    link.href = fp.mediaUrl;
    link.download = `ILM_${fp.classCode}_Feed_${fp.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShareFeedPost = async (fp: FeedPostRecord) => {
    const shareUrl = fp.mediaUrl.startsWith('http')
      ? fp.mediaUrl
      : window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: fp.title,
          text: fp.caption,
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedFeedId(fp.id);
      setTimeout(() => setCopiedFeedId(null), 2500);
    } catch {
      // ignore
    }
  };

  const handleEditFeedPostInStudio = (fp: FeedPostRecord) => {
    const matchingPoster =
      data.posters.find((p) => p.classCode === fp.classCode) || {
        id: data.posters[0]?.id || 1,
        classCode: fp.classCode,
        categoryName: 'All Categories',
        title: fp.title,
        subtitle: fp.caption,
        posterImageUrl: fp.mediaUrl,
        participantCount: data.participants.filter(
          (p) => p.classCode === fp.classCode
        ).length,
        participantsSnapshot: JSON.stringify(
          data.participants.filter((p) => p.classCode === fp.classCode)
        ),
        generationStatus: 'GENERATED' as const,
        publicationStatus: 'PUBLISHED' as const,
        isFeatured: true,
        updatedAt: fp.createdAt,
      };
    setStudioPoster({
      ...matchingPoster,
      posterImageUrl: fp.mediaUrl,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#07080C] text-neutral-100 pb-16 md:pb-0">
      {/* =====================================================================
          TOP BAR CONTRACT (3 ZONES: Brand | 5 Primary Nav Links | 1 Primary CTA)
         ===================================================================== */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-6 py-4 bg-[#07080C]/95 backdrop-blur-md border-b border-neutral-800/90">
        {/* Zone 1: Official Transparent ILM Logo */}
        <button
          type="button"
          onClick={() => setActiveTab('home')}
          className="inline-flex items-center whitespace-nowrap shrink-0 cursor-pointer"
        >
          <IlmLogo size="sm" showSubtitle />
        </button>

        {/* Zone 2: Primary navigation links (Home, Classes, Posters, Feed, Weekly Results, Library, About ILM) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-300">
          {(
            [
              { id: 'home', label: 'Home' },
              { id: 'classes', label: 'Classes' },
              { id: 'posters', label: 'Posters' },
              { id: 'feed', label: 'Feed' },
              { id: 'results', label: 'Weekly Results' },
              { id: 'library', label: 'Library' },
              { id: 'about', label: 'About ILM' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
                activeTab === item.id
                  ? 'text-[#F3D068] border-[#D4AF37]'
                  : 'text-neutral-300 border-transparent hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Zone 3: 1 primary action (Gmail Login) */}
        <div className="flex items-center gap-3 shrink-0">
          {currentAdmin ? (
            <button
              type="button"
              onClick={onSwitchToDashboard}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-neutral-950 bg-gradient-to-r from-[#C89D2E] via-[#E8C55B] to-[#C89D2E] rounded-lg hover:brightness-110 transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>{currentAdmin.email}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenAdminLogin}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#F3D068] bg-[#141722] border border-[#D4AF37]/45 rounded-lg hover:bg-[#1B2030] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Gmail Login</span>
            </button>
          )}
        </div>
      </header>

      {/* Secondary Sub-Navigation Toolbar for Feed / Gallery, About ILM, Contact */}
      <div className="bg-[#0B0D14] border-b border-neutral-900 px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-neutral-400">
            <span className="text-[#D4AF37] font-semibold">
              {data.settings.motto || 'Learn · Compete · Grow'}
            </span>
            <span aria-hidden="true">·</span>
            <span>Classes U1 – U6 Official Academic Portal</span>
          </div>

          <div className="flex items-center gap-4">
            {(
              [
                { id: 'feed', label: 'Public Feed' },
                { id: 'officers', label: 'Class Teachers & Officers' },
                { id: 'about', label: 'About ILM (10 Projects)' },
                { id: 'contact', label: 'Contact' },
              ] as const
            ).map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => setActiveTab(sub.id)}
                className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === sub.id
                    ? 'text-[#F3D068] font-semibold underline underline-offset-4'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* =====================================================================
          MAIN PUBLIC CONTENT VIEWPORT
         ===================================================================== */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* -------------------------------------------------------------------
            TAB 1: HOME PAGE (PUBLIC FEED SECTION FIRST -> FEATURED POSTER -> SHORTCUTS)
           ------------------------------------------------------------------- */}
        {activeTab === 'home' && (
          <div className="space-y-14">
            {/* ===============================================================
                1. PUBLIC HOME FEED SECTION (DISPLAYED BEFORE POSTER, COMPACT PREVIEW + FULL VIEW MODAL)
               =============================================================== */}
            <section
              aria-label="Class & Community Feed"
              className="p-5 sm:p-7 rounded-2xl bg-gradient-to-b from-[#0E1118] via-[#0B0E15] to-[#090B10] border-2 border-[#D4AF37]/45 shadow-2xl space-y-6"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[11px] font-bold uppercase tracking-widest text-[#F3D068] mb-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Live Class & Community Feed</span>
                  </div>
                  <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
                    ILM Public Feed & Shared Class Posters
                  </h2>
                  <p className="text-xs sm:text-sm text-neutral-400 mt-1">
                    Preview shared posters, photographs, and announcements from Classes U1–U6. Click <strong className="text-[#F3D068]">View Full Post</strong> on any card to open the complete poster & details.
                  </p>
                </div>

                {currentAdmin && (
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Quick Upload Pre-Made Poster to Feed (Strictly for Logged-In Super Admin, Teacher, or Class Admin) */}
                    <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#C89D2E] via-[#E8C55B] to-[#C89D2E] hover:brightness-110 text-neutral-950 font-bold text-xs cursor-pointer shadow">
                      <Upload className="w-3.5 h-3.5" />
                      <span>+ Upload & Post to Feed</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const base64Data = await new Promise<string>(
                              (resolve, reject) => {
                                const reader = new FileReader();
                                reader.onload = () =>
                                  resolve(String(reader.result || ''));
                                reader.onerror = () =>
                                  reject(new Error('Failed to read file'));
                                reader.readAsDataURL(file);
                              }
                            );
                            const targetCls =
                              currentAdmin.role === 'CLASS_ADMIN' &&
                              currentAdmin.assignedClass
                                ? currentAdmin.assignedClass
                                : feedClassFilter === 'ALL'
                                ? 'U1'
                                : feedClassFilter;
                            const targetPoster =
                              data.posters.find(
                                (p) => p.classCode === targetCls
                              ) || data.posters[0];
                            if (!targetPoster) return;
                            await fetch(
                              `/api/public/posters/${targetPoster.id}/share-to-feed`,
                              {
                                method: 'POST',
                                headers: getClientAuthHeaders(),
                                body: JSON.stringify({
                                  title: `Class ${targetCls} — ${file.name.replace(/\.[^.]+$/, '')}`,
                                  caption: `Uploaded and shared to the ILM Class ${targetCls} Public Feed.`,
                                  mediaUrl: base64Data,
                                  submittedByName: currentAdmin.name,
                                }),
                              }
                            );
                            if (onRefreshData) onRefreshData();
                          } catch {
                            // ignore
                          } finally {
                            e.target.value = '';
                          }
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Class Filter Pills & Search */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  {(['ALL', ...VALID_CLASSES] as const).map((cls) => (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => setFeedClassFilter(cls)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        feedClassFilter === cls
                          ? 'bg-[#D4AF37] text-neutral-950 shadow'
                          : 'bg-[#121622] text-neutral-300 border border-neutral-800 hover:text-white'
                      }`}
                    >
                      {cls === 'ALL' ? 'All Classes' : `Class ${cls}`}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={feedSearch}
                    onChange={(e) => setFeedSearch(e.target.value)}
                    placeholder="Search feed posts..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#121622] border border-neutral-800 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>
              </div>

              {/* Compact Feed Preview Cards (Partial view on Home; Full view when clicked) */}
              {filteredFeedPosts.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {(showAllHomeFeed
                      ? filteredFeedPosts
                      : filteredFeedPosts.slice(0, 6)
                    ).map((post) => (
                      <div
                        key={post.id}
                        className="group rounded-xl bg-[#111520] border border-neutral-800 hover:border-[#D4AF37]/60 overflow-hidden flex flex-col justify-between transition-all shadow-lg"
                      >
                        <div>
                          {/* Compact Cropped Preview Thumbnail (Not full size until user clicks View) */}
                          <div
                            onClick={() => setInspectedFeedPost(post)}
                            className="relative h-44 bg-[#0B0D14] overflow-hidden cursor-pointer border-b border-neutral-800/80"
                          >
                            <img
                              src={post.mediaUrl}
                              alt={post.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent flex items-end justify-between p-3">
                              <span className="px-2.5 py-0.5 rounded-full bg-[#D4AF37] text-neutral-950 font-bold text-[10px] uppercase tracking-wider">
                                Class {post.classCode} · {post.mediaType}
                              </span>
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/75 border border-[#D4AF37]/60 text-[#F3D068] text-[11px] font-semibold">
                                <Eye className="w-3.5 h-3.5" />
                                <span>View Full</span>
                              </span>
                            </div>
                          </div>

                          {/* Truncated Preview Text */}
                          <div className="p-4">
                            <h3 className="font-display font-bold text-white text-sm line-clamp-1">
                              {post.title}
                            </h3>
                            <p className="text-xs text-neutral-400 mt-1 line-clamp-2">
                              {post.caption}
                            </p>
                          </div>
                        </div>

                        {/* Card Footer with View Full Post, Share, Edit & Download */}
                        <div className="px-4 pb-3.5 pt-2.5 border-t border-neutral-800/80 flex items-center justify-between gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => setInspectedFeedPost(post)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D4AF37] hover:brightness-110 text-neutral-950 font-bold text-xs cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Full Post</span>
                          </button>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleShareFeedPost(post)}
                              className="p-1.5 rounded-lg bg-[#161B28] hover:bg-[#1E2536] text-emerald-300 border border-emerald-600/40 cursor-pointer"
                              title="Share Feed Post"
                            >
                              {copiedFeedId === post.id ? (
                                <Check className="w-3.5 h-3.5" />
                              ) : (
                                <Share2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                            {canManageClass(post.classCode) && (
                              <button
                                type="button"
                                onClick={() => handleEditFeedPostInStudio(post)}
                                className="p-1.5 rounded-lg bg-[#161B28] hover:bg-[#1E2536] text-[#F3D068] border border-[#D4AF37]/40 cursor-pointer"
                                title="Edit in Photoshop Studio"
                              >
                                <Sliders className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDownloadFeedPost(post)}
                              className="p-1.5 rounded-lg bg-[#161B28] hover:bg-[#1E2536] text-neutral-200 border border-neutral-700 cursor-pointer"
                              title="Download"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {filteredFeedPosts.length > 6 && (
                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAllHomeFeed((prev) => !prev)}
                        className="px-5 py-2 rounded-xl bg-[#141824] hover:bg-[#1B2130] text-[#F3D068] border border-[#D4AF37]/45 text-xs font-semibold cursor-pointer"
                      >
                        {showAllHomeFeed
                          ? 'Show Compact Feed Preview'
                          : `Show All ${filteredFeedPosts.length} Feed Posts`}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-8 rounded-xl bg-[#111520] border border-neutral-800 text-center text-sm text-neutral-400">
                  No feed posts match your filter yet. Click “Share to Feed” on any class poster below to publish!
                </div>
              )}
            </section>

            {/* ===============================================================
                2. FEATURED UNIFIED CLASS POSTER SHOWCASE (AFTER FEED)
               =============================================================== */}
            <section aria-label="Featured Competition Poster">
              {currentFeaturedPoster ? (
                <PosterStageCard
                  poster={currentFeaturedPoster}
                  liveParticipants={data.participants}
                  isHero
                  canManage={false}
                  onChangePoster={handleNextPoster}
                  onPrevPoster={handlePrevPoster}
                  totalPostersCount={featuredSequence.length}
                  currentPosterIndex={
                    featuredPosterIndex % Math.max(1, featuredSequence.length)
                  }
                  onInspectPoster={(p) => setInspectedPoster(p)}
                  onOpenStudio={(p) => setStudioPoster(p)}
                  onPosterUpdated={onRefreshData}
                />
              ) : (
                <div className="p-12 rounded-2xl bg-[#0E1118] border border-[#D4AF37]/40 text-center">
                  <IlmLogo size="lg" showSubtitle />
                  <h1 className="font-display text-3xl font-bold text-white mt-6">
                    Talent Today · Leaders Tomorrow
                  </h1>
                  <p className="text-sm text-neutral-400 mt-2">
                    Add participants in any class (U1–U6) to automatically generate the featured competition poster.
                  </p>
                </div>
              )}
            </section>

            {/* Classes (U1 - U6) Shortcuts */}
            <section>
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
                    Classes (U1 – U6)
                  </h2>
                  <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
                    Explore participant rosters, competition capacities, posters, and class libraries across all six cohorts.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('classes')}
                  className="text-xs font-semibold text-[#F3D068] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                >
                  View All Classes →
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {VALID_CLASSES.map((clsCode) => {
                  const classParticipantCount = data.participants.filter(
                    (p) => p.classCode === clsCode
                  ).length;
                  const classPosterCount = data.posters.filter(
                    (p) => p.classCode === clsCode
                  ).length;
                  return (
                    <button
                      key={clsCode}
                      type="button"
                      onClick={() => {
                        setSelectedClass(clsCode);
                        setActiveTab('classes');
                      }}
                      className="group p-5 rounded-xl bg-[#0E1118] hover:bg-[#141824] border border-neutral-800 hover:border-[#D4AF37]/60 text-center transition-all flex flex-col items-center cursor-pointer"
                    >
                      <div className="w-11 h-11 rounded-lg bg-[#161A26] border border-[#D4AF37]/35 flex items-center justify-center mb-3 group-hover:border-[#F3D068]">
                        <GraduationCap className="w-5 h-5 text-[#F3D068]" />
                      </div>
                      <span className="font-display text-xl font-bold text-white">
                        {clsCode}
                      </span>
                      <span className="text-xs text-neutral-400 mt-0.5">
                        Class Cohort
                      </span>
                      <div className="mt-3 pt-2.5 border-t border-neutral-800/80 w-full text-[11px] text-neutral-400 font-mono-tabular">
                        <span>{classParticipantCount} / 24 Scholars</span>
                        <span className="mx-1" aria-hidden="true">
                          ·
                        </span>
                        <span>{classPosterCount} Poster</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Weekly Official Results Highlight (Best Speaker & Best Naat) */}
            <section>
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
                    Official Weekly Results
                  </h2>
                  <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
                    Honoring the latest Best Speaker and Best Naat laureates across ILM cohorts.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('results')}
                  className="text-xs font-semibold text-[#F3D068] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                >
                  View Permanent Archive →
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  {
                    category: 'Best Speaker',
                    record: latestBestSpeaker,
                  },
                  {
                    category: 'Best Naat',
                    record: latestBestNaat,
                  },
                ].map(({ category, record }) => (
                  <div
                    key={category}
                    onClick={() => record && setInspectedResult(record)}
                    className="p-6 rounded-xl bg-[#0E1118] border border-[#D4AF37]/40 hover:border-[#F3D068] transition-all flex items-center gap-5 cursor-pointer"
                  >
                    {record ? (
                      <>
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-[#D4AF37] shrink-0 bg-[#161922]">
                          <img
                            src={record.winnerPhotoUrl}
                            alt={record.winnerName}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover object-top"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-[#F3D068] uppercase tracking-wider">
                            {record.resultCategory}
                          </div>
                          <h3 className="font-display text-xl sm:text-2xl font-bold text-white mt-1 truncate">
                            {record.winnerName}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-300 mt-1.5">
                            <span className="font-semibold text-white">
                              Class {record.winnerClass}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{record.weekLabel}</span>
                          </div>
                          {record.remarks && (
                            <p className="text-xs text-neutral-400 mt-2 line-clamp-2">
                              {record.remarks}
                            </p>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="py-4 text-sm text-neutral-400">
                        No {category} result published yet.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Recently Added Public Library Resources */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
                    Digital Library Highlights
                  </h2>
                  <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
                    Explore books, research papers, notes, and multimedia learning resources across ILM cohorts.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('library')}
                  className="text-xs font-semibold text-[#F3D068] hover:underline cursor-pointer"
                >
                  Open Library →
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {publicLibraryResources.slice(0, 4).map((res) => (
                  <div
                    key={res.id}
                    className="p-4 rounded-xl bg-[#0E1118] border border-neutral-800 hover:border-[#D4AF37]/45 transition-colors flex items-start justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs text-[#D4AF37]">
                        <span>{res.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {res.libraryScope === 'COMMON'
                            ? 'Common Library'
                            : `Class ${res.libraryScope}`}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono-tabular text-neutral-400">
                          {res.fileType}
                        </span>
                      </div>
                      <h3 className="font-semibold text-sm text-white mt-1 truncate">
                        {res.title}
                      </h3>
                      <p className="text-xs text-neutral-400 mt-0.5 line-clamp-1">
                        {res.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setPreviewResource(res)}
                        className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 cursor-pointer"
                        title="Preview resource"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadResource(res)}
                        className="p-2 rounded-lg bg-[#161A26] hover:bg-[#1E2334] text-[#F3D068] border border-[#D4AF37]/40 cursor-pointer"
                        title="Download resource"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* -------------------------------------------------------------------
            TAB 2: CLASSES (U1 – U6) COHORT EXPLORER & PUBLIC PROFILES
           ------------------------------------------------------------------- */}
        {activeTab === 'classes' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
                  ILM Academic Cohorts (U1 – U6)
                </h1>
                <p className="text-sm text-neutral-400 mt-1">
                  Select a class to inspect competition category capacities, public scholar profiles, generated posters, and class library resources.
                </p>
              </div>

              {/* Segmented Class Filter (Strictly U1-U6) */}
              <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-[#0E1118] border border-neutral-800">
                {VALID_CLASSES.map((cls) => (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => setSelectedClass(cls)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                      selectedClass === cls
                        ? 'bg-[#D4AF37] text-neutral-950 shadow'
                        : 'text-neutral-300 hover:text-white hover:bg-neutral-900'
                    }`}
                  >
                    {cls}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Class Header & Competition Categories Capacity */}
            {(() => {
              const clsInfo = data.classes.find((c) => c.code === selectedClass);
              const classParticipants = data.participants.filter(
                (p) =>
                  p.classCode === selectedClass &&
                  (!participantSearch.trim() ||
                    p.fullName
                      .toLowerCase()
                      .includes(participantSearch.toLowerCase()) ||
                    p.categoryName
                      .toLowerCase()
                      .includes(participantSearch.toLowerCase()))
              );
              const classPosters = data.posters.filter(
                (p) => p.classCode === selectedClass
              );
              const classLibraryItems = publicLibraryResources.filter(
                (lr) => lr.libraryScope === selectedClass
              );
              const classOfficersForSelected = (data.classOfficers || []).filter(
                (off) => off.classCode === selectedClass
              );

              return (
                <div className="space-y-10">
                  {/* Competition Categories Capacity Grid */}
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                      <div>
                        <h2 className="font-display text-xl font-bold text-white">
                          {clsInfo?.name || `Class ${selectedClass}`} — Competition Categories (8 Tracks)
                        </h2>
                        <p className="text-xs text-neutral-400">
                          {clsInfo?.description}
                        </p>
                      </div>
                      <span className="text-xs font-mono-tabular text-[#F3D068]">
                        Total Registered:{' '}
                        {
                          data.participants.filter(
                            (p) => p.classCode === selectedClass
                          ).length
                        }{' '}
                        / 24 Places
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {data.categories.map((cat) => {
                        const registered = data.participants.filter(
                          (p) =>
                            p.classCode === selectedClass &&
                            p.categoryName === cat.name
                        ).length;
                        const remaining = Math.max(
                          0,
                          cat.maxParticipantsPerClass - registered
                        );
                        const isFull = registered >= cat.maxParticipantsPerClass;

                        return (
                          <div
                            key={cat.id}
                            className={`p-4 rounded-xl bg-[#0E1118] border ${
                              isFull
                                ? 'border-amber-500/50'
                                : 'border-neutral-800'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-display font-bold text-sm text-white">
                                {cat.name}
                              </span>
                              <span className="font-mono-tabular text-xs font-semibold text-[#F3D068]">
                                {registered}/{cat.maxParticipantsPerClass}
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden my-2.5">
                              <div
                                className={`h-full rounded-full ${
                                  isFull ? 'bg-amber-400' : 'bg-[#D4AF37]'
                                }`}
                                style={{
                                  width: `${Math.min(
                                    100,
                                    (registered / cat.maxParticipantsPerClass) *
                                      100
                                  )}%`,
                                }}
                              />
                            </div>
                            <div className="text-[11px] text-neutral-400 font-mono-tabular">
                              {isFull ? (
                                <span className="text-amber-300 font-medium">
                                  Capacity Reached (0 left)
                                </span>
                              ) : (
                                <span>
                                  {remaining} place{remaining === 1 ? '' : 's'}{' '}
                                  remaining
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Public Participant Profiles for this Class */}
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                      <div>
                        <h3 className="font-display text-lg font-bold text-white">
                          Class {selectedClass} Public Participant Profiles
                        </h3>
                        <p className="text-xs text-neutral-400">
                          Public scholar profiles display name, photograph, and class cohort.
                        </p>
                      </div>
                      <div className="relative w-full sm:w-64">
                        <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={participantSearch}
                          onChange={(e) => setParticipantSearch(e.target.value)}
                          placeholder={`Search ${selectedClass} scholars...`}
                          className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#0E1118] border border-neutral-800 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
                        />
                      </div>
                    </div>

                    {classParticipants.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {classParticipants.map((scholar) => {
                          const roleLabel =
                            scholar.categoryName === 'Speech'
                              ? 'SPEAKER · SPEECH'
                              : scholar.categoryName === 'Naat'
                              ? 'NAAT RECITER · NAAT'
                              : scholar.categoryName === 'Qirat'
                              ? 'QIRAT RECITER · QIRAT'
                              : scholar.categoryName === 'Table Topic'
                              ? 'TABLE TOPIC SPEAKER'
                              : scholar.categoryName === 'Evolution'
                              ? 'EVALUATOR · EVOLUTION'
                              : scholar.categoryName.toUpperCase();
                          return (
                            <button
                              key={scholar.id}
                              type="button"
                              onClick={() => setInspectedParticipant(scholar)}
                              className="group p-3.5 rounded-xl bg-[#0E1118] border border-neutral-800 hover:border-[#D4AF37]/60 text-left transition-all cursor-pointer flex flex-col justify-between"
                            >
                              <div>
                                <div className="aspect-square rounded-lg overflow-hidden bg-[#151822] mb-2.5 border border-neutral-800 relative">
                                  <img
                                    src={scholar.photoUrl}
                                    alt={scholar.fullName}
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                                  />
                                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/75 border border-[#D4AF37]/50 text-[10px] font-mono-tabular font-bold text-[#F3D068]">
                                    Class {scholar.classCode}
                                  </span>
                                </div>
                                <div className="font-display font-bold text-sm text-white truncate">
                                  {scholar.fullName}
                                </div>
                                <div className="text-[11px] font-semibold text-emerald-300 truncate mt-0.5">
                                  {roleLabel}
                                </div>
                                {scholar.admissionNo && (
                                  <div className="text-[10px] font-mono-tabular text-neutral-400 mt-0.5">
                                    Adm No: {scholar.admissionNo}
                                  </div>
                                )}
                                {(scholar.ownTopic || scholar.shortDescription) && (
                                  <div className="text-[11px] text-neutral-400 truncate mt-0.5">
                                    {scholar.ownTopic || scholar.shortDescription}
                                  </div>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-8 rounded-xl bg-[#0E1118] border border-neutral-800 text-center text-sm text-neutral-400">
                        No matching participants in Class {selectedClass}.
                      </div>
                    )}
                  </div>

                  {/* Class Teacher & Executive Officers for Selected Class */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
                          <Crown className="w-5 h-5 text-[#F3D068]" />
                          <span>Class {selectedClass} — Class Teacher & Executive Officers</span>
                        </h3>
                        <p className="text-xs text-neutral-400">
                          Class Teacher, President, VP Membership, VP Education, VP Public Relations, Secretary, and Treasurer.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('officers')}
                        className="text-xs text-[#F3D068] hover:underline cursor-pointer"
                      >
                        View All Class Teachers & Officers →
                      </button>
                    </div>

                    {classOfficersForSelected.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {classOfficersForSelected.map((off) => (
                          <div
                            key={off.id}
                            className={`p-4 rounded-xl bg-[#0E1118] border flex items-center gap-4 ${
                              off.roleTitle.trim().toLowerCase() ===
                              'class teacher'
                                ? 'border-2 border-[#D4AF37] sm:col-span-2 lg:col-span-3 bg-gradient-to-r from-[#141927] via-[#0E1118] to-[#141927]'
                                : 'border-[#D4AF37]/35'
                            }`}
                          >
                            <img
                              src={off.photoUrl}
                              alt={off.holderName}
                              referrerPolicy="no-referrer"
                              className="w-14 h-14 rounded-full object-cover object-top border-2 border-[#D4AF37] shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="text-[11px] font-bold uppercase tracking-wider text-[#F3D068]">
                                Class {selectedClass} · {off.roleTitle}
                              </div>
                              <div className="font-display font-bold text-base text-white truncate mt-0.5">
                                {off.holderName}
                              </div>
                              {off.admissionNo && (
                                <div className="text-[11px] font-mono-tabular text-neutral-400">
                                  ID: {off.admissionNo}
                                </div>
                              )}
                              {off.responsibilities && (
                                <div className="text-xs text-neutral-400 mt-1 line-clamp-1">
                                  {off.responsibilities}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 rounded-xl bg-[#0E1118] border border-neutral-800 text-xs text-neutral-400">
                        No Class Officers appointed for Class {selectedClass} yet.
                      </div>
                    )}
                  </div>

                  {/* Class Generated Posters */}
                  <div>
                    <h3 className="font-display text-lg font-bold text-white mb-4">
                      Class {selectedClass} Official Generated Posters
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {classPosters.map((poster) => (
                        <PosterStageCard
                          key={poster.id}
                          poster={poster}
                          liveParticipants={data.participants}
                          canManage={canManageClass(poster.classCode)}
                          onInspectPoster={(p) => setInspectedPoster(p)}
                          onOpenStudio={(p) => setStudioPoster(p)}
                          onPosterUpdated={onRefreshData}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Class Library Resources */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-display text-lg font-bold text-white">
                        Class {selectedClass} Digital Library ({classLibraryItems.length})
                      </h3>
                      <button
                        type="button"
                        onClick={() => {
                          setLibraryScopeFilter(selectedClass);
                          setActiveTab('library');
                        }}
                        className="text-xs text-[#F3D068] hover:underline cursor-pointer"
                      >
                        Browse Full {selectedClass} Library →
                      </button>
                    </div>
                    {classLibraryItems.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {classLibraryItems.map((res) => (
                          <div
                            key={res.id}
                            className="p-4 rounded-xl bg-[#0E1118] border border-neutral-800 flex items-center justify-between gap-4"
                          >
                            <div className="min-w-0">
                              <div className="text-xs text-[#D4AF37]">
                                {res.category} · {res.fileType} ({res.fileSize})
                              </div>
                              <div className="font-semibold text-sm text-white mt-0.5 truncate">
                                {res.title}
                              </div>
                              <div className="text-xs text-neutral-400 truncate">
                                {res.description}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => setPreviewResource(res)}
                                className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-xs text-neutral-200 border border-neutral-700 cursor-pointer"
                              >
                                Preview
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDownloadResource(res)}
                                className="px-3 py-1.5 rounded-lg bg-[#D4AF37] text-neutral-950 font-semibold text-xs cursor-pointer"
                              >
                                Download
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 rounded-xl bg-[#0E1118] border border-neutral-800 text-xs text-neutral-400">
                        No class-specific library resources published for {selectedClass} yet.
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* -------------------------------------------------------------------
            TAB 2B: CLASS TEACHERS & EXECUTIVE OFFICERS DIRECTORY (U1 – U6)
           ------------------------------------------------------------------- */}
        {activeTab === 'officers' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-white flex items-center gap-2.5">
                  <Crown className="w-7 h-7 text-[#F3D068]" />
                  <span>Class Teachers & Executive Officers (U1 – U6)</span>
                </h1>
                <p className="text-sm text-neutral-400 mt-1">
                  Each class cohort is guided by its official Class Teacher and 6 Executive Officers: President, Vice President of Membership, Vice President of Education, Vice President of Public Relations, Secretary, and Treasurer.
                </p>
              </div>

              <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-[#0E1118] border border-neutral-800">
                {VALID_CLASSES.map((cls) => (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => setSelectedClass(cls)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                      selectedClass === cls
                        ? 'bg-[#D4AF37] text-neutral-950 shadow'
                        : 'text-neutral-300 hover:text-white hover:bg-neutral-900'
                    }`}
                  >
                    {cls}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(
                [
                  'Class Teacher',
                  'President',
                  'Vice President of Membership',
                  'Vice President of Education',
                  'Vice President of Public Relations',
                  'Secretary',
                  'Treasurer',
                ] as const
              ).map((roleTitle) => {
                const record = (data.classOfficers || []).find(
                  (o) =>
                    o.classCode === selectedClass &&
                    o.roleTitle.trim().toLowerCase() ===
                      roleTitle.trim().toLowerCase()
                );
                const isTeacher = roleTitle === 'Class Teacher';
                return (
                  <div
                    key={roleTitle}
                    className={`p-6 rounded-2xl bg-[#0E1118] flex flex-col justify-between gap-4 ${
                      isTeacher
                        ? 'border-2 border-[#D4AF37] md:col-span-2 lg:col-span-3 bg-gradient-to-r from-[#141927] via-[#0E1118] to-[#141927]'
                        : 'border border-[#D4AF37]/40'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {record ? (
                        <img
                          src={record.photoUrl}
                          alt={record.holderName}
                          referrerPolicy="no-referrer"
                          className="w-16 h-16 rounded-full object-cover object-top border-2 border-[#D4AF37] shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-[#151822] border border-dashed border-[#D4AF37]/40 flex items-center justify-center shrink-0">
                          <Crown className="w-6 h-6 text-[#D4AF37]/50" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[10px] font-bold uppercase tracking-wider text-[#F3D068]">
                          Class {selectedClass} · {roleTitle}
                        </span>
                        <h3 className="font-display text-lg font-bold text-white mt-2 truncate">
                          {record ? record.holderName : 'Position Vacant'}
                        </h3>
                        {record?.admissionNo && (
                          <div className="text-xs font-mono-tabular text-neutral-400 mt-0.5">
                            {isTeacher ? 'Staff ID' : 'Admission No'}: {record.admissionNo}
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-neutral-400 border-t border-neutral-800 pt-3">
                      {record?.responsibilities ||
                        `Official ${roleTitle} for Class ${selectedClass}.`}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------------
            TAB 3: POSTERS GALLERY & DOWNLOADS
           ------------------------------------------------------------------- */}
        {activeTab === 'posters' && (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
                  Official Class & Competition Posters
                </h1>
                <p className="text-sm text-neutral-400 mt-1">
                  Automatically composed high-resolution ILM posters for classes U1–U6. Filter by cohort or category and download print-ready files.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={posterClassFilter}
                  onChange={(e) =>
                    setPosterClassFilter(e.target.value as 'ALL' | ClassCode)
                  }
                  className="px-3.5 py-2 rounded-lg bg-[#0E1118] border border-neutral-700 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
                >
                  <option value="ALL">All Classes (U1–U6)</option>
                  {VALID_CLASSES.map((c) => (
                    <option key={c} value={c}>
                      Class {c}
                    </option>
                  ))}
                </select>

                <select
                  value={posterCategoryFilter}
                  onChange={(e) => setPosterCategoryFilter(e.target.value)}
                  className="px-3.5 py-2 rounded-lg bg-[#0E1118] border border-neutral-700 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
                >
                  <option value="ALL">All Categories</option>
                  <option value="Class Showcase">Class Showcase</option>
                  {data.categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name} (Max {cat.maxParticipantsPerClass})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {filteredPosters.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {filteredPosters.map((poster) => (
                  <PosterStageCard
                    key={poster.id}
                    poster={poster}
                    liveParticipants={data.participants}
                    canManage={canManageClass(poster.classCode)}
                    onInspectPoster={(p) => setInspectedPoster(p)}
                    onOpenStudio={(p) => setStudioPoster(p)}
                    onPosterUpdated={onRefreshData}
                  />
                ))}
              </div>
            ) : (
              <div className="p-12 rounded-2xl bg-[#0E1118] border border-neutral-800 text-center">
                <p className="font-display text-lg text-[#F3D068]">
                  No Published Posters Match Your Filter
                </p>
                <p className="text-xs text-neutral-400 mt-1">
                  Try selecting another class (U1–U6) or competition category.
                </p>
              </div>
            )}
          </div>
        )}

        {/* -------------------------------------------------------------------
            TAB 4: FEED / GALLERY (MODERATED PUBLIC CLASS FEED)
           ------------------------------------------------------------------- */}
        {activeTab === 'feed' && (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
                  Approved Class Feed & Gallery
                </h1>
                <p className="text-sm text-neutral-400 mt-1">
                  Verified competition moments, class announcements, and scholar highlights approved by the ILM Super Admin.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={feedSearch}
                    onChange={(e) => setFeedSearch(e.target.value)}
                    placeholder="Search feed posts..."
                    className="pl-9 pr-3 py-2 rounded-lg bg-[#0E1118] border border-neutral-700 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>
                <select
                  value={feedClassFilter}
                  onChange={(e) =>
                    setFeedClassFilter(e.target.value as 'ALL' | ClassCode)
                  }
                  className="px-3.5 py-2 rounded-lg bg-[#0E1118] border border-neutral-700 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
                >
                  <option value="ALL">All Classes (U1–U6)</option>
                  {VALID_CLASSES.map((c) => (
                    <option key={c} value={c}>
                      Class {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {filteredFeedPosts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFeedPosts.map((post) => (
                  <article
                    key={post.id}
                    className="rounded-xl bg-[#0E1118] border border-neutral-800 overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      <div className="aspect-[4/3] bg-[#141822] overflow-hidden">
                        {post.mediaUrl.startsWith('data:image/svg+xml;utf8,') ? (
                          <div
                            className="w-full h-full bg-[#FFF5F5]"
                            dangerouslySetInnerHTML={{
                              __html: decodeURIComponent(
                                post.mediaUrl.replace(
                                  'data:image/svg+xml;utf8,',
                                  ''
                                )
                              ),
                            }}
                          />
                        ) : (
                          <img
                            src={post.mediaUrl}
                            alt={post.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover object-top"
                          />
                        )}
                      </div>
                      <div className="p-5">
                        <div className="flex items-center gap-2 text-xs text-[#D4AF37]">
                          <span className="font-semibold">
                            Class {post.classCode}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{post.mediaType}</span>
                          <span aria-hidden="true">·</span>
                          <span className="text-neutral-400">
                            {new Date(post.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h2 className="font-display font-bold text-lg text-white mt-2">
                          {post.title}
                        </h2>
                        <p className="text-xs sm:text-sm text-neutral-300 mt-2 leading-relaxed">
                          {post.caption}
                        </p>
                      </div>
                    </div>
                    <div className="px-5 py-3.5 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-400">
                      <span className="truncate max-w-[120px]">
                        {post.submittedByName}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleShareFeedPost(post)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-200 border border-emerald-600/40 font-semibold cursor-pointer"
                          title="Share this feed poster/post"
                        >
                          {copiedFeedId === post.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Share</span>
                            </>
                          )}
                        </button>
                        {canManageClass(post.classCode) && (
                          <button
                            type="button"
                            onClick={() => handleEditFeedPostInStudio(post)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#161A26] hover:bg-[#1E2436] text-[#F3D068] border border-[#D4AF37]/40 font-medium cursor-pointer"
                            title="Open in Photoshop Studio to edit"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDownloadFeedPost(post)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 font-medium cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="p-12 rounded-2xl bg-[#0E1118] border border-neutral-800 text-center text-sm text-neutral-400">
                No approved feed posts match your current filter.
              </div>
            )}
          </div>
        )}

        {/* -------------------------------------------------------------------
            TAB 5: OFFICIAL WEEKLY RESULTS — PER CLASS (U1–U6)
           ------------------------------------------------------------------- */}
        {activeTab === 'results' && (
          <div className="space-y-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
                  Official Weekly Results
                </h1>
                <p className="text-sm text-neutral-400 mt-1">
                  Class-wise Best Speaker &amp; Best Naat winners — published by ILM Super Admin. All past results permanently preserved.
                </p>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={resultSearch}
                  onChange={(e) => setResultSearch(e.target.value)}
                  placeholder="Search winner or week..."
                  className="pl-9 pr-3 py-2 rounded-lg bg-[#0E1118] border border-neutral-700 text-xs text-white focus:border-[#D4AF37] focus:outline-none w-56"
                />
              </div>
            </div>

            {/* Per-Class Result Cards U1–U6 */}
            <div className="space-y-6">
              {VALID_CLASSES.map((cls) => {
                const clsResults = data.weeklyResults.filter(
                  (r) => r.winnerClass === cls
                );
                const latestSpeaker =
                  clsResults.find((r) => r.resultCategory === 'Best Speaker') || null;
                const latestNaat =
                  clsResults.find((r) => r.resultCategory === 'Best Naat') || null;
                const classInfo = data.classes.find((c) => c.code === cls);

                return (
                  <div
                    key={cls}
                    className="rounded-2xl border border-neutral-800 bg-[#0B0D14] overflow-hidden"
                  >
                    {/* Class Header */}
                    <div className="flex items-center gap-3 px-6 py-4 border-b border-neutral-800 bg-gradient-to-r from-[#0E1118] to-[#0B0D14]">
                      <div className="w-9 h-9 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-[#D4AF37]">{cls}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="font-display text-base font-bold text-white">
                          Class {cls}{classInfo?.name ? ` — ${classInfo.name}` : ''}
                        </h2>
                        <p className="text-xs text-neutral-400">
                          {clsResults.length} result{clsResults.length !== 1 ? 's' : ''} published
                        </p>
                      </div>
                      {(latestSpeaker || latestNaat) && (
                        <Trophy className="w-4 h-4 text-[#D4AF37]/60 shrink-0" />
                      )}
                    </div>

                    {/* Best Speaker + Best Naat */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-neutral-800">
                      {(['Best Speaker', 'Best Naat'] as const).map((cat) => {
                        const record = cat === 'Best Speaker' ? latestSpeaker : latestNaat;
                        return (
                          <div
                            key={cat}
                            onClick={() => record && setInspectedResult(record)}
                            className={`p-5 flex items-center gap-4 transition-colors ${
                              record ? 'hover:bg-[#131824] cursor-pointer' : 'opacity-50'
                            }`}
                          >
                            {record ? (
                              <>
                                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#D4AF37] shrink-0 bg-neutral-900">
                                  <img
                                    src={record.winnerPhotoUrl}
                                    alt={record.winnerName}
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover object-top"
                                  />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#F3D068] flex items-center gap-1.5 mb-1">
                                    <Trophy className="w-3 h-3" />
                                    {cat}
                                  </div>
                                  <p className="font-display font-bold text-white text-base truncate">
                                    {record.winnerName}
                                  </p>
                                  <p className="text-xs text-neutral-400 mt-0.5">
                                    {record.weekLabel}
                                  </p>
                                  {record.remarks && (
                                    <p className="text-[11px] text-neutral-500 mt-1 line-clamp-1">
                                      {record.remarks}
                                    </p>
                                  )}
                                </div>
                              </>
                            ) : (
                              <div className="flex items-center gap-3 py-2">
                                <div className="w-12 h-12 rounded-full bg-neutral-800/60 border border-neutral-700 flex items-center justify-center shrink-0">
                                  <Trophy className="w-5 h-5 text-neutral-600" />
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-0.5">
                                    {cat}
                                  </p>
                                  <p className="text-xs text-neutral-500 italic">
                                    Not yet published
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Full Historical Archive */}
            <div className="rounded-xl bg-[#0E1118] border border-neutral-800 overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-display text-lg font-bold text-white">
                  Full Historical Archive ({filteredResults.length})
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 p-1 rounded-lg bg-[#12151F] border border-neutral-800">
                    {(
                      [
                        { id: 'ALL', label: 'All' },
                        { id: 'Best Speaker', label: 'Speaker' },
                        { id: 'Best Naat', label: 'Naat' },
                      ] as const
                    ).map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setResultCategoryFilter(tab.id)}
                        className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                          resultCategoryFilter === tab.id
                            ? 'bg-[#D4AF37] text-neutral-950'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  <select
                    value={resultClassFilter}
                    onChange={(e) =>
                      setResultClassFilter(e.target.value as 'ALL' | ClassCode)
                    }
                    className="px-3 py-1.5 rounded-lg bg-[#12151F] border border-neutral-700 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
                  >
                    <option value="ALL">All Classes</option>
                    {VALID_CLASSES.map((c) => (
                      <option key={c} value={c}>
                        Class {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-800 text-xs text-neutral-400 uppercase">
                      <th className="py-3.5 px-6">#</th>
                      <th className="py-3.5 px-6">Winner Name</th>
                      <th className="py-3.5 px-6">Category</th>
                      <th className="py-3.5 px-6">Class</th>
                      <th className="py-3.5 px-6">Week / Date</th>
                      <th className="py-3.5 px-6">Citation Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/80 text-sm">
                    {filteredResults.map((r, index) => (
                      <tr
                        key={r.id}
                        onClick={() => setInspectedResult(r)}
                        className="hover:bg-[#141824] transition-colors cursor-pointer"
                      >
                        <td className="py-3.5 px-6 font-mono-tabular text-xs text-neutral-400">
                          {index + 1}
                        </td>
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-3">
                            <img
                              src={r.winnerPhotoUrl}
                              alt={r.winnerName}
                              referrerPolicy="no-referrer"
                              className="w-9 h-9 rounded-full object-cover object-top border border-[#D4AF37]/50"
                            />
                            <span className="font-semibold text-white">
                              {r.winnerName}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-6 text-[#F3D068] font-medium text-xs">
                          {r.resultCategory}
                        </td>
                        <td className="py-3.5 px-6 font-mono-tabular text-xs text-white">
                          {r.winnerClass}
                        </td>
                        <td className="py-3.5 px-6 text-xs text-neutral-300 font-mono-tabular">
                          {r.weekLabel}
                        </td>
                        <td className="py-3.5 px-6 text-xs text-neutral-400 max-w-xs truncate">
                          {r.remarks || 'Official weekly laureate'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------------
            TAB 6: DIGITAL LIBRARY (COMMON + U1..U6, 11 EXACT CATEGORIES)
           ------------------------------------------------------------------- */}
        {activeTab === 'library' && (
          <div className="space-y-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
                  ILM Digital Library (Common & Class Libraries)
                </h1>
                <p className="text-sm text-neutral-400 mt-1">
                  Search, preview, and download academic resources across all 11 official categories without login.
                </p>
              </div>

              {/* Scope Selector: All | Common Library | U1..U6 */}
              <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-[#0E1118] border border-neutral-800">
                {(
                  [
                    { id: 'ALL', label: 'All Libraries' },
                    { id: 'COMMON', label: 'Common Library' },
                    ...VALID_CLASSES.map((c) => ({ id: c, label: c })),
                  ] as const
                ).map((scope) => (
                  <button
                    key={scope.id}
                    type="button"
                    onClick={() =>
                      setLibraryScopeFilter(
                        scope.id as 'ALL' | 'COMMON' | ClassCode
                      )
                    }
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      libraryScopeFilter === scope.id
                        ? 'bg-[#D4AF37] text-neutral-950'
                        : 'text-neutral-300 hover:text-white'
                    }`}
                  >
                    {scope.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 11 Exact Categories Filter Bar */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setLibraryCategoryFilter('ALL')}
                className={`px-3.5 py-2 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  libraryCategoryFilter === 'ALL'
                    ? 'bg-[#171C2B] text-[#F3D068] border-[#D4AF37]'
                    : 'bg-[#0E1118] text-neutral-300 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                All 11 Categories ({publicLibraryResources.length})
              </button>
              {LIBRARY_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setLibraryCategoryFilter(cat)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    libraryCategoryFilter === cat
                      ? 'bg-[#171C2B] text-[#F3D068] border-[#D4AF37]'
                      : 'bg-[#0E1118] text-neutral-300 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search and Sort Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={librarySearch}
                  onChange={(e) => setLibrarySearch(e.target.value)}
                  placeholder="Search by title, description, author, or category..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#0E1118] border border-neutral-700 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-neutral-400">Sort by:</span>
                <select
                  value={librarySort}
                  onChange={(e) =>
                    setLibrarySort(e.target.value as 'newest' | 'title')
                  }
                  className="px-3.5 py-2.5 rounded-lg bg-[#0E1118] border border-neutral-700 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
                >
                  <option value="newest">Newest Added</option>
                  <option value="title">Title (A–Z)</option>
                </select>
              </div>
            </div>

            {/* Resources Grid */}
            {filteredLibrary.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLibrary.map((res) => (
                  <div
                    key={res.id}
                    className="p-6 rounded-xl bg-[#0E1118] border border-neutral-800 hover:border-[#D4AF37]/50 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 text-xs text-[#D4AF37] mb-2">
                        <span className="font-semibold">{res.category}</span>
                        <span className="font-mono-tabular text-neutral-400">
                          {res.libraryScope === 'COMMON'
                            ? 'Common Library'
                            : `Class ${res.libraryScope}`}{' '}
                          · {res.fileType} · {res.fileSize}
                        </span>
                      </div>
                      <h3 className="font-display font-bold text-lg text-white leading-snug">
                        {res.title}
                      </h3>
                      <p className="text-xs text-neutral-400 mt-1">
                        By {res.author}
                      </p>
                      <p className="text-xs sm:text-sm text-neutral-300 mt-3 line-clamp-3 leading-relaxed">
                        {res.description}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-neutral-800/80 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setPreviewResource(res)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 text-xs font-medium cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>Preview</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadResource(res)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#D4AF37] hover:bg-[#e2be46] text-neutral-950 font-semibold text-xs cursor-pointer"
                      >
                        {res.category === 'Bookmarks' ? (
                          <>
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Open Link</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-3.5 h-3.5" />
                            <span>Download</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 rounded-2xl bg-[#0E1118] border border-neutral-800 text-center text-sm text-neutral-400">
                No published library resources match your search criteria.
              </div>
            )}
          </div>
        )}

        {/* -------------------------------------------------------------------
            TAB 7 & 8: ABOUT ILM (WITH COMPLETE 10 JUNIOR ILM PROJECTS) & CONTACT
           ------------------------------------------------------------------- */}
        {(activeTab === 'about' || activeTab === 'contact') && (
          <div className="max-w-5xl mx-auto space-y-10">
            <div className="p-8 sm:p-10 rounded-2xl bg-[#0E1118] border border-[#D4AF37]/40">
              <IlmLogo size="lg" showSubtitle />
              <h1 className="font-display text-3xl font-bold text-white mt-6">
                About ILM — Integrated Learning Master
              </h1>
              <p className="text-sm sm:text-base text-neutral-300 mt-4 leading-relaxed">
                ILM (Integrated Learning Master) is a structured educational leadership, oratory, and scholarly development system organized across six dedicated cohorts: <strong className="text-[#F3D068]">U1, U2, U3, U4, U5, and U6</strong>. Through weekly assemblies, moderated peer Evolution, and curated digital libraries, ILM cultivates articulate thinkers and principled leaders.
              </p>

              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-neutral-800">
                <div>
                  <div className="font-display text-lg font-bold text-[#F3D068]">
                    Learn
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">
                    Common and class-specific digital libraries spanning 11 scholarly formats.
                  </p>
                </div>
                <div>
                  <div className="font-display text-lg font-bold text-[#F3D068]">
                    Compete
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">
                    Eight structured roles per class: Qirat (1), Naat (5), Speech (5), Table Topic (5), Evolution (5), Aah Counter (1), Marshal (1), and Grammarian (1).
                  </p>
                </div>
                <div>
                  <div className="font-display text-lg font-bold text-[#F3D068]">
                    Grow
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">
                    Official Best Speaker and Best Naat weekly recognitions preserved in a permanent public archive.
                  </p>
                </div>
              </div>
            </div>

            {/* ===============================================================
                JUNIOR ILM: 10 COMPETENT COMMUNICATION PROJECTS CURRICULUM
               =============================================================== */}
            <div className="p-6 sm:p-8 rounded-2xl bg-[#0E1118] border-2 border-[#D4AF37]/45 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
                <div>
                  <span className="px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[11px] font-bold uppercase tracking-widest text-[#F3D068]">
                    Official Junior ILM Curriculum
                  </span>
                  <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mt-2">
                    Junior ILM — 10 Speech & Leadership Projects
                  </h2>
                  <p className="text-xs sm:text-sm text-neutral-400 mt-1">
                    Complete step-by-step speech training curriculum from Project 1 (The Introductory Speech) to Project 10 (Inspire Your Audience).
                  </p>
                </div>
              </div>

              {/* Project Selector Pills */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedAboutProject('ALL')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    selectedAboutProject === 'ALL'
                      ? 'bg-[#D4AF37] text-neutral-950 border-[#D4AF37] shadow'
                      : 'bg-[#121622] text-neutral-300 border-neutral-800 hover:text-white'
                  }`}
                >
                  All 10 Projects
                </button>
                {ILM_JUNIOR_PROJECTS.map((proj) => (
                  <button
                    key={proj.number}
                    type="button"
                    onClick={() => setSelectedAboutProject(proj.number)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      selectedAboutProject === proj.number
                        ? 'bg-[#D4AF37] text-neutral-950 border-[#D4AF37] shadow'
                        : 'bg-[#121622] text-neutral-300 border-neutral-800 hover:text-white'
                    }`}
                  >
                    Project {proj.number}: {proj.title}
                  </button>
                ))}
              </div>

              {/* Detailed Project Cards */}
              <div className="space-y-8">
                {ILM_JUNIOR_PROJECTS.filter(
                  (p) =>
                    selectedAboutProject === 'ALL' ||
                    p.number === selectedAboutProject
                ).map((proj) => (
                  <div
                    key={proj.number}
                    className="p-6 sm:p-8 rounded-2xl bg-[#111520] border border-[#D4AF37]/35 space-y-6 shadow-xl"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-4">
                      <div>
                        <div className="text-xs font-bold uppercase tracking-widest text-[#F3D068]">
                          Junior ILM · Project {proj.number}
                        </div>
                        <h3 className="font-display text-xl sm:text-2xl font-bold text-white mt-1">
                          Project {proj.number}: {proj.title}
                        </h3>
                      </div>
                      <span className="px-3.5 py-1.5 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-xs font-mono-tabular font-bold text-[#F3D068]">
                        Time Guideline: {proj.timeGuideline}
                      </span>
                    </div>

                    {proj.purpose && (
                      <div className="p-4 rounded-xl bg-[#0B0E16] border border-neutral-800">
                        <div className="text-xs font-bold uppercase tracking-wider text-[#F3D068] mb-1">
                          Purpose
                        </div>
                        <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed">
                          {proj.purpose}
                        </p>
                      </div>
                    )}

                    {/* Objectives */}
                    <div>
                      <h4 className="font-display text-sm font-bold text-[#F3D068] uppercase tracking-wider mb-2.5">
                        Objectives
                      </h4>
                      <ul className="space-y-1.5 text-xs sm:text-sm text-neutral-200 list-disc list-inside">
                        {proj.objectives.map((obj, idx) => (
                          <li key={idx} className="leading-relaxed">
                            {obj}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Guidelines */}
                    <div className="space-y-4">
                      <h4 className="font-display text-sm font-bold text-[#F3D068] uppercase tracking-wider">
                        Guidelines
                      </h4>
                      {proj.guidelinesIntro && (
                        <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                          {proj.guidelinesIntro}
                        </p>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {proj.guidelineSections.map((sec, sIdx) => (
                          <div
                            key={sIdx}
                            className="p-4 rounded-xl bg-[#0C0F17] border border-neutral-800/90 space-y-2"
                          >
                            <div className="font-display font-bold text-sm text-white">
                              {sec.heading}
                            </div>
                            <ul className="space-y-1.5 text-xs text-neutral-300 list-disc list-inside">
                              {sec.items.map((item, iIdx) => (
                                <li key={iIdx} className="leading-relaxed">
                                  {item}
                                  {sec.subItems && sec.subItems[iIdx] && (
                                    <ul className="pl-5 mt-1 space-y-1 list-circle text-neutral-400">
                                      {sec.subItems[iIdx].map((sub, subIdx) => (
                                        <li key={subIdx}>{sub}</li>
                                      ))}
                                    </ul>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Preparation Tips & Success Indicators */}
                    {(proj.preparationTips || proj.successIndicators) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {proj.preparationTips && (
                          <div className="p-4 rounded-xl bg-[#0C0F17] border border-neutral-800 space-y-2">
                            <div className="font-display font-bold text-xs uppercase tracking-wider text-emerald-300">
                              Preparation Tips
                            </div>
                            <ul className="space-y-1.5 text-xs text-neutral-300 list-disc list-inside">
                              {proj.preparationTips.map((tip, idx) => (
                                <li key={idx}>{tip}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {proj.successIndicators && (
                          <div className="p-4 rounded-xl bg-[#0C0F17] border border-neutral-800 space-y-2">
                            <div className="font-display font-bold text-xs uppercase tracking-wider text-[#F3D068]">
                              Indicators of Success
                            </div>
                            <ul className="space-y-1.5 text-xs text-neutral-300 list-disc list-inside">
                              {proj.successIndicators.map((ind, idx) => (
                                <li key={idx}>{ind}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Evaluation Criteria & After Completing */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-[#0C0F17] border border-neutral-800 space-y-2">
                        <div className="font-display font-bold text-xs uppercase tracking-wider text-[#F3D068]">
                          Evaluation Criteria
                        </div>
                        <ul className="space-y-1.5 text-xs text-neutral-300 list-disc list-inside">
                          {proj.evaluationCriteria.map((crit, idx) => (
                            <li key={idx}>{crit}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-4 rounded-xl bg-[#0C0F17] border border-neutral-800 space-y-2">
                        <div className="font-display font-bold text-xs uppercase tracking-wider text-emerald-300">
                          After Completing This Project
                        </div>
                        <ul className="space-y-1.5 text-xs text-neutral-300 list-disc list-inside">
                          {proj.afterCompleting.map((ac, idx) => (
                            <li key={idx}>{ac}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Summary Quote */}
                    <blockquote className="p-4 rounded-xl bg-gradient-to-r from-[#D4AF37]/15 via-[#141824] to-[#0E1118] border-l-4 border-[#D4AF37] text-xs sm:text-sm text-neutral-200 italic leading-relaxed">
                      “{proj.summaryQuote}”
                    </blockquote>

                    {proj.closingNote && (
                      <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-700/40 text-xs sm:text-sm text-emerald-200 font-medium leading-relaxed">
                        {proj.closingNote}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-[#0E1118] border border-neutral-800">
              <h2 className="font-display text-xl font-bold text-white">
                Institutional Reference & Administration Contact
              </h2>
              <p className="text-sm text-neutral-400 mt-2 leading-relaxed">
                For class registration inquiries, competition poster verification, or library submissions, please coordinate with your assigned Class Admin (U1–U6) or the ILM Super Admin Directorate.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-neutral-300">
                <a
                  href="https://ilm-niics.zite.so/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#161A26] text-[#F3D068] border border-[#D4AF37]/40 hover:bg-[#1E2436]"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Official ILM Reference Portal</span>
                </a>
                <button
                  type="button"
                  onClick={onOpenAdminLogin}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Gmail Login</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* =====================================================================
          MODAL 1: FULL-SCREEN POSTER LIGHTBOX
         ===================================================================== */}
      {inspectedPoster && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setInspectedPoster(null)}
        >
          <div
            className="relative w-full max-w-4xl my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-end gap-3 mb-3">
              <button
                type="button"
                onClick={() =>
                  downloadPosterAsPng({
                    ...inspectedPoster,
                    participantsSnapshot: JSON.stringify(
                      data.participants.filter(
                        (p) => p.classCode === inspectedPoster.classCode
                      )
                    ),
                  })
                }
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#D4AF37] text-neutral-950 font-semibold text-xs cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download High-Res PNG</span>
              </button>
              <button
                type="button"
                onClick={() => setInspectedPoster(null)}
                className="p-2 rounded-lg bg-neutral-900 text-neutral-200 border border-neutral-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <PosterStageCard
              poster={inspectedPoster}
              liveParticipants={data.participants}
              canManage={canManageClass(inspectedPoster.classCode)}
              onOpenStudio={(p) => {
                setInspectedPoster(null);
                setStudioPoster(p);
              }}
              onPosterUpdated={onRefreshData}
            />
          </div>
        </div>
      )}

      {/* =====================================================================
          PHOTOSHOP STUDIO MODAL ON PUBLIC WEBSITE
         ===================================================================== */}
      {studioPoster && (
        <PosterPhotoshopStudio
          poster={studioPoster}
          liveParticipants={data.participants}
          onClose={() => setStudioPoster(null)}
          onSavePoster={async (
            posterId,
            updatedDataUrl,
            title,
            subtitle,
            participantsSnapshot
          ) => {
            await fetch(`/api/public/posters/${posterId}`, {
              method: 'PATCH',
              headers: getClientAuthHeaders(),
              body: JSON.stringify({
                posterImageUrl: updatedDataUrl,
                title,
                subtitle,
                participantsSnapshot,
              }),
            });
            setStudioPoster(null);
            if (onRefreshData) onRefreshData();
          }}
          onPostToFeed={async (poster, renderedDataUrl, caption) => {
            await fetch(`/api/public/posters/${poster.id}/share-to-feed`, {
              method: 'POST',
              headers: getClientAuthHeaders(),
              body: JSON.stringify({
                title: `Class ${poster.classCode} Official Competition Poster`,
                caption,
                mediaUrl: renderedDataUrl,
                submittedByName:
                  currentAdmin?.name || `Class ${poster.classCode} Poster Studio`,
              }),
            });
            if (onRefreshData) onRefreshData();
          }}
        />
      )}

      {/* =====================================================================
          FULL FEED POST VIEWER MODAL (OPENS WHEN USER CLICKS VIEW ON HOME FEED)
         ===================================================================== */}
      {inspectedFeedPost && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setInspectedFeedPost(null)}
        >
          <div
            className="relative w-full max-w-4xl rounded-2xl bg-[#0E1118] border-2 border-[#D4AF37]/60 p-5 sm:p-7 shadow-2xl space-y-5 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-neutral-800">
              <div>
                <div className="flex items-center gap-2 text-xs text-[#F3D068] font-bold uppercase tracking-wider">
                  <span>Class {inspectedFeedPost.classCode}</span>
                  <span aria-hidden="true">·</span>
                  <span>{inspectedFeedPost.mediaType}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-neutral-400 font-normal">
                    By {inspectedFeedPost.submittedByName}
                  </span>
                </div>
                <h3 className="font-display text-xl sm:text-2xl font-bold text-white mt-1">
                  {inspectedFeedPost.title}
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleShareFeedPost(inspectedFeedPost)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-200 border border-emerald-600/50 text-xs font-semibold cursor-pointer"
                >
                  {copiedFeedId === inspectedFeedPost.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Share Post</span>
                    </>
                  )}
                </button>

                {canManageClass(inspectedFeedPost.classCode) && (
                  <button
                    type="button"
                    onClick={() => {
                      const postToEdit = inspectedFeedPost;
                      setInspectedFeedPost(null);
                      handleEditFeedPostInStudio(postToEdit);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-[#C89D2E] via-[#E8C55B] to-[#C89D2E] text-neutral-950 font-bold text-xs cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Edit in Photoshop</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleDownloadFeedPost(inspectedFeedPost)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#161922] hover:bg-[#1E2230] text-[#F3D068] border border-[#D4AF37]/40 text-xs font-semibold cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>

                <button
                  type="button"
                  onClick={() => setInspectedFeedPost(null)}
                  className="p-2 rounded-lg bg-neutral-900 text-neutral-300 border border-neutral-700 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Full Uncropped Image / Poster View */}
            <div className="rounded-xl overflow-hidden border border-[#D4AF37]/40 bg-[#07080C] flex items-center justify-center max-h-[75vh]">
              <img
                src={inspectedFeedPost.mediaUrl}
                alt={inspectedFeedPost.title}
                referrerPolicy="no-referrer"
                className="w-full h-auto max-h-[75vh] object-contain"
              />
            </div>

            {/* Full Caption & Metadata */}
            <div className="p-4 rounded-xl bg-[#121622] border border-neutral-800 space-y-2">
              <p className="text-sm text-neutral-200 leading-relaxed whitespace-pre-wrap">
                {inspectedFeedPost.caption}
              </p>
              <div className="text-xs text-neutral-400 pt-2 border-t border-neutral-800/80 flex items-center justify-between">
                <span>Published by {inspectedFeedPost.submittedByName}</span>
                <span>
                  {new Date(inspectedFeedPost.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 2: PUBLIC PARTICIPANT PROFILE (STRICTLY NAME, PHOTO, CLASS)
         ===================================================================== */}
      {inspectedParticipant && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setInspectedParticipant(null)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl bg-[#0E1118] border border-[#D4AF37]/50 p-6 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setInspectedParticipant(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-neutral-900 text-neutral-300 border border-neutral-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-36 h-36 mx-auto rounded-2xl overflow-hidden border-2 border-[#D4AF37] bg-neutral-900 mb-4">
              <img
                src={inspectedParticipant.photoUrl}
                alt={inspectedParticipant.fullName}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div className="text-xs font-semibold text-[#F3D068] uppercase tracking-widest">
              Public Scholar Profile
            </div>
            <h3 className="font-display text-2xl font-bold text-white mt-1">
              {inspectedParticipant.fullName}
            </h3>
            <div className="flex items-center justify-center gap-2 text-sm text-neutral-300 mt-2">
              <span className="font-semibold text-[#F3D068]">
                Class {inspectedParticipant.classCode}
              </span>
              <span aria-hidden="true">·</span>
              <span>{inspectedParticipant.categoryName}</span>
            </div>
            {inspectedParticipant.shortDescription && (
              <p className="text-xs text-neutral-400 mt-4 leading-relaxed">
                {inspectedParticipant.shortDescription}
              </p>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 3: WEEKLY RESULT CITATION MODAL
         ===================================================================== */}
      {inspectedResult && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setInspectedResult(null)}
        >
          <div
            className="relative w-full max-w-lg rounded-2xl bg-[#0E1118] border-2 border-[#D4AF37]/60 p-8 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setInspectedResult(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-neutral-900 text-neutral-300 border border-neutral-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <Trophy className="w-8 h-8 text-[#F3D068] mx-auto mb-2" />
            <div className="text-xs font-semibold text-[#F3D068] uppercase tracking-widest">
              Official Weekly Recognition · {inspectedResult.resultCategory}
            </div>
            <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-2 border-[#D4AF37] bg-neutral-900 my-5">
              <img
                src={inspectedResult.winnerPhotoUrl}
                alt={inspectedResult.winnerName}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-top"
              />
            </div>
            <h3 className="font-display text-2xl font-bold text-white">
              {inspectedResult.winnerName}
            </h3>
            <div className="text-sm text-[#F3D068] font-semibold mt-1">
              Class {inspectedResult.winnerClass} · {inspectedResult.weekLabel}
            </div>
            {inspectedResult.remarks && (
              <p className="text-xs sm:text-sm text-neutral-300 mt-4 leading-relaxed">
                “{inspectedResult.remarks}”
              </p>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 4: DIGITAL LIBRARY INTERACTIVE PREVIEW MODAL
         ===================================================================== */}
      {previewResource && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setPreviewResource(null)}
        >
          <div
            className="relative w-full max-w-2xl rounded-2xl bg-[#0E1118] border border-[#D4AF37]/50 p-6 sm:p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-neutral-800">
              <div>
                <div className="text-xs text-[#F3D068] font-semibold">
                  {previewResource.category} ·{' '}
                  {previewResource.libraryScope === 'COMMON'
                    ? 'Common Library'
                    : `Class ${previewResource.libraryScope}`}{' '}
                  · {previewResource.fileType} ({previewResource.fileSize})
                </div>
                <h3 className="font-display text-xl font-bold text-white mt-1">
                  {previewResource.title}
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Author: {previewResource.author}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewResource(null)}
                className="p-1.5 rounded-lg bg-neutral-900 text-neutral-300 border border-neutral-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="my-5 space-y-4">
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                {previewResource.description}
              </p>

              {previewResource.category === 'Images' &&
                (previewResource.fileUrl.startsWith('/') ||
                  previewResource.fileUrl.startsWith('data:')) && (
                  <div className="rounded-xl overflow-hidden border border-neutral-800 max-h-80 bg-black flex items-center justify-center">
                    <img
                      src={previewResource.fileUrl}
                      alt={previewResource.title}
                      referrerPolicy="no-referrer"
                      className="max-h-80 object-contain"
                    />
                  </div>
                )}

              {previewResource.contentPreview && (
                <div className="p-4 rounded-xl bg-[#080A0F] border border-neutral-800 font-mono text-xs text-neutral-200 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
                  {previewResource.contentPreview}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-neutral-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPreviewResource(null)}
                className="px-4 py-2 rounded-lg bg-neutral-900 text-xs text-neutral-300 border border-neutral-700 cursor-pointer"
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={() => handleDownloadResource(previewResource)}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#D4AF37] text-neutral-950 font-semibold text-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>
                  {previewResource.category === 'Bookmarks'
                    ? 'Open External Bookmark'
                    : 'Download Resource'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          PROFESSIONAL FOOTER
         ===================================================================== */}
      {aiAssistantEnabled && (
        <div className="fixed bottom-20 right-4 z-40 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-[#D4AF37]/50 bg-[#0E1118]/95 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
            <div className="flex items-center gap-2 text-[#F3D068] font-semibold text-sm">
              <Sparkles className="w-4 h-4" />
              ILM AI Assistant
            </div>
            <button
              type="button"
              onClick={() => setAiChatOpen((prev) => !prev)}
              className="text-neutral-300 hover:text-white text-xs cursor-pointer"
            >
              {aiChatOpen ? 'Hide' : 'Open'}
            </button>
          </div>

          {aiChatOpen ? (
            <div className="p-4 space-y-3">
              <textarea
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                placeholder="Ask about admissions, classes, activities, or ILM guidance..."
                className="w-full min-h-[92px] resize-none rounded-xl bg-[#12151F] border border-neutral-700 text-sm text-white px-3 py-2 placeholder:text-neutral-500"
              />

              {aiError && <p className="text-xs text-red-300">{aiError}</p>}

              {aiAnswer && (
                <div className="rounded-xl border border-emerald-700/40 bg-emerald-950/30 p-3 text-xs text-emerald-50 leading-relaxed whitespace-pre-wrap">
                  {aiAnswer}
                </div>
              )}

              <button
                type="button"
                onClick={handleAiChatSubmit}
                disabled={aiBusy}
                className="w-full rounded-xl bg-[#D4AF37] hover:bg-[#dfbe63] text-neutral-950 text-xs font-semibold py-2.5 cursor-pointer disabled:opacity-60"
              >
                {aiBusy ? 'Thinking...' : 'Ask AI'}
              </button>
              <p className="text-[10px] text-neutral-400 text-center">
                Chat history is not stored. This assistant runs in the moment only.
              </p>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAiChatOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-[#F3D068] cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Ask the AI assistant
            </button>
          )}
        </div>
      )}

      <footer className="mt-16 border-t border-neutral-800/90 bg-[#050609] py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div>
            <IlmLogo size="sm" showSubtitle />
            <p className="text-xs text-neutral-400 mt-3 max-w-md">
              Together We Build Better Learners · Official Educational Management Platform for Cohorts U1, U2, U3, U4, U5, and U6.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-neutral-400">
            <button
              type="button"
              onClick={() => setActiveTab('home')}
              className="hover:text-[#F3D068] cursor-pointer"
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('classes')}
              className="hover:text-[#F3D068] cursor-pointer"
            >
              Classes (U1–U6)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('posters')}
              className="hover:text-[#F3D068] cursor-pointer"
            >
              Posters
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('feed')}
              className="hover:text-[#F3D068] cursor-pointer"
            >
              Feed / Gallery
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('results')}
              className="hover:text-[#F3D068] cursor-pointer"
            >
              Weekly Results
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('library')}
              className="hover:text-[#F3D068] cursor-pointer"
            >
              Digital Library
            </button>
            <button
              type="button"
              onClick={onOpenAdminLogin}
              className="text-[#F3D068] hover:underline cursor-pointer"
            >
              Gmail Login
            </button>
          </div>
        </div>
      </footer>

      {/* =====================================================================
          MOBILE BOTTOM NAVIGATION BAR (MATCHING REFERENCE BOARD)
         ===================================================================== */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-[#0B0D14]/95 backdrop-blur-md border-t border-neutral-800 flex items-center justify-around py-2 px-2"
      >
        {(
          [
            { id: 'home', label: 'Home', icon: Home },
            { id: 'classes', label: 'Classes', icon: GraduationCap },
            { id: 'posters', label: 'Posters', icon: ImageIcon },
            { id: 'feed', label: 'Feed', icon: Sparkles },
            { id: 'results', label: 'Results', icon: Trophy },
            { id: 'library', label: 'Library', icon: BookOpen },
          ] as const
        ).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium ${
                isActive ? 'text-[#F3D068]' : 'text-neutral-400'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
