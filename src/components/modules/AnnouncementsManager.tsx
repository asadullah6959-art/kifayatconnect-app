import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Megaphone,
  Send,
  Plus,
  Pin,
  MapPin,
  MailCheck,
  Crown,
  Archive,
  Clock,
  Trash2,
  X
} from 'lucide-react';
import {
  PROVINCE_OPTIONS,
  getDistrictsForProvince,
  mapLegacyRegionToHierarchy
} from '../../data/locationData';
import { translate } from '../../data/translations';
import { AnnouncementType } from '../../types';
import { RoleBadge } from '../common/RoleBadge';
import { LuxurySelect } from '../common/LuxurySelect';

export const AnnouncementsManager: React.FC = () => {
  const {
    currentUser,
    announcements,
    publishAnnouncement,
    deleteAnnouncement,
    appSettings,
    language
  } = useApp();

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const isDistrictAdmin = currentUser?.role === 'ADMIN';
  const isCoAdmin = currentUser?.role === 'CO_ADMIN';
  const isRegularMember = !currentUser || currentUser.role === 'MEMBER';

  const canPublishOfficial = !isRegularMember && (isSuperAdmin || Boolean(currentUser?.permissions?.canPostOfficialAnnouncements));
  const canPublishCommunity =
    !isRegularMember &&
    appSettings.featureToggles?.allowCommunityAnnouncements !== false &&
    (isSuperAdmin || isDistrictAdmin || isCoAdmin || Boolean(currentUser?.permissions?.canPostCommunityAnnouncements));
  const canPublishAny = canPublishOfficial || canPublishCommunity;

  const [activeChannel, setActiveChannel] = useState<'OFFICIAL_APP' | 'COMMUNITY' | 'ARCHIVE'>('OFFICIAL_APP');
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [annType, setAnnType] = useState<AnnouncementType>(canPublishOfficial ? 'OFFICIAL_APP' : 'COMMUNITY');
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annScope, setAnnScope] = useState<'ALL' | 'PROVINCE' | 'DISTRICT'>(
    isDistrictAdmin ? 'DISTRICT' : isCoAdmin ? 'PROVINCE' : 'ALL'
  );
  const [annProvince, setAnnProvince] = useState<string>(
    currentUser?.assignedStateProvince || currentUser?.stateProvince || 'Punjab'
  );
  const [annDistrict, setAnnDistrict] = useState<string>(
    currentUser?.assignedDistrict || currentUser?.district || 'Lahore'
  );
  const [annUrgency, setAnnUrgency] = useState<'NORMAL' | 'URGENT'>('NORMAL');
  const [annPinned, setAnnPinned] = useState(false);
  const [annExpiresAt, setAnnExpiresAt] = useState('');

  if (!currentUser) return null;

  const nowMs = Date.now();

  const visibleToUser = announcements.filter(ann => {
    if (isSuperAdmin) return true;
    if (ann.announcementType === 'OFFICIAL_APP') return true;
    if (ann.targetScope === 'ALL' || ann.targetRegion === 'ALL_REGIONS' || !ann.targetScope) return true;

    const userLoc = mapLegacyRegionToHierarchy(currentUser.region);
    const userProv = currentUser.stateProvince || userLoc.stateProvince;
    const userDist = currentUser.district || userLoc.district;

    if (ann.targetScope === 'PROVINCE' && ann.targetStateProvince) {
      return ann.targetStateProvince === userProv;
    }
    if (ann.targetScope === 'DISTRICT' && ann.targetDistrict) {
      return ann.targetDistrict === userDist;
    }
    return true;
  });

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    const t = new Date(expiresAt).getTime();
    return !Number.isNaN(t) && t <= nowMs;
  };

  const sortAnnouncements = (list: typeof visibleToUser) =>
    [...list].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });

  const officialList = sortAnnouncements(
    visibleToUser.filter(a => a.announcementType === 'OFFICIAL_APP' && !isExpired(a.expiresAt))
  );
  const communityList = sortAnnouncements(
    visibleToUser.filter(a => a.announcementType !== 'OFFICIAL_APP' && !isExpired(a.expiresAt))
  );
  const archiveList = sortAnnouncements(
    visibleToUser.filter(a => isExpired(a.expiresAt))
  );

  const displayedList =
    activeChannel === 'OFFICIAL_APP'
      ? officialList
      : activeChannel === 'COMMUNITY'
      ? communityList
      : archiveList;

  const openPublishForChannel = () => {
    if (activeChannel === 'OFFICIAL_APP' && canPublishOfficial) {
      setAnnType('OFFICIAL_APP');
    } else if (canPublishCommunity) {
      setAnnType('COMMUNITY');
    } else {
      setAnnType('OFFICIAL_APP');
    }
    setIsPublishModalOpen(true);
  };

  const handlePublishSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;

    const finalType: AnnouncementType =
      annType === 'OFFICIAL_APP' && canPublishOfficial ? 'OFFICIAL_APP' : 'COMMUNITY';

    const targetScope =
      finalType === 'OFFICIAL_APP'
        ? 'ALL'
        : isDistrictAdmin
        ? 'DISTRICT'
        : isCoAdmin
        ? 'PROVINCE'
        : annScope;

    const targetStateProvince =
      finalType === 'OFFICIAL_APP'
        ? undefined
        : isDistrictAdmin || isCoAdmin
        ? (currentUser.assignedStateProvince || currentUser.stateProvince)
        : annScope !== 'ALL'
        ? annProvince
        : undefined;

    const targetDistrict =
      finalType === 'OFFICIAL_APP'
        ? undefined
        : isDistrictAdmin
        ? (currentUser.assignedDistrict || currentUser.district)
        : annScope === 'DISTRICT'
        ? annDistrict
        : undefined;

    const parsedExpiry = annExpiresAt ? new Date(annExpiresAt).toISOString() : undefined;

    publishAnnouncement({
      title: annTitle.trim(),
      content: annContent.trim(),
      announcementType: finalType,
      targetScope,
      targetStateProvince,
      targetDistrict,
      urgency: annUrgency,
      isPinned: annPinned,
      expiresAt: parsedExpiry
    });

    setIsPublishModalOpen(false);
    setAnnTitle('');
    setAnnContent('');
    setAnnPinned(false);
    setAnnExpiresAt('');
    setActiveChannel(finalType);
  };

  const isUr = language === 'ur';

  return (
    <div className="space-y-5 max-w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#D4AF37]/25">
        <div className="min-w-0">
          <span className="text-[11px] font-bold text-[#F5D061] uppercase tracking-wider">
            {isUr ? 'اعلانات اور دوہرا نشریاتی نظام' : 'Elaanat & Dual Broadcast Channels'}
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white mt-0.5 flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-[#F5D061] shrink-0" />
            <span>{translate(language, 'announcementsHeader')}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {canPublishAny
              ? (isUr ? 'شائع شدہ اعلانات خودکار طور پر اراکین کی اطلاعات اور چیٹ ان باکس میں پہنچ جاتے ہیں۔' : 'Published announcements auto-sync to member notification feeds and direct chat inboxes.')
              : (isUr ? 'سپرایڈمن کے سرکاری اعلانات اور ضلعی کمیونٹی سرکلرز۔' : 'Official Super Admin notices and district community circulars.')}
          </p>
        </div>

        {canPublishAny && (
          <button
            type="button"
            onClick={openPublishForChannel}
            className="flex items-center gap-1.5 px-4 py-2.5 kc-gold-button text-xs font-extrabold rounded-xl shadow-sm self-start md:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{translate(language, 'publishAnnouncementBtn')}</span>
          </button>
        )}
      </div>

      {/* 3 Channel Tabs: Official App 👑 | Community 📢 | History Archive */}
      <div className="inline-flex items-center gap-1.5 p-1.5 kc-tab-shell rounded-2xl overflow-x-auto max-w-full text-xs">
        <button
          type="button"
          onClick={() => setActiveChannel('OFFICIAL_APP')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold whitespace-nowrap kc-pressable cursor-pointer ${
            activeChannel === 'OFFICIAL_APP'
              ? 'kc-gold-button'
              : 'text-slate-300 hover:text-white hover:bg-[#141B2D]'
          }`}
        >
          <Crown className="w-3.5 h-3.5" />
          <span>{translate(language, 'tabOfficialApp')}</span>
          <span className="px-1.5 py-0.5 rounded-md bg-black/25 text-[10px] font-mono tabular-nums">{officialList.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveChannel('COMMUNITY')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold whitespace-nowrap kc-pressable cursor-pointer ${
            activeChannel === 'COMMUNITY'
              ? 'kc-gold-button'
              : 'text-slate-300 hover:text-white hover:bg-[#141B2D]'
          }`}
        >
          <Megaphone className="w-3.5 h-3.5" />
          <span>{translate(language, 'tabCommunity')}</span>
          <span className="px-1.5 py-0.5 rounded-md bg-black/25 text-[10px] font-mono tabular-nums">{communityList.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveChannel('ARCHIVE')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold whitespace-nowrap kc-pressable cursor-pointer ${
            activeChannel === 'ARCHIVE'
              ? 'kc-gold-button'
              : 'text-slate-300 hover:text-white hover:bg-[#141B2D]'
          }`}
        >
          <Archive className="w-3.5 h-3.5" />
          <span>{translate(language, 'tabArchive')}</span>
          <span className="px-1.5 py-0.5 rounded-md bg-black/25 text-[10px] font-mono tabular-nums">{archiveList.length}</span>
        </button>
      </div>

      {canPublishAny && activeChannel !== 'ARCHIVE' && (
        <div className="p-3.5 rounded-2xl kc-emerald-panel flex items-center gap-2.5 text-xs text-emerald-100">
          <MailCheck className="w-4 h-4 text-[#F5D061] shrink-0" />
          <span>
            {isUr
              ? 'خودکار نشریات فعال ہیں: آفیشل ایپ اعلانات (👑) کے لیے سپر ایڈمن کی اجازت درکار ہے؛ کمیونٹی اطلاعات متعلقہ صوبے/ضلع کے ان باکس تک پہنچتی ہیں۔'
              : 'Auto-Broadcast Active: Official App announcements (👑) require Super Admin authority; Community notices reach targeted province/district inboxes.'}
          </span>
        </div>
      )}

      {/* List */}
      <div className="space-y-3.5">
        {displayedList.length === 0 ? (
          <div className="p-10 text-center kc-obsidian-card rounded-2xl text-xs text-slate-400">
            {activeChannel === 'ARCHIVE'
              ? translate(language, 'noArchivedAnnouncements')
              : translate(language, 'noAnnouncements')}
          </div>
        ) : (
          displayedList.map(ann => {
            const isOfficial = ann.announcementType === 'OFFICIAL_APP';
            const expired = isExpired(ann.expiresAt);
            return (
              <div
                key={ann.id}
                className={`p-4 sm:p-5 rounded-2xl text-xs space-y-2.5 ${
                  ann.urgency === 'URGENT'
                    ? 'bg-rose-950/30 border border-rose-500/45 shadow-lg'
                    : isOfficial
                    ? 'kc-obsidian-card border-[#D4AF37]/45'
                    : 'kc-obsidian-card'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${
                        isOfficial
                          ? 'bg-[#090D16] border-[#F5D061]/50 text-[#F5D061]'
                          : 'bg-[#131C31] border-[#38BDF8]/45 text-[#38BDF8]'
                      }`}
                    >
                      {isOfficial
                        ? (isUr ? '👑 آفیشل ایپ' : '👑 OFFICIAL APP')
                        : (isUr ? '📢 کمیونٹی' : '📢 COMMUNITY')}
                    </span>

                    {ann.isPinned && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-[#F5D061] bg-[#131C31] px-2 py-0.5 rounded-md border border-[#D4AF37]/40">
                        <Pin className="w-3 h-3" />
                        <span>{translate(language, 'pinnedBadge')}</span>
                      </span>
                    )}

                    {ann.urgency === 'URGENT' && (
                      <span className="text-[10px] font-bold text-rose-200 uppercase px-2 py-0.5 rounded-md bg-rose-900/80 border border-rose-500/40">
                        {translate(language, 'urgentBadge')}
                      </span>
                    )}

                    {expired && (
                      <span className="text-[10px] font-bold text-slate-300 uppercase px-2 py-0.5 rounded-md bg-[#090D16] border border-[#D4AF37]/20">
                        {translate(language, 'expiredOn')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-[#090D16] border border-[#D4AF37]/25 px-2.5 py-0.5 rounded-lg text-emerald-300">
                      <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                      {ann.targetScope === 'ALL' || ann.targetRegion === 'ALL_REGIONS' || !ann.targetScope
                        ? (isUr ? 'پورا پاکستان' : 'All Pakistan')
                        : ann.targetScope === 'PROVINCE'
                        ? `${ann.targetStateProvince}`
                        : `${ann.targetDistrict || ann.targetRegion}`}
                    </span>

                    {isSuperAdmin && (
                      <button
                        type="button"
                        onClick={() => deleteAnnouncement(ann.id)}
                        className="p-1.5 rounded-lg bg-[#090D16] hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-[#D4AF37]/25 kc-pressable cursor-pointer"
                        title={translate(language, 'deleteLabel')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="font-extrabold text-base text-white">{ann.title}</h3>

                <p className="text-slate-200 leading-relaxed text-xs whitespace-pre-wrap">
                  {ann.content}
                </p>

                <div className="pt-2.5 border-t border-[#D4AF37]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span>
                      {isUr ? 'از:' : 'By'} <strong className="text-white">{ann.publishedBy}</strong>
                    </span>
                    <RoleBadge role={ann.publisherRole} compact />
                  </div>

                  <div className="flex items-center gap-3 font-mono tabular-nums text-[10px]">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#F5D061]" />
                      {new Date(ann.publishedAt).toLocaleString()}
                    </span>
                    {ann.expiresAt && (
                      <span className="text-amber-300">
                        {expired ? translate(language, 'expiredOn') : translate(language, 'expiresOn')}:{' '}
                        {new Date(ann.expiresAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Publish Modal */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/80 p-3 sm:p-4 overflow-y-auto">
          <div
            className="relative w-full max-w-lg kc-luxury-modal rounded-2xl p-5 sm:p-6 my-auto max-h-[92dvh] overflow-y-auto text-xs space-y-4"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#D4AF37]/20">
              <h3 className="text-base font-bold text-white">
                {translate(language, 'publishAnnouncementBtn')}
              </h3>
              <button
                type="button"
                onClick={() => setIsPublishModalOpen(false)}
                className="p-1.5 rounded-lg bg-[#090D16] border border-[#D4AF37]/30 text-slate-300 hover:text-white kc-pressable cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePublishSubmit} className="space-y-4">
              {/* Channel Selector */}
              <div>
                <label className="font-semibold text-slate-300 block mb-1.5">
                  {isUr ? 'اعلان کا چینل' : 'Announcement Channel'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={!canPublishOfficial}
                    onClick={() => setAnnType('OFFICIAL_APP')}
                    className={`p-2.5 rounded-xl border text-left font-bold kc-pressable cursor-pointer disabled:opacity-40 ${
                      annType === 'OFFICIAL_APP'
                        ? 'border-[#F5D061] bg-[#131C31] text-[#F5D061]'
                        : 'border-slate-400/20 bg-[#090D16] text-slate-400'
                    }`}
                  >
                    {isUr ? '👑 آفیشل ایپ' : '👑 Official App'}
                    <span className="block text-[10px] font-normal text-slate-300 mt-0.5">
                      {isUr ? 'سپر ایڈمن عالمی پیغام' : 'Super Admin Global'}
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={!canPublishCommunity}
                    onClick={() => setAnnType('COMMUNITY')}
                    className={`p-2.5 rounded-xl border text-left font-bold kc-pressable cursor-pointer disabled:opacity-40 ${
                      annType === 'COMMUNITY'
                        ? 'border-[#38BDF8] bg-[#131C31] text-[#38BDF8]'
                        : 'border-slate-400/20 bg-[#090D16] text-slate-400'
                    }`}
                  >
                    {isUr ? '📢 کمیونٹی' : '📢 Community'}
                    <span className="block text-[10px] font-normal text-slate-300 mt-0.5">
                      {isUr ? 'قیادتی سرکلر' : 'Leadership Circular'}
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">
                  {isUr ? 'عنوان *' : 'Headline *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isUr ? 'مثلاً ماہانہ فلاحی اجلاس کا اعلان' : 'e.g. Monthly Welfare Assembly Notice'}
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  className="w-full px-3 py-2 kc-luxury-input rounded-xl text-xs"
                />
              </div>

              {annType === 'COMMUNITY' && (
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">
                    {isUr ? 'ہدف سامعین' : 'Target Audience'}
                  </label>
                  {isDistrictAdmin ? (
                    <div className="p-2.5 bg-[#090D16] border border-[#D4AF37]/25 rounded-xl font-medium text-emerald-300 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{currentUser.assignedDistrict || currentUser.district}</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <LuxurySelect
                        compact
                        value={annScope}
                        onChange={(val) => setAnnScope(val as 'ALL' | 'PROVINCE' | 'DISTRICT')}
                        label={isUr ? 'ہدف کا دائرہ کار' : 'Target Audience Scope'}
                        options={[
                          { value: 'ALL', label: isUr ? 'قومی نشریات (تمام اراکین)' : 'National Broadcast (All Members)' },
                          { value: 'PROVINCE', label: isUr ? 'صوبائی سطح کی نشریات' : 'Province-Level Broadcast' },
                          { value: 'DISTRICT', label: isUr ? 'ضلع کی سطح کی نشریات' : 'District-Specific Broadcast' }
                        ]}
                      />

                      {annScope !== 'ALL' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <LuxurySelect
                            compact
                            value={annProvince}
                            onChange={(newP) => {
                              setAnnProvince(newP);
                              const dists = getDistrictsForProvince(newP);
                              if (dists.length > 0) setAnnDistrict(dists[0]);
                            }}
                            label={isUr ? 'مطلوبہ صوبہ' : 'Target Province'}
                            options={PROVINCE_OPTIONS}
                          />

                          {annScope === 'DISTRICT' && (
                            <LuxurySelect
                              compact
                              searchable
                              value={annDistrict}
                              onChange={setAnnDistrict}
                              label={isUr ? 'مطلوبہ ضلع' : 'Target District'}
                              options={getDistrictsForProvince(annProvince)}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="font-semibold text-slate-300 block mb-1">
                  {isUr ? 'پیغام کی تفصیل *' : 'Message Content *'}
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder={isUr ? 'مکمل اعلان یہاں تحریر کریں...' : 'Write the full announcement message...'}
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  className="w-full p-2.5 kc-luxury-input rounded-xl text-xs resize-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">
                  {translate(language, 'expiryLabel')}
                </label>
                <input
                  type="datetime-local"
                  value={annExpiresAt}
                  onChange={(e) => setAnnExpiresAt(e.target.value)}
                  className="w-full px-3 py-2 kc-luxury-input rounded-xl font-mono text-xs"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#D4AF37]/20">
                <div className="flex items-center gap-4 text-slate-200">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={annPinned}
                      onChange={(e) => setAnnPinned(e.target.checked)}
                      className="accent-amber-500"
                    />
                    <span>{translate(language, 'pinToTop')}</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer text-rose-300 font-semibold">
                    <input
                      type="checkbox"
                      checked={annUrgency === 'URGENT'}
                      onChange={(e) => setAnnUrgency(e.target.checked ? 'URGENT' : 'NORMAL')}
                      className="accent-rose-500"
                    />
                    <span>{translate(language, 'urgentBadge')}</span>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPublishModalOpen(false)}
                    className="px-3 py-1.5 text-slate-400 hover:text-white cursor-pointer"
                  >
                    {translate(language, 'cancel')}
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-2 kc-gold-button font-extrabold rounded-xl cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isUr ? 'ابھی شائع کریں' : 'Broadcast Now'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
