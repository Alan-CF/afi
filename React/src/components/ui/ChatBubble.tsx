export interface ChatMessage {
  children: React.ReactNode;
  isUser: boolean;
}

export default function ChatBubble({ children, isUser }: ChatMessage) {
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-2`}>
      <div className={`max-w-xs px-4 py-2 text-sm rounded-2xl
        ${isUser
          ? 'bg-secondary text-white rounded-tr-none ml-5'
          : 'bg-gray-100 text-black border border-gray-300 rounded-tl-none mr-5'
        }`}>
        {children}
      </div>
    </div>
  );
}