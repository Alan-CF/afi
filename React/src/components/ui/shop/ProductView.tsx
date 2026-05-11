import { useMemo, useState } from 'react';
import ProductVisualizer from './ProductVisualizer';

interface ProductViewProps {
  imageUrls?: string[];
  name?: string;
  description?: string;
  price?: number;
  discount?: number;
  productDetails?: Record<string, unknown>;
  loading?: boolean;
  error?: Error | null;
}

type SelectorEntry = {
  key: string;
  label: string;
  options: string[];
};

type DetailEntry = {
  label: string;
  value: string;
};

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

function formatDetailKey(key: string) {
  return key
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function parseProductDetails(details: Record<string, unknown>) {
  const selectors: SelectorEntry[] = [];
  const detailEntries: DetailEntry[] = [];

  for (const [key, rawValue] of Object.entries(details)) {
    const label = formatDetailKey(key);

    if (Array.isArray(rawValue)) {
      const options = rawValue
        .map((item) => String(item).trim())
        .filter(Boolean);

      if (options.length > 1) {
        selectors.push({ key, label, options });
      } else if (options[0]) {
        detailEntries.push({ label, value: options[0] });
      }
      continue;
    }

    if (rawValue === null || rawValue === undefined || typeof rawValue === 'object') {
      continue;
    }

    const value = String(rawValue).trim();
    if (value) {
      detailEntries.push({ label, value });
    }
  }

  return { selectors, detailEntries };
}

export default function ProductView({
  imageUrls = [],
  name = 'Product',
  description,
  price,
  discount = 0,
  productDetails = {},
  loading,
  error,
}: ProductViewProps) {
  const { selectors, detailEntries } = useMemo(
    () => parseProductDetails(productDetails),
    [productDetails]
  );

  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >({});
  const hasPrice = typeof price === 'number';
  const hasDiscount = hasPrice && discount > 0;
  const displayedPrice = hasPrice ? (hasDiscount ? price * (1 - discount) : price) : null;

  const getSelectedValue = (selector: SelectorEntry) => {
    const current = selectedOptions[selector.key];
    return selector.options.includes(current) ? current : selector.options[0];
  };

  return (
    <div className="w-full bg-secondary/15">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8 md:px-8 lg:flex-row lg:items-start">
        <div className="w-full lg:max-w-3xl lg:flex-1">
          <ProductVisualizer
            imageUrls={imageUrls}
            loading={loading}
            error={error}
          />
        </div>

        <aside className="flex w-full flex-col gap-4 rounded-xl bg-white p-6 shadow-md lg:max-w-xl lg:flex-1">
          {loading ? (
            <div className="flex animate-pulse flex-col gap-3">
              <div className="h-8 w-3/4 rounded bg-gray-200" />
              <div className="h-6 w-1/2 rounded bg-gray-200" />
              <div className="h-4 w-full rounded bg-gray-200" />
              <div className="h-4 w-5/6 rounded bg-gray-200" />
            </div>
          ) : error ? (
            <p className="font-lato text-sm text-red-600">
              Unable to load product details.
            </p>
          ) : (
            <>
              <h1 className="font-anton text-3xl font-bold text-black md:text-4xl">
                {name}
              </h1>

              {displayedPrice !== null ? (
                <div className="flex items-center gap-3 font-lato">
                  <span className="text-3xl font-bold text-black">
                    {currencyFormatter.format(displayedPrice)}
                  </span>
                  {hasDiscount ? (
                    <>
                      <span className="text-lg text-gray-400 line-through">
                        {currencyFormatter.format(price)}
                      </span>
                      <span className="rounded-full bg-red-100 px-2 py-1 text-sm font-bold text-red-700">
                        {Math.round(discount * 100)}% OFF
                      </span>
                    </>
                  ) : null}
                </div>
              ) : null}

              <p className="font-lato text-base leading-relaxed text-gray-700">
                {description?.trim() ||
                  'No description available for this product.'}
              </p>

              {selectors.length > 0 ? (
                <div className="mt-2 flex flex-col gap-4">
                  {selectors.map((selector) => {
                    const selectedValue = getSelectedValue(selector);

                    return (
                      <div key={selector.key} className="flex flex-col gap-2">
                        <p className="font-lato text-lg text-gray-700">
                          {selector.label}:{' '}
                          <span className="font-semibold text-black">
                            {selectedValue}
                          </span>
                        </p>

                        <div className="flex flex-wrap gap-3">
                          {selector.options.map((option) => {
                            const isSelected = option === selectedValue;

                            return (
                              <button
                                key={`${selector.key}-${option}`}
                                type="button"
                                onClick={() =>
                                  setSelectedOptions((prev) => ({
                                    ...prev,
                                    [selector.key]: option,
                                  }))
                                }
                                className={`rounded-xl px-4 py-2 font-lato text-md transition-colors ${
                                  isSelected
                                    ? 'border-4 border-secondary bg-blue-50 font-semibold text-black'
                                    : 'border border-dashed border-gray-400 bg-white text-gray-800 hover:border-gray-500'
                                }`}
                              >
                                {option}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {detailEntries.length > 0 ? (
                <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {detailEntries.map((entry) => (
                    <div
                      key={entry.label}
                      className="rounded-lg border border-black/10 bg-white p-3"
                    >
                      <p className="font-lato text-xs font-semibold uppercase tracking-wide text-gray-500">
                        {entry.label}
                      </p>
                      <p className="mt-1 font-lato text-sm text-black">
                        {entry.value}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
