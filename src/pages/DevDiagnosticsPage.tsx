import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Database,
  Check,
  ExternalLink,
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

import { EditorialReviewWorkbench } from '../components/editorial/EditorialReviewWorkbench.tsx';

export const DevDiagnosticsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'editorial' | 'infra'>('editorial');
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
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          badge="Công Cụ Phát Triển"
          badgeVariant="cyan"
          title="Chẩn Đoán Hệ Thống & Quản Trị Dữ Liệu"
          description="Công cụ quản trị dữ liệu thực địa miền Bắc, kiểm chứng nguồn tham chiếu và chẩn đoán hạ tầng."
        />

        <div className="flex items-center gap-2 bg-[#0E1626] p-1.5 rounded-xl border border-[#243049]">
          <button
            onClick={() => setActiveTab('editorial')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'editorial'
                ? 'bg-[#3DDC97] text-[#080D18] shadow-sm'
                : 'text-[#9BA9C3] hover:text-white'
            }`}
          >
            Quản trị Biên tập Dữ liệu
          </button>
          <button
            onClick={() => setActiveTab('infra')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'infra'
                ? 'bg-[#48E3EF] text-[#080D18] shadow-sm'
                : 'text-[#9BA9C3] hover:text-white'
            }`}
          >
            Hạ tầng & Cloud Ledger
          </button>
          <Link
            to="/tourism-data"
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-400 hover:text-white bg-emerald-950/40 border border-emerald-900/50 transition-all hover:bg-emerald-900/60"
          >
            <Database className="w-3.5 h-3.5" /> Dữ liệu Du lịch & Di sản <ExternalLink className="w-3 h-3 ml-0.5" />
          </Link>
        </div>
      </div>

      {activeTab === 'editorial' ? (
        <EditorialReviewWorkbench />
      ) : (
        <div className="max-w-4xl space-y-6">
          {/* 1. SDK & Environment Diagnostic Panel */}
          <Card variant="default" className="p-6 border border-[#243049] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-[#48E3EF]" />
                <h3 className="font-serif text-lg font-medium text-white">Firebase SDK Diagnostic Panel</h3>
              </div>
              <Badge variant={diagnostics.isConfigured ? 'green' : 'neutral'} size="sm">
                {diagnostics.isConfigured ? 'Đã khởi tạo SDK Trực tiếp' : 'Bộ nhớ mô phỏng Cục bộ'}
              </Badge>
            </div>

        <div className="grid grid-cols-2 gap-3 text-xs font-mono bg-[#080D18] p-4 rounded-xl border border-[#243049]">
          <div className="flex justify-between border-b border-[#243049]/60 pb-1.5">
            <span className="text-[#9BA9C3]">Mã dự án (Project ID):</span>
            <span className="text-white">{diagnostics.projectId}</span>
          </div>
          <div className="flex justify-between border-b border-[#243049]/60 pb-1.5">
            <span className="text-[#9BA9C3]">Tên miền xác thực:</span>
            <span className="text-white truncate max-w-[160px]">{diagnostics.authDomain}</span>
          </div>
          <div className="flex justify-between border-b border-[#243049]/60 pb-1.5">
            <span className="text-[#9BA9C3]">Web API Key:</span>
            <span className={diagnostics.hasApiKey ? 'text-[#3DDC97]' : 'text-amber-400'}>
              {diagnostics.hasApiKey ? 'Đã cấu hình' : 'Thiếu trong .env'}
            </span>
          </div>
          <div className="flex justify-between border-b border-[#243049]/60 pb-1.5">
            <span className="text-[#9BA9C3]">Mã ứng dụng (App ID):</span>
            <span className={diagnostics.hasAppId ? 'text-[#3DDC97]' : 'text-amber-400'}>
              {diagnostics.hasAppId ? 'Đã cấu hình' : 'Thiếu trong .env'}
            </span>
          </div>
          <div className="flex justify-between border-b border-[#243049]/60 pb-1.5">
            <span className="text-[#9BA9C3]">Client Auth SDK:</span>
            <span className={diagnostics.authReady ? 'text-[#3DDC97]' : 'text-[#9BA9C3]'}>
              {diagnostics.authReady ? 'Đã nạp' : 'Ngoại tuyến'}
            </span>
          </div>
          <div className="flex justify-between border-b border-[#243049]/60 pb-1.5">
            <span className="text-[#9BA9C3]">Client Firestore SDK:</span>
            <span className={diagnostics.firestoreReady ? 'text-[#3DDC97]' : 'text-[#9BA9C3]'}>
              {diagnostics.firestoreReady ? 'Đã nạp' : 'Ngoại tuyến'}
            </span>
          </div>
          <div className="flex justify-between border-b border-[#243049]/60 pb-1.5">
            <span className="text-[#9BA9C3]">Phiên người dùng:</span>
            <span className={authSession ? 'text-[#3DDC97] truncate max-w-[160px]' : 'text-[#9BA9C3]'}>
              {authSession ? authSession.email || 'Đã đăng nhập' : 'Khách vãng lai'}
            </span>
          </div>
          <div className="flex justify-between border-b border-[#243049]/60 pb-1.5">
            <span className="text-[#9BA9C3]">Kết nối Firestore:</span>
            <span className={reachabilityReport?.isReachable ? 'text-[#3DDC97]' : reachabilityReport ? 'text-amber-400' : 'text-[#9BA9C3]'}>
              {reachabilityReport?.isReachable ? `Kết nối tốt (${reachabilityReport.latencyMs}ms)` : reachabilityReport ? 'Không thể kết nối' : 'Chưa kiểm tra'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-[#9BA9C3]">
            {reachabilityReport ? reachabilityReport.message : 'Chủ động kiểm tra kết nối hai chiều đến Cloud Firestore:'}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestFirestoreReachability}
            disabled={!diagnostics.firestoreReady || isCheckingReachability}
            className="text-xs"
          >
            {isCheckingReachability ? 'Đang kiểm tra...' : 'Ping Cloud Firestore'}
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
            {persistenceStatus.isCloudSyncEnabled ? 'Đám mây đã xác thực' : 'Bộ nhớ cục bộ trên thiết bị'}
          </Badge>
        </div>

        <div className="space-y-2 text-xs bg-[#080D18] p-4 rounded-xl border border-[#243049]">
          <div className="flex justify-between py-1 border-b border-[#243049]/60">
            <span className="text-[#9BA9C3]">Chế độ hoạt động:</span>
            <span className="font-mono text-white">{persistenceStatus.currentMode}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-[#243049]/60">
            <span className="text-[#9BA9C3]">Đường dẫn cô lập người dùng:</span>
            <span className="font-mono text-[#3DDC97]">{persistenceStatus.userIsolationPath || 'Không (Chế độ Khách)'}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-[#243049]/60">
            <span className="text-[#9BA9C3]">Quy tắc bảo mật Firestore:</span>
            <span className="font-mono text-[#3DDC97] text-[11px]">{persistenceStatus.isolationContract}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-[#9BA9C3]">Chính sách di chuyển dữ liệu:</span>
            <span className="text-white text-[11px]">{persistenceStatus.migrationPolicyNotice}</span>
          </div>
        </div>

        {authUser && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-[#9BA9C3]">
              Kiểm tra các tài liệu thực tế lưu trữ tại /users/{authUser.uid.slice(0, 8)}/*:
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleFetchCloudLedger}
              disabled={isFetchingCloud}
              className="text-xs"
            >
              {isFetchingCloud ? 'Đang truy vấn...' : 'Xác Minh Đọc Dữ Liệu Đám Mây (/users/{uid}/*)'}
            </Button>
          </div>
        )}

        {cloudSummary && (
          <div className="rounded-xl border border-[#3DDC97]/30 bg-[#3DDC97]/5 p-4 text-xs font-mono space-y-2">
            <div className="flex items-center justify-between text-white font-semibold">
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-[#3DDC97]" />
                <span>Kiểm Tra Dữ Liệu Đám Mây Trực Tiếp</span>
              </span>
              <span className="text-[10px] text-[#9BA9C3]">{new Date(cloudSummary.fetchedAt).toLocaleTimeString()}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>Chuyến đi (/trips): <span className="text-white font-bold">{cloudSummary.tripsCount}</span></div>
              <div>Điểm đến (/savedDestinations): <span className="text-white font-bold">{cloudSummary.savedDestinationsCount}</span></div>
              <div>Kỷ niệm (/memories): <span className="text-white font-bold">{cloudSummary.memoriesCount}</span></div>
              <div>Gu văn hóa (/preferences): <span className="text-white font-bold">{cloudSummary.hasTasteProfile ? 'Đã đồng bộ' : 'Chưa có'}</span></div>
            </div>
            <div className="text-[10px] text-[#3DDC97] pt-1">
              Đường dẫn: {cloudSummary.queriedPath}
            </div>
          </div>
        )}
      </Card>

      {/* 3. Vietnam Knowledge Base & Geographic Engine Diagnostics */}
      <Card variant="default" className="p-6 border border-[#243049] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-[#9875FF]" />
            <h3 className="font-serif text-lg font-medium text-white">Chẩn Đoán Động Cơ Tri Thức Du Lịch Việt Nam</h3>
          </div>
          <Badge variant="cyan" size="sm">
            Đã nạp 34 Đơn vị Hành chính
          </Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono bg-[#080D18] p-4 rounded-xl border border-[#243049]">
          <div className="flex flex-col border-b sm:border-b-0 sm:border-r border-[#243049]/60 pb-2 sm:pb-0 sm:pr-2">
            <span className="text-[#9BA9C3]">Tổng số đơn vị:</span>
            <span className="text-white font-bold text-sm">34 Tỉnh/Thành phố</span>
          </div>
          <div className="flex flex-col border-b sm:border-b-0 sm:border-r border-[#243049]/60 pb-2 sm:pb-0 sm:pr-2">
            <span className="text-[#9BA9C3]">Phân vùng:</span>
            <span className="text-[#3DDC97] font-bold text-sm">Bắc • Trung • Nam</span>
          </div>
          <div className="flex flex-col border-b sm:border-b-0 sm:border-r border-[#243049]/60 pb-2 sm:pb-0 sm:pr-2">
            <span className="text-[#9BA9C3]">Tọa độ địa lý:</span>
            <span className="text-[#48E3EF] font-bold text-sm">100% Tọa độ thực</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[#9BA9C3]">Trợ lý AI:</span>
            <span className="text-white font-bold text-sm">Dự phòng Tất định</span>
          </div>
        </div>

        <p className="text-xs text-[#9BA9C3] font-light">
          Lớp dữ liệu chuẩn hóa bao gồm các di sản UNESCO đã xác minh, địa danh lịch sử (Thăng Long, Cố đô Huế, Gia Định, Faifo), ẩm thực truyền thống và làng nghề nghệ nhân.
        </p>
      </Card>
        </div>
      )}
    </div>
  );
};

export default DevDiagnosticsPage;
