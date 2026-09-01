import type { Metadata } from "next";
import "./globals.css";
import "./responsive.css";
import "./digital-twin.css";
import "./digital-twin-overrides.css";
import "./wing-workspace.css";
import "./wing-workspace-actions.css";
import "./workspace-settings.css";
import "./workspace-preference-overrides.css";
import "./simulator-functional.css";
import "./light-mode.css";
import "./departments.css";
import "./department-views.css";
import "./bottlenecks.css";
import "./injury-interactions.css";
import "./account.css";
import "./auth.css";
import { ThemeBootstrap } from "../components/ThemeBootstrap";

export const metadata: Metadata = {
  title: "MedSync | AI Hospital Operations Command Center",
  description: "Operational decision support for hospital leaders.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning data-theme="dark">
      <body suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: `
            try {
              const root = document.documentElement;
              const theme = localStorage.getItem('medsync-theme') || 'dark';
              root.dataset.theme = theme;
              const settings = JSON.parse(localStorage.getItem('medsync-settings') || '{}');
              root.dataset.compact = settings.toggles?.compactMode ? 'true' : 'false';
              root.dataset.reducedMotion = settings.toggles?.reducedMotion ? 'true' : 'false';
              root.dataset.chartDensity = (settings.chartDensity || 'Balanced').toLowerCase();
              root.dataset.accentIntensity = (settings.accentIntensity || 'Operational').toLowerCase().replace(' ', '-');
            } catch (error) { }
          `,
          }}
        />
        <ThemeBootstrap />
        {children}
      </body>
    </html>
  );
}
