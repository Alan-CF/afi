import { useNavigate } from "react-router-dom";
import Button from "../ui/Button";
import { useCategories, useCollections } from "../../hooks/useShopGroups";

export default function ShopSpotlight() {
  const navigate = useNavigate();
  const { categories } = useCategories();
  const { collections } = useCollections();

  const featured = collections[0] ?? null;
  const topCategories = categories.slice(0, 4);

  function goToCategory(name: string) {
    navigate(`/shop/products?category=${encodeURIComponent(name)}`);
  }

  function goToCollection(name: string) {
    navigate(`/shop/products?collection=${encodeURIComponent(name)}`);
  }

  return (
    <section aria-label="Shop">
      <div className="flex flex-col gap-4">
        <div
          onClick={() => featured ? goToCollection(featured.name) : navigate("/shop")}
          className="group relative w-full aspect-[16/10] md:aspect-[21/9] overflow-hidden rounded-3xl bg-secondary cursor-pointer focus-visible:ring-2 focus-visible:ring-primary text-left"
          aria-label={featured?.name ?? "Shop"}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && (featured ? goToCollection(featured.name) : navigate("/shop"))}
        >

          {featured?.image_url && (
            <img
              src={featured.image_url}
              alt=""
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 opacity-60"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-12 gap-3 md:gap-4 max-w-lg">
            <h2 className="font-anton text-3xl sm:text-4xl md:text-6xl text-white lowercase leading-tight md:leading-none">
              {featured?.name ?? "game day"}
            </h2>
            <div>
              <Button variant="primary" onClick={() => {
                    featured ? goToCollection(featured.name) : navigate("/shop");
                  }}
        >
                Shop now →
              </Button>
            </div>
          </div>
        </div>

        {topCategories.length > 0 && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {topCategories.map((cat) => (
              <button
                key={cat.name}
                type="button"
                onClick={() => goToCategory(cat.name)}
                className="group relative aspect-square overflow-hidden rounded-2xl bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={cat.name}
              >
                {cat.image_url && (
                  <img
                    src={cat.image_url}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <span className="absolute bottom-0 left-0 p-3 font-anton text-base text-white lowercase">
                  {cat.name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
