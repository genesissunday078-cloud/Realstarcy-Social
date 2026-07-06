import { useEffect, useRef } from "react";
import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
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

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

// REQUIRED — resolves the key from window.location.hostname so the same build
// serves multiple Clerk custom domains. Do NOT inline the env var.
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

// REQUIRED — empty in dev (Clerk hits FAPI directly), auto-set in prod.
// Do NOT gate on import.meta.env.PROD.
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

// Clerk passes full paths; wouter's setLocation prepends the base — strip it.
function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "#f59e0a",
    colorForeground: "#fafafa",
    colorMutedForeground: "#9ea3af",
    colorDanger: "#ef4444",
    colorBackground: "#09090f",
    colorInput: "#1c1f2a",
    colorInputForeground: "#fafafa",
    colorNeutral: "#1c1f2a",
    fontFamily: "'DM Sans', sans-serif",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    // cardBox owns the single visible surface — card & footer are transparent
    cardBox: "bg-[#0d0f14] rounded-2xl w-[440px] max-w-full overflow-hidden border border-[#1c1f2a]",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-white font-serif",
    headerSubtitle: "text-[#9ea3af]",
    socialButtonsBlockButtonText: "text-white",
    formFieldLabel: "text-[#9ea3af] text-sm",
    footerActionLink: "text-[#f59e0a] hover:text-[#d97706]",
    footerActionText: "text-[#9ea3af]",
    dividerText: "text-[#9ea3af]",
    identityPreviewEditButton: "text-[#f59e0a]",
    formFieldSuccessText: "text-green-400",
    alertText: "text-white",
    logoBox: "flex justify-center py-2",
    logoImage: "h-12 w-12",
    socialButtonsBlockButton:
      "border border-[#1c1f2a] bg-[#1c1f2a] hover:bg-[#252836] text-white",
    formButtonPrimary:
      "bg-[#f59e0a] hover:bg-[#d97706] text-black font-semibold",
    formFieldInput: "bg-[#1c1f2a] border-[#2a2f3e] text-white",
    footerAction: "border-t border-[#1c1f2a]",
    dividerLine: "bg-[#1c1f2a]",
    alert: "bg-[#1c1f2a] border-[#2a2f3e]",
    otpCodeFieldInput: "bg-[#1c1f2a] border-[#2a2f3e] text-white",
    formFieldRow: "",
    main: "",
  },
};

// ─── Auth pages ─────────────────────────────────────────────────────────────

function AuthPageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-[#ff0050]/5 blur-[100px]" />
      </div>
      <div className="w-full max-w-[440px] relative z-10">
        <div className="text-center mb-8">
          <h1 className="font-serif text-4xl text-primary tracking-tight">Realstarcy</h1>
          <p className="text-muted-foreground text-sm mt-1">Real moments. Loved.</p>
        </div>
        {children}
      </div>
    </div>
  );
}

function SignInPage() {
  return (
    <AuthPageWrapper>
      {/* path must be the full browser path — Clerk reads window.location.pathname directly */}
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </AuthPageWrapper>
  );
}

function SignUpPage() {
  return (
    <AuthPageWrapper>
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </AuthPageWrapper>
  );
}

// ─── Cache invalidation on user change ──────────────────────────────────────

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

// ─── Routing ─────────────────────────────────────────────────────────────────

// "/" → Feed when signed in, landing page when signed out
function HomeRoute() {
  return (
    <>
      <Show when="signed-in"><Feed /></Show>
      <Show when="signed-out"><Login /></Show>
    </>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeRoute} />

      {/* REQUIRED: paths must be exactly "/sign-in/*?" and "/sign-up/*?" */}
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />

      {/* All remaining routes require auth */}
      <Route>
        <Show when="signed-in">
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
        </Show>
        <Show when="signed-out">
          <Redirect to="/sign-in" />
        </Show>
      </Route>
    </Switch>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Welcome back",
            subtitle: "Sign in to your Realstarcy account",
          },
        },
        signUp: {
          start: {
            title: "Join Realstarcy",
            subtitle: "Real moments. Loved.",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}
