import React, { useState, useEffect, useRef } from 'react';
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
  Minus
} from 'lucide-react';
import { compressImageFile } from '../../utils/imageCompression';
import { RoleBadge } from '../common/RoleBadge';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { ProfileCompletionGate, needsProfileCompletion } from '../common/ProfileCompletionGate';
import { translate } from '../../data/translations';
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
    <div className="rounded-xl bg-black/35 border border-[#D4AF37]/30 px-2.5 py-2 space-y-1">
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={togglePlay}
          className="w-8 h-8 rounded-full kc-gold-button flex items-center justify-center shrink-0 cursor-pointer"
          aria-label={isPlaying ? 'Pause voice note' : 'Play voice note'}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
        </button>

        <div className="flex-1 flex items-end gap-0.5 h-6 min-w-[110px]" aria-hidden="true">
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
                    ? 'bg-[#F5D061]'
                    : 'bg-slate-600'
                }`}
              />
            );
          })}
        </div>

        <span className="text-[10px] font-mono text-[#F5D061] shrink-0">
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
    deleteCommunityMessage,
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

  // Voice Recorder States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<number | null>(null);
  const recordDurationRef = useRef<number>(0);
  const cancelRecordingFlagRef = useRef<boolean>(false);

  const [chatError, setChatError] = useState<string | null>(null);
  const communityEndRef = useRef<HTMLDivElement | null>(null);
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
  const isLeadership =
    isFounder ||
    currentUser.role === 'SUPER_ADMIN' ||
    currentUser.role === 'ADMIN' ||
    currentUser.role === 'CO_ADMIN';
  const canMuteUsers = isFounder || currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';
  const isUserMutedInCommunity = Boolean(currentUser.isMutedInChat) && !isFounder;

  // Direct Chat Logic
  const availableUsers = users.filter(u => {
    if (u.id === currentUser.id) return false;
    if (selectedUserFilterRole !== 'ALL' && u.role !== selectedUserFilterRole) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        (u.district && u.district.toLowerCase().includes(q)) ||
        (u.stateProvince && u.stateProvince.toLowerCase().includes(q)) ||
        (u.membershipId && u.membershipId.toLowerCase().includes(q))
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

  const handleSendDirectMessage = (e: React.FormEvent) => {
    e.preventDefault();
    setChatError(null);
    if (!activeRecipient || (!messageText.trim() && !attachmentPreview)) return;

    const res = sendChatMessage(
      activeRecipient.id,
      messageText.trim() || (attachmentPreview ? `Shared ${attachmentPreview.type === 'IMAGE' ? 'an image' : 'a document'}: ${attachmentPreview.name}` : ''),
      attachmentPreview || undefined
    );

    if (!res.success) {
      setChatError(res.error || 'Unable to send message right now.');
      return;
    }

    setMessageText('');
    setAttachmentPreview(null);
  };

  const handleDirectImageAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setChatError(null);
    setIsCompressingMedia(true);
    try {
      const compressed = await compressImageFile(file, 1080, 0.78);
      setAttachmentPreview({
        url: compressed.dataUrl,
        name: file.name,
        type: 'IMAGE'
      });
      setIsAttachmentModalOpen(false);
    } catch (err: any) {
      setChatError(err?.message || 'Failed to compress selected image.');
    } finally {
      setIsCompressingMedia(false);
    }
  };

  const handleDirectDocumentAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) {
      setChatError('Document must be under 1.5MB for fast mobile delivery.');
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
    if (isUserMutedInCommunity) {
      setChatError('You are currently muted in Community Chat.');
      return;
    }
    if (!communityText.trim() && !communityAttachment) return;

    const res = sendCommunityMessage({
      text: communityText.trim(),
      replyTo: replyingTo || undefined,
      attachment: communityAttachment || undefined
    });

    if (!res.success) {
      setChatError(res.error || 'Failed to send community message.');
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
      setChatError(res.error || 'Unable to send Islamic greeting.');
      return;
    }
    setReplyingTo(null);
    setShowIslamicGifDrawer(false);
  };

  const handleFounderGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !isFounder) return;
    setChatError(null);
    setIsCompressingMedia(true);
    try {
      const compressed = await compressImageFile(file, 1080, 0.78);
      setCommunityAttachment({
        url: compressed.dataUrl,
        name: file.name,
        type: 'IMAGE'
      });
    } catch (err: any) {
      setChatError(err?.message || 'Unable to compress selected photo.');
    } finally {
      setIsCompressingMedia(false);
    }
  };

  const handleFounderScenicBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !isFounder) return;
    setChatError(null);
    setIsCompressingMedia(true);
    try {
      const compressed = await compressImageFile(file, 1080, 0.78);
      const res = updateLiveChatAppearance({
        liveChatTheme: 'CUSTOM',
        liveChatCustomBgUrl: compressed.dataUrl
      });
      if (!res.success) {
        setChatError(res.error || 'Could not update custom scenic background.');
      } else {
        setIsThemeModalOpen(false);
      }
    } catch (err: any) {
      setChatError(err?.message || 'Unable to compress custom scenic wallpaper.');
    } finally {
      setIsCompressingMedia(false);
    }
  };

  // Voice Recording (try/catch guarded + 60s hard cap)
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
    if (isUserMutedInCommunity) {
      setChatError('You are currently muted in Community Chat.');
      return;
    }

    try {
      if (typeof window === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || typeof MediaRecorder === 'undefined') {
        setChatError('Voice recording is not supported on this browser or device.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const preferredTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
      const supportedMime = preferredTypes.find(t => {
        try {
          return MediaRecorder.isTypeSupported(t);
        } catch {
          return false;
        }
      });

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

        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        audioChunksRef.current = [];

        if (blob.size > 950 * 1024) {
          setChatError('Voice note size exceeded mobile cloud limit. Please keep notes shorter.');
          return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          if (!dataUrl) return;
          const waveform = Array.from({ length: 16 }, (_, i) =>
            30 + Math.round(((Math.sin(i * 1.7 + recordedSec) + 1) / 2) * 65)
          );
          const res = sendCommunityMessage({
            voiceNote: {
              url: dataUrl,
              durationSec: recordedSec,
              waveform
            },
            replyTo: replyingTo || undefined
          });
          if (!res.success) {
            setChatError(res.error || 'Could not send voice note.');
          } else {
            setReplyingTo(null);
          }
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
      setChatError('Microphone access denied or unavailable. Please allow mic permission in browser/app settings.');
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
    u.id === currentUser.id || (u.isOnline !== undefined ? Boolean(u.isOnline) : u.status === 'online')
  ).length;

  return (
    <div className="space-y-4 max-w-full">
      {/* Header + Dual Mode Switcher (shown in Direct Messages view) */}
      {chatMode === 'DIRECT' && (
        <>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-[#D4AF37]/25">
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-[#F5D061] uppercase tracking-wider">
                Kifayat Connect · Live &amp; Direct Network
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
                  <span>Live Community Room</span>
                </button>

                <button
                  type="button"
                  onClick={() => setChatMode('DIRECT')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer kc-gold-button"
                >
                  <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                  <span>Direct Messages</span>
                </button>
              </div>

              <button
                type="button"
                onClick={minimizeLiveChat}
                title="Minimize Live Chat to Floating Bubble"
                aria-label="Minimize Live Chat"
                className="inline-flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl bg-[#111622] hover:bg-[#161D2C] border border-[#D4AF37]/40 text-[#F5D061] text-xs font-extrabold cursor-pointer shrink-0"
              >
                <Minus className="w-4 h-4" />
                <span className="hidden sm:inline text-[11px]">Minimize</span>
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
          MODE 1: FULL-SCREEN ULTRA-LUXURY LIVE COMMUNITY ROOM
          ============================================================ */}
      {chatMode === 'COMMUNITY' && (
        <div className="fixed inset-0 z-[9999] w-screen h-[100dvh] flex flex-col overflow-hidden bg-[#0A0D12]">
          {/* Live Scenic GPU-Only SVG/CSS Wallpaper Background */}
          <ScenicChatBackground
            themeId={activeThemeId}
            customBgUrl={appSettings.liveChatCustomBgUrl}
          />

          {/* Full-Screen Top Bar */}
          <div className="relative z-10 px-3 sm:px-5 py-2.5 border-b border-[#D4AF37]/30 bg-black/55 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#F5D061] to-[#8A6218] text-[#0A0D12] flex items-center justify-center font-black text-sm shrink-0 shadow">
                🌐
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h2 className="text-xs sm:text-sm font-extrabold text-white truncate">
                    Live Community Room
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/90 text-emerald-300 border border-emerald-500/35">
                    🟢 {onlineMembersCount} Online · {users.length} Members
                  </span>
                </div>
                <p className="text-[10px] text-[#F5D061]/90 truncate">
                  {activeThemeId === 'CUSTOM'
                    ? 'Founder Custom Scenic Wallpaper'
                    : (SCENIC_THEME_PRESETS.find(t => t.id === activeThemeId)?.label || 'Obsidian & Royal Gold')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap shrink-0">
              <button
                type="button"
                onClick={() => setChatMode('DIRECT')}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#161D2C]/90 hover:bg-[#1E273B] border border-[#D4AF37]/35 text-slate-100 text-[11px] font-bold cursor-pointer"
                title="Switch to 1-on-1 Direct Messages"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#F5D061] shrink-0" />
                <span>Direct</span>
              </button>

              {isFounder && (
                <button
                  type="button"
                  onClick={() => setIsBubbleColorModalOpen(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#161D2C]/90 hover:bg-[#1E273B] border border-[#F5D061]/45 text-[#F5D061] text-[11px] font-bold cursor-pointer"
                >
                  <Crown className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">My Bubble</span>
                </button>
              )}

              {isLeadership && (
                <button
                  type="button"
                  onClick={() => setIsThemeModalOpen(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#161D2C]/90 hover:bg-[#1E273B] border border-[#D4AF37]/40 text-slate-100 text-[11px] font-bold cursor-pointer"
                >
                  <Palette className="w-3.5 h-3.5 text-[#F5D061] shrink-0" />
                  <span className="hidden sm:inline">Theme</span>
                </button>
              )}

              {/* Minimize (—) to Floating Bubble */}
              <button
                type="button"
                onClick={minimizeLiveChat}
                title="Minimize Live Chat to Floating Bubble"
                aria-label="Minimize Live Chat Room"
                className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-[#161D2C]/95 hover:bg-[#1E273B] border border-[#D4AF37]/50 text-[#F5D061] font-extrabold cursor-pointer shrink-0"
              >
                <Minus className="w-4 h-4" />
              </button>

              {/* Hide / Close (✕) Completely */}
              <button
                type="button"
                onClick={closeAndHideLiveChat}
                title="Close & Hide Live Chat"
                aria-label="Close and Hide Live Chat"
                className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-[#161D2C]/95 hover:bg-rose-950/80 border border-rose-500/45 text-rose-300 hover:text-white font-extrabold cursor-pointer shrink-0"
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
                  {queuedMessageCount} Queued
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
                    Pinned by Founder · {pinnedMessage.senderName}
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
                  Unpin
                </button>
              )}
            </div>
          )}

          {/* Community Feed (Transparent over Scenic Wallpaper) */}
          <div className="relative z-10 flex-1 min-h-0 overflow-y-auto bg-transparent p-3 sm:p-5 space-y-3.5">
            {communityMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="w-14 h-14 rounded-2xl bg-[#111622] border border-[#D4AF37]/40 flex items-center justify-center mb-3">
                  <Globe className="w-7 h-7 text-[#F5D061]" />
                </div>
                <p className="text-sm font-bold text-white">Welcome to the Live Community Room</p>
                <p className="text-xs text-slate-300 max-w-sm mt-1">
                  Share greetings, send 60s voice notes, or send an animated Islamic card below.
                </p>
              </div>
            ) : (
              communityMessages.map(msg => {
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

                const canDeleteThisMsg =
                  !msg.isDeleted &&
                  (isFounder ||
                    (!msgIsFounder &&
                      (currentUser.role === 'SUPER_ADMIN' ||
                        currentUser.role === 'ADMIN' ||
                        currentUser.role === 'CO_ADMIN' ||
                        isMine)));

                const canMuteThisAuthor =
                  canMuteUsers &&
                  !msg.isDeleted &&
                  authorRecord &&
                  authorRecord.id !== currentUser.id &&
                  !msgIsFounder &&
                  (authorRecord.role !== 'SUPER_ADMIN' || isFounder);

                if (msg.isDeleted) {
                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className="px-3 py-1.5 rounded-xl bg-[#111622]/90 border border-slate-800 text-[11px] italic text-slate-400">
                        🗑️ {msg.text}
                      </div>
                    </div>
                  );
                }

                const bubbleContainerClass = msgIsFounder
                  ? getFounderBubbleStyle(msg.senderBubbleColor || appSettings.founderBubbleColor)
                  : msg.isHighlighted
                  ? 'bg-gradient-to-br from-[#231D0B] to-[#111622] border-[#F5D061] shadow-[0_0_16px_rgba(212,175,55,0.2)]'
                  : isMine
                  ? 'bg-gradient-to-br from-[#043927] to-[#074F37] border-[#D4AF37]/45'
                  : 'bg-[#111622]/95 border-slate-700/80';

                return (
                  <div
                    key={msg.id}
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
                      title={`View ${msg.senderName}`}
                    >
                      {avatarSrc ? (
                        <img
                          src={avatarSrc}
                          alt={msg.senderName}
                          className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border-2 ${
                            msgIsFounder ? 'border-[#F5D061]' : 'border-[#D4AF37]/40'
                          }`}
                        />
                      ) : (
                        <div
                          className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-extrabold text-xs border-2 ${
                            msgIsFounder
                              ? 'bg-gradient-to-br from-[#F5D061] to-[#9E7322] text-[#0A0D12] border-[#F5D061]'
                              : 'bg-[#043927] text-[#F5D061] border-[#D4AF37]/40'
                          }`}
                        >
                          {msg.senderName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {authorRecord && (
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-[#0A0D12] ${
                            (isMine || (authorRecord.isOnline !== undefined ? Boolean(authorRecord.isOnline) : authorRecord.status === 'online'))
                              ? 'bg-emerald-500'
                              : 'bg-slate-500'
                          }`}
                        />
                      )}
                    </button>

                    {/* Message Bubble */}
                    <div className={`flex flex-col max-w-[84%] sm:max-w-[74%] ${isMine ? 'items-end' : 'items-start'}`}>
                      <div className={`rounded-2xl border px-3.5 py-2.5 text-xs text-white space-y-2 ${bubbleContainerClass}`}>
                        {/* Wrapped Header: Name + Badges (Zero overlap!) */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          {msgIsFounder && (
                            <span className="text-[11px]" title="Founder VIP">
                              👑
                            </span>
                          )}
                          <span className={`font-extrabold text-xs ${msgIsFounder ? 'text-[#F5D061]' : 'text-emerald-300'}`}>
                            {msg.senderName}
                          </span>
                          <RoleBadge
                            role={msg.senderRole}
                            isFounder={msgIsFounder}
                            isAuditOfficer={msgIsAudit}
                            compact
                          />
                          {msg.isHighlighted && !msgIsFounder && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#F5D061]/20 border border-[#F5D061]/50 text-[#F5D061] text-[9px] font-bold">
                              ✨ Highlighted
                            </span>
                          )}
                          {msg.isPinned && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#F5D061] text-[#0A0D12] text-[9px] font-extrabold">
                              📌 Pinned
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
                          <span>Reply</span>
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
                              <span>{msg.isHighlighted ? 'Unhighlight' : 'Highlight'}</span>
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
                              <span>{msg.isPinned ? 'Unpin' : 'Pin'}</span>
                            </button>
                          </>
                        )}

                        {canDeleteThisMsg && (
                          <button
                            type="button"
                            onClick={() => {
                              const res = deleteCommunityMessage(msg.id);
                              if (!res.success && res.error) setChatError(res.error);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#111622]/90 border border-rose-500/35 text-rose-300 hover:bg-rose-950/60 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        )}

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
                            <span>{isAuthorMuted ? 'Unmute' : 'Mute'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={communityEndRef} />
          </div>

          {/* Drawers & Previews above Composer */}
          {showIslamicGifDrawer && !isUserMutedInCommunity && (
            <div className="relative z-10 p-3 bg-black/75 border-t border-[#D4AF37]/30 max-h-56 overflow-y-auto shrink-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold text-[#F5D061]">☪️ Send Animated Islamic Card</span>
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
                <span className="font-bold text-[#F5D061] block">Replying to {replyingTo.senderName}</span>
                <span className="text-slate-300 truncate block">
                  {replyingTo.isVoiceNote ? '🎤 Voice Note' : replyingTo.text}
                </span>
              </div>
              <button type="button" onClick={() => setReplyingTo(null)} className="p-1 text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {communityAttachment && (
            <div className="relative z-10 px-3.5 py-2 bg-[#161D2C]/95 border-t border-[#D4AF37]/35 flex items-center justify-between gap-2 text-xs text-[#F5D061] shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <ImageIcon className="w-4 h-4 shrink-0" />
                <span className="truncate font-semibold">{communityAttachment.name} (Compressed &lt;450KB)</span>
              </div>
              <button type="button" onClick={() => setCommunityAttachment(null)} className="p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Composer Area */}
          {requiresProfileCompletion ? (
            <div className="relative z-10 p-3 bg-black/65 border-t border-[#D4AF37]/30 shrink-0">
              <ProfileCompletionGate compact featureName="Live Community Chat" />
            </div>
          ) : isUserMutedInCommunity ? (
            <div className="relative z-10 p-3 bg-rose-950/90 border-t border-rose-500/40 text-center text-xs font-bold text-rose-200 flex items-center justify-center gap-2 shrink-0">
              <VolumeX className="w-4 h-4 text-rose-400 shrink-0" />
              <span>You are currently muted from posting in Community Chat. Direct Messages remain available.</span>
            </div>
          ) : isRecording ? (
            <div className="relative z-10 p-3 bg-black/75 border-t border-[#D4AF37]/40 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-3 h-3 rounded-full bg-rose-500 kc-scenic-twinkle shrink-0" />
                <span className="text-xs font-extrabold text-white">Recording Voice Note...</span>
                <span className="text-xs font-mono font-bold text-[#F5D061]">
                  {formatDuration(recordingSeconds)} / 1:00
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => stopVoiceRecording(true)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => stopVoiceRecording(false)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl kc-gold-button text-xs font-extrabold cursor-pointer"
                >
                  <Square className="w-3 h-3 fill-current" />
                  <span>Stop &amp; Send</span>
                </button>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSendCommunityMessage}
              className="relative z-10 p-2.5 sm:p-3.5 bg-black/60 border-t border-[#D4AF37]/30 flex items-center gap-1.5 sm:gap-2 shrink-0"
            >
              <button
                type="button"
                onClick={() => {
                  setShowEmojiStrip(s => !s);
                  setShowIslamicGifDrawer(false);
                }}
                className="p-2 rounded-xl bg-[#161D2C] text-slate-300 hover:text-[#F5D061] shrink-0 cursor-pointer"
                title="Quick Emojis"
              >
                <Smile className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowIslamicGifDrawer(d => !d);
                  setShowEmojiStrip(false);
                }}
                className="px-2 py-2 rounded-xl bg-[#161D2C] text-[#F5D061] border border-[#D4AF37]/30 text-xs font-bold shrink-0 cursor-pointer"
                title="Islamic Greeting Cards"
              >
                ☪️
              </button>

              {/* Founder-Only Gallery Photo / GIF Upload */}
              {isFounder && (
                <label
                  className="p-2 rounded-xl bg-[#161D2C] text-[#F5D061] border border-[#F5D061]/35 hover:bg-[#1E273B] shrink-0 cursor-pointer"
                  title="Founder Gallery Photo / GIF Upload (<450KB)"
                >
                  <ImageIcon className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFounderGalleryUpload}
                    disabled={isCompressingMedia}
                    className="hidden"
                  />
                </label>
              )}

              <input
                type="text"
                value={communityText}
                onChange={(e) => setCommunityText(e.target.value)}
                placeholder={isCompressingMedia ? 'Compressing photo...' : 'Message Community Room...'}
                className="flex-1 min-w-0 px-3 py-2 text-xs rounded-xl border border-slate-700 bg-[#111622]/90 text-white focus:outline-hidden focus:border-[#D4AF37]"
              />

              <button
                type="button"
                onClick={startVoiceRecording}
                className="p-2 rounded-xl bg-[#161D2C] border border-[#D4AF37]/30 text-[#F5D061] hover:bg-[#1E273B] shrink-0 cursor-pointer"
                title="Record Voice Note (Max 60s)"
              >
                <Mic className="w-4 h-4" />
              </button>

              <button
                type="submit"
                disabled={!communityText.trim() && !communityAttachment}
                className="flex items-center gap-1 px-3.5 py-2 kc-gold-button disabled:opacity-40 font-extrabold text-xs rounded-xl shrink-0 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{translate(language, 'chatSend')}</span>
              </button>
            </form>
          )}
        </div>
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
                  const isMemberOnline = user.isOnline !== undefined ? Boolean(user.isOnline) : user.status === 'online';

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
                          <div className="w-10 h-10 rounded-full bg-[#043927] text-[#F5D061] flex items-center justify-center font-bold text-sm border border-[#D4AF37]/40">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span
                          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0A0D12] ${
                            isMemberOnline ? 'bg-emerald-500' : 'bg-slate-500'
                          }`}
                          title={isMemberOnline ? 'Online' : 'Offline'}
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
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                              isMemberOnline
                                ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/35'
                                : 'bg-slate-900 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {isMemberOnline ? '🟢 Online' : '⚫ Offline'}
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
                      title="Back to Contacts"
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
                        <div className="w-9 h-9 rounded-full bg-[#043927] text-[#F5D061] flex items-center justify-center font-bold text-sm border border-[#D4AF37]/40">
                          {activeRecipient.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span
                        className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#0A0D12] ${
                          (activeRecipient.isOnline !== undefined ? Boolean(activeRecipient.isOnline) : activeRecipient.status === 'online')
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
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            (activeRecipient.isOnline !== undefined ? Boolean(activeRecipient.isOnline) : activeRecipient.status === 'online')
                              ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/35'
                              : 'bg-slate-900 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {(activeRecipient.isOnline !== undefined ? Boolean(activeRecipient.isOnline) : activeRecipient.status === 'online')
                            ? '🟢 Online'
                            : '⚫ Offline'}
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
                    <span className="hidden sm:inline">Profile</span>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-[#0A0D12]/40">
                  {currentDirectMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                      <MessageSquare className="w-10 h-10 text-[#D4AF37]/40 mb-2" />
                      <p className="text-xs font-semibold text-slate-300">
                        No messages with {activeRecipient.name} yet.
                      </p>
                      <p className="text-[11px] text-slate-500 max-w-xs mt-1">
                        Send a direct message below — even offline, your message queues and syncs automatically.
                      </p>
                    </div>
                  ) : (
                    currentDirectMessages.map(msg => {
                      const isMine = msg.senderId === currentUser.id;
                      return (
                        <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                          <div
                            className={`max-w-[85%] sm:max-w-md rounded-2xl px-3.5 py-2.5 text-xs shadow-sm space-y-1.5 ${
                              isMine
                                ? 'bg-gradient-to-br from-[#043927] to-[#065239] text-white border border-[#D4AF37]/40 rounded-br-none'
                                : 'bg-[#161D2C] text-slate-100 border border-slate-700/80 rounded-bl-none'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3 text-[10px] opacity-80 font-semibold">
                              <span className={isMine ? 'text-[#F5D061]' : 'text-emerald-300'}>
                                {isMine ? 'You' : msg.senderName}
                              </span>
                              <span className="font-mono text-slate-300">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
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
                      );
                    })
                  )}
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

                {requiresProfileCompletion ? (
                  <div className="p-2.5 sm:p-3 border-t border-[#D4AF37]/20 bg-[#0A0D12]">
                    <ProfileCompletionGate compact featureName="Direct Messaging" />
                  </div>
                ) : (
                <form onSubmit={handleSendDirectMessage} className="p-2.5 sm:p-3 border-t border-[#D4AF37]/20 flex items-center gap-2 bg-[#0A0D12]">
                  <button
                    type="button"
                    onClick={() => setIsAttachmentModalOpen(true)}
                    className="p-2 text-slate-400 hover:text-[#F5D061] rounded-xl hover:bg-[#161D2C] cursor-pointer"
                    title="Attach photo or document"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder={isOnline ? translate(language, 'chatTypeMessage') : `${translate(language, 'chatTypeMessage')} (Offline Queue)`}
                    className="flex-1 min-w-0 px-3 py-2 text-xs rounded-xl border border-slate-700 bg-[#111622] text-white focus:outline-hidden focus:border-[#D4AF37]"
                  />

                  <button
                    type="submit"
                    disabled={!messageText.trim() && !attachmentPreview}
                    className="flex items-center gap-1.5 px-3.5 py-2 kc-gold-button disabled:opacity-40 font-extrabold text-xs rounded-xl shrink-0 cursor-pointer"
                  >
                    {isOnline ? <Send className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
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
      {isAttachmentModalOpen && (
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
              <h3 className="text-sm font-bold text-white">Attach Photo or File</h3>
              <button type="button" onClick={() => setIsAttachmentModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="p-4 rounded-xl border border-slate-700 hover:border-[#D4AF37] flex flex-col items-center gap-2 text-center bg-[#0A0D12] cursor-pointer">
                <ImageIcon className="w-6 h-6 text-[#F5D061]" />
                <span className="text-xs font-semibold text-white">Select Photo</span>
                <span className="text-[10px] text-slate-400">Compressed &lt;450KB</span>
                <input type="file" accept="image/*" onChange={handleDirectImageAttachment} className="hidden" />
              </label>

              <label className="p-4 rounded-xl border border-slate-700 hover:border-[#D4AF37] flex flex-col items-center gap-2 text-center bg-[#0A0D12] cursor-pointer">
                <FileText className="w-6 h-6 text-emerald-400" />
                <span className="text-xs font-semibold text-white">Select Document</span>
                <span className="text-[10px] text-slate-400">PDF / Text (&lt;1.5MB)</span>
                <input type="file" accept=".pdf,.doc,.docx,.txt,image/*" onChange={handleDirectDocumentAttachment} className="hidden" />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Scenic Live Chat Theme Modal (Leadership + Founder Custom BG Upload) */}
      {isThemeModalOpen && isLeadership && (
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
                  <span>Live Community Scenic Themes</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  GPU-only animated themes optimized for all Android devices.
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
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-white mt-2">{theme.label}</p>
                    <p className="text-[10px] text-slate-300/80">{theme.subtitle}</p>
                  </button>
                );
              })}
            </div>

            {isFounder && (
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#F5D061]">
                  <Crown className="w-3.5 h-3.5" />
                  <span>Founder Exclusive: Custom Scenic Background</span>
                </div>
                <label className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-[#F5D061]/50 bg-[#0A0D12] hover:bg-[#161D2C] text-xs font-bold text-[#F5D061] cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>{isCompressingMedia ? 'Compressing Wallpaper...' : 'Upload Custom Photo Wallpaper (<450KB)'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFounderScenicBgUpload}
                    disabled={isCompressingMedia}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Founder Exclusive Bubble Color Picker Modal */}
      {isBubbleColorModalOpen && isFounder && (
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
                <span>Founder VIP Bubble Style</span>
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
        </div>
      )}

      {/* Fullscreen Image Preview Modal */}
      {previewImageUrl && (
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
        </div>
      )}
    </div>
  );
};

export const ChatModule: React.FC = () => (
  <ErrorBoundary title="Community Chat Recovering">
    <ChatModuleContent />
  </ErrorBoundary>
);
