import NavBar from "../components/layout/NavBar";
import { ProductGroupCard } from "../components/ui/shop/ProductGroupCard";
import { useCategories, useCollections, usePlayers } from "../hooks/useShopGroups";
import ShopCarousel from "../components/ui/shop/Carrousel";
import ShopHero from "../components/ui/shop/Hero";
import ShopSeparator from "../components/ui/shop/Separator";
import SearchBar from "../components/layout/Shop/SearchBar";
import { useNavigate } from "react-router-dom";
import ThunderChat from "../components/layout/Shop/ThunderChat";
import { useState } from "react";

function ProductGroupCardSkeleton() {
  return (
    <div className="flex shrink-0 flex-col justify-between p-4 text-start">
      <div className="mb-4 h-90 w-52 animate-pulse rounded bg-gray-200 md:h-120 md:w-72" />
      <div className="flex flex-col gap-2">
        <div className="h-8 w-40 animate-pulse rounded bg-gray-200 md:h-10" />
        <div className="h-5 w-28 animate-pulse rounded bg-gray-200 md:h-6" />
      </div>
    </div>
  );
}

export default function Shop() {
  const navigate = useNavigate();
  const [isChatOpen, setIsChatOpen] = useState(false);

  const navigateToProducts = (filterKey: "category" | "player" | "collection", filterValue: string) => {
    const params = new URLSearchParams();
    params.set(filterKey, filterValue);

    navigate(`/shop/products?${params.toString()}`);
  };

  const navigateToProductsSearch = (query: string) => {
    const params = new URLSearchParams();
    params.set("search", query);

    navigate(`/shop/products?${params.toString()}`);
  };

  const { 
    categories, 
    loading: categoriesLoading, 
    //error: categoriesError 
  } = useCategories();
  const { 
    collections, 
    loading: collectionsLoading, 
    //error: collectionsError 
  } = useCollections();
  const { 
    players, 
    loading: playersLoading, 
    //error: playersError 
  } = usePlayers();

  return (
    <div className="flex h-screen flex-col">
      <NavBar />

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto scrollbar-hide">
          <SearchBar loading={categoriesLoading} onSearch={navigateToProductsSearch}>
            {categories.map((category) => (
              <button
                key={category.name}
                onClick={() => navigateToProducts("category", category.name)}
                className="shrink-0 rounded-full border border-black px-4 py-2 font-lato text-sm font-semibold uppercase text-black transition-colors hover:border-secondary hover:bg-secondary hover:text-primary"
              >
                {category.name}
              </button>
            ))}
          </SearchBar>

          <ShopHero />

          <h2 className="px-6 pt-10 font-anton text-3xl font-bold text-black md:px-8 md:text-4xl">
            Shop by Player
          </h2>
          <ShopCarousel>
            {playersLoading
              ? Array.from({ length: 4 }).map((_, index) => <ProductGroupCardSkeleton key={index} />)
              : players.map((player) => (
                  <ProductGroupCard
                    key={player.name}
                    title={player.name}
                    description={`#${player.number} - ${player.position}`}
                    imageUrl={player.image_url}
                    onClick={() => navigateToProducts("player", player.name)}
                  />
                ))}
          </ShopCarousel>

          <ShopSeparator message="Complete your fit with exclusive team collections" />

          <h2 className="px-6 pt-10 font-anton text-3xl font-bold text-black md:px-8 md:text-4xl">
            Our Collections
          </h2>
          <ShopCarousel>
            {collectionsLoading
              ? Array.from({ length: 4 }).map((_, index) => <ProductGroupCardSkeleton key={index} />)
              : collections.map((collection) => (
                  <ProductGroupCard
                    key={collection.name}
                    title={collection.name}
                    imageUrl={collection.image_url}
                    onClick={() => navigateToProducts("collection", collection.name)}
                  />
                ))}
          </ShopCarousel>
        </main>

        {!isChatOpen ? (
          <button
            type="button"
            aria-label="Open chat"
            className="fixed bottom-6 right-6 z-30 h-24 w-24 cursor-pointer rounded-full border-6 border-secondary bg-white shadow-lg"
            onClick={() => setIsChatOpen(true)}
          >
            <img src="/warriors_icon.png" alt="Thunder chat" />
          </button>
        ) : null}

        {isChatOpen ? (
          <>
            <button
              type="button"
              aria-label="Close chat overlay"
              className="absolute inset-0 z-30 bg-black/35 lg:hidden"
              onClick={() => setIsChatOpen(false)}
            />
            <aside className="absolute inset-y-0 right-0 z-40 w-full border-l border-secondary/20 bg-white p-4 shadow-xl lg:relative lg:inset-auto lg:z-auto lg:h-full lg:w-[30rem] lg:max-w-none lg:shadow-none">
              <ThunderChat onClose={() => setIsChatOpen(false)} />
            </aside>
          </>
        ) : null}
      </div>
    </div>
  );
}
