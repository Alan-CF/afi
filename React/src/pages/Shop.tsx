import NavBar from "../components/layout/NavBar"
import { ProductGroupCard } from "../components/ui/shop/ProductGroupCard"; 
import { useCategories, useCollections, usePlayers } from "../hooks/useShopGroups";
import ShopCarousel from "../components/ui/shop/Carrousel";


export default function Shop() {
  const { 
    //categories, 
    //loading: categoriesLoading, 
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
  </>);
}
