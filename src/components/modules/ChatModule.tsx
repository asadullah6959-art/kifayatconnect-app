import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  MessageSquare, 
  Send, 
  Search, 
  Paperclip, 
  Image, 
  FileText, 
  Shield, 
  User as UserIcon, 
  Check, 
  CheckCheck, 
  AlertTriangle,
  X,
  Phone,
  Mail,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { User, ChatMessage } from '../../types';

export const ChatModule: React.FC = () => {
  const { 
    currentUser, 
    users, 
    chats, 
    chatMessages, 
    sendChatMessage, 
    activeChatUser, 
    setActiveChatUser,
    setInspectedUserProfile,
    appSettings
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [messageText, setMessageText] = useState('');
  const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false);
  const [attachmentPreview, setAttachmentPreview] = useState<{ url: string; name: string; type: 'IMAGE' | 'DOCUMENT' } | null>(null);
  const [selectedUserFilterRole, setSelectedUserFilterRole] = useState<'ALL' | 'ADMIN' | 'CO_ADMIN' | 'MEMBER'>('ALL');

  // Candidate users to chat with (excluding current user)
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

  // Selected recipient
  const activeRecipient = activeChatUser || (availableUsers.length > 0 ? availableUsers[0] : null);

  // Active chat conversation messages
  const activeChatId = activeRecipient 
    ? `chat_${[currentUser.id, activeRecipient.id].sort()[0]}_${[currentUser.id, activeRecipient.id].sort()[1]}`
    : '';

  const currentMessages = chatMessages.filter(m => m.chatId === activeChatId);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRecipient || (!messageText.trim() && !attachmentPreview)) return;

    sendChatMessage(
      activeRecipient.id, 
      messageText.trim() || (attachmentPreview ? `Shared ${attachmentPreview.type === 'IMAGE' ? 'an image' : 'a document'}: ${attachmentPreview.name}` : ''),
      attachmentPreview || undefined
    );

    setMessageText('');
    setAttachmentPreview(null);
  };

  const handleSimulateAttachment = (type: 'IMAGE' | 'DOCUMENT') => {
    if (type === 'IMAGE') {
      setAttachmentPreview({
        url: '/src/assets/images/receipt_watermark_seal_1794225904149.jpg',
        name: 'Official_Welfare_Evidence_Photo.jpg',
        type: 'IMAGE'
      });
    } else {
      setAttachmentPreview({
        url: '#document',
        name: 'Kifayat_Membership_Bylaws_Reference.pdf',
        type: 'DOCUMENT'
      });
    }
    setIsAttachmentModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Real-Time Communication Network
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-xs text-slate-500">Secure Direct Messaging</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-amber-500" />
            <span>Kifayat Connect Chat</span>
          </h1>
          <p className="text-xs text-slate-500">
            End-to-end direct coordination between Members, District Admins, State Co-Admins, and Central Leadership.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-3 py-1.5 rounded-lg text-xs text-amber-800 dark:text-amber-300">
          <Shield className="w-4 h-4 text-amber-600" />
          <span>Strict Privacy: Private messages remain confidential between sender & recipient.</span>
        </div>
      </div>

      {/* Main Chat Interface Split View */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col md:flex-row h-[640px]">
        
        {/* Left Side: Directory & Active Chats */}
        <div className="w-full md:w-80 lg:w-96 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-950/50">
          {/* Search and Filters */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search member, admin, district..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* Role Filter Chips */}
            <div className="flex items-center gap-1 overflow-x-auto text-[11px] pb-1">
              {(['ALL', 'ADMIN', 'CO_ADMIN', 'MEMBER'] as const).map(role => (
                <button
                  key={role}
                  onClick={() => setSelectedUserFilterRole(role)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
                    selectedUserFilterRole === role
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:text-slate-900'
                  }`}
                >
                  {role === 'ALL' ? 'All Contacts' : role === 'ADMIN' ? 'District Admins' : role === 'CO_ADMIN' ? 'State Co-Admins' : 'Members'}
                </button>
              ))}
            </div>
          </div>

          {/* Contact List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {availableUsers.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No contacts match your search.
              </div>
            ) : (
              availableUsers.map(user => {
                const isSelected = activeRecipient?.id === user.id;
                return (
                  <button
                    key={user.id}
                    onClick={() => setActiveChatUser(user)}
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
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 text-sm">
                          {user.name.charAt(0)}
                        </div>
                      )}
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                          {user.name}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                          user.role === 'SUPER_ADMIN'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                            : user.role === 'ADMIN'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : user.role === 'CO_ADMIN'
                            ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}>
                          {user.role === 'ADMIN' ? 'Dist Admin' : user.role === 'CO_ADMIN' ? 'Co-Admin' : user.role.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5 truncate">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{user.district}, {user.stateProvince}</span>
                      </div>

                      {user.assignedOfficeTitle && (
                        <span className="inline-block text-[10px] text-amber-700 dark:text-amber-400 font-medium truncate mt-0.5">
                          ⭐ {user.assignedOfficeTitle}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Message Thread Viewport */}
        <div className="flex-1 flex flex-col bg-white dark:bg-slate-900">
          {activeRecipient ? (
            <>
              {/* Active Conversation Top Bar */}
              <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-950/30">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {activeRecipient.avatarUrl ? (
                      <img 
                        src={activeRecipient.avatarUrl} 
                        alt={activeRecipient.name} 
                        className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700" 
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 text-sm">
                        {activeRecipient.name.charAt(0)}
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                        {activeRecipient.name}
                      </h3>
                      <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {activeRecipient.role === 'ADMIN' ? 'District Admin' : activeRecipient.role === 'CO_ADMIN' ? 'State Co-Admin' : activeRecipient.role.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <MapPin className="w-3 h-3 text-emerald-600" />
                      <span>{activeRecipient.district}, {activeRecipient.stateProvince}</span>
                      <span>·</span>
                      <span className="font-mono">{activeRecipient.membershipId || 'Member'}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setInspectedUserProfile(activeRecipient)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors shadow-xs"
                    title="View user public profile"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-amber-500" />
                    <span>View Profile</span>
                  </button>
                </div>
              </div>

              {/* Messages Thread Container */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30 dark:bg-slate-950/20">
                {currentMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                    <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-2" />
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      No message history with {activeRecipient.name} yet.
                    </p>
                    <p className="text-[11px] text-slate-400 max-w-xs mt-1">
                      Send a message below to begin direct private coordination.
                    </p>
                  </div>
                ) : (
                  currentMessages.map(msg => {
                    const isMine = msg.senderId === currentUser.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-md rounded-2xl px-4 py-2.5 text-xs shadow-xs space-y-1.5 ${
                            isMine
                              ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 rounded-br-none'
                              : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700/80 rounded-bl-none'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3 text-[10px] opacity-75 font-semibold">
                            <span>{isMine ? 'You' : msg.senderName}</span>
                            <span className="font-mono">
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <p className="leading-relaxed whitespace-pre-wrap">
                            {msg.text}
                          </p>

                          {msg.attachmentUrl && (
                            <div className="pt-1.5 border-t border-white/20 dark:border-slate-700/40">
                              {msg.attachmentType === 'IMAGE' ? (
                                <img
                                  src={msg.attachmentUrl}
                                  alt="attachment"
                                  className="w-48 h-32 object-cover rounded-lg border border-white/20"
                                />
                              ) : (
                                <div className="flex items-center gap-2 p-2 rounded bg-black/10 dark:bg-white/10 text-[11px]">
                                  <FileText className="w-4 h-4 shrink-0" />
                                  <span className="truncate">{msg.attachmentName || 'Document attachment'}</span>
                                </div>
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

              {/* Attachment Preview Banner */}
              {attachmentPreview && (
                <div className="p-2 px-4 bg-amber-50 dark:bg-amber-950/60 border-t border-amber-200 dark:border-amber-800 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
                  <div className="flex items-center gap-2">
                    {attachmentPreview.type === 'IMAGE' ? <Image className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                    <span className="font-medium truncate max-w-xs">{attachmentPreview.name}</span>
                  </div>
                  <button
                    onClick={() => setAttachmentPreview(null)}
                    className="p-1 hover:bg-amber-200 dark:hover:bg-amber-900 rounded"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Input Area */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 bg-white dark:bg-slate-900">
                <button
                  type="button"
                  onClick={() => setIsAttachmentModalOpen(true)}
                  className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Attach photo or document"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={`Write a private message to ${activeRecipient.name}...`}
                  className="flex-1 px-3.5 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />

                <button
                  type="submit"
                  disabled={!messageText.trim() && !attachmentPreview}
                  className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-slate-950 font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400">
              <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-2" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Select a contact to begin chatting</p>
            </div>
          )}
        </div>
      </div>

      {/* Attachment Simulation Modal */}
      {isAttachmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-sm w-full p-5 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Attach File to Message</h3>
              <button onClick={() => setIsAttachmentModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Select an attachment type to share verification evidence, receipts, or official notices:
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSimulateAttachment('IMAGE')}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-amber-500 dark:hover:border-amber-500 flex flex-col items-center gap-2 text-center transition-all bg-slate-50 dark:bg-slate-800/60"
              >
                <Image className="w-6 h-6 text-amber-500" />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Share Image / Photo</span>
                <span className="text-[10px] text-slate-400">JPG, PNG receipt</span>
              </button>

              <button
                type="button"
                onClick={() => handleSimulateAttachment('DOCUMENT')}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-amber-500 dark:hover:border-amber-500 flex flex-col items-center gap-2 text-center transition-all bg-slate-50 dark:bg-slate-800/60"
              >
                <FileText className="w-6 h-6 text-blue-500" />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Share Document</span>
                <span className="text-[10px] text-slate-400">PDF, bylaws, slips</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
