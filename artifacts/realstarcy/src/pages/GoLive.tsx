import { motion } from "framer-motion";
import { Video, Gift, Users, Zap } from "lucide-react";
import { Link } from "wouter";

export default function GoLive() {
  return (
    <div className="max-w-lg mx-auto px-4 py-12 flex flex-col items-center text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-24 h-24 bg-purple-500/10 border border-purple-500/30 rounded-3xl flex items-center justify-center mb-6"
      >
        <Video size={40} className="text-purple-400" />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <span className="text-[11px] uppercase tracking-widest text-purple-400 font-bold bg-purple-400/10 px-3 py-1 rounded-full">Coming soon</span>
        <h2 className="font-serif text-3xl text-foreground mt-4 mb-3">Go Live</h2>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
          Real-time livestreaming for creators. Share your talent live, receive gifts from fans,
          and earn while you perform.
        </p>
      </motion.div>

      <div className="grid grid-cols-3 gap-4 mt-10 w-full">
        {[
          { icon: <Video size={20} className="text-purple-400" />, label: "HD Streams", sub: "Up to 4K" },
          { icon: <Gift size={20} className="text-primary" />, label: "Fan Gifts", sub: "Real earnings" },
          { icon: <Users size={20} className="text-blue-400" />, label: "Live Q&A", sub: "Real-time chat" },
        ].map((f, i) => (
          <motion.div
            key={f.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.08 }}
            className="bg-card border border-border/50 rounded-2xl p-4 flex flex-col items-center gap-2"
          >
            {f.icon}
            <p className="text-xs font-semibold">{f.label}</p>
            <p className="text-[10px] text-muted-foreground">{f.sub}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-10 bg-card border border-border/50 rounded-2xl p-5 w-full text-left"
      >
        <div className="flex items-center gap-2 mb-3">
          <Zap size={15} className="text-primary" />
          <p className="text-sm font-semibold">What's coming</p>
        </div>
        <ul className="space-y-2 text-xs text-muted-foreground">
          <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" />Live streaming with real-time audience</li>
          <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" />Fan gift system (virtual gifts → real money)</li>
          <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" />Live chat with moderation tools</li>
          <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-purple-400 rounded-full flex-shrink-0" />Co-hosting with other creators</li>
          <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-purple-400 rounded-full flex-shrink-0" />Replay saved to your profile</li>
        </ul>
      </motion.div>

      <Link href="/settings">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="mt-8 px-8 py-3 border border-border rounded-2xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          ← Back to settings
        </motion.button>
      </Link>
    </div>
  );
}
