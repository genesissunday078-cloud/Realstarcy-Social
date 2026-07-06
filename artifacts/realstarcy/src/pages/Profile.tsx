import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "wouter";
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
import { Heart, Pencil, X, Check, Camera, Loader2, Grid3X3, List, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Post } from "@workspace/api-client-react";

function PostGridItem({ post }: { post: Post }) {
  return (
    <Link href={`/post/${post.id}`}>
      <div className="aspect-square relative overflow-hidden bg-card border border-border/40 hover:opacity-90 transition-opacity cursor-pointer group">
        {post.imageUrl ? (
          <img src={post.imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
        ) : post.videoUrl ? (
          <div className="w-full h-full bg-gradient-to-br from-indigo-950 to-slate-900 flex items-center justify-center">
            <span className="text-white/30 text-2xl">▶</span>
          </div>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/10 to-background flex items-center justify-center p-2">
            <p className="text-foreground/60 text-[10px] text-center line-clamp-4 leading-tight">{post.content}</p>
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="flex items-center gap-3 text-white text-sm font-semibold">
            <span className="flex items-center gap-1"><Heart size={14} fill="white" stroke="white" />{post.loveCount}</span>
            <span className="flex items-center gap-1"><MessageCircle size={14} fill="white" stroke="white" />{post.commentCount}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function Profile() {
  const { username: profileSlug } = useParams<{ username: string }>();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [saved, setSaved] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: user, isLoading: userLoading } = useGetUserProfile(profileSlug ?? "", {
    query: { enabled: !!profileSlug, queryKey: getGetUserProfileQueryKey(profileSlug ?? "") },
  });
  const { data: postsData, isLoading: postsLoading } = useListPosts(
    { userId: user?.id },
    { query: { enabled: !!user?.id, queryKey: getListPostsQueryKey({ userId: user?.id }) } }
  );
  const { data: me } = useGetMe();

  useEffect(() => {
    if (user && editOpen) {
      setDisplayName(user.displayName);
      setUsername(user.username);
      setBio(user.bio ?? "");
      setAvatar(user.avatar ?? "");
      setUsernameError("");
    }
  }, [user, editOpen]);

  const updateMe = useUpdateMe({
    mutation: {
      onSuccess: (updated) => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetUserProfileQueryKey(profileSlug ?? "") });
        queryClient.invalidateQueries({ queryKey: getGetUserProfileQueryKey(updated.username) });
        setSaved(true);
        setTimeout(() => {
          setSaved(false);
          setEditOpen(false);
          if (updated.username !== profileSlug) {
            window.location.href = `/profile/${updated.username}`;
          }
        }, 1200);
      },
      onError: (err: unknown) => {
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
        if (msg === "Username taken") setUsernameError("That username is already taken.");
        else setUsernameError("Something went wrong.");
      },
    },
  });

  const followMutation = useFollowUser({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetUserProfileQueryKey(profileSlug ?? "") }),
    },
  });
  const unfollowMutation = useUnfollowUser({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetUserProfileQueryKey(profileSlug ?? "") }),
    },
  });

  const isOwnProfile = me?.username === profileSlug;

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
      updateMe.mutate({ data: { displayName: user?.displayName ?? "", bio: user?.bio ?? "", avatar: data.url } });
    } catch { /* silent */ } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {userLoading ? (
        <div className="px-4 py-8 mb-8">
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
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          {/* Cover banner */}
          <div className="relative">
            <div className="h-32 bg-gradient-to-br from-[#ff0050]/20 via-primary/10 to-background" />

            {/* Avatar */}
            <div className="absolute -bottom-12 left-0 right-0 flex justify-center">
              <div className="relative">
                <div
                  className={cn(
                    "w-24 h-24 rounded-full border-4 border-background overflow-hidden shadow-2xl",
                    isOwnProfile && "cursor-pointer"
                  )}
                  onClick={() => isOwnProfile && fileInputRef.current?.click()}
                >
                  <Avatar className="w-full h-full">
                    <AvatarImage src={editOpen ? avatar : user.avatar} alt={user.displayName} className="object-cover" />
                    <AvatarFallback className="bg-primary/20 text-primary text-3xl font-serif">
                      {user.displayName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                {isOwnProfile && (
                  <>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                    <div
                      className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#ff0050] rounded-full flex items-center justify-center cursor-pointer shadow-lg border-2 border-background"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {uploading
                        ? <Loader2 size={12} className="text-white animate-spin" />
                        : <Camera size={12} className="text-white" />
                      }
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Profile info */}
          <div className="pt-16 px-4 pb-4 text-center">
            <h2 className="font-serif text-xl text-foreground font-semibold">{user.displayName}</h2>
            <p className="text-sm text-[#ff0050] mt-0.5">@{user.username}</p>

            {user.bio && !editOpen && (
              <p className="text-sm text-foreground/70 leading-relaxed mt-2 max-w-sm mx-auto">{user.bio}</p>
            )}

            {/* Stats row */}
            <div className="flex items-center justify-center gap-8 mt-4 py-4 border-t border-b border-border/30">
              <div className="text-center">
                <p className="font-bold text-foreground text-lg leading-tight">{user.followingCount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Following</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-foreground text-lg leading-tight">{user.followerCount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Followers</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-foreground text-lg leading-tight">{user.postCount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Posts</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-[#ff0050] text-lg leading-tight flex items-center justify-center gap-1">
                  <Heart size={14} fill="#ff0050" stroke="#ff0050" />
                  {user.loveCount.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Loves</p>
              </div>
            </div>

            {/* Action button */}
            <div className="mt-4">
              {isOwnProfile ? (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setEditOpen(v => !v)}
                  className="flex items-center gap-1.5 px-6 py-2 rounded-lg text-sm font-bold border-2 border-[#ff0050] text-[#ff0050] hover:bg-[#ff0050] hover:text-white transition-colors mx-auto"
                >
                  <Pencil size={14} />
                  Edit Profile
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => user.isFollowing
                    ? unfollowMutation.mutate({ username: profileSlug! })
                    : followMutation.mutate({ username: profileSlug! })
                  }
                  disabled={followMutation.isPending || unfollowMutation.isPending}
                  className={`px-8 py-2 rounded-lg text-sm font-bold transition-colors ${
                    user.isFollowing
                      ? "bg-secondary text-secondary-foreground border border-border"
                      : "bg-[#ff0050] text-white"
                  }`}
                >
                  {user.isFollowing ? "Following" : "Follow"}
                </motion.button>
              )}
            </div>

            {/* Inline edit form */}
            <AnimatePresence>
              {editOpen && (
                <motion.form
                  key="edit-form"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={e => { e.preventDefault(); updateMe.mutate({ data: { username, displayName, bio, avatar } }); }}
                  className="mt-5 bg-card border border-border rounded-xl p-5 space-y-4 overflow-hidden text-left"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-base">Edit Profile</h3>
                    <button type="button" onClick={() => setEditOpen(false)} className="text-muted-foreground hover:text-foreground">
                      <X size={18} />
                    </button>
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
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Username</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                      <Input
                        value={username}
                        onChange={e => { setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 30)); setUsernameError(""); }}
                        placeholder="your_handle"
                        className="bg-secondary border-border pl-7"
                      />
                    </div>
                    {usernameError && <p className="text-xs text-red-400 mt-1">{usernameError}</p>}
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

                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Avatar URL (optional)</Label>
                    <Input
                      value={avatar}
                      onChange={e => setAvatar(e.target.value)}
                      placeholder="https://..."
                      className="bg-secondary border-border text-sm"
                    />
                  </div>

                  <motion.button
                    type="submit"
                    whileTap={{ scale: 0.97 }}
                    disabled={updateMe.isPending || !displayName.trim() || !username.trim()}
                    className="w-full py-3 bg-[#ff0050] text-white rounded-lg font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saved ? <><Check size={15} /> Saved!</> : updateMe.isPending ? "Saving…" : "Save"}
                  </motion.button>
                  <button
                    type="button"
                    onClick={() => setEditOpen(false)}
                    className="w-full py-2 text-[#ff0050] text-sm font-medium"
                  >
                    Cancel
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      ) : (
        <div className="text-center py-16 px-4">
          <p className="text-muted-foreground font-serif text-lg">User not found.</p>
        </div>
      )}

      {/* Posts section */}
      {user && (
        <div>
          <div className="flex items-center justify-between px-4 py-3 border-t border-b border-border/40">
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Moments</h3>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setViewMode("grid")}
                className={cn("p-1.5 rounded transition-colors", viewMode === "grid" ? "text-foreground" : "text-muted-foreground")}
              >
                <Grid3X3 size={18} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn("p-1.5 rounded transition-colors", viewMode === "list" ? "text-foreground" : "text-muted-foreground")}
              >
                <List size={18} />
              </button>
            </div>
          </div>

          {postsLoading ? (
            viewMode === "grid" ? (
              <div className="grid grid-cols-3 gap-px">
                {Array.from({ length: 9 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-square" />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-4 px-4 py-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-card border border-card-border rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <Skeleton className="w-9 h-9 rounded-full" />
                      <div className="flex-1"><Skeleton className="h-3 w-32 mb-1.5" /><Skeleton className="h-2.5 w-24" /></div>
                    </div>
                    <Skeleton className="h-4 w-full mb-2" /><Skeleton className="h-4 w-3/4" />
                  </div>
                ))}
              </div>
            )
          ) : postsData?.posts.length === 0 ? (
            <div className="text-center py-16 px-4">
              <p className="text-muted-foreground text-sm">
                {isOwnProfile ? "You haven't shared anything yet." : "No moments shared yet."}
              </p>
              {isOwnProfile && (
                <Link href="/create">
                  <button className="mt-4 px-6 py-2.5 bg-[#ff0050] text-white rounded-lg text-sm font-bold">
                    Share a moment
                  </button>
                </Link>
              )}
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-3 gap-px">
              {postsData?.posts.map((post) => (
                <PostGridItem key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-4 px-4 py-4">
              {postsData?.posts.map((post, i) => (
                <motion.div key={post.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <PostCard post={post} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
