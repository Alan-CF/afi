import NavBar from "../components/layout/NavBar"
import { ProductGroupCard } from "../components/ui/shop/ProductGroupCard"; 
import { useCategories, useCollections, usePlayers } from "../hooks/useShopGroups";
import ShopCarousel from "../components/ui/shop/Carrousel";
import ShopHero from "../components/ui/shop/Hero";
import ShopSeparator from "../components/ui/shop/Separator";
import SearchBar from "../components/layout/Shop/SearchBar";
import { useNavigate } from "react-router-dom";

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
 

  return (<>
  <NavBar />

  <SearchBar loading={categoriesLoading} onSearch={navigateToProductsSearch}>
    {categories.map(category => (
      <button
        key={category.name}
        onClick={() => navigateToProducts("category", category.name)}
        className="shrink-0 rounded-full border border-black px-4 py-2 font-lato text-sm font-semibold uppercase text-black transition-colors hover:bg-secondary hover:text-primary hover:border-secondary"
      >
        {category.name}
      </button>
    ))}
  </SearchBar>

  <ShopHero />

<h2 className=" px-6 pt-10 text-3xl md:text-4xl font-bold text-black font-anton md:px-8">Shop by Player</h2>
  <ShopCarousel>
    {playersLoading
      ? Array.from({ length: 4 }).map((_, index) => <ProductGroupCardSkeleton key={index} />)
      : players.map(player => (
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

  <h2 className=" px-6 pt-10 text-3xl md:text-4xl font-bold text-black font-anton md:px-8">Our Collections</h2>
  <ShopCarousel>
    {collectionsLoading
      ? Array.from({ length: 4 }).map((_, index) => <ProductGroupCardSkeleton key={index} />)
      : collections.map(collection => (
          <ProductGroupCard
            key={collection.name}
            title={collection.name}
            imageUrl={collection.image_url}
            onClick={() => navigateToProducts("collection", collection.name)}
          />
        ))}
  </ShopCarousel>
 

  </>);
}
