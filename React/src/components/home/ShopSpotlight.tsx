import { useNavigate } from "react-router-dom";
import Button from "../ui/Button";
import { useCategories, useCollections } from "../../hooks/useShopGroups";

export default function ShopSpotlight() {
  const navigate = useNavigate();
  const { categories, loading: catLoading } = useCategories();
  const { collections, loading: colLoading } = useCollections();

  const featuredCollection = collections[0] ?? null;
  const topCategories = categories.slice(0, 4);

  function goTo(filterKey: "category" | "collection", value: string) {
    const params = new URLSearchParams();
    params.set(filterKey, value);
    navigate(`/shop/products?${params.toString()}`);
  }

  return (
    <section
      aria-labelledby="shop-title"
      className="rounded-3xl border-2 border-gray-100 bg-white p-5 shadow-sm"
    >
      <header className="mb-4">
        <p className="font-lato text-xs uppercase tracking-[0.16em] text-text-light">Warriors gear</p>
        <h2 id="shop-title" className="font-anton text-3xl text-secondary">Shop</h2>
      </header>

      {colLoading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-gray-100" />
      ) : featuredCollection ? (
        <button
          type="button"
          onClick={() => goTo("collection", featuredCollection.name)}
          className="group relative flex h-40 w-full items-end overflow-hidden rounded-2xl bg-secondary p-5 text-left"
        >
          {featuredCollection.image_url && (
            <img
              src={featuredCollection.image_url}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-60 transition-opacity group-hover:opacity-70"
            />
          )}
          <div className="relative z-10">
            <p className="font-lato text-xs font-bold uppercase tracking-[0.16em] text-primary">
              Featured collection
            </p>
            <p className="font-anton text-3xl text-white">{featuredCollection.name}</p>
          </div>
        </button>
      ) : null}

      {!catLoading && topCategories.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {topCategories.map((cat) => (
            <button
              key={cat.name}
              type="button"
              onClick={() => goTo("category", cat.name)}
              className="flex flex-col gap-2 rounded-2xl border border-gray-100 p-3 text-left transition-colors hover:border-secondary"
            >
              {cat.image_url ? (
                <div
                  className="h-24 rounded-xl bg-cover bg-center"
                  style={{ backgroundImage: `url(${cat.image_url})` }}
                  aria-hidden="true"
                />
              ) : (
                <div className="h-24 rounded-xl bg-text-light-soft" aria-hidden="true" />
              )}
              <p className="font-anton text-sm text-secondary">{cat.name}</p>
            </button>
          ))}
        </div>
      )}

      <div className="mt-5 flex justify-center">
        <Button variant="secondary" onClick={() => navigate("/shop")}>
          Browse all products
        </Button>
      </div>
    </section>
  );
}
