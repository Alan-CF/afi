import type { ChatMessage } from "../../ui/ChatBubble";
import ChatBubble from "../../ui/ChatBubble";

interface ThunderChatProps {
  messages: ChatMessage[];
}

export default function ThunderChat({ messages }: ThunderChatProps) {
  return (
    <section className="flex h-full min-h-0 flex-col bg-white">
      <header className="mb-4 flex items-center gap-3 border-b border-gray-200 pb-3">
        <img
          src="/warriors_icon.png"
          alt="Thunder"
          className="h-10 w-10 rounded-full border border-secondary border-2 bg-secondary/10"
        />
        <div>
          <h3 className="font-anton text-2xl leading-none">ThunderAI</h3>
          <p className="font-lato text-xs text-gray-600">Your AI shopping assistant</p>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {messages.map((msg, idx) => (
          <ChatBubble key={idx} message={msg.message} isUser={msg.isUser} />
        ))}
      </div>
    </section>
  );
}
