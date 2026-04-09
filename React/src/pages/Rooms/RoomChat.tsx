import {
  ArrowLeftIcon,
  InformationCircleIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/solid";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import type { Room } from "../../components/ui/RoomCard";
import {
  fetchRoomChat,
  fetchRoomMessages,
  sendRoomMessage,
  subscribeToRoomMessages,
  type RoomChatMessageRecord,
} from "../../services/roomChat";
import {
  buildPredictionAnnouncement,
  predictionOptions,
  type PredictionOption,
  type PredictionSelection,
} from "./chatPredictionMock";

type ChatLocationState = {
  room?: Room;
  from?: string;
};

type ChatMessage = {
  id: number | string;
  sender: string;
  text: string;
  time: string;
  align: "left" | "right" | "center";
  createdAt: number;
};

const defaultRoom: Room = {
  id: 999,
  title: "Warriors Game Night",
  status: "live",
  members: "Cesar, Luis, Maria +2",
  subtitle: "Live chat is on",
  accent: "#1D428A",
};

const gameHighlights = [
  { time: "8:41", text: "Curry hits a 3-pointer!" },
  { time: "8:39", text: "Davis with the dunk!" },
  { time: "8:36", text: "Big steal by Wiggins" },
  { time: "8:33", text: "Green grabs the offensive board" },
  { time: "8:29", text: "Reaves answers with a corner three" },
];

function scoreSeed(room: Room) {
  const base = room.id % 13;
  return {
    leftScore: 96 + base,
    rightScore: 90 + (base % 7),
    quarter: "4th",
    time: "8:42",
  };
}

function formatMessageTime(date: Date) {
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function toDisplayMessage(
  message: RoomChatMessageRecord,
  currentUserId: string
): ChatMessage {
  const createdAt = new Date(message.createdAt);

  return {
    id: message.id,
    sender: message.senderName,
    text: message.content,
    time: formatMessageTime(createdAt),
    align: message.senderProfileId === currentUserId ? "right" : "left",
    createdAt: createdAt.getTime(),
  };
}

function mergeMessages(current: ChatMessage[], nextMessage: ChatMessage) {
  const deduped = current.filter((message) => message.id !== nextMessage.id);
  return [...deduped, nextMessage].sort((a, b) => a.createdAt - b.createdAt);
}

function mergePersistedMessages(
  current: ChatMessage[],
  nextMessages: ChatMessage[]
) {
  return nextMessages.reduce(
    (merged, message) => mergeMessages(merged, message),
    current
  );
}

function RoomChat() {
  const predictionBaseSeconds = 15;
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as ChatLocationState | null;
  const parsedRoomId = roomId ? Number(roomId) : Number.NaN;
  const activeRoomId = Number.isFinite(parsedRoomId)
    ? parsedRoomId
    : state?.room?.id ?? null;

  const [room, setRoom] = useState<Room>(state?.room ?? defaultRoom);
  const [draft, setDraft] = useState("");
  const [infoOpen, setInfoOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [predictionOpen, setPredictionOpen] = useState(true);
  const [predictionCountdown, setPredictionCountdown] = useState(predictionBaseSeconds);
  const [selectedPrediction, setSelectedPrediction] = useState<PredictionSelection | null>(null);
  const [predictionRound, setPredictionRound] = useState(0);
  const [currentUserId, setCurrentUserId] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [chatError, setChatError] = useState<string | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const selectedPredictionRef = useRef<PredictionSelection | null>(null);

  const scoreboard = useMemo(() => scoreSeed(room), [room]);

  useEffect(() => {
    if (!activeRoomId) {
      setLoadingMessages(false);
      setChatError("Room not found.");
      return;
    }

    const roomIdToLoad = activeRoomId;

    async function loadRoomChat() {
      try {
        setLoadingMessages(true);
        setChatError(null);
        const data = await fetchRoomChat(roomIdToLoad);

        setRoom(data.room);
        setCurrentUserId(data.currentUserId);
        setMessages(
          data.messages.map((message) =>
            toDisplayMessage(message, data.currentUserId)
          )
        );
      } catch (error) {
        console.error("Error loading room chat:", error);
        setChatError(
          error instanceof Error ? error.message : "Could not load room chat."
        );
      } finally {
        setLoadingMessages(false);
      }
    }

    loadRoomChat();
  }, [activeRoomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    selectedPredictionRef.current = selectedPrediction;
  }, [selectedPrediction]);

  useEffect(() => {
    if (!predictionOpen) return;

    const intervalId = window.setInterval(() => {
      setPredictionCountdown((current) => (current > 0 ? current - 1 : 0));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [predictionOpen]);

  useEffect(() => {
    if (!predictionOpen || predictionCountdown !== 0 || selectedPrediction) return;

    setSelectedPrediction("No Choice");
    setPredictionOpen(false);
  }, [predictionCountdown, predictionOpen, selectedPrediction]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const resolvedPrediction = selectedPredictionRef.current ?? "No Choice";
      const announcement = buildPredictionAnnouncement(
        resolvedPrediction,
        predictionRound
      );

      setMessages((current) => [
        ...current,
        {
          id: `system-${predictionRound}`,
          sender: "System",
          text: announcement.text,
          time: "",
          align: "center",
          createdAt: Date.now(),
        },
      ]);
      setSelectedPrediction(null);
      setPredictionOpen(true);
      setPredictionCountdown(predictionBaseSeconds);
      setPredictionRound((current) => current + 1);
    }, 30000);

    return () => window.clearTimeout(timeoutId);
  }, [predictionBaseSeconds, predictionRound]);

  useEffect(() => {
    if (!activeRoomId || !currentUserId) return;

    const unsubscribe = subscribeToRoomMessages(activeRoomId, (message) => {
      setMessages((current) =>
        mergeMessages(current, toDisplayMessage(message, currentUserId))
      );
    });

    return unsubscribe;
  }, [activeRoomId, currentUserId]);

  useEffect(() => {
    if (!activeRoomId || !currentUserId) return;

    const roomIdToSync = activeRoomId;
    let cancelled = false;

    async function syncMessages() {
      try {
        const latestMessages = await fetchRoomMessages(roomIdToSync);
        if (cancelled) return;

        setMessages((current) =>
          mergePersistedMessages(
            current,
            latestMessages.map((message) =>
              toDisplayMessage(message, currentUserId)
            )
          )
        );
      } catch (error) {
        if (cancelled) return;

        console.error("Error syncing room messages:", error);
      }
    }

    void syncMessages();
    const intervalId = window.setInterval(() => {
      void syncMessages();
    }, 2500);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [activeRoomId, currentUserId]);

  async function handleSendMessage() {
    const trimmedDraft = draft.trim();
    if (!trimmedDraft || !activeRoomId || sendingMessage) return;

    try {
      setSendingMessage(true);
      setChatError(null);
      const insertedMessage = await sendRoomMessage(activeRoomId, trimmedDraft);

      setMessages((current) =>
        mergeMessages(current, toDisplayMessage(insertedMessage, currentUserId))
      );
      setDraft("");
    } catch (error) {
      console.error("Error sending message:", error);
      setChatError(
        error instanceof Error ? error.message : "Could not send message."
      );
    } finally {
      setSendingMessage(false);
    }
  }

  function handlePredictionSelect(prediction: PredictionOption) {
    setSelectedPrediction(prediction);
    setPredictionOpen(false);
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f8fbff_0%,_#eef3fb_48%,_#dce6f3_100%)]">
      <main className="flex h-screen w-full flex-col">
        <section className="flex h-full w-full flex-1 flex-col overflow-hidden bg-white">
          <div className="bg-secondary px-4 py-3 text-white sm:px-5">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => navigate(state?.from ?? "/rooms")}
                aria-label="Go back"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/18"
              >
                <ArrowLeftIcon className="h-4 w-4" />
              </button>

              <div className="min-w-0 flex-1 text-center">
                <p className="truncate font-lato text-sm font-bold sm:text-base">
                  {room.title}
                </p>
                <p className="truncate font-lato text-[0.72rem] text-white/70 sm:text-xs">
                  {room.members}
                </p>
              </div>

              <button
                type="button"
                aria-label="Toggle match info"
                onClick={() => setInfoOpen((current) => !current)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/12 text-white transition-colors hover:bg-white/18"
              >
                <InformationCircleIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="bg-primary px-4 py-3 text-secondary sm:px-5 sm:py-3.5">
            <div className="grid grid-cols-3 items-center">
              <div className="text-center">
                <p className="font-lato text-[0.68rem] font-bold uppercase tracking-[0.16em] text-secondary/65 sm:text-xs">
                  Warriors
                </p>
                <p className="font-anton text-[1.75rem] leading-none sm:text-[2.2rem]">
                  {scoreboard.leftScore}
                </p>
              </div>

              <div className="text-center">
                <p className="font-lato text-[0.68rem] font-bold uppercase tracking-[0.16em] text-secondary/65 sm:text-xs">
                  {scoreboard.quarter}
                </p>
                <p className="mt-0.5 font-barlow-condensed text-[1.35rem] font-semibold leading-none sm:text-[1.8rem]">
                  {scoreboard.time}
                </p>
                <p className="mt-0.5 font-lato text-[0.64rem] font-bold uppercase tracking-[0.18em] text-secondary/70 sm:text-[0.7rem]">
                  Live
                </p>
              </div>

              <div className="text-center">
                <p className="font-lato text-[0.68rem] font-bold uppercase tracking-[0.16em] text-secondary/65 sm:text-xs">
                  Lakers
                </p>
                <p className="font-anton text-[1.75rem] leading-none sm:text-[2.2rem]">
                  {scoreboard.rightScore}
                </p>
              </div>
            </div>
          </div>

          {infoOpen && (
            <div className="border-b border-[#d8e2f1] bg-[#2a4e8e] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:px-5">
              <div className="max-h-[124px] space-y-1.5 overflow-y-auto pr-1">
                {gameHighlights.map((highlight) => (
                  <div
                    key={`${highlight.time}-${highlight.text}`}
                    className="grid grid-cols-[48px_minmax(0,1fr)] items-center gap-2 rounded-xl bg-[#244887] px-3 py-2"
                  >
                    <span className="font-lato text-xs font-bold text-white/88">
                      {highlight.time}
                    </span>
                    <span className="font-lato text-xs text-white sm:text-sm">
                      {highlight.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto bg-white px-4 py-4 sm:px-5">
            {loadingMessages ? (
              <div className="flex h-full items-center justify-center">
                <p className="font-lato text-sm text-[#8b99ae]">
                  Loading messages...
                </p>
              </div>
            ) : chatError && messages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="max-w-[28rem] rounded-2xl bg-[#fff1f2] px-4 py-3 text-center font-lato text-sm text-[#be123c]">
                  {chatError}
                </p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="rounded-2xl bg-[#f6f8fc] px-4 py-3 text-center font-lato text-sm text-[#7b8aa2]">
                  No messages yet. Start the conversation.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.align === "right"
                        ? "justify-end"
                        : message.align === "center"
                          ? "justify-center"
                          : "justify-start"
                    }`}
                  >
                    {message.align === "center" ? (
                      <div className="rounded-full bg-[#eef3fb] px-4 py-2 shadow-[0_8px_18px_rgba(27,52,95,0.06)]">
                        <p className="font-lato text-[0.76rem] font-bold text-[#5b6a80] sm:text-sm">
                          {message.text}
                        </p>
                      </div>
                    ) : (
                      <div className="max-w-[82%]">
                        {message.align === "left" && (
                          <p className="mb-1 px-1 font-lato text-[0.7rem] text-[#9aa6b8]">
                            {message.sender}
                          </p>
                        )}
                        <div
                          className={`rounded-[1.2rem] px-3 py-2 shadow-[0_10px_24px_rgba(15,23,42,0.06)] ${
                            message.align === "right"
                              ? "rounded-tr-md bg-secondary text-white"
                              : "rounded-tl-md border border-[#d5dfef] bg-[#fbfdff] text-[#31435f]"
                          }`}
                        >
                          <p className="font-lato text-sm leading-6 sm:text-[0.95rem]">
                            {message.text}
                          </p>
                        </div>
                        <p
                          className={`mt-1 px-1 font-lato text-[0.68rem] text-[#b0bac8] ${
                            message.align === "right" ? "text-right" : "text-left"
                          }`}
                        >
                          {message.time}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <div className="sticky bottom-0 border-t border-[#e7edf6] bg-white px-4 py-3 sm:px-5">
            {chatError && messages.length > 0 && (
              <div className="mb-3 rounded-[1rem] border border-[#ffd7dc] bg-[#fff1f2] px-4 py-3">
                <p className="font-lato text-sm text-[#be123c]">{chatError}</p>
              </div>
            )}

            {selectedPrediction && (
              <div className="mb-3 rounded-[1rem] border border-[#d5e2f6] bg-[#edf4ff] px-4 py-3 shadow-[0_8px_20px_rgba(30,64,140,0.08)]">
                <p className="font-lato text-sm font-bold text-secondary sm:text-[0.95rem]">
                  Prediction: {selectedPrediction}
                </p>
              </div>
            )}

            {predictionOpen && (
              <div className="mb-3 overflow-hidden rounded-[1.15rem] border border-[#c7d8f2] bg-[#2d4f8d] shadow-[0_12px_24px_rgba(25,52,102,0.18)]">
                <div className="flex items-center justify-between gap-3 border-b border-white/10 px-3 py-2 text-white">
                  <p className="font-lato text-[0.72rem] font-bold tracking-[0.02em] sm:text-xs">
                    Next Play: What will it be?
                  </p>
                  <span className="rounded-full bg-white/12 px-2 py-1 font-lato text-[0.68rem] font-bold">
                    {predictionCountdown}s
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 p-2">
                  {predictionOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handlePredictionSelect(option)}
                      className="rounded-[0.9rem] bg-white px-2 py-2 font-lato text-[0.78rem] font-bold text-secondary transition-colors hover:bg-[#eef4ff] sm:text-sm"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 rounded-full bg-[#f6f8fc] px-4 py-2.5">
              <input
                type="text"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Type a message..."
                disabled={!activeRoomId || sendingMessage}
                className="w-full bg-transparent font-lato text-sm text-[#334155] placeholder:text-[#9aa6b8] focus:outline-none"
              />
              <button
                type="button"
                aria-label="Send message"
                onClick={handleSendMessage}
                disabled={!activeRoomId || sendingMessage}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#d7e5fb] text-secondary transition-colors hover:bg-[#c6daf8] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <PaperAirplaneIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default RoomChat;
