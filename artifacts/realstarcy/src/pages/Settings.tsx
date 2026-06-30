import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
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
  DollarSign, Video, Star, Pencil, Check, Camera, Loader2,
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
}

function MenuRow({ icon, label, sublabel, href, onClick, danger, badge }: MenuRowProps) {
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
      {badge && (
        <span className="text-[10px] font-bold bg-primary/15 text-primary px-2 py-0.5 rounded-full">{badge}</span>
      )}
      {!danger && <ChevronRight size={16} className="text-muted-foreground flex-shrink-0" />}
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

export default function Settings() {
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const { data: me } = useGetMe();
  const [editOpen, setEditOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (me) {
      setDisplayName(me.displayName);
      setBio(me.bio ?? "");
      setAvatar(me.avatar ?? "");
    }
  }, [me]);

  const updateMe = useUpdateMe({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        if (me?.username) queryClient.invalidateQueries({ queryKey: getGetUserProfileQueryKey(me.username) });
        setSaved(true);
        setTimeout(() => { setSaved(false); setEditOpen(false); }, 1400);
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
    updateMe.mutate({ data: { displayName, bio, avatar } });
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Profile card header */}
      <div className="relative mb-5">
        <div className="h-24 bg-gradient-to-br from-primary/30 via-primary/10 to-background" />
        <div className="px-4 -mt-10 flex items-end gap-4">
          <div className="relative flex-shrink-0">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            <Avatar className="w-20 h-20 border-4 border-background shadow-xl">
              <AvatarImage src={avatar || me?.avatar} />
              <AvatarFallback className="bg-primary/20 text-primary text-2xl font-serif">
                {(me?.displayName ?? "?").charAt(0)}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-md"
            >
              {uploading ? <Loader2 size={11} className="animate-spin text-black" /> : <Camera size={11} className="text-black" />}
            </button>
          </div>
          <div className="pb-1 flex-1 min-w-0">
            <p className="font-serif text-lg font-semibold truncate">{me?.displayName}</p>
            <p className="text-sm text-muted-foreground">@{me?.username}</p>
          </div>
          <button
            onClick={() => setEditOpen(v => !v)}
            className="pb-2 flex items-center gap-1.5 text-xs font-semibold border border-border px-3 py-2 rounded-xl hover:bg-secondary transition-colors"
          >
            <Pencil size={12} />
            Edit profile
          </button>
        </div>

        {/* Stats strip */}
        <div className="flex gap-5 px-4 mt-3">
          {[
            { label: "Posts", value: me?.postCount ?? 0 },
            { label: "Followers", value: me?.followerCount ?? 0 },
            { label: "Following", value: me?.followingCount ?? 0 },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="font-bold text-sm">{s.value.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
          <div className="flex items-center gap-1 ml-auto">
            <Star size={12} className="text-primary" />
            <p className="text-sm font-bold">{me?.starCount?.toLocaleString() ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">stars</p>
          </div>
        </div>
      </div>

      {/* Inline edit form */}
      {editOpen && (
        <motion.form
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSave}
          className="mx-4 mb-4 bg-card border border-border rounded-2xl p-4 space-y-3"
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
            <p className="text-xs text-muted-foreground mb-1">Bio</p>
            <Textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              className="bg-secondary border-border resize-none min-h-[64px]"
              placeholder="Something real about you…"
              maxLength={200}
            />
            <p className="text-[10px] text-right text-muted-foreground mt-0.5">{bio.length}/200</p>
          </div>
          <motion.button
            type="submit"
            whileTap={{ scale: 0.97 }}
            disabled={updateMe.isPending || !displayName.trim()}
            className="w-full py-2.5 bg-primary text-black rounded-xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saved ? <><Check size={14} /> Saved!</> : updateMe.isPending ? "Saving…" : "Save changes"}
          </motion.button>
        </motion.form>
      )}

      {/* Menu sections */}
      <div className="px-4 space-y-3">
        <Section title="Account">
          <MenuRow icon={<User size={16} />} label="My Profile" href={`/profile/${me?.username}`} />
          <MenuRow icon={<Bell size={16} />} label="Notifications" href="/notifications" />
          <MenuRow icon={<Shield size={16} />} label="Privacy & Safety" sublabel="Control who sees your content" onClick={() => {}} />
        </Section>

        <Section title="Creator Tools">
          <MenuRow
            icon={<DollarSign size={16} className="text-primary" />}
            label="Creator Earnings"
            sublabel="$1 per 5k views — 70% revenue to creators"
            href="/creator-earnings"
            badge="NEW"
          />
          <MenuRow
            icon={<Video size={16} className="text-purple-400" />}
            label="Go Live"
            sublabel="Live streaming for creators"
            href="/go-live"
            badge="SOON"
          />
        </Section>

        <Section title="Realstarcy">
          <MenuRow icon={<Star size={16} className="text-primary" />} label="About Realstarcy" sublabel="Built for real artists & talent" href="/about" />
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

        <p className="text-center text-[10px] text-muted-foreground py-3">Realstarcy v1.0 · Built for the real ones</p>
      </div>
    </div>
  );
}
