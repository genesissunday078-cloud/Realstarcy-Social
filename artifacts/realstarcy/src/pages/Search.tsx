import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { Search as SearchIcon, X, TrendingUp, User2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const SUGGESTED = [
  { type: "tag", label: "#music" },
  { type: "tag", label: "#fashion" },
  { type: "tag", label: "#celebrity" },
  { type: "tag", label: "#film" },
  { type: "tag", label: "#nba" },
  { type: "tag", label: "#art" },
];

const ALL_USERS = [
  { username: "zara_luxe", displayName: "Zara Luxe", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=zara", followers: "4.2M" },
  { username: "king_marco", displayName: "Marco King", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=marco", followers: "6.1M" },
  { username: "nova_elite", displayName: "Nova Elite", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=nova", followers: "3.3M" },
  { username: "dxmon_prince", displayName: "Demon Prince", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=dxmon", followers: "2.8M" },
  { username: "belle_vega", displayName: "Belle Vega", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=belle", followers: "5.5M" },
  { username: "troy_wave", displayName: "Troy Wave", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=troy", followers: "8.8M" },
  { username: "crystal_v", displayName: "Crystal V", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=crystal", followers: "7.2M" },
  { username: "jay_empire", displayName: "Jay Empire", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=jayempire", followers: "3.9M" },
  { username: "soleil_paris", displayName: "Soleil Paris", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=soleil", followers: "4.6M" },
  { username: "rook_reigns", displayName: "Rook Reigns", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=rook", followers: "9.1M" },
  { username: "luna_moth", displayName: "Luna Moth", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=luna", followers: "5.2M" },
  { username: "ceo_khalid", displayName: "Khalid Osei", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=khalid", followers: "2.4M" },
  { username: "missy_reign", displayName: "Missy Reign", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=missy", followers: "3.7M" },
  { username: "prince_ash", displayName: "Prince Ash", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ash", followers: "6.8M" },
  { username: "ivy_stone", displayName: "Ivy Stone", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ivy", followers: "4.1M" },
  { username: "reign_adaeze", displayName: "Adaeze Reign", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=adaeze", followers: "7.7M" },
  { username: "mia_divine", displayName: "Mia Divine", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=mia", followers: "9.3M" },
  { username: "roman_vex", displayName: "Roman Vex", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=roman", followers: "4.4M" },
  { username: "alex_vibes", displayName: "Alex Rivera", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex", followers: "1.2M" },
  { username: "sam_creates", displayName: "Sam Okafor", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sam", followers: "890K" },
  { username: "jade_lens", displayName: "Jade Kim", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=jade", followers: "740K" },
  { username: "echo_waves", displayName: "Echo Waves", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=echo", followers: "560K" },
];

export default function SearchPage() {
  const [query, setQuery] = useState("");

  const filtered = query.trim().length > 0
    ? ALL_USERS.filter(u =>
        u.username.includes(query.toLowerCase()) ||
        u.displayName.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const showSuggested = query.trim().length === 0;

  return (
    <div className="max-w-lg mx-auto pb-8">
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-md px-4 pt-4 pb-3 border-b border-border/30">
        <div className="relative">
          <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search people, tags…"
            className="w-full bg-secondary border border-border/50 rounded-xl pl-9 pr-9 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-[#ff0050]/50 transition-colors"
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {showSuggested ? (
          <motion.div key="suggested" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="px-4 pt-5">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold mb-3">Trending Tags</p>
              <div className="flex flex-wrap gap-2 mb-6">
                {SUGGESTED.map(s => (
                  <Link key={s.label} href={`/trending?tag=${s.label.replace('#', '')}`}>
                    <span className="px-3 py-1.5 bg-secondary border border-border/40 rounded-full text-sm text-[#ff0050] font-medium hover:bg-[#ff0050]/10 transition-colors">
                      {s.label}
                    </span>
                  </Link>
                ))}
              </div>

              <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold mb-3 flex items-center gap-1.5">
                <TrendingUp size={12} />
                Verified Celebrities
              </p>
              <div className="flex flex-col divide-y divide-border/20">
                {ALL_USERS.slice(0, 10).map((u, i) => (
                  <motion.div
                    key={u.username}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <Link href={`/profile/${u.username}`}>
                      <div className="flex items-center gap-3 py-3 hover:bg-white/3 transition-colors rounded-xl px-1 cursor-pointer">
                        <div className="relative">
                          <Avatar className="w-11 h-11 border-2 border-[#ff0050]/40">
                            <AvatarImage src={u.avatar} />
                            <AvatarFallback>{u.displayName[0]}</AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[#ff0050] rounded-full flex items-center justify-center">
                            <span className="text-white text-[8px] font-bold">✓</span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm leading-tight">{u.displayName}</p>
                          <p className="text-xs text-muted-foreground">@{u.username}</p>
                        </div>
                        <span className="text-xs text-muted-foreground font-medium">{u.followers}</span>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="px-4 pt-4">
              {filtered.length === 0 ? (
                <div className="text-center py-16">
                  <User2 size={40} className="text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">No results for "{query}"</p>
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-border/20">
                  {filtered.map((u, i) => (
                    <motion.div
                      key={u.username}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <Link href={`/profile/${u.username}`}>
                        <div className="flex items-center gap-3 py-3 hover:bg-white/3 transition-colors rounded-xl px-1 cursor-pointer">
                          <Avatar className="w-11 h-11 border-2 border-[#ff0050]/40">
                            <AvatarImage src={u.avatar} />
                            <AvatarFallback>{u.displayName[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm leading-tight">{u.displayName}</p>
                            <p className="text-xs text-muted-foreground">@{u.username}</p>
                          </div>
                          <span className="text-xs text-muted-foreground font-medium">{u.followers}</span>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
