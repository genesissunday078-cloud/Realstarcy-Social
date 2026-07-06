import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, MessageCircle, Share2, Bell, X,
  Home, TrendingUp, Volume2, VolumeX, Camera, User, FlipHorizontal,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  useGetFeed, useGetFollowingFeed, useGetMe, useGetNotifications,
  useLovePost, useUnlovePost, useFollowUser, useUnfollowUser,
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

const SPONSORED_CARDS = [
  {
    id: "ad-1",
    brand: "Godfather Solar",
    tagline: "Power your world with clean energy.",
    cta: "Shop Now",
    gradient: "from-yellow-950 via-orange-900 to-black",
    link: "#",
  },
  {
    id: "ad-2",
    brand: "KNG Apparel",
    tagline: "Wear the culture. Live the vibe.",
    cta: "Explore",
    gradient: "from-slate-950 via-purple-900 to-black",
    link: "#",
  },
];

function formatDate(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function VideoSlide({ src, isActive }: { src: string; isActive: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    if (!videoRef.current) return;
    if (isActive) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [isActive]);

  return (
    <div className="absolute inset-0">
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-cover"
        loop
        playsInline
        muted={muted}
        autoPlay={isActive}
      />
      <button
        onClick={() => setMuted(m => !m)}
        className="absolute top-16 right-3 w-8 h-8 bg-black/40 rounded-full flex items-center justify-center z-10"
      >
        {muted
          ? <VolumeX size={14} className="text-white" />
          : <Volume2 size={14} className="text-white" />
        }
      </button>
    </div>
  );
}

function SponsoredSlide({ card, index }: { card: typeof SPONSORED_CARDS[0]; index: number }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(8402 + index * 1247);
  const [bigHeart, setBigHeart] = useState(false);
  const lastTapRef = useRef(0);

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      if (!liked) {
        setLiked(true);
        setLikeCount(c => c + 1);
      }
      setBigHeart(true);
      setTimeout(() => setBigHeart(false), 800);
    }
    lastTapRef.current = now;
  };

  return (
    <div
      className="relative w-full flex-shrink-0"
      style={{ height: "100dvh" }}
      onClick={handleDoubleTap}
    >
      <div className={cn("absolute inset-0 bg-gradient-to-br", card.gradient)} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/50" />

      <AnimatePresence>
        {bigHeart && (
          <motion.div
            key="big-heart"
            initial={{ scale: 0, opacity: 0.9 }}
            animate={{ scale: 1.4, opacity: 1 }}
            exit={{ scale: 1.7, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
          >
            <Heart size={110} fill="#f5a623" stroke="#f5a623" className="drop-shadow-2xl" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-16 left-4 z-20">
        <span className="bg-[#ff0050] text-white text-[10px] font-bold px-2 py-1 rounded tracking-wider uppercase">
          Sponsored
        </span>
      </div>

      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
        <div className="text-center px-8">
          <p className="text-white/20 text-7xl font-bold mb-4">★</p>
        </div>
      </div>

      <div className="absolute right-3 bottom-28 flex flex-col items-center gap-5 z-20">
        <div className="flex flex-col items-center gap-1">
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              setLiked(v => !v);
              setLikeCount(c => liked ? c - 1 : c + 1);
            }}
            whileTap={{ scale: 0.75 }}
            className="w-11 h-11 flex items-center justify-center"
          >
            <Heart
              size={28}
              fill={liked ? "#f5a623" : "none"}
              stroke={liked ? "#f5a623" : "white"}
              strokeWidth={1.5}
            />
          </motion.button>
          <span className="text-white text-xs font-semibold drop-shadow">{likeCount.toLocaleString()}</span>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-16 p-5 pb-8 z-20">
        <p className="text-white font-bold text-lg mb-1">{card.brand}</p>
        <p className="text-white/80 text-sm mb-4">{card.tagline}</p>
        <a href={card.link} onClick={e => e.stopPropagation()}>
          <button className="px-6 py-2.5 bg-[#ff0050] text-white font-bold rounded-lg text-sm hover:bg-[#e0003f] transition-colors">
            {card.cta}
          </button>
        </a>
      </div>
    </div>
  );
}

interface SlideProps {
  post: Post;
  index: number;
  isActive: boolean;
}

function PostSlide({ post, index, isActive }: SlideProps) {
  const queryClient = useQueryClient();
  const [isLoved, setIsLoved] = useState(post.isLoved);
  const [loveCount, setLoveCount] = useState(post.loveCount);
  const [loveBurst, setLoveBurst] = useState(false);
  const [bigHeart, setBigHeart] = useState(false);
  const [followed, setFollowed] = useState(false);
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const lastTapRef = useRef(0);

  const invalidateFeeds = () => {
    queryClient.invalidateQueries({ queryKey: getGetFeedQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetFollowingFeedQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetTrendingQueryKey() });
  };

  const loveMutation = useLovePost({
    mutation: {
      onSuccess: (data) => { setLoveCount(data.loveCount); setIsLoved(data.isLoved); invalidateFeeds(); },
    },
  });
  const unloveMutation = useUnlovePost({
    mutation: {
      onSuccess: (data) => { setLoveCount(data.loveCount); setIsLoved(data.isLoved); invalidateFeeds(); },
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

  const doLove = () => {
    if (!isLoved) {
      setLoveBurst(true);
      setTimeout(() => setLoveBurst(false), 700);
      loveMutation.mutate({ id: post.id });
    }
  };

  const handleLoveButton = () => {
    if (isLoved) {
      unloveMutation.mutate({ id: post.id });
    } else {
      doLove();
    }
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      doLove();
      setBigHeart(true);
      setTimeout(() => setBigHeart(false), 800);
    }
    lastTapRef.current = now;
  };

  const gradient = GRADIENTS[index % GRADIENTS.length];

  return (
    <div
      className="relative w-full flex-shrink-0"
      style={{ height: "100dvh" }}
      onClick={handleDoubleTap}
    >
      {post.videoUrl ? (
        <VideoSlide src={post.videoUrl} isActive={isActive} />
      ) : post.imageUrl ? (
        <img
          src={post.imageUrl}
          alt="post"
          className="absolute inset-0 w-full h-full object-cover"
          loading={index === 0 ? "eager" : "lazy"}
        />
      ) : (
        <div className={cn("absolute inset-0 bg-gradient-to-br", gradient)} />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/40" />

      <AnimatePresence>
        {bigHeart && (
          <motion.div
            key="big-heart"
            initial={{ scale: 0, opacity: 0.9 }}
            animate={{ scale: 1.4, opacity: 1 }}
            exit={{ scale: 1.7, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
          >
            <Heart size={110} fill="#f5a623" stroke="#f5a623" className="drop-shadow-2xl" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute right-3 bottom-28 flex flex-col items-center gap-5 z-20">
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
                e.stopPropagation();
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

        <div className="flex flex-col items-center gap-1">
          <motion.button
            onClick={(e) => { e.stopPropagation(); handleLoveButton(); }}
            whileTap={{ scale: 0.75 }}
            className="relative w-11 h-11 flex items-center justify-center"
          >
            <AnimatePresence>
              {loveBurst && (
                <motion.div
                  key="burst"
                  initial={{ scale: 0.5, opacity: 0.9 }}
                  animate={{ scale: 3, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 rounded-full bg-primary"
                />
              )}
            </AnimatePresence>
            <motion.div animate={isLoved ? { scale: [1, 1.35, 1] } : {}}>
              <Heart
                size={28}
                fill={isLoved ? "#f5a623" : "none"}
                stroke={isLoved ? "#f5a623" : "white"}
                strokeWidth={1.5}
              />
            </motion.div>
          </motion.button>
          <span className="text-white text-xs font-semibold drop-shadow">{loveCount.toLocaleString()}</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <Link href={`/post/${post.id}`} onClick={(e) => e.stopPropagation()}>
            <button className="w-11 h-11 flex items-center justify-center">
              <MessageCircle size={28} stroke="white" strokeWidth={1.5} fill="none" />
            </button>
          </Link>
          <span className="text-white text-xs font-semibold drop-shadow">{post.commentCount}</span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            if (navigator.share) navigator.share({ url: `${window.location.origin}/post/${post.id}` });
          }}
          className="w-11 h-11 flex items-center justify-center"
        >
          <Share2 size={26} stroke="white" strokeWidth={1.5} />
        </button>
      </div>

      <div className="absolute bottom-0 left-0 right-16 p-5 pb-8 z-20">
        <div className="flex items-center gap-2 mb-2">
          <Link href={`/profile/${post.author.username}`}>
            <p className="text-white font-bold text-[15px] leading-tight hover:text-primary/90 transition-colors">
              {post.author.displayName}
            </p>
          </Link>
          <span className="text-white/40 text-xs">·</span>
          <span className="text-white/50 text-xs">@{post.author.username}</span>
          <span className="text-white/40 text-xs">·</span>
          <span className="text-white/50 text-xs">{formatDate(post.createdAt)}</span>
          {!followed && (
            <>
              <span className="text-white/40 text-xs">·</span>
              <button
                onClick={() => followMutation.mutate({ username: post.author.username })}
                className="text-[#ff0050] text-xs font-bold hover:text-[#ff0050]/80"
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
                <span className="text-[#ff0050] text-xs font-medium">#{tag}</span>
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
          className="w-8 h-8 border-2 border-[#ff0050] border-t-transparent rounded-full"
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
        <p className="font-serif text-xl text-white mb-2">No one yet</p>
        <p className="text-white/50 text-sm mb-6">Follow people from the For You feed to see their posts here.</p>
        <Link href="/trending">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-[#ff0050] text-white px-6 py-2.5 rounded-xl text-sm font-bold"
          >
            Discover people
          </motion.button>
        </Link>
      </div>
    </div>
  );
}

function CameraModal({ onClose }: { onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [error, setError] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);

  const startCamera = useCallback(async (mode: "user" | "environment") => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setError(null);
    } catch {
      setError("Camera access denied. Please allow camera permissions.");
    }
  }, []);

  useEffect(() => {
    startCamera(facingMode);
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [facingMode, startCamera]);

  const handleFlip = () => {
    setFacingMode(m => m === "user" ? "environment" : "user");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-0 z-[200] bg-black"
    >
      {error ? (
        <div className="flex flex-col items-center justify-center h-full px-8 text-center gap-4">
          <Camera size={48} className="text-white/30" />
          <p className="text-white/70 text-sm">{error}</p>
          <Link href="/create">
            <button
              onClick={onClose}
              className="mt-2 px-6 py-3 bg-[#ff0050] text-white font-bold rounded-xl text-sm"
            >
              Create Post Instead
            </button>
          </Link>
          <button onClick={onClose} className="text-white/50 text-sm mt-1">Close</button>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 border-2 border-white/5 rounded-none" />
          </div>
        </>
      )}

      <button
        onClick={onClose}
        className="absolute top-12 left-4 z-10 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center"
      >
        <X size={20} className="text-white" />
      </button>

      {!error && (
        <>
          <button
            onClick={handleFlip}
            className="absolute top-12 right-4 z-10 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center"
          >
            <FlipHorizontal size={20} className="text-white" />
          </button>

          <div className="absolute bottom-16 left-0 right-0 flex flex-col items-center gap-4 z-10">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onPointerDown={() => setRecording(true)}
              onPointerUp={() => setRecording(false)}
              onPointerLeave={() => setRecording(false)}
              className={cn(
                "w-20 h-20 rounded-full border-4 border-white flex items-center justify-center transition-all duration-150",
                recording ? "bg-[#ff0050] scale-95" : "bg-white/10"
              )}
            >
              <div className={cn(
                "rounded-full transition-all duration-150",
                recording ? "w-8 h-8 bg-[#ff0050] rounded-lg" : "w-14 h-14 bg-white"
              )} />
            </motion.button>
            <p className="text-white/60 text-xs">Hold for video · Tap for photo</p>

            <Link href="/create" onClick={onClose}>
              <button className="text-white/70 text-sm underline underline-offset-2">
                Write a post instead
              </button>
            </Link>
          </div>
        </>
      )}
    </motion.div>
  );
}

function BottomNav({ onCameraOpen }: { onCameraOpen: () => void }) {
  const [location] = useLocation();
  const { data: me } = useGetMe();
  const { data: notifications } = useGetNotifications();
  const unreadCount = Array.isArray(notifications) ? notifications.filter(n => !n.isRead).length : 0;

  const profileHref = me ? `/profile/${me.username}` : "/settings";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-t border-white/10">
      <div className="flex items-center justify-around h-16">
        <Link href="/">
          <div className={cn(
            "flex flex-col items-center gap-0.5 px-3 py-2 transition-colors",
            location === "/" ? "text-white" : "text-white/50"
          )}>
            <Home size={22} />
            <span className="text-[9px] font-medium">Home</span>
          </div>
        </Link>

        <Link href="/trending">
          <div className={cn(
            "flex flex-col items-center gap-0.5 px-3 py-2 transition-colors",
            location.startsWith("/trending") ? "text-white" : "text-white/50"
          )}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              <polyline points="16 7 22 7 22 13" />
            </svg>
            <span className="text-[9px] font-medium">Trend</span>
          </div>
        </Link>

        <button
          onClick={onCameraOpen}
          className="w-12 h-12 rounded-full bg-[#ff0050] flex items-center justify-center shadow-lg shadow-[#ff0050]/30 active:scale-95 transition-transform"
        >
          <span className="text-white text-2xl font-light leading-none mt-[-1px]">+</span>
        </button>

        <Link href="/notifications">
          <div className={cn(
            "flex flex-col items-center gap-0.5 px-3 py-2 transition-colors relative",
            location.startsWith("/notifications") ? "text-white" : "text-white/50"
          )}>
            <div className="relative">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#ff0050] text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </div>
            <span className="text-[9px] font-medium">Alerts</span>
          </div>
        </Link>

        <Link href={profileHref}>
          <div className={cn(
            "flex flex-col items-center gap-0.5 px-3 py-2 transition-colors",
            location.startsWith("/profile") || location.startsWith("/settings") ? "text-white" : "text-white/50"
          )}>
            <User size={22} />
            <span className="text-[9px] font-medium">Me</span>
          </div>
        </Link>
      </div>
    </nav>
  );
}

type FeedTab = "realstarcy" | "following" | "foryou";

function buildRealstarcySlides(posts: Post[]): Array<{ type: "post"; post: Post; index: number } | { type: "ad"; card: typeof SPONSORED_CARDS[0] }> {
  const slides: Array<{ type: "post"; post: Post; index: number } | { type: "ad"; card: typeof SPONSORED_CARDS[0] }> = [];
  slides.push({ type: "ad", card: SPONSORED_CARDS[0] });
  posts.forEach((post, i) => {
    slides.push({ type: "post", post, index: i });
    if ((i + 1) % 5 === 0 && SPONSORED_CARDS[1]) {
      slides.push({ type: "ad", card: SPONSORED_CARDS[1] });
    }
  });
  return slides;
}

export default function Feed() {
  const [tab, setTab] = useState<FeedTab>("foryou");
  const [activeIndex, setActiveIndex] = useState(0);
  const [cameraOpen, setCameraOpen] = useState(false);
  const { data: forYouData, isLoading: forYouLoading } = useGetFeed({ limit: 20 });
  const { data: followingData, isLoading: followingLoading } = useGetFollowingFeed({ limit: 20 });
  const { data: me } = useGetMe();
  const { data: notifications } = useGetNotifications();
  const unreadCount = Array.isArray(notifications) ? notifications.filter(n => !n.isRead).length : 0;
  const scrollRef = useRef<HTMLDivElement>(null);

  const forYouPosts = forYouData?.posts ?? [];
  const followingPosts = followingData?.posts ?? [];
  const realstarcySlides = buildRealstarcySlides(forYouPosts);

  const isLoading = tab === "following" ? followingLoading : forYouLoading;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const idx = Math.round(el.scrollTop / el.clientHeight);
      setActiveIndex(idx);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [tab]);

  useEffect(() => {
    setActiveIndex(0);
    scrollRef.current?.scrollTo({ top: 0 });
  }, [tab]);

  const tabs: { key: FeedTab; label: string }[] = [
    { key: "realstarcy", label: "Realstarcy" },
    { key: "following", label: "Following" },
    { key: "foryou", label: "For You" },
  ];

  return (
    <div className="relative w-full bg-black" style={{ height: "100dvh" }}>
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 pt-3 pb-2 pointer-events-none">
        <div className="pointer-events-auto">
          <Link href="/">
            <span className="font-serif text-xl text-white drop-shadow-lg tracking-tight">★</span>
          </Link>
        </div>

        <div className="flex items-center gap-4 pointer-events-auto">
          {tabs.map((t, i) => (
            <button key={t.key} onClick={() => setTab(t.key)} className="relative flex flex-col items-center">
              <span className={cn(
                "text-[13px] font-semibold transition-colors leading-tight",
                tab === t.key ? "text-white" : "text-white/45"
              )}>
                {t.label}
              </span>
              {tab === t.key && (
                <motion.div layoutId="tab-underline" className="mt-0.5 h-[2px] w-full bg-white rounded-full" />
              )}
              {i < tabs.length - 1 && (
                <span className="sr-only">|</span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 pointer-events-auto">
          <Link href="/notifications">
            <div className="relative">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#ff0050] text-white text-[9px] rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </div>
          </Link>
          <Link href={me ? `/profile/${me.username}` : "/settings"}>
            <Avatar className="w-7 h-7 border border-white/50">
              <AvatarImage src={me?.avatar} />
              <AvatarFallback className="bg-[#ff0050]/30 text-white text-xs">
                {me?.displayName?.charAt(0) ?? "?"}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>

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
          ) : tab === "following" && followingPosts.length === 0 ? (
            <EmptyFollowing />
          ) : tab === "following" ? (
            <div
              ref={scrollRef}
              className="h-full overflow-y-scroll"
              style={{ scrollSnapType: "y mandatory", WebkitOverflowScrolling: "touch" }}
            >
              {followingPosts.map((post, i) => (
                <div key={post.id} style={{ scrollSnapAlign: "start" }}>
                  <PostSlide post={post} index={i} isActive={i === activeIndex} />
                </div>
              ))}
            </div>
          ) : tab === "realstarcy" ? (
            forYouPosts.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center px-6">
                  <p className="font-serif text-2xl text-white mb-2">Nothing yet.</p>
                  <p className="text-white/60 text-sm">Be the first to share something real.</p>
                </div>
              </div>
            ) : (
              <div
                ref={scrollRef}
                className="h-full overflow-y-scroll"
                style={{ scrollSnapType: "y mandatory", WebkitOverflowScrolling: "touch" }}
              >
                {realstarcySlides.map((slide, i) => (
                  <div key={slide.type === "ad" ? `${slide.card.id}-${i}` : slide.post.id} style={{ scrollSnapAlign: "start" }}>
                    {slide.type === "ad"
                      ? <SponsoredSlide card={slide.card} index={i} />
                      : <PostSlide post={slide.post} index={slide.index} isActive={i === activeIndex} />
                    }
                  </div>
                ))}
              </div>
            )
          ) : forYouPosts.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center px-6">
                <p className="font-serif text-2xl text-white mb-2">Quiet here.</p>
                <p className="text-white/60 text-sm mb-6">Be the first to share something real.</p>
                <Link href="/create">
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-[#ff0050] text-white px-6 py-3 rounded-xl text-sm font-bold">
                    Share a moment
                  </motion.button>
                </Link>
              </div>
            </div>
          ) : (
            <div
              ref={scrollRef}
              className="h-full overflow-y-scroll"
              style={{ scrollSnapType: "y mandatory", WebkitOverflowScrolling: "touch" }}
            >
              {forYouPosts.map((post, i) => (
                <div key={post.id} style={{ scrollSnapAlign: "start" }}>
                  <PostSlide post={post} index={i} isActive={i === activeIndex} />
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <BottomNav onCameraOpen={() => setCameraOpen(true)} />

      <AnimatePresence>
        {cameraOpen && <CameraModal onClose={() => setCameraOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
