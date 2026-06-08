import {
  ArrowLeftIcon,
  ArrowPathIcon,
  EllipsisVerticalIcon,
  PaperAirplaneIcon,
  PencilIcon,
  UserGroupIcon,
} from "@heroicons/react/24/solid";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import type { Room } from "../../components/ui/RoomCard";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import {
  fetchRoomChat,
  fetchRoomMessages,
  fetchRoomMatchHidden,
  setRoomMatchHidden,
  leaveRoom,
  parseRoomPredictionEntry,
  ROOM_SYSTEM_MESSAGE_PREFIX,
  ROOM_EVENT_MESSAGE_PREFIX,
  isRoomEventMessage,
  removeRoomMatch,
  sendRoomMessage,
  sendRoomEventMessage,
  sendRoomPrediction,
  shouldHideRoomMessage,
  updateRoomImage,
  uploadRoomImage,
  subscribeToRoomMatchHidden,
  subscribeToRoomMessages,
  subscribeToGlobalMockControl,
  type RoomChatMessageRecord,
  type RoomPredictionEntryRecord,
} from "../../hooks/useRoomChat";
import {
  computeMockGameSnapshot,
  getMockPredictionState,
  predictionOptions,
  DEFAULT_MOCK_CONTROL,
  type MockGameControl,
  type MockGameSnapshot,
  type MockPredictionState,
  type PredictionOption,
} from "../../hooks/useMockRoomGameFeed";

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
  members: "",
  subtitle: "Live chat is on",
  accent: "#1D428A",
  memberProfileIds: [],
};

const AUTO_SCROLL_BOTTOM_THRESHOLD = 96;

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

  // Event notices render as a centered pill (no bubble, no sender side).
  if (isRoomEventMessage(message.content)) {
    return {
      id: message.id,
      sender: "System",
      text: message.content.replace(ROOM_EVENT_MESSAGE_PREFIX, ""),
      time: formatMessageTime(createdAt),
      align: "center",
      createdAt: createdAt.getTime(),
    };
  }

  return {
    id: message.id,
    sender: message.senderName,
    text: message.content.replace(ROOM_SYSTEM_MESSAGE_PREFIX, ""),
    time: formatMessageTime(createdAt),
    align:
      message.senderProfileId === currentUserId
        ? "right"
        : "left",
    createdAt: createdAt.getTime(),
  };
}

function splitRoomMessageRecords(
  roomMessages: RoomChatMessageRecord[],
  currentUserId: string,
  includePredictionEntries: boolean
) {
  const visibleMessages: ChatMessage[] = [];
  const predictionEntries: RoomPredictionEntryRecord[] = [];

  for (const message of roomMessages) {
    const predictionEntry = includePredictionEntries
      ? parseRoomPredictionEntry(message)
      : null;

    if (predictionEntry) {
      predictionEntries.push(predictionEntry);
      continue;
    }

    if (shouldHideRoomMessage(message.content)) {
      continue;
    }

    visibleMessages.push(toDisplayMessage(message, currentUserId));
  }

  return {
    messages: visibleMessages.sort((a, b) => a.createdAt - b.createdAt),
    predictionEntries: predictionEntries.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    ),
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
  const [mockControl, setMockControl] = useState<MockGameControl>(
    DEFAULT_MOCK_CONTROL
  );
  const mockControlRef = useRef<MockGameControl>(DEFAULT_MOCK_CONTROL);
  const [gameState, setGameState] = useState<MockGameSnapshot>(() =>
    computeMockGameSnapshot(DEFAULT_MOCK_CONTROL)
  );
  const [draft, setDraft] = useState("");
  const [infoOpen, setInfoOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [gameHidden, setGameHidden] = useState<boolean>(
    state?.room?.matchHidden ?? false
  );
  const [isOwner, setIsOwner] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [predictionEntries, setPredictionEntries] = useState<
    RoomPredictionEntryRecord[]
  >([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [currentUsername, setCurrentUsername] = useState("Someone");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [chatError, setChatError] = useState<string | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [sendingPrediction, setSendingPrediction] = useState(false);
  const [leavingRoom, setLeavingRoom] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [removeMatchDialogOpen, setRemoveMatchDialogOpen] = useState(false);
  const messagesScrollRef = useRef<HTMLDivElement | null>(null);
  const actionsMenuRef = useRef<HTMLDivElement | null>(null);
  const shouldStickToBottomRef = useRef(true);
  const previousMessageCountRef = useRef(0);

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

  const displayMessages = useMemo(() => {
    const base = gameHidden
      ? messages
      : [...messages, ...predictionAnnouncements];
    return [...base].sort((a, b) => a.createdAt - b.createdAt);
  }, [messages, predictionAnnouncements, gameHidden]);

  useEffect(() => {
    shouldStickToBottomRef.current = true;
    previousMessageCountRef.current = 0;

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
        setCurrentUsername(data.currentUsername);
        setIsOwner(data.isOwner);
        setGameHidden(data.room.matchHidden ?? false);
        const parsedMessages = splitRoomMessageRecords(
          data.messages,
          data.currentUserId,
          !(data.room.matchHidden ?? false)
        );

        setMessages(parsedMessages.messages);
        setPredictionEntries(parsedMessages.predictionEntries);
        setMockControl(data.mockControl);
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

  // Keep a ref to the latest control so the 1s ticker always reads the current
  // value, and recompute the snapshot immediately whenever the control changes
  // (e.g. the owner pressed a button, or a realtime update arrived).
  useEffect(() => {
    mockControlRef.current = mockControl;
    setGameState(computeMockGameSnapshot(mockControl, Date.now()));
  }, [mockControl]);

  // Local clock tick. The game is a pure function of the room-synced control,
  // so every device advances the same match in lockstep.
  useEffect(() => {
    const tick = () =>
      setGameState(computeMockGameSnapshot(mockControlRef.current, Date.now()));
    tick();
    const intervalId = window.setInterval(tick, 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  // Realtime: the mock game is shared app-wide; receive owner-driven resets.
  useEffect(() => {
    const unsubscribe = subscribeToGlobalMockControl(setMockControl);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (loadingMessages) return;

    const previousMessageCount = previousMessageCountRef.current;
    const currentMessageCount = displayMessages.length;
    const isInitialMessagePaint = previousMessageCount === 0;

    previousMessageCountRef.current = currentMessageCount;

    if (!isInitialMessagePaint && !shouldStickToBottomRef.current) return;

    window.requestAnimationFrame(() => {
      const scrollElement = messagesScrollRef.current;
      if (!scrollElement) return;

      scrollElement.scrollTo({
        top: scrollElement.scrollHeight,
        behavior: isInitialMessagePaint ? "auto" : "smooth",
      });
    });
  }, [displayMessages.length, loadingMessages]);

  useEffect(() => {
    if (typeof window === "undefined" || activeRoomId === null) return;
    window.localStorage.setItem(
      `room-last-read-${activeRoomId}`,
      String(Date.now())
    );
  }, [activeRoomId, displayMessages]);

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
        if (gameHidden) return;
        setPredictionEntries((current) =>
          mergePredictionEntries(current, predictionEntry)
        );
        return;
      }

      if (shouldHideRoomMessage(message.content)) {
        return;
      }

      setMessages((current) =>
        mergeMessages(current, toDisplayMessage(message, currentUserId))
      );
    });

    return unsubscribe;
  }, [activeRoomId, currentUserId, gameHidden]);

  useEffect(() => {
    if (!activeRoomId) return;

    return subscribeToRoomMatchHidden(activeRoomId, (hidden) => {
      setGameHidden(hidden);
      setRoom((currentRoom) => ({ ...currentRoom, matchHidden: hidden }));
      if (hidden) {
        setPredictionEntries([]);
      }
    });
  }, [activeRoomId]);

  useEffect(() => {
    if (!activeRoomId || !currentUserId) return;

    const roomIdToSync = activeRoomId;
    let cancelled = false;

    async function syncMessages() {
      try {
        const [latestMessages, matchHidden] = await Promise.all([
          fetchRoomMessages(roomIdToSync),
          fetchRoomMatchHidden(roomIdToSync),
        ]);
        if (cancelled) return;

        setGameHidden(matchHidden);
        const parsedMessages = splitRoomMessageRecords(
          latestMessages,
          currentUserId,
          !matchHidden
        );

        setMessages(parsedMessages.messages);
        setPredictionEntries(parsedMessages.predictionEntries);
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
      shouldStickToBottomRef.current = true;
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
      shouldStickToBottomRef.current = true;
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

  function handleMessagesScroll() {
    const scrollElement = messagesScrollRef.current;
    if (!scrollElement) return;

    const distanceFromBottom =
      scrollElement.scrollHeight -
      scrollElement.scrollTop -
      scrollElement.clientHeight;

    shouldStickToBottomRef.current =
      distanceFromBottom <= AUTO_SCROLL_BOTTOM_THRESHOLD;
  }

  async function handleRoomPhotoChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow re-selecting the same file
    if (!file || !activeRoomId || uploadingPhoto) return;

    try {
      setUploadingPhoto(true);
      setChatError(null);

      const publicUrl = await uploadRoomImage(activeRoomId, file);
      await updateRoomImage(activeRoomId, publicUrl);
      setRoom((currentRoom) => ({ ...currentRoom, imageUrl: publicUrl }));

      const eventMessage = await sendRoomEventMessage(
        activeRoomId,
        `${currentUsername} changed the group photo`
      );
      setMessages((current) =>
        mergeMessages(current, toDisplayMessage(eventMessage, currentUserId))
      );
    } catch (error) {
      console.error("Error updating room photo:", error);
      setChatError(
        error instanceof Error ? error.message : "Could not update the photo."
      );
    } finally {
      setUploadingPhoto(false);
    }
  }

  function handleToggleGame() {
    if (!activeRoomId || !isOwner) return;

    setActionsOpen(false);

    // Removing the match -> ask for confirmation first
    if (!gameHidden) {
      setRemoveMatchDialogOpen(true);
      return;
    }

    void applyGameVisibility(false);
  }

  async function applyGameVisibility(next: boolean) {
    if (!activeRoomId) return;

    setGameHidden(next);
    setRoom((currentRoom) => ({ ...currentRoom, matchHidden: next }));
    if (next) {
      setPredictionEntries([]);
    }
    setInfoOpen(false);
    setActionsOpen(false);

    try {
      if (next) {
        await removeRoomMatch(activeRoomId);
        const eventMessage = await sendRoomEventMessage(
          activeRoomId,
          "La funcionalidad de match ha sido removida"
        );
        setMessages((current) =>
          mergeMessages(current, toDisplayMessage(eventMessage, currentUserId))
        );
      } else {
        await setRoomMatchHidden(activeRoomId, false);
      }
    } catch (error) {
      console.error("Error toggling match visibility:", error);
      setGameHidden(!next); // revert on failure
      setRoom((currentRoom) => ({ ...currentRoom, matchHidden: !next }));
      setChatError(
        error instanceof Error ? error.message : "Could not update match."
      );
    }
  }

  async function handleLeaveRoom() {
    if (!activeRoomId || leavingRoom) return;

    setLeaveDialogOpen(false);

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

  const hasMatch = !gameHidden && room.status === "live";

  return (
    <div className="min-h-[100dvh] bg-slate-50">
      <main className="mx-auto flex h-[100dvh] w-full max-w-3xl flex-col overflow-hidden sm:p-3">
        <section className="flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-white sm:rounded-2xl sm:border sm:border-slate-200 sm:shadow-[0_20px_50px_rgba(15,38,87,0.12)]">
          {/* Header */}
          <div className="flex items-center gap-3 bg-secondary px-4 py-4 text-white sm:px-5">
            <button
              type="button"
              onClick={() => navigate(state?.from ?? "/rooms")}
              aria-label="Go back"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/12 transition-colors hover:bg-white/20"
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => setPhotoDialogOpen(true)}
              disabled={uploadingPhoto}
              aria-label="Change group photo"
              className="group relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl text-white transition disabled:cursor-wait"
              style={{ backgroundColor: room.imageUrl ? undefined : room.accent }}
            >
              {room.imageUrl ? (
                <img
                  src={room.imageUrl}
                  alt={room.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserGroupIcon className="h-5 w-5" />
              )}
              <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                {uploadingPhoto ? (
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                ) : (
                  <PencilIcon className="h-4 w-4" />
                )}
              </span>
            </button>

            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={handleRoomPhotoChange}
            />

            <div className="min-w-0 flex-1">
              <p className="truncate font-lato text-sm font-bold sm:text-base">
                {room.title}
              </p>
              <p className="truncate font-lato text-[0.72rem] text-white/70 sm:text-xs">
                {room.members}
              </p>
            </div>

            <div className="relative shrink-0" ref={actionsMenuRef}>
              <button
                type="button"
                aria-label="Room actions"
                onClick={() => setActionsOpen((current) => !current)}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/12 text-white transition-colors hover:bg-white/20"
              >
                <EllipsisVerticalIcon className="h-5 w-5" />
              </button>

              {actionsOpen && (
                <div className="absolute right-0 top-11 z-20 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-[0_18px_36px_rgba(15,23,42,0.18)]">
                  {hasMatch && (
                    <button
                      type="button"
                      onClick={handleToggleInfo}
                      className="flex w-full rounded-lg px-3 py-2 text-left font-lato text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      {infoOpen ? "Hide Match Info" : "Show Match Info"}
                    </button>
                  )}

                  {isOwner && (
                    <button
                      type="button"
                      onClick={handleToggleGame}
                      className="mt-0.5 flex w-full rounded-lg px-3 py-2 text-left font-lato text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      {gameHidden ? "Show Match" : "Remove Match"}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setActionsOpen(false);
                      setLeaveDialogOpen(true);
                    }}
                    disabled={leavingRoom}
                    className="mt-0.5 flex w-full rounded-lg px-3 py-2 text-left font-lato text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {leavingRoom ? "Leaving..." : "Leave Group"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {!gameHidden && !loadingMessages && (
            <>
              {/* Score strip */}
              <div
                className={`px-4 py-3 sm:px-5 ${
                  isFinalState
                    ? "bg-slate-100 text-secondary"
                    : isClutchMoment
                      ? "bg-primary text-secondary"
                      : "bg-secondary text-white"
                }`}
              >
                <div className="mx-auto grid max-w-md grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <div className="text-center">
                    <p
                      className={`font-lato text-[0.68rem] font-bold uppercase tracking-[0.14em] sm:text-xs ${
                        isFinalState || isClutchMoment
                          ? "text-secondary/65"
                          : "text-white/70"
                      }`}
                    >
                      {gameState.leftTeam}
                    </p>
                    <p className="font-anton text-[1.85rem] leading-none sm:text-[2.3rem]">
                      {gameState.leftScore}
                    </p>
                  </div>

                  <div
                    className={`min-w-[70px] rounded-lg px-2.5 py-1 text-center ${
                      isFinalState
                        ? "bg-white/60"
                        : isClutchMoment
                          ? "bg-secondary/10"
                          : "bg-white/10"
                    }`}
                  >
                    <p
                      className={`font-lato text-[0.62rem] font-bold uppercase tracking-[0.16em] ${
                        isFinalState || isClutchMoment
                          ? "text-secondary/65"
                          : "text-primary"
                      }`}
                    >
                      {gameState.quarterLabel}
                    </p>
                    <p className="font-barlow-condensed text-[1.4rem] font-semibold leading-none">
                      {gameState.clock}
                    </p>
                    <p
                      className={`font-lato text-[0.6rem] font-bold uppercase tracking-[0.16em] ${
                        isFinalState || isClutchMoment
                          ? "text-secondary/70"
                          : "text-white/75"
                      }`}
                    >
                      {gameState.statusLabel}
                    </p>
                  </div>

                  <div className="text-center">
                    <p
                      className={`font-lato text-[0.68rem] font-bold uppercase tracking-[0.14em] sm:text-xs ${
                        isFinalState || isClutchMoment
                          ? "text-secondary/65"
                          : "text-white/70"
                      }`}
                    >
                      {gameState.rightTeam}
                    </p>
                    <p className="font-anton text-[1.85rem] leading-none sm:text-[2.3rem]">
                      {gameState.rightScore}
                    </p>
                  </div>
                </div>

                {gameState.detail && !isFinalState && (
                  <p
                    className={`mt-2 text-center font-lato text-[0.68rem] font-semibold sm:text-xs ${
                      isClutchMoment ? "text-secondary/80" : "text-white/85"
                    }`}
                  >
                    {gameState.detail}
                  </p>
                )}
              </div>

              {isFinalState && finalPredictionLeaderText && (
                <div className="flex items-center gap-2 border-b border-slate-200 bg-primary/15 px-4 py-2.5 sm:px-5">
                  <span className="rounded-md bg-primary px-2 py-0.5 font-lato text-[0.62rem] font-bold uppercase tracking-[0.14em] text-secondary">
                    Winner
                  </span>
                  <p className="min-w-0 flex-1 truncate font-lato text-sm font-bold text-secondary">
                    {finalPredictionLeaderText
                      .replace(/^Top predictor:\s*/i, "")
                      .replace(/^Top predictors:\s*/i, "")
                      .replace(/^Prediction leader:\s*/i, "")}
                  </p>
                </div>
              )}

              {infoOpen && (
                <div className="border-b border-slate-200 bg-[#1a3a72] px-3 py-2.5 sm:px-5">
                  <div className="max-h-[124px] space-y-1.5 overflow-y-auto pr-1">
                    {gameState.highlights.length > 0 ? (
                      gameState.highlights.map((highlight) => (
                        <div
                          key={`${highlight.time}-${highlight.text}`}
                          className="grid grid-cols-[56px_minmax(0,1fr)] items-center gap-2 rounded-lg bg-white/10 px-3 py-2"
                        >
                          <span className="font-lato text-xs font-bold text-primary">
                            {highlight.time}
                          </span>
                          <span className="font-lato text-xs text-white sm:text-sm">
                            {highlight.text}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-lg bg-white/10 px-3 py-3">
                        <p className="font-lato text-xs text-white sm:text-sm">
                          Tip-off is live. Score updates will start rolling in
                          from the mock game feed.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Messages */}
          <div
            ref={messagesScrollRef}
            onScroll={handleMessagesScroll}
            className="min-h-0 flex-1 overflow-y-auto bg-slate-50 px-4 py-4 sm:px-5"
          >
            {loadingMessages ? (
              <div className="flex h-full items-center justify-center">
                <p className="font-lato text-sm text-slate-400">
                  Loading messages...
                </p>
              </div>
            ) : chatError && displayMessages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="max-w-[28rem] rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-center font-lato text-sm text-rose-700">
                  {chatError}
                </p>
              </div>
            ) : displayMessages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="rounded-xl bg-white px-4 py-3 text-center font-lato text-sm text-slate-500 shadow-sm">
                  No messages yet. Start the conversation.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
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
                      <div className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5">
                        <p className="font-lato text-[0.74rem] font-bold text-slate-500 sm:text-sm">
                          {message.text}
                        </p>
                      </div>
                    ) : (
                      <div className="max-w-[82%]">
                        {message.align === "left" && (
                          <p className="mb-1 px-1 font-lato text-[0.7rem] font-semibold text-slate-400 [overflow-wrap:anywhere]">
                            {message.sender}
                          </p>
                        )}
                        <div
                          className={`px-3.5 py-2 shadow-sm ${
                            message.align === "right"
                              ? "rounded-2xl rounded-br-md bg-secondary text-white"
                              : "rounded-2xl rounded-bl-md border border-slate-200 bg-white text-slate-700"
                          }`}
                        >
                          <p className="font-lato text-sm leading-6 [overflow-wrap:anywhere] sm:text-[0.95rem]">
                            {message.text}
                          </p>
                        </div>
                        <p
                          className={`mt-0.5 px-1 font-lato text-[0.66rem] text-slate-400 ${
                            message.align === "right" ? "text-right" : "text-left"
                          }`}
                        >
                          {message.time}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="sticky bottom-0 border-t border-slate-200 bg-white px-4 py-3 sm:px-5">
            {chatError && displayMessages.length > 0 && (
              <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5">
                <p className="font-lato text-sm text-rose-700">{chatError}</p>
              </div>
            )}

            {!gameHidden && !loadingMessages && currentPredictionEntry && (
              <div className="mb-3 flex items-center gap-2 rounded-xl border border-secondary/20 bg-secondary/5 px-4 py-2.5">
                <span className="rounded-md bg-secondary px-2 py-0.5 font-lato text-[0.62rem] font-bold uppercase tracking-[0.12em] text-white">
                  Locked
                </span>
                <p className="font-lato text-sm font-bold text-secondary">
                  {currentPredictionEntry.choice}
                </p>
              </div>
            )}

            {!gameHidden &&
              !loadingMessages &&
              predictionState.activeRound !== null &&
              !currentPredictionEntry && (
                <div className="mb-3 overflow-hidden rounded-xl border border-secondary/20 bg-secondary shadow-[0_12px_24px_rgba(25,52,102,0.18)]">
                  <div className="flex items-center justify-between gap-3 border-b border-white/10 px-3.5 py-2 text-white">
                    <p className="flex items-center gap-1.5 font-lato text-[0.74rem] font-bold sm:text-xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Next play — call it
                    </p>
                    <span className="rounded-full bg-primary px-2 py-0.5 font-lato text-[0.68rem] font-bold text-secondary">
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
                        className="rounded-lg bg-white px-2 py-2 font-lato text-[0.78rem] font-bold text-secondary transition-colors hover:bg-primary hover:text-secondary disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              )}

            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 focus-within:border-secondary focus-within:bg-white">
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
                className="w-full bg-transparent font-lato text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
              />
              <button
                type="button"
                aria-label="Send message"
                onClick={() => void handleSendMessage()}
                disabled={!activeRoomId || sendingMessage || !draft.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-white transition-colors hover:bg-[#16327a] disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <PaperAirplaneIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      </main>

      <ConfirmDialog
        isOpen={photoDialogOpen}
        title="¿Cambiar foto?"
        message="Selecciona una nueva imagen para el grupo."
        confirmLabel="Cambiar foto"
        cancelLabel="Cancel"
        onConfirm={() => {
          setPhotoDialogOpen(false);
          photoInputRef.current?.click();
        }}
        onCancel={() => setPhotoDialogOpen(false)}
      />

      <ConfirmDialog
        isOpen={leaveDialogOpen}
        title="Leave this group?"
        message="It will no longer appear in your rooms list."
        confirmLabel={leavingRoom ? "Leaving..." : "Leave Group"}
        cancelLabel="Cancel"
        destructive
        onConfirm={handleLeaveRoom}
        onCancel={() => setLeaveDialogOpen(false)}
      />

      <ConfirmDialog
        isOpen={removeMatchDialogOpen}
        title="Remove match?"
        message="If you remove the match all the people inside of the chat will also have the match removed."
        confirmLabel="Remove Match"
        cancelLabel="Cancel"
        destructive
        onConfirm={() => {
          setRemoveMatchDialogOpen(false);
          void applyGameVisibility(true);
        }}
        onCancel={() => setRemoveMatchDialogOpen(false)}
      />
    </div>
  );
}

export default RoomChat;
