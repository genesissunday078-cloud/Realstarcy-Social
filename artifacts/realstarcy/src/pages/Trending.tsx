import { useGetTrending } from "@workspace/api-client-react";
import PostCard from "@/components/PostCard";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Link, useSearch } from "wouter";
import { cn } from "@/lib/utils";

export default function Trending() {
  const { data, isLoading } = useGetTrending();
  const search = useSearch();
  const activeTag = new URLSearchParams(search).get("tag");

  const displayPosts = activeTag
    ? (data?.posts ?? []).filter(p => p.tags?.includes(activeTag))
    : (data?.posts ?? []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground text-center">Top Trends</h2>
        <p className="text-sm text-muted-foreground text-center mt-1">The moments resonating most right now.</p>
      </div>

      {/* Trending tags */}
      {!isLoading && data?.tags && data.tags.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3 font-medium">Trending Tags</h3>
          <div className="flex flex-col gap-2">
            {data.tags.map((t, i) => (
              <motion.div
                key={t.tag}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link href={activeTag === t.tag ? "/trending" : `/trending?tag=${t.tag}`}>
                  <div className={cn(
                    "flex items-center justify-between px-4 py-3 rounded-lg border-l-4 cursor-pointer transition-colors",
                    activeTag === t.tag
                      ? "border-[#ff0050] bg-[#ff0050]/10"
                      : i < 3
                        ? "border-[#ff0050]/60 bg-card hover:bg-secondary"
                        : "border-white/20 bg-card hover:bg-secondary"
                  )}>
                    <div className="flex items-center gap-3">
                      {i < 3 && (
                        <span className="text-xs font-bold text-muted-foreground w-4">#{i + 1}</span>
                      )}
                      <span className={cn(
                        "font-semibold",
                        activeTag === t.tag ? "text-[#ff0050]" : i < 3 ? "text-foreground" : "text-foreground/80"
                      )}>
                        #{t.tag}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">{t.count} {t.count === 1 ? "post" : "posts"}</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Trending posts */}
      <div>
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4 font-medium">
          {activeTag ? `#${activeTag}` : "Most Loved Moments"}
        </h3>
        <div className="flex flex-col gap-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-card border border-card-border rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Skeleton className="w-9 h-9 rounded-full" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))
          ) : displayPosts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground font-serif text-lg">
                {activeTag ? `No posts tagged #${activeTag}` : "Nothing trending yet."}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Love posts to push them here.</p>
            </div>
          ) : (
            displayPosts.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <div className="relative">
                  {!activeTag && i < 3 && (
                    <div className="absolute -left-0.5 -top-0.5 bg-[#ff0050] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold z-10">
                      {i + 1}
                    </div>
                  )}
                  <PostCard post={post} />
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
