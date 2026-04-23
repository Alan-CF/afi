import { XMarkIcon } from "@heroicons/react/24/outline";
import ChatBubble from "../../ui/ChatBubble";
import { useMessages } from "../../../hooks/useThunderAI";
import { useShopProductsByIds } from "../../../hooks/useShopProducts";
import ChatProductCarrousel from "../../ui/shop/ChatProductCarrousel";
import type { ProductRecomendation } from "../../ui/shop/ChatProductCarrousel";
import type { PricedProduct } from "../../../hooks/useShopProducts";

interface ThunderChatProps {
  onClose?: () => void;
}

type ThunderRecommendation = {
  product_id: number;
  description: string;
};

type ThunderJsonReply = {
  reply?: {
    top_message?: string;
    products?: ThunderRecommendation[];
    bottom_message?: string;
  };
};

function handlePricedProducts(
  recommendations: ThunderRecommendation[],
  pricedProducts: PricedProduct[],
): ProductRecomendation[] {
  if (recommendations.length === 0 || pricedProducts.length === 0) {
    return [];
  }

  const productsById = new Map(
    pricedProducts.map((product) => [product.id, product]),
  );

  return recommendations
    .map((recommendation) => {
      const product = productsById.get(recommendation.product_id);

      if (!product) {
        return null;
      }

      return {
        product,
        description: recommendation.description,
      };
    })
    .filter((item): item is ProductRecomendation => item !== null);
}

function ParsedMessage({ content }: { content: string }) {
  const renderText = (text: string) => (
    <p className="whitespace-pre-line font-lato text-sm">{text}</p>
  );

  let parsedReply: ThunderJsonReply["reply"] | null = null;

  try {
    const parsed = JSON.parse(content) as ThunderJsonReply;
    parsedReply = parsed?.reply ?? null;
  } catch {
    parsedReply = null;
  }

  if (!parsedReply) {
    return renderText(content);
  }

  const recommendationProducts: ThunderRecommendation[] = (
    parsedReply.products ?? []
  ).map((product) => ({
    product_id: product.product_id,
    description: product.description,
  }));

  const productIds = recommendationProducts.map(
    (product) => product.product_id,
  );

  console.log("productIds extracted from message:", productIds);
  const { products: pricedProducts } = useShopProductsByIds(
    productIds.length > 0 ? productIds : null,
  );
  console.log("Priced products fetched for recommendations:", pricedProducts);

  const mappedRecommendations = handlePricedProducts(
    recommendationProducts,
    pricedProducts,
  );

  console.log(
    "Mapped recommendations with product details:",
    mappedRecommendations,
  );
  const topMessage = parsedReply.top_message?.trim() ?? "";
  const bottomMessage = parsedReply.bottom_message?.trim() ?? "";

  return (
    <div className="flex flex-col gap-3">
      {topMessage ? renderText(topMessage) : null}
      <ChatProductCarrousel recommendations={mappedRecommendations} />
      {bottomMessage ? renderText(bottomMessage) : null}
    </div>
  );
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
