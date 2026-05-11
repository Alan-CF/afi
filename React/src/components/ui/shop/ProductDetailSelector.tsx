import { useEffect, useMemo, useState } from 'react';

export type ProductSelectorEntry = {
  key: string;
  label: string;
  options: string[];
};

interface ProductDetailSelectorProps {
  selectors: ProductSelectorEntry[];
  className?: string;
  onSelectionChange?: (selection: Record<string, string>) => void;
}

export default function ProductDetailSelector({
  selectors,
  className = '',
  onSelectionChange,
}: ProductDetailSelectorProps) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(
    {}
  );

  const selectedValues = useMemo(
    () =>
      selectors.reduce<Record<string, string>>((accumulator, selector) => {
        const current = selectedOptions[selector.key];
        accumulator[selector.key] = selector.options.includes(current)
          ? current
          : selector.options[0];
        return accumulator;
      }, {}),
    [selectors, selectedOptions]
  );

  useEffect(() => {
    onSelectionChange?.(selectedValues);
  }, [onSelectionChange, selectedValues]);

  if (selectors.length === 0) {
    return null;
  }

  const getSelectedValue = (selector: ProductSelectorEntry) => {
    return selectedValues[selector.key];
  };

  return (
    <div className={`mt-2 flex flex-col gap-4 ${className}`.trim()}>
      {selectors.map((selector) => {
        const selectedValue = getSelectedValue(selector);

        return (
          <div key={selector.key} className="flex flex-col gap-2">
            <p className="font-lato text-lg text-gray-700">
              {selector.label}: <span className="font-semibold text-black">{selectedValue}</span>
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
  );
}
