import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/Layout";
import Feed from "@/pages/Feed";
import Trending from "@/pages/Trending";
import CreatePost from "@/pages/CreatePost";
import PostDetail from "@/pages/PostDetail";
import Profile from "@/pages/Profile";
import Notifications from "@/pages/Notifications";
import Settings from "@/pages/Settings";
import CreatorEarnings from "@/pages/CreatorEarnings";
import GoLive from "@/pages/GoLive";
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";
import SearchPage from "@/pages/Search";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={Feed} />
      <Route>
        <Layout>
          <Switch>
            <Route path="/trending" component={Trending} />
            <Route path="/create" component={CreatePost} />
            <Route path="/post/:id" component={PostDetail} />
            <Route path="/profile/:username" component={Profile} />
            <Route path="/notifications" component={Notifications} />
            <Route path="/settings" component={Settings} />
            <Route path="/search" component={SearchPage} />
            <Route path="/creator-earnings" component={CreatorEarnings} />
            <Route path="/go-live" component={GoLive} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      </Route>
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
