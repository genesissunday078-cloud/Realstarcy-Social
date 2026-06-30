import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useGetMe, useUpdateMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Settings as SettingsIcon, Check, LogOut } from "lucide-react";
import { useLocation } from "wouter";

export default function Settings() {
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const { data: me } = useGetMe();
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (me) {
      setDisplayName(me.displayName);
      setBio(me.bio);
      setAvatar(me.avatar);
    }
  }, [me]);

  const updateMe = useUpdateMe({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMe.mutate({ data: { displayName, bio, avatar } });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <SettingsIcon size={22} className="text-primary" />
          <h2 className="font-serif text-2xl text-foreground">Settings</h2>
        </div>
        <p className="text-sm text-muted-foreground">Make your profile genuinely yours.</p>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="bg-card border border-card-border rounded-xl p-6 space-y-6"
      >
        {/* Avatar preview */}
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={avatar} />
            <AvatarFallback className="bg-primary/20 text-primary text-xl font-serif">
              {displayName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Label htmlFor="avatar" className="text-sm text-muted-foreground mb-1.5 block">Avatar URL</Label>
            <Input
              id="avatar"
              value={avatar}
              onChange={e => setAvatar(e.target.value)}
              placeholder="https://..."
              className="bg-secondary border-border text-sm"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="displayName" className="text-sm text-muted-foreground mb-1.5 block">Display Name</Label>
          <Input
            id="displayName"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="Your name"
            className="bg-secondary border-border"
          />
        </div>

        <div>
          <Label htmlFor="bio" className="text-sm text-muted-foreground mb-1.5 block">Bio</Label>
          <Textarea
            id="bio"
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="Something real about you..."
            className="bg-secondary border-border resize-none min-h-20"
            maxLength={200}
          />
          <p className="text-xs text-muted-foreground mt-1 text-right">{bio.length}/200</p>
        </div>

        <motion.button
          type="submit"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          disabled={updateMe.isPending || !displayName.trim()}
          className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saved ? (
            <>
              <Check size={16} />
              Saved
            </>
          ) : updateMe.isPending ? "Saving..." : "Save changes"}
        </motion.button>
      </motion.form>

      <div className="mt-6 bg-card border border-card-border rounded-xl p-6">
        <h3 className="font-serif text-base mb-3">About Realstarcy</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Realstarcy was built on one principle: share what's real. No algorithmic pressure.
          Just authentic moments, starred by real people. You star what you genuinely connect with — not what
          you think you're supposed to like.
        </p>
      </div>

      <div className="mt-4">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            localStorage.removeItem("realstarcy_logged_in");
            navigate("/login");
          }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/5 transition-colors"
        >
          <LogOut size={16} />
          Sign out
        </motion.button>
      </div>
    </div>
  );
}
