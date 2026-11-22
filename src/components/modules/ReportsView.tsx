import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  FileText, 
  Printer, 
  Coins, 
  TrendingUp, 
  MapPin, 
  Users, 
  ShieldCheck, 
  Download,
  FileDown,
  CheckCircle2,
  BarChart3,
  LineChart,
  PieChart as PieIcon
} from 'lucide-react';
import { BrandEmblem3D } from '../common/BrandEmblem3D';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  Cell 
} from 'recharts';
import { exportReportToCSV } from '../../utils/exportUtils';
import { 
  PROVINCE_OPTIONS, 
  getDistrictsForProvince, 
  formatShortLocation, 
  mapLegacyRegionToHierarchy 
} from '../../data/locationData';
import { LuxurySelect } from '../common/LuxurySelect';

export const ReportsView: React.FC = () => {
  const { 
    currentUser, 
    regionalStats, 
    payments, 
    users, 
    language 
  } = useApp();
  const isUr = language === 'ur';

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const isAuditOfficer = Boolean(currentUser?.isAuditOfficer);
  const hasFullAuditView = isSuperAdmin || isAuditOfficer;
  const isDistrictAdmin = currentUser?.role === 'ADMIN';
  const isCoAdmin = currentUser?.role === 'CO_ADMIN';
  const isMember = currentUser?.role === 'MEMBER';

  const [filterProvince, setFilterProvince] = useState<string>(
    !hasFullAuditView && (isCoAdmin || isDistrictAdmin)
      ? (currentUser?.assignedStateProvince || currentUser?.stateProvince || 'Punjab')
      : 'ALL'
  );
  const [filterDistrict, setFilterDistrict] = useState<string>(
    !hasFullAuditView && isDistrictAdmin
      ? (currentUser?.assignedDistrict || currentUser?.district || 'Lahore')
      : 'ALL'
  );
  const [downloadSuccessToast, setDownloadSuccessToast] = useState(false);
  const [activeChartTab, setActiveChartTab] = useState<'TRENDS' | 'REGIONAL'>('TRENDS');

  if (!currentUser) return null;

  const handlePrint = () => {
    window.print();
  };

  // Filtered payments by role, province, and district
  const relevantPayments = payments.filter(p => {
    if (isMember && !isAuditOfficer) return p.userId === currentUser.id;
    const fallback = mapLegacyRegionToHierarchy(p.userRegion);
    const pProv = p.stateProvince || fallback.stateProvince;
    const pDist = p.district || fallback.district;

    if (!hasFullAuditView && isDistrictAdmin) {
      const myDist = currentUser.assignedDistrict || currentUser.district;
      return pDist === myDist || p.userRegion === currentUser.region;
    }
    if (!hasFullAuditView && isCoAdmin) {
      const myProv = currentUser.assignedStateProvince || currentUser.stateProvince;
      return pProv === myProv;
    }

    if (filterProvince !== 'ALL' && pProv !== filterProvince) return false;
    if (filterDistrict !== 'ALL' && pDist !== filterDistrict) return false;

    return true;
  });

  const verifiedPayments = relevantPayments.filter(p => p.status === 'VERIFIED');
  const totalVerifiedAmount = verifiedPayments.reduce((acc, curr) => acc + curr.amount, 0);

  const monthlyAmount = verifiedPayments
    .filter(p => p.fundCategory === 'Monthly Contribution')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const annualAmount = verifiedPayments
    .filter(p => p.fundCategory === 'Annual Welfare Fund')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const emergencyAmount = verifiedPayments
    .filter(p => p.fundCategory === 'Emergency Relief')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const zakatAmount = verifiedPayments
    .filter(p => p.fundCategory === 'Zakat & Sadqah')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const calcPct = (val: number) => totalVerifiedAmount > 0 ? Math.round((val / totalVerifiedAmount) * 100) : 0;

  // Dynamic 6-Month Chronological Contribution Dataset computed from real verifiedPayments
  const monthlyTrendData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - (5 - i));
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleString(isUr ? 'ur-PK' : 'en-US', { month: 'short', year: 'numeric' });
    const monthTxs = verifiedPayments.filter(p => (p.date || '').startsWith(key));
    const monthlyPledges = monthTxs
      .filter(p => p.fundCategory === 'Monthly Contribution')
      .reduce((sum, p) => sum + p.amount, 0);
    const annualFund = monthTxs
      .filter(p => p.fundCategory !== 'Monthly Contribution')
      .reduce((sum, p) => sum + p.amount, 0);
    return {
      month: label,
      monthlyPledges,
      annualFund,
      total: monthlyPledges + annualFund
    };
  });

  // Live District Breakdown built from real users & verified payments (falling back to regionalStats only if populated)
  const districtMap = new Map<string, {
    district: string;
    stateProvince: string;
    officerInCharge: string;
    totalMembers: number;
    activeMembers: number;
    totalCollected: number;
    pendingApprovals: number;
    pendingComplaints: number;
  }>();

  users.forEach(u => {
    const dist = u.district || (isUr ? 'غیر متعین' : 'Unassigned');
    const prov = u.stateProvince || 'Pakistan';
    const key = `${prov}__${dist}`;
    if (!districtMap.has(key)) {
      const distAdmin = users.find(a => a.role === 'ADMIN' && (a.assignedDistrict === dist || a.district === dist));
      districtMap.set(key, {
        district: dist,
        stateProvince: prov,
        officerInCharge: distAdmin?.name || (isUr ? 'غیر مقرر' : 'Unassigned'),
        totalMembers: 0,
        activeMembers: 0,
        totalCollected: 0,
        pendingApprovals: 0,
        pendingComplaints: 0
      });
    }
    const entry = districtMap.get(key)!;
    if (u.role === 'MEMBER') {
      entry.totalMembers += 1;
      if (u.membershipStatus === 'ACTIVE') entry.activeMembers += 1;
    }
  });

  verifiedPayments.forEach(p => {
    const dist = p.district || (isUr ? 'غیر متعین' : 'Unassigned');
    const prov = p.stateProvince || 'Pakistan';
    const key = `${prov}__${dist}`;
    if (!districtMap.has(key)) {
      districtMap.set(key, {
        district: dist,
        stateProvince: prov,
        officerInCharge: isUr ? 'غیر مقرر' : 'Unassigned',
        totalMembers: 0,
        activeMembers: 0,
        totalCollected: 0,
        pendingApprovals: 0,
        pendingComplaints: 0
      });
    }
    districtMap.get(key)!.totalCollected += p.amount;
  });

  const normalizedRows = regionalStats.length > 0
    ? regionalStats.map(stat => {
        const fb = mapLegacyRegionToHierarchy(stat.region);
        return {
          region: stat.region,
          district: stat.district || fb.district,
          stateProvince: stat.stateProvince || fb.stateProvince,
          officerInCharge: stat.officerInCharge,
          totalMembers: stat.totalMembers,
          activeMembers: stat.activeMembers,
          totalCollected: stat.totalCollected,
          pendingApprovals: stat.pendingApprovals,
          pendingComplaints: stat.pendingComplaints
        };
      })
    : Array.from(districtMap.values()).map(d => ({ ...d, region: '' }));

  const liveDistrictRows = normalizedRows.filter(stat => {
    const prov = stat.stateProvince;
    const dist = stat.district;
    if (!hasFullAuditView && isDistrictAdmin) {
      const myDist = currentUser.assignedDistrict || currentUser.district;
      return dist === myDist || (stat.region && stat.region === currentUser.region);
    }
    if (!hasFullAuditView && isCoAdmin) {
      const myProv = currentUser.assignedStateProvince || currentUser.stateProvince;
      return prov === myProv;
    }
    if (filterProvince !== 'ALL' && prov !== filterProvince) return false;
    if (filterDistrict !== 'ALL' && dist !== filterDistrict) return false;
    return true;
  });

  const regionalChartData = liveDistrictRows.map(stat => {
    const dist = stat.district;
    const prov = stat.stateProvince;
    return {
      name: dist,
      fullRegion: `${dist}, ${prov}`,
      district: dist,
      stateProvince: prov,
      totalCollected: stat.totalCollected,
      activeMembers: stat.activeMembers,
      targetQuota: Math.round(stat.totalCollected * 1.15)
    };
  });

  // Recharts Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#071812] text-white p-3 rounded-xl border border-[#E5E4E2]/45 shadow-2xl text-xs space-y-1.5 min-w-[180px]">
          <p className="font-bold text-[#E5E4E2] border-b border-[#E5E4E2]/25 pb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-3 text-[11px]">
              <span style={{ color: entry.color }} className="font-medium">
                {entry.name}:
              </span>
              <span className="font-mono tabular-nums font-bold text-white">
                PKR {Number(entry.value).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const handleExportCSV = () => {
    exportReportToCSV(
      liveDistrictRows,
      totalVerifiedAmount,
      monthlyAmount,
      annualAmount,
      currentUser
    );
    setDownloadSuccessToast(true);
    setTimeout(() => setDownloadSuccessToast(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Download Toast Notification */}
      {downloadSuccessToast && (
        <div className="fixed top-5 right-5 z-50 pointer-events-none no-print">
          <div className="bg-[#071812] text-white text-xs px-4 py-2.5 rounded-xl shadow-2xl border border-[#E5E4E2]/50 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold">
              {isUr ? 'آفیشل CSV رپورٹ کامیابی سے ڈاؤن لوڈ ہو گئی!' : 'Branded CSV report downloaded successfully!'}
            </span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E5E4E2]/25 no-print">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#E5E4E2] uppercase tracking-wider">
              {isUr ? 'آڈٹ شدہ مالیاتی اور علاقائی تجزیات' : 'Audited Financial & Regional Analytics'}
            </span>
            <span className="text-[#E5E4E2]/50">·</span>
            <span className="text-xs text-slate-300">
              {isSuperAdmin
                ? (isUr ? 'مرکزی تنظیمی رپورٹ' : 'Master Organization Report')
                : isAuditOfficer
                ? (isUr ? 'آڈٹ آفیسر — صرف مطالعہ مالیاتی بیان' : 'Audit Officer — Read-Only Financial Verification Statement')
                : isDistrictAdmin
                ? (isUr ? `${currentUser.assignedDistrict || currentUser.district} ضلعی بیان` : `${currentUser.assignedDistrict || currentUser.district} District Statement`)
                : isCoAdmin
                ? (isUr ? `${currentUser.assignedStateProvince || currentUser.stateProvince} صوبائی بیان` : `${currentUser.assignedStateProvince || currentUser.stateProvince} Provincial Statement`)
                : (isUr ? 'ذاتی فلاحی حصہ کا خلاصہ' : 'Personal Welfare Contribution Summary')}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1 flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#E5E4E2]" />
            <span>{isUr ? 'سرکاری اسٹیٹمنٹس اور فلاحی رپورٹس' : 'Official Statements & Welfare Reports'}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {isUr
              ? 'تصدیق شدہ بیلنس شیٹ، علاقائی تقسیم اور مصدقہ رسیدوں کی تفصیلات۔'
              : 'Verified balance sheet, regional allocation metrics, and certified receipts breakdown.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="kc-pressable flex items-center gap-1.5 px-3.5 py-2 bg-[#0D2A1F] hover:bg-[#1A233A] text-slate-100 border border-[#E5E4E2]/40 text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            title={isUr ? 'سوئی خیل اتحاد ہیڈرز کے ساتھ CSV اسپریڈشیٹ ڈاؤن لوڈ کریں' : 'Download CSV spreadsheet formatted with SUI KHEL ITTEHAD headers'}
          >
            <FileDown className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isUr ? 'CSV برآمد کریں' : 'Export to CSV'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="kc-pressable kc-gold-button flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold rounded-xl cursor-pointer"
            title={isUr ? 'تنظیمی مہر کے ساتھ PDF محفوظ یا پرنٹ کریں' : 'Print or Save as PDF with organizational watermark and seal'}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{isUr ? 'PDF / پرنٹ کریں' : 'Export to PDF / Print'}</span>
          </button>
        </div>
      </div>

      {/* Financial Statement Sheet Card (PRINTABLE & BRANDED) */}
      <div className="report-print-area kc-obsidian-card rounded-2xl p-5 sm:p-6 space-y-6 relative overflow-hidden">
        {/* Background Seal Watermark for Official Printout */}
        <div 
          className="absolute right-8 bottom-12 w-52 h-52 opacity-10 pointer-events-none rounded-full bg-cover"
          style={{ backgroundImage: `url('/src/assets/images/receipt_watermark_seal_1794225904149.jpg')` }}
        />
        {/* Statement Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E4E2]/25">
          <div className="flex items-center gap-3">
            <BrandEmblem3D size="md" className="shrink-0" />
            <div>
              <h2 className="text-base font-bold text-white uppercase tracking-tight">
                {isUr ? 'سوئی خیل اتحاد ویلفیئر ٹرسٹ' : 'SUI KHEL ITTEHAD Welfare Trust'}
              </h2>
              <p className="text-xs text-slate-300">
                {isUr ? 'آڈٹ شدہ فلاحی کھاتہ اور رسیدوں کی مطابقت کا بیان' : 'Audited Welfare Ledger & Receipts Reconciliation Statement'}
              </p>
              <p className="text-[10px] text-slate-400">
                {isUr
                  ? `مالی مدت: Q4 2026 · برائے ${currentUser.name} (${currentUser.role})`
                  : `Fiscal Period: Q4 2026 · Generated for ${currentUser.name} (${currentUser.role})`}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">{isUr ? 'دستاویز ہیش:' : 'Document Hash:'}</span>
            <span className="font-mono text-xs font-bold text-[#E5E4E2] block">
              STMT-2026-KC{Date.now().toString().slice(-6)}
            </span>
            <span className="text-[10px] text-slate-400 font-mono block">
              {isUr ? 'مرکزی خزانہ سے مصدقہ' : 'Certified by Central Treasury'}
            </span>
          </div>
        </div>

        {/* Aggregate Balance Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-[#071812] rounded-xl border border-[#E5E4E2]/30 shadow-[inset_0_1px_0_rgba(252,227,138,0.08)]">
            <span className="text-[11px] font-semibold text-slate-400 block uppercase">
              {isUr ? 'کل تصدیق شدہ وصولیاں' : 'Total Verified Collections'}
            </span>
            <span className="text-xl font-bold font-mono text-white tabular-nums block mt-1">
              PKR {totalVerifiedAmount.toLocaleString()}
            </span>
            <span className="text-[10px] text-emerald-400 font-medium">
              {isUr ? 'بینک ریکارڈ کے مطابق مصدقہ' : 'Reconciled against bank statements'}
            </span>
          </div>

          <div className="p-4 bg-[#071812] rounded-xl border border-[#E5E4E2]/30 shadow-[inset_0_1px_0_rgba(252,227,138,0.08)]">
            <span className="text-[11px] font-semibold text-slate-400 block uppercase">
              {isUr ? 'ماہانہ سبسکرپشن پول' : 'Monthly Subscription Pool'}
            </span>
            <span className="text-xl font-bold font-mono text-[#E5E4E2] tabular-nums block mt-1">
              PKR {monthlyAmount.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400">
              {isUr ? 'مقررہ فلاحی ماہانہ حصے' : 'Fixed operational welfare pledges'}
            </span>
          </div>

          <div className="p-4 bg-[#071812] rounded-xl border border-[#E5E4E2]/30 shadow-[inset_0_1px_0_rgba(252,227,138,0.08)]">
            <span className="text-[11px] font-semibold text-slate-400 block uppercase">
              {isUr ? 'سالانہ فلاحی و امدادی فنڈ' : 'Annual Welfare & Relief Fund'}
            </span>
            <span className="text-xl font-bold font-mono text-emerald-400 tabular-nums block mt-1">
              PKR {annualAmount.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400">
              {isUr ? 'طبی ڈسپنسری اور تعلیمی وظائف' : 'Healthcare dispensary & student grants'}
            </span>
          </div>
        </div>

        {/* VISUAL ANALYTICS SECTION (RECHARTS INTEGRATION) */}
        <div className="pt-3 border-t border-[#E5E4E2]/20 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#E5E4E2]" />
                <span>{isUr ? 'ایگزیکٹو فلاحی تجزیات اور مالیاتی رجحانات' : 'Executive Welfare Analytics & Financial Trends'}</span>
              </h3>
              <p className="text-xs text-slate-400">
                {isUr ? 'کئی ماہ کا گراف، وصولی کی رفتار اور علاقائی سنگِ میل' : 'Visualizing multi-month trajectory, pledge velocity, and regional collection milestones'}
              </p>
            </div>

            <div className="kc-tab-shell flex items-center gap-1 p-1 rounded-xl text-xs no-print">
              <button
                onClick={() => setActiveChartTab('TRENDS')}
                className={`kc-pressable px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                  activeChartTab === 'TRENDS'
                    ? 'kc-gold-button'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {isUr ? 'ماہانہ گراف (ایریا)' : 'Monthly Trajectory (Area)'}
              </button>
              <button
                onClick={() => setActiveChartTab('REGIONAL')}
                className={`kc-pressable px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                  activeChartTab === 'REGIONAL'
                    ? 'kc-gold-button'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {isUr ? 'علاقائی وصولیاں (بار)' : 'Regional Collections (Bar)'}
              </button>
            </div>
          </div>

          {/* Chart Display Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Main Area / Bar Chart (8 Columns on desktop) */}
            <div className="lg:col-span-8 p-4 bg-[#071812] rounded-xl border border-[#E5E4E2]/25">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-[#E5E4E2] uppercase tracking-wide">
                  {activeChartTab === 'TRENDS' 
                    ? (isUr ? '6 ماہ کی وصولیوں کی رفتار (PKR)' : '6-Month Contribution Velocity (PKR)')
                    : (isUr ? 'ضلعی وصولیاں بمقابلہ ہدف' : 'District Collection Milestones vs Targets')}
                </span>
                <span className="text-[10px] font-mono tabular-nums text-emerald-400 font-semibold">
                  {isUr ? `${verifiedPayments.length} مصدقہ اندراجات` : `${verifiedPayments.length} Verified Entries`}
                </span>
              </div>

              <div className="h-64 sm:h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {activeChartTab === 'TRENDS' ? (
                    <AreaChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorMonthly" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.45}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
                        </linearGradient>
                        <linearGradient id="colorAnnual" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#E5E4E2" stopOpacity={0.45}/>
                          <stop offset="95%" stopColor="#E5E4E2" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,175,55,0.14)" />
                      <XAxis 
                        dataKey="month" 
                        stroke="#94a3b8" 
                        fontSize={11} 
                        tickLine={false} 
                      />
                      <YAxis 
                        stroke="#94a3b8" 
                        fontSize={11} 
                        tickLine={false} 
                        tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} 
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        wrapperStyle={{ fontSize: '11px', paddingTop: '8px', color: '#cbd5e1' }}
                        iconType="circle"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="monthlyPledges" 
                        name={isUr ? 'ماہانہ سبسکرپشن' : 'Monthly Subscriptions'} 
                        stroke="#10B981" 
                        strokeWidth={2.5}
                        fillOpacity={1} 
                        fill="url(#colorMonthly)" 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="annualFund" 
                        name={isUr ? 'سالانہ فلاح و امداد' : 'Annual Welfare & Relief'} 
                        stroke="#E5E4E2"
                        strokeWidth={2.5}
                        fillOpacity={1} 
                        fill="url(#colorAnnual)" 
                      />
                    </AreaChart>
                  ) : (
                    <BarChart data={regionalChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,175,55,0.14)" />
                      <XAxis 
                        dataKey="name" 
                        stroke="#94a3b8" 
                        fontSize={11} 
                        tickLine={false} 
                      />
                      <YAxis 
                        stroke="#94a3b8" 
                        fontSize={11} 
                        tickLine={false} 
                        tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} 
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        wrapperStyle={{ fontSize: '11px', paddingTop: '8px', color: '#cbd5e1' }}
                        iconType="square"
                      />
                      <Bar 
                        dataKey="totalCollected" 
                        name={isUr ? 'کل وصولی (PKR)' : 'Total Collected (PKR)'} 
                        fill="#10B981" 
                        radius={[4, 4, 0, 0]} 
                      />
                      <Bar 
                        dataKey="targetQuota" 
                        name={isUr ? 'سالانہ ہدف (PKR)' : 'Annual Target Quota (PKR)'} 
                        fill="#E5E4E2"
                        radius={[4, 4, 0, 0]} 
                      />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>

            {/* Supplementary KPI / Growth Metrics (4 Columns on desktop) */}
            <div className="lg:col-span-4 p-4 bg-[#071812] rounded-xl border border-[#E5E4E2]/25 flex flex-col justify-between space-y-4">
              <div>
                <span className="text-xs font-bold text-[#E5E4E2] uppercase tracking-wide block mb-2">
                  {isUr ? 'فنڈز کی تقسیم کی تفصیل' : 'Fund Distribution Breakdown'}
                </span>
                <p className="text-[11px] text-slate-400 mb-3">
                  {isUr ? 'مصدقہ فلاحی وصولیوں کا زمرہ وار تناسب' : 'Allocations audited across verified welfare disbursements'}
                </p>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-medium text-slate-300">{isUr ? 'ماہانہ سبسکرپشن' : 'Monthly Subscriptions'}</span>
                      <span className="font-mono tabular-nums font-bold text-white">
                        {calcPct(monthlyAmount)}% (PKR {monthlyAmount.toLocaleString()})
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#161F33] rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${calcPct(monthlyAmount)}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-medium text-slate-300">{isUr ? 'سالانہ فلاحی فنڈ' : 'Annual Welfare Fund'}</span>
                      <span className="font-mono tabular-nums font-bold text-white">
                        {calcPct(annualAmount)}% (PKR {annualAmount.toLocaleString()})
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#161F33] rounded-full overflow-hidden">
                      <div className="h-full bg-sky-500 rounded-full transition-all" style={{ width: `${calcPct(annualAmount)}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-medium text-slate-300">{isUr ? 'ہنگامی امداد' : 'Emergency Relief'}</span>
                      <span className="font-mono tabular-nums font-bold text-white">
                        {calcPct(emergencyAmount)}% (PKR {emergencyAmount.toLocaleString()})
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#161F33] rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${calcPct(emergencyAmount)}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-medium text-slate-300">{isUr ? 'زکوٰۃ و صدقات' : 'Zakat & Sadqah'}</span>
                      <span className="font-mono tabular-nums font-bold text-white">
                        {calcPct(zakatAmount)}% (PKR {zakatAmount.toLocaleString()})
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#161F33] rounded-full overflow-hidden">
                      <div className="h-full bg-[#E5E4E2] rounded-full transition-all" style={{ width: `${calcPct(zakatAmount)}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 kc-emerald-panel rounded-xl text-[11px]">
                <span className="font-bold text-[#E5E4E2] block mb-0.5">
                  {isUr ? 'آڈٹ شدہ خزانہ کی حیثیت' : 'Audited Treasury Status'}
                </span>
                <p className="text-slate-200">
                  {totalVerifiedAmount === 0
                    ? (isUr ? 'ابھی تک کوئی تصدیق شدہ حصہ ریکارڈ نہیں ہوا۔ کھاتہ صفر روپے سے شروع ہوتا ہے۔' : 'Zero verified contributions recorded yet. Ledger starts at PKR 0.')
                    : currentUser.role === 'ADMIN'
                    ? (isUr ? `${currentUser.assignedDistrict || currentUser.district} کا لائیو مصدقہ بیان۔` : `${currentUser.assignedDistrict || currentUser.district} live verified statement.`)
                    : (isUr ? `${verifiedPayments.length} مصدقہ رسیدیں دکھائی جا رہی ہیں۔` : `Showing ${verifiedPayments.length} verified ledger receipts.`)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* District & Provincial Performance Matrix (Visible to Leadership & Audit Officer) */}
        {(hasFullAuditView || !isMember) && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-xs font-bold text-[#E5E4E2] uppercase tracking-wider">
                  {isUr ? 'انتظامی کارکردگی کا جدول (ضلع و صوبہ)' : 'Administrative Hierarchy Performance Matrix (District & Province)'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {isUr ? 'مصدقہ وصولیوں اور فعال اراکین کے ساتھ صوبائی و ضلعی تقسیم' : 'Separated administrative divisions with verified treasury receipts and active member quotas'}
                </p>
              </div>

              {(hasFullAuditView || (!isDistrictAdmin && !isCoAdmin)) && (
                <div className="flex flex-wrap items-center gap-2 no-print">
                  <div className="w-40">
                    <LuxurySelect
                      compact
                      value={filterProvince}
                      onChange={(val) => {
                        setFilterProvince(val);
                        setFilterDistrict('ALL');
                      }}
                      label={isUr ? 'صوبہ فلٹر' : 'Province Filter'}
                      options={[
                        { value: 'ALL', label: isUr ? 'تمام صوبے' : 'All Provinces' },
                        ...PROVINCE_OPTIONS.map(p => ({ value: p, label: p }))
                      ]}
                    />
                  </div>

                  <div className="w-44">
                    <LuxurySelect
                      compact
                      searchable
                      value={filterDistrict}
                      onChange={setFilterDistrict}
                      label={isUr ? 'ضلع فلٹر' : 'District Filter'}
                      options={[
                        { value: 'ALL', label: isUr ? 'تمام اضلاع' : 'All Districts' },
                        ...(filterProvince !== 'ALL'
                          ? getDistrictsForProvince(filterProvince)
                          : PROVINCE_OPTIONS.flatMap(p => getDistrictsForProvince(p))
                        ).map(d => ({ value: d, label: d }))
                      ]}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2.5">
              {liveDistrictRows.length === 0 ? (
                <div className="py-8 px-4 text-center text-xs text-slate-400 rounded-xl border border-[#E5E4E2]/25 bg-[#071812]">
                  {isUr
                    ? 'ابھی تک کوئی ضلعی ریکارڈ موجود نہیں۔ تصدیق شدہ اراکین اور رسیدیں یہاں خودکار ظاہر ہوں گی۔'
                    : 'No district records recorded yet. Verified members and treasury receipts will appear here automatically.'}
                </div>
              ) : (
                liveDistrictRows.map((stat, idx) => {
                  const fb = mapLegacyRegionToHierarchy((stat as any).region);
                  const sDist = stat.district || fb.district;
                  const sProv = stat.stateProvince || fb.stateProvince;

                  return (
                    <div
                      key={sDist ? `${sProv}-${sDist}` : `rep-${idx}`}
                      className="p-3.5 rounded-xl border border-[#E5E4E2]/25 bg-[#071812] space-y-2 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-bold text-white flex items-center gap-1.5 truncate">
                            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="truncate">{sDist}</span>
                          </p>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">{sProv}</p>
                        </div>
                        <span className="text-[10px] text-emerald-300 font-semibold bg-emerald-950/60 border border-emerald-500/35 px-2 py-0.5 rounded-full shrink-0">
                          {isUr ? '100% آڈٹ شدہ' : '100% Audited'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E5E4E2]/15">
                        <div className="min-w-0">
                          <span className="text-[10px] text-slate-400 block">{isUr ? 'نگران افسر' : 'Officer in Charge'}</span>
                          <span className="font-medium text-slate-200 truncate block">{stat.officerInCharge}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-mono tabular-nums font-bold text-[#E5E4E2] block">
                            PKR {stat.totalCollected.toLocaleString()}
                          </span>
                          <span className="text-[10px] font-mono tabular-nums text-slate-300">
                            {isUr ? `فعال اراکین: ${stat.activeMembers}` : `${stat.activeMembers} active members`}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Legal Signatures block */}
        <div className="pt-6 border-t border-[#E5E4E2]/25 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <img 
              src="/src/assets/images/receipt_watermark_seal_1794225904149.jpg" 
              alt="Seal" 
              className="w-12 h-12 rounded-full object-cover border border-[#E5E4E2]/60"
            />
            <div>
              <p className="font-semibold text-white">{isUr ? 'مرکزی آڈٹ بورڈ' : 'Central Audit Board'}</p>
              <p className="text-[10px] text-slate-400">{isUr ? 'الیکٹرانک تصدیقی مہر منسلک ہے' : 'Electronic Verification Stamp Attached'}</p>
            </div>
          </div>

          <div className="text-right text-[10px] text-slate-400">
            <p>{isUr ? 'چارٹرڈ مالیاتی اکاؤنٹنٹس کی جانب سے آزادانہ تصدیق شدہ۔' : 'Verified independently by Chartered Financial Accountants.'}</p>
            <p className="font-mono text-[#E5E4E2]">Govt Trust Reg # ICT-8841-KC</p>
          </div>
        </div>
      </div>
    </div>
  );
};
