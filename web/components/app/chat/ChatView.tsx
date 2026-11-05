"use client";

import React from "react";
import { HublyChatIcon } from "@/components/app/icons/DuotoneIcons";
import { chatRemote } from "@/lib/chat-live";
import { continuesPrevious } from "@/lib/chat";
import { useHublyStore } from "@/lib/store";
import type { ChatMessage } from "@/lib/types";
import { ChatComposer } from "./ChatComposer";
import { ChatConversationHeader, ChatFindAndPinBar, ChatScheduledQueue } from "./ChatConversationHeader";
import { ChatDetails } from "./ChatDetails";
import { ChatMessageFeed } from "./ChatMessageFeed";
import { ChatMessageRow } from "./ChatMessageRow";
import { ChatSidebar } from "./ChatSidebar";
import { ChatThreadPanel } from "./ChatThreadPanel";
import { useChatView } from "./useChatView";

export function ChatView() {
  const {
    myName,
    myInitials,
    myPhoto,
    myId,
    me,
    people,
    mentionNames,
    visibleItems,
    results,
    selectedId,
    listQuery,
    setListQuery,
    searchOpen,
    setSearchOpen,
    channelQuery,
    setChannelQuery,
    side,
    setSide,
    notice,
    setNotice,
    focusId,
    setFocusId,
    queueOpen,
    setQueueOpen,
    dragging,
    setDragging,
    scrollRef,
    composerRef,
    active,
    channel,
    isSelf,
    selfId,
    typingNow,
    brandId,
    roots,
    counts,
    days,
    pinned,
    channelFiles,
    threadRoot,
    replies,
    queue,
    subtitle,
    members,
    pending,
    select,
    toggleMute,
    togglePin,
    toggleHidden,
    markChatRead,
    send,
    editChatMessage,
    deleteChatMessage,
    toggleChatPin,
    toggleChatReaction,
    createTask,
    addChatReminder,
    updateChatChannel,
    deleteChatChannel,
    cancelChatScheduled,
    newChannel,
    openPerson,
    openMessage,
    personOf,
    messagePerson,
    handleLoadOlder,
    handleSchedule,
  } = useChatView();

  const rowFor = (m: ChatMessage, prev: ChatMessage | undefined, inThread: boolean) => (
    <ChatMessageRow
      key={m.id}
      message={m}
      myName={myName}
      myPhoto={myPhoto}
      mentionNames={mentionNames}
      compact={continuesPrevious(prev, m)}
      replyCount={counts.get(m.id) ?? 0}
      canReply={!inThread}
      query={inThread ? "" : channelQuery}
      highlighted={m.id === focusId}
      onReply={() => setSide({ kind: "thread", id: m.id })}
      onEdit={(text) => editChatMessage(m.id, text)}
      onDelete={() => {
        if (threadRoot?.id === m.id) setSide(null);
        deleteChatMessage(m.id);
      }}
      onPin={() => toggleChatPin(m.id)}
      onReact={(emoji) => toggleChatReaction(m.id, emoji, myName)}
      onCreateTask={() => createTask(m)}
      onRemind={(at, label) => {
        addChatReminder({
          channelId: m.channelId,
          messageId: m.parentId ?? m.id,
          text: (m.text || m.attachment?.title || "Mensaje del chat").slice(0, 120),
          remindAt: at,
          authorId: myId,
        });
        setNotice(`Te lo recordamos: ${label.charAt(0).toLowerCase()}${label.slice(1)}`);
      }}
      onNotice={setNotice}
      person={personOf(m)}
      onMessagePerson={messagePerson(m)}
    />
  );

  const handleHeaderAction = (action: "details" | "search" | "mute") => {
    if (!active) return;
    if (action === "details") {
      setSide(side?.kind === "details" ? null : { kind: "details" });
    } else if (action === "search") {
      setSearchOpen((v) => !v);
      setChannelQuery("");
    } else {
      toggleMute(active.id);
    }
  };

  return (
    <div
      className="hubly-chat"
      data-conversacion={selectedId ? "abierta" : "ninguna"}
      data-hilo={side && active ? "abierto" : "cerrado"}
    >
      <ChatSidebar
        items={visibleItems}
        selectedId={selectedId}
        query={listQuery}
        myInitials={myInitials}
        myPhoto={myPhoto}
        people={people}
        results={results}
        onOpenResult={(m) => {
          useHublyStore.setState((st) => (st.messages.some((x) => x.id === m.id) ? {} : { messages: [m, ...st.messages] }));
          select(m.channelId);
          setFocusId(m.parentId ?? m.id);
        }}
        onQuery={setListQuery}
        onSelect={select}
        onOpenSelf={() => select(selfId)}
        onNewChannel={newChannel}
        onOpenPerson={openPerson}
        onTogglePin={togglePin}
        onToggleMute={toggleMute}
        onToggleHidden={toggleHidden}
        onMarkRead={markChatRead}
      />

      <section
        className="hubly-chat-panel"
        aria-label={active ? `Conversación ${active.name}` : "Conversación"}
        onDragOver={(e) => {
          if (active && e.dataTransfer.types.includes("Files")) {
            e.preventDefault();
            setDragging(true);
          }
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false);
        }}
        onDrop={(e) => {
          if (!dragging) return;
          e.preventDefault();
          setDragging(false);
          composerRef.current?.addFiles(Array.from(e.dataTransfer.files));
        }}
      >
        {!active ? (
          <div className="hubly-chat-vacio">
            <HublyChatIcon size={40} />
            <h1 className="hubly-chat-vacio-title">Elige una conversación</h1>
            <p>Abre un canal o un mensaje directo para empezar.</p>
          </div>
        ) : (
          <>
            <ChatConversationHeader
              active={active}
              channelEmoji={channel?.emoji}
              pending={pending}
              detailsOpen={side?.kind === "details"}
              searchOpen={searchOpen}
              onBack={() => select(null)}
              onHeaderAction={handleHeaderAction}
            />

            <ChatFindAndPinBar
              searchOpen={searchOpen}
              channelQuery={channelQuery}
              pinned={pinned}
              onQueryChange={setChannelQuery}
              onCloseSearch={() => {
                setSearchOpen(false);
                setChannelQuery("");
              }}
              onOpenPinned={openMessage}
            />

            <div className="hubly-chat-scroll" ref={scrollRef}>
              <ChatMessageFeed
                hasRoots={roots.length > 0}
                emptyText={isSelf ? "Guarda aquí notas y borradores." : `Escribe el primero en ${active.name}.`}
                channelQuery={channelQuery}
                days={days}
                onClearQuery={() => setChannelQuery("")}
                onLoadOlder={handleLoadOlder}
                renderMessage={(m, prev) => rowFor(m, prev, false)}
              />
            </div>

            {notice ? (
              <div className="hubly-chat-notice" role="status">
                {notice}
              </div>
            ) : null}

            <div className="hubly-chat-foot">
              {typingNow ? (
                <p className="hubly-chat-typing" role="status">
                  {typingNow} está escribiendo…
                </p>
              ) : null}
              <ChatScheduledQueue
                queue={queue}
                open={queueOpen}
                onToggle={() => setQueueOpen((v) => !v)}
                onCancel={cancelChatScheduled}
              />
              <ChatComposer
                key={active.id}
                ref={composerRef}
                label={`Mensaje en ${active.name}`}
                placeholder={isSelf ? "Escribe una nota…" : `Escribe en ${active.name}…`}
                brandId={brandId}
                mentions={people}
                onTyping={() => chatRemote()?.typing(active.id)}
                onSend={(text, attachments) => send(text, attachments)}
                onSchedule={handleSchedule}
              />
            </div>

            {dragging ? <div className="hubly-chat-drop">Suelta los archivos para adjuntarlos</div> : null}
          </>
        )}
      </section>

      {active && side?.kind === "details" ? (
        <ChatDetails
          key={active.id}
          name={active.name}
          subtitle={subtitle}
          description={channel?.description}
          editable={channel?.type === "agency"}
          emoji={channel?.emoji}
          candidates={channel?.type === "agency" ? [me, ...people] : undefined}
          memberIds={channel?.memberIds}
          myId={me.id}
          onSetMembers={(memberIds) => updateChatChannel(active.id, { memberIds })}
          botsChannelId={chatRemote() && channel && channel.type !== "direct" && channel.type !== "self" ? channel.id : undefined}
          onNotice={setNotice}
          members={members}
          pinned={pinned}
          files={channelFiles}
          onClose={() => setSide(null)}
          onOpenMessage={openMessage}
          onSave={(patch) => {
            updateChatChannel(active.id, patch);
            setNotice("Cambios guardados");
          }}
          onArchive={() => {
            updateChatChannel(active.id, { archived: true });
            select(null);
            setNotice("Canal archivado");
          }}
          onDelete={() => {
            deleteChatChannel(active.id);
            select(null);
          }}
        />
      ) : null}

      {threadRoot ? (
        <ChatThreadPanel
          threadRoot={threadRoot}
          replies={replies}
          brandId={brandId}
          people={people}
          onClose={() => setSide(null)}
          onSend={(text, attachments) => send(text, attachments, threadRoot.id)}
          renderMessage={(m, prev) => rowFor(m, prev, true)}
        />
      ) : null}
    </div>
  );
}
