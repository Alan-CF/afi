import { XMarkIcon } from "@heroicons/react/24/outline";
import ChatBubble from "../../ui/ChatBubble";
import { useMessages } from "../../../hooks/useThunderAI";
import ChatProductCarrousel from "../../ui/shop/ChatProductCarrousel";
import type { ProductRecomendation } from "../../ui/shop/ChatProductCarrousel";

interface ThunderChatProps {
  onClose?: () => void;
}

type ThunderJsonReply = {
  reply?: {
    top_message?: string;
    products?: {
      product_id: number;
      description: string;
    }[];
    bottom_message?: string;
  };
};

const PLACEHOLDER_RECOMMENDATIONS: ProductRecomendation[] = [
  {
    product: {
      id: -1,
      name: "Warriors Gift Set Placeholder",
      description: "",
      price: 19.99,
      discount: 0,
      is_active: true,
      stock: 999,
      image_url:
        "https://upktcnvztyldwzapbuqq.supabase.co/storage/v1/object/public/products/products/Klay%20Thompson%2011%20T-Shirt.jpg",
      product_details: {},
      meta_data: {},
    },
    description: "Placeholder recommendation for the Warriors Gift Set.",
  },
  {
    product: {
      id: -2,
      name: "Warriors Fan Pack Placeholder",
      description: "",
      price: 14.99,
      discount: 0,
      is_active: true,
      stock: 999,
      image_url:
        "https://upktcnvztyldwzapbuqq.supabase.co/storage/v1/object/public/products/products/Warriors%20Fan%20Pack.jpg",
      product_details: {},
      meta_data: {},
    },
    description: "Placeholder recommendation for the Warriors Fan Pack.",
  },
];

function ParsedMessage({ content }: { content: string }) {
  const renderText = (text: string) => (
    <p className="whitespace-pre-line font-lato text-sm">{text}</p>
  );

  try {
    const parsed = JSON.parse(content) as ThunderJsonReply;

    if (!parsed?.reply) {
      return renderText(content);
    }

    const topMessage = parsed.reply?.top_message?.trim() ?? "";
    const bottomMessage = parsed.reply?.bottom_message?.trim() ?? "";

    return (
      <div className="flex flex-col gap-3">
        {topMessage ? renderText(topMessage) : null}
        <ChatProductCarrousel recommendations={PLACEHOLDER_RECOMMENDATIONS} />
        {bottomMessage ? renderText(bottomMessage) : null}
      </div>
    );
  } catch {
    return renderText(content);
  }
}

export default function ThunderChat({ onClose }: ThunderChatProps) {
  const {
    messages,
    loading: messagesLoading,
    error: messagesError,
    // hasLoadedOnce: messagesHaveLoadedOnce
  } = useMessages({ enabled: true });

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
          <p className="font-lato text-xs text-gray-600">
            Your AI shopping assistant
          </p>
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

      <div className="overflow-y-auto pr-1">
        {messagesLoading ? (
          <div className="flex h-full items-center justify-center py-10">
            <div
              className="h-7 w-7 animate-spin rounded-full border-4 border-gray-200 border-t-secondary"
              role="status"
              aria-label="Loading messages"
            />
          </div>
        ) : messagesError ? (
          <div className="flex h-full items-center justify-center py-10">
            <p className="max-w-xs text-center font-lato text-sm text-red-600">
              Error loading messages. Please try again.
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <ChatBubble key={idx} isUser={msg.is_user}>
              <ParsedMessage content={msg.content} />
            </ChatBubble>
          ))
        )}
      </div>
    </section>
  );
}
