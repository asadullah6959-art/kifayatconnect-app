import React from 'react';
import { useApp } from '../../context/AppContext';
import { User } from '../../types';
import { 
  X, 
  ShieldCheck, 
  Award, 
  MapPin, 
  Mail, 
  Phone, 
  Calendar, 
  MessageSquare, 
  IdCard, 
  CheckCircle2, 
  Lock,
  Building2,
  ExternalLink
} from 'lucide-react';

interface MemberProfileModalProps {
  user: User | null;
  onClose: () => void;
}

export const MemberProfileModal: React.FC<MemberProfileModalProps> = ({ user, onClose }) => {
  const { currentUser, setActiveTab, setActiveChatUser, language, setSelectedCardUser } = useApp();

  if (!user) return null;

  const isSelf = currentUser.id === user.id;
  const isPrivilegedViewer = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN' || currentUser.role === 'CO_ADMIN';
  const showContact = isSelf || isPrivilegedViewer;

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return { label: 'Super Admin', color: 'bg-amber-500/10 text-amber-500 border-amber-500/30' };
      case 'FINANCE_OFFICER':
        return { label: 'Finance Officer', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
      case 'ADMIN':
        return { label: 'District Admin', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' };
      case 'CO_ADMIN':
        return { label: 'State Co-Admin', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' };
      default:
        return { label: 'Member', color: 'bg-slate-500/10 text-slate-300 border-slate-500/30' };
    }
  };

  const roleInfo = getRoleBadge(user.role);

  const handleStartChat = () => {
    setActiveChatUser(user);
    setActiveTab('chat');
    onClose();
  };

  const handleViewDigitalCard = () => {
    setSelectedCardUser(user);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
        {/* Header Banner - Navy Blue with Gold Accent */}
        <div className="h-28 bg-gradient-to-r from-slate-950 via-slate-900 to-[#0a192f] p-4 relative border-b border-amber-500/20">
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Content */}
        <div className="px-6 pb-6 pt-0 relative">
          {/* Avatar and Badges */}
          <div className="flex items-end justify-between -mt-12 mb-4">
            <div className="relative">
              <img
                src={user.avatarUrl || user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0a192f&color=d4af37&size=128`}
                alt={user.name}
                className="w-24 h-24 rounded-2xl border-4 border-slate-900 object-cover shadow-xl bg-slate-800"
              />
              <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-slate-900 ${
                (user.membershipStatus || user.status) === 'ACTIVE' ? 'bg-emerald-500' : 'bg-amber-500'
              }`} />
            </div>

            <div className="flex flex-col items-end gap-1.5">
              <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${roleInfo.color}`}>
                {roleInfo.label}
              </span>
              <span className="text-[11px] font-mono font-medium text-amber-400">
                {user.membershipId || 'KC-PENDING'}
              </span>
            </div>
          </div>

          {/* User Details */}
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              {user.name}
              {(user.membershipStatus || user.status) === 'ACTIVE' && (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              )}
            </h2>

            {/* Organizational Office Badge if assigned */}
            {user.assignedOfficeTitle ? (
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium">
                <Award className="w-4 h-4 text-amber-400" />
                <span>{user.assignedOfficeTitle}</span>
              </div>
            ) : (
              <p className="text-xs text-slate-400 mt-0.5">
                {user.role === 'MEMBER' ? 'Verified Community Member' : 'Organizational Officer'}
              </p>
            )}
          </div>

          {/* Location & Jurisdiction Info */}
          <div className="mt-4 p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2 text-xs text-slate-300">
            <div className="flex items-center gap-2 text-slate-300">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                {[user.cityTown || user.tehsil, user.district, user.stateProvince, user.country || 'Pakistan'].filter(Boolean).join(', ')}
              </span>
            </div>

            {(user.assignedDistrict || user.assignedStateProvince) && (
              <div className="flex items-center gap-2 text-slate-400 pt-1 border-t border-slate-800">
                <Building2 className="w-4 h-4 text-blue-400 shrink-0" />
                <span>
                  Jurisdiction: <strong className="text-slate-200">{user.assignedDistrict ? `${user.assignedDistrict} District` : `${user.assignedStateProvince} Province`}</strong>
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 text-slate-400">
              <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
              <span>Joined: {user.joinDate || user.createdAt || 'Registered Member'}</span>
            </div>
          </div>

          {/* Contact Details (with Privacy Protection) */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-800/40 border border-slate-800">
              <div className="flex items-center gap-2 text-slate-300">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                {showContact ? (
                  <span className="font-mono text-slate-200">{user.email}</span>
                ) : (
                  <span className="text-slate-500 flex items-center gap-1.5 font-mono">
                    <Lock className="w-3.5 h-3.5 text-slate-500" /> {user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3')}
                  </span>
                )}
              </div>
              {!showContact && (
                <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">Protected</span>
              )}
            </div>

            <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-800/40 border border-slate-800">
              <div className="flex items-center gap-2 text-slate-300">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                {showContact ? (
                  <span className="font-mono text-slate-200">{user.phone || '+92 300 0000000'}</span>
                ) : (
                  <span className="text-slate-500 flex items-center gap-1.5 font-mono">
                    <Lock className="w-3.5 h-3.5 text-slate-500" /> +92 3** *******
                  </span>
                )}
              </div>
              {!showContact && (
                <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">Protected</span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex items-center gap-3">
            {!isSelf && (
              <button
                onClick={handleStartChat}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>{language === 'ur' ? 'پیغام بھیجیں' : 'Send Message in Chat'}</span>
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
