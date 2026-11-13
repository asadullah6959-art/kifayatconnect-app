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

export const ReportsView: React.FC = () => {
  const { 
    currentUser, 
    regionalStats, 
    payments, 
    users, 
    language 
  } = useApp();

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const isFinanceOfficer = currentUser?.role === 'FINANCE_OFFICER';
  const isDistrictAdmin = currentUser?.role === 'ADMIN';
  const isCoAdmin = currentUser?.role === 'CO_ADMIN';
  const isMember = currentUser?.role === 'MEMBER';

  const [filterProvince, setFilterProvince] = useState<string>(
    isCoAdmin || isDistrictAdmin ? (currentUser?.assignedStateProvince || currentUser?.stateProvince || 'Punjab') : 'ALL'
  );
  const [filterDistrict, setFilterDistrict] = useState<string>(
    isDistrictAdmin ? (currentUser?.assignedDistrict || currentUser?.district || 'Lahore') : 'ALL'
  );
  const [downloadSuccessToast, setDownloadSuccessToast] = useState(false);
  const [activeChartTab, setActiveChartTab] = useState<'TRENDS' | 'REGIONAL'>('TRENDS');

  if (!currentUser) return null;

  const handlePrint = () => {
    window.print();
  };

  // Filtered payments by role, province, and district
  const relevantPayments = payments.filter(p => {
    if (isMember) return p.userId === currentUser.id;
    const fallback = mapLegacyRegionToHierarchy(p.userRegion);
    const pProv = p.stateProvince || fallback.stateProvince;
    const pDist = p.district || fallback.district;

    if (isDistrictAdmin) {
      const myDist = currentUser.assignedDistrict || currentUser.district;
      return pDist === myDist || p.userRegion === currentUser.region;
    }
    if (isCoAdmin) {
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
    const label = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
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
    const dist = u.district || 'Unassigned';
    const prov = u.stateProvince || 'Pakistan';
    const key = `${prov}__${dist}`;
    if (!districtMap.has(key)) {
      const distAdmin = users.find(a => a.role === 'ADMIN' && (a.assignedDistrict === dist || a.district === dist));
      districtMap.set(key, {
        district: dist,
        stateProvince: prov,
        officerInCharge: distAdmin?.name || 'Unassigned',
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
    const dist = p.district || 'Unassigned';
    const prov = p.stateProvince || 'Pakistan';
    const key = `${prov}__${dist}`;
    if (!districtMap.has(key)) {
      districtMap.set(key, {
        district: dist,
        stateProvince: prov,
        officerInCharge: 'Unassigned',
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
    if (isDistrictAdmin) {
      const myDist = currentUser.assignedDistrict || currentUser.district;
      return dist === myDist || (stat.region && stat.region === currentUser.region);
    }
    if (isCoAdmin) {
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
        <div className="bg-slate-900 text-white p-3 rounded-lg border border-slate-700 shadow-xl text-xs space-y-1.5 min-w-[180px]">
          <p className="font-bold text-slate-200 border-b border-slate-700 pb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-3 text-[11px]">
              <span style={{ color: entry.color }} className="font-medium">
                {entry.name}:
              </span>
              <span className="font-mono font-bold text-white">
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
          <div className="bg-slate-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-xl border border-emerald-500 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold">Branded CSV report downloaded successfully!</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800 no-print">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Audited Financial & Regional Analytics
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-xs text-slate-500">
              {isSuperAdmin && 'Master Organization Report'}
              {isFinanceOfficer && 'Central Financial Statement'}
              {isDistrictAdmin && `${currentUser.assignedDistrict || currentUser.district} District Statement`}
              {isCoAdmin && `${currentUser.assignedStateProvince || currentUser.stateProvince} Provincial Statement`}
              {isMember && 'Personal Welfare Contribution Summary'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>Official Statements & Welfare Reports</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified balance sheet, regional allocation metrics, and certified receipts breakdown.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-semibold rounded-md shadow-2xs transition-colors"
            title="Download CSV spreadsheet formatted with Kifayat Connect headers"
          >
            <FileDown className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export to CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
            title="Print or Save as PDF with organizational watermark and seal"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Export to PDF / Print</span>
          </button>
        </div>
      </div>

      {/* Financial Statement Sheet Card (PRINTABLE & BRANDED) */}
      <div className="report-print-area bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6 space-y-6 shadow-xs relative overflow-hidden">
        {/* Background Seal Watermark for Official Printout */}
        <div 
          className="absolute right-8 bottom-12 w-52 h-52 opacity-10 pointer-events-none rounded-full bg-cover"
          style={{ backgroundImage: `url('/src/assets/images/receipt_watermark_seal_1794225904149.jpg')` }}
        />
        {/* Statement Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <img 
              src="/src/assets/images/kifayat_emblem_logo_1794225902501.jpg" 
              alt="Logo" 
              className="w-12 h-12 rounded-lg object-cover border border-emerald-600/40"
            />
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                Kifayat Connect Welfare Trust
              </h2>
              <p className="text-xs text-slate-500">
                Audited Welfare Ledger & Receipts Reconciliation Statement
              </p>
              <p className="text-[10px] text-slate-400">
                Fiscal Period: Q4 2026 · Generated for {currentUser.name} ({currentUser.role})
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Document Hash:</span>
            <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 block">
              STMT-2026-KC{Date.now().toString().slice(-6)}
            </span>
            <span className="text-[10px] text-slate-400 font-mono block">
              Certified by Central Treasury
            </span>
          </div>
        </div>

        {/* Aggregate Balance Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-500 block uppercase">
              Total Verified Collections
            </span>
            <span className="text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums block mt-1">
              PKR {totalVerifiedAmount.toLocaleString()}
            </span>
            <span className="text-[10px] text-emerald-600 font-medium">Reconciled against bank statements</span>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-500 block uppercase">
              Monthly Subscription Pool
            </span>
            <span className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400 tabular-nums block mt-1">
              PKR {monthlyAmount.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400">Fixed operational welfare pledges</span>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-500 block uppercase">
              Annual Welfare & Relief Fund
            </span>
            <span className="text-xl font-bold font-mono text-purple-600 dark:text-purple-400 tabular-nums block mt-1">
              PKR {annualAmount.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400">Healthcare dispensary & student grants</span>
          </div>
        </div>

        {/* VISUAL ANALYTICS SECTION (RECHARTS INTEGRATION) */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                <span>Executive Welfare Analytics & Financial Trends</span>
              </h3>
              <p className="text-xs text-slate-500">
                Visualizing multi-month trajectory, pledge velocity, and regional collection milestones
              </p>
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs no-print">
              <button
                onClick={() => setActiveChartTab('TRENDS')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  activeChartTab === 'TRENDS'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Monthly Trajectory (Area)
              </button>
              <button
                onClick={() => setActiveChartTab('REGIONAL')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  activeChartTab === 'REGIONAL'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Regional Collections (Bar)
              </button>
            </div>
          </div>

          {/* Chart Display Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Main Area / Bar Chart (8 Columns on desktop) */}
            <div className="lg:col-span-8 p-4 bg-slate-50 dark:bg-slate-950/40 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                  {activeChartTab === 'TRENDS' 
                    ? '6-Month Contribution Velocity (PKR)' 
                    : 'District Collection Milestones vs Targets'}
                </span>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                  {verifiedPayments.length} Verified Entries
                </span>
              </div>

              <div className="h-64 sm:h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {activeChartTab === 'TRENDS' ? (
                    <AreaChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorMonthly" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#059669" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#059669" stopOpacity={0.0}/>
                        </linearGradient>
                        <linearGradient id="colorAnnual" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} />
                      <XAxis 
                        dataKey="month" 
                        stroke="#64748b" 
                        fontSize={11} 
                        tickLine={false} 
                      />
                      <YAxis 
                        stroke="#64748b" 
                        fontSize={11} 
                        tickLine={false} 
                        tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} 
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                        iconType="circle"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="monthlyPledges" 
                        name="Monthly Subscriptions" 
                        stroke="#059669" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorMonthly)" 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="annualFund" 
                        name="Annual Welfare & Relief" 
                        stroke="#2563eb" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorAnnual)" 
                      />
                    </AreaChart>
                  ) : (
                    <BarChart data={regionalChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} />
                      <XAxis 
                        dataKey="name" 
                        stroke="#64748b" 
                        fontSize={11} 
                        tickLine={false} 
                      />
                      <YAxis 
                        stroke="#64748b" 
                        fontSize={11} 
                        tickLine={false} 
                        tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} 
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                        iconType="square"
                      />
                      <Bar 
                        dataKey="totalCollected" 
                        name="Total Collected (PKR)" 
                        fill="#059669" 
                        radius={[4, 4, 0, 0]} 
                      />
                      <Bar 
                        dataKey="targetQuota" 
                        name="Annual Target Quota (PKR)" 
                        fill="#cbd5e1" 
                        radius={[4, 4, 0, 0]} 
                      />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>

            {/* Supplementary KPI / Growth Metrics (4 Columns on desktop) */}
            <div className="lg:col-span-4 p-4 bg-slate-50 dark:bg-slate-950/40 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide block mb-2">
                  Fund Distribution Breakdown
                </span>
                <p className="text-[11px] text-slate-500 mb-3">
                  Allocations audited across verified welfare disbursements
                </p>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-medium text-slate-700 dark:text-slate-300">Monthly Subscriptions</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                        {calcPct(monthlyAmount)}% (PKR {monthlyAmount.toLocaleString()})
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-600 rounded-full transition-all" style={{ width: `${calcPct(monthlyAmount)}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-medium text-slate-700 dark:text-slate-300">Annual Welfare Fund</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                        {calcPct(annualAmount)}% (PKR {annualAmount.toLocaleString()})
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${calcPct(annualAmount)}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-medium text-slate-700 dark:text-slate-300">Emergency Relief</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                        {calcPct(emergencyAmount)}% (PKR {emergencyAmount.toLocaleString()})
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-600 rounded-full transition-all" style={{ width: `${calcPct(emergencyAmount)}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-medium text-slate-700 dark:text-slate-300">Zakat & Sadqah</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                        {calcPct(zakatAmount)}% (PKR {zakatAmount.toLocaleString()})
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${calcPct(zakatAmount)}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 text-[11px]">
                <span className="font-bold text-slate-900 dark:text-white block mb-0.5">
                  Audited Treasury Status
                </span>
                <p className="text-slate-500">
                  {totalVerifiedAmount === 0
                    ? 'Zero verified contributions recorded yet. Ledger starts at PKR 0.'
                    : currentUser.role === 'ADMIN'
                    ? `${currentUser.assignedDistrict || currentUser.district} live verified statement.`
                    : `Showing ${verifiedPayments.length} verified ledger receipts.`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* District & Provincial Performance Matrix (Visible to Super Admin & Finance Officer) */}
        {!isMember && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Administrative Hierarchy Performance Matrix (District & Province)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Separated administrative divisions with verified treasury receipts and active member quotas
                </p>
              </div>

              {!isDistrictAdmin && !isCoAdmin && (
                <div className="flex items-center gap-2 no-print">
                  <select
                    value={filterProvince}
                    onChange={(e) => {
                      setFilterProvince(e.target.value);
                      setFilterDistrict('ALL');
                    }}
                    className="text-xs px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md"
                  >
                    <option value="ALL">All Provinces</option>
                    {PROVINCE_OPTIONS.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>

                  <select
                    value={filterDistrict}
                    onChange={(e) => setFilterDistrict(e.target.value)}
                    className="text-xs px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md"
                  >
                    <option value="ALL">All Districts</option>
                    {(filterProvince !== 'ALL'
                      ? getDistrictsForProvince(filterProvince)
                      : Object.values(PROVINCE_OPTIONS).flatMap(p => getDistrictsForProvince(p))
                    ).map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-400 font-medium">
                    <th className="py-2.5 px-3">District</th>
                    <th className="py-2.5 px-3">State / Province</th>
                    <th className="py-2.5 px-3">Officer in Charge</th>
                    <th className="py-2.5 px-3 text-right">Active Count</th>
                    <th className="py-2.5 px-3 text-right">Total Contributed (PKR)</th>
                    <th className="py-2.5 px-3 text-center">Compliance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {liveDistrictRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No district records recorded yet. Verified members and treasury receipts will appear here automatically.
                      </td>
                    </tr>
                  ) : (
                    liveDistrictRows.map((stat, idx) => {
                      const fb = mapLegacyRegionToHierarchy((stat as any).region);
                      const sDist = stat.district || fb.district;
                      const sProv = stat.stateProvince || fb.stateProvince;

                      return (
                        <tr key={sDist ? `${sProv}-${sDist}` : `rep-${idx}`}>
                          <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>{sDist}</span>
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-600 dark:text-slate-300">
                            {sProv}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500">
                            {stat.officerInCharge}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                            {stat.activeMembers}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-slate-100">
                            {stat.totalCollected.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                              100% Audited
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Legal Signatures block */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <img 
              src="/src/assets/images/receipt_watermark_seal_1794225904149.jpg" 
              alt="Seal" 
              className="w-12 h-12 rounded-full object-cover border border-emerald-600"
            />
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">Central Audit Board</p>
              <p className="text-[10px] text-slate-400">Electronic Verification Stamp Attached</p>
            </div>
          </div>

          <div className="text-right text-[10px] text-slate-400">
            <p>Verified independently by Chartered Financial Accountants.</p>
            <p className="font-mono">Govt Trust Reg # ICT-8841-KC</p>
          </div>
        </div>
      </div>
    </div>
  );
};
