import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardPage } from "@/features/projects/DashboardPage";
import { ProjectDetailPage } from "@/features/projects/ProjectDetailPage";
import { OnboardingPage } from "@/features/onboarding/OnboardingPage";
import { SettingsPage } from "@/features/settings/SettingsPage";
import { PortfolioPage } from "@/features/portfolio/PortfolioPage";
import { AiPage } from "@/features/ai/AiPage";
import { HarborPage } from "@/features/harbor/HarborPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "onboarding", element: <OnboardingPage /> },
      { path: "portfolio", element: <PortfolioPage /> },
      { path: "harbor", element: <HarborPage /> },
      { path: "ai", element: <AiPage /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "project/:id", element: <ProjectDetailPage /> },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);