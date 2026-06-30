import { useGetFeed, useGetPlatformStats, useGetMe } from "@workspace/api-client-react";
import PostCard from "@/components/PostCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { PlusCircle } from "lucide-react";

function StatBadge({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <p className="text-lg font-serif text-primary font-semibold">{value.toLocaleString()}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export default function Feed() {
  const { data: feedData, isLoading } = useGetFeed({ limit: 20 });
  const { data: stats } = useGetPlatformStats();
  const { data: me } = useGetMe();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-serif text-2xl text-foreground">Discovery Feed</h2>
          <Link href="/create">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium"
            >
              <PlusCircle size={16} />
              Post
            </motion.button>
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">Real moments from real people. No algorithms. No performance.</p>
      </div>

      {/* Stats */}
      {stats && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-around bg-card border border-card-border rounded-xl p-4 mb-6"
        >
          <StatBadge label="moments shared" value={stats.totalPosts} />
          <div className="w-px h-8 bg-border" />
          <StatBadge label="stars given" value={stats.totalStars} />
          <div className="w-px h-8 bg-border" />
          <StatBadge label="real people" value={stats.totalUsers} />
          <div className="w-px h-8 bg-border" />
          <StatBadge label="today" value={stats.newPostsToday} />
        </motion.div>
      )}

      {/* Posts */}
      <div className="flex flex-col gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card border border-card-border rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <Skeleton className="w-9 h-9 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-3 w-32 mb-1.5" />
                  <Skeleton className="h-2.5 w-24" />
                </div>
              </div>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-4" />
              <Skeleton className="h-36 w-full rounded-lg" />
            </div>
          ))
        ) : feedData?.posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-serif text-xl text-muted-foreground mb-2">Quiet here.</p>
            <p className="text-sm text-muted-foreground mb-4">Be the first to share something real.</p>
            <Link href="/create">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg text-sm font-medium"
              >
                Share a moment
              </motion.button>
            </Link>
          </div>
        ) : (
          feedData?.posts.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.3 }}
            >
              <PostCard post={post} />
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
