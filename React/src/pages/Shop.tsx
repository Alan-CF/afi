import NavBar from "../components/layout/NavBar"
import { ProductGroupCard } from "../components/ui/shop/ProductGroupCard"; 
import { useCategories, useCollections, usePlayers } from "../hooks/useShopGroups";
import ShopCarousel from "../components/ui/shop/Carrousel";
import ShopHero from "../components/ui/shop/Hero";
import ShopSeparator from "../components/ui/shop/Separator";
import SearchBar from "../components/layout/Shop/SearchBar";
import { useNavigate } from "react-router-dom";


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
    //loading: collectionsLoading, 
    //error: collectionsError 
  } = useCollections();
  const { 
    players, 
    //loading: playersLoading, 
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
    {players.map(player => (
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
    {collections.map(collection => (
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
