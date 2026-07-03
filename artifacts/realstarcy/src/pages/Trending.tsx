import { useGetTrending } from "@workspace/api-client-react";
import PostCard from "@/components/PostCard";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

export default function Trending() {
  const { data, isLoading } = useGetTrending();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp size={22} className="text-primary" />
          <h2 className="font-serif text-2xl text-foreground">Trending</h2>
        </div>
        <p className="text-sm text-muted-foreground">The moments resonating most right now.</p>
      </div>

      {/* Trending tags */}
      {!isLoading && data?.tags && data.tags.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3 font-medium">Top Tags</h3>
          <div className="flex flex-wrap gap-2">
            {data.tags.map((t, i) => (
              <motion.div
                key={t.tag}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
              >
                <Link href={`/trending?tag=${t.tag}`}>
                  <div className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full border border-border cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors",
                    i < 3 ? "border-primary/30 bg-primary/5" : ""
                  )}>
                    <span className="text-sm font-medium">#{t.tag}</span>
                    <span className="text-xs text-muted-foreground">{t.count}</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Trending posts */}
      <div>
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4 font-medium">Most Loved Moments</h3>
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
          ) : data?.posts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground font-serif text-lg">Nothing trending yet.</p>
              <p className="text-sm text-muted-foreground mt-1">Love posts to push them here.</p>
            </div>
          ) : (
            data?.posts.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <div className="relative">
                  {i < 3 && (
                    <div className="absolute -left-0.5 -top-0.5 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold z-10">
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
