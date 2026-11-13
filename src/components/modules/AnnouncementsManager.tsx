import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Megaphone,
  Send,
  Plus,
  Pin,
  MapPin,
  MailCheck
} from 'lucide-react';
import {
  PROVINCE_OPTIONS,
  getDistrictsForProvince,
  mapLegacyRegionToHierarchy
} from '../../data/locationData';

export const AnnouncementsManager: React.FC = () => {
  const {
    currentUser,
    announcements,
    publishAnnouncement
  } = useApp();

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const isDistrictAdmin = currentUser?.role === 'ADMIN';
  const isCoAdmin = currentUser?.role === 'CO_ADMIN';
  const canPublish = isSuperAdmin || isDistrictAdmin || isCoAdmin;

  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
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

  if (!currentUser) return null;

  const visibleAnnouncements = announcements.filter(ann => {
    if (isSuperAdmin) return true;
    if (ann.targetScope === 'ALL' || ann.targetRegion === 'ALL_REGIONS') return true;

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

  const handlePublishSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;

    const targetScope = isDistrictAdmin ? 'DISTRICT' : isCoAdmin ? 'PROVINCE' : annScope;
    const targetStateProvince =
      isDistrictAdmin || isCoAdmin
        ? (currentUser.assignedStateProvince || currentUser.stateProvince)
        : (annScope !== 'ALL' ? annProvince : undefined);
    const targetDistrict = isDistrictAdmin
      ? (currentUser.assignedDistrict || currentUser.district)
      : (annScope === 'DISTRICT' ? annDistrict : undefined);

    publishAnnouncement({
      title: annTitle.trim(),
      content: annContent.trim(),
      targetScope,
      targetStateProvince,
      targetDistrict,
      urgency: annUrgency,
      isPinned: annPinned
    });

    setIsPublishModalOpen(false);
    setAnnTitle('');
    setAnnContent('');
    setAnnPinned(false);
  };

  return (
    <div className="space-y-5 max-w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Elaanat & Circulars
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-amber-500 shrink-0" />
            <span>Announcements (Elaanat)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {canPublish
              ? 'Published announcements automatically send notification alerts and direct inbox messages to targeted members.'
              : 'Official organizational broadcasts, welfare drives, and leadership circulars.'}
          </p>
        </div>

        {canPublish && (
          <button
            onClick={() => setIsPublishModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg shadow-xs transition-colors self-start md:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Publish Elaan</span>
          </button>
        )}
      </div>

      {canPublish && (
        <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-center gap-2.5 text-xs text-amber-900 dark:text-amber-200">
          <MailCheck className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Auto-Broadcast Active: Every published Elaan is simultaneously sent to members&apos; Chat Inboxes and Notification Alerts.</span>
        </div>
      )}

      <div className="space-y-4">
        {visibleAnnouncements.length === 0 ? (
          <div className="p-10 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
            No announcements published yet.
          </div>
        ) : (
          visibleAnnouncements.map(ann => (
            <div
              key={ann.id}
              className={`p-4 sm:p-5 rounded-xl border shadow-2xs text-xs space-y-2.5 ${
                ann.urgency === 'URGENT'
                  ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {ann.isPinned && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                      <Pin className="w-3 h-3" />
                      PINNED
                    </span>
                  )}
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">{ann.title}</h3>
                  {ann.urgency === 'URGENT' && (
                    <span className="text-[10px] font-bold text-rose-600 uppercase px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950">
                      Urgent
                    </span>
                  )}
                </div>

                <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded text-emerald-700 dark:text-emerald-300 self-start sm:self-auto">
                  <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                  {ann.targetScope === 'ALL' || ann.targetRegion === 'ALL_REGIONS'
                    ? 'All Pakistan'
                    : ann.targetScope === 'PROVINCE'
                    ? `${ann.targetStateProvince}`
                    : `${ann.targetDistrict || ann.targetRegion}`}
                </span>
              </div>

              <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-xs whitespace-pre-wrap">
                {ann.content}
              </p>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span>
                  Published by: <strong className="text-slate-700 dark:text-slate-300">{ann.publishedBy}</strong>
                </span>
                <span className="font-mono">{new Date(ann.publishedAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {isPublishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 my-6 text-xs">
            <h3 className="text-base font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
              Publish Official Elaan & Inbox Broadcast
            </h3>

            <form onSubmit={handlePublishSubmit} className="mt-4 space-y-4">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Headline
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Monthly Welfare Assembly Notice"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Target Audience
                </label>
                {isDistrictAdmin ? (
                  <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{currentUser.assignedDistrict || currentUser.district}</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <select
                      value={annScope}
                      onChange={(e) => setAnnScope(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
                    >
                      <option value="ALL">National Broadcast (All Members)</option>
                      <option value="PROVINCE">Province-Level Broadcast</option>
                      <option value="DISTRICT">District-Specific Broadcast</option>
                    </select>

                    {annScope !== 'ALL' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <select
                          value={annProvince}
                          onChange={(e) => {
                            const newP = e.target.value;
                            setAnnProvince(newP);
                            const dists = getDistrictsForProvince(newP);
                            if (dists.length > 0) setAnnDistrict(dists[0]);
                          }}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs"
                        >
                          {PROVINCE_OPTIONS.map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>

                        {annScope === 'DISTRICT' && (
                          <select
                            value={annDistrict}
                            onChange={(e) => setAnnDistrict(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs"
                          >
                            {getDistrictsForProvince(annProvince).map(d => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Message Content
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Write the full announcement message..."
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs resize-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={annPinned}
                      onChange={(e) => setAnnPinned(e.target.checked)}
                      className="rounded text-amber-500"
                    />
                    <span>Pin to top</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer text-rose-600 font-medium">
                    <input
                      type="checkbox"
                      checked={annUrgency === 'URGENT'}
                      onChange={(e) => setAnnUrgency(e.target.checked ? 'URGENT' : 'NORMAL')}
                      className="rounded text-rose-600"
                    />
                    <span>Urgent</span>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPublishModalOpen(false)}
                    className="px-3 py-1.5 text-slate-500 hover:text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Broadcast Now</span>
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
