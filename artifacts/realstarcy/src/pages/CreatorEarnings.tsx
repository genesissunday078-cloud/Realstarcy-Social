import { motion } from "framer-motion";
import { useGetMe, useListPosts } from "@workspace/api-client-react";
import { DollarSign, Eye, TrendingUp, Users, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

function StatCard({ label, value, sub, icon, highlight }: {
  label: string; value: string; sub?: string; icon: React.ReactNode; highlight?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl p-4 border",
        highlight
          ? "bg-primary/10 border-primary/30"
          : "bg-card border-border/50"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <div className={cn("w-7 h-7 rounded-xl flex items-center justify-center", highlight ? "bg-primary/20" : "bg-secondary")}>
          {icon}
        </div>
      </div>
      <p className={cn("text-2xl font-bold font-serif", highlight ? "text-primary" : "text-foreground")}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </motion.div>
  );
}

function Tier({ views, payout, active }: { views: string; payout: string; active?: boolean }) {
  return (
    <div className={cn(
      "flex items-center justify-between px-4 py-3 rounded-xl border",
      active ? "bg-primary/10 border-primary/40" : "bg-secondary/40 border-border/30"
    )}>
      <div className="flex items-center gap-2.5">
        <Eye size={14} className={active ? "text-primary" : "text-muted-foreground"} />
        <span className={cn("text-sm font-medium", active ? "text-foreground" : "text-muted-foreground")}>{views} views</span>
        {active && <span className="text-[10px] bg-primary text-black px-1.5 py-0.5 rounded-full font-bold">YOU</span>}
      </div>
      <span className={cn("text-sm font-bold", active ? "text-primary" : "text-muted-foreground")}>{payout}</span>
    </div>
  );
}

export default function CreatorEarnings() {
  const { data: me } = useGetMe();
  const { data: postsData } = useListPosts(
    { userId: me?.id },
    { query: { enabled: !!me?.id, queryKey: ["listPosts", me?.id] } }
  );

  const totalLoves = me?.loveCount ?? 0;
  const totalPosts = me?.postCount ?? 0;
  const estimatedViews = totalLoves * 12;
  const estimatedEarnings = Math.floor(estimatedViews / 5000);
  const nextMilestone = Math.ceil(estimatedViews / 5000) * 5000;
  const viewsToNext = nextMilestone - estimatedViews;

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
        <h2 className="font-serif text-2xl text-foreground mb-1">Creator Earnings</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Realstarcy pays its creators. 70% of all platform revenue goes directly to you.
          No fine print. No middlemen.
        </p>
      </motion.div>

      {/* Key mission banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border border-primary/30 rounded-2xl p-4 mb-6"
      >
        <div className="flex items-center gap-2 mb-2">
          <Heart size={16} className="text-primary" />
          <p className="text-sm font-bold text-primary">Realstarcy's Creator Promise</p>
        </div>
        <p className="text-xs text-foreground/80 leading-relaxed">
          We exist to grow young artists and talented people. Every day, millions of people
          discover new creators here. You deserve to be paid for what you build.
        </p>
        <div className="flex items-center gap-4 mt-3">
          <div className="text-center">
            <p className="text-lg font-bold text-primary">70%</p>
            <p className="text-[10px] text-muted-foreground">To creators</p>
          </div>
          <div className="w-px h-8 bg-border/50" />
          <div className="text-center">
            <p className="text-lg font-bold text-primary">30%</p>
            <p className="text-[10px] text-muted-foreground">Platform</p>
          </div>
          <div className="w-px h-8 bg-border/50" />
          <div className="text-center">
            <p className="text-lg font-bold text-primary">$1</p>
            <p className="text-[10px] text-muted-foreground">per 5k views</p>
          </div>
        </div>
      </motion.div>

      {/* Your stats */}
      <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3 font-semibold">Your stats</p>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard
          label="Loves received"
          value={totalLoves.toLocaleString()}
          sub="Engagement signal"
          icon={<Heart size={14} className="text-primary" />}
        />
        <StatCard
          label="Est. views"
          value={estimatedViews.toLocaleString()}
          sub="Based on engagement"
          icon={<Eye size={14} className="text-muted-foreground" />}
        />
        <StatCard
          label="Posts"
          value={totalPosts.toLocaleString()}
          sub="Moments shared"
          icon={<TrendingUp size={14} className="text-muted-foreground" />}
        />
        <StatCard
          label="Est. earnings"
          value={`$${estimatedEarnings}`}
          sub={estimatedEarnings === 0 ? "Keep posting!" : "This cycle"}
          icon={<DollarSign size={14} className="text-primary" />}
          highlight={estimatedEarnings > 0}
        />
      </div>

      {/* Progress to next payout */}
      {estimatedViews < nextMilestone && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border/50 rounded-2xl p-4 mb-6"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold">Next payout milestone</p>
            <p className="text-xs text-muted-foreground">{nextMilestone.toLocaleString()} views</p>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden mb-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((estimatedViews / nextMilestone) * 100, 100)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-primary rounded-full"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {viewsToNext.toLocaleString()} more views to earn{" "}
            <span className="text-primary font-bold">${Math.ceil(nextMilestone / 5000)}</span>
          </p>
        </motion.div>
      )}

      {/* Payout tiers */}
      <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3 font-semibold">Payout tiers</p>
      <div className="space-y-2 mb-6">
        <Tier views="5,000" payout="$1" active={estimatedViews >= 5000 && estimatedViews < 10000} />
        <Tier views="10,000" payout="$2" active={estimatedViews >= 10000 && estimatedViews < 25000} />
        <Tier views="25,000" payout="$5" active={estimatedViews >= 25000 && estimatedViews < 50000} />
        <Tier views="50,000" payout="$10" active={estimatedViews >= 50000 && estimatedViews < 100000} />
        <Tier views="100,000" payout="$20" active={estimatedViews >= 100000 && estimatedViews < 500000} />
        <Tier views="500,000" payout="$100" active={estimatedViews >= 500000 && estimatedViews < 1000000} />
        <Tier views="1,000,000" payout="$200" active={estimatedViews >= 1000000} />
      </div>

      {/* How it works */}
      <div className="bg-card border border-border/50 rounded-2xl p-4">
        <p className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Users size={14} className="text-primary" />
          How the pool works
        </p>
        <div className="space-y-2.5 text-xs text-muted-foreground leading-relaxed">
          <p>• Every month, 70% of all Realstarcy revenue goes into the <span className="text-foreground font-medium">Creator Pool</span></p>
          <p>• The pool is split proportionally based on verified views</p>
          <p>• Top performers earn bonuses from the remaining 30% growth fund</p>
          <p>• Payouts processed monthly via bank transfer or digital wallet</p>
          <p className="text-primary font-medium pt-1">Payment setup coming soon — we're building it right.</p>
        </div>
      </div>
    </div>
  );
}
