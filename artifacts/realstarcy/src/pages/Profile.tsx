import { useState, useEffect, useRef } from "react";
import { useParams } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  useGetUserProfile, useListPosts, useFollowUser, useUnfollowUser,
  useGetMe, useUpdateMe,
  getGetUserProfileQueryKey, getListPostsQueryKey, getGetMeQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import PostCard from "@/components/PostCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, Pencil, X, Check, Camera, Loader2 } from "lucide-react";

export default function Profile() {
  const { username } = useParams<{ username: string }>();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: user, isLoading: userLoading } = useGetUserProfile(username ?? "", {
    query: { enabled: !!username, queryKey: getGetUserProfileQueryKey(username ?? "") },
  });
  const { data: postsData, isLoading: postsLoading } = useListPosts(
    { userId: user?.id },
    { query: { enabled: !!user?.id, queryKey: getListPostsQueryKey({ userId: user?.id }) } }
  );
  const { data: me } = useGetMe();

  useEffect(() => {
    if (user && editOpen) {
      setDisplayName(user.displayName);
      setBio(user.bio ?? "");
      setAvatar(user.avatar ?? "");
    }
  }, [user, editOpen]);

  const updateMe = useUpdateMe({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetUserProfileQueryKey(username ?? "") });
        setSaved(true);
        setTimeout(() => { setSaved(false); setEditOpen(false); }, 1200);
      },
    },
  });

  const followMutation = useFollowUser({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetUserProfileQueryKey(username ?? "") }),
    },
  });
  const unfollowMutation = useUnfollowUser({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetUserProfileQueryKey(username ?? "") }),
    },
  });

  const isOwnProfile = me?.username === username;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error();
      const data = await res.json() as { url: string };
      setAvatar(data.url);
    } catch { /* silent */ } finally {
      setUploading(false);
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
              </div>
            </div>
          </div>
        </div>
      ) : user ? (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          {/* Cover */}
          <div className="relative -mx-4 mb-6">
            <div className="h-28 bg-gradient-to-br from-primary/25 via-primary/8 to-background rounded-b-2xl" />
            <div className="absolute -bottom-10 left-4">
              <div className="relative">
                <Avatar className="w-20 h-20 border-4 border-background shadow-xl">
                  <AvatarImage src={editOpen ? avatar : user.avatar} alt={user.displayName} />
                  <AvatarFallback className="bg-primary/20 text-primary text-2xl font-serif">
                    {user.displayName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {isOwnProfile && editOpen && (
                  <>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center transition-opacity hover:opacity-100"
                    >
                      {uploading
                        ? <Loader2 size={20} className="text-white animate-spin" />
                        : <Camera size={20} className="text-white" />
                      }
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="pt-10 flex items-start justify-between">
            <div>
              <h2 className="font-serif text-xl text-foreground font-semibold">{user.displayName}</h2>
              <p className="text-sm text-muted-foreground">@{user.username}</p>
            </div>

            {isOwnProfile ? (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setEditOpen(v => !v)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border border-border hover:bg-secondary transition-colors"
              >
                <Pencil size={14} />
                Edit profile
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => user.isFollowing
                  ? unfollowMutation.mutate({ username: username! })
                  : followMutation.mutate({ username: username! })
                }
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

          {user.bio && !editOpen && (
            <p className="text-sm text-foreground/80 leading-relaxed mt-3">{user.bio}</p>
          )}

          {/* Stats */}
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

          {/* Inline edit form */}
          <AnimatePresence>
            {editOpen && (
              <motion.form
                key="edit-form"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={e => { e.preventDefault(); updateMe.mutate({ data: { displayName, bio, avatar } }); }}
                className="mt-5 bg-card border border-border rounded-xl p-5 space-y-4 overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-base">Edit profile</h3>
                  <button type="button" onClick={() => setEditOpen(false)} className="text-muted-foreground hover:text-foreground">
                    <X size={18} />
                  </button>
                </div>

                {/* Avatar upload hint */}
                <p className="text-xs text-muted-foreground -mt-1">
                  Tap your photo above to change your profile picture, or paste a URL below.
                </p>

                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Avatar URL (optional)</Label>
                  <Input
                    value={avatar}
                    onChange={e => setAvatar(e.target.value)}
                    placeholder="https://..."
                    className="bg-secondary border-border text-sm"
                  />
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Display Name</Label>
                  <Input
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    className="bg-secondary border-border"
                  />
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Bio</Label>
                  <Textarea
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    placeholder="Something real about you…"
                    className="bg-secondary border-border resize-none min-h-16"
                    maxLength={200}
                  />
                  <p className="text-xs text-muted-foreground text-right mt-0.5">{bio.length}/200</p>
                </div>

                <motion.button
                  type="submit"
                  whileTap={{ scale: 0.97 }}
                  disabled={updateMe.isPending || !displayName.trim()}
                  className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saved ? <><Check size={15} /> Saved!</> : updateMe.isPending ? "Saving…" : "Save changes"}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div className="text-center py-16">
          <p className="text-muted-foreground font-serif text-lg">User not found.</p>
        </div>
      )}

      {/* Posts */}
      {user && (
        <div>
          <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4 font-semibold">Moments</h3>
          <div className="flex flex-col gap-4">
            {postsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-card border border-card-border rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <Skeleton className="w-9 h-9 rounded-full" />
                    <div className="flex-1"><Skeleton className="h-3 w-32 mb-1.5" /><Skeleton className="h-2.5 w-24" /></div>
                  </div>
                  <Skeleton className="h-4 w-full mb-2" /><Skeleton className="h-4 w-3/4" />
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
                <motion.div key={post.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
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
