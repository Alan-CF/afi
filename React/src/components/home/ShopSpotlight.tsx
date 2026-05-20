import { useNavigate } from 'react-router-dom';
import Button from '../ui/Button';
import { useCollections } from '../../hooks/useShopGroups';

export default function ShopSpotlight() {
  const navigate = useNavigate();
  const { collections } = useCollections();

  const featured = collections[0] ?? null;

  function goToCollection(name: string) {
    navigate(`/shop/products?collection=${encodeURIComponent(name)}`);
  }

  return (
    <section aria-label="Shop">
      <div
        onClick={() =>
          featured ? goToCollection(featured.name) : navigate('/shop')
        }
        className="group relative w-full aspect-[16/10] md:aspect-[21/9] overflow-hidden rounded-3xl bg-secondary cursor-pointer focus-visible:ring-2 focus-visible:ring-primary text-left"
        aria-label={featured?.name ?? 'Shop'}
        role="button"
        tabIndex={0}
        onKeyDown={(e) =>
          e.key === 'Enter' &&
          (featured ? goToCollection(featured.name) : navigate('/shop'))
        }
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
          <h2 className="font-anton text-3xl sm:text-4xl md:text-6xl text-white leading-tight md:leading-none">
            Game Day!
          </h2>
          <div>
            <Button
              variant="primary"
              onClick={() => {
                featured ? goToCollection(featured.name) : navigate('/shop');
              }}
            >
              Shop now →
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
