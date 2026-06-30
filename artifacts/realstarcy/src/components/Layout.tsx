import { Link, useLocation } from "wouter";
import { useGetMe, useGetNotifications } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { Home, TrendingUp, PlusSquare, Bell, User, Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { data: me } = useGetMe();
  const { data: notifications } = useGetNotifications();
  const unreadCount = notifications?.filter(n => !n.isRead).length ?? 0;

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/trending", icon: TrendingUp, label: "Trending" },
    { href: "/create", icon: PlusSquare, label: "Post" },
    { href: "/notifications", icon: Bell, label: "Alerts", badge: unreadCount },
    { href: me ? `/profile/${me.username}` : "/settings", icon: User, label: "Profile" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex flex-col w-64 min-h-screen border-r border-border px-4 py-8 sticky top-0">
        <Link href="/">
          <div className="mb-12 cursor-pointer">
            <h1 className="font-serif text-2xl text-primary tracking-tight">Realstarcy</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Real moments. Starred.</p>
          </div>
        </Link>

        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map(({ href, icon: Icon, label, badge }) => {
            const isActive = href === "/" ? location === "/" : location.startsWith(href);
            return (
              <Link key={href} href={href}>
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
                    <span className="ml-auto bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {me && (
          <div className="flex items-center gap-3 mt-8 p-3 rounded-lg hover:bg-secondary transition-colors">
            <Link href={`/profile/${me.username}`}>
              <div className="flex items-center gap-3 flex-1 cursor-pointer min-w-0">
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src={me.avatar} alt={me.displayName} />
                  <AvatarFallback className="bg-primary/20 text-primary text-xs">
                    {me.displayName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{me.displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">@{me.username}</p>
                </div>
              </div>
            </Link>
            <Link href="/settings">
              <div className="p-1 cursor-pointer">
                <Settings size={16} className="text-muted-foreground hover:text-foreground transition-colors" />
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
      <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-background/95 backdrop-blur border-t border-border z-50">
        <div className="flex items-center justify-around h-16">
          {navItems.map(({ href, icon: Icon, label, badge }) => {
            const isActive = href === "/" ? location === "/" : location.startsWith(href);
            return (
              <Link key={href} href={href}>
                <div className={cn(
                  "flex flex-col items-center gap-0.5 px-4 py-2 relative transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
                  <div className="relative">
                    <Icon size={22} />
                    {badge !== undefined && badge > 0 && (
                      <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                        {badge > 9 ? "9+" : badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium">{label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
