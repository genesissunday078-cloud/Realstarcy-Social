import { useEffect } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  useGetNotifications,
  useMarkNotificationsRead,
  getGetNotificationsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, MessageCircle, UserPlus, AtSign, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

const typeConfig = {
  love: { icon: Heart, label: "loved your moment", color: "text-primary" },
  comment: { icon: MessageCircle, label: "responded to your moment", color: "text-blue-400" },
  follow: { icon: UserPlus, label: "started following you", color: "text-green-400" },
  mention: { icon: AtSign, label: "mentioned you", color: "text-purple-400" },
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function Notifications() {
  const queryClient = useQueryClient();
  const { data: notifications, isLoading } = useGetNotifications();
  const markRead = useMarkNotificationsRead({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetNotificationsQueryKey() });
      },
    },
  });

  useEffect(() => {
    const unread = notifications?.some(n => !n.isRead);
    if (unread) {
      const timer = setTimeout(() => markRead.mutate(undefined as unknown as void), 2000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [notifications]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Bell size={22} className="text-primary" />
          <h2 className="font-serif text-2xl text-foreground">Notifications</h2>
        </div>
        <p className="text-sm text-muted-foreground">People who found your moments real.</p>
      </div>

      <div className="flex flex-col gap-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card border border-card-border rounded-xl p-4">
              <div className="flex gap-3">
                <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
                <div className="flex-1">
                  <Skeleton className="h-3 w-48 mb-1.5" />
                  <Skeleton className="h-2.5 w-32" />
                </div>
              </div>
            </div>
          ))
        ) : notifications?.length === 0 ? (
          <div className="text-center py-20">
            <Bell size={36} className="text-muted-foreground mx-auto mb-3 opacity-30" />
            <p className="font-serif text-lg text-muted-foreground">Nothing yet.</p>
            <p className="text-sm text-muted-foreground mt-1">Share something real and people will find you.</p>
          </div>
        ) : (
          notifications?.map((n, i) => {
            const config = typeConfig[n.type as keyof typeof typeConfig] ?? typeConfig.mention;
            const IconComponent = config.icon;

            const content = (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className={cn(
                  "flex gap-3 bg-card border rounded-xl p-4 transition-colors",
                  n.isRead ? "border-card-border" : "border-primary/30 bg-primary/5"
                )}
              >
                <div className="relative flex-shrink-0">
                  <Avatar className="w-9 h-9">
                    <AvatarImage src={n.fromUser.avatar} />
                    <AvatarFallback className="bg-primary/20 text-primary text-xs">
                      {n.fromUser.displayName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn("absolute -bottom-0.5 -right-0.5 rounded-full bg-background p-0.5", config.color)}>
                    <IconComponent size={11} fill="currentColor" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{n.fromUser.displayName}</span>
                    {" "}
                    <span className="text-muted-foreground">{config.label}</span>
                  </p>
                  {n.postContent && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      "{n.postContent}"
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">{formatDate(n.createdAt)}</p>
                </div>

                {!n.isRead && (
                  <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1.5" />
                )}
              </motion.div>
            );

            return n.postId ? (
              <Link key={n.id} href={`/post/${n.postId}`}>{content}</Link>
            ) : (
              <Link key={n.id} href={`/profile/${n.fromUser.username}`}>{content}</Link>
            );
          })
        )}
      </div>
    </div>
  );
}
