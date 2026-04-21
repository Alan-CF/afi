export interface ChatMessage {
  message: string;
  isUser: boolean;
}

export default function ChatBubble({ message, isUser }: ChatMessage) {
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-2`}>
      <div className={`max-w-xs px-4 py-2 text-sm rounded-2xl
        ${isUser
          ? 'bg-secondary text-white rounded-tr-none'
          : 'bg-gray-200 text-gray-900 rounded-tl-none'
        }`}>
        {message}
      </div>
    </div>
  );
}