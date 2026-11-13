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
  CheckCheck,
  X,
  MapPin,
  WifiOff,
  ArrowLeft
} from 'lucide-react';
import { compressImageFile } from '../../utils/imageCompression';
import { RoleBadge } from '../common/RoleBadge';

export const ChatModule: React.FC = () => {
  const {
    currentUser,
    users,
    chatMessages,
    sendChatMessage,
    activeChatUser,
    setActiveChatUser,
    setInspectedUserProfile,
    isOnline
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [messageText, setMessageText] = useState('');
  const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false);
  const [attachmentPreview, setAttachmentPreview] = useState<{ url: string; name: string; type: 'IMAGE' | 'DOCUMENT' } | null>(null);
  const [selectedUserFilterRole, setSelectedUserFilterRole] = useState<'ALL' | 'ADMIN' | 'CO_ADMIN' | 'MEMBER'>('ALL');
  const [mobileShowThread, setMobileShowThread] = useState<boolean>(!!activeChatUser);
  const [chatError, setChatError] = useState<string | null>(null);

  useEffect(() => {
    if (activeChatUser) {
      setMobileShowThread(true);
    }
  }, [activeChatUser]);

  if (!currentUser) return null;

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

  const activeChatId = activeRecipient
    ? `chat_${[currentUser.id, activeRecipient.id].sort()[0]}_${[currentUser.id, activeRecipient.id].sort()[1]}`
    : '';

  const currentMessages = chatMessages.filter(m => m.chatId === activeChatId);

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

  return (
    <div className="space-y-4 max-w-full">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Direct Messaging Network
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-amber-500 shrink-0" />
            <span>Kifayat Connect Chat</span>
          </h1>
          <p className="text-xs text-slate-500">
            1-on-1 private messaging & official Elaanat inbox
          </p>
        </div>

        <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-3 py-1.5 rounded-lg text-[11px] text-amber-800 dark:text-amber-300">
          <Shield className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Confidential direct messaging between sender & recipient.</span>
        </div>
      </div>

      {/* Offline Restriction Banner */}
      {!isOnline && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>Internet connection required for live messaging.</span>
        </div>
      )}

      {chatError && (
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-semibold flex items-center justify-between">
          <span>{chatError}</span>
          <button onClick={() => setChatError(null)} className="p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Chat Interface */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col md:flex-row h-[calc(100dvh-290px)] min-h-[440px]">
        {/* Left Side: Directory & Active Chats */}
        <div className={`${mobileShowThread && activeRecipient ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 border-r border-slate-200 dark:border-slate-800 flex-col bg-slate-50/50 dark:bg-slate-950/50 h-full`}>
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search member, admin, district..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto text-[11px] pb-1">
              {(['ALL', 'ADMIN', 'CO_ADMIN', 'MEMBER'] as const).map(role => (
                <button
                  key={role}
                  onClick={() => setSelectedUserFilterRole(role)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
                    selectedUserFilterRole === role
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {role === 'ALL' ? 'All Contacts' : role === 'ADMIN' ? 'District Admins' : role === 'CO_ADMIN' ? 'State Co-Admins' : 'Members'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {availableUsers.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No contacts available yet. Approved members and admins will appear here.
              </div>
            ) : (
              availableUsers.map(user => {
                const isSelected = activeRecipient?.id === user.id;
                return (
                  <button
                    key={user.id}
                    onClick={() => {
                      setActiveChatUser(user);
                      setMobileShowThread(true);
                    }}
                    className={`w-full p-3 text-left flex items-start gap-3 transition-colors ${
                      isSelected
                        ? 'bg-amber-50/70 dark:bg-amber-950/30 border-l-4 border-amber-500'
                        : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="relative shrink-0">
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#0a192f] text-amber-400 flex items-center justify-center font-bold text-sm border border-amber-500/30">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                          {user.name}
                        </span>
                        <RoleBadge role={user.role} compact />
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5 truncate">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
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
        <div className={`${mobileShowThread && activeRecipient ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-white dark:bg-slate-900 h-full min-w-0`}>
          {activeRecipient ? (
            <>
              <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 bg-slate-50/50 dark:bg-slate-950/30">
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => setMobileShowThread(false)}
                    className="md:hidden p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 shrink-0"
                    title="Back to Contacts"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  {activeRecipient.avatarUrl ? (
                    <img
                      src={activeRecipient.avatarUrl}
                      alt={activeRecipient.name}
                      className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[#0a192f] text-amber-400 flex items-center justify-center font-bold text-sm border border-amber-500/30 shrink-0">
                      {activeRecipient.name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {activeRecipient.name}
                      </h3>
                      <RoleBadge role={activeRecipient.role} compact />
                    </div>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span className="truncate">{activeRecipient.cityTown || activeRecipient.district}, {activeRecipient.stateProvince}</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setInspectedUserProfile(activeRecipient)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium shrink-0"
                >
                  <UserIcon className="w-3.5 h-3.5 text-amber-500" />
                  <span className="hidden sm:inline">View Profile</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-slate-50/30 dark:bg-slate-950/20">
                {currentMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                    <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-2" />
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      No messages with {activeRecipient.name} yet.
                    </p>
                    <p className="text-[11px] text-slate-400 max-w-xs mt-1">
                      Send a direct message below to start a private conversation.
                    </p>
                  </div>
                ) : (
                  currentMessages.map(msg => {
                    const isMine = msg.senderId === currentUser.id;
                    return (
                      <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                        <div
                          className={`max-w-[85%] sm:max-w-md rounded-2xl px-3.5 py-2 text-xs shadow-2xs space-y-1.5 ${
                            isMine
                              ? 'bg-[#0a192f] text-white dark:bg-amber-500 dark:text-slate-950 rounded-br-none'
                              : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700/80 rounded-bl-none'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3 text-[10px] opacity-75 font-semibold">
                            <span>{isMine ? 'You' : msg.senderName}</span>
                            <span className="font-mono">
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>

                          {msg.attachmentUrl && (
                            <div className="pt-1.5 border-t border-white/20 dark:border-slate-700/40">
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
                                  className="flex items-center gap-2 p-2 rounded bg-black/10 dark:bg-white/10 text-[11px] underline"
                                >
                                  <FileText className="w-4 h-4 shrink-0" />
                                  <span className="truncate">{msg.attachmentName || 'Document'}</span>
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5 text-[10px] text-slate-400 px-1">
                          {isMine && <CheckCheck className="w-3 h-3 text-amber-500" />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {attachmentPreview && (
                <div className="p-2 px-4 bg-amber-50 dark:bg-amber-950/60 border-t border-amber-200 dark:border-amber-800 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
                  <div className="flex items-center gap-2 min-w-0">
                    {attachmentPreview.type === 'IMAGE' ? <ImageIcon className="w-4 h-4 shrink-0" /> : <FileText className="w-4 h-4 shrink-0" />}
                    <span className="font-medium truncate">{attachmentPreview.name}</span>
                  </div>
                  <button onClick={() => setAttachmentPreview(null)} className="p-1 rounded">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <form onSubmit={handleSendMessage} className="p-2.5 sm:p-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 bg-white dark:bg-slate-900">
                <button
                  type="button"
                  disabled={!isOnline}
                  onClick={() => setIsAttachmentModalOpen(true)}
                  className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 disabled:opacity-40 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Attach photo or document"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                <input
                  type="text"
                  disabled={!isOnline}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={isOnline ? `Message ${activeRecipient.name}...` : 'Connect to internet to message'}
                  className="flex-1 min-w-0 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-amber-500 disabled:opacity-60"
                />

                <button
                  type="submit"
                  disabled={!isOnline || (!messageText.trim() && !attachmentPreview)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-slate-950 font-bold text-xs rounded-lg shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400 text-center">
              <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-2" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Select a contact to start chatting</p>
            </div>
          )}
        </div>
      </div>

      {/* Real File Attachment Modal */}
      {isAttachmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-sm w-full p-5 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Attach Photo or File</h3>
              <button onClick={() => setIsAttachmentModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-amber-500 flex flex-col items-center gap-2 text-center bg-slate-50 dark:bg-slate-800/60 cursor-pointer">
                <ImageIcon className="w-6 h-6 text-amber-500" />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Select Photo</span>
                <span className="text-[10px] text-slate-400">Auto-compressed JPG</span>
                <input type="file" accept="image/*" onChange={handleImageAttachment} className="hidden" />
              </label>

              <label className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-amber-500 flex flex-col items-center gap-2 text-center bg-slate-50 dark:bg-slate-800/60 cursor-pointer">
                <FileText className="w-6 h-6 text-blue-500" />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Select Document</span>
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
