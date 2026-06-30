import { useParams } from "wouter";
import { motion } from "framer-motion";
import {
  useGetUserProfile,
  useListPosts,
  useFollowUser,
  useUnfollowUser,
  useGetMe,
  getGetUserProfileQueryKey,
  getListPostsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import PostCard from "@/components/PostCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, FileText } from "lucide-react";

export default function Profile() {
  const { username } = useParams<{ username: string }>();
  const queryClient = useQueryClient();

  const { data: user, isLoading: userLoading } = useGetUserProfile(username ?? "", {
    query: { enabled: !!username, queryKey: getGetUserProfileQueryKey(username ?? "") },
  });
  const { data: postsData, isLoading: postsLoading } = useListPosts(
    { userId: user?.id },
    { query: { enabled: !!user?.id, queryKey: getListPostsQueryKey({ userId: user?.id }) } }
  );
  const { data: me } = useGetMe();

  const followMutation = useFollowUser({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetUserProfileQueryKey(username ?? "") });
      },
    },
  });

  const unfollowMutation = useUnfollowUser({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetUserProfileQueryKey(username ?? "") });
      },
    },
  });

  const isOwnProfile = me?.username === username;

  const handleFollowToggle = () => {
    if (!username) return;
    if (user?.isFollowing) {
      unfollowMutation.mutate({ username });
    } else {
      followMutation.mutate({ username });
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {userLoading ? (
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Skeleton className="w-16 h-16 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-5 w-40 mb-2" />
              <Skeleton className="h-3.5 w-28" />
            </div>
          </div>
          <Skeleton className="h-3.5 w-full mb-1.5" />
          <Skeleton className="h-3.5 w-2/3" />
        </div>
      ) : user ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={user.avatar} alt={user.displayName} />
                <AvatarFallback className="bg-primary/20 text-primary text-xl font-serif">
                  {user.displayName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-serif text-xl text-foreground">{user.displayName}</h2>
                <p className="text-sm text-muted-foreground">@{user.username}</p>
              </div>
            </div>

            {!isOwnProfile && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleFollowToggle}
                disabled={followMutation.isPending || unfollowMutation.isPending}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  user.isFollowing
                    ? "bg-secondary text-secondary-foreground border border-border"
                    : "bg-primary text-primary-foreground"
                }`}
              >
                {user.isFollowing ? "Following" : "Follow"}
              </motion.button>
            )}
          </div>

          {user.bio && (
            <p className="text-sm text-foreground/80 leading-relaxed mb-4">{user.bio}</p>
          )}

          {/* Stats — no follower count shown intentionally */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5 text-sm">
              <FileText size={15} className="text-muted-foreground" />
              <span className="font-medium">{user.postCount}</span>
              <span className="text-muted-foreground">moments</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <Star size={15} className="text-primary" />
              <span className="font-medium">{user.starCount}</span>
              <span className="text-muted-foreground">stars received</span>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="text-center py-16">
          <p className="text-muted-foreground font-serif text-lg">User not found.</p>
        </div>
      )}

      {/* Posts */}
      {user && (
        <div>
          <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4 font-medium">
            Moments
          </h3>
          <div className="flex flex-col gap-4">
            {postsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-card border border-card-border rounded-xl p-5">
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))
            ) : postsData?.posts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-sm">
                  {isOwnProfile ? "You haven't shared anything yet." : "No moments shared yet."}
                </p>
              </div>
            ) : (
              postsData?.posts.map((post, i) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <PostCard post={post} />
                </motion.div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
