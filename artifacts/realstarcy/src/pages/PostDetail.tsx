import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  useGetPost,
  useGetComments,
  useCreateComment,
  useDeleteComment,
  useGetMe,
  getGetCommentsQueryKey,
  getGetPostQueryKey,
  getGetFeedQueryKey,
  getListPostsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import PostCard from "@/components/PostCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Trash2 } from "lucide-react";

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const postId = parseInt(id ?? "0");
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState("");

  const { data: post, isLoading: postLoading } = useGetPost(postId, {
    query: { enabled: !!postId, queryKey: getGetPostQueryKey(postId) },
  });
  const { data: comments, isLoading: commentsLoading } = useGetComments(postId, {
    query: { enabled: !!postId, queryKey: getGetCommentsQueryKey(postId) },
  });
  const { data: me } = useGetMe();

  const createComment = useCreateComment({
    mutation: {
      onSuccess: () => {
        setCommentText("");
        queryClient.invalidateQueries({ queryKey: getGetCommentsQueryKey(postId) });
        queryClient.invalidateQueries({ queryKey: getGetPostQueryKey(postId) });
        queryClient.invalidateQueries({ queryKey: getGetFeedQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
      },
    },
  });

  const deleteComment = useDeleteComment({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCommentsQueryKey(postId) });
        queryClient.invalidateQueries({ queryKey: getGetPostQueryKey(postId) });
      },
    },
  });

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    createComment.mutate({ id: postId, data: { content: commentText.trim() } });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm transition-colors"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      {postLoading ? (
        <div className="bg-card border border-card-border rounded-xl p-5 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <Skeleton className="w-9 h-9 rounded-full" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ) : post ? (
        <div className="mb-6">
          <PostCard post={post} />
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-muted-foreground font-serif text-lg">Moment not found.</p>
        </div>
      )}

      {/* Comments */}
      <div>
        <h3 className="font-serif text-lg mb-4">
          {comments?.length ?? 0} {comments?.length === 1 ? "Response" : "Responses"}
        </h3>

        {/* Comment form */}
        {me && (
          <motion.form
            onSubmit={handleComment}
            className="bg-card border border-card-border rounded-xl p-4 mb-6"
          >
            <div className="flex gap-3">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarImage src={me.avatar} />
                <AvatarFallback className="bg-primary/20 text-primary text-xs">{me.displayName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Respond honestly..."
                  className="min-h-16 resize-none bg-transparent border-0 border-b border-border rounded-none px-0 text-sm focus-visible:ring-0 mb-3"
                />
                <div className="flex justify-end">
                  <motion.button
                    type="submit"
                    whileTap={{ scale: 0.95 }}
                    disabled={!commentText.trim() || createComment.isPending}
                    className="px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    {createComment.isPending ? "Posting..." : "Respond"}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.form>
        )}

        {/* Comments list */}
        <div className="flex flex-col gap-3">
          {commentsLoading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-card border border-card-border rounded-xl p-4">
                <div className="flex gap-3">
                  <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                  <div className="flex-1">
                    <Skeleton className="h-3 w-24 mb-2" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              </div>
            ))
          ) : comments?.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground text-sm">No responses yet. Be the first to speak up.</p>
            </div>
          ) : (
            comments?.map((comment, i) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-card border border-card-border rounded-xl p-4"
              >
                <div className="flex gap-3">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage src={comment.author.avatar} />
                    <AvatarFallback className="bg-primary/20 text-primary text-xs">{comment.author.displayName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{comment.author.displayName}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                      {me?.id === comment.author.id && (
                        <button
                          onClick={() => deleteComment.mutate({ id: postId, commentId: comment.id })}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-foreground/90 leading-relaxed">{comment.content}</p>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
