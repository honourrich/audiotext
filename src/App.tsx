import { Suspense } from "react";
import { useRoutes, Routes, Route } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import Home from "./components/home";
import EpisodePage from "./pages/episode/[id]";
import ShowNoteLanding from "./components/ShowNoteLanding";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import ProfilePage from "./pages/ProfilePage";
import BillingPage from "./pages/BillingPage";
import OnboardingPage from "./pages/OnboardingPage";
import DashboardPage from "./pages/DashboardPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import SettingsPage from "./pages/SettingsPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { Toaster } from "@/components/ui/toaster";

function App() {
  const { isSignedIn, isLoaded } = useUser();

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
    <Suspense fallback={<p>Loading...</p>}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<ShowNoteLanding />} />
        <Route path="/sign-in/*" element={<SignInPage />} />
        <Route path="/sign-up/*" element={<SignUpPage />} />

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
          path="/onboarding"
          element={
            <ProtectedRoute>
              <OnboardingPage />
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
      </Routes>
      {import.meta.env.VITE_TEMPO === "true" && tempoRoutes}
      <Toaster />
    </Suspense>
  );
}

export default App;