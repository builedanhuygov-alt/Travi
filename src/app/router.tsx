import React, { Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout.tsx';
import { HomePage } from '../pages/HomePage.tsx';
import { NotFoundPage } from '../pages/NotFoundPage.tsx';
import { RouteLoadingFallback } from '../components/layout/RouteLoadingFallback.tsx';

// Route-level code-splitting with React.lazy
const ExplorePage = React.lazy(() => import('../pages/ExplorePage.tsx'));
const DestinationDetailPage = React.lazy(() => import('../pages/DestinationDetailPage.tsx'));
const TripsPage = React.lazy(() => import('../pages/TripsPage.tsx'));
const CopilotPage = React.lazy(() => import('../pages/CopilotPage.tsx'));
const MemoriesPage = React.lazy(() => import('../pages/MemoriesPage.tsx'));
const ExperiencesPage = React.lazy(() => import('../pages/ExperiencesPage.tsx'));
const StoriesPage = React.lazy(() => import('../pages/StoriesPage.tsx'));
const StoryDetailPage = React.lazy(() => import('../pages/StoryDetailPage.tsx'));
const MyDiscoveriesPage = React.lazy(() => import('../pages/MyDiscoveriesPage.tsx'));
const SocialPage = React.lazy(() => import('../pages/SocialPage.tsx'));
const ProfilePage = React.lazy(() => import('../pages/ProfilePage.tsx'));
const DevDiagnosticsPage = React.lazy(() => import('../pages/DevDiagnosticsPage.tsx'));
const NorthMapPage = React.lazy(() => import('../pages/NorthMapPage.tsx'));
const VietnamTourismDataPage = React.lazy(() => import('../pages/VietnamTourismDataPage.tsx'));

const withSuspense = (Component: React.ComponentType) => (
  <Suspense fallback={<RouteLoadingFallback />}>
    <Component />
  </Suspense>
);

export const routes = [
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <NotFoundPage />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'explore',
        element: withSuspense(ExplorePage),
      },
      {
        path: 'map/north',
        element: withSuspense(NorthMapPage),
      },
      {
        path: 'map',
        element: withSuspense(NorthMapPage),
      },
      {
        path: 'trips',
        element: withSuspense(TripsPage),
      },
      {
        path: 'memories',
        element: withSuspense(MemoriesPage),
      },
      {
        path: 'experiences',
        element: withSuspense(ExperiencesPage),
      },
      {
        path: 'stories',
        element: withSuspense(StoriesPage),
      },
      {
        path: 'stories/:id',
        element: withSuspense(StoryDetailPage),
      },
      {
        path: 'discoveries',
        element: withSuspense(MyDiscoveriesPage),
      },
      {
        path: 'saved',
        element: withSuspense(MyDiscoveriesPage),
      },
      {
        path: 'copilot',
        element: withSuspense(CopilotPage),
      },
      {
        path: 'concierge',
        element: withSuspense(CopilotPage),
      },
      {
        path: 'studio',
        element: withSuspense(ExplorePage),
      },
      {
        path: 'destinations/:id',
        element: withSuspense(DestinationDetailPage),
      },
      {
        path: 'destination/:id',
        element: withSuspense(DestinationDetailPage),
      },
      {
        path: 'social',
        element: withSuspense(SocialPage),
      },
      {
        path: 'profile',
        element: withSuspense(ProfilePage),
      },
      {
        path: 'dev/diagnostics',
        element: withSuspense(DevDiagnosticsPage),
      },
      {
        path: 'tourism-data',
        element: withSuspense(VietnamTourismDataPage),
      },
      {
        path: 'data-quality',
        element: withSuspense(VietnamTourismDataPage),
      },
      {
        path: 'cultural-data',
        element: withSuspense(VietnamTourismDataPage),
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
];

export const router =
  typeof document !== 'undefined'
    ? createBrowserRouter(routes)
    : ({} as ReturnType<typeof createBrowserRouter>);


