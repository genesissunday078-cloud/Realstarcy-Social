import { Link, useLocation } from "wouter";
import { useGetMe, useGetNotifications } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { Home, TrendingUp, Bell, User, Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { data: me } = useGetMe();
  const { data: notifications } = useGetNotifications();
  const unreadCount = Array.isArray(notifications) ? notifications.filter(n => !n.isRead).length : 0;

  const profileHref = me ? `/profile/${me.username}` : "/settings";

  const sidebarItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/trending", icon: TrendingUp, label: "Trend" },
    { href: "/notifications", icon: Bell, label: "Alerts", badge: unreadCount },
    { href: profileHref, icon: User, label: "Me", matchPrefix: "/profile" },
    { href: "/settings", icon: Settings, label: "Settings" },
  ];

  const mobileItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/trending", icon: TrendingUp, label: "Trend" },
    { href: "/notifications", icon: Bell, label: "Alerts", badge: unreadCount },
    { href: profileHref, icon: User, label: "Me", matchPrefix: "/profile" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex flex-col w-64 min-h-screen border-r border-border px-4 py-8 sticky top-0">
        <Link href="/">
          <div className="mb-12 cursor-pointer">
            <h1 className="font-serif text-2xl text-primary tracking-tight">Realstarcy</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Real moments. Loved.</p>
          </div>
        </Link>

        <nav className="flex flex-col gap-1 flex-1">
          {/* Create post button */}
          <Link href="/create">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#ff0050] text-white font-bold mb-3 cursor-pointer"
            >
              <span className="text-xl leading-none">+</span>
              <span className="font-sans font-bold text-sm">Create Post</span>
            </motion.div>
          </Link>

          {sidebarItems.map(({ href, icon: Icon, label, badge, matchPrefix }) => {
            const isActive = href === "/"
              ? location === "/"
              : location.startsWith(matchPrefix ?? href) && href !== "/";
            return (
              <Link key={`${href}-${label}`} href={href}>
                <motion.div
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.97 }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors relative",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  <Icon size={20} />
                  <span className="font-sans font-medium">{label}</span>
                  {badge !== undefined && badge > 0 && (
                    <span className="ml-auto bg-[#ff0050] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {me && (
          <div className="flex items-center gap-3 mt-8 p-3 rounded-lg border border-border/40 bg-card">
            <Link href={`/profile/${me.username}`}>
              <div className="flex items-center gap-3 flex-1 cursor-pointer min-w-0">
                <Avatar className="w-9 h-9 flex-shrink-0">
                  <AvatarImage src={me.avatar} alt={me.displayName} />
                  <AvatarFallback className="bg-primary/20 text-primary text-sm font-bold">
                    {me.displayName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{me.displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">@{me.username}</p>
                </div>
              </div>
            </Link>
          </div>
        )}
      </aside>

      {/* Main content */}
      <main className="flex-1 pb-20 md:pb-0">
        <motion.div
          key={location}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      </main>

      {/* Bottom nav (mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-black/90 backdrop-blur border-t border-white/10 z-50">
        <div className="flex items-center justify-around h-16">
          {/* Home */}
          <Link href="/">
            <div className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-2 transition-colors",
              location === "/" ? "text-white" : "text-white/50"
            )}>
              <Home size={21} />
              <span className="text-[9px] font-medium">Home</span>
            </div>
          </Link>

          {/* Trending */}
          <Link href="/trending">
            <div className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-2 transition-colors",
              location.startsWith("/trending") ? "text-white" : "text-white/50"
            )}>
              <TrendingUp size={21} />
              <span className="text-[9px] font-medium">Trend</span>
            </div>
          </Link>

          {/* Create — round red button */}
          <Link href="/create">
            <div className="w-12 h-12 rounded-full bg-[#ff0050] flex items-center justify-center shadow-lg shadow-[#ff0050]/30 active:scale-95 transition-transform">
              <span className="text-white text-2xl font-light leading-none mt-[-1px]">+</span>
            </div>
          </Link>

          {/* Alerts */}
          <Link href="/notifications">
            <div className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-2 transition-colors relative",
              location.startsWith("/notifications") ? "text-white" : "text-white/50"
            )}>
              <div className="relative">
                <Bell size={21} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#ff0050] text-white text-[9px] rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-medium">Alerts</span>
            </div>
          </Link>

          {/* Me */}
          <Link href={profileHref}>
            <div className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-2 transition-colors",
              location.startsWith("/profile") || location.startsWith("/settings") ? "text-white" : "text-white/50"
            )}>
              <User size={21} />
              <span className="text-[9px] font-medium">Me</span>
            </div>
          </Link>
        </div>
      </nav>
    </div>
  );
}
