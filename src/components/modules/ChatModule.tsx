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
  AudioLines
} from 'lucide-react';
import { useSpeechDictation, appendDictatedText } from '../../hooks/useSpeechDictation';
import {
  compressImageFile,
  isGifFile,
  MAX_GALLERY_FILE_BYTES,
  readFileAsDataUrlWithLimit
} from '../../utils/imageCompression';
import { uploadMediaToFirebaseStorage, isUserActuallyOnline } from '../../services/firebase';
import { RoleBadge } from '../common/RoleBadge';
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
  User
} from '../../types';
import { ScenicChatBackground, SCENIC_THEME_PRESETS } from './chat/ScenicChatBackground';
import { IslamicGifCard, ISLAMIC_GIFS } from './chat/IslamicGifCard';

const FOUNDER_EMAIL = 'asadullah6959@gmail.com';
const MAX_VOICE_SECONDS = 60;
const QUICK_REACTIONS = ['❤️', '👍', '🤲', '✨'];
const QUICK_EMOJIS = ['❤️', '👍', '🤲', '✨', '👑', '🕌', '🇵🇰', '😊'];

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
  const [playError, setPlayError] = useState<string | null>(null);

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
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={togglePlay}
          className="relative z-50 w-12 h-12 min-w-[48px] min-h-[48px] rounded-full kc-gold-button flex items-center justify-center shrink-0 cursor-pointer kc-pressable"
          aria-label={isPlaying ? 'Pause voice note' : 'Play voice note'}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>

        <div className="flex-1 flex items-end gap-0.5 h-7 min-w-[110px]" aria-hidden="true">
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

        <span className="text-[11px] font-mono font-bold text-[#F5D061] shrink-0 tabular-nums">
          {formatDuration(isPlaying ? currentSec : totalSec)}
        </span>
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
    clearOldCommunityMessages,
    deleteDirectMessageForMe,
    deleteDirectMessageForEveryone,
    muteChatUser,
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
    language
  } = useApp();
  const requiresProfileCompletion = needsProfileCompletion(currentUser);

  const chatMode = preferredChatMode;
  const setChatMode = setPreferredChatMode;

  // Direct Chat States
  const [searchQuery, setSearchQuery] = useState('');
  const [messageText, setMessageText] = useState('');
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

  // Delete Message & Founder Clear Old Messages Modals
  const [deleteModalTarget, setDeleteModalTarget] = useState<{
    scope: 'COMMUNITY' | 'DIRECT';
    msg: ChatMessage;
    canDeleteForEveryone: boolean;
  } | null>(null);
  const [isClearOldModalOpen, setIsClearOldModalOpen] = useState(false);

  // Presence heartbeat refresh tick (every 10s)
  const [presenceNowMs, setPresenceNowMs] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => {
      setPresenceNowMs(Date.now());
    }, 10000);
    return () => window.clearInterval(id);
  }, []);

  // Voice Recorder & Step-2 Preview Draft States (WhatsApp Flow: Record -> Stop -> Preview -> Send)
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [draftVoiceNote, setDraftVoiceNote] = useState<ChatVoiceNote | null>(null);
  const [isDraftPlaying, setIsDraftPlaying] = useState(false);
  const [draftPlaySec, setDraftPlaySec] = useState(0);
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
  const communityMessageRefs = useRef<Record<string, HTMLDivElement | null>>({});

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

  const isFounder =
    Boolean(currentUser.isFounder) ||
    currentUser.email.trim().toLowerCase() === FOUNDER_EMAIL.toLowerCase();
  const canUploadGallery =
    isFounder ||
    currentUser.role === 'SUPER_ADMIN' ||
    currentUser.role === 'ADMIN';
  const isLeadership =
    canUploadGallery ||
    currentUser.role === 'CO_ADMIN';
  const canMuteUsers = isFounder || currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';
  const isUserMutedInCommunity = Boolean(currentUser.isMutedInChat) && !isFounder;

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
      attachmentPreview || undefined
    );

    if (!res.success) {
      setChatError(res.error || (language === 'ur' ? 'اس وقت پیغام بھیجنا ممکن نہیں۔' : 'Unable to send message right now.'));
      return;
    }

    setMessageText('');
    setAttachmentPreview(null);
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
  const pinnedMessage = communityMessages.find(m => m.isPinned && !m.isDeleted);

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

  const toggleDraftVoicePlay = async () => {
    if (!draftVoiceNote) return;
    setChatError(null);
    try {
      if (!draftAudioRef.current) {
        const audio = new Audio(draftVoiceNote.url);
        audio.preload = 'metadata';
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

  const scrollToMessageId = (id: string) => {
    try {
      const el = communityMessageRefs.current[id];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } catch {
      // ignore
    }
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

  const visibleCommunityMessages = communityMessages.filter(m => !m.isDeleted);

  return (
    <div className="space-y-4 max-w-full">
      {/* Header + Dual Mode Switcher (shown in Direct Messages view) */}
      {chatMode === 'DIRECT' && (
        <>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-[#D4AF37]/25">
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-[#F5D061] uppercase tracking-wider">
                {language === 'ur' ? 'کفایت کنیکٹ · لائیو اور براہ راست نیٹ ورک' : 'Kifayat Connect · Live & Direct Network'}
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
        <div className="fixed inset-0 z-[9999] w-screen h-[100dvh] flex flex-col overflow-hidden bg-[#090D16] overscroll-none touch-pan-y">
          {/* Live Scenic GPU-Only SVG/CSS Wallpaper Background */}
          <ScenicChatBackground
            themeId={activeThemeId}
            customBgUrl={appSettings.liveChatCustomBgUrl}
          />

          {/* Full-Screen Top Bar with Status Bar Safe Clearance */}
          <div className="relative z-40 px-3 sm:px-5 pt-[calc(env(safe-area-inset-top,12px)+8px)] pb-2.5 border-b border-slate-400/20 bg-gradient-to-b from-[#131C31]/95 via-[#0F172A]/95 to-[#090D16]/95 flex flex-wrap items-center justify-between gap-2 shrink-0 shadow-[0_8px_24px_rgba(0,0,0,0.6)]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FCE38A] via-[#D4AF37] to-[#8A6218] text-[#090D16] flex items-center justify-center font-black text-sm shrink-0 shadow-[0_4px_12px_rgba(212,175,55,0.3)] border border-[#FEF08A]/70">
                🌐
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h2 className="text-xs sm:text-sm font-extrabold text-[#F8FAFC] truncate">
                    {translate(language, 'communityRoomTab')}
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#131C31] text-[#38BDF8] border border-[#38BDF8]/40 tabular-nums">
                    🟢 {onlineMembersCount} {translate(language, 'online')} · {users.length} {language === 'ur' ? 'ممبران' : 'Members'}
                  </span>
                </div>
                <p className="text-[10px] text-[#F5D061]/95 truncate">
                  {activeThemeId === 'CUSTOM'
                    ? (language === 'ur' ? 'بانی کی منتخب کردہ لائیو اسکرین تھیم' : 'Founder Custom Scenic Wallpaper')
                    : (() => {
                        const found = SCENIC_THEME_PRESETS.find(t => t.id === activeThemeId);
                        return found ? (language === 'ur' ? found.labelUr : found.label) : (language === 'ur' ? 'شاہی سیاہ اور سنہرا' : 'Obsidian & Royal Gold');
                      })()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap shrink-0">
              <button
                type="button"
                onClick={() => setChatMode('DIRECT')}
                className="relative z-50 min-h-[44px] sm:min-h-[48px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#131C31] hover:bg-[#1E293B] border border-[#38BDF8]/35 text-[#F8FAFC] text-[11px] font-bold cursor-pointer kc-pressable"
                title={language === 'ur' ? 'ون آن ون براہ راست پیغامات پر جائیں' : 'Switch to 1-on-1 Direct Messages'}
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
                <span>{language === 'ur' ? 'براہ راست' : 'Direct'}</span>
              </button>

              {isFounder && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsBubbleColorModalOpen(true)}
                    className="relative z-50 min-h-[44px] sm:min-h-[48px] inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#131C31] hover:bg-[#1E293B] border border-[#F5D061]/45 text-[#F5D061] text-[11px] font-bold cursor-pointer kc-pressable"
                  >
                    <Crown className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden sm:inline">{language === 'ur' ? 'میرا ببل' : 'My Bubble'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsClearOldModalOpen(true)}
                    className="relative z-50 min-h-[44px] sm:min-h-[48px] inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-950/85 hover:bg-rose-900 border border-rose-500/45 text-rose-200 text-[11px] font-bold cursor-pointer kc-pressable"
                    title={translate(language, 'clearOldMessagesBtn')}
                  >
                    <Trash2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden sm:inline">{language === 'ur' ? 'صفائی' : 'Clear Chat'}</span>
                  </button>
                </>
              )}

              {isLeadership && (
                <button
                  type="button"
                  onClick={() => setIsThemeModalOpen(true)}
                  className="relative z-50 min-h-[44px] sm:min-h-[48px] inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#131C31] hover:bg-[#1E293B] border border-slate-400/25 text-[#F8FAFC] text-[11px] font-bold cursor-pointer kc-pressable"
                >
                  <Palette className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
                  <span className="hidden sm:inline">{language === 'ur' ? 'تھیم' : 'Theme'}</span>
                </button>
              )}

              {/* Minimize (—) to Floating Bubble */}
              <button
                type="button"
                onClick={minimizeLiveChat}
                title={language === 'ur' ? 'فلوٹنگ ببل میں چھوٹا کریں' : 'Minimize Live Chat to Floating Bubble'}
                aria-label="Minimize Live Chat Room"
                className="relative z-50 min-w-[44px] min-h-[44px] sm:min-w-[48px] sm:min-h-[48px] inline-flex items-center justify-center rounded-xl bg-[#131C31] hover:bg-[#1E293B] border border-[#D4AF37]/45 text-[#F5D061] font-extrabold cursor-pointer shrink-0 kc-pressable"
              >
                <Minus className="w-4 h-4" />
              </button>

              {/* Hide / Close (✕) Completely */}
              <button
                type="button"
                onClick={closeAndHideLiveChat}
                title={language === 'ur' ? 'لائیو چیٹ بند کریں' : 'Close & Hide Live Chat'}
                aria-label="Close and Hide Live Chat"
                className="relative z-50 min-w-[44px] min-h-[44px] sm:min-w-[48px] sm:min-h-[48px] inline-flex items-center justify-center rounded-xl bg-[#131C31] hover:bg-rose-950/85 border border-rose-500/45 text-rose-300 hover:text-white font-extrabold cursor-pointer shrink-0 kc-pressable"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

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
                  onClick={() => togglePinCommunityMessage(pinnedMessage.id)}
                  className="px-2 py-1 rounded-lg bg-[#2A210B] text-[#F5D061] border border-[#D4AF37]/40 text-[10px] font-bold shrink-0 cursor-pointer"
                >
                  {language === 'ur' ? 'ان پن' : 'Unpin'}
                </button>
              )}
            </div>
          )}

          {/* Community Feed (Transparent over Scenic Wallpaper) */}
          <div className="relative z-10 flex-1 min-h-0 overflow-y-auto bg-transparent p-3 sm:p-5 space-y-3.5">
            {visibleCommunityMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="w-14 h-14 rounded-2xl bg-[#111622] border border-[#D4AF37]/40 flex items-center justify-center mb-3">
                  <Globe className="w-7 h-7 text-[#F5D061]" />
                </div>
                <p className="text-sm font-bold text-white">
                  {language === 'ur' ? 'لائیو کمیونٹی روم میں خوش آمدید' : 'Welcome to the Live Community Room'}
                </p>
                <p className="text-xs text-slate-300 max-w-sm mt-1">
                  {language === 'ur'
                    ? 'سلام دعا، 60 سیکنڈ کا وائس نوٹ یا خوبصورت اسلامی کارڈ نیچے سے بھیجیں۔'
                    : 'Share greetings, send 60s voice notes, or send an animated Islamic card below.'}
                </p>
              </div>
            ) : (
              visibleCommunityMessages.map((msg, idx) => {
                const isMine = msg.senderId === currentUser.id;
                const authorRecord = getUserRecord(msg.senderId);
                const msgIsFounder = Boolean(
                  msg.senderIsFounder ||
                  authorRecord?.isFounder ||
                  (authorRecord?.email && authorRecord.email.trim().toLowerCase() === FOUNDER_EMAIL.toLowerCase())
                );
                const msgIsAudit = Boolean(msg.senderIsAuditOfficer || authorRecord?.isAuditOfficer);
                const avatarSrc = authorRecord?.photoUrl || authorRecord?.avatarUrl;
                const isAuthorMuted = Boolean(authorRecord?.isMutedInChat);
                const authorOnline = authorRecord
                  ? isUserActuallyOnline(authorRecord, presenceNowMs)
                  : false;

                const canDeleteForEveryone = Boolean(
                  isFounder ||
                    (!msgIsFounder &&
                      (currentUser.role === 'SUPER_ADMIN' ||
                        currentUser.role === 'ADMIN' ||
                        currentUser.role === 'CO_ADMIN' ||
                        isMine))
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

                const bubbleContainerClass = msgIsFounder
                  ? getFounderBubbleStyle(msg.senderBubbleColor || appSettings.founderBubbleColor)
                  : msg.isHighlighted
                  ? 'bg-gradient-to-br from-[#231D0B] to-[#131C31] border-[#F5D061] shadow-[0_0_16px_rgba(212,175,55,0.2)]'
                  : msgIsFaizKhel
                  ? 'bg-gradient-to-br from-[#2B1F06] via-[#42300A] to-[#1C1404] border-[1.5px] border-[#FDE047] text-[#F8FAFC] shadow-[0_4px_20px_rgba(253,224,71,0.28),inset_0_1px_0_rgba(254,240,138,0.28)]'
                  : isMine
                  ? 'bg-gradient-to-br from-[#131C31] to-[#1E293B] border-[#38BDF8]/40 text-[#F8FAFC]'
                  : 'bg-[#131C31]/95 border-slate-400/20 text-[#F8FAFC]';

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
                      ref={(el) => {
                        communityMessageRefs.current[msg.id] = el;
                      }}
                      className={`flex items-start gap-2.5 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
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
                      <div className={`flex flex-col max-w-[84%] sm:max-w-[74%] ${isMine ? 'items-end' : 'items-start'}`}>
                        <div className={`rounded-2xl border px-3.5 py-2.5 text-xs text-[#F8FAFC] space-y-2 ${bubbleContainerClass}`}>
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

                        {/* Replied-to Quote */}
                        {msg.replyTo && (
                          <button
                            type="button"
                            onClick={() => scrollToMessageId(msg.replyTo!.id)}
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

                        {/* Text Content */}
                        {msg.text && !msg.islamicGifId && !msg.voiceNote && (
                          <p className="leading-relaxed whitespace-pre-wrap break-words text-slate-100">
                            {msg.text}
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
                      </div>

                      {/* Message Moderation & Reply Actions */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-1 px-1 text-[10px]">
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
                              onClick={() => togglePinCommunityMessage(msg.id)}
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

                        <button
                          type="button"
                          onClick={() =>
                            setDeleteModalTarget({
                              scope: 'COMMUNITY',
                              msg,
                              canDeleteForEveryone
                            })
                          }
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#111622]/90 border border-rose-500/35 text-rose-300 hover:bg-rose-950/60 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>{translate(language, 'deleteLabel')}</span>
                        </button>

                        {canMuteThisAuthor && authorRecord && (
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
                    <span>{language === 'ur' ? 'وائس نوٹ تیار ہے' : 'Ready to send'}</span>
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
                paddingBottom: isKeyboardOpen ? '12px' : 'calc(env(safe-area-inset-bottom, 16px) + 24px)'
              }}
            >
              {typeof window !== 'undefined' &&
                !(window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.() && (
                <div className="px-3 py-1 bg-[#0F172A]/95 border-b border-slate-400/15 text-[10px] text-[#38BDF8]/90 flex items-center gap-1.5">
                  <Mic className="w-3 h-3 shrink-0 text-[#38BDF8]" />
                  <span className="truncate">
                    {language === 'ur'
                      ? 'وائس ریکارڈنگ کے لیے انسٹال شدہ اینڈرائیڈ APK اور مائیک کی اجازت درکار ہے۔'
                      : 'Voice recording requires the installed Android APK with Mic permission.'}
                  </span>
                </div>
              )}
              <form
                onSubmit={handleSendCommunityMessage}
                className="p-2.5 sm:p-3.5 pb-0 flex flex-wrap sm:flex-nowrap items-end gap-1.5 sm:gap-2"
              >
                {/* Utility Icons Row on <640px, Inline on >=640px */}
                <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-1.5 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEmojiStrip(s => !s);
                        setShowIslamicGifDrawer(false);
                      }}
                      className="relative z-50 min-w-[48px] min-h-[48px] w-12 h-12 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] border border-slate-400/25 text-[#F8FAFC] hover:text-[#38BDF8] flex items-center justify-center shrink-0 cursor-pointer kc-pressable"
                      title={language === 'ur' ? 'ایموجی' : 'Quick Emojis'}
                      aria-label={language === 'ur' ? 'ایموجی' : 'Quick Emojis'}
                    >
                      <Smile className="w-5 h-5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowIslamicGifDrawer(d => !d);
                        setShowEmojiStrip(false);
                      }}
                      className="relative z-50 min-w-[48px] min-h-[48px] w-12 h-12 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-[#F5D061] border border-slate-400/25 text-base font-bold flex items-center justify-center shrink-0 cursor-pointer kc-pressable"
                      title={translate(language, 'islamicGifs')}
                      aria-label={translate(language, 'islamicGifs')}
                    >
                      ☪️
                    </button>

                    {/* Phone Gallery Photo / GIF Upload (Super Admins & Admins Only) */}
                    {canUploadGallery && (
                      <label
                        className="relative z-50 min-w-[48px] min-h-[48px] w-12 h-12 rounded-xl bg-[#0F172A] text-[#38BDF8] border border-[#38BDF8]/35 hover:bg-[#1E293B] flex items-center justify-center shrink-0 cursor-pointer kc-pressable"
                        title={language === 'ur' ? 'فون گیلری تصویر / GIF اپ لوڈ کریں' : 'Gallery Photo / GIF Upload (Up to 10MB)'}
                      >
                        <ImageIcon className="w-5 h-5" />
                        <input
                          type="file"
                          accept="image/*,.gif"
                          onChange={handleGalleryMediaUpload}
                          disabled={isCompressingMedia}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {communityText.length >= 4000 && (
                    <span className="sm:hidden text-[10px] font-mono font-bold text-[#F5D061] tabular-nums px-2 py-0.5 rounded-md bg-[#0F172A] border border-[#D4AF37]/40">
                      {communityText.length.toLocaleString()} / 5,000
                    </span>
                  )}
                </div>

                {/* Main Input Bar: Auto-Expanding 5,000-Char Textarea + Single Mic + Send */}
                <div className="flex-1 w-full sm:w-auto flex items-end gap-1.5 sm:gap-2 min-w-0">
                  <div className="flex-1 min-w-[140px] flex flex-col">
                    {communityText.length >= 4000 && (
                      <span className="hidden sm:inline-block self-end mb-1 text-[10px] font-mono font-bold text-[#F5D061] tabular-nums px-2 py-0.5 rounded-md bg-[#0F172A] border border-[#D4AF37]/40">
                        {communityText.length.toLocaleString()} / 5,000
                      </span>
                    )}
                    <textarea
                      ref={communityTextareaRef}
                      rows={1}
                      maxLength={5000}
                      dir="auto"
                      value={communityText}
                      onChange={(e) => setCommunityText(e.target.value)}
                      onKeyDown={(e) => {
                        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                          e.preventDefault();
                          handleSendCommunityMessage();
                        }
                      }}
                      placeholder={
                        isCompressingMedia
                          ? (language === 'ur' ? 'تصویر/GIF تیار کی جا رہی ہے...' : 'Optimizing image/GIF...')
                          : translate(language, 'chatTypeMessage')
                      }
                      style={{ fontSize: '16px', maxHeight: '120px' }}
                      className="w-full min-h-[48px] resize-none overflow-y-auto px-3.5 py-2.5 text-[16px] leading-[1.35] rounded-xl border border-slate-400/25 bg-[#0F172A] text-[#F8FAFC] placeholder:text-[#94A3B8]/70 focus:outline-hidden focus:border-[#38BDF8] shadow-[inset_0_2px_6px_rgba(0,0,0,0.45)]"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={startVoiceRecording}
                    className="relative z-50 min-w-[48px] min-h-[48px] w-12 h-12 rounded-xl bg-[#0F172A] border border-[#38BDF8]/35 text-[#38BDF8] hover:bg-[#1E293B] flex items-center justify-center shrink-0 cursor-pointer kc-pressable"
                    title={translate(language, 'voiceNoteHold')}
                    aria-label={translate(language, 'voiceNoteHold')}
                  >
                    <Mic className="w-5 h-5" />
                  </button>

                  <button
                    type="submit"
                    disabled={isCompressingMedia || (!communityText.trim() && !communityAttachment)}
                    className="relative z-50 min-w-[48px] min-h-[48px] h-12 px-3.5 flex items-center justify-center gap-1.5 kc-gold-button disabled:opacity-40 font-extrabold text-xs rounded-xl shrink-0 cursor-pointer kc-pressable"
                    aria-label={translate(language, 'chatSend')}
                  >
                    <Send className="w-4 h-4 shrink-0" />
                    <span className="hidden sm:inline">{translate(language, 'chatSend')}</span>
                  </button>
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
          <div className={`${mobileShowThread && activeRecipient ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-[#111622] h-full min-w-0`}>
            {activeRecipient ? (
              <>
                <div className="p-3 border-b border-[#D4AF37]/20 flex items-center justify-between gap-2 bg-[#0A0D12]/60">
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

                  <button
                    type="button"
                    onClick={() => setInspectedUserProfile(activeRecipient)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[#D4AF37]/30 bg-[#161D2C] hover:bg-slate-800 text-slate-200 text-xs font-medium shrink-0 cursor-pointer"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-[#F5D061]" />
                    <span className="hidden sm:inline">{language === 'ur' ? 'پروفائل' : 'Profile'}</span>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-[#0A0D12]/40">
                  {currentDirectMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                      <MessageSquare className="w-10 h-10 text-[#D4AF37]/40 mb-2" />
                      <p className="text-xs font-semibold text-slate-300">
                        {language === 'ur'
                          ? `${activeRecipient.name} کے ساتھ ابھی کوئی پیغام نہیں ہے۔`
                          : `No messages with ${activeRecipient.name} yet.`}
                      </p>
                      <p className="text-[11px] text-slate-500 max-w-xs mt-1">
                        {language === 'ur'
                          ? 'نیچے سے براہ راست پیغام بھیجیں — آف لائن ہونے پر بھی پیغام محفوظ ہو کر خودکار پہنچ جائے گا۔'
                          : 'Send a direct message below — even offline, your message queues and syncs automatically.'}
                      </p>
                    </div>
                  ) : (
                    currentDirectMessages.map((msg, idx) => {
                      const isMine = msg.senderId === currentUser.id;
                      const recipientIsFounder = Boolean(
                        activeRecipient.isFounder ||
                        activeRecipient.email.trim().toLowerCase() === FOUNDER_EMAIL.toLowerCase()
                      );
                      const msgFromFounder = isMine ? isFounder : recipientIsFounder;
                      const canDeleteDirectForEveryone = isFounder || (!msgFromFounder && isMine);
                      const dayKey = getCalendarDayKey(msg.timestamp);
                      const prevDayKey = idx > 0 ? getCalendarDayKey(currentDirectMessages[idx - 1].timestamp) : null;
                      const showDateDivider = idx === 0 || dayKey !== prevDayKey;

                      const directSenderIsFaizKhel = isMine
                        ? isFaizKhelUser(currentUser)
                        : isFaizKhelUser(activeRecipient);

                      return (
                        <React.Fragment key={msg.id}>
                          {showDateDivider && (
                            <div className="flex justify-center my-2">
                              <span className="px-3 py-0.5 rounded-full bg-[#090D16] border border-[#D4AF37]/30 text-[10px] font-bold text-[#F5D061]">
                                {formatChatDateDivider(msg.timestamp, language)}
                              </span>
                            </div>
                          )}
                          <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                            <div
                              className={`max-w-[85%] sm:max-w-md rounded-2xl px-3.5 py-2.5 text-xs shadow-sm space-y-1.5 ${
                                directSenderIsFaizKhel
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

                              <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>

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
                            </div>
                            {isMine && (
                              <div className="flex items-center gap-1 mt-0.5 text-[10px] px-1">
                                {renderDeliveryTick(msg)}
                              </div>
                            )}
                          </div>
                        </React.Fragment>
                      );
                    })
                  )}
                  <div ref={directEndRef} />
                </div>

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
                      onChange={(e) => setMessageText(e.target.value)}
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
          className="fixed inset-0 z-[10000] flex items-start sm:items-center justify-center bg-[#0A0D12]/90 p-4 overflow-y-auto"
          onClick={() => setIsAttachmentModalOpen(false)}
        >
          <div
            className="bg-[#111622] rounded-2xl max-w-sm w-full p-5 border border-[#D4AF37]/35 shadow-2xl space-y-4 my-auto max-h-[92dvh] overflow-y-auto"
            style={{ WebkitOverflowScrolling: 'touch' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">
                {language === 'ur' ? 'تصویر یا فائل منسلک کریں' : 'Attach Photo or File'}
              </h3>
              <button type="button" onClick={() => setIsAttachmentModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="p-4 rounded-xl border border-slate-700 hover:border-[#D4AF37] flex flex-col items-center gap-2 text-center bg-[#0A0D12] cursor-pointer">
                <ImageIcon className="w-6 h-6 text-[#F5D061]" />
                <span className="text-xs font-semibold text-white">
                  {language === 'ur' ? 'تصویر / GIF منتخب کریں' : 'Select Photo / GIF'}
                </span>
                <span className="text-[10px] text-slate-400">
                  {language === 'ur' ? '10MB تک · خودکار کمپریشن' : 'Up to 10MB · Smart <750KB'}
                </span>
                <input type="file" accept="image/*,.gif" onChange={handleDirectImageAttachment} className="hidden" />
              </label>

              <label className="p-4 rounded-xl border border-slate-700 hover:border-[#D4AF37] flex flex-col items-center gap-2 text-center bg-[#0A0D12] cursor-pointer">
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

      {/* Scenic Live Chat Theme Modal (Leadership + Founder Custom BG Upload) */}
      {isThemeModalOpen && isLeadership && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[10000] flex items-start sm:items-center justify-center bg-[#0A0D12]/90 p-4 overflow-y-auto"
          onClick={() => setIsThemeModalOpen(false)}
        >
          <div
            className="bg-[#111622] rounded-2xl max-w-md w-full p-5 border border-[#D4AF37]/40 shadow-2xl space-y-4 my-auto max-h-[92dvh] overflow-y-auto"
            style={{ WebkitOverflowScrolling: 'touch' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Palette className="w-4 h-4 text-[#F5D061]" />
                  <span>{language === 'ur' ? 'لائیو کمیونٹی منظر تھیمز' : 'Live Community Scenic Themes'}</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {language === 'ur' ? 'تمام اینڈرائیڈ موبائلز کے لیے تیز رفتار جی پی یو تھیمز۔' : 'GPU-only animated themes optimized for all Android devices.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsThemeModalOpen(false)}
                className="p-1.5 rounded-lg bg-[#161D2C] text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
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
          className="fixed inset-0 z-[10000] flex items-start sm:items-center justify-center bg-[#0A0D12]/90 p-4 overflow-y-auto"
          onClick={() => setIsBubbleColorModalOpen(false)}
        >
          <div
            className="bg-[#111622] rounded-2xl max-w-sm w-full p-5 border border-[#F5D061]/45 shadow-2xl space-y-4 my-auto max-h-[92dvh] overflow-y-auto"
            style={{ WebkitOverflowScrolling: 'touch' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-[#F5D061] flex items-center gap-2">
                <Crown className="w-4 h-4" />
                <span>{language === 'ur' ? 'بانی وی آئی پی ببل اسٹائل' : 'Founder VIP Bubble Style'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsBubbleColorModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
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
          className="fixed inset-0 z-[10002] flex items-center justify-center bg-[#0A0D12]/90 p-4"
          onClick={() => setDeleteModalTarget(null)}
        >
          <div
            className="w-full max-w-sm kc-luxury-modal rounded-2xl p-5 space-y-4 text-xs text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-[#D4AF37]/25">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-extrabold text-white">
                  {translate(language, 'deleteMessageTitle')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDeleteModalTarget(null)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
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
                    const res =
                      deleteModalTarget.scope === 'COMMUNITY'
                        ? deleteCommunityMessageForEveryone(deleteModalTarget.msg.id)
                        : deleteDirectMessageForEveryone(deleteModalTarget.msg.id);
                    if (!res.success && res.error) setChatError(res.error);
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
          className="fixed inset-0 z-[10002] flex items-center justify-center bg-[#0A0D12]/90 p-4"
          onClick={() => setIsClearOldModalOpen(false)}
        >
          <div
            className="w-full max-w-sm kc-luxury-modal rounded-2xl p-5 space-y-4 text-xs text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-[#D4AF37]/25">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-[#F5D061]" />
                <h3 className="text-sm font-extrabold text-[#F5D061]">
                  {translate(language, 'clearOldMessagesTitle')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsClearOldModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  const res = clearOldCommunityMessages('OLDER_7_DAYS');
                  if (!res.success && res.error) setChatError(res.error);
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
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#0A0D12]/95 p-4"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div className="relative max-w-2xl w-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPreviewImageUrl(null)}
              className="self-end mb-2 p-2 rounded-full bg-[#161D2C] border border-[#D4AF37]/40 text-white cursor-pointer"
              aria-label="Close image preview"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={previewImageUrl}
              alt="Full preview"
              className="max-h-[82dvh] max-w-full rounded-2xl border border-[#D4AF37]/40 object-contain"
            />
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
