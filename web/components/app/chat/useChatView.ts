"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { askText } from "@/components/app/AppDialogHost";
import { chatRemote, useChatPresence } from "@/lib/chat-live";
import {
  GENERAL_CHANNEL_ID,
  SELF_CHANNEL_ID,
  channelRoots,
  groupByDay,
  initialsOf,
  matchesQuery,
  repliesOf,
  replyCounts,
  scheduledLabel,
} from "@/lib/chat";
import { localIsoDate } from "@/lib/date";
import {
  buildChatListItems,
  buildTaskFromChatMessage,
  filterVisibleChatItems,
  mergeChatSearchResults,
  resolveChatSubtitle,
  resolveMessagePerson,
  selectChannelFiles,
  selectChannelMembers,
  selectChannelPendingAttachments,
  selectChatPeople,
} from "@/lib/domain/chat";
import { useHublyStore } from "@/lib/store";
import type { ChatAttachment, ChatChannel, ChatMessage } from "@/lib/types";
import type { ChatComposerHandle, ChatMentionOption } from "./ChatComposer";
import type { ChatListItem } from "./ChatSidebar";

const MUTED_KEY = "hubly-chat-muted";
const PINNED_KEY = "hubly-chat-pinned";
const HIDDEN_KEY = "hubly-chat-hidden";
const PAGE_SIZE = 50;

type ChatSidePanel = { kind: "thread"; id: string } | { kind: "details" } | null;

function readIds(key: string): string[] {
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function writeIds(key: string, ids: string[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(ids));
  } catch {
    /* Sin almacenamiento: la preferencia se queda solo en esta sesión. */
  }
}

function usePreferenceList(key: string) {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => setIds(readIds(key)), [key]); // eslint-disable-line react-hooks/set-state-in-effect -- dato del navegador o de la red tras hidratar
  const toggle = useCallback((id: string) => {
    setIds((prev) => {
      const next = prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id];
      writeIds(key, next);
      return next;
    });
  }, [key]);
  return [ids, toggle] as const;
}

interface ChatSyncEffectsInput {
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  setFocusId: (id: string | null) => void;
  notice: string | null;
  setNotice: (text: string | null) => void;
  listQuery: string;
  liveReady: boolean;
  setRemoteResults: (items: ChatMessage[]) => void;
  channels: ChatChannel[];
  markChatRead: (id: string) => void;
  messagesLength: number;
  focusId: string | null;
  channelQuery: string;
  rootsLength: number;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  keepScroll: React.MutableRefObject<number | null>;
}

function useChatSyncEffects(input: ChatSyncEffectsInput) {
  const {
    selectedId, setSelectedId, setFocusId, notice, setNotice, listQuery, liveReady,
    setRemoteResults, channels, markChatRead, messagesLength, focusId, channelQuery,
    rootsLength, scrollRef, keepScroll,
  } = input;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const channel = params.get("c");
    if (channel) {
      setSelectedId(channel); // eslint-disable-line react-hooks/set-state-in-effect -- dato del navegador o de la red tras hidratar
      setFocusId(params.get("m"));
    }
  }, [setSelectedId, setFocusId]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 3500);
    return () => window.clearTimeout(timer);
  }, [notice, setNotice]);

  useEffect(() => {
    const q = listQuery.trim();
    const search = chatRemote()?.search;
    if (q.length < 2 || !search) {
      setRemoteResults([]); // eslint-disable-line react-hooks/set-state-in-effect -- dato del navegador o de la red tras hidratar
      return;
    }
    const timer = window.setTimeout(() => void search(q).then(setRemoteResults), 250);
    return () => window.clearTimeout(timer);
  }, [listQuery, liveReady, setRemoteResults]);

  useEffect(() => {
    const real =
      selectedId === GENERAL_CHANNEL_ID ? channels.find((c) => c.type === "general")
      : selectedId === SELF_CHANNEL_ID ? channels.find((c) => c.type === "self")
      : undefined;
    if (real) setSelectedId(real.id); // eslint-disable-line react-hooks/set-state-in-effect -- dato del navegador o de la red tras hidratar
  }, [selectedId, channels, setSelectedId]);

  useEffect(() => {
    useChatPresence.setState({ viewing: selectedId });
    if (!selectedId || !liveReady) return () => useChatPresence.setState({ viewing: null });
    const beat = () => chatRemote()?.setViewing(selectedId, document.visibilityState === "visible");
    beat();
    const timer = window.setInterval(beat, 20_000);
    document.addEventListener("visibilitychange", beat);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", beat);
      chatRemote()?.setViewing(selectedId, false);
      useChatPresence.setState({ viewing: null });
    };
  }, [selectedId, liveReady]);

  useEffect(() => {
    if (selectedId) markChatRead(selectedId);
  }, [selectedId, markChatRead, messagesLength]);

  useEffect(() => {
    if (focusId) {
      document.getElementById(`msg-${focusId}`)?.scrollIntoView({ block: "center" });
      return;
    }
    const el = scrollRef.current;
    if (el && keepScroll.current !== null) {
      el.scrollTop = el.scrollHeight - keepScroll.current;
      keepScroll.current = null;
      return;
    }
    if (el && !channelQuery) el.scrollTop = el.scrollHeight;
  }, [selectedId, rootsLength, focusId, channelQuery, scrollRef, keepScroll]);
}

function useChatStoreBindings() {
  const channels = useHublyStore((s) => s.channels);
  const messages = useHublyStore((s) => s.messages);
  const team = useHublyStore((s) => s.team);
  const brands = useHublyStore((s) => s.brands);
  const activeBrandId = useHublyStore((s) => s.activeBrandId);
  const profile = useHublyStore((s) => s.profile);
  const scheduled = useHublyStore((s) => s.chatScheduled);
  const sendChatMessage = useHublyStore((s) => s.sendChatMessage);
  const editChatMessage = useHublyStore((s) => s.editChatMessage);
  const deleteChatMessage = useHublyStore((s) => s.deleteChatMessage);
  const toggleChatReaction = useHublyStore((s) => s.toggleChatReaction);
  const toggleChatPin = useHublyStore((s) => s.toggleChatPin);
  const markChatRead = useHublyStore((s) => s.markChatRead);
  const addChatChannel = useHublyStore((s) => s.addChatChannel);
  const updateChatChannel = useHublyStore((s) => s.updateChatChannel);
  const deleteChatChannel = useHublyStore((s) => s.deleteChatChannel);
  const scheduleChatMessage = useHublyStore((s) => s.scheduleChatMessage);
  const cancelChatScheduled = useHublyStore((s) => s.cancelChatScheduled);
  const addChatReminder = useHublyStore((s) => s.addChatReminder);
  const setChatPreference = useHublyStore((s) => s.setChatPreference);
  const addTask = useHublyStore((s) => s.addTask);
  const tasks = useHublyStore((s) => s.tasks);
  const posts = useHublyStore((s) => s.posts);
  const online = useChatPresence((s) => s.online);
  const typing = useChatPresence((s) => s.typing);
  const hasOlder = useChatPresence((s) => s.hasOlder);
  const liveReady = useChatPresence((s) => s.ready);

  return {
    channels, messages, team, brands, activeBrandId, profile, scheduled,
    sendChatMessage, editChatMessage, deleteChatMessage, toggleChatReaction,
    toggleChatPin, markChatRead, addChatChannel, updateChatChannel,
    deleteChatChannel, scheduleChatMessage, cancelChatScheduled,
    addChatReminder, setChatPreference, addTask, tasks, posts,
    online, typing, hasOlder, liveReady,
  };
}

export function useChatView() {
  const store = useChatStoreBindings();
  const {
    channels, messages, team, brands, activeBrandId, profile, scheduled,
    sendChatMessage, editChatMessage, deleteChatMessage, toggleChatReaction,
    toggleChatPin, markChatRead, addChatChannel, updateChatChannel,
    deleteChatChannel, scheduleChatMessage, cancelChatScheduled,
    addChatReminder, setChatPreference, addTask, tasks, posts,
    online, typing, hasOlder, liveReady,
  } = store;

  const myName = profile?.name || "Equipo";
  const myInitials = initialsOf(myName);
  const myPhoto = profile?.avatarUrl;
  const myId = profile?.id ?? "";

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [listQuery, setListQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [channelQuery, setChannelQuery] = useState("");
  const [side, setSide] = useState<ChatSidePanel>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [queueOpen, setQueueOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [remoteResults, setRemoteResults] = useState<ChatMessage[]>([]);
  const keepScroll = useRef<number | null>(null);
  const [muted, toggleMutedId] = usePreferenceList(MUTED_KEY);
  const [pinnedChats, togglePinOf] = usePreferenceList(PINNED_KEY);
  const [hiddenChats, toggleHiddenOf] = usePreferenceList(HIDDEN_KEY);
  const scrollRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<ChatComposerHandle>(null);

  const people = useMemo<ChatMentionOption[]>(() => selectChatPeople(team, myName, profile?.email), [team, myName, profile?.email]);
  const me = useMemo<ChatMentionOption>(() => ({ id: myId || "yo", name: myName, initials: myInitials }), [myId, myName, myInitials]);
  const mentionNames = useMemo(() => [myName, ...people.map((p) => p.name)], [myName, people]);

  const items = useMemo<ChatListItem[]>(() => {
    const now = Date.now(); // eslint-disable-line react-hooks/purity -- se recalcula con los datos, no necesita ser puro al segundo
    return buildChatListItems({ channels, messages, muted, pinnedChats, hiddenChats, myName, myInitials, myPhoto, online, now });
  }, [channels, messages, muted, pinnedChats, hiddenChats, myName, myInitials, myPhoto, online]);

  const visibleItems = useMemo(() => filterVisibleChatItems(items, messages, listQuery), [items, messages, listQuery]);
  const results = useMemo(() => mergeChatSearchResults(messages, remoteResults, listQuery), [messages, remoteResults, listQuery]);

  const active = items.find((i) => i.id === selectedId) ?? null;
  const channel = channels.find((c) => c.id === selectedId);
  const isSelf = active?.id === SELF_CHANNEL_ID || channel?.type === "self";
  const selfId = channels.find((c) => c.type === "self")?.id ?? SELF_CHANNEL_ID;
  const typingNow = selectedId ? typing[selectedId]?.name : undefined;
  const brandId = channel?.brandId ?? activeBrandId;
  const brandName = brands.find((b) => b.id === channel?.brandId)?.name;

  const roots = useMemo(() => (selectedId ? channelRoots(messages, selectedId) : []), [messages, selectedId]);
  const counts = useMemo(() => replyCounts(messages), [messages]);
  const shown = useMemo(() => roots.filter((m) => matchesQuery(m, channelQuery)), [roots, channelQuery]);
  const paged = useMemo(() => (focusId || channelQuery ? shown : shown.slice(-limit)), [focusId, channelQuery, shown, limit]);
  const hiddenCount = shown.length - paged.length;
  const days = useMemo(() => groupByDay(paged), [paged]);
  const pinned = useMemo(() => roots.filter((m) => m.pinned), [roots]);
  const channelFiles = useMemo(() => selectChannelFiles(messages, selectedId), [messages, selectedId]);
  const threadRoot = side?.kind === "thread" ? messages.find((m) => m.id === side.id) ?? null : null;
  const replies = useMemo(() => (threadRoot ? repliesOf(messages, threadRoot.id) : []), [messages, threadRoot]);
  const queue = useMemo(
    () => (scheduled ?? []).filter((q) => q.channelId === selectedId && q.authorId === myId).sort((a, b) => a.sendAt - b.sendAt),
    [scheduled, selectedId, myId]
  );

  useChatSyncEffects({
    selectedId, setSelectedId, setFocusId, notice, setNotice, listQuery, liveReady,
    setRemoteResults, channels, markChatRead, messagesLength: messages.length,
    focusId, channelQuery, rootsLength: roots.length, scrollRef, keepScroll,
  });

  const select = useCallback((id: string | null) => {
    setSelectedId(id);
    setSide(null);
    setSearchOpen(false);
    setChannelQuery("");
    setFocusId(null);
    setLimit(PAGE_SIZE);
    setQueueOpen(false);
  }, []);

  const flag = (id: string, key: "muted" | "listPinned" | "hidden", toggleLocal: (id: string) => void) => {
    if (chatRemote()) {
      const current = channels.find((c) => c.id === id)?.[key] ?? false;
      setChatPreference(id, { [key]: !current });
    } else {
      toggleLocal(id);
    }
  };

  const toggleMute = (id: string) => {
    setNotice(items.find((i) => i.id === id)?.muted ? "Avisos activados en este chat" : "Avisos silenciados en este chat");
    flag(id, "muted", toggleMutedId);
  };

  const send = (text: string, attachments: ChatAttachment[], parentId?: string) => {
    if (!selectedId) return;
    if (attachments.length === 0) {
      sendChatMessage(selectedId, text, myName, myInitials, { parentId });
      return;
    }
    attachments.forEach((attachment, i) => sendChatMessage(selectedId, i === 0 ? text : "", myName, myInitials, { parentId, attachment }));
  };

  const createTask = (m: ChatMessage) => {
    addTask(buildTaskFromChatMessage(m, channels, activeBrandId, myName, localIsoDate()));
    setNotice("Tarea creada en Tareas");
  };

  const newChannel = async () => {
    const name = (await askText("Nombre del canal nuevo", "", "Crear canal"))?.trim();
    if (!name) return;
    select(addChatChannel({ name, type: "agency" }).id);
  };

  const openPerson = (person: ChatMentionOption) => {
    const existing = channels.find((c) => c.type === "direct" && (c.memberId === person.id || c.name === person.name));
    select(existing ? existing.id : addChatChannel({ name: person.name, type: "direct", memberId: person.id }).id);
  };

  const openMessage = (id: string) => {
    setFocusId(id);
    document.getElementById(`msg-${id}`)?.scrollIntoView({ block: "center" });
  };

  const personOf = (m: ChatMessage) => resolveMessagePerson(m, myName, profile, team, online);
  const messagePerson = (m: ChatMessage) => {
    if (m.sender === myName) return () => select(selfId);
    const member = team.find((t) => (m.senderId ? t.id === m.senderId : t.name === m.sender));
    return member ? () => openPerson({ id: member.id, name: member.name, initials: member.initials || initialsOf(member.name) }) : undefined;
  };

  const handleLoadOlder =
    hiddenCount > 0 || (selectedId && hasOlder[selectedId] && !channelQuery)
      ? () => {
          const el = scrollRef.current;
          if (el) keepScroll.current = el.scrollHeight - el.scrollTop;
          setLimit((v) => v + PAGE_SIZE);
          if (hiddenCount === 0 && selectedId) void chatRemote()?.loadOlder(selectedId);
        }
      : undefined;

  const handleSchedule = (text: string, at: number, repeat: "none" | "weekly" | "monthly") => {
    if (!active) return;
    scheduleChatMessage({ channelId: active.id, text: text.trim(), sendAt: at, repeat, authorId: myId, sender: myName, senderInitials: myInitials });
    setQueueOpen(true);
    setNotice(`Se enviará: ${scheduledLabel(at)}`);
  };

  const subtitle = resolveChatSubtitle(active, channel, brandName, isSelf);
  const members = useMemo<ChatMentionOption[]>(
    () => selectChannelMembers({ hasActive: Boolean(active), isSelf, channel, me, people, team, myName }),
    [active, isSelf, channel, me, people, team, myName]
  );
  const pending = useMemo(() => selectChannelPendingAttachments(roots, tasks, posts), [roots, tasks, posts]);

  return {
    myName, myInitials, myPhoto, myId, me, people, mentionNames, visibleItems, results,
    selectedId, listQuery, setListQuery, searchOpen, setSearchOpen, channelQuery, setChannelQuery,
    side, setSide, notice, setNotice, focusId, setFocusId, queueOpen, setQueueOpen,
    dragging, setDragging, scrollRef, composerRef, active, channel, isSelf, selfId,
    typingNow, brandId, roots, counts, days, pinned, channelFiles, threadRoot, replies,
    queue, subtitle, members, pending, select, toggleMute,
    togglePin: (id: string) => flag(id, "listPinned", togglePinOf),
    toggleHidden: (id: string) => flag(id, "hidden", toggleHiddenOf),
    markChatRead, send, editChatMessage, deleteChatMessage, toggleChatPin, toggleChatReaction,
    createTask, addChatReminder, updateChatChannel, deleteChatChannel, cancelChatScheduled,
    newChannel, openPerson, openMessage, personOf, messagePerson, handleLoadOlder, handleSchedule,
  };
}
