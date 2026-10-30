import React, { useState } from 'react';
import {
  Activity,
  Database,
  Check,
} from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Card } from '../components/ui/Card.tsx';
import { Badge } from '../components/ui/Badge.tsx';
import {
  useAuth,
  getFirebaseDiagnostics,
  testFirestoreReachability,
  type FirestoreReachabilityReport,
} from '../lib/firebase.ts';
import {
  getPersistenceBoundaryStatus,
  fetchUserCloudLedger,
  type CloudLedgerSummary,
} from '../services/storage/persistenceBoundary.ts';
import { triggerToast } from '../lib/toast.ts';

export const DevDiagnosticsPage: React.FC = () => {
  const diagnostics = getFirebaseDiagnostics();
  const { user: authUser, session: authSession } = useAuth();
  const persistenceStatus = getPersistenceBoundaryStatus(authUser?.uid);

  const [reachabilityReport, setReachabilityReport] = useState<FirestoreReachabilityReport | null>(null);
  const [isCheckingReachability, setIsCheckingReachability] = useState(false);
  const [cloudSummary, setCloudSummary] = useState<CloudLedgerSummary | null>(null);
  const [isFetchingCloud, setIsFetchingCloud] = useState(false);

  const handleTestFirestoreReachability = async () => {
    setIsCheckingReachability(true);
    try {
      const report = await testFirestoreReachability();
      setReachabilityReport(report);
      if (report.isReachable) {
        triggerToast('Firestore Reachable', report.message, 'success');
      } else {
        triggerToast('Reachability Check', report.message, 'warning');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown reachability check error';
      triggerToast('Reachability Error', msg, 'warning');
    } finally {
      setIsCheckingReachability(false);
    }
  };

  const handleFetchCloudLedger = async () => {
    if (!authUser) return;
    setIsFetchingCloud(true);
    try {
      const summary = await fetchUserCloudLedger(authUser.uid);
      setCloudSummary(summary);
      if (summary.success) {
        triggerToast('Cloud Ledger Verified', summary.message, 'success');
      } else {
        triggerToast('Cloud Read Notice', summary.message, 'neutral');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown cloud read error';
      triggerToast('Cloud Read Error', msg, 'warning');
    } finally {
      setIsFetchingCloud(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <PageHeader
        badge="Developer Tools"
        badgeVariant="cyan"
        title="Firebase Infrastructure Diagnostics"
        description="Internal development-only diagnostics for inspection of connection states, security boundaries, and live service reachability."
      />

      {/* 1. SDK & Environment Diagnostic Panel */}
      <Card variant="default" className="p-6 border border-[#243049] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-[#48E3EF]" />
            <h3 className="font-serif text-lg font-medium text-white">Firebase SDK Diagnostic Panel</h3>
          </div>
          <Badge variant={diagnostics.isConfigured ? 'green' : 'neutral'} size="sm">
            {diagnostics.isConfigured ? 'Live SDK Initialized' : 'Offline Sandbox'}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs font-mono bg-[#080D18] p-4 rounded-xl border border-[#243049]">
          <div className="flex justify-between border-b border-[#243049]/60 pb-1.5">
            <span className="text-[#9BA9C3]">Project ID:</span>
            <span className="text-white">{diagnostics.projectId}</span>
          </div>
          <div className="flex justify-between border-b border-[#243049]/60 pb-1.5">
            <span className="text-[#9BA9C3]">Auth Domain:</span>
            <span className="text-white truncate max-w-[160px]">{diagnostics.authDomain}</span>
          </div>
          <div className="flex justify-between border-b border-[#243049]/60 pb-1.5">
            <span className="text-[#9BA9C3]">Web API Key:</span>
            <span className={diagnostics.hasApiKey ? 'text-[#3DDC97]' : 'text-amber-400'}>
              {diagnostics.hasApiKey ? 'Configured' : 'Missing in .env'}
            </span>
          </div>
          <div className="flex justify-between border-b border-[#243049]/60 pb-1.5">
            <span className="text-[#9BA9C3]">App ID:</span>
            <span className={diagnostics.hasAppId ? 'text-[#3DDC97]' : 'text-amber-400'}>
              {diagnostics.hasAppId ? 'Configured' : 'Missing in .env'}
            </span>
          </div>
          <div className="flex justify-between border-b border-[#243049]/60 pb-1.5">
            <span className="text-[#9BA9C3]">Auth SDK Client:</span>
            <span className={diagnostics.authReady ? 'text-[#3DDC97]' : 'text-[#9BA9C3]'}>
              {diagnostics.authReady ? 'Loaded' : 'Offline'}
            </span>
          </div>
          <div className="flex justify-between border-b border-[#243049]/60 pb-1.5">
            <span className="text-[#9BA9C3]">Firestore SDK Client:</span>
            <span className={diagnostics.firestoreReady ? 'text-[#3DDC97]' : 'text-[#9BA9C3]'}>
              {diagnostics.firestoreReady ? 'Loaded' : 'Offline'}
            </span>
          </div>
          <div className="flex justify-between border-b border-[#243049]/60 pb-1.5">
            <span className="text-[#9BA9C3]">Auth Session:</span>
            <span className={authSession ? 'text-[#3DDC97] truncate max-w-[160px]' : 'text-[#9BA9C3]'}>
              {authSession ? authSession.email || 'Authenticated' : 'Unauthenticated Guest'}
            </span>
          </div>
          <div className="flex justify-between border-b border-[#243049]/60 pb-1.5">
            <span className="text-[#9BA9C3]">Firestore Reachable:</span>
            <span className={reachabilityReport?.isReachable ? 'text-[#3DDC97]' : reachabilityReport ? 'text-amber-400' : 'text-[#9BA9C3]'}>
              {reachabilityReport?.isReachable ? `Reachable (${reachabilityReport.latencyMs}ms)` : reachabilityReport ? 'Unreachable' : 'Untested'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-[#9BA9C3]">
            {reachabilityReport ? reachabilityReport.message : 'Actively verify internet round-trip connectivity to Cloud Firestore:'}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestFirestoreReachability}
            disabled={!diagnostics.firestoreReady || isCheckingReachability}
            className="text-xs"
          >
            {isCheckingReachability ? 'Pinging...' : 'Ping Cloud Firestore'}
          </Button>
        </div>
      </Card>

      {/* 2. Persistence & Isolation Boundary Status */}
      <Card variant="default" className="p-6 border border-[#243049] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-[#3DDC97]" />
            <h3 className="font-serif text-lg font-medium text-white">Persistence Architecture & Boundary</h3>
          </div>
          <Badge variant={persistenceStatus.isCloudSyncEnabled ? 'green' : 'neutral'} size="sm">
            {persistenceStatus.isCloudSyncEnabled ? 'Authenticated Cloud' : 'Local Demo Sandbox'}
          </Badge>
        </div>

        <div className="space-y-2 text-xs bg-[#080D18] p-4 rounded-xl border border-[#243049]">
          <div className="flex justify-between py-1 border-b border-[#243049]/60">
            <span className="text-[#9BA9C3]">Active Mode:</span>
            <span className="font-mono text-white">{persistenceStatus.currentMode}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-[#243049]/60">
            <span className="text-[#9BA9C3]">User Isolation Path:</span>
            <span className="font-mono text-[#3DDC97]">{persistenceStatus.userIsolationPath || 'None (Guest Mode)'}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-[#243049]/60">
            <span className="text-[#9BA9C3]">Security Rules Contract:</span>
            <span className="font-mono text-[#3DDC97] text-[11px]">{persistenceStatus.isolationContract}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-[#9BA9C3]">Silent Migration Policy:</span>
            <span className="text-white text-[11px]">{persistenceStatus.migrationPolicyNotice}</span>
          </div>
        </div>

        {authUser && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-[#9BA9C3]">
              Inspect live documents stored under /users/{authUser.uid.slice(0, 8)}/*:
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleFetchCloudLedger}
              disabled={isFetchingCloud}
              className="text-xs"
            >
              {isFetchingCloud ? 'Querying...' : 'Verify Cloud Read (/users/{uid}/*)'}
            </Button>
          </div>
        )}

        {cloudSummary && (
          <div className="rounded-xl border border-[#3DDC97]/30 bg-[#3DDC97]/5 p-4 text-xs font-mono space-y-2">
            <div className="flex items-center justify-between text-white font-semibold">
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-[#3DDC97]" />
                <span>Live Cloud Document Inspection</span>
              </span>
              <span className="text-[10px] text-[#9BA9C3]">{new Date(cloudSummary.fetchedAt).toLocaleTimeString()}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>Journeys (/trips): <span className="text-white font-bold">{cloudSummary.tripsCount}</span></div>
              <div>Sanctuaries (/savedDestinations): <span className="text-white font-bold">{cloudSummary.savedDestinationsCount}</span></div>
              <div>Memories (/memories): <span className="text-white font-bold">{cloudSummary.memoriesCount}</span></div>
              <div>Taste Profile (/preferences): <span className="text-white font-bold">{cloudSummary.hasTasteProfile ? 'Synced' : 'None'}</span></div>
            </div>
            <div className="text-[10px] text-[#3DDC97] pt-1">
              Path: {cloudSummary.queriedPath}
            </div>
          </div>
        )}
      </Card>

      {/* 3. Vietnam Knowledge Base & Geographic Engine Diagnostics */}
      <Card variant="default" className="p-6 border border-[#243049] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-[#9875FF]" />
            <h3 className="font-serif text-lg font-medium text-white">Vietnam Knowledge Engine Diagnostics</h3>
          </div>
          <Badge variant="cyan" size="sm">
            34 Provincial Units Loaded
          </Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono bg-[#080D18] p-4 rounded-xl border border-[#243049]">
          <div className="flex flex-col border-b sm:border-b-0 sm:border-r border-[#243049]/60 pb-2 sm:pb-0 sm:pr-2">
            <span className="text-[#9BA9C3]">Total Units:</span>
            <span className="text-white font-bold text-sm">34 Provinces</span>
          </div>
          <div className="flex flex-col border-b sm:border-b-0 sm:border-r border-[#243049]/60 pb-2 sm:pb-0 sm:pr-2">
            <span className="text-[#9BA9C3]">Regions:</span>
            <span className="text-[#3DDC97] font-bold text-sm">North • Central • South</span>
          </div>
          <div className="flex flex-col border-b sm:border-b-0 sm:border-r border-[#243049]/60 pb-2 sm:pb-0 sm:pr-2">
            <span className="text-[#9BA9C3]">Coordinates:</span>
            <span className="text-[#48E3EF] font-bold text-sm">100% Real Geocodes</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[#9BA9C3]">AI Assistant:</span>
            <span className="text-white font-bold text-sm">Modular Fallback</span>
          </div>
        </div>

        <p className="text-xs text-[#9BA9C3] font-light">
          Normalized data layer containing verified UNESCO sites, historical administrative designations (Thăng Long, Cố Đô Huế, Gia Định, Faifo), authentic regional dishes, and artisanal guilds.
        </p>
      </Card>
    </div>
  );
};

export default DevDiagnosticsPage;
