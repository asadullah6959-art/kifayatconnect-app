import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { User } from '../../types';
import { X, Printer, ShieldCheck, QrCode, RefreshCw } from 'lucide-react';
import { mapLegacyRegionToHierarchy } from '../../data/locationData';

interface DigitalCardModalProps {
  user: User;
  onClose: () => void;
}

export const DigitalCardModal: React.FC<DigitalCardModalProps> = ({ user, onClose }) => {
  const { language } = useApp();
  const [isFlipped, setIsFlipped] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const locFallback = mapLegacyRegionToHierarchy(user.region);
  const dist = user.district || locFallback.district;
  const prov = user.stateProvince || locFallback.stateProvince;
  const teh = user.tehsil || locFallback.tehsil;
  const uc = user.unionCouncil || locFallback.unionCouncil;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
              {language === 'ur' ? 'ڈیجیٹل ممبرشپ کارڈ' : 'Official Digital Membership Card'}
            </h3>
            <p className="text-xs text-slate-500 truncate">
              Verified credentials for {user.name} ({user.membershipId || 'KC-PENDING'})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Card Container with 3D Flip */}
        <div className="my-5 perspective-1000 flex justify-center">
          <div 
            ref={cardRef}
            className={`w-full max-w-md aspect-[1.586/1] rounded-2xl relative transition-transform duration-700 transform-style-3d cursor-pointer ${
              isFlipped ? 'rotate-y-180' : ''
            }`}
            onClick={() => setIsFlipped(!isFlipped)}
          >
            {/* FRONT SIDE */}
            <div className={`absolute inset-0 w-full h-full rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-[#0a192f] via-slate-900 to-[#0f294a] text-white shadow-xl border border-amber-400/40 flex flex-col justify-between backface-hidden ${
              isFlipped ? 'invisible' : 'visible'
            }`}>
              {/* Background decorative watermark */}
              <div 
                className="absolute right-4 bottom-4 w-32 h-32 opacity-10 pointer-events-none rounded-full bg-cover"
                style={{ backgroundImage: `url('/src/assets/images/kifayat_emblem_logo_1794225902501.jpg')` }}
              />

              {/* Card Top Row */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img 
                    src="/src/assets/images/kifayat_emblem_logo_1794225902501.jpg" 
                    alt="Emblem" 
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg object-cover border border-amber-400/50 shadow-xs shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs sm:text-sm tracking-wide text-amber-300 uppercase truncate">
                      Kifayat Connect
                    </h4>
                    <span className="text-[10px] text-slate-300 block">Welfare Organization</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-300 bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-500/40">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    Verified Active
                  </span>
                  <span className="text-[9px] text-amber-300 block font-mono mt-0.5 font-semibold">
                    {user.membershipId || 'KC-PENDING'}
                  </span>
                </div>
              </div>

              {/* Card Center: Photo and Member Details */}
              <div className="flex items-center gap-3.5 sm:gap-4 my-auto">
                <div className="relative shrink-0">
                  {(user.avatarUrl || user.avatar) ? (
                    <img 
                      src={user.avatarUrl || user.avatar} 
                      alt={user.name} 
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border-2 border-amber-400/60 shadow-md"
                    />
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-amber-500/15 border-2 border-amber-400/60 flex items-center justify-center text-amber-300 font-bold text-xl shadow-md">
                      {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-[8px] font-bold text-white px-1.5 py-0.5 rounded-full shadow-xs">
                    ACTIVE
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base text-white tracking-tight truncate">
                    {user.name}
                  </h3>
                  <div className="space-y-0.5 mt-1 text-[11px] text-slate-300">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-[10px]">CNIC:</span>
                      <span className="font-mono text-slate-200">{user.cnic}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 text-[10px]">District:</span>
                      <span className="text-emerald-300 font-semibold truncate">{dist}</span>
                      <span className="text-slate-400 text-[10px]">({prov})</span>
                    </div>
                    {teh && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 text-[9px]">Tehsil/UC:</span>
                        <span className="text-slate-200 text-[9px] truncate">{teh}{uc ? ` · ${uc}` : ''}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-[10px]">Issued:</span>
                      <span className="font-mono text-slate-300">{user.joinDate}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Bottom Row: Security strip & Expiry */}
              <div className="pt-2 border-t border-amber-500/20 flex items-center justify-between text-[10px] text-slate-400">
                <div className="flex items-center gap-2 font-mono">
                  <span>VALID THRU:</span>
                  <span className="text-amber-300 font-semibold">{user.validUntil || '2027-12-31'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300 text-[9px]">
                  <span>Click to flip</span>
                  <RefreshCw className="w-2.5 h-2.5 text-amber-400" />
                </div>
              </div>
            </div>

            {/* BACK SIDE */}
            <div className={`absolute inset-0 w-full h-full rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-slate-950 via-[#0a192f] to-slate-900 text-white shadow-xl border border-amber-400/40 flex flex-col justify-between backface-hidden ${
              !isFlipped ? 'invisible' : 'visible'
            }`}>
              {/* Back Top */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                    Member Authentication Strip
                  </span>
                  <p className="text-[9px] text-slate-400">Kifayat Connect Welfare Trust Pakistan</p>
                </div>
                <QrCode className="w-6 h-6 text-amber-400" />
              </div>

              {/* QR and Verification Hash */}
              <div className="flex items-center gap-4 my-2">
                {/* Simulated high density QR */}
                <div className="p-1.5 bg-white rounded-lg shrink-0 shadow-xs">
                  <div className="w-16 h-16 bg-slate-900 p-1 flex flex-col justify-between">
                    <div className="flex justify-between">
                      <div className="w-3 h-3 bg-white border border-slate-900" />
                      <div className="w-3 h-3 bg-white border border-slate-900" />
                    </div>
                    <div className="flex justify-center">
                      <div className="w-4 h-4 bg-amber-400 rounded-xs" />
                    </div>
                    <div className="flex justify-between">
                      <div className="w-3 h-3 bg-white border border-slate-900" />
                      <div className="w-2 h-2 bg-white" />
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-slate-300 space-y-1">
                  <p className="text-slate-400 leading-snug">
                    Scan to verify authenticated membership ledger and monthly contribution status.
                  </p>
                  <p className="font-mono text-[9px] text-amber-300 truncate">
                    HASH: SHA256-KC-{user.id.toUpperCase()}-VERIFIED
                  </p>
                  <p className="text-slate-400 text-[9px]">
                    Helpline: 0800-KIFAYAT · info@kifayatconnect.org
                  </p>
                </div>
              </div>

              {/* Terms & Conditions */}
              <div className="text-[8px] text-slate-400 border-t border-slate-800/80 pt-1.5 leading-tight">
                This digital card is the property of Kifayat Connect. Authorized for identification at district medical camps, subsidized ration drives, and general assemblies.
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <button
            onClick={() => setIsFlipped(!isFlipped)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors font-medium"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Flip Card ({isFlipped ? 'View Front' : 'View Back'})</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-medium transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
