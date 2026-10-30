import React, { useState, useEffect, Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from '../navigation/Navbar.tsx';
import { MobileNav } from '../navigation/MobileNav.tsx';
import { Footer } from './Footer.tsx';
import { TraviBrandIntro } from '../brand/TraviBrandIntro.tsx';
import { ToastContainer } from '../ui/Toast.tsx';
import { RouteLoadingFallback } from './RouteLoadingFallback.tsx';

export const AppLayout: React.FC = () => {
  const [showBrandIntro, setShowBrandIntro] = useState(false);
  const location = useLocation();

  // Scroll to top on every route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-[#080D18] text-[#F4F7FF] selection:bg-[#3DDC97]/25 selection:text-white">
      {/* Top Navbar */}
      <Navbar onOpenBrandIntro={() => setShowBrandIntro(true)} />

      {/* Main Page Canvas */}
      <main className="flex-1 w-full pb-20 lg:pb-0 pb-safe">
        <Suspense fallback={<RouteLoadingFallback />}>
          <Outlet />
        </Suspense>
      </main>

      {/* Bottom Footer */}
      <Footer />

      {/* Bottom Mobile Tab Bar */}
      <MobileNav />

      {/* Brand Intro Modal / Transition */}
      <TraviBrandIntro
        isOpen={showBrandIntro}
        onClose={() => setShowBrandIntro(false)}
      />

      {/* Editorial Toast Feedback System */}
      <ToastContainer />
    </div>
  );
};
