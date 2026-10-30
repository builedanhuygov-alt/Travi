import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Compass,
  Award,
  Sliders,
  Check,
  Sparkles,
  SlidersHorizontal,
  LogIn,
  LogOut,
  AlertCircle,
  RotateCcw,
  UserCheck,
  Edit3,
  X,
  Mail,
  UploadCloud,
  ChevronRight,
  Shield,
  Layers
} from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Card } from '../components/ui/Card.tsx';
import { Badge } from '../components/ui/Badge.tsx';
import { useAuth } from '../lib/firebase.ts';
import { useDemoStore, demoStore } from '../services/storage/demoStore.ts';
import {
  getUserProfile,
  saveUserProfile,
  validateUserProfile,
  getFallbackProfile,
  type UserProfileData,
} from '../services/firebase/userProfile.ts';
import { migrateDemoDataToCloud } from '../services/firebase/userLedger.ts';
import { triggerToast } from '../lib/toast.ts';
import { TasteProfileModal } from '../components/taste/TasteProfileModal.tsx';
import { TASTE_PILLARS } from '../services/taste/tasteData.ts';

export const ProfilePage: React.FC = () => {
  const {
    user: authUser,
    session: authSession,
    isLoading: isAuthLoading,
    error: authError,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut: handleAuthSignOut,
    clearError: clearAuthError,
  } = useAuth();

  const {
    trips,
    savedDestIds,
    memories,
    resetToDemoDefaults,
    tasteProfile,
    isCloudLoading,
    cloudError,
  } = useDemoStore();

  // User Profile State (Firestore document /users/{uid})
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  // Edit Profile Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editHandle, setEditHandle] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editHomeBase, setEditHomeBase] = useState('');
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Preferences State
  const [isTasteModalOpen, setIsTasteModalOpen] = useState(false);
  const [currency, setCurrency] = useState('USD');
  const [motionPref, setMotionPref] = useState(() => {
    try {
      return localStorage.getItem('travi_motion_pref') || 'system';
    } catch {
      return 'system';
    }
  });
  const [notifications, setNotifications] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Auth Form State (Guest mode)
  const [authFormMode, setAuthFormMode] = useState<'signin' | 'signup'>('signin');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');

  // Explicit Demo Data Migration State
  const [migrationConsent, setMigrationConsent] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationCompleted, setMigrationCompleted] = useState(false);

  // Load Firestore Profile when authUser changes
  useEffect(() => {
    if (!authUser) {
      return;
    }

    let isCancelled = false;
    queueMicrotask(() => {
      if (!isCancelled) setIsProfileLoading(true);
    });

    getUserProfile(authUser.uid)
      .then((existingProfile) => {
        if (isCancelled) return;
        if (existingProfile) {
          setProfileData(existingProfile);
        } else {
          // Initialize with clean fallback derived from real auth session
          const fallback = getFallbackProfile({
            uid: authUser.uid,
            displayName: authUser.displayName,
            email: authUser.email,
            photoURL: authUser.photoURL,
          });
          setProfileData(fallback);
          // Persist the fallback document so /users/{uid} exists in Firestore
          saveUserProfile(authUser.uid, fallback).catch(() => {});
        }
      })
      .catch((err) => {
        console.warn('[ProfilePage] Could not load profile:', err);
      })
      .finally(() => {
        if (!isCancelled) setIsProfileLoading(false);
      });

    return () => {
      isCancelled = true;
      setProfileData(null);
      setIsProfileLoading(false);
    };
  }, [authUser]);

  // Open Edit Modal and populate fields
  const handleOpenEditModal = () => {
    if (!profileData && !authUser) return;
    const baseProfile = profileData || (authUser ? getFallbackProfile(authUser) : null);
    if (!baseProfile) return;

    setEditDisplayName(baseProfile.displayName);
    setEditHandle(baseProfile.handle.replace(/^@/, ''));
    setEditBio(baseProfile.bio || '');
    setEditHomeBase(baseProfile.homeBase || '');
    setEditErrors({});
    setIsEditModalOpen(true);
  };

  // Submit Profile Changes to Firestore
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser) return;

    const validation = validateUserProfile({
      displayName: editDisplayName,
      handle: editHandle,
      bio: editBio,
      homeBase: editHomeBase,
    });

    if (!validation.isValid) {
      setEditErrors(validation.errors);
      return;
    }

    setIsSavingProfile(true);
    setEditErrors({});

    try {
      const updated = await saveUserProfile(authUser.uid, {
        displayName: editDisplayName.trim(),
        handle: editHandle.trim(),
        bio: editBio.trim(),
        homeBase: editHomeBase.trim(),
      });

      setProfileData(updated);
      setIsEditModalOpen(false);
      triggerToast('Profile Updated', 'Your explorer profile was successfully updated.', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save profile changes.';
      setEditErrors({ general: msg });
      triggerToast('Update Failed', msg, 'warning');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Demo Data Migration with explicit consent
  const handleMigrateDemoData = async () => {
    if (!authUser || !migrationConsent) return;
    setIsMigrating(true);

    try {
      const localData = {
        trips: demoStore.getTrips(),
        savedDestIds: demoStore.getSavedDestinationIds(),
        memories: demoStore.getMemories(),
        tasteProfile: demoStore.getTasteProfile(),
      };

      const result = await migrateDemoDataToCloud(authUser.uid, localData);
      setMigrationCompleted(true);
      triggerToast('Data Migrated', result.message, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Migration failed.';
      triggerToast('Migration Error', msg, 'warning');
    } finally {
      setIsMigrating(false);
    }
  };

  const handleSavePreferences = () => {
    try {
      localStorage.setItem('travi_motion_pref', motionPref);
      document.documentElement.dataset.motion = motionPref;
      if (motionPref === 'reduced') {
        document.documentElement.classList.add('reduce-motion');
      } else {
        document.documentElement.classList.remove('reduce-motion');
      }
    } catch {
      // safe fallback for restricted storage environments
    }
    setSavedSuccess(true);
    triggerToast('Preferences Saved', 'Your preferences have been updated.', 'success');
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  // Accessible keyboard dismissal for modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isEditModalOpen) setIsEditModalOpen(false);
        if (isTasteModalOpen) setIsTasteModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditModalOpen, isTasteModalOpen]);

  const handleResetDemoData = () => {
    resetToDemoDefaults();
    triggerToast('Demo Sandbox Reset', 'Local demo journeys and sanctuaries restored.', 'neutral');
  };

  // Dynamically compute explorer badges from real user data
  const explorerBadges = useMemo(() => {
    if (!authUser) {
      return ['Guest Sandbox', 'Local Explorer'];
    }

    const badges: string[] = ['Verified Explorer'];
    if (trips.length > 0) badges.push('Journey Architect');
    if (savedDestIds.length >= 3) badges.push('Sanctuary Curator');
    if (memories.length > 0) badges.push('Memory Archivist');
    if (tasteProfile.isCustomized) badges.push('Cultural Connoisseur');

    if (badges.length === 1) {
      badges.push('Novice Explorer');
    }

    return badges;
  }, [authUser, trips.length, savedDestIds.length, memories.length, tasteProfile.isCustomized]);

  // Derive active display values
  const currentDisplayName = isProfileLoading
    ? 'Loading profile...'
    : authUser
    ? profileData?.displayName || authUser.displayName || 'Explorer'
    : 'Guest Explorer';

  const currentHandle = authUser
    ? profileData?.handle || `@${(authUser.email?.split('@')[0] || 'traveler').toLowerCase()}`
    : '@guest.explorer';

  const currentHomeBase = authUser
    ? profileData?.homeBase || 'Location not set'
    : 'Local Sandbox Session';

  const currentBio = authUser
    ? profileData?.bio || 'Deliberate traveler exploring culturally immersive sanctuaries.'
    : 'You are currently exploring Travi in guest sandbox mode. Sign in with Google or Email to synchronize your journeys and cultural preferences across all your devices.';

  const currentAvatarUrl = authUser
    ? profileData?.avatarUrl || authUser.photoURL || undefined
    : undefined;

  const userInitial = (currentDisplayName.charAt(0) || 'E').toUpperCase();

  // Check if local demo data exists for optional migration card
  const localTripsCount = demoStore.getTrips().length;
  const localSavedCount = demoStore.getSavedDestinationIds().length;
  const hasLocalDemoData = localTripsCount > 0 || localSavedCount > 0;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <PageHeader
        badge={authUser ? 'Traveler Identity' : 'Guest Explorer'}
        badgeVariant={authUser ? 'green' : 'cyan'}
        title="Travel DNA & Preferences"
        description="Your explorer profile, cultural affinity fingerprint, and cloud synchronization settings."
      />

      {/* Cloud Error Notice */}
      {cloudError && authUser && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 flex items-start gap-3 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
          <div className="flex-1">
            <strong className="font-medium text-white block mb-0.5">Cloud Storage Notice:</strong>
            <span className="font-light leading-relaxed">{cloudError}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* Left Column: Profile Card & Badges */}
        <div className="md:col-span-1 space-y-6">
          {/* Traveler Identity Card */}
          <Card variant="default" className="p-6 text-center border border-[#243049] relative">
            {/* Authenticated Edit Action */}
            {authUser && (
              <button
                type="button"
                onClick={handleOpenEditModal}
                className="absolute top-4 right-4 p-2 rounded-lg text-[#9BA9C3] hover:text-white hover:bg-[#18253E] transition-colors"
                title="Edit Profile"
                aria-label="Edit Profile"
              >
                <Edit3 className="h-4 w-4" />
              </button>
            )}

            {/* Avatar with Neutral Fallback */}
            <div className="relative mx-auto mb-4 h-24 w-24">
              {currentAvatarUrl ? (
                <img
                  src={currentAvatarUrl}
                  alt={currentDisplayName}
                  className="h-full w-full rounded-full object-cover border-2 border-[#3DDC97]"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-[#121C30] to-[#18253E] border-2 border-[#3DDC97]/60 text-2xl font-serif font-bold text-[#3DDC97]">
                  {authUser ? userInitial : <Compass className="h-10 w-10 text-[#48E3EF]" />}
                </div>
              )}
              <div
                className={`absolute bottom-0 right-0 rounded-full p-1.5 text-[#080D18] ${
                  authUser ? 'bg-[#3DDC97]' : 'bg-[#48E3EF]'
                }`}
              >
                {authUser ? <UserCheck className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
              </div>
            </div>

            {/* Traveler Name & Handle */}
            <h2 className="font-serif text-2xl font-medium text-white">{currentDisplayName}</h2>
            <span className="text-xs text-[#3DDC97] font-mono block mt-0.5">{currentHandle}</span>

            {/* Location */}
            <div className="mt-2 flex items-center justify-center gap-1.5 text-xs text-[#9BA9C3]">
              <MapPin className="h-3.5 w-3.5 text-[#48E3EF]" />
              <span>{currentHomeBase}</span>
            </div>

            {/* Bio */}
            <p className="mt-4 text-xs font-light text-[#9BA9C3] leading-relaxed text-left">
              {currentBio}
            </p>

            {/* Dynamic Real Travel Metrics */}
            <div className="mt-6 grid grid-cols-3 gap-2 border-t border-[#243049] pt-4 text-center">
              <div>
                <span className="block font-serif text-lg font-bold text-white">
                  {isCloudLoading ? '...' : trips.length}
                </span>
                <span className="text-[10px] text-[#9BA9C3] uppercase">Journeys</span>
              </div>
              <div>
                <span className="block font-serif text-lg font-bold text-[#3DDC97]">
                  {isCloudLoading ? '...' : savedDestIds.length}
                </span>
                <span className="text-[10px] text-[#9BA9C3] uppercase">Sanctuaries</span>
              </div>
              <div>
                <span className="block font-serif text-lg font-bold text-[#48E3EF]">
                  {isCloudLoading ? '...' : memories.length}
                </span>
                <span className="text-[10px] text-[#9BA9C3] uppercase">Moments</span>
              </div>
            </div>

            {/* Edit Profile Button */}
            {authUser ? (
              <div className="mt-5 pt-4 border-t border-[#243049]/60">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenEditModal}
                  leftIcon={<Edit3 className="h-3.5 w-3.5" />}
                  className="w-full text-xs"
                >
                  Edit Profile
                </Button>
              </div>
            ) : (
              <div className="mt-5 pt-4 border-t border-[#243049]/60">
                <span className="text-[11px] text-[#9BA9C3]/70 block font-light">
                  Sign in below to persist your journeys to the cloud.
                </span>
              </div>
            )}
          </Card>

          {/* Traveler Badges */}
          <Card variant="flat" className="p-5 border border-[#243049]">
            <h3 className="flex items-center gap-2 font-serif text-sm font-semibold text-white mb-3">
              <Award className="h-4 w-4 text-[#3DDC97]" />
              <span>Sanctuary Badges</span>
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {explorerBadges.map((badge) => (
                <Badge
                  key={badge}
                  variant={badge === 'Verified Explorer' ? 'green' : 'neutral'}
                  size="sm"
                >
                  {badge}
                </Badge>
              ))}
            </div>
          </Card>

          {/* Guest Mode Demo Reset */}
          {!authUser && (
            <Card variant="flat" className="p-5 border border-[#243049] text-center">
              <span className="text-xs font-medium text-white block mb-1">
                Demo Ledger Maintenance
              </span>
              <p className="text-[11px] text-[#9BA9C3] mb-4 font-light">
                Reset local demo journeys, bookmarks, and memories back to original demonstration defaults.
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleResetDemoData}
                leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
                className="w-full"
              >
                Reset Demo Ledger
              </Button>
            </Card>
          )}

          {/* Authenticated Account Details & Sign Out */}
          {authUser && (
            <Card variant="flat" className="p-5 border border-[#243049] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-white">Account Session</span>
                <Badge variant="green" size="sm">
                  Active Cloud
                </Badge>
              </div>
              <div className="text-xs text-[#9BA9C3] font-mono break-all space-y-1">
                <div className="flex items-center gap-1.5 text-white/90">
                  <Mail className="h-3 w-3 text-[#3DDC97]" />
                  <span>{authSession?.email || 'Authenticated Explorer'}</span>
                </div>
                <div className="text-[10px] text-[#9BA9C3]/70 pt-1">
                  Cloud ID: <span className="text-[#3DDC97]">{authUser.uid.slice(0, 12)}...</span>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAuthSignOut}
                  leftIcon={<LogOut className="h-3.5 w-3.5" />}
                  disabled={isAuthLoading}
                  className="w-full text-xs text-rose-300 hover:text-white hover:border-rose-500/40"
                >
                  Sign Out
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Travel DNA, Account Setup, Preferences */}
        <div className="md:col-span-2 space-y-6">
          {/* Guest Mode: Sign-In / Create Account Experience */}
          {!authUser && (
            <Card variant="default" className="p-6 border border-[#243049] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-[#3DDC97]" />
                  <h3 className="font-serif text-xl font-medium text-white">
                    Account & Cloud Synchronization
                  </h3>
                </div>
                <Badge variant="cyan" size="sm">
                  Guest Explorer
                </Badge>
              </div>

              <p className="text-xs text-[#9BA9C3] font-light leading-relaxed">
                Connect your account to securely persist and sync your itineraries, saved sanctuaries, and cultural taste profile to Cloud Firestore.
              </p>

              {/* Error Message Alert */}
              {authError && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 flex items-start justify-between gap-3 text-xs">
                  <div className="flex items-start gap-2 text-rose-300">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
                    <div>
                      <strong className="font-medium text-white block mb-0.5">Authentication Error:</strong>
                      <span className="font-light leading-relaxed">{authError}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={clearAuthError}
                    className="text-xs text-rose-300 hover:text-white cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Google Sign In Button */}
              <div className="pt-1">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => signInWithGoogle()}
                  disabled={isAuthLoading}
                  leftIcon={<LogIn className="h-4 w-4" />}
                  className="w-full sm:w-auto"
                >
                  {isAuthLoading ? 'Connecting...' : 'Sign In with Google'}
                </Button>
              </div>

              {/* Email Form Toggle & Form */}
              <div className="pt-2">
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (authFormMode === 'signup') {
                      await signUpWithEmail(authEmail, authPassword);
                    } else {
                      await signInWithEmail(authEmail, authPassword);
                    }
                  }}
                  className="rounded-xl border border-[#243049] bg-[#0E1626] p-4 space-y-3.5 text-xs"
                >
                  <div className="flex items-center justify-between border-b border-[#243049]/60 pb-2">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setAuthFormMode('signin')}
                        className={`font-mono text-xs pb-1 transition-colors cursor-pointer ${
                          authFormMode === 'signin'
                            ? 'text-[#3DDC97] border-b-2 border-[#3DDC97] font-semibold'
                            : 'text-[#9BA9C3] hover:text-white'
                        }`}
                      >
                        Sign In
                      </button>
                      <button
                        type="button"
                        onClick={() => setAuthFormMode('signup')}
                        className={`font-mono text-xs pb-1 transition-colors cursor-pointer ${
                          authFormMode === 'signup'
                            ? 'text-[#48E3EF] border-b-2 border-[#48E3EF] font-semibold'
                            : 'text-[#9BA9C3] hover:text-white'
                        }`}
                      >
                        Create Account
                      </button>
                    </div>
                    <span className="text-[10px] text-[#9BA9C3] font-mono">
                      {authFormMode === 'signup' ? 'New Account Registration' : 'Email Authentication'}
                    </span>
                  </div>

                  <div>
                    <label className="block text-[#9BA9C3] mb-1 font-mono text-[10px] uppercase">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full rounded-lg border border-[#243049] bg-[#121C30] px-3 py-2 text-white text-xs focus:outline-none focus:border-[#3DDC97]"
                      placeholder="traveler@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-[#9BA9C3] mb-1 font-mono text-[10px] uppercase">
                      Password (Minimum 6 Characters)
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full rounded-lg border border-[#243049] bg-[#121C30] px-3 py-2 text-white text-xs focus:outline-none focus:border-[#3DDC97]"
                      placeholder="••••••••"
                    />
                  </div>

                  <Button type="submit" variant="secondary" size="sm" disabled={isAuthLoading}>
                    {isAuthLoading
                      ? 'Processing...'
                      : authFormMode === 'signup'
                      ? 'Create Explorer Account'
                      : 'Sign In with Email'}
                  </Button>
                </form>
              </div>
            </Card>
          )}

          {/* Explicit Demo Data Migration Card (Only for Authenticated Users with Local Demo Data) */}
          {authUser && hasLocalDemoData && !migrationCompleted && (
            <Card variant="flat" className="p-5 border border-[#3DDC97]/30 bg-[#0E1626] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UploadCloud className="h-4 w-4 text-[#3DDC97]" />
                  <span className="font-serif text-sm font-medium text-white">
                    Transfer Local Demo Records to Cloud Account
                  </span>
                </div>
                <Badge variant="cyan" size="sm">
                  Optional
                </Badge>
              </div>

              <p className="text-xs text-[#9BA9C3] font-light leading-relaxed">
                You have {localTripsCount} local demo journeys and {localSavedCount} saved sanctuaries on this device. Would you like to copy them into your private cloud account?
              </p>

              <label className="flex items-start gap-2.5 text-xs text-white/90 cursor-pointer select-none pt-1">
                <input
                  type="checkbox"
                  checked={migrationConsent}
                  onChange={(e) => setMigrationConsent(e.target.checked)}
                  className="mt-0.5 rounded border-[#243049] bg-[#121C30] text-[#3DDC97] focus:ring-[#3DDC97]"
                />
                <span className="text-[11px] font-light leading-relaxed">
                  I understand and authorize copying my local demo journeys and bookmarks into my cloud account.
                </span>
              </label>

              <div className="pt-1">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleMigrateDemoData}
                  disabled={!migrationConsent || isMigrating}
                  className="text-xs"
                >
                  {isMigrating ? 'Transferring...' : 'Copy Records to Cloud'}
                </Button>
              </div>
            </Card>
          )}

          {/* Travel DNA Card */}
          <Card variant="default" className="p-6 border border-[#243049]">
            <div className="flex items-center gap-2 mb-4">
              <Compass className="h-5 w-5 text-[#3DDC97]" />
              <h3 className="font-serif text-xl font-medium text-white">
                Your Cultural Travel DNA
              </h3>
            </div>
            <p className="text-xs text-[#9BA9C3] mb-6">
              Our cultural recommendation system models your journeys around immersion, architectural sensitivity, and artisanal pace.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-[#243049] bg-[#0E1626] p-4">
                <span className="text-[10px] uppercase font-semibold text-[#9BA9C3] block mb-1">
                  Primary Dimension
                </span>
                <span className="font-serif text-base font-semibold text-[#3DDC97]">
                  Cultural Seeker
                </span>
                <p className="text-[11px] text-[#9BA9C3] mt-1 font-light">
                  Prioritizes non-commercial shrines, ancestral crafts, and living heritage.
                </p>
              </div>

              <div className="rounded-xl border border-[#243049] bg-[#0E1626] p-4">
                <span className="text-[10px] uppercase font-semibold text-[#9BA9C3] block mb-1">
                  Secondary Dimension
                </span>
                <span className="font-serif text-base font-semibold text-[#48E3EF]">
                  Slow Gourmet
                </span>
                <p className="text-[11px] text-[#9BA9C3] mt-1 font-light">
                  Direct engagement with family winegrowers, wild foragers, and traditional cookery.
                </p>
              </div>

              <div className="rounded-xl border border-[#243049] bg-[#0E1626] p-4">
                <span className="text-[10px] uppercase font-semibold text-[#9BA9C3] block mb-1">
                  Aesthetic Style
                </span>
                <span className="font-serif text-base font-semibold text-white">
                  Understated Luxury
                </span>
                <p className="text-[11px] text-[#9BA9C3] mt-1 font-light">
                  Restored machiya, cliffside villas, and quiet boutique stays.
                </p>
              </div>

              <div className="rounded-xl border border-[#243049] bg-[#0E1626] p-4">
                <span className="text-[10px] uppercase font-semibold text-[#9BA9C3] block mb-1">
                  Itinerary Pacing
                </span>
                <span className="font-serif text-base font-semibold text-[#9875FF]">
                  Deliberate & Immersive
                </span>
                <p className="text-[11px] text-[#9BA9C3] mt-1 font-light">
                  Maximum 2 deep experiences per day to leave space for serendipity.
                </p>
              </div>
            </div>
          </Card>

          {/* 8-Pillar Cultural Taste Profile Matrix */}
          <Card variant="default" className="p-6 border border-[#243049]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#3DDC97]" />
                <div>
                  <h3 className="font-serif text-xl font-medium text-white">
                    8-Pillar Cultural Taste Profile
                  </h3>
                  <span className="text-[11px] text-[#9BA9C3] font-light">
                    Calibrates local sanctuary recommendations across cinema, music, cuisine, and space
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsTasteModalOpen(true)}
                leftIcon={<SlidersHorizontal className="h-3.5 w-3.5 text-[#3DDC97]" />}
                className="text-xs shrink-0"
              >
                Tune Taste Profile
              </Button>
            </div>

            {/* Cloud or Local Persistence Badge */}
            <div className="mb-4 flex items-center justify-between text-xs text-[#9BA9C3] bg-[#0E1626] p-3 rounded-xl border border-[#243049]">
              <span className="flex items-center gap-1.5 font-light">
                <Layers className="h-3.5 w-3.5 text-[#3DDC97]" />
                <span>Persistence State:</span>
              </span>
              <span className="font-mono text-[11px] text-[#3DDC97]">
                {authUser ? 'Synchronized to Cloud Firestore' : 'Stored in Local Sandbox'}
              </span>
            </div>

            {/* 8 Pillars Grid Display */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {TASTE_PILLARS.map((pillar) => {
                const selections = (tasteProfile[pillar.id] as string[]) || [];

                return (
                  <div key={pillar.id} className="rounded-xl border border-[#243049] bg-[#0E1626] p-3.5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-[#3DDC97] font-semibold">
                        {pillar.label}
                      </span>
                      <span className="text-[10px] text-[#9BA9C3] font-mono">
                        {selections.length} selected
                      </span>
                    </div>

                    {selections.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {selections.map((item) => (
                          <span
                            key={item}
                            className="rounded-md bg-[#18253E] px-2 py-0.5 text-[11px] text-white/90 border border-white/5 font-light"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px] text-[#9BA9C3]/60 italic font-light">
                        Not configured (neutral weighting)
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Preferences Settings */}
          <Card variant="flat" className="p-6 border border-[#243049]">
            <div className="flex items-center gap-2 mb-4">
              <Sliders className="h-5 w-5 text-[#48E3EF]" />
              <h3 className="font-serif text-xl font-medium text-white">
                Application Preferences
              </h3>
            </div>

            <div className="space-y-4 text-xs">
              {/* Currency */}
              <div className="flex items-center justify-between border-b border-[#243049]/60 pb-3">
                <div>
                  <span className="font-medium text-white block">Default Currency</span>
                  <span className="text-[#9BA9C3] text-[11px]">Display pricing across experiences</span>
                </div>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="rounded-lg border border-[#243049] bg-[#121C30] px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#3DDC97]"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="VND">VND (₫)</option>
                  <option value="JPY">JPY (¥)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>

              {/* Motion Sensitivity */}
              <div className="flex items-center justify-between border-b border-[#243049]/60 pb-3">
                <div>
                  <span className="font-medium text-white block">Motion Behavior</span>
                  <span className="text-[#9BA9C3] text-[11px]">Honors system reduced-motion preferences</span>
                </div>
                <select
                  value={motionPref}
                  onChange={(e) => setMotionPref(e.target.value)}
                  className="rounded-lg border border-[#243049] bg-[#121C30] px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#3DDC97]"
                >
                  <option value="system">Auto (System Default)</option>
                  <option value="full">Rich Cinematic Motion</option>
                  <option value="reduced">Reduced Motion Mode</option>
                </select>
              </div>

              {/* Cultural Notifications */}
              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="font-medium text-white block">Cultural Timing Notifications</span>
                  <span className="text-[#9BA9C3] text-[11px]">Alerts for optimal temple dawn hours and harvests</span>
                </div>
                <button
                  type="button"
                  onClick={() => setNotifications(!notifications)}
                  className={`h-6 w-11 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                    notifications ? 'bg-[#3DDC97]' : 'bg-[#18253E]'
                  }`}
                  role="switch"
                  aria-checked={notifications}
                >
                  <span
                    className={`block h-5 w-5 rounded-full bg-[#080D18] transition-transform ${
                      notifications ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#243049] flex items-center justify-between">
              {savedSuccess ? (
                <span className="flex items-center gap-1.5 text-xs text-[#3DDC97]">
                  <Check className="h-4 w-4" />
                  Preferences updated.
                </span>
              ) : (
                <span className="text-[11px] text-[#9BA9C3]">
                  {authUser ? 'Persisted to user preferences' : 'Persisted in local sandbox'}
                </span>
              )}

              <Button variant="primary" size="sm" onClick={handleSavePreferences}>
                Save Preferences
              </Button>
            </div>
          </Card>

          {/* Discreet Developer Diagnostics Link */}
          <div className="pt-2 flex justify-end">
            <Link
              to="/dev/diagnostics"
              className="text-[11px] text-[#9BA9C3]/50 hover:text-[#3DDC97] inline-flex items-center gap-1 transition-colors"
            >
              <span>Developer Diagnostics</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-[#243049] bg-[#0E1626] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#243049] pb-3">
              <h3 className="font-serif text-lg font-medium text-white flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-[#3DDC97]" />
                <span>Edit Traveler Profile</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-md text-[#9BA9C3] hover:text-white hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              {editErrors.general && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300">
                  {editErrors.general}
                </div>
              )}

              <div>
                <label className="block text-[#9BA9C3] font-mono text-[10px] uppercase mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  className="w-full rounded-xl bg-[#121C30] border border-[#243049] px-3.5 py-2 text-white focus:outline-none focus:border-[#3DDC97]"
                  placeholder="e.g. Maya Chen"
                />
                {editErrors.displayName && (
                  <span className="text-rose-400 text-[11px] mt-1 block">
                    {editErrors.displayName}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-[#9BA9C3] font-mono text-[10px] uppercase mb-1">
                  Username Handle
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-[#9BA9C3] font-mono">@</span>
                  <input
                    type="text"
                    required
                    value={editHandle}
                    onChange={(e) => setEditHandle(e.target.value)}
                    className="w-full rounded-xl bg-[#121C30] border border-[#243049] pl-7 pr-3.5 py-2 text-white focus:outline-none focus:border-[#3DDC97]"
                    placeholder="maya_travels"
                  />
                </div>
                {editErrors.handle && (
                  <span className="text-rose-400 text-[11px] mt-1 block">
                    {editErrors.handle}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-[#9BA9C3] font-mono text-[10px] uppercase mb-1">
                  Home Base / Location
                </label>
                <input
                  type="text"
                  value={editHomeBase}
                  onChange={(e) => setEditHomeBase(e.target.value)}
                  className="w-full rounded-xl bg-[#121C30] border border-[#243049] px-3.5 py-2 text-white focus:outline-none focus:border-[#3DDC97]"
                  placeholder="e.g. Kyoto, Japan"
                />
                {editErrors.homeBase && (
                  <span className="text-rose-400 text-[11px] mt-1 block">
                    {editErrors.homeBase}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-[#9BA9C3] font-mono text-[10px] uppercase mb-1">
                  Traveler Bio
                </label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full rounded-xl bg-[#121C30] border border-[#243049] px-3.5 py-2 text-white focus:outline-none focus:border-[#3DDC97] resize-none"
                  placeholder="Tell other explorers about your travel philosophy..."
                />
                {editErrors.bio && (
                  <span className="text-rose-400 text-[11px] mt-1 block">
                    {editErrors.bio}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#243049]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSavingProfile}
                >
                  {isSavingProfile ? 'Saving Changes...' : 'Save Profile'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Taste Profile Tuning Studio Modal */}
      {isTasteModalOpen && (
        <TasteProfileModal
          isOpen={isTasteModalOpen}
          onClose={() => setIsTasteModalOpen(false)}
        />
      )}
    </div>
  );
};

export default ProfilePage;
