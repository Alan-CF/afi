import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useProfile } from "../../hooks/useProfile";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { useAdminShop, type AdminProduct } from "../../hooks/useAdminShop";
import { useCategories, useCollections, usePlayers, type Category, type Collection, type Player } from "../../hooks/useShopGroups";
import { supabase } from "../../lib/supabaseClient";
import {
  PencilIcon,
  EyeIcon,
  EyeSlashIcon,
  TrashIcon,
  PlusIcon,
  ShoppingCartIcon,
  ArchiveBoxXMarkIcon,
  XMarkIcon,
  PhotoIcon,
  LinkIcon,
  ArrowUpTrayIcon,
} from "@heroicons/react/24/solid";

type Tab = "visible" | "disabled" | "new";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "visible", label: "Visible Products", icon: <ShoppingCartIcon className="h-4 w-4" /> },
  { id: "disabled", label: "Disabled", icon: <ArchiveBoxXMarkIcon className="h-4 w-4" /> },
  { id: "new", label: "Add Product", icon: <PlusIcon className="h-4 w-4" /> },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function recordToEntries(obj: Record<string, unknown>): { key: string; value: string }[] {
  return Object.entries(obj).map(([key, value]) => ({ key, value: String(value ?? "") }));
}

function entriesToRecord(entries: { key: string; value: string }[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const { key, value } of entries) {
    const trimmedKey = key.trim();
    if (trimmedKey) result[trimmedKey] = value.trim();
  }
  return result;
}

async function uploadProductImage(file: File, productId: number): Promise<string | null> {
  const ext = file.name.split(".").pop();
  const path = `products/${productId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("products").upload(path, file, { upsert: true });
  if (error) { console.error(error); return null; }
  const { data } = supabase.storage.from("products").getPublicUrl(path);
  return data.publicUrl;
}

// ── Skeleton Card ──────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-[var(--color-container-border)] overflow-hidden bg-white animate-pulse">
      <div className="w-full h-48 bg-gray-200" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-gray-200 rounded-full w-3/4" />
        <div className="h-3 bg-gray-100 rounded-full w-full" />
        <div className="h-3 bg-gray-100 rounded-full w-2/3" />
        <div className="h-4 bg-gray-200 rounded-full w-1/3 mt-2" />
      </div>
    </div>
  );
}

// ── Image Input ────────────────────────────────────────────────────────────────

function ImageInput({
  value,
  onChange,
  productId,
  compact = false,
}: {
  value: string;
  onChange: (url: string) => void;
  productId?: number;
  compact?: boolean;
}) {
  const [mode, setMode] = useState<"url" | "upload">("url");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const tempId = productId ?? 0;
    setUploading(true);
    setUploadError(null);
    const url = await uploadProductImage(file, tempId);
    setUploading(false);
    if (url) {
      onChange(url);
    } else {
      setUploadError("Upload failed. Try again.");
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const py = compact ? "py-2" : "py-3";

  return (
    <div className="space-y-3">
      <label className="text-xs font-bold uppercase tracking-widest text-gray-400 block">Image</label>

      <div className="inline-flex rounded-xl border border-gray-200 overflow-hidden">
        <button
          type="button"
          onClick={() => setMode("url")}
          className={`flex items-center gap-1.5 px-3 ${py} text-xs font-bold transition-colors ${
            mode === "url" ? "bg-secondary text-white" : "text-gray-400 hover:text-secondary"
          }`}
        >
          <LinkIcon className="h-3.5 w-3.5" />
          URL
        </button>
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={`flex items-center gap-1.5 px-3 ${py} text-xs font-bold transition-colors ${
            mode === "upload" ? "bg-secondary text-white" : "text-gray-400 hover:text-secondary"
          }`}
        >
          <ArrowUpTrayIcon className="h-3.5 w-3.5" />
          Upload
        </button>
      </div>

      {mode === "url" ? (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
          className={`w-full rounded-xl border border-gray-200 px-4 ${py} text-sm text-secondary outline-none focus:border-secondary transition-colors`}
        />
      ) : (
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFile}
            className="hidden"
            id="product-image-upload"
          />
          <label
            htmlFor="product-image-upload"
            className={`flex items-center justify-center gap-2 w-full rounded-xl border-2 border-dashed border-gray-200 px-4 ${py} text-sm font-semibold text-gray-400 hover:border-secondary hover:text-secondary cursor-pointer transition-colors ${uploading ? "opacity-50 pointer-events-none" : ""}`}
          >
            {uploading ? (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-secondary border-t-transparent animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <PhotoIcon className="h-4 w-4" />
                Choose image from device
              </>
            )}
          </label>
          {uploadError && <p className="text-xs text-red-500 mt-1">{uploadError}</p>}
        </div>
      )}

      {value && (
        <div className="relative inline-block">
          <img
            src={value}
            alt="Preview"
            className={`object-cover rounded-xl border border-gray-200 ${compact ? "h-24 w-24" : "h-32 w-32"}`}
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow"
          >
            <XMarkIcon className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Dynamic Details ────────────────────────────────────────────────────────────

function DynamicDetails({
  entries,
  onChange,
}: {
  entries: { key: string; value: string }[];
  onChange: (entries: { key: string; value: string }[]) => void;
}) {
  const addEntry = () => onChange([...entries, { key: "", value: "" }]);
  const removeEntry = (i: number) => onChange(entries.filter((_, idx) => idx !== i));
  const updateEntry = (i: number, field: "key" | "value", val: string) =>
    onChange(entries.map((e, idx) => (idx === i ? { ...e, [field]: val } : e)));

  return (
    <div className="space-y-3">
      {entries.length === 0 && (
        <p className="text-xs text-gray-400 italic">No details added yet. Click below to add one.</p>
      )}
      {entries.map((entry, i) => (
        <div key={i} className="flex gap-2 items-center">
          <input
            value={entry.key}
            onChange={(e) => updateEntry(i, "key", e.target.value)}
            placeholder="Field (e.g. brand)"
            className="flex-1 rounded-xl border border-gray-200 px-4 py-2 text-sm text-secondary outline-none focus:border-secondary transition-colors"
          />
          <input
            value={entry.value}
            onChange={(e) => updateEntry(i, "value", e.target.value)}
            placeholder="Value (e.g. Nike)"
            className="flex-1 rounded-xl border border-gray-200 px-4 py-2 text-sm text-secondary outline-none focus:border-secondary transition-colors"
          />
          <button
            type="button"
            onClick={() => removeEntry(i)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-500 transition-colors flex-shrink-0"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addEntry}
        className="flex items-center gap-2 text-sm font-bold text-secondary border border-dashed border-secondary/40 rounded-xl px-4 py-2 hover:bg-secondary/5 transition-colors w-full justify-center"
      >
        <PlusIcon className="h-4 w-4" />
        Add Detail
      </button>
    </div>
  );
}

// ── Selection Buttons ──────────────────────────────────────────────────────────

function SelectionButtons<T extends { name: string; image_url: string }>({
  label, items, selectedName, onSelect,
}: {
  label: string; items: T[]; selectedName: string; onSelect: (item: T) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400">{label}</p>
      {items.length === 0 ? (
        <p className="text-sm text-gray-400">Loading options...</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => {
            const isSelected = item.name === selectedName;
            return (
              <button
                key={item.name}
                type="button"
                onClick={() => onSelect(item)}
                className={`flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm transition-all ${
                  isSelected
                    ? "border-secondary bg-secondary text-white"
                    : "border-gray-200 bg-white text-secondary hover:border-secondary hover:bg-secondary/10"
                }`}
              >
                {item.image_url && (
                  <img src={item.image_url} alt={item.name} className="h-6 w-6 rounded-full object-cover" />
                )}
                <span>{item.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Player Selection (opcional, permite deseleccionar) ─────────────────────────

function PlayerSelection({
  players,
  selectedName,
  onSelect,
  onClear,
}: {
  players: Player[];
  selectedName: string;
  onSelect: (player: Player) => void;
  onClear: () => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Choose a player (optional)</p>
      {players.length === 0 ? (
        <p className="text-sm text-gray-400">Loading players...</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {players.map((item) => {
            const isSelected = item.name === selectedName;
            return (
              <button
                key={item.name}
                type="button"
                onClick={() => isSelected ? onClear() : onSelect(item)}
                className={`flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm transition-all ${
                  isSelected
                    ? "border-secondary bg-secondary text-white"
                    : "border-gray-200 bg-white text-secondary hover:border-secondary hover:bg-secondary/10"
                }`}
              >
                {item.image_url && (
                  <img src={item.image_url} alt={item.name} className="h-6 w-6 rounded-full object-cover" />
                )}
                <span>{item.name}</span>
                {isSelected && <XMarkIcon className="h-3 w-3 ml-1 opacity-70" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Edit Modal ─────────────────────────────────────────────────────────────────

function EditModal({
  product, categories, collections, players, onClose, onSave,
}: {
  product: AdminProduct;
  categories: Category[];
  collections: Collection[];
  players: Player[];
  onClose: () => void;
  onSave: (updates: Partial<AdminProduct>) => Promise<void>;
}) {
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description);
  const [imageUrl, setImageUrl] = useState(product.image_url ?? "");
  const [price, setPrice] = useState(product.price.toString());
  const [discount, setDiscount] = useState(product.discount.toString());
  const [detailEntries, setDetailEntries] = useState<{ key: string; value: string }[]>(
    recordToEntries(product.product_details as Record<string, unknown>)
  );
  const md = product.meta_data as any;
  const [metaCategory, setMetaCategory] = useState(md?.category?.name ?? "");
  const [metaCategoryImg, setMetaCategoryImg] = useState(md?.category?.image_url ?? "");
  const [metaCollection, setMetaCollection] = useState(md?.collection?.name ?? "");
  const [metaCollectionImg, setMetaCollectionImg] = useState(md?.collection?.image_url ?? "");
  const [metaPlayer, setMetaPlayer] = useState(md?.player?.name ?? "");
  const [metaPlayerImg, setMetaPlayerImg] = useState(md?.player?.image_url ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      name,
      description,
      image_url: imageUrl || null,
      price: parseFloat(price),
      discount: parseFloat(discount || "0"),
      product_details: entriesToRecord(detailEntries),
      meta_data: {
        category: metaCategory ? { name: metaCategory, image_url: metaCategoryImg || null } : null,
        collection: metaCollection ? { name: metaCollection, image_url: metaCollectionImg || null } : null,
        player: metaPlayer ? { name: metaPlayer, image_url: metaPlayerImg || null } : null,
      },
    });
    setSaving(false);
    onClose();
  };

  const field = (label: string, value: string, onChange: (v: string) => void, placeholder = "") => (
    <div>
      <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1 block">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm text-secondary outline-none focus:border-secondary transition-colors" />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto py-8">
      <div className="w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-secondary px-6 py-4">
          <h2 className="text-lg font-extrabold text-white">Edit Product</h2>
          <p className="text-white/60 text-xs mt-0.5">{product.name}</p>
        </div>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-secondary border-b border-gray-100 pb-2">Basic Info</p>
          {field("Name", name, setName, "Product name")}
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1 block">Description</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the product..."
              className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm text-secondary outline-none focus:border-secondary" />
          </div>

          <ImageInput value={imageUrl} onChange={setImageUrl} productId={product.id} compact />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1 block">Price ($)</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm text-secondary outline-none focus:border-secondary" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1 block">Discount (%)</label>
              <input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm text-secondary outline-none focus:border-secondary" />
            </div>
          </div>

          <p className="text-xs font-bold uppercase tracking-widest text-secondary border-b border-gray-100 pb-2 pt-2">Product Details</p>
          <DynamicDetails entries={detailEntries} onChange={setDetailEntries} />

          <p className="text-xs font-bold uppercase tracking-widest text-secondary border-b border-gray-100 pb-2 pt-2">Meta Data</p>
          <div className="grid gap-4">
            <SelectionButtons
              label="Choose a category"
              items={categories}
              selectedName={metaCategory}
              onSelect={(item) => { setMetaCategory(item.name); setMetaCategoryImg(item.image_url ?? ""); }}
            />
            <SelectionButtons
              label="Choose a collection"
              items={collections}
              selectedName={metaCollection}
              onSelect={(item) => { setMetaCollection(item.name); setMetaCollectionImg(item.image_url ?? ""); }}
            />
            <PlayerSelection
              players={players}
              selectedName={metaPlayer}
              onSelect={(item) => { setMetaPlayer(item.name); setMetaPlayerImg(item.image_url ?? ""); }}
              onClear={() => { setMetaPlayer(""); setMetaPlayerImg(""); }}
            />
          </div>
        </div>

        <div className="h-px bg-gray-100" />
        <div className="flex gap-3 px-6 py-4">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-400 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2 rounded-xl bg-secondary text-sm font-bold text-white hover:bg-secondary/90 disabled:opacity-50">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Product Card ───────────────────────────────────────────────────────────────

function ProductCard({ product, onEdit, onToggle, onDelete }: {
  product: AdminProduct; onEdit: () => void; onToggle: () => void; onDelete: () => void;
}) {
  const discountedPrice = product.discount > 0
    ? product.price * (1 - product.discount / 100)
    : product.price;

  return (
    <div className={`rounded-2xl border border-[var(--color-container-border)] overflow-hidden bg-white ${!product.is_active ? "opacity-80" : ""}`}>
      <div className="relative">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name}
            className={`w-full h-48 object-cover ${!product.is_active ? "grayscale" : ""}`} />
        ) : (
          <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
            <span className="text-gray-400 text-sm">No image</span>
          </div>
        )}
        <div className="absolute top-2 right-2 flex gap-1">
          <button onClick={onEdit} className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow text-secondary hover:bg-gray-50">
            <PencilIcon className="h-4 w-4" />
          </button>
          <button onClick={onToggle} className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow text-secondary hover:bg-gray-50">
            {product.is_active ? <EyeIcon className="h-4 w-4" /> : <EyeSlashIcon className="h-4 w-4 text-gray-400" />}
          </button>
          <button onClick={onDelete} className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow text-red-500 hover:bg-red-50">
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
        <p className="font-bold text-sm text-secondary truncate">{product.name}</p>
        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{product.description}</p>
        <div className="flex items-center gap-2 mt-2">
          <p className="text-sm font-extrabold text-secondary">${discountedPrice.toFixed(2)}</p>
          {product.discount > 0 && (
            <p className="text-xs text-gray-400 line-through">${product.price.toFixed(2)}</p>
          )}
        </div>
        {(product.product_details as any)?.category && (
          <span className="mt-2 inline-block text-[10px] uppercase tracking-wide font-bold text-white bg-secondary/70 px-2 py-0.5 rounded-full">
            {(product.product_details as any).category}
          </span>
        )}
      </div>
    </div>
  );
}

// ── New Product Form ───────────────────────────────────────────────────────────

function NewProductForm({ onCreated, categories, collections, players }: {
  onCreated: () => void; categories: Category[]; collections: Collection[]; players: Player[];
}) {
  const { createProduct } = useAdminShop();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [price, setPrice] = useState("");
  const [discount, setDiscount] = useState("0");
  const [detailEntries, setDetailEntries] = useState<{ key: string; value: string }[]>([]);
  const [metaCategory, setMetaCategory] = useState("");
  const [metaCategoryImg, setMetaCategoryImg] = useState("");
  const [metaCollection, setMetaCollection] = useState("");
  const [metaCollectionImg, setMetaCollectionImg] = useState("");
  const [metaPlayer, setMetaPlayer] = useState("");
  const [metaPlayerImg, setMetaPlayerImg] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [err, setErr] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !price || !metaCategory || !metaCollection) { setErr(true); return; }
    setSaving(true);
    setErr(false);

    const ok = await createProduct({
      name: name.trim(),
      description: description.trim(),
      image_url: imageUrl.trim() || null,
      price: parseFloat(price),
      discount: parseFloat(discount || "0"),
      product_details: entriesToRecord(detailEntries),
      meta_data: {
        category: metaCategory ? { name: metaCategory, image_url: metaCategoryImg || null } : null,
        collection: metaCollection ? { name: metaCollection, image_url: metaCollectionImg || null } : null,
        player: metaPlayer ? { name: metaPlayer, image_url: metaPlayerImg || null } : null,
      },
    });

    if (ok) {
      setSuccess(true);
      setName(""); setDescription(""); setImageUrl(""); setPrice(""); setDiscount("0");
      setDetailEntries([]);
      setMetaCategory(""); setMetaCategoryImg("");
      setMetaCollection(""); setMetaCollectionImg("");
      setMetaPlayer(""); setMetaPlayerImg("");
      onCreated();
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setErr(true);
    }
    setSaving(false);
  };

  const field = (label: string, value: string, onChange: (v: string) => void, placeholder = "", type = "text") => (
    <div>
      <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1 block">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-secondary outline-none focus:border-secondary transition-colors" />
    </div>
  );

  return (
    <div className="mx-auto">
      <div className="rounded-2xl border border-[var(--color-container-border)] bg-white overflow-hidden">
        <div className="bg-secondary px-6 py-5">
          <p className="text-white/60 text-xs uppercase tracking-widest font-semibold">Addition to the shop</p>
          <h2 className="text-2xl font-extrabold text-white pt-1">New Product</h2>
        </div>

        <div className="p-6 space-y-5">
          <p className="text-xs font-bold uppercase tracking-widest text-secondary border-b border-gray-100 pb-2">Basic Info</p>
          {field("Product Name *", name, setName, "e.g. Warriors City Edition Jersey")}
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1 block">Description</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the product..."
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-secondary outline-none focus:border-secondary" />
          </div>

          <ImageInput value={imageUrl} onChange={setImageUrl} />

          <div className="grid grid-cols-2 gap-4">
            {field("Price (USD) *", price, setPrice, "0.00", "number")}
            {field("Discount (%)", discount, setDiscount, "0", "number")}
          </div>

          <p className="text-xs font-bold uppercase tracking-widest text-secondary border-b border-gray-100 pb-2 pt-2">Product Details</p>
          <DynamicDetails entries={detailEntries} onChange={setDetailEntries} />

          <p className="text-xs font-bold uppercase tracking-widest text-secondary border-b border-gray-100 pb-2 pt-2">Meta Data</p>
          <div className="grid gap-4">
            <SelectionButtons
              label="Choose a category *"
              items={categories}
              selectedName={metaCategory}
              onSelect={(item) => { setMetaCategory(item.name); setMetaCategoryImg(item.image_url ?? ""); }}
            />
            <SelectionButtons
              label="Choose a collection *"
              items={collections}
              selectedName={metaCollection}
              onSelect={(item) => { setMetaCollection(item.name); setMetaCollectionImg(item.image_url ?? ""); }}
            />
            <PlayerSelection
              players={players}
              selectedName={metaPlayer}
              onSelect={(item) => { setMetaPlayer(item.name); setMetaPlayerImg(item.image_url ?? ""); }}
              onClear={() => { setMetaPlayer(""); setMetaPlayerImg(""); }}
            />
          </div>

          {success && (
            <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm font-semibold text-green-600">
              Product created successfully!
            </div>
          )}
          {err && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm font-semibold text-red-600">
              Please fill in all required fields (Name, Price, Category, Collection).
            </div>
          )}

          <button onClick={handleSubmit} disabled={saving || !name.trim() || !price || !metaCategory || !metaCollection}
            className="w-full py-3 rounded-xl bg-secondary text-white font-bold text-sm hover:bg-secondary/90 disabled:opacity-50 transition-colors">
            {saving ? "Creating..." : "Create Product"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function AdminShop() {
  const { user, loading: profileLoading } = useProfile();
  const navigate = useNavigate();
  const { products, loading, fetchProducts, toggleProduct, deleteProduct, updateProduct } = useAdminShop();
  const { categories } = useCategories();
  const { collections } = useCollections();
  const { players } = usePlayers();

  const [activeTab, setActiveTab] = useState<Tab>("visible");
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminProduct | null>(null);

  useEffect(() => {
    if (!profileLoading && user?.role !== "admin") navigate("/");
  }, [user, profileLoading, navigate]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteProduct(deleteTarget.id);
    setDeleteTarget(null);
  };

  const handleEdit = async (updates: Partial<AdminProduct>) => {
    if (!editingProduct) return;
    await updateProduct(editingProduct, updates as any);
  };

  const activeProducts = products.filter((p) => p.is_active);
  const disabledProducts = products.filter((p) => !p.is_active);

  if (!profileLoading && user?.role !== "admin") {
    navigate("/");
    return null;
  }

  const SKELETON_COUNT = 8;

  return (
    <div className="min-h-screen bg-[var(--color-background)] font-[family-name:var(--font-lato)]">
      <main className="w-full px-8 pb-10 pt-5 lg:px-8">

        <section className="rounded-2xl bg-secondary overflow-hidden mb-5">
          <div className="px-8 py-6">
            <p className="text-white/60 text-xs uppercase tracking-widest font-semibold">Admin Panel</p>
            <h1 className="text-3xl font-extrabold text-white">Shop Manager</h1>
            <p className="text-[var(--color-primary)] font-semibold mt-2 text-sm">
              {loading ? "Loading..." : `${activeProducts.length} visible · ${disabledProducts.length} disabled`}
            </p>
          </div>

          <div className="flex border-t border-white/10">
            {TABS.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold uppercase tracking-wide transition-colors ${
                  activeTab === tab.id
                    ? "bg-[var(--color-primary)] text-secondary"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}>
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        {activeTab === "visible" && (
          <div>
            <h2 className="text-2xl font-extrabold text-secondary pb-6">Products Accessible to Users</h2>
            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: SKELETON_COUNT }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : activeProducts.length === 0 ? (
              <p className="text-center text-gray-400 py-10">No visible products.</p>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {activeProducts.map((product) => (
                  <ProductCard key={product.id} product={product}
                    onEdit={() => setEditingProduct(product)}
                    onToggle={() => toggleProduct(product)}
                    onDelete={() => setDeleteTarget(product)} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "disabled" && (
          <div>
            <h2 className="text-2xl font-extrabold text-secondary pb-6">Products Hidden to Users</h2>
            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: SKELETON_COUNT }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : disabledProducts.length === 0 ? (
              <p className="text-center text-gray-400 py-10">No disabled products.</p>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {disabledProducts.map((product) => (
                  <ProductCard key={product.id} product={product}
                    onEdit={() => setEditingProduct(product)}
                    onToggle={() => toggleProduct(product)}
                    onDelete={() => setDeleteTarget(product)} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "new" && (
          <NewProductForm onCreated={fetchProducts} categories={categories} collections={collections} players={players} />
        )}

      </main>

      {editingProduct && (
        <EditModal product={editingProduct} categories={categories} collections={collections} players={players}
          onClose={() => setEditingProduct(null)} onSave={handleEdit} />
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete product?"
        message={`"${deleteTarget?.name}" will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete" cancelLabel="Cancel" destructive
        onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}