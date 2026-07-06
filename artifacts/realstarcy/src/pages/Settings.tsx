import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";
import {
  useGetMe, useUpdateMe, getGetMeQueryKey,
  getGetUserProfileQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronRight, LogOut, User, Bell, Shield, Info,
  DollarSign, Video, Heart, Pencil, Check, Camera, Loader2,
  Globe, Lock, Users, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MenuRowProps {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  href?: string;
  onClick?: () => void;
  danger?: boolean;
  badge?: string;
  rightEl?: React.ReactNode;
}

function MenuRow({ icon, label, sublabel, href, onClick, danger, badge, rightEl }: MenuRowProps) {
  const inner = (
    <motion.div
      whileTap={{ scale: 0.98, backgroundColor: "rgba(255,255,255,0.03)" }}
      className={cn(
        "flex items-center gap-3.5 px-4 py-3.5 cursor-pointer transition-colors",
        danger ? "text-red-400 hover:bg-red-400/5" : "text-foreground hover:bg-white/5"
      )}
      onClick={onClick}
    >
      <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0",
        danger ? "bg-red-400/10" : "bg-white/8"
      )}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-[14px] font-medium leading-tight", danger && "text-red-400")}>{label}</p>
        {sublabel && <p className="text-xs text-muted-foreground mt-0.5">{sublabel}</p>}
      </div>
      {rightEl ?? (
        badge ? (
          <span className="text-[10px] font-bold bg-primary/15 text-primary px-2 py-0.5 rounded-full">{badge}</span>
        ) : (
          !danger && <ChevronRight size={16} className="text-muted-foreground flex-shrink-0" />
        )
      )}
    </motion.div>
  );

  if (href) return <Link href={href}>{inner}</Link>;
  return inner;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <p className="text-[11px] uppercase tracking-widest text-muted-foreground px-4 mb-1.5 font-semibold">{title}</p>
      <div className="bg-card border border-border/50 rounded-2xl overflow-hidden divide-y divide-border/30">
        {children}
      </div>
    </div>
  );
}

const VISIBILITY_OPTIONS = [
  { value: "everyone", label: "Everyone", sublabel: "All users worldwide", icon: Globe },
  { value: "followers", label: "Followers only", sublabel: "People who follow you", icon: Users },
  { value: "private", label: "Only me", sublabel: "Only visible to you", icon: Lock },
];

export default function Settings() {
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const { data: me } = useGetMe();
  const [editOpen, setEditOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [saved, setSaved] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [visibility, setVisibility] = useState<string>(() => localStorage.getItem("rs_post_visibility") ?? "everyone");
  const [showVisibility, setShowVisibility] = useState(false);
  const [notifPush, setNotifPush] = useState(() => localStorage.getItem("rs_notif_push") !== "0");
  const [notifEmail, setNotifEmail] = useState(() => localStorage.getItem("rs_notif_email") !== "0");

  useEffect(() => {
    if (me) {
      setDisplayName(me.displayName);
      setUsername(me.username);
      setBio(me.bio ?? "");
      setAvatar(me.avatar ?? "");
    }
  }, [me]);

  const updateMe = useUpdateMe({
    mutation: {
      onSuccess: (updated) => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        if (me?.username) queryClient.invalidateQueries({ queryKey: getGetUserProfileQueryKey(me.username) });
        if (updated.username !== me?.username) {
          queryClient.invalidateQueries({ queryKey: getGetUserProfileQueryKey(updated.username) });
        }
        setSaved(true);
        setTimeout(() => { setSaved(false); setEditOpen(false); }, 1400);
      },
      onError: (err: unknown) => {
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
        if (msg === "Username taken") setUsernameError("That username is already taken.");
        else setUsernameError("Something went wrong. Please try again.");
      },
    },
  });

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
    } catch {
      /* silent */
    } finally {
      setUploading(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameError("");
    updateMe.mutate({ data: { displayName, username, bio, avatar } });
  };

  const setVisibilitySetting = (v: string) => {
    setVisibility(v);
    localStorage.setItem("rs_post_visibility", v);
    setShowVisibility(false);
  };

  const currentVis = VISIBILITY_OPTIONS.find(o => o.value === visibility) ?? VISIBILITY_OPTIONS[0];

  return (
    <div className="max-w-lg mx-auto pb-8">
      {/* Profile card header */}
      <div className="relative mb-5">
        <div className="h-24 bg-gradient-to-br from-[#ff0050]/30 via-primary/10 to-background" />
        <div className="px-4 -mt-10 flex items-end gap-4">
          <div className="relative flex-shrink-0">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            <Avatar className="w-20 h-20 border-4 border-background shadow-xl border-[#ff0050]/60">
              <AvatarImage src={avatar || me?.avatar} />
              <AvatarFallback className="bg-primary/20 text-primary text-2xl font-serif">
                {(me?.displayName ?? "?").charAt(0)}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-7 h-7 bg-[#ff0050] rounded-full flex items-center justify-center shadow-md border-2 border-background"
            >
              {uploading ? <Loader2 size={12} className="animate-spin text-white" /> : <Camera size={12} className="text-white" />}
            </button>
          </div>
          <div className="pb-1 flex-1 min-w-0">
            <p className="font-serif text-lg font-semibold truncate">{me?.displayName}</p>
            <p className="text-sm text-[#ff0050]">@{me?.username}</p>
          </div>
          <button
            type="button"
            onClick={() => setEditOpen(v => !v)}
            className="pb-2 flex items-center gap-1.5 text-xs font-semibold border border-[#ff0050]/40 text-[#ff0050] px-3 py-2 rounded-xl hover:bg-[#ff0050]/10 transition-colors"
          >
            <Pencil size={12} />
            Edit profile
          </button>
        </div>

        {/* Stats strip */}
        <div className="flex gap-5 px-4 mt-3">
          {[
            { label: "Posts", value: me?.postCount ?? 0 },
            { label: "Followers", value: (me?.followerCount ?? 0) >= 1000000 ? `${((me?.followerCount ?? 0) / 1000000).toFixed(1)}M` : (me?.followerCount ?? 0).toLocaleString() },
            { label: "Following", value: me?.followingCount ?? 0 },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="font-bold text-sm">{typeof s.value === "number" ? s.value.toLocaleString() : s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
          <div className="flex items-center gap-1 ml-auto">
            <Heart size={12} className="text-[#ff0050]" />
            <p className="text-sm font-bold">{(me?.loveCount ?? 0) >= 1000000 ? `${((me?.loveCount ?? 0) / 1000000).toFixed(1)}M` : (me?.loveCount ?? 0).toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">loves</p>
          </div>
        </div>
      </div>

      {/* Inline edit form */}
      <AnimatePresence>
        {editOpen && (
          <motion.form
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            onSubmit={handleSave}
            className="mx-4 mb-4 bg-card border border-border rounded-2xl p-4 space-y-3 overflow-hidden"
          >
            <div>
              <p className="text-xs text-muted-foreground mb-1">Display Name</p>
              <Input
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="bg-secondary border-border"
                placeholder="Your name"
              />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Username</p>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                <Input
                  value={username}
                  onChange={e => { setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 30)); setUsernameError(""); }}
                  className="bg-secondary border-border pl-7"
                  placeholder="your_handle"
                />
              </div>
              {usernameError && <p className="text-xs text-red-400 mt-1">{usernameError}</p>}
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Bio</p>
              <Textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                className="bg-secondary border-border resize-none min-h-[64px]"
                placeholder="Something about you…"
                maxLength={200}
              />
              <p className="text-[10px] text-right text-muted-foreground mt-0.5">{bio.length}/200</p>
            </div>
            <motion.button
              type="submit"
              whileTap={{ scale: 0.97 }}
              disabled={updateMe.isPending || !displayName.trim() || !username.trim()}
              className="w-full py-2.5 bg-[#ff0050] text-white rounded-xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saved ? <><Check size={14} /> Saved!</> : updateMe.isPending ? "Saving…" : "Save changes"}
            </motion.button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Menu sections */}
      <div className="px-4 space-y-3">
        <Section title="Account">
          <MenuRow icon={<User size={16} />} label="My Profile" href={`/profile/${me?.username}`} />
          <MenuRow icon={<Bell size={16} />} label="Notifications" href="/notifications" />
        </Section>

        <Section title="Privacy">
          <div>
            <motion.div
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-3.5 px-4 py-3.5 cursor-pointer hover:bg-white/5 transition-colors"
              onClick={() => setShowVisibility(v => !v)}
            >
              <div className="w-8 h-8 rounded-xl bg-white/8 flex items-center justify-center flex-shrink-0">
                <currentVis.icon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-medium leading-tight">Who can see my posts</p>
                <p className="text-xs text-muted-foreground mt-0.5">{currentVis.label}</p>
              </div>
              <ChevronDown size={16} className={cn("text-muted-foreground transition-transform", showVisibility && "rotate-180")} />
            </motion.div>
            <AnimatePresence>
              {showVisibility && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-t border-border/30"
                >
                  {VISIBILITY_OPTIONS.map(opt => (
                    <motion.div
                      key={opt.value}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setVisibilitySetting(opt.value)}
                      className={cn(
                        "flex items-center gap-3.5 px-4 py-3 cursor-pointer transition-colors",
                        visibility === opt.value ? "bg-[#ff0050]/10 text-[#ff0050]" : "hover:bg-white/5 text-foreground"
                      )}
                    >
                      <opt.icon size={16} className="ml-1" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{opt.label}</p>
                        <p className="text-xs text-muted-foreground">{opt.sublabel}</p>
                      </div>
                      {visibility === opt.value && <Check size={16} className="text-[#ff0050]" />}
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <MenuRow
            icon={<Bell size={16} />}
            label="Push notifications"
            sublabel={notifPush ? "Enabled" : "Disabled"}
            onClick={() => { const v = !notifPush; setNotifPush(v); localStorage.setItem("rs_notif_push", v ? "1" : "0"); }}
            rightEl={
              <div className={cn("w-10 h-6 rounded-full transition-colors relative flex items-center px-0.5", notifPush ? "bg-[#ff0050]" : "bg-muted")}>
                <div className={cn("w-5 h-5 bg-white rounded-full shadow transition-transform", notifPush ? "translate-x-4" : "translate-x-0")} />
              </div>
            }
          />
          <MenuRow
            icon={<Bell size={16} className="opacity-60" />}
            label="Email notifications"
            sublabel={notifEmail ? "Enabled" : "Disabled"}
            onClick={() => { const v = !notifEmail; setNotifEmail(v); localStorage.setItem("rs_notif_email", v ? "1" : "0"); }}
            rightEl={
              <div className={cn("w-10 h-6 rounded-full transition-colors relative flex items-center px-0.5", notifEmail ? "bg-[#ff0050]" : "bg-muted")}>
                <div className={cn("w-5 h-5 bg-white rounded-full shadow transition-transform", notifEmail ? "translate-x-4" : "translate-x-0")} />
              </div>
            }
          />
        </Section>

        <Section title="Creator Tools">
          <MenuRow
            icon={<DollarSign size={16} className="text-primary" />}
            label="Creator Earnings"
            sublabel="$1 per 5k views — 70% revenue share"
            href="/creator-earnings"
            badge="NEW"
          />
          <MenuRow
            icon={<Video size={16} className="text-purple-400" />}
            label="Go Live"
            sublabel="Live streaming for verified creators"
            href="/go-live"
            badge="SOON"
          />
        </Section>

        <Section title="Realstarcy">
          <MenuRow icon={<Heart size={16} className="text-[#ff0050]" />} label="About Realstarcy" sublabel="Celebrity platform for real talent" href="/about" />
          <MenuRow icon={<Info size={16} />} label="Terms & Privacy" onClick={() => {}} />
        </Section>

        <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
          <MenuRow
            icon={<LogOut size={16} />}
            label="Sign out"
            onClick={() => navigate("/login")}
            danger
          />
        </div>

        <p className="text-center text-[10px] text-muted-foreground py-3">Realstarcy v1.0 · Celebrity platform</p>
      </div>
    </div>
  );
}
