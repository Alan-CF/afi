import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProfile } from "../../hooks/useProfile";
import { supabase } from "../../lib/supabaseClient";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import {
  PencilIcon,
  EyeIcon,
  EyeSlashIcon,
  TrashIcon,
  PlusIcon,
  ShoppingCartIcon,
  ArchiveBoxXMarkIcon,
} from "@heroicons/react/24/solid";

type Tab = "visible" | "disabled" | "new";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  {
    id: "visible",
    label: "Visible Products",
    icon: <ShoppingCartIcon className="h-4 w-4" />,
  },
  {
    id: "disabled",
    label: "Disabled",
    icon: <ArchiveBoxXMarkIcon className="h-4 w-4" />,
  },
  {
    id: "new",
    label: "Add Product",
    icon: <PlusIcon className="h-4 w-4" />,
  },
];

interface Product {
  id: number;
  name: string;
  description: string;
  image_url: string | null;
  is_active: boolean;
  price: number;
  discount: number;
}

interface EditModalProps {
  product: Product;
  onClose: () => void;
  onSave: (updated: Partial<Product>) => Promise<void>;
}

function EditModal({ product, onClose, onSave }: EditModalProps) {
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description);
  const [price, setPrice] = useState(product.price.toString());
  const [discount, setDiscount] = useState(product.discount.toString());
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);

    await onSave({
      name,
      description,
      price: parseFloat(price),
      discount: parseFloat(discount),
    });

    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg mx-4 bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-secondary px-6 py-4">
          <h2 className="text-lg font-extrabold text-white">
            Edit Product
          </h2>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1 block">
              Name
            </label>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm text-secondary outline-none focus:border-secondary"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1 block">
              Description
            </label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm text-secondary outline-none focus:border-secondary resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1 block">
                Price ($)
              </label>

              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm text-secondary outline-none focus:border-secondary"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1 block">
                Discount (%)
              </label>

              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm text-secondary outline-none focus:border-secondary"
              />
            </div>
          </div>
        </div>

        <div className="h-px bg-gray-100" />

        <div className="flex gap-3 px-6 py-4">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-400 hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2 rounded-xl bg-secondary text-sm font-bold text-white hover:bg-secondary/90 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductCard({
  product,
  onEdit,
  onToggle,
  onDelete,
}: {
  product: Product;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const discountedPrice =
    product.price * (1 - product.discount / 100);

  return (
    <div
      className={`rounded-2xl border border-[var(--color-container-border)] overflow-hidden bg-white ${
        !product.is_active ? "opacity-80" : ""
      }`}
    >
      <div className="relative">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className={`w-full h-48 object-cover ${
              !product.is_active ? "grayscale" : ""
            }`}
          />
        ) : (
          <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
            <span className="text-gray-400 text-sm">
              No image
            </span>
          </div>
        )}

        <div className="absolute top-2 right-2 flex gap-1">
          <button
            onClick={onEdit}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow text-secondary hover:bg-gray-50"
          >
            <PencilIcon className="h-4 w-4" />
          </button>

          <button
            onClick={onToggle}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow text-secondary hover:bg-gray-50"
          >
            {product.is_active ? (
              <EyeIcon className="h-4 w-4" />
            ) : (
              <EyeSlashIcon className="h-4 w-4 text-gray-400" />
            )}
          </button>

          <button
            onClick={onDelete}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow text-red-500 hover:bg-red-50"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>

        {product.discount > 0 && (
          <span className="absolute top-2 left-2 bg-primary text-secondary text-xs font-bold px-2 py-1 rounded-full">
            -{product.discount}%
          </span>
        )}
      </div>

      <div className="p-4">
        <p className="font-bold text-sm text-secondary truncate">
          {product.name}
        </p>

        <p className="text-xs text-gray-400 mt-1 line-clamp-2">
          {product.description}
        </p>

        <div className="flex items-center gap-2 mt-2">
          <p className="text-sm font-extrabold text-secondary">
            ${discountedPrice.toFixed(2)}
          </p>

          {product.discount > 0 && (
            <p className="text-xs text-gray-400 line-through">
              ${product.price.toFixed(2)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function NewProductForm({
  onCreated,
}: {
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [discount, setDiscount] = useState("0");
  const [imageUrl, setImageUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !price) return;

    setSaving(true);

    // Create product
    const { data: productData, error: productError } =
      await supabase
        .from("product_catalog")
        .insert({
          name: name.trim(),
          description: description.trim(),
          image_url: imageUrl.trim() || null,
          is_active: true,
        })
        .select()
        .single();

    if (productError || !productData) {
      console.error(productError);
      setSaving(false);
      return;
    }

    // Create pricing
    const { error: pricingError } = await supabase
      .from("product_pricing")
      .insert({
        product_id: productData.id,
        price: parseFloat(price),
        discount: parseFloat(discount || "0"),
      });

    if (pricingError) {
      console.error(pricingError);
      setSaving(false);
      return;
    }

    setSuccess(true);

    setName("");
    setDescription("");
    setPrice("");
    setDiscount("0");
    setImageUrl("");

    onCreated();

    setTimeout(() => setSuccess(false), 3000);

    setSaving(false);
  };

  return (
    <div className="mx-auto">
      <div className="rounded-2xl border border-[var(--color-container-border)] bg-white overflow-hidden">
        <div className="bg-secondary px-6 py-5">
          <p className="text-white/60 text-xs uppercase tracking-widest font-semibold">
            Addition to the shop
          </p>

          <h2 className="text-2xl font-extrabold text-white pt-1">
            New Product
          </h2>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1 block">
              Product Name *
            </label>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Warriors City Edition Jersey"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-secondary outline-none focus:border-secondary transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1 block">
              Description
            </label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the product..."
              rows={4}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-secondary outline-none focus:border-secondary transition-colors resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1 block">
              Image URL
            </label>

            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-secondary outline-none focus:border-secondary transition-colors"
            />

            {imageUrl && (
              <img
                src={imageUrl}
                alt="Preview"
                className="mt-2 h-32 w-32 object-cover rounded-xl border border-gray-200"
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1 block">
                Price (USD) *
              </label>

              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-secondary outline-none focus:border-secondary transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1 block">
                Discount (%)
              </label>

              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                placeholder="0"
                min="0"
                max="100"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-secondary outline-none focus:border-secondary transition-colors"
              />
            </div>
          </div>

          {success && (
            <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm font-semibold text-green-600">
              Product created successfully!
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={saving || !name.trim() || !price}
            className="w-full py-3 rounded-xl bg-secondary text-white font-bold text-sm hover:bg-secondary/90 disabled:opacity-50 transition-colors"
          >
            {saving ? "Creating..." : "Create Product"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminShop() {
  const { user, loading: profileLoading } = useProfile();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] =
    useState<Tab>("visible");

  const [products, setProducts] = useState<Product[]>(
    []
  );

  const [loading, setLoading] = useState(true);

  const [editingProduct, setEditingProduct] =
    useState<Product | null>(null);

  const [deleteTarget, setDeleteTarget] =
    useState<Product | null>(null);

  // Redirect non-admins
  useEffect(() => {
    if (!profileLoading && user?.role !== "admin") {
      navigate("/");
    }
  }, [user, profileLoading, navigate]);

  const fetchProducts = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("product_catalog")
      .select(`
        id,
        name,
        description,
        image_url,
        is_active,
        product_pricing (
          id,
          price,
          discount,
          created_at
        )
      `)
      .order("id", { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    const mappedProducts: Product[] = (data ?? []).map(
      (product: any) => {
        const pricing =
          product.product_pricing?.sort(
            (a: any, b: any) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          )[0];

        return {
          id: product.id,
          name: product.name,
          description: product.description,
          image_url: product.image_url,
          is_active: product.is_active,
          price: pricing?.price ?? 0,
          discount: pricing?.discount ?? 0,
        };
      }
    );

    setProducts(mappedProducts);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleToggle = async (product: Product) => {
    await supabase
      .from("product_catalog")
      .update({
        is_active: !product.is_active,
      })
      .eq("id", product.id);

    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id
          ? {
              ...p,
              is_active: !product.is_active,
            }
          : p
      )
    );
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    await supabase
      .from("product_catalog")
      .delete()
      .eq("id", deleteTarget.id);

    setProducts((prev) =>
      prev.filter((p) => p.id !== deleteTarget.id)
    );

    setDeleteTarget(null);
  };

  const handleEdit = async (
    updated: Partial<Product>
  ) => {
    if (!editingProduct) return;

    const {
      name,
      description,
      image_url,
      is_active,
      price,
      discount,
    } = updated;

    // Update catalog
    const { error: catalogError } = await supabase
      .from("product_catalog")
      .update({
        name,
        description,
        image_url,
        is_active,
      })
      .eq("id", editingProduct.id);

    if (catalogError) {
      console.error(catalogError);
      return;
    }

    // Insert new pricing row
    if (
      price !== undefined ||
      discount !== undefined
    ) {
      const { error: pricingError } = await supabase
        .from("product_pricing")
        .insert({
          product_id: editingProduct.id,
          price:
            price ?? editingProduct.price,
          discount:
            discount ??
            editingProduct.discount,
        });

      if (pricingError) {
        console.error(pricingError);
        return;
      }
    }

    setProducts((prev) =>
      prev.map((p) =>
        p.id === editingProduct.id
          ? {
              ...p,
              ...updated,
            }
          : p
      )
    );
  };

  const activeProducts = products.filter(
    (p) => p.is_active
  );

  const disabledProducts = products.filter(
    (p) => !p.is_active
  );

  if (profileLoading) return null;

  if (user?.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-[var(--color-background)] font-[family-name:var(--font-lato)]">
      <main className="w-full px-8 pb-10 pt-5 lg:px-8">
        {/* Header */}
        <section className="rounded-2xl bg-secondary overflow-hidden mb-5">
          <div className="px-8 py-6">
            <p className="text-white/60 text-xs uppercase tracking-widest font-semibold">
              Admin Panel
            </p>

            <h1 className="text-3xl font-extrabold text-white">
              Shop Manager
            </h1>

            <p className="text-[var(--color-primary)] font-semibold mt-2 text-sm">
              {activeProducts.length} visible ·{" "}
              {disabledProducts.length} disabled
            </p>
          </div>

          <div className="flex border-t border-white/10">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold uppercase tracking-wide transition-colors ${
                  activeTab === tab.id
                    ? "bg-[var(--color-primary)] text-secondary"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-10 w-10 rounded-full border-4 border-secondary border-t-transparent animate-spin" />
          </div>
        )}

        {/* Visible Products */}
        {!loading && activeTab === "visible" && (
          <div>
            <h2 className="text-2xl font-extrabold text-secondary pb-6">
                Products Accesible to Users
            </h2>
            {activeProducts.length === 0 ? (
              <p className="text-center text-gray-400 py-10">
                No visible products.
              </p>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {activeProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onEdit={() =>
                      setEditingProduct(product)
                    }
                    onToggle={() =>
                      handleToggle(product)
                    }
                    onDelete={() =>
                      setDeleteTarget(product)
                    }
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Disabled Products */}
        {!loading && activeTab === "disabled" && (
          <div>
            <h2 className="text-2xl font-extrabold text-secondary pb-6">
                Products Hidden to Users
            </h2>
            {disabledProducts.length === 0 ? (
              <p className="text-center text-gray-400 py-10">
                No disabled products.
              </p>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {disabledProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onEdit={() =>
                      setEditingProduct(product)
                    }
                    onToggle={() =>
                      handleToggle(product)
                    }
                    onDelete={() =>
                      setDeleteTarget(product)
                    }
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* New Product */}
        {!loading && activeTab === "new" && (
          <NewProductForm onCreated={fetchProducts} />
        )}
      </main>

      {/* Edit Modal */}
      {editingProduct && (
        <EditModal
          product={editingProduct}
          onClose={() =>
            setEditingProduct(null)
          }
          onSave={handleEdit}
        />
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete product?"
        message={`"${deleteTarget?.name}" will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        onConfirm={handleDelete}
        onCancel={() =>
          setDeleteTarget(null)
        }
      />
    </div>
  );
}