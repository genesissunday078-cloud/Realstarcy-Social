import { useState, useRef } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  useLovePost,
  useUnlovePost,
  useGetMe,
  getGetFeedQueryKey,
  getListPostsQueryKey,
  getGetPostQueryKey,
  getGetTrendingQueryKey,
  useDeletePost,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import type { Post } from "@workspace/api-client-react";

interface PostCardProps {
  post: Post;
  showActions?: boolean;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function PostCard({ post, showActions = true }: PostCardProps) {
  const queryClient = useQueryClient();
  const { data: me } = useGetMe();
  const [isLoved, setIsLoved] = useState(post.isLoved);
  const [loveCount, setLoveCount] = useState(post.loveCount);
  const [loveBurst, setLoveBurst] = useState(false);
  const [bigHeart, setBigHeart] = useState(false);
  const lastTapRef = useRef(0);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getGetFeedQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetPostQueryKey(post.id) });
    queryClient.invalidateQueries({ queryKey: getGetTrendingQueryKey() });
  };

  const loveMutation = useLovePost({
    mutation: {
      onSuccess: (data) => {
        setLoveCount(data.loveCount);
        setIsLoved(data.isLoved);
        invalidate();
      },
    },
  });

  const unloveMutation = useUnlovePost({
    mutation: {
      onSuccess: (data) => {
        setLoveCount(data.loveCount);
        setIsLoved(data.isLoved);
        invalidate();
      },
    },
  });

  const deleteMutation = useDeletePost({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetFeedQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTrendingQueryKey() });
      },
    },
  });

  const doLove = () => {
    if (!isLoved) {
      setLoveBurst(true);
      setTimeout(() => setLoveBurst(false), 600);
      loveMutation.mutate({ id: post.id });
    }
  };

  const handleLoveButton = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLoved) {
      unloveMutation.mutate({ id: post.id });
    } else {
      doLove();
    }
  };

  const handleContentTap = (e: React.MouseEvent) => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      e.preventDefault();
      doLove();
      setBigHeart(true);
      setTimeout(() => setBigHeart(false), 800);
    }
    lastTapRef.current = now;
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete this post?")) {
      deleteMutation.mutate({ id: post.id });
    }
  };

  const isOwn = me?.id === post.author.id;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-card-border rounded-xl p-5 hover:border-primary/20 transition-colors"
    >
      {/* Author */}
      <div className="flex items-start justify-between mb-3">
        <Link href={`/profile/${post.author.username}`}>
          <div className="flex items-center gap-3 cursor-pointer group">
            <Avatar className="w-9 h-9">
              <AvatarImage src={post.author.avatar} alt={post.author.displayName} />
              <AvatarFallback className="bg-primary/20 text-primary text-sm">
                {post.author.displayName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm group-hover:text-primary transition-colors">
                {post.author.displayName}
              </p>
              <p className="text-xs text-muted-foreground">@{post.author.username} · {formatDate(post.createdAt)}</p>
            </div>
          </div>
        </Link>
        {isOwn && showActions && (
          <button
            onClick={handleDelete}
            className="text-muted-foreground hover:text-destructive transition-colors p-1"
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>

      {/* Content — double-tap/double-click to love */}
      <div className="relative cursor-pointer" onClick={handleContentTap}>
        <Link href={`/post/${post.id}`} onClick={(e) => { if (Date.now() - lastTapRef.current < 20) e.preventDefault(); }}>
          <div>
            <p className="text-sm leading-relaxed text-foreground/90 mb-3">{post.content}</p>
            {post.imageUrl && (
              <div className="rounded-lg overflow-hidden mb-3 aspect-video bg-secondary">
                <img
                  src={post.imageUrl}
                  alt="Post"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            )}
          </div>
        </Link>

        <AnimatePresence>
          {bigHeart && (
            <motion.div
              key="big-heart"
              initial={{ scale: 0, opacity: 0.9 }}
              animate={{ scale: 1.3, opacity: 1 }}
              exit={{ scale: 1.6, opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
            >
              <Heart size={80} fill="#f5a623" stroke="#f5a623" className="drop-shadow-lg" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {post.tags.map(tag => (
            <Link key={tag} href={`/trending?tag=${tag}`}>
              <Badge
                variant="secondary"
                className="text-xs cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors"
              >
                #{tag}
              </Badge>
            </Link>
          ))}
        </div>
      )}

      {/* Actions */}
      {showActions && (
        <div className="flex items-center gap-4 pt-2 border-t border-border/40">
          <motion.button
            onClick={handleLoveButton}
            whileTap={{ scale: 0.85 }}
            className={cn(
              "flex items-center gap-1.5 text-sm transition-colors relative",
              isLoved ? "text-primary" : "text-muted-foreground hover:text-primary"
            )}
          >
            <AnimatePresence>
              {loveBurst && (
                <motion.div
                  key="burst"
                  initial={{ scale: 0.5, opacity: 1 }}
                  animate={{ scale: 2.5, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-primary rounded-full"
                  style={{ zIndex: -1 }}
                />
              )}
            </AnimatePresence>
            <motion.div animate={isLoved ? { scale: [1, 1.3, 1] } : {}}>
              <Heart size={17} fill={isLoved ? "currentColor" : "none"} />
            </motion.div>
            <span className="font-medium">{loveCount}</span>
          </motion.button>

          <Link href={`/post/${post.id}`}>
            <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <MessageCircle size={17} />
              <span className="font-medium">{post.commentCount}</span>
            </button>
          </Link>
        </div>
      )}
    </motion.article>
  );
}
