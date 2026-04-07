import NavBar from "../components/layout/NavBar"
import { ProductGroupCard } from "../components/ui/shop/ProductGroupCard"; 
import { useCategories, useCollections, usePlayers } from "../hooks/useShopGroups";

export default function Shop() {
  const { 
    categories, 
    loading: categoriesLoading, 
    error: categoriesError 
  } = useCategories();
  const { 
    collections, 
    loading: collectionsLoading, 
    error: collectionsError 
  } = useCollections();
  const { 
    players, 
    loading: playersLoading, 
    error: playersError 
  } = usePlayers();

  console.log("Shop data:", { categories, collections, players });

  if (categoriesLoading) {
    return (
      <>
        <NavBar />
        <div className="p-4">Loading shop...</div>
      </>
    );
  }

  if (categoriesError) {
    return (
      <>
        <NavBar />
        <div className="p-4">Could not load shop categories.</div>
      </>
    );
  }

  return (<>
  <NavBar />
  <div className="flex gap-4 overflow-x-auto p-4 scrollbar-hide">
    {categories.map(category => (
      <ProductGroupCard
        key={category.name}
        title={category.name}
        imageUrl={category.image_url}
        onClick={() => console.log(`Category ${category.name} clicked`)}
      />
    ))}
  </div>

  <div className="flex gap-4 overflow-x-auto p-4 scrollbar-hide">
    {collections.map(collection => (
      <ProductGroupCard
        key={collection.name}
        title={collection.name}
        imageUrl={collection.image_url}
        onClick={() => console.log(`Collection ${collection.name} clicked`)}
      />
    ))}
  </div>

  <div className="flex gap-4 overflow-x-auto p-4 scrollbar-hide">
    {players.map(player => (
      <ProductGroupCard
        key={player.name}
        title={player.name}
        description={`#${player.number} - ${player.position}`}
        imageUrl={player.image_url}
        onClick={() => console.log(`Player ${player.name} clicked`)}
      />
    ))}
  </div>
  </>);
}
