import { XMarkIcon } from "@heroicons/react/24/outline";
import type { ChatMessage } from "../../ui/ChatBubble";
import ChatBubble from "../../ui/ChatBubble";

interface ThunderChatProps {
  messages: ChatMessage[];
  onClose?: () => void;
}

export default function ThunderChat({ messages, onClose }: ThunderChatProps) {
  return (
    <section className="flex h-full min-h-0 flex-col bg-white">
      <header className="mb-4 flex items-center gap-3 border-b border-gray-200 pb-3">
        <img
          src="/warriors_icon.png"
          alt="Thunder"
          className="h-10 w-10 rounded-full border border-secondary border-2 bg-secondary/10"
        />
        <div className="min-w-0 flex-1">
          <h3 className="font-anton text-2xl leading-none">ThunderAI</h3>
          <p className="font-lato text-xs text-gray-600">Your AI shopping assistant</p>
        </div>
        {onClose ? (
          <button
            type="button"
            aria-label="Close chat"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100 hover:text-secondary"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        ) : null}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {messages.map((msg, idx) => (
          <ChatBubble key={idx} message={msg.message} isUser={msg.isUser} />
        ))}
      </div>
    </section>
  );
}
