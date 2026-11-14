import React, { useState, useEffect } from 'react';
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
  ArrowLeft
} from 'lucide-react';
import { compressImageFile } from '../../utils/imageCompression';
import { RoleBadge } from '../common/RoleBadge';
import { translate } from '../../data/translations';

export const ChatModule: React.FC = () => {
  const {
    currentUser,
    users,
    chats,
    chatMessages,
    queuedMessageCount,
    sendChatMessage,
    markConversationAsSeen,
    activeChatUser,
    setActiveChatUser,
    setInspectedUserProfile,
    isOnline,
    language
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [messageText, setMessageText] = useState('');
  const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false);
  const [attachmentPreview, setAttachmentPreview] = useState<{ url: string; name: string; type: 'IMAGE' | 'DOCUMENT' } | null>(null);
  const [selectedUserFilterRole, setSelectedUserFilterRole] = useState<'ALL' | 'SUPER_ADMIN' | 'ADMIN' | 'CO_ADMIN' | 'MEMBER'>('ALL');
  const [mobileShowThread, setMobileShowThread] = useState<boolean>(!!activeChatUser);
  const [chatError, setChatError] = useState<string | null>(null);

  useEffect(() => {
    if (activeChatUser) {
      setMobileShowThread(true);
    }
  }, [activeChatUser]);

  const availableUsers = users.filter(u => {
    if (!currentUser || u.id === currentUser.id) return false;
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
    currentUser && activeRecipient
      ? `chat_${[currentUser.id, activeRecipient.id].sort()[0]}_${[currentUser.id, activeRecipient.id].sort()[1]}`
      : '';

  const currentMessages = activeChatId ? chatMessages.filter(m => m.chatId === activeChatId) : [];

  useEffect(() => {
    if (activeChatId && currentUser) {
      markConversationAsSeen(activeChatId);
    }
  }, [activeChatId, currentMessages.length, currentUser, markConversationAsSeen]);

  if (!currentUser) return null;

  const handleSendMessage = (e: React.FormEvent) => {
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

  const handleImageAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setChatError(null);
    try {
      const compressed = await compressImageFile(file, 800, 0.72);
      setAttachmentPreview({
        url: compressed.dataUrl,
        name: file.name,
        type: 'IMAGE'
      });
      setIsAttachmentModalOpen(false);
    } catch (err: any) {
      setChatError(err?.message || 'Failed to compress selected image.');
    }
  };

  const handleDocumentAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
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

  const renderDeliveryTick = (msg: (typeof currentMessages)[number]) => {
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

  return (
    <div className="space-y-4 max-w-full">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#D4AF37]/25">
        <div className="min-w-0">
          <span className="text-[11px] font-bold text-[#F5D061] uppercase tracking-wider">
            Direct Messaging Network
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white mt-0.5 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-[#F5D061] shrink-0" />
            <span>{translate(language, 'chatHeader')}</span>
          </h1>
          <p className="text-xs text-slate-400">
            {translate(language, 'chatSubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#111622] border border-[#D4AF37]/30 px-3 py-1.5 rounded-xl text-[11px] text-[#F5D061] self-start sm:self-auto">
          <Shield className="w-4 h-4 text-[#F5D061] shrink-0" />
          <span>🕒 Queued · ✓ Delivered · ✓✓ Seen</span>
        </div>
      </div>

      {/* Offline Queue Banner (Non-blocking — composing & sending still work!) */}
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
        <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs font-semibold flex items-center justify-between">
          <span>{chatError}</span>
          <button onClick={() => setChatError(null)} className="p-1 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Chat Interface */}
      <div className="bg-[#111622] rounded-2xl border border-[#D4AF37]/25 shadow-xl overflow-hidden flex flex-col md:flex-row h-[calc(100dvh-290px)] min-h-[440px]">
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
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover border border-[#D4AF37]/40"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#043927] text-[#F5D061] flex items-center justify-center font-bold text-sm border border-[#D4AF37]/40">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {unreadForMe > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#F5D061] text-[#0A0D12] text-[10px] font-extrabold flex items-center justify-center">
                          {unreadForMe}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="font-semibold text-xs text-white truncate">
                          {user.name}
                        </span>
                        <RoleBadge role={user.role} isFounder={user.isFounder} compact />
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5 truncate">
                        <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="truncate">{user.cityTown || user.district}, {user.stateProvince}</span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Message Thread Viewport */}
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

                  {activeRecipient.avatarUrl ? (
                    <img
                      src={activeRecipient.avatarUrl}
                      alt={activeRecipient.name}
                      className="w-9 h-9 rounded-full object-cover border border-[#D4AF37]/40 shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[#043927] text-[#F5D061] flex items-center justify-center font-bold text-sm border border-[#D4AF37]/40 shrink-0">
                      {activeRecipient.name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm text-white truncate">
                        {activeRecipient.name}
                      </h3>
                      <RoleBadge role={activeRecipient.role} isFounder={activeRecipient.isFounder} compact />
                    </div>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span className="truncate">{activeRecipient.cityTown || activeRecipient.district}, {activeRecipient.stateProvince}</span>
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
                {currentMessages.length === 0 ? (
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
                  currentMessages.map(msg => {
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
                                <img
                                  src={msg.attachmentUrl}
                                  alt="attachment"
                                  className="w-48 max-w-full h-32 object-cover rounded-lg border border-white/20"
                                />
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

              <form onSubmit={handleSendMessage} className="p-2.5 sm:p-3 border-t border-[#D4AF37]/20 flex items-center gap-2 bg-[#0A0D12]">
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
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400 text-center">
              <MessageSquare className="w-12 h-12 text-[#D4AF37]/30 mb-2" />
              <p className="text-sm font-semibold text-slate-300">{translate(language, 'noConversations')}</p>
            </div>
          )}
        </div>
      </div>

      {/* File Attachment Modal */}
      {isAttachmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0D12]/90 p-4">
          <div className="bg-[#111622] rounded-2xl max-w-sm w-full p-5 border border-[#D4AF37]/30 shadow-xl space-y-4">
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
                <span className="text-[10px] text-slate-400">Auto-compressed JPG</span>
                <input type="file" accept="image/*" onChange={handleImageAttachment} className="hidden" />
              </label>

              <label className="p-4 rounded-xl border border-slate-700 hover:border-[#D4AF37] flex flex-col items-center gap-2 text-center bg-[#0A0D12] cursor-pointer">
                <FileText className="w-6 h-6 text-emerald-400" />
                <span className="text-xs font-semibold text-white">Select Document</span>
                <span className="text-[10px] text-slate-400">PDF / Text (&lt;1.5MB)</span>
                <input type="file" accept=".pdf,.doc,.docx,.txt,image/*" onChange={handleDocumentAttachment} className="hidden" />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
