"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useTranslation } from "@/lib/i18n/context";
import {
  Send, ArrowLeft, Plus, Users, Shield, User, Search,
  CheckCheck, MessageCircle, X, Languages,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatRoom {
  id: string;
  ad: string;
  tip: "GENEL" | "YONETIM" | "OZEL";
  lastMessage: {
    icerik: string;
    sender: string;
    createdAt: string;
  } | null;
  unreadCount: number;
  messageCount: number;
}

interface Message {
  id: string;
  icerik: string;
  createdAt: string;
  sender: {
    id: string;
    ad: string;
    soyad: string;
    rol: string;
  };
}

interface BuildingUser {
  id: string;
  ad: string;
  soyad: string;
  rol: string;
}

const SENDER_COLORS = [
  "text-emerald-600 dark:text-emerald-400",
  "text-violet-600 dark:text-violet-400",
  "text-orange-600 dark:text-orange-400",
  "text-pink-600 dark:text-pink-400",
  "text-cyan-600 dark:text-cyan-400",
  "text-rose-600 dark:text-rose-400",
  "text-amber-600 dark:text-amber-400",
  "text-indigo-600 dark:text-indigo-400",
];

function getSenderColor(senderId: string): string {
  let hash = 0;
  for (let i = 0; i < senderId.length; i++) {
    hash = senderId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return SENDER_COLORS[Math.abs(hash) % SENDER_COLORS.length];
}

const ROOM_ICONS: Record<string, typeof MessageCircle> = {
  GENEL: Users,
  YONETIM: Shield,
  OZEL: User,
};

export default function MessagesPage() {
  const { data: session } = useSession();
  const { t, locale } = useTranslation();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [users, setUsers] = useState<BuildingUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [roomName, setRoomName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [translatedMessages, setTranslatedMessages] = useState<Record<string, string>>({});
  const [translating, setTranslating] = useState(false);
  const [autoTranslate, setAutoTranslate] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!session) return;
    fetch("/api/mesajlar/init", { method: "POST" }).then(() => fetchRooms());
  }, [session]);

  const fetchRooms = async () => {
    try {
      const res = await fetch("/api/mesajlar/odalar");
      if (res.ok) setRooms(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  };

  const translateMessages = useCallback(async (msgs: Message[]) => {
    if (!autoTranslate || locale === "tr") return;

    const untranslated = msgs.filter(m => !translatedMessages[m.id] && m.sender.id !== session?.user?.id);
    if (untranslated.length === 0) return;

    setTranslating(true);
    try {
      const res = await fetch("/api/ceviri", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          texts: untranslated.map(m => ({ id: m.id, text: m.icerik })),
          to: locale,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setTranslatedMessages(prev => ({ ...prev, ...data.translations }));
      }
    } catch {} finally {
      setTranslating(false);
    }
  }, [autoTranslate, locale, translatedMessages, session?.user?.id]);

  const fetchMessages = useCallback(async (roomId: string) => {
    try {
      const res = await fetch(`/api/mesajlar/odalar/${roomId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
        setTimeout(scrollToBottom, 100);
        if (autoTranslate && locale !== "tr") {
          translateMessages(data.messages);
        }
      }
    } catch {}
  }, [scrollToBottom, autoTranslate, locale, translateMessages]);

  const selectRoom = (roomId: string) => {
    setSelectedRoom(roomId);
    setMessages([]);
    setTranslatedMessages({});
    fetchMessages(roomId);

    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      fetchMessages(roomId);
      fetchRooms();
    }, 5000);
  };

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/mesajlar/odalar/${selectedRoom}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ icerik: newMessage }),
      });
      if (res.ok) {
        setNewMessage("");
        await fetchMessages(selectedRoom);
        fetchRooms();
        inputRef.current?.focus();
      }
    } catch {} finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/kullanicilar");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.filter((u: BuildingUser) => u.id !== session?.user?.id));
      }
    } catch {}
  };

  const createPrivateRoom = async () => {
    if (!selectedUser) return;
    const u = users.find(x => x.id === selectedUser);
    const name = roomName.trim() || `${u?.ad} ${u?.soyad}`;
    try {
      const res = await fetch("/api/mesajlar/odalar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ad: name, tip: "OZEL", memberIds: [selectedUser] }),
      });
      if (res.ok) {
        const room = await res.json();
        setShowNewChat(false);
        setSelectedUser(null);
        setRoomName("");
        await fetchRooms();
        selectRoom(room.id);
      }
    } catch {}
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diff === 0) return t.chat.today;
    if (diff === 1) return t.chat.yesterday;
    return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const formatRoomTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diff === 0) return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
    if (diff === 1) return t.chat.yesterday;
    return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" });
  };

  const getDateGroups = () => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = "";
    for (const msg of messages) {
      const d = new Date(msg.createdAt).toDateString();
      if (d !== currentDate) {
        currentDate = d;
        groups.push({ date: msg.createdAt, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    }
    return groups;
  };

  const filteredRooms = rooms.filter(r =>
    !searchQuery || r.ad.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentRoom = rooms.find(r => r.id === selectedRoom);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-5rem)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-5rem)] flex bg-gray-100 dark:bg-gray-950">
      {/* Left panel - Chat list (WhatsApp style) */}
      <div className={cn(
        "w-full lg:w-[420px] flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800",
        selectedRoom ? "hidden lg:flex" : "flex"
      )}>
        {/* Header */}
        <div className="h-14 px-4 flex items-center justify-between bg-blue-600 dark:bg-blue-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-white text-sm font-semibold">
                {session?.user?.ad?.[0]}{session?.user?.soyad?.[0]}
              </span>
            </div>
            <span className="text-white font-medium text-sm">{t.chat.title}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={() => { setShowNewChat(true); fetchUsers(); }}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search bar */}
        {showSearch && (
          <div className="px-3 py-2 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-1.5">
              <Search className="w-4 h-4 text-gray-400 mr-2" />
              <input
                type="text"
                placeholder={t.common.search}
                className="flex-1 bg-transparent text-sm outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(""); setShowSearch(false); }}>
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* New chat panel */}
        {showNewChat && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-blue-50 dark:bg-blue-950/50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-sm">{t.chat.newConversation}</h3>
              <button onClick={() => { setShowNewChat(false); setSelectedUser(null); setRoomName(""); }}>
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <select
              className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm mb-2"
              value={selectedUser || ""}
              onChange={(e) => setSelectedUser(e.target.value || null)}
            >
              <option value="">{t.chat.selectUser}</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.ad} {u.soyad}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder={t.chat.roomName}
              className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm mb-3"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
            />
            <button
              onClick={createPrivateRoom}
              disabled={!selectedUser}
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-blue-700 transition-colors"
            >
              {t.chat.startChat}
            </button>
          </div>
        )}

        {/* Room list */}
        <div className="flex-1 overflow-y-auto">
          {filteredRooms.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm p-8">
              {t.chat.noConversations}
            </div>
          ) : (
            filteredRooms.map(room => {
              const RoomIcon = ROOM_ICONS[room.tip] || MessageCircle;
              return (
                <button
                  key={room.id}
                  onClick={() => selectRoom(room.id)}
                  className={cn(
                    "w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors",
                    selectedRoom === room.id && "bg-blue-50 dark:bg-blue-950/50"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0",
                    room.tip === "GENEL" ? "bg-blue-500 text-white"
                      : room.tip === "YONETIM" ? "bg-blue-700 text-white"
                        : "bg-gray-400 dark:bg-gray-600 text-white"
                  )}>
                    <RoomIcon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0 border-b border-gray-100 dark:border-gray-800 pb-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-[15px] truncate">{room.ad}</span>
                      {room.lastMessage && (
                        <span className={cn(
                          "text-xs flex-shrink-0 ml-2",
                          room.unreadCount > 0 ? "text-blue-600 dark:text-blue-400" : "text-gray-400"
                        )}>
                          {formatRoomTime(room.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      {room.lastMessage ? (
                        <p className="text-[13px] text-gray-500 truncate flex-1 mr-2">
                          <span className="text-gray-600 dark:text-gray-400">{room.lastMessage.sender.split(" ")[0]}:</span>{" "}
                          {room.lastMessage.icerik}
                        </p>
                      ) : (
                        <p className="text-[13px] text-gray-400 italic">{t.chat.noMessages}</p>
                      )}
                      {room.unreadCount > 0 && (
                        <span className="w-5 h-5 bg-blue-600 text-white text-[11px] rounded-full flex items-center justify-center flex-shrink-0 font-medium">
                          {room.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right panel - Chat area */}
      <div className={cn(
        "flex-1 flex flex-col",
        !selectedRoom ? "hidden lg:flex" : "flex"
      )}>
        {!selectedRoom ? (
          <div className="flex-1 flex items-center justify-center bg-blue-50/50 dark:bg-gray-900">
            <div className="text-center">
              <div className="w-64 h-64 mx-auto mb-6 flex items-center justify-center">
                <div className="relative">
                  <div className="w-40 h-40 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <MessageCircle className="w-20 h-20 text-blue-300 dark:text-blue-700" />
                  </div>
                </div>
              </div>
              <h2 className="text-2xl font-light text-gray-600 dark:text-gray-400 mb-2">Apollo Chat</h2>
              <p className="text-sm text-gray-400 max-w-sm mx-auto">
                {t.chat.selectConversation}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="h-14 px-4 flex items-center justify-between bg-blue-600 dark:bg-blue-800 flex-shrink-0">
              <div className="flex items-center gap-3">
                <button
                  className="lg:hidden w-8 h-8 flex items-center justify-center text-white"
                  onClick={() => {
                    setSelectedRoom(null);
                    if (pollRef.current) clearInterval(pollRef.current);
                  }}
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                {currentRoom && (
                  <>
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                      currentRoom.tip === "GENEL" ? "bg-white/20"
                        : currentRoom.tip === "YONETIM" ? "bg-white/15"
                          : "bg-white/20"
                    )}>
                      {(() => {
                        const RoomIcon = ROOM_ICONS[currentRoom.tip] || MessageCircle;
                        return <RoomIcon className="w-5 h-5 text-white" />;
                      })()}
                    </div>
                    <div>
                      <h2 className="text-white font-medium text-[15px] leading-tight">{currentRoom.ad}</h2>
                      <p className="text-white/60 text-xs">
                        {currentRoom.tip === "GENEL" ? t.chat.generalChat
                          : currentRoom.tip === "YONETIM" ? t.chat.managementChat
                            : t.chat.privateChat}
                      </p>
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1">
                {locale !== "tr" && (
                  <button
                    onClick={() => {
                      setAutoTranslate(!autoTranslate);
                      if (!autoTranslate && messages.length > 0) {
                        translateMessages(messages);
                      }
                    }}
                    className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center transition-colors",
                      autoTranslate
                        ? "text-white bg-white/20"
                        : "text-white/60 hover:text-white hover:bg-white/10"
                    )}
                    title={autoTranslate ? "Çeviri açık" : "Çeviri kapalı"}
                  >
                    <Languages className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Messages area - WhatsApp wallpaper style */}
            <div
              className="flex-1 overflow-y-auto px-4 sm:px-12 lg:px-16 py-4"
              style={{
                backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239C92AC' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/svg%3E\")",
                backgroundColor: "rgb(234 238 243)",
              }}
            >
              <div className="max-w-3xl mx-auto space-y-1">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg px-4 py-2 text-sm text-gray-500 shadow-sm">
                      {t.chat.noMessages}
                    </div>
                  </div>
                ) : (
                  getDateGroups().map((group, gi) => (
                    <div key={gi}>
                      {/* Date separator */}
                      <div className="flex items-center justify-center my-3">
                        <span className="bg-white dark:bg-gray-800 text-gray-500 text-[11px] font-medium px-3 py-1 rounded-lg shadow-sm uppercase">
                          {formatDate(group.date)}
                        </span>
                      </div>

                      {group.messages.map((msg, mi) => {
                        const isOwn = msg.sender.id === session?.user?.id;
                        const showSender = !isOwn && currentRoom?.tip !== "OZEL" && (
                          mi === 0 || group.messages[mi - 1].sender.id !== msg.sender.id
                        );
                        const isLastInGroup = mi === group.messages.length - 1 ||
                          group.messages[mi + 1]?.sender.id !== msg.sender.id;

                        const translated = translatedMessages[msg.id];
                        const showTranslation = autoTranslate && locale !== "tr" && !isOwn && translated && translated !== msg.icerik;

                        return (
                          <div
                            key={msg.id}
                            className={cn("flex mb-0.5", isOwn ? "justify-end" : "justify-start", isLastInGroup && "mb-2")}
                          >
                            <div
                              className={cn(
                                "relative max-w-[85%] sm:max-w-[65%] px-2.5 py-1.5 shadow-sm",
                                isOwn
                                  ? "bg-blue-100 dark:bg-blue-900/50 rounded-lg"
                                  : "bg-white dark:bg-gray-800 rounded-lg",
                                isOwn && isLastInGroup && "rounded-br-none",
                                !isOwn && isLastInGroup && "rounded-bl-none",
                              )}
                            >
                              {/* WhatsApp-style tail */}
                              {isLastInGroup && (
                                <div className={cn(
                                  "absolute bottom-0 w-3 h-3",
                                  isOwn
                                    ? "-right-1.5 text-blue-100 dark:text-blue-900/50"
                                    : "-left-1.5 text-white dark:text-gray-800"
                                )}>
                                  <svg viewBox="0 0 8 13" fill="currentColor">
                                    {isOwn ? (
                                      <path d="M5.188 0H0v11.193l6.467-8.625C7.526 1.156 6.958 0 5.188 0z" />
                                    ) : (
                                      <path d="M2.812 0H8v11.193L1.533 2.568C.474 1.156 1.042 0 2.812 0z" />
                                    )}
                                  </svg>
                                </div>
                              )}

                              {/* Sender name */}
                              {showSender && (
                                <p className={cn("text-[12.5px] font-medium mb-0.5", getSenderColor(msg.sender.id))}>
                                  {msg.sender.ad} {msg.sender.soyad}
                                </p>
                              )}

                              {/* Message content */}
                              <div className="flex items-end gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-[14.5px] leading-[19px] whitespace-pre-wrap break-words text-gray-900 dark:text-gray-100">
                                    {msg.icerik}
                                  </p>
                                  {showTranslation && (
                                    <div className="mt-1 pt-1 border-t border-gray-200 dark:border-gray-700">
                                      <p className="text-[13px] leading-[17px] text-gray-600 dark:text-gray-400 italic">
                                        {translated}
                                      </p>
                                    </div>
                                  )}
                                </div>
                                <span className="flex items-center gap-0.5 text-[11px] text-gray-400 dark:text-gray-500 flex-shrink-0 self-end pb-px">
                                  {formatTime(msg.createdAt)}
                                  {isOwn && (
                                    <CheckCheck className="w-4 h-4 text-blue-500 ml-0.5" />
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
                {translating && (
                  <div className="flex justify-center my-2">
                    <span className="bg-white/80 dark:bg-gray-800/80 rounded-full px-3 py-1 text-[11px] text-gray-400 shadow-sm flex items-center gap-1.5">
                      <Languages className="w-3 h-3 animate-pulse" />
                      {t.common.loading}
                    </span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input area - WhatsApp style */}
            <div className="px-3 sm:px-4 py-2 bg-gray-100 dark:bg-gray-950 flex-shrink-0">
              <div className="max-w-3xl mx-auto flex items-end gap-2">
                <div className="flex-1 bg-white dark:bg-gray-800 rounded-3xl shadow-sm flex items-end">
                  <textarea
                    ref={inputRef}
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={t.chat.typeMessage}
                    rows={1}
                    className="flex-1 resize-none bg-transparent px-4 py-2.5 text-[15px] outline-none max-h-[120px] placeholder-gray-400"
                    style={{ minHeight: "42px" }}
                  />
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  className={cn(
                    "w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-colors",
                    newMessage.trim()
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-gray-300 dark:bg-gray-700 text-gray-500"
                  )}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
