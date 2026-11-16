import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Clock, 
  Search, 
  ShieldCheck, 
  Coins, 
  Users, 
  MapPin, 
  Filter,
  Lock
} from 'lucide-react';
import { AuditLog } from '../../types';
import { mapLegacyRegionToHierarchy } from '../../data/locationData';
import { LuxurySelect } from '../common/LuxurySelect';

export const AuditLogsView: React.FC = () => {
  const { currentUser, auditLogs, language } = useApp();
  const isUr = language === 'ur';

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const isAuditOfficer = Boolean(currentUser?.isAuditOfficer);
  const canSeeAllLogs = isSuperAdmin || isAuditOfficer;
  const isDistrictAdmin = currentUser?.role === 'ADMIN';
  const isCoAdmin = currentUser?.role === 'CO_ADMIN';
  const isMember = currentUser?.role === 'MEMBER';

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  if (!currentUser) return null;

  // Strict role-scoped audit visibility per matrix:
  const allowedLogs = auditLogs.filter(log => {
    if (canSeeAllLogs) return true; // Super Admin & Audit Officer see all organization logs
    if (isDistrictAdmin) {
      const myDist = currentUser.assignedDistrict || currentUser.district;
      const logDist = log.district || (log.region ? mapLegacyRegionToHierarchy(log.region).district : '');
      return logDist === myDist || log.region === currentUser.region || log.category === 'REGIONAL';
    }
    if (isCoAdmin) {
      const myProv = currentUser.assignedStateProvince || currentUser.stateProvince;
      const logProv = log.stateProvince || (log.region ? mapLegacyRegionToHierarchy(log.region).stateProvince : '');
      return logProv === myProv;
    }
    if (isMember) {
      return log.actorId === currentUser.id || log.targetEntity.includes(currentUser.name); // Own activity only
    }
    return false;
  });

  const filteredLogs = allowedLogs.filter(log => {
    const fb = log.region ? mapLegacyRegionToHierarchy(log.region) : { district: '', stateProvince: '' };
    const lDist = log.district || fb.district;
    const lProv = log.stateProvince || fb.stateProvince;

    const matchesSearch = 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.targetEntity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lDist.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lProv.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'ALL' || log.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const getCategoryBadge = (category: AuditLog['category']) => {
    switch (category) {
      case 'ROLE_MANAGEMENT':
        return 'bg-purple-950/60 text-purple-300 border-purple-500/40';
      case 'FINANCIAL':
        return 'bg-sky-950/60 text-sky-300 border-sky-500/40';
      case 'MEMBERSHIP':
        return 'bg-[#042920] text-emerald-300 border-emerald-500/45';
      case 'REGIONAL':
        return 'bg-amber-500/15 text-[#F5D061] border-[#D4AF37]/45';
      case 'SECURITY':
        return 'bg-rose-950/60 text-rose-300 border-rose-500/45';
      default:
        return 'bg-[#090D16] text-slate-300 border-[#D4AF37]/25';
    }
  };

  const localizeCategory = (cat: string) => {
    if (!isUr) return cat;
    if (cat === 'ROLE_MANAGEMENT') return 'کرداروں کا نظم';
    if (cat === 'FINANCIAL') return 'مالی تصدیقات';
    if (cat === 'MEMBERSHIP') return 'رکنیت کی منظوریاں';
    if (cat === 'REGIONAL') return 'ضلعی / صوبائی فیصلے';
    if (cat === 'SECURITY') return 'سیکیورٹی سرگرمیاں';
    return cat;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#D4AF37]/25">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#F5D061] uppercase tracking-wider">
              {isUr ? 'نگرانی اور جوابدہی' : 'Compliance & Accountability'}
            </span>
            <span className="text-[#D4AF37]/50">·</span>
            <span className="text-xs text-slate-300">
              {isSuperAdmin
                ? (isUr ? 'مرکزی تنظیمی آڈٹ ریکارڈ' : 'Master Organization Audit Trail')
                : isAuditOfficer
                ? (isUr ? 'آڈٹ آفیسر تصدیقی ریکارڈ (صرف مطالعہ)' : 'Audit Officer Verification Trail (Read-Only)')
                : isDistrictAdmin
                ? (isUr ? `${currentUser.assignedDistrict || currentUser.district} ضلعی سرگرمی ریکارڈ` : `${currentUser.assignedDistrict || currentUser.district} District Audit Trail`)
                : isCoAdmin
                ? (isUr ? `${currentUser.assignedStateProvince || currentUser.stateProvince} صوبائی سرگرمی ریکارڈ` : `${currentUser.assignedStateProvince || currentUser.stateProvince} Activity Audit Trail`)
                : (isUr ? 'میرا ذاتی اکاؤنٹ سرگرمی ریکارڈ' : 'My Personal Account Activity Trail')}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1 flex items-center gap-2">
            <Clock className="w-6 h-6 text-[#F5D061]" />
            <span>{isUr ? 'ناقابلِ تبدیلی گورننس آڈٹ لاگ' : 'Immutable Governance Audit Log'}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {canSeeAllLogs
              ? (isUr
                  ? 'منظوریوں، ادائیگی کی تصدیقات، عہدوں میں تبدیلی اور انتظامی اقدامات کا مکمل تاریخی ریکارڈ۔'
                  : 'Complete historical ledger of approvals, payment certifications, role changes, and administrative actions.')
              : (isUr
                  ? 'صرف آپ کے دائرہ اختیار سے متعلق ریکارڈز دکھائے جا رہے ہیں۔'
                  : 'Strictly filtered to records necessary for your operational role.')}
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 text-[#F5D061] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={isUr ? 'آڈٹ ریکارڈ تلاش کریں...' : 'Search audit trail...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="kc-luxury-input pl-8 pr-3 py-2 text-xs rounded-xl w-full sm:w-64"
            />
          </div>

          {canSeeAllLogs && (
            <div className="w-48">
              <LuxurySelect
                compact
                value={categoryFilter}
                onChange={setCategoryFilter}
                label={isUr ? 'آڈٹ زمرہ' : 'Audit Category'}
                options={[
                  { value: 'ALL', label: isUr ? 'تمام زمرے' : 'All Categories' },
                  { value: 'ROLE_MANAGEMENT', label: isUr ? 'کرداروں کا نظم' : 'Role Management' },
                  { value: 'FINANCIAL', label: isUr ? 'مالی تصدیقات' : 'Financial Verifications' },
                  { value: 'MEMBERSHIP', label: isUr ? 'رکنیت کی منظوریاں' : 'Membership Approvals' },
                  { value: 'REGIONAL', label: isUr ? 'ضلعی / صوبائی فیصلے' : 'District / State Decisions' },
                  { value: 'SECURITY', label: isUr ? 'سیکیورٹی سرگرمیاں' : 'Security Events' }
                ]}
              />
            </div>
          )}
        </div>
      </div>

      {/* Logs Table */}
      <div className="kc-obsidian-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-[#D4AF37]/25 bg-[#090D16] text-[#F5D061] font-semibold">
                <th className="py-3 px-4">{isUr ? 'وقت' : 'Timestamp'}</th>
                <th className="py-3 px-4">{isUr ? 'عامل اور عہدہ' : 'Actor & Role'}</th>
                <th className="py-3 px-4">{isUr ? 'کارروائی' : 'Action Event'}</th>
                <th className="py-3 px-4">{isUr ? 'زمرہ' : 'Category'}</th>
                <th className="py-3 px-4">{isUr ? 'متعلقہ فرد / ہدف' : 'Target Entity'}</th>
                <th className="py-3 px-4">{isUr ? 'تفصیلی بیان' : 'Detailed Statement'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D4AF37]/15">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    {isUr ? 'آپ کے فلٹر کے مطابق کوئی آڈٹ ریکارڈ نہیں ملا۔' : 'No audit records found matching your filter criteria.'}
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-[#161F33]/70 transition-colors">
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-semibold text-white block">
                        {log.actorName}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {log.actorRole} {log.district ? `· ${log.district}, ${log.stateProvince || 'Pakistan'}` : log.region ? `· ${log.region}` : ''}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-[#F5D061] whitespace-nowrap">
                      {log.action}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${getCategoryBadge(log.category)}`}>
                        {localizeCategory(log.category)}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-200 font-medium whitespace-nowrap">
                      {log.targetEntity}
                    </td>

                    <td className="py-3 px-4 text-slate-300 max-w-md">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
