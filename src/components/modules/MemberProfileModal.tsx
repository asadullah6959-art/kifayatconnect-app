import React from 'react';
import { useApp } from '../../context/AppContext';
import { User } from '../../types';
import {
  X,
  Award,
  MapPin,
  Mail,
  Phone,
  Calendar,
  MessageSquare,
  IdCard,
  CheckCircle2,
  Lock,
  Building2
} from 'lucide-react';
import { RoleBadge } from '../common/RoleBadge';

interface MemberProfileModalProps {
  user: User | null;
  onClose: () => void;
}

export const MemberProfileModal: React.FC<MemberProfileModalProps> = ({ user, onClose }) => {
  const { currentUser, openPersonalMessage, language, setSelectedCardUser } = useApp();

  if (!user || !currentUser) return null;

  const isSelf = currentUser.id === user.id;
  const isUserOnline = isSelf || (user.isOnline !== undefined ? Boolean(user.isOnline) : user.status === 'online');
  const isPrivilegedViewer =
    currentUser.role === 'SUPER_ADMIN' ||
    currentUser.role === 'ADMIN' ||
    currentUser.role === 'CO_ADMIN' ||
    Boolean(currentUser.isAuditOfficer);
  const showContact = isSelf || isPrivilegedViewer;

  const handleStartChat = () => {
    openPersonalMessage(user);
    onClose();
  };

  const handleViewDigitalCard = () => {
    setSelectedCardUser(user);
    onClose();
  };

  const avatarSrc = user.avatarUrl || user.photoUrl || user.avatar;

  return (
    <div className="fixed inset-0 z-[10000] bg-slate-950/85 flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-y-auto relative my-auto max-h-[92dvh]"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="h-24 bg-[#0a192f] p-4 relative border-b border-amber-500/20">
          <div className="absolute top-0 right-0 left-0 h-1 bg-amber-500" />
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 sm:px-6 pb-6 pt-0 relative">
          <div className="flex items-end justify-between -mt-12 mb-4 gap-3">
            <div className="relative">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={user.name}
                  className="w-24 h-24 rounded-2xl border-4 border-slate-900 object-cover shadow-xl bg-slate-800"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl border-4 border-slate-900 bg-[#0a192f] text-amber-400 flex items-center justify-center font-bold text-3xl shadow-xl">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span
                className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-slate-900 ${
                  isUserOnline ? 'bg-emerald-500' : 'bg-slate-500'
                }`}
              />
            </div>

            <div className="flex flex-col items-end gap-1.5">
              <RoleBadge role={user.role} isFounder={Boolean(user.isFounder)} isAuditOfficer={Boolean(user.isAuditOfficer)} />
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isUserOnline
                      ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {isUserOnline ? '🟢 Online' : '⚫ Offline'}
                </span>
                <span className="text-[11px] font-mono font-medium text-amber-400">
                  {user.membershipId || 'KC-PENDING'}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="truncate">{user.name}</span>
              {(user.membershipStatus || user.status) === 'ACTIVE' && (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
            </h2>

            {user.assignedOfficeTitle ? (
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium">
                <Award className="w-4 h-4 text-amber-400" />
                <span>{user.assignedOfficeTitle}</span>
              </div>
            ) : (
              <p className="text-xs text-slate-400 mt-0.5">
                {user.bio || (user.role === 'MEMBER' ? 'Verified Community Member' : 'Organizational Officer')}
              </p>
            )}
          </div>

          <div className="mt-4 p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2 text-xs text-slate-300">
            <div className="flex items-center gap-2 text-slate-300">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                {[user.customCity || user.cityTown || user.tehsil, user.district, user.stateProvince, user.country || 'Pakistan']
                  .filter(Boolean)
                  .join(', ')}
              </span>
            </div>

            {(user.assignedDistrict || user.assignedStateProvince) && (
              <div className="flex items-center gap-2 text-slate-400 pt-1 border-t border-slate-800">
                <Building2 className="w-4 h-4 text-blue-400 shrink-0" />
                <span>
                  Jurisdiction:{' '}
                  <strong className="text-slate-200">
                    {user.assignedDistrict ? `${user.assignedDistrict} District` : `${user.assignedStateProvince} Province`}
                  </strong>
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 text-slate-400">
              <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
              <span>Joined: {user.joinDate || user.createdAt || 'Registered Member'}</span>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-800/40 border border-slate-800">
              <div className="flex items-center gap-2 text-slate-300 min-w-0">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                {showContact ? (
                  <span className="font-mono text-slate-200 truncate">{user.email}</span>
                ) : (
                  <span className="text-slate-500 flex items-center gap-1.5 font-mono truncate">
                    <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />{' '}
                    {user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3')}
                  </span>
                )}
              </div>
              {!showContact && (
                <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded shrink-0">Protected</span>
              )}
            </div>

            <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-800/40 border border-slate-800">
              <div className="flex items-center gap-2 text-slate-300 min-w-0">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                {showContact ? (
                  <span className="font-mono text-slate-200">{user.phone || 'Not provided'}</span>
                ) : (
                  <span className="text-slate-500 flex items-center gap-1.5 font-mono">
                    <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" /> +92 3** *******
                  </span>
                )}
              </div>
              {!showContact && (
                <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded shrink-0">Protected</span>
              )}
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            {!isSelf && (
              <button
                type="button"
                onClick={handleStartChat}
                className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-colors cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>{language === 'ur' ? 'ذاتی پیغام (💬)' : 'Personal Message'}</span>
              </button>
            )}

            <button
              onClick={handleViewDigitalCard}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors cursor-pointer"
            >
              <IdCard className="w-4 h-4 text-amber-400" />
              <span>{language === 'ur' ? 'شناختی کارڈ' : 'Digital Card'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
