import { Suspense, useEffect } from "react";
import { useRoutes, Routes, Route } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./components/home";
import EpisodePage from "./pages/episode/[id]";
import ShowNoteLanding from "./components/ShowNoteLanding";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import ProfilePage from "./pages/ProfilePage";
import BillingPage from "./pages/BillingPage";
import DashboardPage from "./pages/DashboardPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import SettingsPage from "./pages/SettingsPage";
import CheckoutSuccessPage from "./pages/CheckoutSuccessPage";
import CheckoutCancelPage from "./pages/CheckoutCancelPage";
import VideoUploadTest from "./components/VideoUploadTest";
import ProtectedRoute from "./components/ProtectedRoute";
import { Toaster } from "@/components/ui/toaster";

function App() {
  const { isSignedIn, isLoaded, user } = useUser();

  useEffect(() => {
    // Wait for Clerk to finish loading before making decisions about episodes
    if (!isLoaded) {
      return; // Don't do anything while Clerk is still loading
    }

    const EPISODES_KEY = 'episodes';
    const OWNER_KEY = 'episodes_owner';

    if (user?.id) {
      // User is signed in
      const owner = localStorage.getItem(OWNER_KEY);
      if (!owner) {
        // First time - set owner and keep existing episodes
        localStorage.setItem(OWNER_KEY, user.id);
      } else if (owner !== user.id) {
        // Different user - clear episodes and set new owner
        localStorage.setItem(OWNER_KEY, user.id);
        localStorage.removeItem(EPISODES_KEY);
      }
      // If owner matches, keep episodes as-is (don't clear them)
    } else {
      // User is signed out (not just loading) - clear episodes
      // Only clear if we're certain user is signed out, not just loading
      if (isLoaded && !isSignedIn) {
        localStorage.removeItem('episodes_owner');
        localStorage.removeItem('episodes');
      }
    }
  }, [user?.id, isLoaded, isSignedIn]);

  // Safely import tempo routes
  let tempoRoutes = null;
  try {
    const routes = require("tempo-routes").default;
    tempoRoutes = useRoutes(routes);
  } catch (error) {
    // tempo-routes not available, continue without it
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<p>Loading...</p>}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<ShowNoteLanding />} />
          <Route path="/sign-in/*" element={<SignInPage />} />
          <Route path="/sign-up/*" element={<SignUpPage />} />
          <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
          <Route path="/checkout/cancel" element={<CheckoutCancelPage />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/episode/:id"
            element={
              <ProtectedRoute>
                <EpisodePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/*"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/billing"
            element={
              <ProtectedRoute>
                <BillingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <AnalyticsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/test-video"
            element={
              <ProtectedRoute>
                <VideoUploadTest />
              </ProtectedRoute>
            }
          />
        </Routes>
        {import.meta.env.VITE_TEMPO === "true" && tempoRoutes}
        <Toaster />
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;