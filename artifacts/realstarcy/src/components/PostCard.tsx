import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Star, MessageCircle, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  useStarPost,
  useUnstarPost,
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
  const [isStarred, setIsStarred] = useState(post.isStarred);
  const [starCount, setStarCount] = useState(post.starCount);
  const [starBurst, setStarBurst] = useState(false);

  const starMutation = useStarPost({
    mutation: {
      onSuccess: (data) => {
        setStarCount(data.starCount);
        setIsStarred(data.isStarred);
        queryClient.invalidateQueries({ queryKey: getGetFeedQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetPostQueryKey(post.id) });
        queryClient.invalidateQueries({ queryKey: getGetTrendingQueryKey() });
      },
    },
  });

  const unstarMutation = useUnstarPost({
    mutation: {
      onSuccess: (data) => {
        setStarCount(data.starCount);
        setIsStarred(data.isStarred);
        queryClient.invalidateQueries({ queryKey: getGetFeedQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetPostQueryKey(post.id) });
        queryClient.invalidateQueries({ queryKey: getGetTrendingQueryKey() });
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

  const handleStar = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isStarred) {
      unstarMutation.mutate({ id: post.id });
    } else {
      setStarBurst(true);
      setTimeout(() => setStarBurst(false), 600);
      starMutation.mutate({ id: post.id });
    }
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

      {/* Content */}
      <Link href={`/post/${post.id}`}>
        <div className="cursor-pointer">
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
            onClick={handleStar}
            whileTap={{ scale: 0.85 }}
            className={cn(
              "flex items-center gap-1.5 text-sm transition-colors relative",
              isStarred ? "text-primary" : "text-muted-foreground hover:text-primary"
            )}
          >
            <AnimatePresence>
              {starBurst && (
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
            <motion.div animate={isStarred ? { rotate: [0, -15, 15, 0] } : {}}>
              <Star size={17} fill={isStarred ? "currentColor" : "none"} />
            </motion.div>
            <span className="font-medium">{starCount}</span>
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
