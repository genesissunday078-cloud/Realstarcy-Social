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
import { Star, FileText, Users } from "lucide-react";
import { Link } from "wouter";

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
            <Skeleton className="w-20 h-20 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-5 w-40 mb-2" />
              <Skeleton className="h-3.5 w-28 mb-3" />
              <div className="flex gap-4">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-16" />
              </div>
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
          {/* Cover / Header */}
          <div className="relative -mx-4 mb-6">
            <div className="h-32 bg-gradient-to-br from-primary/20 via-primary/5 to-background rounded-b-2xl" />
            <div className="absolute -bottom-10 left-4">
              <Avatar className="w-20 h-20 border-4 border-background shadow-xl">
                <AvatarImage src={user.avatar} alt={user.displayName} />
                <AvatarFallback className="bg-primary/20 text-primary text-2xl font-serif">
                  {user.displayName.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>

          <div className="pt-10 flex items-start justify-between">
            <div>
              <h2 className="font-serif text-xl text-foreground font-semibold">{user.displayName}</h2>
              <p className="text-sm text-muted-foreground">@{user.username}</p>
            </div>

            {isOwnProfile ? (
              <Link href="/settings">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-5 py-2 rounded-lg text-sm font-medium border border-border text-foreground hover:bg-secondary transition-colors"
                >
                  Edit profile
                </motion.button>
              </Link>
            ) : (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleFollowToggle}
                disabled={followMutation.isPending || unfollowMutation.isPending}
                className={`px-5 py-2 rounded-lg text-sm font-bold transition-colors ${
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
            <p className="text-sm text-foreground/80 leading-relaxed mt-3">{user.bio}</p>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-border/40">
            <div className="text-center">
              <p className="font-bold text-foreground text-base">{user.postCount.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Posts</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-foreground text-base">{user.followerCount.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Followers</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-foreground text-base">{user.followingCount.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Following</p>
            </div>
            <div className="flex items-center gap-1.5 ml-auto text-sm">
              <Star size={14} className="text-primary" />
              <span className="font-semibold">{user.starCount.toLocaleString()}</span>
              <span className="text-muted-foreground text-xs">stars</span>
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
          <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4 font-semibold">
            Moments
          </h3>
          <div className="flex flex-col gap-4">
            {postsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-card border border-card-border rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <Skeleton className="w-9 h-9 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-3 w-32 mb-1.5" />
                      <Skeleton className="h-2.5 w-24" />
                    </div>
                  </div>
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
