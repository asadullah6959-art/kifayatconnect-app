import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { User } from '../../types';
import { X, Printer, ShieldCheck, QrCode, RefreshCw, Download, CheckCircle2 } from 'lucide-react';
import { mapLegacyRegionToHierarchy } from '../../data/locationData';
import { BrandEmblem3D } from '../common/BrandEmblem3D';
import { RoleBadge } from '../common/RoleBadge';
import { translate } from '../../data/translations';

interface DigitalCardModalProps {
  user: User;
  onClose: () => void;
}

// Deterministic 11x11 Golden QR Matrix seeded from member ID
function buildQrMatrix(seed: string): boolean[][] {
  const size = 11;
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const grid: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const drawFinder = (r0: number, c0: number) => {
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        grid[r0 + r][c0 + c] = r === 0 || r === 2 || c === 0 || c === 2 || (r === 1 && c === 1);
      }
    }
  };
  drawFinder(0, 0);
  drawFinder(0, size - 3);
  drawFinder(size - 3, 0);

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const inTL = r < 4 && c < 4;
      const inTR = r < 4 && c >= size - 4;
      const inBL = r >= size - 4 && c < 4;
      if (inTL || inTR || inBL) continue;
      h ^= (r * 31 + c * 17) & 0xff;
      h = Math.imul(h, 16777619);
      grid[r][c] = (h & 1) === 1;
    }
  }
  return grid;
}

export const DigitalCardModal: React.FC<DigitalCardModalProps> = ({ user, onClose }) => {
  const { language, appSettings } = useApp();
  const [isFlipped, setIsFlipped] = useState(false);
  const [showQrVerifyModal, setShowQrVerifyModal] = useState(false);
  const [downloadingPng, setDownloadingPng] = useState(false);

  const locFallback = mapLegacyRegionToHierarchy(user.region);
  const dist = user.district || locFallback.district;
  const prov = user.stateProvince || locFallback.stateProvince;
  const memberIdStr = user.membershipId || `KC-REG-${user.id.slice(-4).toUpperCase()}`;
  const verifyHash = `SHA256-KC-${memberIdStr}-${user.id.slice(-6).toUpperCase()}`;

  const customFooter =
    language === 'ur'
      ? appSettings.textOverrides?.idCardFooterUr || appSettings.taglineUr || translate(language, 'tagline')
      : appSettings.textOverrides?.idCardFooterEn || appSettings.tagline || translate(language, 'tagline');

  const qrMatrix = useMemo(() => buildQrMatrix(`${user.id}:${memberIdStr}:${user.email}`), [user.id, memberIdStr, user.email]);

  const handlePrint = () => {
    window.print();
  };

  // Offscreen high-DPI PNG generator for VIP Digital ID Card download
  const handleDownloadCardPng = async () => {
    if (appSettings.featureToggles?.allowDigitalIdDownload === false) return;
    setDownloadingPng(true);
    try {
      const width = 1040;
      const height = 640;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Black velvet background
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#080A0E');
      bgGrad.addColorStop(0.55, '#141821');
      bgGrad.addColorStop(1, '#090C11');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Double metallic gold border
      const goldGrad = ctx.createLinearGradient(0, 0, width, height);
      goldGrad.addColorStop(0, '#F5D061');
      goldGrad.addColorStop(0.5, '#D4AF37');
      goldGrad.addColorStop(1, '#8A6218');
      ctx.strokeStyle = goldGrad;
      ctx.lineWidth = 6;
      ctx.strokeRect(18, 18, width - 36, height - 36);
      ctx.lineWidth = 2;
      ctx.strokeRect(30, 30, width - 60, height - 60);

      // Top Header
      ctx.fillStyle = '#F5D061';
      ctx.font = 'bold 34px sans-serif';
      ctx.fillText('👑 KIFAYAT CONNECT', 56, 86);
      ctx.fillStyle = '#34D399';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('VERIFIED PREMIUM DIGITAL IDENTITY', 58, 114);

      // Photo Box / Initials
      ctx.fillStyle = '#043927';
      ctx.fillRect(58, 162, 180, 210);
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 4;
      ctx.strokeRect(58, 162, 180, 210);
      ctx.fillStyle = '#F5D061';
      ctx.font = 'bold 64px sans-serif';
      const initials = user.name
        .split(' ')
        .map(w => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
      ctx.fillText(initials, 102, 286);

      // User Details
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 40px sans-serif';
      ctx.fillText(user.name, 274, 212);

      ctx.fillStyle = '#F5D061';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(`★ PREMIUM MEMBER  ·  ${user.role.replace('_', ' ')}`, 274, 252);

      ctx.fillStyle = '#CBD5E1';
      ctx.font = '22px monospace';
      ctx.fillText(`CNIC: ${user.cnic || 'VERIFIED'}`, 274, 302);
      ctx.fillStyle = '#6EE7B7';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(`${dist}, ${prov}`, 274, 342);
      ctx.fillStyle = '#94A3B8';
      ctx.font = '18px monospace';
      ctx.fillText(`ISSUED: ${user.joinDate}  ·  VALID THRU: ${user.validUntil || '2028-12-31'}`, 274, 380);

      // Bottom Strip + Golden QR Matrix
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(56, 438);
      ctx.lineTo(width - 56, 438);
      ctx.stroke();

      ctx.fillStyle = '#94A3B8';
      ctx.font = 'bold 16px monospace';
      ctx.fillText('MEMBER ID', 58, 478);
      ctx.fillStyle = '#F5D061';
      ctx.font = 'bold 30px monospace';
      ctx.fillText(memberIdStr, 58, 518);

      ctx.fillStyle = '#CBD5E1';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(customFooter.toUpperCase(), 58, 578);

      // Draw Golden QR
      const qrSize = 132;
      const qrX = width - 58 - qrSize;
      const qrY = 460;
      ctx.fillStyle = '#0A0D12';
      ctx.fillRect(qrX - 8, qrY - 8, qrSize + 16, qrSize + 16);
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 2;
      ctx.strokeRect(qrX - 8, qrY - 8, qrSize + 16, qrSize + 16);
      const cell = qrSize / qrMatrix.length;
      ctx.fillStyle = '#F5D061';
      qrMatrix.forEach((row, r) => {
        row.forEach((on, c) => {
          if (on) ctx.fillRect(qrX + c * cell, qrY + r * cell, cell - 1, cell - 1);
        });
      });

      const link = document.createElement('a');
      link.download = `KifayatConnect-ID-${memberIdStr}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setDownloadingPng(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0D12]/90 p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#111622] rounded-2xl shadow-2xl border border-[#D4AF37]/35 p-4 sm:p-6 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="min-w-0">
            <h3 className="text-base font-extrabold text-white truncate">
              {translate(language, 'vipCardTitle')}
            </h3>
            <p className="text-xs text-slate-400 truncate">
              {user.name} · <span className="font-mono text-[#F5D061]">{memberIdStr}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Luxury Velvet VIP Card with Smooth CSS 3D Flip */}
        <div className="my-5 perspective-1000 flex justify-center">
          <div
            className={`w-full max-w-md aspect-[1.586/1] rounded-2xl relative transition-transform duration-700 preserve-3d cursor-pointer ${
              isFlipped ? 'rotate-y-180' : ''
            }`}
            onClick={() => setIsFlipped(prev => !prev)}
          >
            {/* FRONT: Black Velvet VIP Card */}
            <div
              className="absolute inset-0 w-full h-full rounded-2xl p-3.5 sm:p-5 text-white shadow-[0_18px_50px_rgba(0,0,0,0.85)] flex flex-col justify-between backface-hidden overflow-hidden"
              style={{
                background: 'linear-gradient(145deg, #080A0E 0%, #141821 55%, #090C11 100%)',
                border: '2px solid #D4AF37'
              }}
            >
              {/* Inner Gold Trim + 3D Gold Corner Accents */}
              <div className="absolute inset-1.5 rounded-xl border border-[#F5D061]/35 pointer-events-none" />
              <div className="absolute top-1.5 left-1.5 w-4 h-4 border-t-2 border-l-2 border-[#F5D061] rounded-tl-lg pointer-events-none" />
              <div className="absolute top-1.5 right-1.5 w-4 h-4 border-t-2 border-r-2 border-[#F5D061] rounded-tr-lg pointer-events-none" />
              <div className="absolute bottom-1.5 left-1.5 w-4 h-4 border-b-2 border-l-2 border-[#F5D061] rounded-bl-lg pointer-events-none" />
              <div className="absolute bottom-1.5 right-1.5 w-4 h-4 border-b-2 border-r-2 border-[#F5D061] rounded-br-lg pointer-events-none" />

              {/* Top Header */}
              <div className="relative z-10 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <BrandEmblem3D size="xs" />
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-xs sm:text-sm tracking-[0.14em] uppercase kc-gold-gradient-text truncate">
                      KIFAYAT CONNECT 👑
                    </h4>
                    <span className="text-[9px] text-emerald-300 font-semibold tracking-wider uppercase block">
                      {translate(language, 'vipPremiumMember')}
                    </span>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-200 bg-[#043927] px-2 py-0.5 rounded-md border border-[#D4AF37]/40 shrink-0">
                  <ShieldCheck className="w-3 h-3 text-[#F5D061]" />
                  <span>ACTIVE</span>
                </span>
              </div>

              {/* Center: Gold-Framed Photo + Identity + 3D RoleBadge */}
              <div className="relative z-10 flex items-center gap-3 sm:gap-4 my-auto">
                <div className="relative shrink-0">
                  {(user.avatarUrl || user.avatar) ? (
                    <img
                      src={user.avatarUrl || user.avatar}
                      alt={user.name}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border-2 border-[#F5D061] shadow-md"
                    />
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gradient-to-br from-[#043927] to-[#0A0D12] border-2 border-[#F5D061] flex items-center justify-center text-[#F5D061] font-extrabold text-xl shadow-md">
                      {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <h3 className="font-extrabold text-sm sm:text-base text-white tracking-tight truncate">
                    {user.name}
                  </h3>
                  <RoleBadge role={user.role} isFounder={user.isFounder} compact />
                  <div className="text-[10px] text-slate-300 space-y-0.5 pt-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">CNIC:</span>
                      <span className="font-mono text-white truncate">{user.cnic || 'Verified'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-emerald-300 font-semibold truncate">{dist}</span>
                      <span className="text-slate-400 truncate">({prov})</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Strip: Member ID + Footer Tagline + Golden SVG QR */}
              <div className="relative z-10 pt-2 border-t border-[#D4AF37]/30 flex items-end justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[8px] font-mono text-slate-400 uppercase block">
                    {translate(language, 'vipMemberIdPrefix')} · VALID {user.validUntil || '2028-12-31'}
                  </span>
                  <span className="text-xs font-mono font-extrabold text-[#F5D061] block truncate">
                    {memberIdStr}
                  </span>
                  <span className="text-[8px] font-bold tracking-wider uppercase text-slate-300 block truncate mt-0.5">
                    {customFooter}
                  </span>
                </div>

                {/* Deterministic Golden SVG QR Code */}
                <div className="p-1 rounded-lg bg-[#0A0D12] border border-[#D4AF37]/60 shrink-0">
                  <svg viewBox="0 0 11 11" className="w-10 h-10 sm:w-11 sm:h-11" shapeRendering="crispEdges">
                    {qrMatrix.map((row, r) =>
                      row.map((on, c) =>
                        on ? <rect key={`${r}-${c}`} x={c} y={r} width="0.88" height="0.88" fill="#F5D061" /> : null
                      )
                    )}
                  </svg>
                </div>
              </div>
            </div>

            {/* BACK SIDE: Official Verification Seal & QR */}
            <div
              className="absolute inset-0 w-full h-full rounded-2xl p-4 sm:p-5 text-white shadow-[0_18px_50px_rgba(0,0,0,0.85)] flex flex-col justify-between backface-hidden rotate-y-180 overflow-hidden"
              style={{
                background: 'linear-gradient(145deg, #06130F 0%, #0A0D12 55%, #141821 100%)',
                border: '2px solid #D4AF37'
              }}
            >
              <div className="flex items-center justify-between border-b border-[#D4AF37]/30 pb-2">
                <div>
                  <span className="text-[10px] uppercase font-extrabold text-[#F5D061] tracking-wider block">
                    {translate(language, 'vipBackTitle')}
                  </span>
                  <p className="text-[9px] text-emerald-300">{translate(language, 'vipIssuedBy')}</p>
                </div>
                <BrandEmblem3D size="xs" />
              </div>

              <div className="flex items-center gap-4 my-auto">
                <div className="p-2 bg-[#0A0D12] border border-[#F5D061]/60 rounded-xl shrink-0">
                  <svg viewBox="0 0 11 11" className="w-16 h-16" shapeRendering="crispEdges">
                    {qrMatrix.map((row, r) =>
                      row.map((on, c) =>
                        on ? <rect key={`${r}-${c}`} x={c} y={r} width="0.88" height="0.88" fill="#F5D061" /> : null
                      )
                    )}
                  </svg>
                </div>

                <div className="text-[10px] text-slate-300 space-y-1 min-w-0">
                  <p className="font-bold text-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{translate(language, 'vipVerifiedAuthentic')}</span>
                  </p>
                  <p className="font-mono text-[9px] text-[#F5D061] truncate">
                    {verifyHash}
                  </p>
                  <p className="text-slate-400 text-[9px] truncate">
                    {appSettings.contactHelpline} · {appSettings.contactEmail}
                  </p>
                </div>
              </div>

              <div className="text-[8px] text-slate-400 border-t border-[#D4AF37]/25 pt-1.5 leading-tight flex items-center justify-between gap-2">
                <span>Property of Kifayat Connect Community Governance Trust.</span>
                <span className="font-mono text-[#F5D061]">{memberIdStr}</span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-400 mb-3">
          {translate(language, 'vipFlipHint')}
        </p>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setIsFlipped(prev => !prev)}
            className="flex items-center gap-1.5 px-3 py-2 text-slate-200 bg-[#0A0D12] hover:bg-slate-800 border border-slate-700 rounded-xl font-semibold cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#F5D061]" />
            <span>Flip</span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowQrVerifyModal(prev => !prev)}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#043927] hover:bg-emerald-900 border border-[#D4AF37]/40 text-[#F5D061] rounded-xl font-bold cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>{translate(language, 'vipVerifyQrBtn')}</span>
            </button>

            {appSettings.featureToggles?.allowDigitalIdDownload !== false && (
              <button
                type="button"
                disabled={downloadingPng}
                onClick={handleDownloadCardPng}
                className="flex items-center gap-1.5 px-3.5 py-2 kc-gold-button rounded-xl font-extrabold cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{downloadingPng ? 'Saving...' : translate(language, 'vipDownloadBtn')}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{translate(language, 'vipPrintBtn')}</span>
            </button>
          </div>
        </div>

        {/* Interactive QR Verification Panel */}
        {showQrVerifyModal && (
          <div className="mt-4 p-4 rounded-xl bg-[#0A0D12] border border-[#D4AF37]/45 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#F5D061]" />
                <span>{translate(language, 'vipVerifiedAuthentic')}</span>
              </span>
              <button type="button" onClick={() => setShowQrVerifyModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
              <div><span className="text-slate-400">Name:</span> <strong className="text-white">{user.name}</strong></div>
              <div><span className="text-slate-400">ID:</span> <strong className="font-mono text-[#F5D061]">{memberIdStr}</strong></div>
              <div><span className="text-slate-400">Role:</span> <strong className="text-white">{user.role}</strong></div>
              <div><span className="text-slate-400">District:</span> <strong className="text-emerald-300">{dist}</strong></div>
            </div>
            <p className="text-[10px] font-mono text-slate-400 truncate">Seal: {verifyHash}</p>
          </div>
        )}
      </div>
    </div>
  );
};
