import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import {
  MessageSquare,
  Send,
  Search,
  Paperclip,
  Image as ImageIcon,
  FileText,
  Shield,
  User as UserIcon,
  Check,
  CheckCheck,
  Clock,
  X,
  MapPin,
  WifiOff,
  ArrowLeft,
  Globe,
  Mic,
  Square,
  Play,
  Pause,
  Reply,
  Pin,
  Sparkles,
  Trash2,
  VolumeX,
  Volume2,
  Palette,
  Crown,
  Smile,
  Upload,
  Minus,
  AudioLines,
  MoreVertical,
  Lock,
  Unlock,
  Users,
  UserX,
  ChevronRight,
  CheckCircle2,
  ArrowDown,
  Copy,
  Forward,
  Camera
} from 'lucide-react';
import { isFounderIdentity, isChatModerator } from '../../utils/permissions';
import { useSpeechDictation, appendDictatedText } from '../../hooks/useSpeechDictation';
import {
  compressImageFile,
  isGifFile,
  MAX_GALLERY_FILE_BYTES,
  readFileAsDataUrlWithLimit
} from '../../utils/imageCompression';
import { uploadMediaToFirebaseStorage, isUserActuallyOnline } from '../../services/firebase';
import { RoleBadge } from '../common/RoleBadge';
import { BrandEmblem3D } from '../common/BrandEmblem3D';
import { TabbarBadge, FaizKhelVipCrownIcon } from '../common/TabbarBadge';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { ProfileCompletionGate, needsProfileCompletion } from '../common/ProfileCompletionGate';
import { translate, AppLanguage } from '../../data/translations';
import { resolveUserTabbar } from '../../data/tabbars';
import { isFaizKhelUser } from '../../utils/dastoor';
import {
  ChatMessage,
  ChatReplySnapshot,
  ChatVoiceNote,
  CommunityScenicThemeId,
  User,
  UserRole
} from '../../types';
import { ScenicChatBackground, SCENIC_THEME_PRESETS } from './chat/ScenicChatBackground';
import { IslamicGifCard, ISLAMIC_GIFS } from './chat/IslamicGifCard';

const FOUNDER_EMAIL = 'asadullah6959@gmail.com';
const MAX_VOICE_SECONDS = 60;
const PLAYBACK_SPEEDS = [1, 1.5, 2] as const;
const QUICK_REACTIONS = ['❤️', '👍', '🤲', '✨'];
const QUICK_EMOJIS = ['❤️', '👍', '🤲', '✨', '👑', '🕌', '🇵🇰', '😊'];

function getRoleHierarchyRank(role?: UserRole, isFounder?: boolean): number {
  if (isFounder) return 5;
  if (role === 'SUPER_ADMIN') return 4;
  if (role === 'ADMIN') return 3;
  if (role === 'CO_ADMIN') return 2;
  return 1;
}

function renderDeletedPlaceholderText(msg: ChatMessage, language: AppLanguage): string {
  if (msg.deletedByFounder) {
    return language === 'ur'
      ? '🚫 یہ پیغام بانی (Founder) نے حذف کر دیا'
      : '🚫 This message was deleted by Founder';
  }
  if (msg.deletedByRole === 'SUPER_ADMIN') {
    return language === 'ur'
      ? '🚫 یہ پیغام سپر ایڈمن نے حذف کر دیا'
      : '🚫 This message was deleted by Super Admin';
  }
  if (msg.deletedByRole === 'ADMIN') {
    return language === 'ur'
      ? '🚫 یہ پیغام ایڈمن نے حذف کر دیا'
      : '🚫 This message was deleted by Admin';
  }
  if (msg.deletedByRole === 'CO_ADMIN') {
    return language === 'ur'
      ? '🚫 یہ پیغام کو-ایڈمن نے حذف کر دیا'
      : '🚫 This message was deleted by Co-Admin';
  }
  return language === 'ur'
    ? '🚫 یہ پیغام حذف کر دیا گیا'
    : '🚫 This message was deleted';
}

const LINK_OR_PHONE_REGEX = /(https?:\/\/[^\s<]+|www\.[^\s<]+|(?:\+92|0092|03)\d{2}[\s-]?\d{7})/gi;

function renderLinkedText(text: string): React.ReactNode {
  if (!text) return null;
  const parts = text.split(LINK_OR_PHONE_REGEX);
  if (parts.length <= 1) return text;
  return parts.map((part, idx) => {
    if (!part) return null;
    if (/^(https?:\/\/|www\.)/i.test(part)) {
      const href = /^https?:\/\//i.test(part) ? part : `https://${part}`;
      return (
        <a
          key={idx}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-[#38BDF8] underline decoration-[#38BDF8]/60 hover:text-[#F5D061] break-all"
        >
          {part}
        </a>
      );
    }
    if (/^(?:\+92|0092|03)\d{2}[\s-]?\d{7}$/.test(part)) {
      const cleanTel = part.replace(/[\s-]/g, '');
      return (
        <a
          key={idx}
          href={`tel:${cleanTel}`}
          onClick={(e) => e.stopPropagation()}
          className="text-[#F5D061] underline decoration-[#F5D061]/60 hover:text-white whitespace-nowrap"
        >
          {part}
        </a>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

function getCalendarDayKey(isoOrTs?: string): string {
  const d = isoOrTs ? new Date(isoOrTs) : new Date();
  if (Number.isNaN(d.getTime())) return 'unknown';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatChatDateDivider(isoOrTs: string, language: AppLanguage): string {
  const d = new Date(isoOrTs);
  if (Number.isNaN(d.getTime())) return '';
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const key = getCalendarDayKey(isoOrTs);
  if (key === getCalendarDayKey(today.toISOString())) {
    return translate(language, 'todayLabel');
  }
  if (key === getCalendarDayKey(yesterday.toISOString())) {
    return translate(language, 'yesterdayLabel');
  }
  return d.toLocaleDateString(language === 'ur' ? 'ur-PK' : 'en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

export const FOUNDER_BUBBLE_COLORS: Array<{
  id: string;
  label: string;
  swatch: string;
  bubbleClass: string;
}> = [
  {
    id: 'ROYAL_GOLD',
    label: 'Royal Gold',
    swatch: 'from-[#F5D061] to-[#A67C23]',
    bubbleClass: 'bg-gradient-to-br from-[#2B2108] via-[#1E1706] to-[#111622] border-[#F5D061]/70 shadow-[0_0_18px_rgba(212,175,55,0.22)]'
  },
  {
    id: 'IMPERIAL_EMERALD',
    label: 'Imperial Emerald',
    swatch: 'from-[#10B981] to-[#043927]',
    bubbleClass: 'bg-gradient-to-br from-[#043927] via-[#065239] to-[#0A1F18] border-[#F5D061]/65 shadow-[0_0_18px_rgba(16,185,129,0.2)]'
  },
  {
    id: 'SAPPHIRE_ROYAL',
    label: 'Sapphire Blue',
    swatch: 'from-[#38BDF8] to-[#1E3A8A]',
    bubbleClass: 'bg-gradient-to-br from-[#0C2447] via-[#133262] to-[#0B1528] border-[#F5D061]/60 shadow-[0_0_18px_rgba(56,189,248,0.18)]'
  },
  {
    id: 'ROYAL_AMETHYST',
    label: 'Royal Amethyst',
    swatch: 'from-[#C084FC] to-[#581C87]',
    bubbleClass: 'bg-gradient-to-br from-[#2A1247] via-[#3A1862] to-[#170B28] border-[#F5D061]/60 shadow-[0_0_18px_rgba(192,132,252,0.18)]'
  },
  {
    id: 'CRIMSON_RUBY',
    label: 'Crimson Ruby',
    swatch: 'from-[#FB7185] to-[#881337]',
    bubbleClass: 'bg-gradient-to-br from-[#3E0D1B] via-[#531225] to-[#1B0910] border-[#F5D061]/60 shadow-[0_0_18px_rgba(251,113,133,0.18)]'
  },
  {
    id: 'OBSIDIAN_PLATINUM',
    label: 'Obsidian Platinum',
    swatch: 'from-[#E2E8F0] to-[#334155]',
    bubbleClass: 'bg-gradient-to-br from-[#1A2232] via-[#111622] to-[#0A0D12] border-[#F5D061]/70 shadow-[0_0_18px_rgba(226,232,240,0.14)]'
  }
];

function formatDuration(sec: number): string {
  const safe = Math.max(0, Math.floor(sec));
  const mins = Math.floor(safe / 60);
  const rem = safe % 60;
  return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
}

interface VoiceNotePlayerProps {
  voiceNote: ChatVoiceNote;
}

const VoiceNotePlayer: React.FC<VoiceNotePlayerProps> = ({ voiceNote }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSec, setCurrentSec] = useState(0);
  const [speedIdx, setSpeedIdx] = useState(0);
  const [playError, setPlayError] = useState<string | null>(null);
  const playbackRate = PLAYBACK_SPEEDS[speedIdx];

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  useEffect(() => {
    return () => {
      try {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
      } catch {
        // ignore cleanup error
      }
    };
  }, []);

  const togglePlay = async () => {
    setPlayError(null);
    try {
      if (!audioRef.current) {
        const audio = new Audio(voiceNote.url);
        audio.preload = 'metadata';
        audio.playbackRate = playbackRate;
        (audio as unknown as { playsInline?: boolean }).playsInline = true;
        audio.onended = () => {
          setIsPlaying(false);
          setCurrentSec(0);
        };
        audio.ontimeupdate = () => {
          setCurrentSec(Math.floor(audio.currentTime || 0));
        };
        audio.onerror = () => {
          setIsPlaying(false);
          setPlayError('Audio format unsupported on this device.');
        };
        audioRef.current = audio;
      }

      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.playbackRate = playbackRate;
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch {
      setIsPlaying(false);
      setPlayError('Unable to play voice note.');
    }
  };

  const bars = voiceNote.waveform && voiceNote.waveform.length > 0
    ? voiceNote.waveform
    : [35, 65, 50, 85, 45, 70, 90, 55, 40, 75, 60, 80, 45, 65, 50, 70];

  const totalSec = Math.max(1, voiceNote.durationSec || 1);
  const progressRatio = Math.min(1, currentSec / totalSec);

  return (
    <div className="rounded-xl bg-[#0F172A]/90 border border-[#38BDF8]/30 px-2.5 py-2 space-y-1 shadow-[inset_0_1px_0_rgba(56,189,248,0.12)]">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={togglePlay}
          className="relative z-50 w-11 h-11 min-w-[44px] min-h-[44px] rounded-full kc-gold-button flex items-center justify-center shrink-0 cursor-pointer kc-pressable"
          aria-label={isPlaying ? 'Pause voice note' : 'Play voice note'}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>

        <div className="flex-1 flex items-end gap-0.5 h-7 min-w-0" aria-hidden="true">
          {bars.map((heightPct, idx) => {
            const barRatio = (idx + 1) / bars.length;
            const active = isPlaying ? true : barRatio <= progressRatio;
            return (
              <span
                key={idx}
                style={{
                  height: `${Math.max(22, Math.min(100, heightPct))}%`,
                  animationDelay: `${(idx % 5) * 0.12}s`
                }}
                className={`flex-1 rounded-full transition-colors ${
                  isPlaying
                    ? 'bg-[#F5D061] kc-wave-bar-active'
                    : active
                    ? 'bg-[#38BDF8]'
                    : 'bg-slate-700/80'
                }`}
              />
            );
          })}
        </div>

        <div className="flex flex-col items-end gap-0.5 shrink-0">
          <span className="text-[11px] font-mono font-bold text-[#F5D061] tabular-nums">
            {formatDuration(isPlaying ? currentSec : totalSec)}
          </span>
          <button
            type="button"
            onClick={() => setSpeedIdx(prev => (prev + 1) % PLAYBACK_SPEEDS.length)}
            className="px-1.5 py-0.5 rounded-md bg-[#131C31] hover:bg-[#1E293B] border border-[#38BDF8]/40 text-[9px] font-mono font-extrabold text-[#38BDF8] cursor-pointer"
            title="Playback Speed"
          >
            {playbackRate}x
          </button>
        </div>
      </div>
      {playError && <p className="text-[10px] text-rose-300">{playError}</p>}
    </div>
  );
};

const ChatModuleContent: React.FC = () => {
  const {
    currentUser,
    users,
    chats,
    chatMessages,
    communityMessages,
    queuedMessageCount,
    sendChatMessage,
    markConversationAsSeen,
    sendCommunityMessage,
    toggleCommunityReaction,
    toggleHighlightCommunityMessage,
    togglePinCommunityMessage,
    deleteCommunityMessageForMe,
    deleteCommunityMessageForEveryone,
    clearDeletedCommunityMessageGlobally,
    clearOldCommunityMessages,
    deleteDirectMessageForMe,
    deleteDirectMessageForEveryone,
    muteChatUser,
    updateChatRoomModeration,
    updateMemberChatControl,
    updateLiveChatAppearance,
    minimizeLiveChat,
    closeAndHideLiveChat,
    preferredChatMode,
    setPreferredChatMode,
    appSettings,
    activeChatUser,
    setActiveChatUser,
    setInspectedUserProfile,
    isOnline,
    language,
    typingUsers,
    reportTypingStatus
  } = useApp();
  const requiresProfileCompletion = needsProfileCompletion(currentUser);

  const chatMode = preferredChatMode;
  const setChatMode = setPreferredChatMode;

  // Direct Chat States
  const [searchQuery, setSearchQuery] = useState('');
  const [messageText, setMessageText] = useState('');
  const [directReplyingTo, setDirectReplyingTo] = useState<ChatReplySnapshot | null>(null);
  const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false);
  const [attachmentPreview, setAttachmentPreview] = useState<{ url: string; name: string; type: 'IMAGE' | 'DOCUMENT' } | null>(null);
  const [selectedUserFilterRole, setSelectedUserFilterRole] = useState<'ALL' | 'SUPER_ADMIN' | 'ADMIN' | 'CO_ADMIN' | 'MEMBER'>('ALL');
  const [mobileShowThread, setMobileShowThread] = useState<boolean>(!!activeChatUser);

  // Live Community Room States
  const [communityText, setCommunityText] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatReplySnapshot | null>(null);
  const [communityAttachment, setCommunityAttachment] = useState<{ url: string; name: string; type: 'IMAGE' | 'DOCUMENT' } | null>(null);
  const [showEmojiStrip, setShowEmojiStrip] = useState(false);
  const [showIslamicGifDrawer, setShowIslamicGifDrawer] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isBubbleColorModalOpen, setIsBubbleColorModalOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isCompressingMedia, setIsCompressingMedia] = useState(false);

  // In-chat Search, Forward, Copy Toast, Scroll-to-Bottom & Swipe-to-Reply States
  const [isCommunitySearchOpen, setIsCommunitySearchOpen] = useState(false);
  const [communitySearchQuery, setCommunitySearchQuery] = useState('');
  const [isDirectSearchOpen, setIsDirectSearchOpen] = useState(false);
  const [directSearchQuery, setDirectSearchQuery] = useState('');
  const [forwardingMessage, setForwardingMessage] = useState<ChatMessage | null>(null);
  const [forwardSearch, setForwardSearch] = useState('');
  const [copiedToast, setCopiedToast] = useState<string | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const highlightTimerRef = useRef<number | null>(null);
  const [showCommScrollBottom, setShowCommScrollBottom] = useState(false);
  const [showDirectScrollBottom, setShowDirectScrollBottom] = useState(false);
  const [swipingMsgId, setSwipingMsgId] = useState<string | null>(null);
  const [swipeOffsetX, setSwipeOffsetX] = useState(0);
  const swipeTouchRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    senderName: string;
    text: string;
    isVoiceNote: boolean;
    scope: 'COMMUNITY' | 'DIRECT';
    horizontalLocked: boolean | null;
  } | null>(null);
  const lastTypingSentRef = useRef<{ chatId: string; at: number }>({ chatId: '', at: 0 });
  const typingClearTimerRef = useRef<number | null>(null);

  // Delete Message & Founder Clear Old Messages Modals
  const [deleteModalTarget, setDeleteModalTarget] = useState<{
    scope: 'COMMUNITY' | 'DIRECT';
    msg: ChatMessage;
    canDeleteForEveryone: boolean;
  } | null>(null);
  const [isClearOldModalOpen, setIsClearOldModalOpen] = useState(false);

  // WhatsApp-Style Top Menu, More Moderation Sub-menu, Room Members Control & Pinned Messages Modals
  const [isChatMenuOpen, setIsChatMenuOpen] = useState(false);
  const [isMoreSubmenuOpen, setIsMoreSubmenuOpen] = useState(false);
  const [isRoomMembersModalOpen, setIsRoomMembersModalOpen] = useState(false);
  const [isPinnedModalOpen, setIsPinnedModalOpen] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const actionCooldownRef = useRef<number>(0);
  const runDebouncedAction = (fn: () => void) => {
    const now = Date.now();
    if (now - actionCooldownRef.current < 350) return;
    actionCooldownRef.current = now;
    fn();
  };

  // Presence & typing freshness tick (every 2s while typing present, else 10s)
  const [presenceNowMs, setPresenceNowMs] = useState(() => Date.now());
  useEffect(() => {
    const intervalMs = typingUsers.length > 0 ? 2000 : 10000;
    const id = window.setInterval(() => {
      setPresenceNowMs(Date.now());
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [typingUsers.length]);

  // Voice Recorder & Step-2 Preview Draft States (WhatsApp Flow: Record -> Stop -> Preview -> Send)
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [draftVoiceNote, setDraftVoiceNote] = useState<ChatVoiceNote | null>(null);
  const [isDraftPlaying, setIsDraftPlaying] = useState(false);
  const [draftPlaySec, setDraftPlaySec] = useState(0);
  const [draftSpeedIdx, setDraftSpeedIdx] = useState(0);
  const draftAudioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<number | null>(null);
  const recordDurationRef = useRef<number>(0);
  const cancelRecordingFlagRef = useRef<boolean>(false);

  // Soft Keyboard & Auto-Expanding Multi-line Composer Refs
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const maxViewportHeightRef = useRef<number>(
    typeof window !== 'undefined' ? (window.visualViewport?.height || window.innerHeight) : 800
  );
  const communityTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const directTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [chatError, setChatError] = useState<string | null>(null);
  const [micHint, setMicHint] = useState<string | null>(null);

  // Web Speech API Dictation States
  const [dictationTarget, setDictationTarget] = useState<'COMMUNITY' | 'DIRECT' | null>(null);
  const [dictationLocale, setDictationLocale] = useState<'en-US' | 'ur-PK'>(
    language === 'ur' ? 'ur-PK' : 'en-US'
  );

  const speech = useSpeechDictation({
    language,
    speechLangOverride: dictationLocale,
    onFinalTranscript: (spoken) => {
      if (dictationTarget === 'COMMUNITY') {
        setCommunityText(prev => appendDictatedText(prev, spoken).slice(0, 5000));
      } else if (dictationTarget === 'DIRECT') {
        setMessageText(prev => appendDictatedText(prev, spoken).slice(0, 5000));
      }
    }
  });

  useEffect(() => {
    if (speech.error) {
      setChatError(speech.error);
    }
  }, [speech.error]);

  useEffect(() => {
    setDictationLocale(language === 'ur' ? 'ur-PK' : 'en-US');
  }, [language]);

  useEffect(() => {
    if (speech.isListening) {
      speech.stopDictation();
      setDictationTarget(null);
    }
    // Stop active dictation when switching between COMMUNITY and DIRECT modes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatMode]);

  const toggleChatDictation = (target: 'COMMUNITY' | 'DIRECT') => {
    setChatError(null);
    speech.clearError();
    if (speech.isListening && dictationTarget === target) {
      speech.stopDictation();
      setDictationTarget(null);
      return;
    }
    if (isRecording) {
      stopVoiceRecording(true);
    }
    setDictationTarget(target);
    speech.startDictation(dictationLocale);
  };

  const syncTextareaHeight = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = 'auto';
    const nextHeight = Math.min(120, Math.max(46, el.scrollHeight));
    el.style.height = `${nextHeight}px`;
  };

  useEffect(() => {
    syncTextareaHeight(communityTextareaRef.current);
  }, [communityText, isRecording, draftVoiceNote, chatMode]);

  useEffect(() => {
    syncTextareaHeight(directTextareaRef.current);
  }, [messageText, chatMode]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const getH = () => window.visualViewport?.height || window.innerHeight;
    maxViewportHeightRef.current = Math.max(maxViewportHeightRef.current, getH());
    const handleViewportChange = () => {
      const currentH = getH();
      if (currentH > maxViewportHeightRef.current) {
        maxViewportHeightRef.current = currentH;
      }
      const delta = maxViewportHeightRef.current - currentH;
      setIsKeyboardOpen(delta > 140);
    };
    const vv = window.visualViewport;
    vv?.addEventListener('resize', handleViewportChange);
    window.addEventListener('resize', handleViewportChange);
    return () => {
      vv?.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('resize', handleViewportChange);
    };
  }, []);

  const communityEndRef = useRef<HTMLDivElement | null>(null);
  const directEndRef = useRef<HTMLDivElement | null>(null);
  const communityFeedRef = useRef<HTMLDivElement | null>(null);
  const directFeedRef = useRef<HTMLDivElement | null>(null);
  const communityMessageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const directMessageRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (preferredChatMode === 'DIRECT' && activeChatUser) {
      setMobileShowThread(true);
    }
  }, [preferredChatMode, activeChatUser]);

  useEffect(() => {
    return () => {
      try {
        if (recordTimerRef.current) window.clearInterval(recordTimerRef.current);
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(t => t.stop());
        }
        if (draftAudioRef.current) {
          draftAudioRef.current.pause();
          draftAudioRef.current = null;
        }
      } catch {
        // ignore cleanup
      }
    };
  }, []);

  useEffect(() => {
    if (chatMode === 'COMMUNITY') {
      try {
        communityEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      } catch {
        // ignore
      }
    }
  }, [communityMessages.length, chatMode]);

  if (!currentUser) return null;

  const isFounder = isFounderIdentity(currentUser);
  const canModerateRoom = isChatModerator(currentUser);
  const canUploadGallery =
    isFounder ||
    currentUser.role === 'SUPER_ADMIN' ||
    currentUser.role === 'ADMIN';
  const isLeadership =
    canUploadGallery ||
    currentUser.role === 'CO_ADMIN';
  const canMuteUsers = isFounder || currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';
  const isUserMutedInCommunity = Boolean(currentUser.isMutedInChat) && !isFounder;
  const myMemberControl = appSettings.chatMemberControls?.[currentUser.id];
  const isMyRemovedFromRoom = Boolean(currentUser.isMutedInChat && !isFounder);
  const isGlobalFullLocked = Boolean(appSettings.chatLockFullRoom);
  const isGlobalTextLocked = Boolean(appSettings.chatLockMessages);
  const isGlobalVoiceLocked = Boolean(appSettings.chatLockVoiceNotes);
  const roomFullLockedForMe = isMyRemovedFromRoom || (!canModerateRoom && isGlobalFullLocked);
  const roomTextLockedForMe =
    roomFullLockedForMe ||
    (!canModerateRoom && isGlobalTextLocked) ||
    (!isFounder && Boolean(myMemberControl?.lockMessages));
  const roomVoiceLockedForMe =
    roomFullLockedForMe ||
    (!canModerateRoom && isGlobalVoiceLocked) ||
    (!isFounder && Boolean(myMemberControl?.lockVoice));

  // Direct Chat Logic
  const availableUsers = users.filter(u => {
    if (u.id === currentUser.id) return false;
    if (selectedUserFilterRole !== 'ALL' && u.role !== selectedUserFilterRole) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const resolvedTab = resolveUserTabbar(u);
      return (
        u.name.toLowerCase().includes(q) ||
        (u.district && u.district.toLowerCase().includes(q)) ||
        (u.stateProvince && u.stateProvince.toLowerCase().includes(q)) ||
        (u.membershipId && u.membershipId.toLowerCase().includes(q)) ||
        (u.tabbarEnglish && u.tabbarEnglish.toLowerCase().includes(q)) ||
        (u.tabbarUrdu && u.tabbarUrdu.toLowerCase().includes(q)) ||
        (resolvedTab && (resolvedTab.englishName.toLowerCase().includes(q) || resolvedTab.urduName.toLowerCase().includes(q)))
      );
    }
    return true;
  });

  const activeRecipient = activeChatUser || (availableUsers.length > 0 ? availableUsers[0] : null);
  const activeChatId =
    activeRecipient
      ? `chat_${[currentUser.id, activeRecipient.id].sort()[0]}_${[currentUser.id, activeRecipient.id].sort()[1]}`
      : '';
  const currentDirectMessages = activeChatId ? chatMessages.filter(m => m.chatId === activeChatId) : [];

  useEffect(() => {
    if (chatMode === 'DIRECT' && activeChatId && currentUser) {
      markConversationAsSeen(activeChatId);
    }
  }, [chatMode, activeChatId, currentDirectMessages.length, currentUser, markConversationAsSeen]);

  useEffect(() => {
    if (chatMode === 'DIRECT' && activeChatId) {
      try {
        directEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      } catch {
        // ignore
      }
    }
  }, [chatMode, activeChatId, currentDirectMessages.length]);

  const emitTyping = (chatId: string, active: boolean) => {
    if (!chatId) return;
    if (typingClearTimerRef.current) {
      window.clearTimeout(typingClearTimerRef.current);
      typingClearTimerRef.current = null;
    }
    if (!active) {
      lastTypingSentRef.current = { chatId: '', at: 0 };
      reportTypingStatus(chatId, false);
      return;
    }
    const now = Date.now();
    if (lastTypingSentRef.current.chatId !== chatId || now - lastTypingSentRef.current.at > 2500) {
      lastTypingSentRef.current = { chatId, at: now };
      reportTypingStatus(chatId, true);
    }
    typingClearTimerRef.current = window.setTimeout(() => {
      reportTypingStatus(chatId, false);
    }, 4200);
  };

  const handleCopyMessageText = (text: string) => {
    if (!text) return;
    try {
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).catch(() => {});
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopiedToast(language === 'ur' ? 'پیغام کاپی ہو گیا' : 'Message copied');
      window.setTimeout(() => setCopiedToast(null), 1800);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleSendDirectMessage = (e: React.FormEvent) => {
    e.preventDefault();
    setChatError(null);
    if (speech.isListening && dictationTarget === 'DIRECT') {
      speech.stopDictation();
      setDictationTarget(null);
    }
    if (!activeRecipient || (!messageText.trim() && !attachmentPreview)) return;

    const res = sendChatMessage(
      activeRecipient.id,
      messageText.trim() || (attachmentPreview ? `Shared ${attachmentPreview.type === 'IMAGE' ? 'an image' : 'a document'}: ${attachmentPreview.name}` : ''),
      attachmentPreview || undefined,
      directReplyingTo ? { replyTo: directReplyingTo } : undefined
    );

    if (!res.success) {
      setChatError(res.error || (language === 'ur' ? 'اس وقت پیغام بھیجنا ممکن نہیں۔' : 'Unable to send message right now.'));
      return;
    }

    emitTyping(activeChatId, false);
    setMessageText('');
    setAttachmentPreview(null);
    setDirectReplyingTo(null);
  };

  const handleDirectImageAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_GALLERY_FILE_BYTES) {
      setChatError(language === 'ur' ? 'منتخب کردہ فائل 10MB کی حد سے زیادہ ہے۔' : 'Selected file exceeds the 10MB limit.');
      return;
    }
    setChatError(null);
    setIsCompressingMedia(true);
    try {
      let mediaUrl: string | null = null;
      if (isGifFile(file)) {
        mediaUrl = await readFileAsDataUrlWithLimit(file, 750 * 1024);
        if (!mediaUrl) {
          mediaUrl = await uploadMediaToFirebaseStorage(file, 'direct_gifs');
        }
      }
      if (!mediaUrl) {
        const compressed = await compressImageFile(file, 1024, 0.75, 750 * 1024);
        mediaUrl = compressed.dataUrl;
      }
      setAttachmentPreview({
        url: mediaUrl,
        name: file.name,
        type: 'IMAGE'
      });
      setIsAttachmentModalOpen(false);
    } catch (err: any) {
      setChatError(err?.message || (language === 'ur' ? 'منتخب تصویر کمپریس کرنے میں ناکامی ہوئی۔' : 'Failed to compress selected image.'));
    } finally {
      setIsCompressingMedia(false);
    }
  };

  const handleDirectDocumentAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) {
      setChatError(language === 'ur' ? 'تیز موبائل ترسیل کے لیے دستاویز 1.5MB سے کم ہونی چاہیے۔' : 'Document must be under 1.5MB for fast mobile delivery.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAttachmentPreview({
        url: reader.result as string,
        name: file.name,
        type: 'DOCUMENT'
      });
      setIsAttachmentModalOpen(false);
    };
    reader.readAsDataURL(file);
  };

  // Live Community Room Handlers
  const pinnedMessages = communityMessages.filter(m => m.isPinned && !m.isDeleted && !m.isDeletedForEveryone);
  const pinnedMessage = pinnedMessages[pinnedMessages.length - 1];

  const handleSendCommunityMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setChatError(null);
    if (speech.isListening && dictationTarget === 'COMMUNITY') {
      speech.stopDictation();
      setDictationTarget(null);
    }
    if (isUserMutedInCommunity) {
      setChatError(translate(language, 'mutedNotice'));
      return;
    }
    if (roomTextLockedForMe) {
      setChatError(
        language === 'ur'
          ? 'انتظامیہ کی جانب سے اس وقت کمیونٹی روم میں ٹیکسٹ پیغامات بند ہیں۔'
          : 'Text messages are currently locked by administration.'
      );
      return;
    }
    if (!communityText.trim() && !communityAttachment) return;

    const res = sendCommunityMessage({
      text: communityText.trim(),
      replyTo: replyingTo || undefined,
      attachment: communityAttachment || undefined
    });

    if (!res.success) {
      setChatError(res.error || (language === 'ur' ? 'کمیونٹی پیغام بھیجنے میں ناکامی ہوئی۔' : 'Failed to send community message.'));
      return;
    }

    emitTyping('community_global_room', false);
    setCommunityText('');
    setReplyingTo(null);
    setCommunityAttachment(null);
    setShowEmojiStrip(false);
    setShowIslamicGifDrawer(false);
  };

  const handleSendIslamicGif = (gifId: string) => {
    setChatError(null);
    const res = sendCommunityMessage({
      islamicGifId: gifId,
      replyTo: replyingTo || undefined
    });
    if (!res.success) {
      setChatError(res.error || (language === 'ur' ? 'اسلامی کارڈ بھیجنے میں ناکامی ہوئی۔' : 'Unable to send Islamic greeting.'));
      return;
    }
    setReplyingTo(null);
    setShowIslamicGifDrawer(false);
  };

  const optimizeImageOrGifForFirestore = async (
    file: File,
    storageFolder: string
  ): Promise<string> => {
    if (!file || (!file.type.startsWith('image/') && !isGifFile(file))) {
      throw new Error(language === 'ur' ? 'براہ کرم درست تصویر یا GIF فائل منتخب کریں۔' : 'Please choose a valid photo or GIF file.');
    }
    if (file.size > MAX_GALLERY_FILE_BYTES) {
      throw new Error(language === 'ur' ? 'منتخب کردہ فائل 10MB کی حد سے زیادہ ہے۔' : 'Selected file exceeds the 10MB limit. Please choose a smaller file.');
    }

    if (isGifFile(file)) {
      const inlineGif = await readFileAsDataUrlWithLimit(file, 750 * 1024);
      if (inlineGif) return inlineGif;
      const uploadedGifUrl = await uploadMediaToFirebaseStorage(file, storageFolder);
      if (uploadedGifUrl) return uploadedGifUrl;
    }

    const compressed = await compressImageFile(file, 1024, 0.75, 750 * 1024);
    return compressed.dataUrl;
  };

  const handleGalleryMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !canUploadGallery) return;
    setChatError(null);
    setIsCompressingMedia(true);
    try {
      const url = await optimizeImageOrGifForFirestore(file, 'community_gifs');
      setCommunityAttachment({
        url,
        name: file.name,
        type: 'IMAGE'
      });
    } catch (err: any) {
      setChatError(err?.message || (language === 'ur' ? 'تصویر یا GIF پروسیس کرنے میں ناکامی ہوئی۔' : 'Unable to process selected photo or GIF.'));
    } finally {
      setIsCompressingMedia(false);
    }
  };

  const handleCustomScenicBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !canUploadGallery) return;
    setChatError(null);
    setIsCompressingMedia(true);
    try {
      const url = await optimizeImageOrGifForFirestore(file, 'community_themes');
      const res = updateLiveChatAppearance({
        liveChatTheme: 'CUSTOM',
        liveChatCustomBgUrl: url
      });
      if (!res.success) {
        setChatError(res.error || (language === 'ur' ? 'کسٹم وال پیپر اپڈیٹ نہیں ہو سکا۔' : 'Could not update custom scenic background.'));
      } else {
        setIsThemeModalOpen(false);
      }
    } catch (err: any) {
      setChatError(err?.message || (language === 'ur' ? 'کسٹم وال پیپر پروسیس کرنے میں ناکامی ہوئی۔' : 'Unable to process custom scenic wallpaper.'));
    } finally {
      setIsCompressingMedia(false);
    }
  };

  // Discard Voice Note Draft Preview
  const discardDraftVoiceNote = () => {
    try {
      if (draftAudioRef.current) {
        draftAudioRef.current.pause();
        draftAudioRef.current = null;
      }
    } catch {
      // ignore
    }
    setIsDraftPlaying(false);
    setDraftPlaySec(0);
    setDraftVoiceNote(null);
  };

  const draftPlaybackSpeed = PLAYBACK_SPEEDS[draftSpeedIdx];
  useEffect(() => {
    if (draftAudioRef.current) {
      draftAudioRef.current.playbackRate = draftPlaybackSpeed;
    }
  }, [draftPlaybackSpeed]);

  const toggleDraftVoicePlay = async () => {
    if (!draftVoiceNote) return;
    setChatError(null);
    try {
      if (!draftAudioRef.current) {
        const audio = new Audio(draftVoiceNote.url);
        audio.preload = 'metadata';
        audio.playbackRate = draftPlaybackSpeed;
        (audio as unknown as { playsInline?: boolean }).playsInline = true;
        audio.onended = () => {
          setIsDraftPlaying(false);
          setDraftPlaySec(0);
        };
        audio.ontimeupdate = () => {
          setDraftPlaySec(Math.floor(audio.currentTime || 0));
        };
        audio.onerror = () => {
          setIsDraftPlaying(false);
          setChatError(language === 'ur' ? 'اس ڈیوائس پر وائس نوٹ چلایا نہیں جا سکا۔' : 'Unable to preview voice note on this device.');
        };
        draftAudioRef.current = audio;
      }
      if (isDraftPlaying) {
        draftAudioRef.current.pause();
        setIsDraftPlaying(false);
      } else {
        draftAudioRef.current.playbackRate = draftPlaybackSpeed;
        await draftAudioRef.current.play();
        setIsDraftPlaying(true);
      }
    } catch {
      setIsDraftPlaying(false);
      setChatError(language === 'ur' ? 'وائس نوٹ پیش نظارہ دستیاب نہیں ہے۔' : 'Unable to play voice note preview.');
    }
  };

  const handleSendDraftVoiceNote = () => {
    if (!draftVoiceNote) return;
    setChatError(null);
    const voicePayload = draftVoiceNote;
    discardDraftVoiceNote();
    const res = sendCommunityMessage({
      voiceNote: voicePayload,
      replyTo: replyingTo || undefined
    });
    if (!res.success) {
      setChatError(res.error || (language === 'ur' ? 'وائس نوٹ نہیں بھیجا جا سکا۔' : 'Could not send voice note.'));
    } else {
      setReplyingTo(null);
    }
  };

  // Voice Recording (try/catch guarded + 60s hard cap -> transitions into Step 2 Preview without auto-sending)
  const stopVoiceRecording = (shouldCancel = false) => {
    cancelRecordingFlagRef.current = shouldCancel;
    try {
      if (recordTimerRef.current) {
        window.clearInterval(recordTimerRef.current);
        recordTimerRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    } catch {
      setIsRecording(false);
      setRecordingSeconds(0);
    }
  };

  const startVoiceRecording = async () => {
    setChatError(null);
    setMicHint(null);
    discardDraftVoiceNote();
    if (speech.isListening) {
      speech.stopDictation();
      setDictationTarget(null);
    }
    if (isUserMutedInCommunity) {
      setChatError(translate(language, 'mutedNotice'));
      return;
    }
    if (roomVoiceLockedForMe) {
      setChatError(
        language === 'ur'
          ? 'انتظامیہ کی جانب سے اس وقت وائس نوٹس بند ہیں۔'
          : 'Voice notes are currently locked by administration.'
      );
      return;
    }

    const isNativeAndroidApk =
      typeof window !== 'undefined' &&
      Boolean(
        (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.()
      );

    const isIosDevice =
      typeof navigator !== 'undefined' &&
      (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1));

    try {
      if (typeof window === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || typeof MediaRecorder === 'undefined') {
        if (!isNativeAndroidApk && !isIosDevice) {
          setMicHint(
            language === 'ur'
              ? 'وائس ریکارڈنگ کے لیے انسٹال شدہ اینڈرائیڈ APK اور مائیک کی اجازت درکار ہے۔'
              : 'Voice recording requires the installed Android APK with Mic permission.'
          );
        } else {
          setChatError(language === 'ur' ? 'اس براؤزر یا ڈیوائس پر وائس ریکارڈنگ دستیاب نہیں ہے۔' : 'Voice recording is not supported on this browser or device.');
        }
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const preferredTypes = isIosDevice
        ? ['audio/mp4;codecs=mp4a.40.2', 'audio/mp4', 'audio/aac', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg']
        : ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
      const supportedMime = preferredTypes.find(t => {
        try {
          return MediaRecorder.isTypeSupported(t);
        } catch {
          return false;
        }
      });
      const fallbackMime = supportedMime || (isIosDevice ? 'audio/mp4' : 'audio/webm');

      const recorder = supportedMime
        ? new MediaRecorder(stream, { mimeType: supportedMime })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      cancelRecordingFlagRef.current = false;
      recordDurationRef.current = 0;
      setRecordingSeconds(0);
      setIsRecording(true);

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          audioChunksRef.current.push(ev.data);
        }
      };

      recorder.onstop = () => {
        try {
          stream.getTracks().forEach(track => track.stop());
        } catch {
          // ignore
        }
        mediaStreamRef.current = null;

        const wasCancelled = cancelRecordingFlagRef.current;
        const recordedSec = Math.max(1, Math.min(MAX_VOICE_SECONDS, recordDurationRef.current));
        setIsRecording(false);
        setRecordingSeconds(0);

        if (wasCancelled || audioChunksRef.current.length === 0) {
          audioChunksRef.current = [];
          return;
        }

        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || fallbackMime });
        audioChunksRef.current = [];

        if (blob.size > 950 * 1024) {
          setChatError(language === 'ur' ? 'وائس نوٹ کا سائز حد سے زیادہ ہے۔ براہ کرم مختصر پیغام ریکارڈ کریں۔' : 'Voice note size exceeded mobile cloud limit. Please keep notes shorter.');
          return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          if (!dataUrl) return;
          const waveform = Array.from({ length: 18 }, (_, i) =>
            30 + Math.round(((Math.sin(i * 1.7 + recordedSec) + 1) / 2) * 65)
          );
          setDraftVoiceNote({
            url: dataUrl,
            durationSec: recordedSec,
            waveform
          });
        };
        reader.readAsDataURL(blob);
      };

      recorder.start(250);
      recordTimerRef.current = window.setInterval(() => {
        recordDurationRef.current += 1;
        setRecordingSeconds(recordDurationRef.current);
        if (recordDurationRef.current >= MAX_VOICE_SECONDS) {
          stopVoiceRecording(false);
        }
      }, 1000);
    } catch {
      setIsRecording(false);
      setRecordingSeconds(0);
      if (!isNativeAndroidApk) {
        setMicHint(
          language === 'ur'
            ? 'وائس ریکارڈنگ کے لیے انسٹال شدہ اینڈرائیڈ APK اور مائیک کی اجازت درکار ہے۔'
            : 'Voice recording requires the installed Android APK with Mic permission.'
        );
      } else {
        setChatError(language === 'ur' ? 'مائیکروفون کی اجازت نہیں ملی۔ براہ کرم ایپ کی سیٹنگز میں مائیکروفون آن کریں۔' : 'Microphone access denied or unavailable. Please allow mic permission in browser/app settings.');
      }
    }
  };

  const scrollToMessageId = (id: string, scope: 'COMMUNITY' | 'DIRECT' = 'COMMUNITY') => {
    try {
      const el =
        scope === 'DIRECT'
          ? directMessageRefs.current[id]
          : communityMessageRefs.current[id];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setHighlightedMessageId(id);
        if (highlightTimerRef.current) window.clearTimeout(highlightTimerRef.current);
        highlightTimerRef.current = window.setTimeout(() => {
          setHighlightedMessageId(null);
        }, 1800);
      }
    } catch {
      // ignore
    }
  };

  const handleBubbleTouchStart = (
    e: React.TouchEvent,
    msg: ChatMessage,
    scope: 'COMMUNITY' | 'DIRECT'
  ) => {
    if (msg.isDeletedForEveryone || msg.isDeleted) return;
    const touch = e.touches[0];
    if (!touch) return;
    swipeTouchRef.current = {
      id: msg.id,
      startX: touch.clientX,
      startY: touch.clientY,
      senderName: msg.senderName,
      text: msg.text,
      isVoiceNote: Boolean(msg.voiceNote),
      scope,
      horizontalLocked: null
    };
  };

  const handleBubbleTouchMove = (e: React.TouchEvent) => {
    const st = swipeTouchRef.current;
    if (!st) return;
    const touch = e.touches[0];
    if (!touch) return;
    const dx = touch.clientX - st.startX;
    const dy = touch.clientY - st.startY;
    if (st.horizontalLocked === null) {
      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
        st.horizontalLocked = Math.abs(dx) > Math.abs(dy) * 1.25 && dx > 0;
      }
    }
    if (st.horizontalLocked && dx > 0) {
      setSwipingMsgId(st.id);
      setSwipeOffsetX(Math.min(56, dx));
    }
  };

  const handleBubbleTouchEnd = () => {
    const st = swipeTouchRef.current;
    if (st && st.horizontalLocked && swipeOffsetX >= 40) {
      const snap: ChatReplySnapshot = {
        id: st.id,
        senderName: st.senderName,
        text: st.text,
        isVoiceNote: st.isVoiceNote
      };
      if (st.scope === 'DIRECT') {
        setDirectReplyingTo(snap);
        directTextareaRef.current?.focus();
      } else {
        setReplyingTo(snap);
        communityTextareaRef.current?.focus();
      }
    }
    swipeTouchRef.current = null;
    setSwipingMsgId(null);
    setSwipeOffsetX(0);
  };

  const handleForwardToTarget = (target: 'COMMUNITY' | User) => {
    if (!forwardingMessage) return;
    const fwdLabel = forwardingMessage.senderName || (language === 'ur' ? 'ممبر' : 'Member');
    const attachmentPayload = forwardingMessage.attachmentUrl
      ? {
          url: forwardingMessage.attachmentUrl,
          name: forwardingMessage.attachmentName || 'forwarded-file',
          type: (forwardingMessage.attachmentType || 'IMAGE') as 'IMAGE' | 'DOCUMENT'
        }
      : undefined;

    if (target === 'COMMUNITY') {
      const res = sendCommunityMessage({
        text: forwardingMessage.text,
        attachment: attachmentPayload,
        voiceNote: forwardingMessage.voiceNote,
        islamicGifId: forwardingMessage.islamicGifId,
        forwardedFrom: fwdLabel
      });
      if (!res.success) {
        setChatError(res.error || (language === 'ur' ? 'فارورڈ کرنے میں ناکامی ہوئی۔' : 'Unable to forward message.'));
      } else {
        setCopiedToast(language === 'ur' ? 'کمیونٹی روم میں فارورڈ کر دیا گیا' : 'Forwarded to Community Room');
        window.setTimeout(() => setCopiedToast(null), 2000);
      }
    } else {
      const res = sendChatMessage(
        target.id,
        forwardingMessage.text || (attachmentPayload ? `Shared ${attachmentPayload.name}` : forwardingMessage.voiceNote ? 'Voice Note' : ''),
        attachmentPayload,
        {
          forwardedFrom: fwdLabel,
          voiceNote: forwardingMessage.voiceNote,
          islamicGifId: forwardingMessage.islamicGifId
        }
      );
      if (!res.success) {
        setChatError(res.error || (language === 'ur' ? 'فارورڈ کرنے میں ناکامی ہوئی۔' : 'Unable to forward message.'));
      } else {
        setCopiedToast(language === 'ur' ? `${target.name} کو فارورڈ کر دیا گیا` : `Forwarded to ${target.name}`);
        window.setTimeout(() => setCopiedToast(null), 2000);
      }
    }
    setForwardingMessage(null);
    setForwardSearch('');
  };

  const renderDeliveryTick = (msg: ChatMessage) => {
    if (msg.deliveryStatus === 'QUEUED') {
      return (
        <span className="inline-flex items-center gap-1 text-amber-400" title={translate(language, 'statusQueued')}>
          <Clock className="w-3 h-3" />
          <span className="text-[9px] font-semibold">{translate(language, 'statusQueued')}</span>
        </span>
      );
    }
    if (msg.read || msg.deliveryStatus === 'SEEN') {
      return (
        <span className="inline-flex items-center gap-1 text-[#38BDF8]" title={translate(language, 'statusSeen')}>
          <CheckCheck className="w-3.5 h-3.5" />
        </span>
      );
    }
    if (msg.deliveryStatus === 'DELIVERED') {
      return (
        <span className="inline-flex items-center gap-1 text-slate-300" title={translate(language, 'statusDelivered')}>
          <CheckCheck className="w-3.5 h-3.5" />
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-slate-400" title={translate(language, 'statusDelivered')}>
        <Check className="w-3 h-3" />
      </span>
    );
  };

  const getUserRecord = (userId: string): User | undefined => users.find(u => u.id === userId);

  const getFounderBubbleStyle = (bubbleId?: string) => {
    const found = FOUNDER_BUBBLE_COLORS.find(c => c.id === bubbleId) || FOUNDER_BUBBLE_COLORS[0];
    return found.bubbleClass;
  };

  const activeThemeId: CommunityScenicThemeId = appSettings.liveChatTheme || 'OBSIDIAN_GOLD';
  const onlineMembersCount = users.filter(u =>
    isUserActuallyOnline(u, presenceNowMs)
  ).length;

  const baseCommunityMessages = communityMessages.filter(m => !(m.isDeleted && !m.isDeletedForEveryone));
  const commSearchNorm = communitySearchQuery.trim().toLowerCase();
  const visibleCommunityMessages = commSearchNorm
    ? baseCommunityMessages.filter(m =>
        !m.isDeletedForEveryone &&
        !m.isDeleted &&
        ((m.text && m.text.toLowerCase().includes(commSearchNorm)) ||
          m.senderName.toLowerCase().includes(commSearchNorm))
      )
    : baseCommunityMessages;

  const activeCommunityTypers = typingUsers.filter(
    t => t.chatId === 'community_global_room' && t.userId !== currentUser.id && presenceNowMs - t.updatedAt < 6500
  );
  const activeDirectTypers = activeChatId
    ? typingUsers.filter(t => t.chatId === activeChatId && t.userId !== currentUser.id && presenceNowMs - t.updatedAt < 6500)
    : [];
  const actorRank = getRoleHierarchyRank(currentUser.role, isFounder);

  return (
    <div className="space-y-4 w-full max-w-full overflow-x-hidden box-border">
      {/* Header + Dual Mode Switcher (shown in Direct Messages view) */}
      {chatMode === 'DIRECT' && (
        <>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-[#D4AF37]/25">
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-[#F5D061] uppercase tracking-wider">
                {language === 'ur' ? 'سوئی خیل اتحاد · لائیو اور براہ راست نیٹ ورک' : 'SUI KHEL ITTEHAD · Live & Direct Network'}
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white mt-0.5 flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-[#F5D061] shrink-0" />
                <span>{translate(language, 'chatHeader')}</span>
              </h1>
              <p className="text-xs text-slate-400">
                {translate(language, 'chatSubtitle')}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex p-1 rounded-xl bg-[#0A0D12] border border-[#D4AF37]/30">
                <button
                  type="button"
                  onClick={() => setChatMode('COMMUNITY')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer text-slate-300 hover:text-white"
                >
                  <Globe className="w-3.5 h-3.5 shrink-0" />
                  <span>{translate(language, 'communityRoomTab')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setChatMode('DIRECT')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer kc-gold-button"
                >
                  <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                  <span>{translate(language, 'directMessagesTab')}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={minimizeLiveChat}
                title={language === 'ur' ? 'چیٹ کو فلوٹنگ ببل میں چھوٹا کریں' : 'Minimize Live Chat to Floating Bubble'}
                aria-label="Minimize Live Chat"
                className="inline-flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl bg-[#111622] hover:bg-[#161D2C] border border-[#D4AF37]/40 text-[#F5D061] text-xs font-extrabold cursor-pointer shrink-0"
              >
                <Minus className="w-4 h-4" />
                <span className="hidden sm:inline text-[11px]">
                  {language === 'ur' ? 'چھوٹا کریں' : 'Minimize'}
                </span>
              </button>

              <button
                type="button"
                onClick={closeAndHideLiveChat}
                title="Close & Hide Chat"
                aria-label="Close & Hide Chat"
                className="inline-flex items-center justify-center p-2 rounded-xl bg-[#111622] hover:bg-rose-950/60 border border-[#D4AF37]/40 text-slate-300 hover:text-white text-xs font-extrabold cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {(!isOnline || queuedMessageCount > 0) && (
            <div className="p-3 rounded-xl bg-amber-950/50 border border-[#D4AF37]/40 text-amber-200 text-xs font-semibold flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <WifiOff className="w-4 h-4 text-[#F5D061] shrink-0" />
                <span>{translate(language, 'chatOfflineBanner')}</span>
              </div>
              {queuedMessageCount > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-amber-500 text-[#0A0D12] font-extrabold text-[10px] shrink-0">
                  {queuedMessageCount} Queued
                </span>
              )}
            </div>
          )}

          {chatError && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs font-semibold flex items-center justify-between gap-2">
              <span>{chatError}</span>
              <button type="button" onClick={() => setChatError(null)} className="p-1 cursor-pointer shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </>
      )}

      {/* ============================================================
          MODE 1: FULL-SCREEN ULTRA-LUXURY LIVE COMMUNITY ROOM (PORTAL)
          ============================================================ */}
      {chatMode === 'COMMUNITY' && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] w-full max-w-[100vw] h-[100dvh] flex flex-col overflow-hidden bg-[#090D16] overscroll-none touch-pan-y">
          {/* Live Scenic GPU-Only SVG/CSS Wallpaper Background */}
          <ScenicChatBackground
            themeId={activeThemeId}
            customBgUrl={appSettings.liveChatCustomBgUrl}
          />

          {/* Single-Row Slim Top Header with Circular Unity Emblem (Top-Left) & Compact 32x32 Menu/Close Buttons (Top-Right) */}
          <div
            dir="ltr"
            className="relative z-40 px-3 sm:px-5 pt-[calc(env(safe-area-inset-top,8px)+6px)] pb-2 border-b border-slate-400/20 bg-gradient-to-b from-[#131C31]/95 via-[#0F172A]/95 to-[#090D16]/95 flex flex-nowrap items-center justify-between gap-2 shrink-0 shadow-[0_8px_24px_rgba(0,0,0,0.6)]"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <BrandEmblem3D size="sm" className="shrink-0" />
              <div className="min-w-0 flex-1">
                <h2 className="text-xs sm:text-sm font-extrabold text-[#F8FAFC] truncate leading-tight">
                  {translate(language, 'communityRoomTab')}
                </h2>
                <div className="flex items-center gap-1.5 min-w-0 mt-0.5">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#131C31] text-[#38BDF8] border border-[#38BDF8]/40 tabular-nums whitespace-nowrap shrink-0">
                    🟢 {onlineMembersCount} {translate(language, 'online')} · {users.length} {language === 'ur' ? 'ممبران' : 'Members'}
                  </span>
                  <span className="hidden sm:inline text-[10px] text-[#F5D061]/95 truncate">
                    {activeThemeId === 'CUSTOM'
                      ? (language === 'ur' ? 'بانی کی منتخب کردہ لائیو اسکرین تھیم' : 'Founder Custom Scenic Wallpaper')
                      : (() => {
                          const found = SCENIC_THEME_PRESETS.find(t => t.id === activeThemeId);
                          return found ? (language === 'ur' ? found.labelUr : found.label) : (language === 'ur' ? 'شاہی سیاہ اور سنہرا' : 'Obsidian & Royal Gold');
                        })()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* WhatsApp-style Vertical 3-Dot (⋮) Room Menu Button (32x32) */}
              <button
                type="button"
                onClick={() => {
                  setIsChatMenuOpen(prev => {
                    const next = !prev;
                    if (!next) setIsMoreSubmenuOpen(false);
                    return next;
                  });
                }}
                title={language === 'ur' ? 'روم مینو' : 'Room Menu'}
                aria-label="Room Menu"
                aria-expanded={isChatMenuOpen}
                className="w-8 h-8 min-w-[32px] min-h-[32px] inline-flex items-center justify-center rounded-lg bg-[#131C31] hover:bg-[#1E293B] border border-[#D4AF37]/45 text-[#F5D061] cursor-pointer shrink-0 kc-pressable"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {/* Hide / Close (✕) Completely (32x32) */}
              <button
                type="button"
                onClick={() => {
                  setIsChatMenuOpen(false);
                  setIsMoreSubmenuOpen(false);
                  closeAndHideLiveChat();
                }}
                title={language === 'ur' ? 'لائیو چیٹ بند کریں' : 'Close & Hide Live Chat'}
                aria-label="Close and Hide Live Chat"
                className="w-8 h-8 min-w-[32px] min-h-[32px] inline-flex items-center justify-center rounded-lg bg-[#131C31] hover:bg-rose-950/85 border border-rose-500/45 text-rose-300 hover:text-white font-extrabold cursor-pointer shrink-0 kc-pressable"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Floating Top-Right Anchored Three-Dots (⋮) Popover Menu (Never Shifts Layout or Clips Off-Screen) */}
          {isChatMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-[9998] bg-black/30"
                onClick={() => {
                  setIsChatMenuOpen(false);
                  setIsMoreSubmenuOpen(false);
                }}
              />
              <div
                dir="ltr"
                style={{
                  top: 'calc(env(safe-area-inset-top, 0px) + 56px)',
                  right: '12px',
                  width: '240px',
                  maxWidth: 'calc(100vw - 24px)',
                  zIndex: 9999,
                }}
                className="fixed rounded-2xl bg-[#0F172A]/98 border border-[#D4AF37]/50 shadow-[0_18px_48px_rgba(0,0,0,0.9)] overflow-y-auto max-h-[calc(100dvh-76px)] py-1.5 backdrop-blur-md"
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsChatMenuOpen(false);
                    setIsMoreSubmenuOpen(false);
                    setChatMode('DIRECT');
                  }}
                  className="w-full px-3.5 py-2.5 flex items-center gap-2.5 text-left text-xs font-bold text-slate-100 hover:bg-[#1E293B] cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 text-[#38BDF8] shrink-0" />
                  <span className="truncate">{language === 'ur' ? 'براہ راست پیغامات' : 'Direct Messages'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsChatMenuOpen(false);
                    setIsMoreSubmenuOpen(false);
                    setIsCommunitySearchOpen(prev => {
                      const next = !prev;
                      if (!next) setCommunitySearchQuery('');
                      return next;
                    });
                  }}
                  className="w-full px-3.5 py-2.5 flex items-center gap-2.5 text-left text-xs font-bold text-slate-100 hover:bg-[#1E293B] cursor-pointer"
                >
                  <Search className="w-4 h-4 text-[#F5D061] shrink-0" />
                  <span className="truncate">{language === 'ur' ? 'پیغام تلاش کریں' : 'Search Messages'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsChatMenuOpen(false);
                    setIsMoreSubmenuOpen(false);
                    setIsPinnedModalOpen(true);
                  }}
                  className="w-full px-3.5 py-2.5 flex items-center justify-between gap-2 text-left text-xs font-bold text-slate-100 hover:bg-[#1E293B] cursor-pointer"
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <Pin className="w-4 h-4 text-[#F5D061] shrink-0" />
                    <span className="truncate">{language === 'ur' ? 'پن شدہ پیغامات' : 'Pinned Messages'}</span>
                  </span>
                  {pinnedMessages.length > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-[#F5D061] text-[#090D16] text-[10px] font-black tabular-nums shrink-0">
                      {pinnedMessages.length}
                    </span>
                  )}
                </button>

                {isLeadership && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsChatMenuOpen(false);
                      setIsMoreSubmenuOpen(false);
                      setIsThemeModalOpen(true);
                    }}
                    className="w-full px-3.5 py-2.5 flex items-center gap-2.5 text-left text-xs font-bold text-slate-100 hover:bg-[#1E293B] cursor-pointer"
                  >
                    <Palette className="w-4 h-4 text-[#38BDF8] shrink-0" />
                    <span className="truncate">{language === 'ur' ? 'چیٹ تھیم' : 'Chat Theme'}</span>
                  </button>
                )}

                {isFounder && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setIsChatMenuOpen(false);
                        setIsMoreSubmenuOpen(false);
                        setIsBubbleColorModalOpen(true);
                      }}
                      className="w-full px-3.5 py-2.5 flex items-center gap-2.5 text-left text-xs font-bold text-[#F5D061] hover:bg-[#1E293B] cursor-pointer"
                    >
                      <Crown className="w-4 h-4 text-[#F5D061] shrink-0" />
                      <span className="truncate">{language === 'ur' ? 'میرا ببل اسٹائل' : 'My Bubble'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsChatMenuOpen(false);
                        setIsMoreSubmenuOpen(false);
                        setIsClearOldModalOpen(true);
                      }}
                      className="w-full px-3.5 py-2.5 flex items-center gap-2.5 text-left text-xs font-bold text-rose-300 hover:bg-rose-950/50 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />
                      <span className="truncate">{language === 'ur' ? 'پرانے پیغامات صاف کریں' : 'Clear Chat'}</span>
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setIsChatMenuOpen(false);
                    setIsMoreSubmenuOpen(false);
                    minimizeLiveChat();
                  }}
                  className="w-full px-3.5 py-2.5 flex items-center gap-2.5 text-left text-xs font-bold text-slate-200 hover:bg-[#1E293B] cursor-pointer"
                >
                  <Minus className="w-4 h-4 text-[#F5D061] shrink-0" />
                  <span className="truncate">{language === 'ur' ? 'روم چھوٹا کریں' : 'Minimize Room'}</span>
                </button>

                {canModerateRoom && (
                  <div className="mt-1 pt-1 border-t border-slate-700/70">
                    <button
                      type="button"
                      onClick={() => setIsMoreSubmenuOpen(prev => !prev)}
                      className="w-full px-3.5 py-2.5 flex items-center justify-between gap-2 text-left text-xs font-extrabold text-[#F5D061] hover:bg-[#1E293B] cursor-pointer"
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <Shield className="w-4 h-4 text-[#F5D061] shrink-0" />
                        <span className="truncate">{language === 'ur' ? 'مزید کنٹرولز' : 'More'}</span>
                      </span>
                      <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isMoreSubmenuOpen ? 'rotate-90' : ''}`} />
                    </button>

                    {isMoreSubmenuOpen && (
                      <div className="bg-[#090D16]/95 border-t border-slate-800 py-1 space-y-0.5">
                        <button
                          type="button"
                          onClick={() =>
                            runDebouncedAction(() => {
                              const res = updateChatRoomModeration({ chatLockMessages: !isGlobalTextLocked });
                              if (!res.success && res.error) setChatError(res.error);
                            })
                          }
                          className="w-full px-3.5 py-2 flex items-center justify-between gap-2 text-[11px] font-bold text-slate-200 hover:bg-[#1E293B] cursor-pointer"
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            {isGlobalTextLocked ? (
                              <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            ) : (
                              <Unlock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            )}
                            <span className="truncate">{language === 'ur' ? 'پیغامات لاک کریں' : 'Lock Messages'}</span>
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold shrink-0 ${isGlobalTextLocked ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                            {isGlobalTextLocked ? (language === 'ur' ? 'بند' : 'ON') : (language === 'ur' ? 'کھلا' : 'OFF')}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            runDebouncedAction(() => {
                              const res = updateChatRoomModeration({ chatLockVoiceNotes: !isGlobalVoiceLocked });
                              if (!res.success && res.error) setChatError(res.error);
                            })
                          }
                          className="w-full px-3.5 py-2 flex items-center justify-between gap-2 text-[11px] font-bold text-slate-200 hover:bg-[#1E293B] cursor-pointer"
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            {isGlobalVoiceLocked ? (
                              <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            ) : (
                              <Mic className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            )}
                            <span className="truncate">{language === 'ur' ? 'وائس نوٹس لاک کریں' : 'Lock Voice Notes'}</span>
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold shrink-0 ${isGlobalVoiceLocked ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                            {isGlobalVoiceLocked ? (language === 'ur' ? 'بند' : 'ON') : (language === 'ur' ? 'کھلا' : 'OFF')}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            runDebouncedAction(() => {
                              const res = updateChatRoomModeration({ chatLockFullRoom: !isGlobalFullLocked });
                              if (!res.success && res.error) setChatError(res.error);
                            })
                          }
                          className="w-full px-3.5 py-2 flex items-center justify-between gap-2 text-[11px] font-bold text-slate-200 hover:bg-[#1E293B] cursor-pointer"
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            {isGlobalFullLocked ? (
                              <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            ) : (
                              <Unlock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            )}
                            <span className="truncate">{language === 'ur' ? 'پورا روم لاک کریں' : 'Lock Full Room'}</span>
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold shrink-0 ${isGlobalFullLocked ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                            {isGlobalFullLocked ? (language === 'ur' ? 'بند' : 'ON') : (language === 'ur' ? 'کھلا' : 'OFF')}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsChatMenuOpen(false);
                            setIsMoreSubmenuOpen(false);
                            setIsRoomMembersModalOpen(true);
                          }}
                          className="w-full px-3.5 py-2 flex items-center gap-2 text-[11px] font-extrabold text-[#38BDF8] hover:bg-[#1E293B] cursor-pointer"
                        >
                          <Users className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{language === 'ur' ? 'روم ممبران کنٹرول' : 'Room Members Control'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Offline Queue & Error Banners inside Full-Screen Chat */}
          {(!isOnline || queuedMessageCount > 0) && (
            <div className="relative z-10 mx-3 mt-2 p-2.5 rounded-xl bg-amber-950/80 border border-[#D4AF37]/40 text-amber-200 text-xs font-semibold flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <WifiOff className="w-4 h-4 text-[#F5D061] shrink-0" />
                <span>{translate(language, 'chatOfflineBanner')}</span>
              </div>
              {queuedMessageCount > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-amber-500 text-[#0A0D12] font-extrabold text-[10px] shrink-0">
                  {queuedMessageCount} {language === 'ur' ? 'قطار میں' : 'Queued'}
                </span>
              )}
            </div>
          )}

          {chatError && (
            <div className="relative z-10 mx-3 mt-2 p-2.5 rounded-xl bg-rose-950/85 border border-rose-500/50 text-rose-200 text-xs font-semibold flex items-center justify-between gap-2 shrink-0">
              <span>{chatError}</span>
              <button type="button" onClick={() => setChatError(null)} className="p-1 cursor-pointer shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {micHint && (
            <div className="relative z-10 mx-3 mt-2 p-2.5 rounded-xl bg-[#161D2C]/95 border border-[#D4AF37]/40 text-[#F5D061] text-xs font-medium flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <Mic className="w-3.5 h-3.5 shrink-0 text-[#F5D061]" />
                <span>{micHint}</span>
              </div>
              <button type="button" onClick={() => setMicHint(null)} className="p-1 cursor-pointer shrink-0 text-slate-300 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Sticky Founder Pinned Message Banner */}
          {pinnedMessage && (
            <div className="relative z-10 px-3.5 py-2 bg-[#1A1508]/85 border-b border-[#F5D061]/45 flex items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={() => scrollToMessageId(pinnedMessage.id)}
                className="flex items-center gap-2 min-w-0 text-left flex-1 cursor-pointer"
              >
                <Pin className="w-3.5 h-3.5 text-[#F5D061] shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#F5D061] block">
                    {translate(language, 'pinnedMessageLabel')} · {pinnedMessage.senderName}
                  </span>
                  <p className="text-xs text-slate-100 truncate">
                    {pinnedMessage.text}
                  </p>
                </div>
              </button>

              {isFounder && (
                <button
                  type="button"
                  onClick={() => runDebouncedAction(() => togglePinCommunityMessage(pinnedMessage.id))}
                  className="px-2 py-1 rounded-lg bg-[#2A210B] text-[#F5D061] border border-[#D4AF37]/40 text-[10px] font-bold shrink-0 cursor-pointer"
                >
                  {language === 'ur' ? 'ان پن' : 'Unpin'}
                </button>
              )}
            </div>
          )}

          {/* In-Chat Search Bar (Community Room) */}
          {isCommunitySearchOpen && (
            <div className="relative z-20 px-3 py-2 bg-[#0F172A]/95 border-b border-[#D4AF37]/30 flex items-center gap-2 shrink-0">
              <Search className="w-4 h-4 text-[#F5D061] shrink-0" />
              <input
                type="text"
                autoFocus
                value={communitySearchQuery}
                onChange={(e) => setCommunitySearchQuery(e.target.value)}
                placeholder={language === 'ur' ? 'پیغام یا نام تلاش کریں...' : 'Search messages or sender...'}
                className="flex-1 min-w-0 bg-[#090D16] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#38BDF8]"
              />
              {commSearchNorm && (
                <span className="text-[10px] font-mono font-bold text-[#38BDF8] shrink-0 tabular-nums">
                  {visibleCommunityMessages.length}
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsCommunitySearchOpen(false);
                  setCommunitySearchQuery('');
                }}
                className="p-1 text-slate-400 hover:text-white cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Community Feed (Transparent over Scenic Wallpaper) + Floating Scroll-to-Bottom Button */}
          <div className="relative z-10 flex-1 min-h-0 w-full flex flex-col">
            <div
              ref={communityFeedRef}
              onScroll={(e) => {
                const el = e.currentTarget;
                const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
                setShowCommScrollBottom(distFromBottom > 140);
              }}
              className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden bg-transparent px-2.5 py-3 sm:p-5 space-y-3.5"
            >
            {visibleCommunityMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="w-14 h-14 rounded-2xl bg-[#111622] border border-[#D4AF37]/40 flex items-center justify-center mb-3">
                  <Globe className="w-7 h-7 text-[#F5D061]" />
                </div>
                <p className="text-sm font-bold text-white">
                  {commSearchNorm
                    ? (language === 'ur' ? 'کوئی مماثل پیغام نہیں ملا' : 'No matching messages found')
                    : (language === 'ur' ? 'لائیو کمیونٹی روم میں خوش آمدید' : 'Welcome to the Live Community Room')}
                </p>
                {!commSearchNorm && (
                  <p className="text-xs text-slate-300 max-w-sm mt-1">
                    {language === 'ur'
                      ? 'سلام دعا، 60 سیکنڈ کا وائس نوٹ یا خوبصورت اسلامی کارڈ نیچے سے بھیجیں۔'
                      : 'Share greetings, send 60s voice notes, or send an animated Islamic card below.'}
                  </p>
                )}
              </div>
            ) : (
              visibleCommunityMessages.map((msg, idx) => {
                const isMine = msg.senderId === currentUser.id;
                const authorRecord = getUserRecord(msg.senderId);
                const msgIsFounder = Boolean(
                  msg.senderIsFounder ||
                  isFounderIdentity(authorRecord)
                );
                const msgIsAudit = Boolean(msg.senderIsAuditOfficer || authorRecord?.isAuditOfficer);
                const avatarSrc = authorRecord?.photoUrl || authorRecord?.avatarUrl;
                const isAuthorMuted = Boolean(authorRecord?.isMutedInChat);
                const authorOnline = authorRecord
                  ? isUserActuallyOnline(authorRecord, presenceNowMs)
                  : false;

                const isPermanentlyDeleted = Boolean(msg.isDeletedForEveryone || msg.isDeleted);
                const targetRank = getRoleHierarchyRank(authorRecord?.role || msg.senderRole, msgIsFounder);
                const canDeleteForEveryone = Boolean(
                  !isPermanentlyDeleted &&
                    (isFounder || (!msgIsFounder && (isMine || (actorRank >= 2 && actorRank >= targetRank))))
                );

                const canMuteThisAuthor =
                  canMuteUsers &&
                  authorRecord &&
                  authorRecord.id !== currentUser.id &&
                  !msgIsFounder &&
                  (authorRecord.role !== 'SUPER_ADMIN' || isFounder);

                const dayKey = getCalendarDayKey(msg.timestamp);
                const prevDayKey = idx > 0 ? getCalendarDayKey(visibleCommunityMessages[idx - 1].timestamp) : null;
                const showDateDivider = idx === 0 || dayKey !== prevDayKey;

                const msgResolvedTabbar = resolveUserTabbar({
                  tabbarId: msg.senderTabbarId ?? authorRecord?.tabbarId,
                  tabbarEnglish: msg.senderTabbarEnglish ?? authorRecord?.tabbarEnglish,
                  tabbarUrdu: msg.senderTabbarUrdu ?? authorRecord?.tabbarUrdu,
                });
                const msgIsFaizKhel = msgResolvedTabbar?.id === 'faiz_khel';

                const bubbleContainerClass = isPermanentlyDeleted
                  ? 'bg-[#0D1320]/90 border-slate-700/60 text-slate-400'
                  : msgIsFounder
                  ? getFounderBubbleStyle(msg.senderBubbleColor || appSettings.founderBubbleColor)
                  : msg.isHighlighted
                  ? 'bg-gradient-to-br from-[#231D0B] to-[#131C31] border-[#F5D061] shadow-[0_0_16px_rgba(212,175,55,0.2)]'
                  : msgIsFaizKhel
                  ? 'bg-gradient-to-br from-[#2B1F06] via-[#42300A] to-[#1C1404] border-[1.5px] border-[#FDE047] text-[#F8FAFC] shadow-[0_4px_20px_rgba(253,224,71,0.28),inset_0_1px_0_rgba(254,240,138,0.28)]'
                  : isMine
                  ? 'bg-gradient-to-br from-[#131C31] to-[#1E293B] border-[#38BDF8]/40 text-[#F8FAFC]'
                  : 'bg-[#131C31]/95 border-slate-400/20 text-[#F8FAFC]';

                const isHighlightedTarget = highlightedMessageId === msg.id;
                const swipeDelta = swipingMsgId === msg.id ? swipeOffsetX : 0;

                return (
                  <React.Fragment key={msg.id}>
                    {showDateDivider && (
                      <div className="flex justify-center my-2">
                        <span className="px-3 py-0.5 rounded-full bg-[#090D16]/90 border border-[#D4AF37]/35 text-[10px] font-bold text-[#F5D061] shadow">
                          {formatChatDateDivider(msg.timestamp, language)}
                        </span>
                      </div>
                    )}
                    <div
                      data-msg-id={msg.id}
                      ref={(el) => {
                        communityMessageRefs.current[msg.id] = el;
                      }}
                      onTouchStart={(e) => handleBubbleTouchStart(e, msg, 'COMMUNITY')}
                      onTouchMove={handleBubbleTouchMove}
                      onTouchEnd={handleBubbleTouchEnd}
                      onTouchCancel={handleBubbleTouchEnd}
                      style={{
                        transform: swipeDelta > 0 ? `translate3d(${swipeDelta}px, 0, 0)` : undefined
                      }}
                      className={`flex items-start gap-2 w-full min-w-0 transition-transform duration-150 ${
                        isMine ? 'flex-row-reverse' : 'flex-row'
                      } ${isHighlightedTarget ? 'rounded-2xl ring-2 ring-[#F5D061] bg-[#F5D061]/10 p-1' : ''}`}
                    >
                      {/* Sender Avatar (clicks to inspect profile) */}
                      <button
                        type="button"
                        onClick={() => authorRecord && setInspectedUserProfile(authorRecord)}
                        className="relative shrink-0 mt-0.5 cursor-pointer"
                        title={authorRecord ? `${msg.senderName}` : msg.senderName}
                      >
                        {avatarSrc ? (
                          <img
                            src={avatarSrc}
                            alt={msg.senderName}
                            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border-2 ${
                              msgIsFounder || msgIsFaizKhel ? 'border-[#FDE047]' : 'border-[#38BDF8]/45'
                            }`}
                          />
                        ) : (
                          <div
                            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-extrabold text-xs border-2 ${
                              msgIsFounder
                                ? 'bg-gradient-to-br from-[#F5D061] to-[#9E7322] text-[#090D16] border-[#F5D061]'
                                : msgIsFaizKhel
                                ? 'bg-[#1C1404] text-[#FEF08A] border-[#FDE047]'
                                : 'bg-[#131C31] text-[#38BDF8] border-[#38BDF8]/40'
                            }`}
                          >
                            {msg.senderName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {authorRecord && (
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-[#090D16] ${
                              authorOnline ? 'bg-emerald-500' : 'bg-slate-500'
                            }`}
                          />
                        )}
                      </button>

                      {/* Message Bubble */}
                      <div className={`flex flex-col min-w-0 max-w-[calc(100%-2.75rem)] sm:max-w-[74%] ${isMine ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-full min-w-0 rounded-2xl border px-3 py-2.5 text-xs text-[#F8FAFC] space-y-2 ${bubbleContainerClass}`}>
                          {/* Wrapped Header: Name + RoleBadge + TabbarBadge */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            {msgIsFounder && (
                              <span className="text-[11px]" title="Founder VIP">
                                👑
                              </span>
                            )}
                            {!msgIsFounder && msgIsFaizKhel && (
                              <FaizKhelVipCrownIcon className="w-[22px] h-[22px]" />
                            )}
                            <span
                              className={`font-extrabold text-xs ${
                                msgIsFounder
                                  ? 'text-[#F5D061]'
                                  : msgIsFaizKhel
                                  ? 'text-[#FEF08A]'
                                  : 'text-[#38BDF8]'
                              }`}
                            >
                              {msg.senderName}
                            </span>
                            <RoleBadge
                              role={msg.senderRole}
                              isFounder={msgIsFounder}
                              isAuditOfficer={msgIsAudit}
                              compact
                            />
                            <TabbarBadge
                              user={authorRecord}
                              tabbarId={msg.senderTabbarId || authorRecord?.tabbarId}
                              tabbarEnglish={msg.senderTabbarEnglish || authorRecord?.tabbarEnglish}
                              tabbarUrdu={msg.senderTabbarUrdu || authorRecord?.tabbarUrdu}
                              language={language}
                              compact
                            />
                            {msg.isHighlighted && !msgIsFounder && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#F5D061]/20 border border-[#F5D061]/50 text-[#F5D061] text-[9px] font-bold">
                                ✨ {language === 'ur' ? 'نمایاں' : 'Highlighted'}
                              </span>
                            )}
                            {msg.isPinned && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#F5D061] text-[#0A0D12] text-[9px] font-extrabold">
                                📌 {translate(language, 'pinnedBadge')}
                              </span>
                            )}
                          </div>

                        {isPermanentlyDeleted ? (
                          <div className="space-y-1.5 py-0.5">
                            <p className="text-xs italic text-slate-400 leading-relaxed">
                              {renderDeletedPlaceholderText(msg, language)}
                            </p>
                            <div className="flex items-center justify-end text-[10px] font-mono text-slate-500">
                              <span>
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        ) : (
                        <>
                        {msg.forwardedFrom && (
                          <div className="inline-flex items-center gap-1 text-[10px] italic font-semibold text-[#F5D061]/90">
                            <Forward className="w-3 h-3 shrink-0" />
                            <span>
                              {language === 'ur' ? `فارورڈ از ${msg.forwardedFrom}` : `Forwarded from ${msg.forwardedFrom}`}
                            </span>
                          </div>
                        )}

                        {/* Replied-to Quote */}
                        {msg.replyTo && (
                          <button
                            type="button"
                            onClick={() => scrollToMessageId(msg.replyTo!.id, 'COMMUNITY')}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg bg-black/35 border-l-2 border-[#F5D061] text-[11px] cursor-pointer"
                          >
                            <span className="font-bold text-[#F5D061] block truncate">
                              ↩️ {msg.replyTo.senderName}
                            </span>
                            <span className="text-slate-300 line-clamp-2">
                              {msg.replyTo.isVoiceNote ? '🎤 Voice Note' : msg.replyTo.text}
                            </span>
                          </button>
                        )}

                        {/* Islamic GIF Card */}
                        {msg.islamicGifId && (
                          <IslamicGifCard gifId={msg.islamicGifId} />
                        )}

                        {/* Voice Note Player */}
                        {msg.voiceNote && (
                          <VoiceNotePlayer voiceNote={msg.voiceNote} />
                        )}

                        {/* Text Content with auto-linked URLs & Phone numbers */}
                        {msg.text && !msg.islamicGifId && !msg.voiceNote && (
                          <p className="leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-slate-100">
                            {renderLinkedText(msg.text)}
                          </p>
                        )}

                        {/* Photo Attachment */}
                        {msg.attachmentUrl && (
                          <button
                            type="button"
                            onClick={() => setPreviewImageUrl(msg.attachmentUrl!)}
                            className="block rounded-xl overflow-hidden border border-[#D4AF37]/40 cursor-pointer"
                          >
                            <img
                              src={msg.attachmentUrl}
                              alt={msg.attachmentName || 'Shared media'}
                              className="max-h-56 w-auto max-w-full object-cover"
                            />
                          </button>
                        )}

                        {/* Reactions + Timestamp Row */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/10">
                          <div className="flex flex-wrap items-center gap-1">
                            {QUICK_REACTIONS.map(emoji => {
                              const reactors = msg.reactions?.[emoji] || [];
                              const iReacted = reactors.includes(currentUser.id);
                              return (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => toggleCommunityReaction(msg.id, emoji)}
                                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] border transition-colors cursor-pointer ${
                                    iReacted
                                      ? 'bg-[#F5D061]/25 border-[#F5D061] text-[#F5D061] font-bold'
                                      : 'bg-black/30 border-white/10 text-slate-300 hover:border-[#D4AF37]/40'
                                  }`}
                                >
                                  <span>{emoji}</span>
                                  {reactors.length > 0 && <span>{reactors.length}</span>}
                                </button>
                              );
                            })}
                          </div>

                          <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-300/85">
                            <span>
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isMine && renderDeliveryTick(msg)}
                          </div>
                        </div>
                        </>
                        )}
                      </div>

                      {/* Message Moderation, Reply, Copy, Forward & Delete Actions */}
                      <div className={`flex flex-wrap items-center gap-1.5 mt-1 px-0.5 text-[10px] max-w-full ${isMine ? 'justify-end' : 'justify-start'}`}>
                        {!isPermanentlyDeleted && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                setReplyingTo({
                                  id: msg.id,
                                  senderName: msg.senderName,
                                  text: msg.text,
                                  isVoiceNote: Boolean(msg.voiceNote)
                                })
                              }
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#111622]/90 border border-slate-700/80 text-slate-300 hover:text-[#F5D061] cursor-pointer"
                            >
                              <Reply className="w-3 h-3" />
                              <span>{language === 'ur' ? 'جواب' : 'Reply'}</span>
                            </button>

                            {msg.text && !msg.islamicGifId && !msg.voiceNote && (
                              <button
                                type="button"
                                onClick={() => handleCopyMessageText(msg.text)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#111622]/90 border border-slate-700/80 text-slate-300 hover:text-[#38BDF8] cursor-pointer"
                              >
                                <Copy className="w-3 h-3" />
                                <span>{language === 'ur' ? 'کاپی' : 'Copy'}</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setForwardSearch('');
                                setForwardingMessage(msg);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#111622]/90 border border-slate-700/80 text-slate-300 hover:text-[#F5D061] cursor-pointer"
                            >
                              <Forward className="w-3 h-3" />
                              <span>{language === 'ur' ? 'فارورڈ' : 'Forward'}</span>
                            </button>

                            {isFounder && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => toggleHighlightCommunityMessage(msg.id)}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border cursor-pointer ${
                                    msg.isHighlighted
                                      ? 'bg-[#F5D061]/20 border-[#F5D061] text-[#F5D061] font-bold'
                                      : 'bg-[#111622]/90 border-slate-700/80 text-slate-300 hover:text-[#F5D061]'
                                  }`}
                                >
                                  <Sparkles className="w-3 h-3" />
                                  <span>
                                    {msg.isHighlighted
                                      ? (language === 'ur' ? 'نمایاں ختم' : 'Unhighlight')
                                      : (language === 'ur' ? 'نمایاں کریں' : 'Highlight')}
                                  </span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => runDebouncedAction(() => togglePinCommunityMessage(msg.id))}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border cursor-pointer ${
                                    msg.isPinned
                                      ? 'bg-[#F5D061] border-[#F5D061] text-[#0A0D12] font-bold'
                                      : 'bg-[#111622]/90 border-slate-700/80 text-slate-300 hover:text-[#F5D061]'
                                  }`}
                                >
                                  <Pin className="w-3 h-3" />
                                  <span>
                                    {msg.isPinned
                                      ? (language === 'ur' ? 'ان پن' : 'Unpin')
                                      : (language === 'ur' ? 'پن کریں' : 'Pin')}
                                  </span>
                                </button>
                              </>
                            )}
                          </>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            if (isPermanentlyDeleted) {
                              void clearDeletedCommunityMessageGlobally(msg.id).then((res) => {
                                if (!res.success && res.error) setChatError(res.error);
                              });
                              return;
                            }
                            setDeleteModalTarget({
                              scope: 'COMMUNITY',
                              msg,
                              canDeleteForEveryone
                            });
                          }}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#111622]/90 border border-rose-500/35 text-rose-300 hover:bg-rose-950/60 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>{isPermanentlyDeleted ? (language === 'ur' ? 'صاف کریں' : 'Clear') : translate(language, 'deleteLabel')}</span>
                        </button>

                        {!isPermanentlyDeleted && canMuteThisAuthor && authorRecord && (
                          <button
                            type="button"
                            onClick={() => {
                              const res = muteChatUser(authorRecord.id, !isAuthorMuted);
                              if (!res.success && res.error) setChatError(res.error);
                            }}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border cursor-pointer ${
                              isAuthorMuted
                                ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                                : 'bg-[#111622]/90 border-amber-500/40 text-amber-300'
                            }`}
                          >
                            {isAuthorMuted ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                            <span>
                              {isAuthorMuted
                                ? (language === 'ur' ? 'ان میوٹ' : 'Unmute')
                                : (language === 'ur' ? 'خاموش کریں' : 'Mute')}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  </React.Fragment>
                );
              })
            )}
            <div ref={communityEndRef} />
            </div>

            {showCommScrollBottom && (
              <button
                type="button"
                onClick={() => communityEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
                aria-label="Scroll to latest messages"
                className="absolute right-3 bottom-3 z-30 w-10 h-10 rounded-full kc-gold-button shadow-xl flex items-center justify-center cursor-pointer kc-pressable"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Live Typing Indicator Banner (Community Room) */}
          {activeCommunityTypers.length > 0 && (
            <div className="relative z-10 px-3.5 py-1.5 bg-[#0F172A]/90 border-t border-[#38BDF8]/20 text-[11px] font-semibold text-[#38BDF8] flex items-center gap-2 shrink-0">
              <span className="inline-flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] animate-bounce" style={{ animationDelay: '0.15s' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] animate-bounce" style={{ animationDelay: '0.3s' }} />
              </span>
              <span className="truncate">
                {activeCommunityTypers.length === 1
                  ? (language === 'ur'
                      ? `${activeCommunityTypers[0].userName} لکھ رہے ہیں...`
                      : `${activeCommunityTypers[0].userName} is typing...`)
                  : (language === 'ur'
                      ? `${activeCommunityTypers[0].userName} اور ${activeCommunityTypers.length - 1} دیگر لکھ رہے ہیں...`
                      : `${activeCommunityTypers[0].userName} & ${activeCommunityTypers.length - 1} other typing...`)}
              </span>
            </div>
          )}

          {/* Copy / Forward Confirmation Toast */}
          {copiedToast && (
            <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[10005] px-3.5 py-1.5 rounded-full bg-[#090D16]/95 border border-[#F5D061]/60 text-xs font-bold text-[#F5D061] shadow-xl">
              {copiedToast}
            </div>
          )}

          {/* Drawers & Previews above Composer */}
          {showIslamicGifDrawer && !isUserMutedInCommunity && (
            <div className="relative z-10 p-3 bg-black/75 border-t border-[#D4AF37]/30 max-h-56 overflow-y-auto shrink-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold text-[#F5D061]">
                  {language === 'ur' ? '☪️ اینیمیٹڈ اسلامی کارڈ بھیجیں' : '☪️ Send Animated Islamic Card'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowIslamicGifDrawer(false)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ISLAMIC_GIFS.map(gif => (
                  <button
                    key={gif.id}
                    type="button"
                    onClick={() => handleSendIslamicGif(gif.id)}
                    className="text-left hover:scale-[1.01] transition-transform cursor-pointer"
                  >
                    <IslamicGifCard gifId={gif.id} compact />
                  </button>
                ))}
              </div>
            </div>
          )}

          {showEmojiStrip && !isUserMutedInCommunity && (
            <div className="relative z-10 px-3 py-2 bg-black/75 border-t border-[#D4AF37]/25 flex flex-wrap items-center gap-2 shrink-0">
              {QUICK_EMOJIS.map(em => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setCommunityText(prev => `${prev}${em}`)}
                  className="px-2 py-1 rounded-lg bg-[#161D2C] hover:bg-[#1E273B] text-sm cursor-pointer"
                >
                  {em}
                </button>
              ))}
            </div>
          )}

          {replyingTo && (
            <div className="relative z-10 px-3.5 py-2 bg-[#161D2C]/95 border-t border-[#D4AF37]/35 flex items-center justify-between gap-2 text-xs shrink-0">
              <div className="min-w-0">
                <span className="font-bold text-[#F5D061] block">
                  {language === 'ur' ? `${replyingTo.senderName} کو جواب:` : `Replying to ${replyingTo.senderName}`}
                </span>
                <span className="text-slate-300 truncate block">
                  {replyingTo.isVoiceNote ? (language === 'ur' ? '🎤 وائس نوٹ' : '🎤 Voice Note') : replyingTo.text}
                </span>
              </div>
              <button type="button" onClick={() => setReplyingTo(null)} className="p-1 text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {communityAttachment && (
            <div className="relative z-10 px-3.5 py-2 bg-[#161D2C]/95 border-t border-[#D4AF37]/35 flex items-center justify-between gap-2 text-xs text-[#F5D061] shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={communityAttachment.url}
                  alt={communityAttachment.name}
                  className="w-8 h-8 rounded-lg object-cover border border-[#D4AF37]/50 shrink-0"
                />
                <div className="min-w-0">
                  <span className="truncate font-semibold block">{communityAttachment.name}</span>
                  <span className="text-[10px] text-emerald-300 block">
                    {communityAttachment.name.toLowerCase().endsWith('.gif')
                      ? (language === 'ur' ? 'GIF تیار ہے · بھیجیں دبائیں ➤' : 'GIF Ready · Tap Send ➤')
                      : (language === 'ur' ? 'فائل تیار ہے · بھیجیں دبائیں ➤' : 'Optimized <750KB · Tap Send ➤')}
                  </span>
                </div>
              </div>
              <button type="button" onClick={() => setCommunityAttachment(null)} className="p-1 cursor-pointer shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {speech.isListening && dictationTarget === 'COMMUNITY' && !isUserMutedInCommunity && (
            <div className="relative z-10 px-3.5 py-2 bg-[#131C31]/95 border-t border-[#38BDF8]/30 flex items-center justify-between gap-2 text-xs shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 kc-scenic-twinkle shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] font-extrabold text-[#F5D061] block">
                    {language === 'ur' ? 'وائس ڈکٹیشن فعال ہے' : 'Voice Dictation Active'}
                  </span>
                  <span className="text-xs text-[#F8FAFC] truncate block">
                    {speech.interimTranscript
                      ? speech.interimTranscript
                      : (language === 'ur' ? 'اب بولیں — آپ کا پیغام خودکار لکھا جا رہا ہے...' : 'Speak now — transcribing live into message box...')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const next = dictationLocale === 'en-US' ? 'ur-PK' : 'en-US';
                    setDictationLocale(next);
                    speech.startDictation(next);
                  }}
                  className="px-2 py-1 rounded-lg bg-[#090D16] border border-[#38BDF8]/35 text-[#38BDF8] text-[10px] font-bold cursor-pointer"
                  title={language === 'ur' ? 'زبان تبدیل کریں' : 'Switch Dictation Language'}
                >
                  {dictationLocale === 'ur-PK' ? 'اردو' : 'EN'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    speech.stopDictation();
                    setDictationTarget(null);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-950/90 border border-rose-500/60 text-rose-200 text-[10px] font-extrabold cursor-pointer"
                >
                  <Square className="w-2.5 h-2.5 fill-current" />
                  <span>{language === 'ur' ? 'روکیں' : 'Stop'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Composer Area with Protected System Nav Clearance & 2-Step WhatsApp Voice Flow */}
          {requiresProfileCompletion ? (
            <div
              className="relative z-40 p-3 bg-[#090D16]/95 border-t border-slate-400/20 shrink-0"
              style={{
                paddingBottom: isKeyboardOpen ? '12px' : 'calc(env(safe-area-inset-bottom, 16px) + 24px)'
              }}
            >
              <ProfileCompletionGate compact featureName={language === 'ur' ? 'لائیو کمیونٹی چیٹ' : 'Live Community Chat'} />
            </div>
          ) : isUserMutedInCommunity ? (
            <div
              className="relative z-40 p-3 bg-rose-950/90 border-t border-rose-500/45 text-center text-xs font-bold text-rose-200 flex items-center justify-center gap-2 shrink-0"
              style={{
                paddingBottom: isKeyboardOpen ? '12px' : 'calc(env(safe-area-inset-bottom, 16px) + 24px)'
              }}
            >
              <VolumeX className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{translate(language, 'mutedNotice')}</span>
            </div>
          ) : roomFullLockedForMe ? (
            <div
              className="relative z-40 p-3 bg-rose-950/90 border-t border-rose-500/45 text-center text-xs font-bold text-rose-200 flex items-center justify-center gap-2 shrink-0"
              style={{
                paddingBottom: isKeyboardOpen ? '12px' : 'calc(env(safe-area-inset-bottom, 16px) + 24px)'
              }}
            >
              <Lock className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                {isMyRemovedFromRoom
                  ? (language === 'ur' ? 'آپ کو انتظامیہ کی جانب سے اس چیٹ روم سے ہٹا دیا گیا ہے۔' : 'You have been removed from this community room by administration.')
                  : (language === 'ur' ? 'انتظامیہ کی جانب سے پورا کمیونٹی روم اس وقت لاک ہے۔' : 'Community Room is currently locked by administration.')}
              </span>
            </div>
          ) : isRecording ? (
            /* STEP 1: RECORDING BAR (Delete Left · Red Live Timer & Wave Center · Stop Button Right — NEVER Auto-Sends) */
            <div
              className="relative z-40 px-3 pt-3 bg-gradient-to-b from-[#131C31]/95 to-[#090D16] border-t border-slate-400/25 flex items-center justify-between gap-2.5 shrink-0 shadow-[0_-8px_24px_rgba(0,0,0,0.65)]"
              style={{
                paddingBottom: isKeyboardOpen ? '12px' : 'calc(env(safe-area-inset-bottom, 16px) + 24px)'
              }}
            >
              <button
                type="button"
                onClick={() => stopVoiceRecording(true)}
                aria-label={language === 'ur' ? 'ریکارڈنگ حذف کریں' : 'Discard recording'}
                title={language === 'ur' ? 'حذف کریں' : 'Discard Recording'}
                className="relative z-50 min-w-[48px] min-h-[48px] w-12 h-12 rounded-xl bg-rose-950/90 hover:bg-rose-900 border border-rose-500/55 text-rose-200 flex items-center justify-center shrink-0 cursor-pointer kc-pressable"
              >
                <Trash2 className="w-5 h-5" />
              </button>

              <div className="flex-1 min-w-0 flex items-center justify-center gap-2.5 px-3 py-2 rounded-xl bg-[#0F172A] border border-rose-500/45">
                <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse shrink-0" />
                <span className="text-sm font-mono font-extrabold text-rose-400 tabular-nums shrink-0">
                  {formatDuration(recordingSeconds)} / 1:00
                </span>
                <div className="hidden xs:flex items-end gap-0.5 h-5 flex-1 max-w-[110px]" aria-hidden="true">
                  {[40, 85, 55, 95, 65, 80, 45, 90, 60, 75].map((h, i) => (
                    <span
                      key={i}
                      style={{ height: `${h}%`, animationDelay: `${i * 0.08}s` }}
                      className="flex-1 rounded-full bg-rose-400 kc-wave-bar-active"
                    />
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => stopVoiceRecording(false)}
                aria-label={language === 'ur' ? 'ریکارڈنگ روکیں اور سنیں' : 'Stop recording to preview'}
                title={language === 'ur' ? 'روکیں اور پیش نظارہ کریں' : 'Stop & Preview'}
                className="relative z-50 min-w-[48px] min-h-[48px] h-12 px-3.5 rounded-xl kc-gold-button inline-flex items-center justify-center gap-1.5 text-xs font-extrabold shrink-0 cursor-pointer kc-pressable"
              >
                <Square className="w-4 h-4 fill-current shrink-0" />
                <span className="hidden sm:inline">{language === 'ur' ? 'روکیں' : 'Stop'}</span>
              </button>
            </div>
          ) : draftVoiceNote ? (
            /* STEP 2: VOICE NOTE PREVIEW BAR (Delete Left · Play/Pause & Progress Center · Large Send Right) */
            <div
              className="relative z-40 px-3 pt-3 bg-gradient-to-b from-[#131C31]/95 to-[#090D16] border-t border-slate-400/25 flex items-center justify-between gap-2 shrink-0 shadow-[0_-8px_24px_rgba(0,0,0,0.65)]"
              style={{
                paddingBottom: isKeyboardOpen ? '12px' : 'calc(env(safe-area-inset-bottom, 16px) + 24px)'
              }}
            >
              <button
                type="button"
                onClick={discardDraftVoiceNote}
                aria-label={language === 'ur' ? 'وائس نوٹ حذف کریں' : 'Delete voice note'}
                title={language === 'ur' ? 'حذف کریں' : 'Delete'}
                className="relative z-50 min-w-[48px] min-h-[48px] w-12 h-12 rounded-xl bg-rose-950/90 hover:bg-rose-900 border border-rose-500/55 text-rose-200 flex items-center justify-center shrink-0 cursor-pointer kc-pressable"
              >
                <Trash2 className="w-5 h-5" />
              </button>

              <div className="flex-1 min-w-0 flex items-center gap-2.5 px-2.5 py-1.5 rounded-2xl bg-[#0F172A] border border-[#D4AF37]/45">
                <button
                  type="button"
                  onClick={toggleDraftVoicePlay}
                  aria-label={isDraftPlaying ? 'Pause voice preview' : 'Play voice preview'}
                  className="relative z-50 min-w-[48px] min-h-[48px] w-12 h-12 rounded-full bg-[#131C31] hover:bg-[#1E293B] border border-[#F5D061]/70 text-[#F5D061] flex items-center justify-center shrink-0 cursor-pointer kc-pressable"
                >
                  {isDraftPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-end gap-0.5 h-5" aria-hidden="true">
                    {draftVoiceNote.waveform.map((hPct, idx) => {
                      const ratio = (idx + 1) / draftVoiceNote.waveform.length;
                      const prog = draftPlaySec / Math.max(1, draftVoiceNote.durationSec);
                      const filled = isDraftPlaying ? ratio <= prog : true;
                      return (
                        <span
                          key={idx}
                          style={{ height: `${Math.max(22, Math.min(100, hPct))}%` }}
                          className={`flex-1 rounded-full transition-colors ${
                            isDraftPlaying && filled
                              ? 'bg-[#F5D061] kc-wave-bar-active'
                              : filled
                              ? 'bg-[#38BDF8]'
                              : 'bg-slate-700'
                          }`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#F5D061] tabular-nums">
                    <button
                      type="button"
                      onClick={() => setDraftSpeedIdx(prev => (prev + 1) % PLAYBACK_SPEEDS.length)}
                      className="px-1.5 py-0.5 rounded bg-[#131C31] border border-[#38BDF8]/40 text-[#38BDF8] font-extrabold cursor-pointer"
                    >
                      {draftPlaybackSpeed}x
                    </button>
                    <span>{formatDuration(isDraftPlaying ? draftPlaySec : draftVoiceNote.durationSec)}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSendDraftVoiceNote}
                aria-label={language === 'ur' ? 'وائس نوٹ بھیجیں' : 'Send voice note'}
                className="relative z-50 min-w-[48px] min-h-[48px] h-12 px-4 rounded-xl kc-gold-button inline-flex items-center justify-center gap-1.5 text-xs font-extrabold shrink-0 cursor-pointer kc-pressable"
              >
                <Send className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">{translate(language, 'chatSend')}</span>
              </button>
            </div>
          ) : (
            <div
              className="relative z-40 shrink-0 bg-gradient-to-b from-[#131C31]/95 to-[#090D16] border-t border-slate-400/25 shadow-[0_-8px_24px_rgba(0,0,0,0.65)]"
              style={{
                paddingBottom: isKeyboardOpen ? '12px' : 'calc(env(safe-area-inset-bottom, 16px) + 16px)'
              }}
            >
              {(roomTextLockedForMe || roomVoiceLockedForMe) && (
                <div className="px-3 py-1.5 bg-amber-950/85 border-b border-[#D4AF37]/30 text-[11px] font-bold text-[#FDE047] flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {roomTextLockedForMe && roomVoiceLockedForMe
                      ? (language === 'ur' ? 'ٹیکسٹ اور وائس نوٹس انتظامیہ نے بند کر دیے ہیں۔' : 'Messages and voice notes are locked by administration.')
                      : roomTextLockedForMe
                      ? (language === 'ur' ? 'ٹیکسٹ پیغامات انتظامیہ نے بند کر دیے ہیں۔' : 'Text messages are locked by administration.')
                      : (language === 'ur' ? 'وائس نوٹس انتظامیہ نے بند کر دیے ہیں۔' : 'Voice notes are locked by administration.')}
                  </span>
                </div>
              )}
              <form
                onSubmit={handleSendCommunityMessage}
                className="p-2 sm:p-3 pb-0 flex flex-col gap-1.5 w-full max-w-full box-border"
              >
                {/* ROW 1 (TOP): Wide Message Input + Mic + Send Button */}
                <div className="w-full flex items-end gap-1.5 min-w-0">
                  <div className="flex-1 min-w-0 flex flex-col">
                    <textarea
                      ref={communityTextareaRef}
                      rows={1}
                      maxLength={5000}
                      dir="auto"
                      disabled={roomTextLockedForMe}
                      value={communityText}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCommunityText(val);
                        emitTyping('community_global_room', Boolean(val.trim()));
                      }}
                      onBlur={() => emitTyping('community_global_room', false)}
                      onKeyDown={(e) => {
                        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                          e.preventDefault();
                          handleSendCommunityMessage();
                        }
                      }}
                      placeholder={
                        roomTextLockedForMe
                          ? (language === 'ur' ? 'ٹیکسٹ پیغامات فی الحال بند ہیں' : 'Messages locked by administration')
                          : isCompressingMedia
                          ? (language === 'ur' ? 'تصویر/GIF تیار کی جا رہی ہے...' : 'Optimizing image/GIF...')
                          : translate(language, 'chatTypeMessage')
                      }
                      style={{ fontSize: '16px', maxHeight: '120px' }}
                      className="w-full min-h-[44px] resize-none overflow-y-auto px-3.5 py-2.5 text-[16px] leading-[1.35] rounded-xl border border-slate-400/25 bg-[#0F172A] text-[#F8FAFC] placeholder:text-[#94A3B8]/70 disabled:opacity-50 focus:outline-hidden focus:border-[#38BDF8] shadow-[inset_0_2px_6px_rgba(0,0,0,0.45)]"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={roomVoiceLockedForMe}
                    onClick={startVoiceRecording}
                    className="relative z-50 min-w-[44px] min-h-[44px] w-11 h-11 rounded-xl bg-[#0F172A] border border-[#38BDF8]/35 text-[#38BDF8] hover:bg-[#1E293B] disabled:opacity-40 flex items-center justify-center shrink-0 cursor-pointer kc-pressable"
                    title={translate(language, 'voiceNoteHold')}
                    aria-label={translate(language, 'voiceNoteHold')}
                  >
                    <Mic className="w-5 h-5" />
                  </button>

                  <button
                    type="submit"
                    disabled={roomTextLockedForMe || isCompressingMedia || (!communityText.trim() && !communityAttachment)}
                    className="relative z-50 min-w-[44px] min-h-[44px] h-11 px-3.5 flex items-center justify-center gap-1.5 kc-gold-button disabled:opacity-40 font-extrabold text-xs rounded-xl shrink-0 cursor-pointer kc-pressable"
                    aria-label={translate(language, 'chatSend')}
                  >
                    <Send className="w-4 h-4 shrink-0" />
                    <span className="hidden sm:inline">{translate(language, 'chatSend')}</span>
                  </button>
                </div>

                {/* ROW 2 (DIRECTLY BELOW): Emoji, Islamic Cards, Camera, Photo Gallery & Char Counter */}
                <div className="w-full flex items-center justify-between gap-2 px-0.5">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={roomTextLockedForMe}
                      onClick={() => {
                        setShowEmojiStrip(s => !s);
                        setShowIslamicGifDrawer(false);
                      }}
                      className="h-9 px-2.5 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] border border-slate-400/25 text-[#F8FAFC] hover:text-[#38BDF8] disabled:opacity-40 inline-flex items-center justify-center gap-1 text-[11px] font-bold cursor-pointer kc-pressable"
                      title={language === 'ur' ? 'ایموجی' : 'Quick Emojis'}
                      aria-label={language === 'ur' ? 'ایموجی' : 'Quick Emojis'}
                    >
                      <Smile className="w-4 h-4 text-[#F5D061]" />
                      <span className="hidden xs:inline">{language === 'ur' ? 'ایموجی' : 'Emoji'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={roomTextLockedForMe}
                      onClick={() => {
                        setShowIslamicGifDrawer(d => !d);
                        setShowEmojiStrip(false);
                      }}
                      className="h-9 px-2.5 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-[#F5D061] border border-slate-400/25 disabled:opacity-40 inline-flex items-center justify-center gap-1 text-[11px] font-bold cursor-pointer kc-pressable"
                      title={translate(language, 'islamicGifs')}
                      aria-label={translate(language, 'islamicGifs')}
                    >
                      <span className="text-sm leading-none">☪️</span>
                      <span className="hidden xs:inline">{language === 'ur' ? 'اسلامی کارڈ' : 'Islamic'}</span>
                    </button>

                    {canUploadGallery && !roomTextLockedForMe && (
                      <>
                        <label
                          className="h-9 px-2.5 rounded-lg bg-[#0F172A] text-[#F5D061] border border-[#D4AF37]/40 hover:bg-[#1E293B] inline-flex items-center justify-center gap-1 text-[11px] font-bold cursor-pointer kc-pressable"
                          title={language === 'ur' ? 'کیمرہ سے تصویر کھینچیں' : 'Take Photo with Camera'}
                        >
                          <Camera className="w-4 h-4" />
                          <span className="hidden sm:inline">{language === 'ur' ? 'کیمرہ' : 'Camera'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleGalleryMediaUpload}
                            disabled={isCompressingMedia}
                            className="hidden"
                          />
                        </label>

                        <label
                          className="h-9 px-2.5 rounded-lg bg-[#0F172A] text-[#38BDF8] border border-[#38BDF8]/35 hover:bg-[#1E293B] inline-flex items-center justify-center gap-1 text-[11px] font-bold cursor-pointer kc-pressable"
                          title={language === 'ur' ? 'فون گیلری تصویر / GIF اپ لوڈ کریں' : 'Gallery Photo / GIF Upload (Up to 10MB)'}
                        >
                          <ImageIcon className="w-4 h-4" />
                          <span className="hidden sm:inline">{language === 'ur' ? 'گیلری' : 'Gallery'}</span>
                          <input
                            type="file"
                            accept="image/*,.gif"
                            onChange={handleGalleryMediaUpload}
                            disabled={isCompressingMedia}
                            className="hidden"
                          />
                        </label>
                      </>
                    )}
                  </div>

                  {communityText.length >= 4000 && (
                    <span className="text-[10px] font-mono font-bold text-[#F5D061] tabular-nums px-2 py-0.5 rounded-md bg-[#0F172A] border border-[#D4AF37]/40 shrink-0">
                      {communityText.length.toLocaleString()} / 5,000
                    </span>
                  )}
                </div>
              </form>
            </div>
          )}
        </div>,
        document.body
      )}

      {/* ============================================================
          MODE 2: DIRECT MESSAGES (EXISTING 1-TO-1 FLOW PRESERVED)
          ============================================================ */}
      {chatMode === 'DIRECT' && (
        <div className="bg-[#111622] rounded-2xl border border-[#D4AF37]/25 shadow-xl overflow-hidden flex flex-col md:flex-row h-[calc(100dvh-265px)] min-h-[450px]">
          {/* Left Side: Directory & Active Chats */}
          <div className={`${mobileShowThread && activeRecipient ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 border-r border-[#D4AF37]/20 flex-col bg-[#0A0D12]/80 h-full`}>
            <div className="p-3 border-b border-slate-800 space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={translate(language, 'chatSearchPlaceholder')}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-700 bg-[#111622] text-white focus:outline-hidden focus:border-[#D4AF37]"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto text-[11px] pb-1">
                {(['ALL', 'SUPER_ADMIN', 'ADMIN', 'CO_ADMIN', 'MEMBER'] as const).map(role => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setSelectedUserFilterRole(role)}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                      selectedUserFilterRole === role
                        ? 'kc-gold-button font-bold'
                        : 'bg-[#161D2C] text-slate-300 border border-slate-800'
                    }`}
                  >
                    {role === 'ALL'
                      ? translate(language, 'allLabel')
                      : role === 'SUPER_ADMIN'
                      ? translate(language, 'roleSuperAdmin')
                      : role === 'ADMIN'
                      ? translate(language, 'roleAdmin')
                      : role === 'CO_ADMIN'
                      ? translate(language, 'roleCoAdmin')
                      : translate(language, 'roleMember')}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/70">
              {availableUsers.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  {translate(language, 'noConversations')}
                </div>
              ) : (
                availableUsers.map(user => {
                  const isSelected = activeRecipient?.id === user.id;
                  const pairId = `chat_${[currentUser.id, user.id].sort()[0]}_${[currentUser.id, user.id].sort()[1]}`;
                  const convo = chats.find(c => c.id === pairId);
                  const unreadForMe = convo?.unreadCounts?.[currentUser.id] || 0;
                  const userAvatar = user.photoUrl || user.avatarUrl;
                  const isMemberOnline = isUserActuallyOnline(user, presenceNowMs);

                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => {
                        setActiveChatUser(user);
                        setMobileShowThread(true);
                      }}
                      className={`w-full p-3 text-left flex items-start gap-3 transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#161D2C] border-l-4 border-[#F5D061]'
                          : 'hover:bg-[#111622]'
                      }`}
                    >
                      <div className="relative shrink-0">
                        {userAvatar ? (
                          <img
                            src={userAvatar}
                            alt={user.name}
                            className="w-10 h-10 rounded-full object-cover border border-[#D4AF37]/40"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[#131C31] text-[#38BDF8] flex items-center justify-center font-bold text-sm border border-[#38BDF8]/40">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span
                          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0A0D12] ${
                            isMemberOnline ? 'bg-emerald-500' : 'bg-slate-500'
                          }`}
                          title={isMemberOnline ? translate(language, 'online') : translate(language, 'offline')}
                        />
                        {unreadForMe > 0 && (
                          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#F5D061] text-[#0A0D12] text-[10px] font-extrabold flex items-center justify-center">
                            {unreadForMe}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center flex-wrap gap-1.5">
                          <span className="font-semibold text-xs text-white truncate">
                            {user.name}
                          </span>
                          <RoleBadge
                            role={user.role}
                            isFounder={user.isFounder}
                            isAuditOfficer={user.isAuditOfficer}
                            compact
                          />
                          <TabbarBadge user={user} language={language} compact />
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                              isMemberOnline
                                ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/35'
                                : 'bg-slate-900 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {isMemberOnline
                              ? `🟢 ${translate(language, 'online')}`
                              : `⚫ ${translate(language, 'offline')}`}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5 truncate">
                          <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span className="truncate">{user.cityTown || user.district || 'Pakistan'}{user.stateProvince ? `, ${user.stateProvince}` : ''}</span>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Side: Direct Message Thread Viewport */}
          <div className={`${mobileShowThread && activeRecipient ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-[#111622] h-full min-w-0 max-w-full overflow-x-hidden`}>
            {activeRecipient ? (
              <>
                <div className="p-3 border-b border-[#D4AF37]/20 flex items-center justify-between gap-2 bg-[#0A0D12]/60 shrink-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => setMobileShowThread(false)}
                      className="md:hidden p-1.5 rounded-lg bg-[#161D2C] text-slate-200 shrink-0 cursor-pointer"
                      title={language === 'ur' ? 'فہرست پر واپس جائیں' : 'Back to Contacts'}
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>

                    <div className="relative shrink-0">
                      {(activeRecipient.photoUrl || activeRecipient.avatarUrl) ? (
                        <img
                          src={activeRecipient.photoUrl || activeRecipient.avatarUrl}
                          alt={activeRecipient.name}
                          className="w-9 h-9 rounded-full object-cover border border-[#D4AF37]/40"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-[#131C31] text-[#38BDF8] flex items-center justify-center font-bold text-sm border border-[#38BDF8]/40">
                          {activeRecipient.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span
                        className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#0A0D12] ${
                          isUserActuallyOnline(activeRecipient, presenceNowMs)
                            ? 'bg-emerald-500'
                            : 'bg-slate-500'
                        }`}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-bold text-sm text-white truncate">
                          {activeRecipient.name}
                        </h3>
                        <RoleBadge
                          role={activeRecipient.role}
                          isFounder={activeRecipient.isFounder}
                          isAuditOfficer={activeRecipient.isAuditOfficer}
                          compact
                        />
                        <TabbarBadge user={activeRecipient} language={language} compact />
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            isUserActuallyOnline(activeRecipient, presenceNowMs)
                              ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/35'
                              : 'bg-slate-900 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {isUserActuallyOnline(activeRecipient, presenceNowMs)
                            ? `🟢 ${translate(language, 'online')}`
                            : `⚫ ${translate(language, 'offline')}`}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="truncate">{activeRecipient.cityTown || activeRecipient.district || 'Pakistan'}{activeRecipient.stateProvince ? `, ${activeRecipient.stateProvince}` : ''}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setIsDirectSearchOpen(prev => {
                          const next = !prev;
                          if (!next) setDirectSearchQuery('');
                          return next;
                        });
                      }}
                      className="p-1.5 rounded-xl border border-[#D4AF37]/30 bg-[#161D2C] hover:bg-slate-800 text-[#F5D061] cursor-pointer"
                      title={language === 'ur' ? 'تلاش کریں' : 'Search Chat'}
                      aria-label="Search Direct Chat"
                    >
                      <Search className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setInspectedUserProfile(activeRecipient)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[#D4AF37]/30 bg-[#161D2C] hover:bg-slate-800 text-slate-200 text-xs font-medium shrink-0 cursor-pointer"
                    >
                      <UserIcon className="w-3.5 h-3.5 text-[#F5D061]" />
                      <span className="hidden sm:inline">{language === 'ur' ? 'پروفائل' : 'Profile'}</span>
                    </button>
                  </div>
                </div>

                {isDirectSearchOpen && (
                  <div className="px-3 py-2 bg-[#090D16] border-b border-[#D4AF37]/25 flex items-center gap-2 shrink-0">
                    <Search className="w-3.5 h-3.5 text-[#F5D061] shrink-0" />
                    <input
                      type="text"
                      autoFocus
                      value={directSearchQuery}
                      onChange={(e) => setDirectSearchQuery(e.target.value)}
                      placeholder={language === 'ur' ? 'اس گفتگو میں تلاش کریں...' : 'Search in this conversation...'}
                      className="flex-1 min-w-0 bg-[#111622] border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#38BDF8]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsDirectSearchOpen(false);
                        setDirectSearchQuery('');
                      }}
                      className="p-1 text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="relative flex-1 min-h-0 flex flex-col bg-[#0A0D12]/40">
                  <div
                    ref={directFeedRef}
                    onScroll={(e) => {
                      const el = e.currentTarget;
                      const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
                      setShowDirectScrollBottom(distFromBottom > 140);
                    }}
                    className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 space-y-3"
                  >
                  {(() => {
                    const dmQ = directSearchQuery.trim().toLowerCase();
                    const filteredDirect = dmQ
                      ? currentDirectMessages.filter(
                          m => !m.isDeletedForEveryone && !m.isDeleted && m.text && m.text.toLowerCase().includes(dmQ)
                        )
                      : currentDirectMessages;

                    if (filteredDirect.length === 0) {
                      return (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                          <MessageSquare className="w-10 h-10 text-[#D4AF37]/40 mb-2" />
                          <p className="text-xs font-semibold text-slate-300">
                            {dmQ
                              ? (language === 'ur' ? 'کوئی مماثل پیغام نہیں ملا۔' : 'No matching messages found.')
                              : language === 'ur'
                              ? `${activeRecipient.name} کے ساتھ ابھی کوئی پیغام نہیں ہے۔`
                              : `No messages with ${activeRecipient.name} yet.`}
                          </p>
                          {!dmQ && (
                            <p className="text-[11px] text-slate-500 max-w-xs mt-1">
                              {language === 'ur'
                                ? 'نیچے سے براہ راست پیغام بھیجیں — آف لائن ہونے پر بھی پیغام محفوظ ہو کر خودکار پہنچ جائے گا۔'
                                : 'Send a direct message below — even offline, your message queues and syncs automatically.'}
                            </p>
                          )}
                        </div>
                      );
                    }

                    return filteredDirect.map((msg, idx) => {
                      const isMine = msg.senderId === currentUser.id;
                      const recipientIsFounder = Boolean(
                        activeRecipient.isFounder ||
                        activeRecipient.email.trim().toLowerCase() === FOUNDER_EMAIL.toLowerCase()
                      );
                      const msgFromFounder = isMine ? isFounder : recipientIsFounder;
                      const isPermanentlyDeleted = Boolean(msg.isDeletedForEveryone || msg.isDeleted);
                      const targetRank = getRoleHierarchyRank(
                        isMine ? currentUser.role : activeRecipient.role,
                        msgFromFounder
                      );
                      const canDeleteDirectForEveryone = Boolean(
                        !isPermanentlyDeleted &&
                          (isFounder || (!msgFromFounder && (isMine || (actorRank >= 2 && actorRank >= targetRank))))
                      );
                      const dayKey = getCalendarDayKey(msg.timestamp);
                      const prevDayKey = idx > 0 ? getCalendarDayKey(filteredDirect[idx - 1].timestamp) : null;
                      const showDateDivider = idx === 0 || dayKey !== prevDayKey;

                      const directSenderIsFaizKhel = isMine
                        ? isFaizKhelUser(currentUser)
                        : isFaizKhelUser(activeRecipient);
                      const isHighlightedTarget = highlightedMessageId === msg.id;
                      const swipeDelta = swipingMsgId === msg.id ? swipeOffsetX : 0;

                      return (
                        <React.Fragment key={msg.id}>
                          {showDateDivider && (
                            <div className="flex justify-center my-2">
                              <span className="px-3 py-0.5 rounded-full bg-[#090D16] border border-[#D4AF37]/30 text-[10px] font-bold text-[#F5D061]">
                                {formatChatDateDivider(msg.timestamp, language)}
                              </span>
                            </div>
                          )}
                          <div
                            data-msg-id={msg.id}
                            ref={(el) => {
                              directMessageRefs.current[msg.id] = el;
                            }}
                            onTouchStart={(e) => handleBubbleTouchStart(e, msg, 'DIRECT')}
                            onTouchMove={handleBubbleTouchMove}
                            onTouchEnd={handleBubbleTouchEnd}
                            onTouchCancel={handleBubbleTouchEnd}
                            style={{
                              transform: swipeDelta > 0 ? `translate3d(${swipeDelta}px, 0, 0)` : undefined
                            }}
                            className={`flex flex-col transition-transform duration-150 ${
                              isMine ? 'items-end' : 'items-start'
                            } ${isHighlightedTarget ? 'rounded-2xl ring-2 ring-[#F5D061] bg-[#F5D061]/10 p-1' : ''}`}
                          >
                            <div
                              className={`max-w-[86%] sm:max-w-md rounded-2xl px-3.5 py-2.5 text-xs shadow-sm space-y-1.5 ${
                                isPermanentlyDeleted
                                  ? 'bg-[#0D1320]/90 text-slate-400 border border-slate-700/60'
                                  : directSenderIsFaizKhel
                                  ? `bg-gradient-to-br from-[#2B1F06] via-[#42300A] to-[#1C1404] text-[#F8FAFC] border-[1.5px] border-[#FDE047] shadow-[0_4px_18px_rgba(253,224,71,0.24)] ${
                                      isMine ? 'rounded-br-none' : 'rounded-bl-none'
                                    }`
                                  : isMine
                                  ? 'bg-gradient-to-br from-[#131C31] to-[#1E293B] text-[#F8FAFC] border border-[#38BDF8]/40 rounded-br-none'
                                  : 'bg-[#131C31]/95 text-[#F8FAFC] border border-slate-400/20 rounded-bl-none'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3 text-[10px] opacity-90 font-semibold">
                                <span
                                  className={`inline-flex items-center gap-1 ${
                                    directSenderIsFaizKhel
                                      ? 'text-[#FEF08A]'
                                      : isMine
                                      ? 'text-[#F5D061]'
                                      : 'text-[#38BDF8]'
                                  }`}
                                >
                                  {directSenderIsFaizKhel && !msgFromFounder && (
                                    <FaizKhelVipCrownIcon className="w-[22px] h-[22px]" />
                                  )}
                                  {isMine ? (language === 'ur' ? 'آپ' : 'You') : msg.senderName}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-slate-300">
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setDeleteModalTarget({
                                        scope: 'DIRECT',
                                        msg,
                                        canDeleteForEveryone: canDeleteDirectForEveryone
                                      })
                                    }
                                    className="text-rose-300 hover:text-rose-200 cursor-pointer"
                                    title={translate(language, 'deleteLabel')}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>

                              {isPermanentlyDeleted ? (
                                <p className="italic text-slate-400 leading-relaxed">
                                  {renderDeletedPlaceholderText(msg, language)}
                                </p>
                              ) : (
                                <>
                                  {msg.forwardedFrom && (
                                    <div className="inline-flex items-center gap-1 text-[10px] italic font-semibold text-[#F5D061]/90">
                                      <Forward className="w-3 h-3 shrink-0" />
                                      <span>
                                        {language === 'ur' ? `فارورڈ از ${msg.forwardedFrom}` : `Forwarded from ${msg.forwardedFrom}`}
                                      </span>
                                    </div>
                                  )}

                                  {msg.replyTo && (
                                    <button
                                      type="button"
                                      onClick={() => scrollToMessageId(msg.replyTo!.id, 'DIRECT')}
                                      className="w-full text-left px-2.5 py-1.5 rounded-lg bg-black/35 border-l-2 border-[#F5D061] text-[11px] cursor-pointer"
                                    >
                                      <span className="font-bold text-[#F5D061] block truncate">
                                        ↩️ {msg.replyTo.senderName}
                                      </span>
                                      <span className="text-slate-300 line-clamp-2">
                                        {msg.replyTo.isVoiceNote ? '🎤 Voice Note' : msg.replyTo.text}
                                      </span>
                                    </button>
                                  )}

                                  {msg.islamicGifId && (
                                    <IslamicGifCard gifId={msg.islamicGifId} />
                                  )}

                                  {msg.voiceNote && (
                                    <VoiceNotePlayer voiceNote={msg.voiceNote} />
                                  )}

                                  {msg.text && !msg.islamicGifId && !msg.voiceNote && (
                                    <p className="leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                                      {renderLinkedText(msg.text)}
                                    </p>
                                  )}

                                  {msg.attachmentUrl && (
                                    <div className="pt-1.5 border-t border-white/15">
                                      {msg.attachmentType === 'IMAGE' ? (
                                        <button
                                          type="button"
                                          onClick={() => setPreviewImageUrl(msg.attachmentUrl!)}
                                          className="block cursor-pointer"
                                        >
                                          <img
                                            src={msg.attachmentUrl}
                                            alt="attachment"
                                            className="w-48 max-w-full h-32 object-cover rounded-lg border border-white/20"
                                          />
                                        </button>
                                      ) : (
                                        <a
                                          href={msg.attachmentUrl}
                                          download={msg.attachmentName || 'document'}
                                          className="flex items-center gap-2 p-2 rounded bg-black/25 text-[11px] underline text-[#F5D061]"
                                        >
                                          <FileText className="w-4 h-4 shrink-0" />
                                          <span className="truncate">{msg.attachmentName || 'Document'}</span>
                                        </a>
                                      )}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>

                            {!isPermanentlyDeleted && (
                              <div className={`flex flex-wrap items-center gap-1.5 mt-1 px-1 text-[10px] ${isMine ? 'justify-end' : 'justify-start'}`}>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDirectReplyingTo({
                                      id: msg.id,
                                      senderName: msg.senderName,
                                      text: msg.text,
                                      isVoiceNote: Boolean(msg.voiceNote)
                                    })
                                  }
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#111622] border border-slate-700/80 text-slate-300 hover:text-[#F5D061] cursor-pointer"
                                >
                                  <Reply className="w-2.5 h-2.5" />
                                  <span>{language === 'ur' ? 'جواب' : 'Reply'}</span>
                                </button>
                                {msg.text && !msg.islamicGifId && !msg.voiceNote && (
                                  <button
                                    type="button"
                                    onClick={() => handleCopyMessageText(msg.text)}
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#111622] border border-slate-700/80 text-slate-300 hover:text-[#38BDF8] cursor-pointer"
                                  >
                                    <Copy className="w-2.5 h-2.5" />
                                    <span>{language === 'ur' ? 'کاپی' : 'Copy'}</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setForwardSearch('');
                                    setForwardingMessage(msg);
                                  }}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#111622] border border-slate-700/80 text-slate-300 hover:text-[#F5D061] cursor-pointer"
                                >
                                  <Forward className="w-2.5 h-2.5" />
                                  <span>{language === 'ur' ? 'فارورڈ' : 'Forward'}</span>
                                </button>
                                {isMine && (
                                  <span className="inline-flex items-center gap-1">
                                    {renderDeliveryTick(msg)}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </React.Fragment>
                      );
                    });
                  })()}
                  <div ref={directEndRef} />
                  </div>

                  {showDirectScrollBottom && (
                    <button
                      type="button"
                      onClick={() => directEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
                      aria-label="Scroll to latest messages"
                      className="absolute right-3 bottom-3 z-20 w-9 h-9 rounded-full kc-gold-button shadow-xl flex items-center justify-center cursor-pointer kc-pressable"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {activeDirectTypers.length > 0 && (
                  <div className="px-3.5 py-1 bg-[#090D16] border-t border-[#38BDF8]/20 text-[11px] font-semibold text-[#38BDF8] flex items-center gap-2 shrink-0">
                    <span className="inline-flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] animate-bounce" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] animate-bounce" style={{ animationDelay: '0.15s' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] animate-bounce" style={{ animationDelay: '0.3s' }} />
                    </span>
                    <span className="truncate">
                      {language === 'ur'
                        ? `${activeRecipient.name} لکھ رہے ہیں...`
                        : `${activeRecipient.name} is typing...`}
                    </span>
                  </div>
                )}

                {directReplyingTo && (
                  <div className="px-3.5 py-2 bg-[#161D2C] border-t border-[#D4AF37]/35 flex items-center justify-between gap-2 text-xs shrink-0">
                    <div className="min-w-0">
                      <span className="font-bold text-[#F5D061] block">
                        {language === 'ur' ? `${directReplyingTo.senderName} کو جواب:` : `Replying to ${directReplyingTo.senderName}`}
                      </span>
                      <span className="text-slate-300 truncate block">
                        {directReplyingTo.isVoiceNote ? (language === 'ur' ? '🎤 وائس نوٹ' : '🎤 Voice Note') : directReplyingTo.text}
                      </span>
                    </div>
                    <button type="button" onClick={() => setDirectReplyingTo(null)} className="p-1 text-slate-400 hover:text-white cursor-pointer">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {attachmentPreview && (
                  <div className="p-2 px-4 bg-[#161D2C] border-t border-[#D4AF37]/30 flex items-center justify-between text-xs text-[#F5D061]">
                    <div className="flex items-center gap-2 min-w-0">
                      {attachmentPreview.type === 'IMAGE' ? <ImageIcon className="w-4 h-4 shrink-0" /> : <FileText className="w-4 h-4 shrink-0" />}
                      <span className="font-medium truncate">{attachmentPreview.name}</span>
                    </div>
                    <button type="button" onClick={() => setAttachmentPreview(null)} className="p-1 rounded cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {copiedToast && (
                  <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[10005] px-3.5 py-1.5 rounded-full bg-[#090D16]/95 border border-[#F5D061]/60 text-xs font-bold text-[#F5D061] shadow-xl">
                    {copiedToast}
                  </div>
                )}

                {speech.isListening && dictationTarget === 'DIRECT' && (
                  <div className="px-3 py-2 bg-[#131C31] border-t border-[#38BDF8]/30 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 kc-scenic-twinkle shrink-0" />
                      <span className="text-[#F5D061] truncate">
                        {speech.interimTranscript
                          ? speech.interimTranscript
                          : (language === 'ur' ? 'سن رہے ہیں... اب بولیں' : `Listening (${dictationLocale})... speak your message`)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          const next = dictationLocale === 'en-US' ? 'ur-PK' : 'en-US';
                          setDictationLocale(next);
                          speech.startDictation(next);
                        }}
                        className="px-2 py-0.5 rounded-md bg-[#090D16] border border-[#38BDF8]/35 text-[#38BDF8] text-[10px] font-bold cursor-pointer"
                      >
                        {dictationLocale === 'ur-PK' ? 'اردو' : 'EN'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          speech.stopDictation();
                          setDictationTarget(null);
                        }}
                        className="px-2 py-0.5 rounded-md bg-rose-950/90 border border-rose-500/50 text-rose-200 text-[10px] font-bold cursor-pointer"
                      >
                        {language === 'ur' ? 'روکیں' : 'Stop'}
                      </button>
                    </div>
                  </div>
                )}

                {requiresProfileCompletion ? (
                  <div
                    className="p-2.5 sm:p-3 border-t border-slate-400/20 bg-[#090D16]"
                    style={{
                      paddingBottom: isKeyboardOpen ? '12px' : 'calc(env(safe-area-inset-bottom, 16px) + 24px)'
                    }}
                  >
                    <ProfileCompletionGate compact featureName={language === 'ur' ? 'براہ راست پیغام رسانی' : 'Direct Messaging'} />
                  </div>
                ) : (
                <form
                  onSubmit={handleSendDirectMessage}
                  className="px-2.5 pt-2.5 sm:px-3 sm:pt-3 border-t border-slate-400/25 flex items-end gap-1.5 sm:gap-2 bg-gradient-to-b from-[#131C31]/95 to-[#090D16]"
                  style={{
                    paddingBottom: isKeyboardOpen ? '12px' : 'calc(env(safe-area-inset-bottom, 16px) + 24px)'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setIsAttachmentModalOpen(true)}
                    className="relative z-50 min-w-[48px] min-h-[48px] w-12 h-12 text-[#F8FAFC] hover:text-[#38BDF8] rounded-xl bg-[#0F172A] border border-slate-400/25 hover:bg-[#1E293B] flex items-center justify-center shrink-0 cursor-pointer kc-pressable"
                    title={language === 'ur' ? 'تصویر یا فائل منسلک کریں' : 'Attach photo or document'}
                    aria-label={language === 'ur' ? 'تصویر یا فائل منسلک کریں' : 'Attach photo or document'}
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>

                  <div className="flex-1 min-w-[140px] flex flex-col">
                    {messageText.length >= 4000 && (
                      <span className="self-end mb-1 text-[10px] font-mono font-bold text-[#F5D061] tabular-nums px-2 py-0.5 rounded-md bg-[#0F172A] border border-[#D4AF37]/40">
                        {messageText.length.toLocaleString()} / 5,000
                      </span>
                    )}
                    <textarea
                      ref={directTextareaRef}
                      rows={1}
                      maxLength={5000}
                      dir="auto"
                      value={messageText}
                      onChange={(e) => {
                        const val = e.target.value;
                        setMessageText(val);
                        if (activeChatId) emitTyping(activeChatId, Boolean(val.trim()));
                      }}
                      onBlur={() => {
                        if (activeChatId) emitTyping(activeChatId, false);
                      }}
                      onKeyDown={(e) => {
                        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                          e.preventDefault();
                          handleSendDirectMessage(e as unknown as React.FormEvent);
                        }
                      }}
                      placeholder={isOnline ? translate(language, 'chatTypeMessage') : `${translate(language, 'chatTypeMessage')} (${language === 'ur' ? 'آف لائن قطار' : 'Offline Queue'})`}
                      style={{ fontSize: '16px', maxHeight: '120px' }}
                      className="w-full min-h-[48px] resize-none overflow-y-auto px-3.5 py-2.5 text-[16px] leading-[1.35] rounded-xl border border-slate-400/25 bg-[#0F172A] text-[#F8FAFC] placeholder:text-[#94A3B8]/70 focus:outline-hidden focus:border-[#38BDF8] shadow-[inset_0_2px_6px_rgba(0,0,0,0.45)]"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleChatDictation('DIRECT')}
                    className={`relative z-50 min-w-[48px] min-h-[48px] w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 cursor-pointer transition-colors kc-pressable ${
                      speech.isListening && dictationTarget === 'DIRECT'
                        ? 'bg-rose-950/90 border-rose-500 text-rose-200'
                        : 'bg-[#0F172A] border-[#38BDF8]/35 text-[#38BDF8] hover:text-[#F5D061] hover:bg-[#1E293B]'
                    }`}
                    title={
                      speech.isListening && dictationTarget === 'DIRECT'
                        ? (language === 'ur' ? 'وائس ڈکٹیشن روکیں' : 'Stop Voice Dictation')
                        : (language === 'ur' ? 'بول کر پیغام لکھیں' : 'Dictate Message with Voice')
                    }
                    aria-label={language === 'ur' ? 'وائس ڈکٹیشن' : 'Voice Dictation'}
                  >
                    {speech.isListening && dictationTarget === 'DIRECT' ? (
                      <Square className="w-5 h-5 fill-current" />
                    ) : (
                      <AudioLines className="w-5 h-5" />
                    )}
                  </button>

                  <button
                    type="submit"
                    disabled={!messageText.trim() && !attachmentPreview}
                    className="relative z-50 min-w-[48px] min-h-[48px] h-12 flex items-center justify-center gap-1.5 px-3.5 kc-gold-button disabled:opacity-40 font-extrabold text-xs rounded-xl shrink-0 cursor-pointer kc-pressable"
                    aria-label={translate(language, 'chatSend')}
                  >
                    {isOnline ? <Send className="w-4 h-4 shrink-0" /> : <Clock className="w-4 h-4 shrink-0" />}
                    <span className="hidden sm:inline">{translate(language, 'chatSend')}</span>
                  </button>
                </form>
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400 text-center">
                <MessageSquare className="w-12 h-12 text-[#D4AF37]/30 mb-2" />
                <p className="text-sm font-semibold text-slate-300">{translate(language, 'noConversations')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================
          MODALS (Scrollable Black & Royal Gold, NO backdrop-blur)
          ============================================================ */}

      {/* Direct Chat File Attachment Modal */}
      {isAttachmentModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[10000] kc-modal-backdrop flex items-start sm:items-center justify-center bg-[#0A0D12]/90 overflow-y-auto"
          onClick={() => setIsAttachmentModalOpen(false)}
        >
          <div
            className="kc-modal-panel bg-[#111622] rounded-2xl max-w-sm w-full p-5 pb-24 sm:pb-5 border border-[#D4AF37]/35 shadow-2xl space-y-4 my-auto overflow-y-auto"
            style={{ WebkitOverflowScrolling: 'touch' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-bold text-white flex-1 min-w-0 break-words whitespace-normal leading-snug pt-1">
                {language === 'ur' ? 'تصویر یا فائل منسلک کریں' : 'Attach Photo or File'}
              </h3>
              <button type="button" onClick={() => setIsAttachmentModalOpen(false)} aria-label="Close" className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 shrink-0 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 xs:grid-cols-3 gap-2.5">
              <label className="p-3.5 rounded-xl border border-[#D4AF37]/40 hover:border-[#F5D061] flex flex-col items-center gap-1.5 text-center bg-[#0A0D12] cursor-pointer">
                <Camera className="w-6 h-6 text-[#F5D061]" />
                <span className="text-xs font-semibold text-white">
                  {language === 'ur' ? 'کیمرہ تصویر' : 'Camera Photo'}
                </span>
                <span className="text-[10px] text-slate-400">
                  {language === 'ur' ? 'براہ راست تصویر کھینچیں' : 'Capture live photo'}
                </span>
                <input type="file" accept="image/*" capture="environment" onChange={handleDirectImageAttachment} className="hidden" />
              </label>

              <label className="p-3.5 rounded-xl border border-slate-700 hover:border-[#D4AF37] flex flex-col items-center gap-1.5 text-center bg-[#0A0D12] cursor-pointer">
                <ImageIcon className="w-6 h-6 text-[#38BDF8]" />
                <span className="text-xs font-semibold text-white">
                  {language === 'ur' ? 'گیلری / GIF' : 'Gallery / GIF'}
                </span>
                <span className="text-[10px] text-slate-400">
                  {language === 'ur' ? '10MB تک · خودکار کمپریشن' : 'Up to 10MB · Smart <750KB'}
                </span>
                <input type="file" accept="image/*,.gif" onChange={handleDirectImageAttachment} className="hidden" />
              </label>

              <label className="p-3.5 rounded-xl border border-slate-700 hover:border-[#D4AF37] flex flex-col items-center gap-1.5 text-center bg-[#0A0D12] cursor-pointer">
                <FileText className="w-6 h-6 text-emerald-400" />
                <span className="text-xs font-semibold text-white">
                  {language === 'ur' ? 'دستاویز منتخب کریں' : 'Select Document'}
                </span>
                <span className="text-[10px] text-slate-400">
                  {language === 'ur' ? 'پی ڈی ایف / فائل (1.5MB تک)' : 'PDF / Text (<1.5MB)'}
                </span>
                <input type="file" accept=".pdf,.doc,.docx,.txt,image/*" onChange={handleDirectDocumentAttachment} className="hidden" />
              </label>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Forward Message Picker Modal */}
      {forwardingMessage && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[10004] kc-modal-backdrop flex items-start sm:items-center justify-center bg-[#0A0D12]/90 overflow-y-auto"
          onClick={() => setForwardingMessage(null)}
        >
          <div
            className="kc-modal-panel w-full max-w-md kc-luxury-modal rounded-2xl p-5 pb-24 sm:pb-5 space-y-3.5 my-auto flex flex-col text-xs text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-[#D4AF37]/25 shrink-0">
              <div className="flex items-center gap-2 flex-1 min-w-0 pt-1">
                <Forward className="w-4 h-4 text-[#F5D061] shrink-0" />
                <h3 className="text-sm font-extrabold text-[#F5D061] break-words whitespace-normal leading-snug">
                  {language === 'ur' ? 'پیغام فارورڈ کریں' : 'Forward Message'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setForwardingMessage(null)}
                aria-label="Close"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative shrink-0">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={forwardSearch}
                onChange={(e) => setForwardSearch(e.target.value)}
                placeholder={language === 'ur' ? 'ممبر یا روم تلاش کریں...' : 'Search member or room...'}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#090D16] border border-[#D4AF37]/30 text-xs text-white focus:outline-none focus:border-[#38BDF8]"
              />
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1">
              {!roomFullLockedForMe &&
                (!forwardingMessage.voiceNote || !roomVoiceLockedForMe) &&
                (!forwardingMessage.attachmentUrl || canUploadGallery) && (
                <button
                  type="button"
                  onClick={() => handleForwardToTarget('COMMUNITY')}
                  className="w-full p-3 rounded-xl bg-[#131C31] hover:bg-[#1E293B] border border-[#F5D061]/45 flex items-center justify-between gap-2 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Globe className="w-4 h-4 text-[#F5D061] shrink-0" />
                    <div className="min-w-0">
                      <span className="font-extrabold text-[#F5D061] block truncate">
                        {translate(language, 'communityRoomTab')}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {language === 'ur' ? 'لائیو کمیونٹی روم میں بھیجیں' : 'Share to Live Community Room'}
                      </span>
                    </div>
                  </div>
                  <Forward className="w-4 h-4 text-[#F5D061] shrink-0" />
                </button>
              )}

              {users
                .filter(u => {
                  if (u.id === currentUser.id) return false;
                  const q = forwardSearch.trim().toLowerCase();
                  if (!q) return true;
                  return (
                    u.name.toLowerCase().includes(q) ||
                    (u.membershipId && u.membershipId.toLowerCase().includes(q)) ||
                    (u.district && u.district.toLowerCase().includes(q))
                  );
                })
                .map(u => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleForwardToTarget(u)}
                    className="w-full p-2.5 rounded-xl bg-[#090D16] hover:bg-[#161F33] border border-slate-700/80 flex items-center justify-between gap-2 text-left cursor-pointer"
                  >
                    <div className="min-w-0">
                      <span className="font-bold text-white block truncate">{u.name}</span>
                      <span className="text-[10px] text-slate-400 block truncate">
                        {u.membershipId || 'Member'} · {u.district || 'Pakistan'}
                      </span>
                    </div>
                    <Forward className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
                  </button>
                ))}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Scenic Live Chat Theme Modal (Leadership + Founder Custom BG Upload) */}
      {isThemeModalOpen && isLeadership && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[10000] kc-modal-backdrop flex items-start sm:items-center justify-center bg-[#0A0D12]/90 overflow-y-auto"
          onClick={() => setIsThemeModalOpen(false)}
        >
          <div
            className="kc-modal-panel bg-[#111622] rounded-2xl max-w-md w-full p-5 pb-24 sm:pb-5 border border-[#D4AF37]/40 shadow-2xl space-y-4 my-auto overflow-y-auto"
            style={{ WebkitOverflowScrolling: 'touch' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2 break-words whitespace-normal leading-snug">
                  <Palette className="w-4 h-4 text-[#F5D061] shrink-0" />
                  <span>{language === 'ur' ? 'لائیو کمیونٹی منظر تھیمز' : 'Live Community Scenic Themes'}</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5 break-words whitespace-normal">
                  {language === 'ur' ? 'تمام اینڈرائیڈ موبائلز کے لیے تیز رفتار جی پی یو تھیمز۔' : 'GPU-only animated themes optimized for all Android devices.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsThemeModalOpen(false)}
                aria-label="Close"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-xl bg-[#161D2C] text-slate-200 hover:text-white shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {SCENIC_THEME_PRESETS.map(theme => {
                const isActive = activeThemeId === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => {
                      const res = updateLiveChatAppearance({ liveChatTheme: theme.id });
                      if (!res.success && res.error) setChatError(res.error);
                      else setIsThemeModalOpen(false);
                    }}
                    className={`p-3 rounded-xl border text-left transition-colors cursor-pointer bg-gradient-to-br ${theme.previewGradient} ${
                      isActive ? 'border-[#F5D061] ring-2 ring-[#F5D061]/40' : 'border-slate-700 hover:border-[#D4AF37]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-base">{theme.emoji}</span>
                      {isActive && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#F5D061] text-[#0A0D12]">
                          {language === 'ur' ? 'فعال' : 'Active'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-white mt-2">{language === 'ur' ? theme.labelUr : theme.label}</p>
                    <p className="text-[10px] text-slate-300/80">{language === 'ur' ? theme.subtitleUr : theme.subtitle}</p>
                  </button>
                );
              })}
            </div>

            {canUploadGallery && (
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#F5D061]">
                  <Crown className="w-3.5 h-3.5" />
                  <span>{language === 'ur' ? 'کسٹم وال پیپر (سپر ایڈمن و ایڈمن)' : 'Custom Scenic Wallpaper (Super Admin & Admin)'}</span>
                </div>
                <label className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-[#F5D061]/50 bg-[#0A0D12] hover:bg-[#161D2C] text-xs font-bold text-[#F5D061] cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>
                    {isCompressingMedia
                      ? (language === 'ur' ? 'وال پیپر تیار ہو رہا ہے...' : 'Optimizing Wallpaper...')
                      : (language === 'ur' ? 'تصویر یا GIF وال پیپر اپلوڈ کریں (10MB تک)' : 'Upload Photo or GIF Wallpaper (Up to 10MB)')}
                  </span>
                  <input
                    type="file"
                    accept="image/*,.gif"
                    onChange={handleCustomScenicBgUpload}
                    disabled={isCompressingMedia}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Founder Exclusive Bubble Color Picker Modal */}
      {isBubbleColorModalOpen && isFounder && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[10000] kc-modal-backdrop flex items-start sm:items-center justify-center bg-[#0A0D12]/90 overflow-y-auto"
          onClick={() => setIsBubbleColorModalOpen(false)}
        >
          <div
            className="kc-modal-panel bg-[#111622] rounded-2xl max-w-sm w-full p-5 pb-24 sm:pb-5 border border-[#F5D061]/45 shadow-2xl space-y-4 my-auto overflow-y-auto"
            style={{ WebkitOverflowScrolling: 'touch' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-[#F5D061] flex items-center gap-2 flex-1 min-w-0 break-words whitespace-normal leading-snug pt-1">
                <Crown className="w-4 h-4 shrink-0" />
                <span>{language === 'ur' ? 'بانی وی آئی پی ببل اسٹائل' : 'Founder VIP Bubble Style'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsBubbleColorModalOpen(false)}
                aria-label="Close"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {FOUNDER_BUBBLE_COLORS.map(color => {
                const isSelected = (appSettings.founderBubbleColor || 'ROYAL_GOLD') === color.id;
                return (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => {
                      updateLiveChatAppearance({ founderBubbleColor: color.id });
                      setIsBubbleColorModalOpen(false);
                    }}
                    className={`p-3 rounded-xl border text-left cursor-pointer ${
                      isSelected ? 'border-[#F5D061] bg-[#161D2C]' : 'border-slate-700 bg-[#0A0D12]'
                    }`}
                  >
                    <div className={`w-full h-5 rounded-lg bg-gradient-to-r ${color.swatch} mb-2`} />
                    <span className="text-xs font-bold text-white block">{color.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Message Modal (Delete for Me vs Delete for Everyone) */}
      {deleteModalTarget && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[10002] kc-modal-backdrop flex items-start sm:items-center justify-center bg-[#0A0D12]/90 overflow-y-auto"
          onClick={() => setDeleteModalTarget(null)}
        >
          <div
            className="kc-modal-panel w-full max-w-sm kc-luxury-modal rounded-2xl p-5 pb-24 sm:pb-5 space-y-4 my-auto text-xs text-white overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-[#D4AF37]/25">
              <div className="flex items-center gap-2 flex-1 min-w-0 pt-1">
                <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />
                <h3 className="text-sm font-extrabold text-white break-words whitespace-normal leading-snug">
                  {translate(language, 'deleteMessageTitle')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDeleteModalTarget(null)}
                aria-label="Close"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {translate(language, 'deleteMessagePrompt')}
            </p>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  const res =
                    deleteModalTarget.scope === 'COMMUNITY'
                      ? deleteCommunityMessageForMe(deleteModalTarget.msg.id)
                      : deleteDirectMessageForMe(deleteModalTarget.msg.id);
                  if (!res.success && res.error) setChatError(res.error);
                  setDeleteModalTarget(null);
                }}
                className="w-full text-left p-3 rounded-xl bg-[#090D16] hover:bg-[#161F33] border border-[#D4AF37]/30 transition-colors cursor-pointer space-y-0.5"
              >
                <span className="font-extrabold text-[#F5D061] block">
                  {translate(language, 'deleteForMeBtn')}
                </span>
                <span className="text-[11px] text-slate-400 block">
                  {translate(language, 'deleteForMeDesc')}
                </span>
              </button>

              {deleteModalTarget.canDeleteForEveryone && (
                <button
                  type="button"
                  onClick={() => {
                    if (deleteModalTarget.scope === 'COMMUNITY') {
                      const res = deleteCommunityMessageForEveryone(deleteModalTarget.msg.id);
                      if (!res.success && res.error) setChatError(res.error);
                      res.promise?.then((asyncRes) => {
                        if (!asyncRes.success && asyncRes.error) setChatError(asyncRes.error);
                      });
                    } else {
                      const res = deleteDirectMessageForEveryone(deleteModalTarget.msg.id);
                      if (!res.success && res.error) setChatError(res.error);
                    }
                    setDeleteModalTarget(null);
                  }}
                  className="w-full text-left p-3 rounded-xl bg-rose-950/75 hover:bg-rose-900 border border-rose-500/45 transition-colors cursor-pointer space-y-0.5"
                >
                  <span className="font-extrabold text-rose-200 block">
                    {translate(language, 'deleteForEveryoneBtn')}
                  </span>
                  <span className="text-[11px] text-rose-300/80 block">
                    {translate(language, 'deleteForEveryoneDesc')}
                  </span>
                </button>
              )}
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setDeleteModalTarget(null)}
                className="px-4 py-1.5 rounded-xl bg-[#161D2C] text-slate-300 hover:text-white font-semibold cursor-pointer"
              >
                {translate(language, 'cancel')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Founder-Only Clear Old Messages Modal */}
      {isClearOldModalOpen && isFounder && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[10002] kc-modal-backdrop flex items-start sm:items-center justify-center bg-[#0A0D12]/90 overflow-y-auto"
          onClick={() => setIsClearOldModalOpen(false)}
        >
          <div
            className="kc-modal-panel w-full max-w-sm kc-luxury-modal rounded-2xl p-5 pb-24 sm:pb-5 space-y-4 my-auto text-xs text-white overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-[#D4AF37]/25">
              <div className="flex items-center gap-2 flex-1 min-w-0 pt-1">
                <Crown className="w-4 h-4 text-[#F5D061] shrink-0" />
                <h3 className="text-sm font-extrabold text-[#F5D061] break-words whitespace-normal leading-snug">
                  {translate(language, 'clearOldMessagesTitle')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsClearOldModalOpen(false)}
                aria-label="Close"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  const res = clearOldCommunityMessages('OLDER_7_DAYS');
                  if (!res.success && res.error) setChatError(res.error);
                  res.promise?.then((asyncRes) => {
                    if (!asyncRes.success && asyncRes.error) setChatError(asyncRes.error);
                  });
                  setIsClearOldModalOpen(false);
                }}
                className="w-full p-3 rounded-xl bg-[#090D16] hover:bg-[#161F33] border border-[#D4AF37]/35 text-left font-bold text-[#F5D061] cursor-pointer"
              >
                {translate(language, 'clearOlder7Days')}
              </button>

              <button
                type="button"
                onClick={() => {
                  const res = clearOldCommunityMessages('OLDER_24_HOURS');
                  if (!res.success && res.error) setChatError(res.error);
                  res.promise?.then((asyncRes) => {
                    if (!asyncRes.success && asyncRes.error) setChatError(asyncRes.error);
                  });
                  setIsClearOldModalOpen(false);
                }}
                className="w-full p-3 rounded-xl bg-[#090D16] hover:bg-[#161F33] border border-amber-500/40 text-left font-bold text-amber-200 cursor-pointer"
              >
                {translate(language, 'clearOlder24Hours')}
              </button>

              <button
                type="button"
                onClick={() => {
                  const res = clearOldCommunityMessages('ALL');
                  if (!res.success && res.error) setChatError(res.error);
                  res.promise?.then((asyncRes) => {
                    if (!asyncRes.success && asyncRes.error) setChatError(asyncRes.error);
                  });
                  setIsClearOldModalOpen(false);
                }}
                className="w-full p-3 rounded-xl bg-rose-950/75 hover:bg-rose-900 border border-rose-500/45 text-left font-extrabold text-rose-200 cursor-pointer"
              >
                {translate(language, 'clearAllMessages')}
              </button>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setIsClearOldModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-[#161D2C] text-slate-300 hover:text-white font-semibold cursor-pointer"
              >
                {translate(language, 'cancel')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Fullscreen Image Preview Modal */}
      {previewImageUrl && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[10000] kc-modal-backdrop flex items-start sm:items-center justify-center bg-[#0A0D12]/95 overflow-y-auto"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div className="relative max-w-2xl w-full flex flex-col items-center my-auto" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPreviewImageUrl(null)}
              className="self-end mb-2 min-w-[44px] min-h-[44px] flex items-center justify-center p-2.5 rounded-full bg-[#161D2C] border border-[#D4AF37]/40 text-white cursor-pointer"
              aria-label="Close image preview"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewImageUrl}
              alt="Full preview"
              className="max-h-[75dvh] sm:max-h-[82dvh] max-w-full rounded-2xl border border-[#D4AF37]/40 object-contain"
            />
          </div>
        </div>,
        document.body
      )}
      {/* Pinned Messages Modal */}
      {isPinnedModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[10002] kc-modal-backdrop flex items-start sm:items-center justify-center bg-[#0A0D12]/90 overflow-y-auto"
          onClick={() => setIsPinnedModalOpen(false)}
        >
          <div
            className="kc-modal-panel w-full max-w-md kc-luxury-modal rounded-2xl p-5 pb-24 sm:pb-5 space-y-3 my-auto overflow-y-auto text-xs text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-[#D4AF37]/25">
              <div className="flex items-center gap-2 flex-1 min-w-0 pt-1">
                <Pin className="w-4 h-4 text-[#F5D061] shrink-0" />
                <h3 className="text-sm font-extrabold text-[#F5D061] break-words whitespace-normal leading-snug">
                  {language === 'ur' ? 'پن شدہ پیغامات' : 'Pinned Messages'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPinnedModalOpen(false)}
                aria-label="Close"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {pinnedMessages.length === 0 ? (
              <p className="py-6 text-center text-slate-400">
                {language === 'ur' ? 'ابھی کوئی پیغام پن نہیں کیا گیا۔' : 'No pinned messages yet.'}
              </p>
            ) : (
              <div className="space-y-2">
                {pinnedMessages.map(pm => (
                  <div
                    key={pm.id}
                    className="p-3 rounded-xl bg-[#090D16] border border-[#D4AF37]/30 flex items-start justify-between gap-2"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setIsPinnedModalOpen(false);
                        scrollToMessageId(pm.id);
                      }}
                      className="text-left min-w-0 flex-1 cursor-pointer"
                    >
                      <span className="font-bold text-[#F5D061] block truncate">{pm.senderName}</span>
                      <p className="text-slate-200 mt-0.5 line-clamp-2">
                        {pm.voiceNote ? (language === 'ur' ? '🎤 وائس نوٹ' : '🎤 Voice Note') : pm.text}
                      </p>
                    </button>
                    {isFounder && (
                      <button
                        type="button"
                        onClick={() => runDebouncedAction(() => togglePinCommunityMessage(pm.id))}
                        className="px-2 py-1 rounded-lg bg-[#2A210B] text-[#F5D061] border border-[#D4AF37]/40 text-[10px] font-bold shrink-0 cursor-pointer"
                      >
                        {language === 'ur' ? 'ان پن' : 'Unpin'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Room Members Control Modal (Founder, Additional Super Admins, Admins & Co-Admins ONLY) */}
      {isRoomMembersModalOpen && canModerateRoom && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[10002] kc-modal-backdrop flex items-start sm:items-center justify-center bg-[#0A0D12]/90 overflow-y-auto"
          onClick={() => setIsRoomMembersModalOpen(false)}
        >
          <div
            className="kc-modal-panel w-full max-w-lg kc-luxury-modal rounded-2xl p-5 pb-24 sm:pb-5 space-y-4 my-auto flex flex-col text-xs text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-[#D4AF37]/25 shrink-0">
              <div className="flex items-start gap-2 flex-1 min-w-0 pt-0.5">
                <Users className="w-4 h-4 text-[#38BDF8] shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-extrabold text-white break-words whitespace-normal leading-snug">
                    {language === 'ur' ? 'روم ممبران کنٹرول' : 'Room Members Control'}
                  </h3>
                  <p className="text-[10px] text-slate-400 break-words whitespace-normal">
                    {language === 'ur' ? 'کسی بھی ممبر کے پیغامات، وائس نوٹس یا روم رسائی کنٹرول کریں۔' : '1-tap lock messages, lock voice, or remove member from room.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRoomMembersModalOpen(false)}
                aria-label="Close"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative shrink-0">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                placeholder={language === 'ur' ? 'نام یا ممبر ID تلاش کریں...' : 'Search member name or ID...'}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#090D16] border border-[#D4AF37]/30 text-xs text-white focus:outline-none focus:border-[#38BDF8]"
              />
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1">
              {users
                .filter(u => {
                  const q = memberSearchQuery.trim().toLowerCase();
                  if (!q) return true;
                  return (
                    u.name.toLowerCase().includes(q) ||
                    (u.membershipId && u.membershipId.toLowerCase().includes(q)) ||
                    u.role.toLowerCase().includes(q)
                  );
                })
                .map(member => {
                  const targetIsFounder = isFounderIdentity(member);
                  const ctrl = appSettings.chatMemberControls?.[member.id] || {};
                  const textLocked = Boolean(ctrl.lockMessages);
                  const voiceLocked = Boolean(ctrl.lockVoice);
                  const removed = Boolean(member.isMutedInChat);

                  return (
                    <div
                      key={member.id}
                      className="p-3 rounded-xl bg-[#090D16] border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-white truncate">{member.name}</span>
                          <RoleBadge role={member.role} isFounder={targetIsFounder} compact />
                        </div>
                        <span className="text-[10px] font-mono text-[#F5D061] block mt-0.5">
                          {member.membershipId || 'KC-PENDING'}
                        </span>
                      </div>

                      {targetIsFounder ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#2B2108] border border-[#F5D061]/50 text-[#F5D061] text-[10px] font-extrabold shrink-0">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{language === 'ur' ? 'محفوظ (بانی)' : 'Protected (Founder)'}</span>
                        </span>
                      ) : (
                        <div className="flex items-center flex-wrap gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              runDebouncedAction(() => {
                                const res = updateMemberChatControl(member.id, { lockMessages: !textLocked });
                                if (!res.success && res.error) setChatError(res.error);
                              })
                            }
                            className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold cursor-pointer inline-flex items-center gap-1 ${
                              textLocked
                                ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
                                : 'bg-[#131C31] border-slate-600 text-slate-200 hover:border-[#38BDF8]'
                            }`}
                          >
                            {textLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                            <span>{language === 'ur' ? (textLocked ? 'ٹیکسٹ کھولیں' : 'ٹیکسٹ بند') : (textLocked ? 'Unlock Msg' : 'Lock Msg')}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              runDebouncedAction(() => {
                                const res = updateMemberChatControl(member.id, { lockVoice: !voiceLocked });
                                if (!res.success && res.error) setChatError(res.error);
                              })
                            }
                            className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold cursor-pointer inline-flex items-center gap-1 ${
                              voiceLocked
                                ? 'bg-amber-950/90 border-amber-500/50 text-amber-200'
                                : 'bg-[#131C31] border-slate-600 text-slate-200 hover:border-[#38BDF8]'
                            }`}
                          >
                            {voiceLocked ? <VolumeX className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                            <span>{language === 'ur' ? (voiceLocked ? 'وائس کھولیں' : 'وائس بند') : (voiceLocked ? 'Unlock Voice' : 'Lock Voice')}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              runDebouncedAction(() => {
                                const res = updateMemberChatControl(member.id, { removeFromRoom: !removed });
                                if (!res.success && res.error) setChatError(res.error);
                              })
                            }
                            className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold cursor-pointer inline-flex items-center gap-1 ${
                              removed
                                ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
                                : 'bg-rose-950/80 border-rose-500/45 text-rose-200 hover:bg-rose-900'
                            }`}
                          >
                            <UserX className="w-3 h-3" />
                            <span>{language === 'ur' ? (removed ? 'بحال کریں' : 'روم سے ہٹائیں') : (removed ? 'Restore' : 'Remove')}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export const ChatModule: React.FC = () => (
  <ErrorBoundary title="Community Chat Recovering">
    <ChatModuleContent />
  </ErrorBoundary>
);
