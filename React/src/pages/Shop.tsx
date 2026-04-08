import NavBar from "../components/layout/NavBar"
import { ProductGroupCard } from "../components/ui/shop/ProductGroupCard"; 
import { useCategories, useCollections, usePlayers } from "../hooks/useShopGroups";
import ShopCarousel from "../components/ui/shop/Carrousel";
import ShopHero from "../components/ui/shop/Hero";
import ShopSeparator from "../components/ui/shop/Separator";
import SearchBar from "../components/layout/Shop/SearchBar";


export default function Shop() {
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

  <SearchBar loading={categoriesLoading}>
    {categories.map(category => (
      <button
        key={category.name}
        onClick={() => console.log(`Category ${category.name} clicked`)}
        className="shrink-0 rounded-full border border-black px-4 py-2 font-lato text-sm font-semibold uppercase text-black transition-colors hover:bg-black hover:text-white"
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
        onClick={() => console.log(`Player ${player.name} clicked`)}
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
        onClick={() => console.log(`Collection ${collection.name} clicked`)}
      />
    ))}
  </ShopCarousel>
 

  </>);
}
