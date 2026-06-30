import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
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
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function isLoggedIn() {
  return typeof localStorage !== "undefined" && !!localStorage.getItem("realstarcy_logged_in");
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  if (!isLoggedIn() && location !== "/login") {
    return <Redirect to="/login" />;
  }
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      {/* Login — no layout, no auth guard */}
      <Route path="/login" component={Login} />

      {/* Feed — full-screen, no sidebar layout */}
      <Route path="/">
        <AuthGuard>
          <Feed />
        </AuthGuard>
      </Route>

      {/* All other pages use standard Layout */}
      <Route>
        <AuthGuard>
          <Layout>
            <Switch>
              <Route path="/trending" component={Trending} />
              <Route path="/create" component={CreatePost} />
              <Route path="/post/:id" component={PostDetail} />
              <Route path="/profile/:username" component={Profile} />
              <Route path="/notifications" component={Notifications} />
              <Route path="/settings" component={Settings} />
              <Route component={NotFound} />
            </Switch>
          </Layout>
        </AuthGuard>
      </Route>
    </Switch>
  );
}

function App() {
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

export default App;
