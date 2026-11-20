"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { Footer } from "./footer";
import { SECTION_COMPONENTS } from "./sections/registry";
import { isSectionId, useDashboard, type SectionId } from "@/lib/store";

export function DashboardShell() {
  const section = useDashboard((s) => s.section);
  const setSection = useDashboard((s) => s.setSection);

  // Sync section <-> URL hash so navigation survives refresh and back/forward.
  useEffect(() => {
    const readHash = (): string | null => {
      const raw = window.location.hash.replace(/^#\/?/, "");
      return raw && isSectionId(raw) ? raw : null;
    };
    const initial = readHash();
    if (initial && initial !== useDashboard.getState().section) {
      useDashboard.getState().setSection(initial as SectionId);
    }
    const onHashChange = () => {
      const fromHash = readHash();
      if (fromHash && fromHash !== useDashboard.getState().section) {
        useDashboard.getState().setSection(fromHash as SectionId);
      }
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    const hash = `#/${section}`;
    if (window.location.hash !== hash) {
      window.history.replaceState(null, "", hash);
    }
  }, [section]);

  const ActiveSection = SECTION_COMPONENTS[section];

  return (
    <div className="flex min-h-screen w-full">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:text-sm focus:text-foreground"
      >
        Skip to content
      </a>
      <Sidebar />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Header />
        <main id="main-content" className="flex-1">
          <div className="mx-auto w-full max-w-[1560px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={section}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
              >
                <ActiveSection />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
