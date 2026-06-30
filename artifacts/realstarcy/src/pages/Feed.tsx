import { useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star, MessageCircle, Share2, Bell, Settings,
  Home, TrendingUp, PlusSquare, ChevronDown, Users,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  useGetFeed, useGetFollowingFeed, useGetMe, useGetNotifications,
  useStarPost, useUnstarPost, useFollowUser, useUnfollowUser,
  getGetFeedQueryKey, getGetFollowingFeedQueryKey, getGetTrendingQueryKey,
  getGetUserProfileQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import type { Post } from "@workspace/api-client-react";

const GRADIENTS = [
  "from-indigo-950 via-purple-900 to-slate-900",
  "from-slate-900 via-teal-950 to-slate-900",
  "from-amber-950 via-orange-900 to-slate-900",
  "from-slate-900 via-rose-950 to-slate-900",
  "from-emerald-950 via-slate-900 to-slate-900",
];

function formatDate(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

interface SlideProps {
  post: Post;
  index: number;
}

function PostSlide({ post, index }: SlideProps) {
  const queryClient = useQueryClient();
  const [isStarred, setIsStarred] = useState(post.isStarred);
  const [starCount, setStarCount] = useState(post.starCount);
  const [starBurst, setStarBurst] = useState(false);
  const [followed, setFollowed] = useState(false);
  const [captionExpanded, setCaptionExpanded] = useState(false);

  const invalidateFeeds = () => {
    queryClient.invalidateQueries({ queryKey: getGetFeedQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetFollowingFeedQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetTrendingQueryKey() });
  };

  const starMutation = useStarPost({
    mutation: {
      onSuccess: (data) => { setStarCount(data.starCount); setIsStarred(data.isStarred); invalidateFeeds(); },
    },
  });
  const unstarMutation = useUnstarPost({
    mutation: {
      onSuccess: (data) => { setStarCount(data.starCount); setIsStarred(data.isStarred); invalidateFeeds(); },
    },
  });
  const followMutation = useFollowUser({
    mutation: {
      onSuccess: () => {
        setFollowed(true);
        queryClient.invalidateQueries({ queryKey: getGetUserProfileQueryKey(post.author.username) });
      },
    },
  });
  const unfollowMutation = useUnfollowUser({
    mutation: {
      onSuccess: () => {
        setFollowed(false);
        queryClient.invalidateQueries({ queryKey: getGetUserProfileQueryKey(post.author.username) });
      },
    },
  });

  const handleStar = () => {
    if (isStarred) {
      unstarMutation.mutate({ id: post.id });
    } else {
      setStarBurst(true);
      setTimeout(() => setStarBurst(false), 700);
      starMutation.mutate({ id: post.id });
    }
  };

  const gradient = GRADIENTS[index % GRADIENTS.length];

  return (
    <div className="relative w-full flex-shrink-0" style={{ height: "100dvh" }}>
      {/* Background */}
      {post.imageUrl ? (
        <img
          src={post.imageUrl}
          alt="post"
          className="absolute inset-0 w-full h-full object-cover"
          loading={index === 0 ? "eager" : "lazy"}
        />
      ) : (
        <div className={cn("absolute inset-0 bg-gradient-to-br", gradient)} />
      )}

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-black/40" />

      {/* Right action bar */}
      <div className="absolute right-3 bottom-28 flex flex-col items-center gap-5 z-20">
        {/* Author avatar */}
        <Link href={`/profile/${post.author.username}`}>
          <div className="relative">
            <Avatar className="w-11 h-11 border-2 border-white/80 shadow-lg">
              <AvatarImage src={post.author.avatar} />
              <AvatarFallback className="bg-primary/30 text-white text-sm font-bold">
                {post.author.displayName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={(e) => {
                e.preventDefault();
                if (followed) unfollowMutation.mutate({ username: post.author.username });
                else followMutation.mutate({ username: post.author.username });
              }}
              className={cn(
                "absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shadow transition-all",
                followed ? "bg-muted-foreground text-black" : "bg-primary text-black"
              )}
            >
              {followed ? "✓" : "+"}
            </button>
          </div>
        </Link>

        {/* Star */}
        <div className="flex flex-col items-center gap-1">
          <motion.button
            onClick={handleStar}
            whileTap={{ scale: 0.75 }}
            className="relative w-11 h-11 flex items-center justify-center"
          >
            <AnimatePresence>
              {starBurst && (
                <motion.div
                  key="burst"
                  initial={{ scale: 0.5, opacity: 0.9 }}
                  animate={{ scale: 3, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 rounded-full bg-primary"
                />
              )}
            </AnimatePresence>
            <motion.div animate={isStarred ? { rotate: [0, -20, 20, 0], scale: [1, 1.3, 1] } : {}}>
              <Star
                size={28}
                fill={isStarred ? "#f5a623" : "none"}
                stroke={isStarred ? "#f5a623" : "white"}
                strokeWidth={1.5}
              />
            </motion.div>
          </motion.button>
          <span className="text-white text-xs font-semibold drop-shadow">{starCount.toLocaleString()}</span>
        </div>

        {/* Comment */}
        <div className="flex flex-col items-center gap-1">
          <Link href={`/post/${post.id}`}>
            <button className="w-11 h-11 flex items-center justify-center">
              <MessageCircle size={28} stroke="white" strokeWidth={1.5} fill="none" />
            </button>
          </Link>
          <span className="text-white text-xs font-semibold drop-shadow">{post.commentCount}</span>
        </div>

        {/* Share */}
        <button
          onClick={() => {
            if (navigator.share) navigator.share({ url: `${window.location.origin}/post/${post.id}` });
          }}
          className="w-11 h-11 flex items-center justify-center"
        >
          <Share2 size={26} stroke="white" strokeWidth={1.5} />
        </button>
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-16 p-5 pb-8 z-20">
        <div className="flex items-center gap-2 mb-2">
          <Link href={`/profile/${post.author.username}`}>
            <p className="text-white font-bold text-[15px] leading-tight hover:text-primary/90 transition-colors">
              {post.author.displayName}
            </p>
          </Link>
          <span className="text-white/40 text-xs">·</span>
          <span className="text-white/50 text-xs">{formatDate(post.createdAt)}</span>
          {!followed && (
            <>
              <span className="text-white/40 text-xs">·</span>
              <button
                onClick={() => followMutation.mutate({ username: post.author.username })}
                className="text-primary text-xs font-bold hover:text-primary/80"
              >
                Follow
              </button>
            </>
          )}
        </div>

        <button onClick={() => setCaptionExpanded(v => !v)} className="text-left w-full">
          <p className={cn("text-white/90 text-sm leading-relaxed", !captionExpanded && "line-clamp-2")}>
            {post.content}
          </p>
          {post.content.length > 100 && !captionExpanded && (
            <span className="text-white/50 text-xs">more</span>
          )}
        </button>

        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {post.tags.map(tag => (
              <Link key={tag} href={`/trending?tag=${tag}`}>
                <span className="text-primary text-xs font-medium">#{tag}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FeedLoader() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col items-center gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
        />
        <p className="text-white/60 text-sm">Loading moments…</p>
      </div>
    </div>
  );
}

function EmptyFollowing() {
  return (
    <div className="flex items-center justify-center h-full px-6">
      <div className="text-center">
        <Users size={40} className="text-white/30 mx-auto mb-4" />
        <p className="font-serif text-xl text-white mb-2">No one yet</p>
        <p className="text-white/50 text-sm mb-6">Follow people from the For You feed to see their posts here.</p>
        <Link href="/trending">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-primary text-black px-6 py-2.5 rounded-xl text-sm font-bold"
          >
            Discover people
          </motion.button>
        </Link>
      </div>
    </div>
  );
}

function BottomNav() {
  const [location] = useLocation();
  const { data: notifications } = useGetNotifications();
  const unreadCount = notifications?.filter(n => !n.isRead).length ?? 0;

  const items = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/trending", icon: TrendingUp, label: "Trending" },
    { href: "/create", icon: PlusSquare, label: "Post" },
    { href: "/notifications", icon: Bell, label: "Alerts", badge: unreadCount },
    { href: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/70 backdrop-blur-md border-t border-white/10">
      <div className="flex items-center justify-around h-16">
        {items.map(({ href, icon: Icon, label, badge }) => {
          const isActive = href === "/" ? location === "/" : location.startsWith(href);
          return (
            <Link key={href} href={href}>
              <div className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-2 relative transition-colors",
                isActive ? "text-primary" : "text-white/60"
              )}>
                <div className="relative">
                  <Icon size={22} />
                  {badge !== undefined && badge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-black text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                </div>
                <span className="text-[9px] font-medium">{label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default function Feed() {
  const [tab, setTab] = useState<"foryou" | "following">("foryou");
  const { data: forYouData, isLoading: forYouLoading } = useGetFeed({ limit: 20 });
  const { data: followingData, isLoading: followingLoading } = useGetFollowingFeed({ limit: 20 });
  const { data: me } = useGetMe();
  const { data: notifications } = useGetNotifications();
  const unreadCount = notifications?.filter(n => !n.isRead).length ?? 0;

  const posts = tab === "foryou" ? (forYouData?.posts ?? []) : (followingData?.posts ?? []);
  const isLoading = tab === "foryou" ? forYouLoading : followingLoading;

  return (
    <div className="relative w-full bg-black" style={{ height: "100dvh" }}>
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 pointer-events-none">
        <div className="pointer-events-auto">
          <Link href="/">
            <span className="font-serif text-xl text-white drop-shadow-lg tracking-tight">Realstarcy</span>
          </Link>
        </div>

        {/* Tabs — TikTok style: Following | For You */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <button
            onClick={() => setTab("following")}
            className="relative flex flex-col items-center"
          >
            <span className={cn(
              "text-[13px] font-semibold transition-colors leading-tight",
              tab === "following" ? "text-white" : "text-white/45"
            )}>
              Following
            </span>
            {tab === "following" && (
              <motion.div layoutId="tab-underline" className="mt-0.5 h-[2px] w-4 bg-white rounded-full" />
            )}
          </button>
          <div className="w-px h-3 bg-white/30" />
          <button
            onClick={() => setTab("foryou")}
            className="relative flex flex-col items-center"
          >
            <span className={cn(
              "text-[13px] font-semibold transition-colors leading-tight",
              tab === "foryou" ? "text-white" : "text-white/45"
            )}>
              For You
            </span>
            {tab === "foryou" && (
              <motion.div layoutId="tab-underline" className="mt-0.5 h-[2px] w-4 bg-white rounded-full" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-3 pointer-events-auto">
          <Link href="/notifications">
            <div className="relative">
              <Bell size={22} stroke="white" strokeWidth={1.5} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-black text-[9px] rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </div>
          </Link>
          <Link href={me ? `/profile/${me.username}` : "/settings"}>
            <Avatar className="w-7 h-7 border border-white/50">
              <AvatarImage src={me?.avatar} />
              <AvatarFallback className="bg-primary/30 text-white text-xs">
                {me?.displayName?.charAt(0) ?? "?"}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>

      {/* Snap scroll feed */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="h-full"
        >
          {isLoading ? (
            <FeedLoader />
          ) : tab === "following" && posts.length === 0 ? (
            <EmptyFollowing />
          ) : posts.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center px-6">
                <p className="font-serif text-2xl text-white mb-2">Quiet here.</p>
                <p className="text-white/60 text-sm mb-6">Be the first to share something real.</p>
                <Link href="/create">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-primary text-black px-6 py-3 rounded-xl text-sm font-bold"
                  >
                    Share a moment
                  </motion.button>
                </Link>
              </div>
            </div>
          ) : (
            <div
              className="h-full overflow-y-scroll"
              style={{ scrollSnapType: "y mandatory", WebkitOverflowScrolling: "touch" }}
            >
              {posts.map((post, i) => (
                <div key={post.id} style={{ scrollSnapAlign: "start" }}>
                  <PostSlide post={post} index={i} />
                </div>
              ))}
              {posts.length > 1 && (
                <motion.div
                  initial={{ opacity: 1 }}
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ repeat: 2, duration: 1.2, delay: 2.5 }}
                  className="fixed bottom-20 left-1/2 -translate-x-1/2 pointer-events-none z-40"
                >
                  <ChevronDown size={20} className="text-white/40" />
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
