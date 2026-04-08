import {
  ArrowLeftIcon,
  InformationCircleIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/solid";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { Room } from "../../components/ui/RoomCard";

type ChatLocationState = {
  room?: Room;
};

type ChatMessage = {
  id: number;
  sender: string;
  text: string;
  time: string;
  align: "left" | "right";
};

const defaultRoom: Room = {
  id: 999,
  title: "Warriors Game Night",
  status: "live",
  members: "Cesar, Luis, Maria +2",
  subtitle: "Live chat is on",
  accent: "#1D428A",
};

const baseMessages: ChatMessage[] = [
  {
    id: 1,
    sender: "Luis",
    text: "Hey everyone! Ready for the game?",
    time: "7:30 PM",
    align: "left",
  },
  {
    id: 2,
    sender: "You",
    text: "Let's go Warriors!",
    time: "7:31 PM",
    align: "right",
  },
  {
    id: 3,
    sender: "Maria",
    text: "This is going to be epic!",
    time: "7:32 PM",
    align: "left",
  },
  {
    id: 4,
    sender: "Cesar",
    text: "Curry is starting hot",
    time: "8:15 PM",
    align: "left",
  },
  {
    id: 5,
    sender: "Luis",
    text: "That dunk was insane",
    time: "8:38 PM",
    align: "left",
  },
];

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

function RoomChat() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as ChatLocationState | null;
  const room = state?.room ?? defaultRoom;
  const [draft, setDraft] = useState("");
  const [infoOpen, setInfoOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(baseMessages);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scoreboard = useMemo(() => scoreSeed(room), [room]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSendMessage() {
    const trimmedDraft = draft.trim();
    if (!trimmedDraft) return;

    const newMessage: ChatMessage = {
      id: Date.now(),
      sender: "You",
      text: trimmedDraft,
      time: formatMessageTime(new Date()),
      align: "right",
    };

    setMessages((current) => [...current, newMessage]);
    setDraft("");
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f8fbff_0%,_#eef3fb_48%,_#dce6f3_100%)]">
      <main className="flex h-screen w-full flex-col">
        <section className="flex h-full w-full flex-1 flex-col overflow-hidden bg-white">
          <div className="bg-secondary px-4 py-3 text-white sm:px-5">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => navigate("/rooms")}
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
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.align === "right" ? "justify-end" : "justify-start"
                  }`}
                >
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
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="sticky bottom-0 border-t border-[#e7edf6] bg-white px-4 py-3 sm:px-5">
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
                className="w-full bg-transparent font-lato text-sm text-[#334155] placeholder:text-[#9aa6b8] focus:outline-none"
              />
              <button
                type="button"
                aria-label="Send message"
                onClick={handleSendMessage}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#d7e5fb] text-secondary transition-colors hover:bg-[#c6daf8]"
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
