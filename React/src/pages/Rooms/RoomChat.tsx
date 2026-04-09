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
  leaveRoom,
  parseRoomPredictionEntry,
  ROOM_SYSTEM_MESSAGE_PREFIX,
  sendRoomMessage,
  sendRoomPrediction,
  subscribeToRoomMessages,
  type RoomChatMessageRecord,
  type RoomPredictionEntryRecord,
} from "../../services/roomChat";
import {
  getCurrentMockGameSnapshot,
  getMockPredictionState,
  predictionOptions,
  subscribeToMockGameFeed,
  type MockGameSnapshot,
  type MockPredictionState,
  type PredictionOption,
} from "../../services/mockRoomGameFeed";

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
  const isSystemMessage = message.content.startsWith(ROOM_SYSTEM_MESSAGE_PREFIX);
  const displayText = isSystemMessage
    ? message.content.replace(ROOM_SYSTEM_MESSAGE_PREFIX, "")
    : message.content;

  return {
    id: message.id,
    sender: isSystemMessage ? "System" : message.senderName,
    text: displayText,
    time: isSystemMessage ? "" : formatMessageTime(createdAt),
    align: isSystemMessage
      ? "center"
      : message.senderProfileId === currentUserId
        ? "right"
        : "left",
    createdAt: createdAt.getTime(),
  };
}

function mergeMessages(current: ChatMessage[], nextMessage: ChatMessage) {
  const deduped = current.filter((message) => message.id !== nextMessage.id);
  return [...deduped, nextMessage].sort((a, b) => a.createdAt - b.createdAt);
}

function mergePredictionEntries(
  current: RoomPredictionEntryRecord[],
  nextEntry: RoomPredictionEntryRecord
) {
  const deduped = current.filter((entry) => entry.id !== nextEntry.id);
  return [...deduped, nextEntry].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

function parseClockToSeconds(clock: string) {
  const [minutesPart, secondsPart] = clock.split(":");
  const minutes = Number(minutesPart);
  const seconds = Number(secondsPart);

  if (Number.isNaN(minutes) || Number.isNaN(seconds)) return null;
  return minutes * 60 + seconds;
}

function getLatestRoundEntries(
  entries: RoomPredictionEntryRecord[],
  round: number,
  cycleStartMs: number,
  resolvedAtMs?: number
) {
  const latestByUser = new Map<string, RoomPredictionEntryRecord>();

  for (const entry of entries) {
    if (entry.cycleStartMs !== cycleStartMs || entry.round !== round) continue;

    const createdAt = new Date(entry.createdAt).getTime();
    if (resolvedAtMs && createdAt > resolvedAtMs) continue;

    latestByUser.set(entry.senderProfileId, entry);
  }

  return Array.from(latestByUser.values());
}

function buildPredictionResultText(
  correctCount: number,
  result: PredictionOption
) {
  if (correctCount === 0) {
    return `No one guessed correctly. Result: ${result}.`;
  }

  if (correctCount === 1) {
    return `1 person guessed correctly. Result: ${result}.`;
  }

  return `${correctCount} people guessed correctly. Result: ${result}.`;
}

function buildPredictionLeaderText(
  predictionEntries: RoomPredictionEntryRecord[],
  predictionState: MockPredictionState,
  cycleStartMs: number
) {
  if (predictionState.activeRound !== null) return null;

  const scoreboard = new Map<string, { name: string; correct: number }>();

  for (const round of predictionState.resolvedRounds) {
    const latestEntries = getLatestRoundEntries(
      predictionEntries,
      round.round,
      cycleStartMs,
      round.resolvedAtMs
    );

    for (const entry of latestEntries) {
      if (entry.choice !== round.result) continue;

      const current = scoreboard.get(entry.senderProfileId);
      scoreboard.set(entry.senderProfileId, {
        name: entry.senderName,
        correct: (current?.correct ?? 0) + 1,
      });
    }
  }

  const leaders = [...scoreboard.values()].sort((a, b) => b.correct - a.correct);

  if (leaders.length === 0 || leaders[0].correct === 0) {
    return "Prediction leader: no correct guesses this match.";
  }

  const topScore = leaders[0].correct;
  const topNames = leaders
    .filter((leader) => leader.correct === topScore)
    .map((leader) => leader.name);

  if (topNames.length === 1) {
    return `Top predictor: ${topNames[0]} with ${topScore} correct.`;
  }

  return `Top predictors: ${topNames.join(", ")} with ${topScore} correct each.`;
}

function buildPredictionAnnouncements(
  predictionEntries: RoomPredictionEntryRecord[],
  predictionState: MockPredictionState,
  cycleStartMs: number
): ChatMessage[] {
  return predictionState.resolvedRounds.map((round) => {
    const latestEntries = getLatestRoundEntries(
      predictionEntries,
      round.round,
      cycleStartMs,
      round.resolvedAtMs
    );
    const correctCount = latestEntries.filter(
      (entry) => entry.choice === round.result
    ).length;

    return {
      id: `prediction-round-${cycleStartMs}-${round.round}`,
      sender: "System",
      text: buildPredictionResultText(correctCount, round.result),
      time: "",
      align: "center" as const,
      createdAt: round.resolvedAtMs + 250,
    };
  });
}

function RoomChat() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as ChatLocationState | null;
  const parsedRoomId = roomId ? Number(roomId) : Number.NaN;
  const activeRoomId = Number.isFinite(parsedRoomId)
    ? parsedRoomId
    : state?.room?.id ?? null;

  const [room, setRoom] = useState<Room>(state?.room ?? defaultRoom);
  const [gameState, setGameState] = useState<MockGameSnapshot>(() =>
    getCurrentMockGameSnapshot()
  );
  const [draft, setDraft] = useState("");
  const [infoOpen, setInfoOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [predictionEntries, setPredictionEntries] = useState<
    RoomPredictionEntryRecord[]
  >([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [chatError, setChatError] = useState<string | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [sendingPrediction, setSendingPrediction] = useState(false);
  const [leavingRoom, setLeavingRoom] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const actionsMenuRef = useRef<HTMLDivElement | null>(null);

  const clockSeconds = parseClockToSeconds(gameState.clock);
  const isFinalState = gameState.statusLabel === "Final";
  const isClutchMoment =
    gameState.quarterLabel === "4th" &&
    !isFinalState &&
    clockSeconds !== null &&
    clockSeconds <= 19;
  const predictionState = useMemo(
    () => getMockPredictionState(gameState),
    [gameState]
  );

  const currentPredictionEntry = useMemo(() => {
    if (!currentUserId || predictionState.activeRound === null) return null;

    return getLatestRoundEntries(
      predictionEntries,
      predictionState.activeRound,
      gameState.cycleStartMs
    ).find((entry) => entry.senderProfileId === currentUserId) ?? null;
  }, [
    currentUserId,
    gameState.cycleStartMs,
    predictionEntries,
    predictionState.activeRound,
  ]);

  const predictionAnnouncements = useMemo(
    () =>
      buildPredictionAnnouncements(
        predictionEntries,
        predictionState,
        gameState.cycleStartMs
      ),
    [gameState.cycleStartMs, predictionEntries, predictionState]
  );
  const finalPredictionLeaderText = useMemo(
    () =>
      buildPredictionLeaderText(
        predictionEntries,
        predictionState,
        gameState.cycleStartMs
      ),
    [gameState.cycleStartMs, predictionEntries, predictionState]
  );

  const displayMessages = useMemo(
    () =>
      [...messages, ...predictionAnnouncements].sort(
        (a, b) => a.createdAt - b.createdAt
      ),
    [messages, predictionAnnouncements]
  );

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
        setMessages([]);
        setPredictionEntries([]);

        for (const message of data.messages) {
          const predictionEntry = parseRoomPredictionEntry(message);

          if (predictionEntry) {
            setPredictionEntries((current) =>
              mergePredictionEntries(current, predictionEntry)
            );
            continue;
          }

          setMessages((current) =>
            mergeMessages(current, toDisplayMessage(message, data.currentUserId))
          );
        }
      } catch (error) {
        console.error("Error loading room chat:", error);
        setChatError(
          error instanceof Error ? error.message : "Could not load room chat."
        );
      } finally {
        setLoadingMessages(false);
      }
    }

    void loadRoomChat();
  }, [activeRoomId]);

  useEffect(() => {
    const unsubscribe = subscribeToMockGameFeed((snapshot) => {
      setGameState(snapshot);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayMessages]);

  useEffect(() => {
    if (!actionsOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        actionsMenuRef.current &&
        !actionsMenuRef.current.contains(event.target as Node)
      ) {
        setActionsOpen(false);
      }
    }

    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [actionsOpen]);

  useEffect(() => {
    if (!activeRoomId || !currentUserId) return;

    const unsubscribe = subscribeToRoomMessages(activeRoomId, (message) => {
      const predictionEntry = parseRoomPredictionEntry(message);

      if (predictionEntry) {
        setPredictionEntries((current) =>
          mergePredictionEntries(current, predictionEntry)
        );
        return;
      }

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

        for (const message of latestMessages) {
          const predictionEntry = parseRoomPredictionEntry(message);

          if (predictionEntry) {
            setPredictionEntries((current) =>
              mergePredictionEntries(current, predictionEntry)
            );
            continue;
          }

          setMessages((current) =>
            mergeMessages(current, toDisplayMessage(message, currentUserId))
          );
        }
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

  async function handlePredictionSelect(prediction: PredictionOption) {
    if (
      !activeRoomId ||
      predictionState.activeRound === null ||
      sendingPrediction
    ) {
      return;
    }

    try {
      setSendingPrediction(true);
      setChatError(null);
      const entry = await sendRoomPrediction(
        activeRoomId,
        predictionState.activeRound,
        prediction,
        gameState.cycleStartMs
      );

      setPredictionEntries((current) => mergePredictionEntries(current, entry));
    } catch (error) {
      console.error("Error sending prediction:", error);
      setChatError(
        error instanceof Error ? error.message : "Could not send prediction."
      );
    } finally {
      setSendingPrediction(false);
    }
  }

  function handleToggleInfo() {
    setInfoOpen((current) => !current);
    setActionsOpen(false);
  }

  async function handleLeaveRoom() {
    if (!activeRoomId || leavingRoom) return;

    const confirmed = window.confirm(
      "Leave this group? It will no longer appear in your rooms list."
    );

    if (!confirmed) return;

    try {
      setLeavingRoom(true);
      setChatError(null);
      await leaveRoom(activeRoomId);
      navigate("/rooms", {
        replace: true,
        state: { removedRoomId: activeRoomId },
      });
    } catch (error) {
      console.error("Error leaving room:", error);
      setChatError(
        error instanceof Error ? error.message : "Could not leave room."
      );
    } finally {
      setLeavingRoom(false);
      setActionsOpen(false);
    }
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

              <div className="relative" ref={actionsMenuRef}>
                <button
                  type="button"
                  aria-label="Room actions"
                  onClick={() => setActionsOpen((current) => !current)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/12 text-white transition-colors hover:bg-white/18"
                >
                  <InformationCircleIcon className="h-5 w-5" />
                </button>

                {actionsOpen && (
                  <div className="absolute right-0 top-11 z-20 w-48 rounded-2xl border border-[#d6e0f0] bg-white p-2 shadow-[0_18px_36px_rgba(15,23,42,0.14)]">
                    <button
                      type="button"
                      onClick={handleToggleInfo}
                      className="flex w-full rounded-xl px-3 py-2 text-left font-lato text-sm font-semibold text-[#29477b] transition-colors hover:bg-[#eef4ff]"
                    >
                      {infoOpen ? "Hide Match Info" : "Show Match Info"}
                    </button>

                    <button
                      type="button"
                      onClick={handleLeaveRoom}
                      disabled={leavingRoom}
                      className="mt-1 flex w-full rounded-xl px-3 py-2 text-left font-lato text-sm font-semibold text-[#c1124a] transition-colors hover:bg-[#fff1f4] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {leavingRoom ? "Leaving..." : "Leave Group"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div
            className={`px-4 py-3 sm:px-5 sm:py-3.5 ${
              isFinalState
                ? "bg-[#d2d7e1] text-secondary"
                : isClutchMoment
                  ? "bg-[linear-gradient(135deg,#a40f2a_0%,#d62d47_52%,#ff5c73_100%)] text-white shadow-[inset_0_-12px_28px_rgba(100,0,14,0.18)]"
                  : "bg-primary text-secondary"
            }`}
          >
            <div className="grid grid-cols-3 items-center">
              <div className="text-center">
                <p
                  className={`font-lato text-[0.68rem] font-bold uppercase tracking-[0.16em] sm:text-xs ${
                    isFinalState
                      ? "text-secondary/70"
                      : isClutchMoment
                        ? "text-white/80"
                        : "text-secondary/65"
                  }`}
                >
                  {gameState.leftTeam}
                </p>
                <p className="font-anton text-[1.75rem] leading-none sm:text-[2.2rem]">
                  {gameState.leftScore}
                </p>
              </div>

              <div className="text-center">
                <p
                  className={`font-lato text-[0.68rem] font-bold uppercase tracking-[0.16em] sm:text-xs ${
                    isFinalState
                      ? "text-secondary/70"
                      : isClutchMoment
                        ? "text-white/80"
                        : "text-secondary/65"
                  }`}
                >
                  {gameState.quarterLabel}
                </p>
                <p
                  className={`mt-0.5 font-barlow-condensed font-semibold leading-none sm:text-[1.8rem] ${
                    isFinalState
                      ? "text-[1.5rem] text-secondary"
                      : isClutchMoment
                        ? "text-[1.6rem] text-white drop-shadow-[0_3px_14px_rgba(255,255,255,0.18)]"
                        : "text-[1.35rem]"
                  }`}
                >
                  {gameState.clock}
                </p>
                <p
                  className={`mt-0.5 font-lato text-[0.64rem] font-bold uppercase tracking-[0.18em] sm:text-[0.7rem] ${
                    isFinalState
                      ? "text-secondary/75"
                      : isClutchMoment
                        ? "text-white/85"
                        : "text-secondary/70"
                  }`}
                >
                  {gameState.statusLabel}
                </p>
              </div>

              <div className="text-center">
                <p
                  className={`font-lato text-[0.68rem] font-bold uppercase tracking-[0.16em] sm:text-xs ${
                    isFinalState
                      ? "text-secondary/70"
                      : isClutchMoment
                        ? "text-white/80"
                        : "text-secondary/65"
                  }`}
                >
                  {gameState.rightTeam}
                </p>
                <p className="font-anton text-[1.75rem] leading-none sm:text-[2.2rem]">
                  {gameState.rightScore}
                </p>
              </div>
            </div>

            {gameState.detail && !isFinalState && (
              <div className="mt-2 text-center">
                <p
                  className={`font-lato text-[0.68rem] font-semibold sm:text-xs ${
                    isFinalState
                      ? "text-secondary/80"
                      : isClutchMoment
                        ? "text-white/88"
                        : "text-secondary/75"
                  }`}
                >
                  {gameState.detail}
                </p>
              </div>
            )}
          </div>

          {isFinalState && finalPredictionLeaderText && (
            <div className="border-b border-[#d7dfec] bg-[#edf4ff] px-4 py-2.5 sm:px-5">
              <p className="font-lato text-[0.72rem] font-bold uppercase tracking-[0.16em] text-secondary/55">
                Winner:
              </p>
              <p className="mt-1 font-lato text-sm font-bold text-secondary sm:text-[0.95rem]">
                {finalPredictionLeaderText.replace(/^Top predictor:\s*/i, "").replace(/^Top predictors:\s*/i, "").replace(/^Prediction leader:\s*/i, "")}
              </p>
            </div>
          )}

          {infoOpen && (
            <div className="border-b border-[#d8e2f1] bg-[#2a4e8e] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:px-5">
              <div className="max-h-[124px] space-y-1.5 overflow-y-auto pr-1">
                {gameState.highlights.length > 0 ? (
                  gameState.highlights.map((highlight) => (
                    <div
                      key={`${highlight.time}-${highlight.text}`}
                      className="grid grid-cols-[64px_minmax(0,1fr)] items-center gap-2 rounded-xl bg-[#244887] px-3 py-2"
                    >
                      <span className="font-lato text-xs font-bold text-white/88">
                        {highlight.time}
                      </span>
                      <span className="font-lato text-xs text-white sm:text-sm">
                        {highlight.text}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl bg-[#244887] px-3 py-3">
                    <p className="font-lato text-xs text-white sm:text-sm">
                      Tip-off is live. Score updates will start rolling in from the
                      mock game feed.
                    </p>
                  </div>
                )}
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
            ) : chatError && displayMessages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="max-w-[28rem] rounded-2xl bg-[#fff1f2] px-4 py-3 text-center font-lato text-sm text-[#be123c]">
                  {chatError}
                </p>
              </div>
            ) : displayMessages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="rounded-2xl bg-[#f6f8fc] px-4 py-3 text-center font-lato text-sm text-[#7b8aa2]">
                  No messages yet. Start the conversation.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {displayMessages.map((message) => (
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
            {chatError && displayMessages.length > 0 && (
              <div className="mb-3 rounded-[1rem] border border-[#ffd7dc] bg-[#fff1f2] px-4 py-3">
                <p className="font-lato text-sm text-[#be123c]">{chatError}</p>
              </div>
            )}

            {currentPredictionEntry && (
              <div className="mb-3 rounded-[1rem] border border-[#d5e2f6] bg-[#edf4ff] px-4 py-3 shadow-[0_8px_20px_rgba(30,64,140,0.08)]">
                <p className="font-lato text-sm font-bold text-secondary sm:text-[0.95rem]">
                  Prediction: {currentPredictionEntry.choice}
                </p>
              </div>
            )}

            {predictionState.activeRound !== null && !currentPredictionEntry && (
              <div className="mb-3 overflow-hidden rounded-[1.15rem] border border-[#c7d8f2] bg-[#2d4f8d] shadow-[0_12px_24px_rgba(25,52,102,0.18)]">
                <div className="flex items-center justify-between gap-3 border-b border-white/10 px-3 py-2 text-white">
                  <p className="font-lato text-[0.72rem] font-bold tracking-[0.02em] sm:text-xs">
                    Next Play: What will it be?
                  </p>
                  <span className="rounded-full bg-white/12 px-2 py-1 font-lato text-[0.68rem] font-bold">
                    {predictionState.closesInSeconds ?? 0}s
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 p-2">
                  {predictionOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => void handlePredictionSelect(option)}
                      disabled={sendingPrediction}
                      className="rounded-[0.9rem] bg-white px-2 py-2 font-lato text-[0.78rem] font-bold text-secondary transition-colors hover:bg-[#eef4ff] disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
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
                    void handleSendMessage();
                  }
                }}
                placeholder="Type a message..."
                disabled={!activeRoomId || sendingMessage}
                className="w-full bg-transparent font-lato text-sm text-[#334155] placeholder:text-[#9aa6b8] focus:outline-none"
              />
              <button
                type="button"
                aria-label="Send message"
                onClick={() => void handleSendMessage()}
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
