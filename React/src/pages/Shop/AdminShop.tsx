import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useProfile } from "../../hooks/useProfile";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { useAdminShop, type AdminProduct } from "../../hooks/useAdminShop";
import { useCategories, useCollections, usePlayers, type Category, type Collection, type Player } from "../../hooks/useShopGroups";
import { supabase } from "../../lib/supabaseClient";
import Filters from "../../components/layout/Shop/Filters";
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
  AdjustmentsHorizontalIcon,
  ViewColumnsIcon,
  Squares2X2Icon,
  TableCellsIcon,
  ListBulletIcon,
  QueueListIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/solid";
import AuditLogs from "../../components/layout/Shop/AuditLogs";
import ErrorBoundary from "../../components/ui/ErrorBoundary";

type Tab = "visible" | "disabled" | "new" | "audit";

type ViewMode = "large" | "medium" | "small" | "list" | "compact";

const VIEW_MODES: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
  { id: "large", label: "Large", icon: <ViewColumnsIcon className="h-5 w-5" /> },
  { id: "medium", label: "Medium", icon: <Squares2X2Icon className="h-5 w-5" /> },
  { id: "small", label: "Small", icon: <TableCellsIcon className="h-5 w-5" /> },
  { id: "list", label: "List", icon: <ListBulletIcon className="h-5 w-5" /> },
  { id: "compact", label: "Compact", icon: <QueueListIcon className="h-5 w-5" /> },
];

type CardView = "large" | "medium" | "small";

const GRID_CLASSES: Record<CardView, string> = {
  large: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4",
  medium: "grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4",
  small: "grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3",
};

const VIEW_STORAGE_KEY = "adminShopViewMode";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "visible", label: "Visible Products", icon: <ShoppingCartIcon className="h-4 w-4" /> },
  { id: "disabled", label: "Disabled", icon: <ArchiveBoxXMarkIcon className="h-4 w-4" /> },
  { id: "new", label: "Add Product", icon: <PlusIcon className="h-4 w-4" /> },
  { id: "audit", label: "Audit Logs", icon: <ClipboardDocumentListIcon className="h-4 w-4" /> },
];

//  Helpers 

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

//  Skeleton Card 

const IMG_HEIGHT: Record<CardView, string> = {
  large: "h-56",
  medium: "h-44",
  small: "h-28",
};

function SkeletonCard({ view = "medium" }: { view?: CardView }) {
  return (
    <div className="rounded-2xl border border-[var(--color-container-border)] overflow-hidden bg-white animate-pulse">
      <div className={`w-full ${IMG_HEIGHT[view]} bg-gray-200`} />
      <div className={`${view === "small" ? "p-2 space-y-1.5" : "p-4 space-y-2"}`}>
        <div className="h-4 bg-gray-200 rounded-full w-3/4" />
        {view !== "small" && <div className="h-3 bg-gray-100 rounded-full w-full" />}
        {view === "large" && <div className="h-3 bg-gray-100 rounded-full w-2/3" />}
        <div className="h-4 bg-gray-200 rounded-full w-1/3 mt-2" />
      </div>
    </div>
  );
}

//  Image Input 

function ImageInput({
  value, onChange, productId, compact = false,
}: {
  value: string; onChange: (url: string) => void; productId?: number; compact?: boolean;
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
    if (url) { onChange(url); } else { setUploadError("Upload failed. Try again."); }
    if (fileRef.current) fileRef.current.value = "";
  };

  const py = compact ? "py-2" : "py-3";

  return (
    <div className="space-y-3">
      <label className="text-base font-bold uppercase tracking-widest text-secondary block">Image</label>
      <div className="inline-flex rounded-xl border border-gray-200 overflow-hidden">
        <button type="button" onClick={() => setMode("url")}
          className={`flex items-center gap-1.5 px-3 ${py} text-base font-bold transition-colors ${mode === "url" ? "bg-secondary text-white" : "text-secondary hover:text-secondary"}`}>
          <LinkIcon className="h-3.5 w-3.5" /> URL
        </button>
        <button type="button" onClick={() => setMode("upload")}
          className={`flex items-center gap-1.5 px-3 ${py} text-base font-bold transition-colors ${mode === "upload" ? "bg-secondary text-white" : "text-secondary hover:text-secondary"}`}>
          <ArrowUpTrayIcon className="h-3.5 w-3.5" /> Upload
        </button>
      </div>

      {mode === "url" ? (
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://..."
          className={`w-full rounded-xl border border-gray-200 px-4 ${py} text-base text-secondary outline-none focus:border-secondary transition-colors`} />
      ) : (
        <div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} className="hidden" id="product-image-upload" />
          <label htmlFor="product-image-upload"
            className={`flex items-center justify-center gap-2 w-full rounded-xl border-2 border-dashed border-gray-200 px-4 ${py} text-base font-semibold text-secondary hover:border-secondary hover:text-secondary cursor-pointer transition-colors ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
            {uploading ? (<><div className="h-4 w-4 rounded-full border-2 border-secondary border-t-transparent animate-spin" />Uploading...</>) : (<><PhotoIcon className="h-4 w-4" />Choose image from computer</>)}
          </label>
          {uploadError && <p className="text-base text-red-500 mt-1">{uploadError}</p>}
        </div>
      )}

      {value && (
        <div className="relative inline-block">
          <img src={value} alt="Preview" className={`object-cover rounded-xl border border-gray-200 ${compact ? "h-24 w-24" : "h-32 w-32"}`} />
          <button type="button" onClick={() => onChange("")}
            className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow">
            <XMarkIcon className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}

//  Dynamic Details 

function DynamicDetails({ entries, onChange }: {
  entries: { key: string; value: string }[];
  onChange: (entries: { key: string; value: string }[]) => void;
}) {
  const addEntry = () => onChange([...entries, { key: "", value: "" }]);
  const removeEntry = (i: number) => onChange(entries.filter((_, idx) => idx !== i));
  const updateEntry = (i: number, field: "key" | "value", val: string) =>
    onChange(entries.map((e, idx) => (idx === i ? { ...e, [field]: val } : e)));

  return (
    <div className="space-y-3">
      {entries.length === 0 && <p className="text-base text-secondary italic">No details added yet. Click below to add one.</p>}
      {entries.map((entry, i) => (
        <div key={i} className="flex gap-2 items-center">
          <input value={entry.key} onChange={(e) => updateEntry(i, "key", e.target.value)} placeholder="Field (e.g. brand)"
            className="flex-1 rounded-xl border border-gray-200 px-4 py-2 text-base text-secondary outline-none focus:border-secondary transition-colors" />
          <input value={entry.value} onChange={(e) => updateEntry(i, "value", e.target.value)} placeholder="Value (e.g. Nike)"
            className="flex-1 rounded-xl border border-gray-200 px-4 py-2 text-base text-secondary outline-none focus:border-secondary transition-colors" />
          <button type="button" onClick={() => removeEntry(i)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-secondary hover:border-red-300 hover:text-red-500 transition-colors flex-shrink-0">
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button type="button" onClick={addEntry}
        className="flex items-center gap-2 text-base font-bold text-secondary border border-dashed border-secondary/40 rounded-xl px-4 py-2 hover:bg-secondary/5 transition-colors w-full justify-center">
        <PlusIcon className="h-4 w-4" /> Add Detail
      </button>
    </div>
  );
}

//  Selection Buttons 

function SelectionButtons<T extends { name: string; image_url: string }>({
  label, items, selectedName, onSelect, invalid = false,
}: {
  label: string; items: T[]; selectedName: string; onSelect: (item: T) => void; invalid?: boolean;
}) {
  return (
    <div className="space-y-3">
      <p className={`text-base font-bold uppercase tracking-widest ${invalid ? "text-red-500" : "text-secondary"}`}>{label}</p>
      {items.length === 0 ? <p className="text-base text-secondary">Loading options...</p> : (
        <div className={`flex flex-wrap gap-2 ${invalid ? "rounded-2xl ring-2 ring-red-300 p-2" : ""}`}>
          {items.filter(Boolean).map((item) => {
            const isSelected = item.name === selectedName;
            return (
              <button key={item.name} type="button" onClick={() => onSelect(item)}
                className={`flex items-center gap-2 rounded-2xl border px-3 py-2 text-base transition-all ${isSelected ? "border-secondary bg-secondary text-white" : "border-gray-200 bg-white text-secondary hover:border-secondary hover:bg-secondary/10"}`}>
                {item.image_url && <img src={item.image_url} alt={item.name} className="h-6 w-6 rounded-full object-cover" />}
                <span>{item.name}</span>
              </button>
            );
          })}
        </div>
      )}
      {invalid && <p className="text-red-500 text-sm font-semibold">Please choose one.</p>}
    </div>
  );
}

//  Player Selection 

function PlayerSelection({ players, selectedName, onSelect, onClear }: {
  players: Player[]; selectedName: string; onSelect: (player: Player) => void; onClear: () => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-base font-bold uppercase tracking-widest text-secondary">Choose one player (optional)</p>
      {players.length === 0 ? <p className="text-base text-secondary">Loading players...</p> : (
        <div className="flex flex-wrap gap-2">
          {players.filter(Boolean).map((item) => {
            const isSelected = item.name === selectedName;
            return (
              <button key={item.name} type="button" onClick={() => isSelected ? onClear() : onSelect(item)}
                className={`flex items-center gap-2 rounded-2xl border px-3 py-2 text-base transition-all ${isSelected ? "border-secondary bg-secondary text-white" : "border-gray-200 bg-white text-secondary hover:border-secondary hover:bg-secondary/10"}`}>
                {item.image_url && <img src={item.image_url} alt={item.name} className="h-6 w-6 rounded-full object-cover" />}
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

//  Edit Modal 

function EditModal({ product, categories, collections, players, onClose, onSave }: {
  product: AdminProduct; categories: Category[]; collections: Collection[]; players: Player[];
  onClose: () => void; onSave: (updates: Partial<AdminProduct>) => Promise<void>;
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
      name, description, image_url: imageUrl || null,
      price: parseFloat(price), discount: parseFloat(discount || "0"),
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
      <label className="text-base font-bold uppercase tracking-widest text-secondary mb-1 block">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-xl border border-gray-200 px-4 py-2 text-base text-secondary outline-none focus:border-secondary transition-colors" />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto py-8">
      <div className="w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-secondary px-6 py-4">
          <h2 className="text-lg font-extrabold text-white">Edit Product</h2>
          <p className="text-white/60 text-base mt-0.5">{product.name}</p>
        </div>
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          <p className="text-base font-bold uppercase tracking-widest text-secondary border-b border-gray-100 pb-2">Basic Info</p>
          {field("Name", name, setName, "Product name")}
          <div>
            <label className="text-base font-bold uppercase tracking-widest text-secondary mb-1 block">Description</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the product..."
              className="w-full rounded-xl border border-gray-200 px-4 py-2 text-base text-secondary outline-none focus:border-secondary" />
          </div>
          <ImageInput value={imageUrl} onChange={setImageUrl} productId={product.id} compact />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-base font-bold uppercase tracking-widest text-secondary mb-1 block">Price ($)</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-2 text-base text-secondary outline-none focus:border-secondary" />
            </div>
            <div>
              <label className="text-base font-bold uppercase tracking-widest text-secondary mb-1 block">Discount (%)</label>
              <input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-2 text-base text-secondary outline-none focus:border-secondary" />
            </div>
          </div>
          <p className="text-base font-bold uppercase tracking-widest text-secondary border-b border-gray-100 pb-2 pt-2">Product Details</p>
          <DynamicDetails entries={detailEntries} onChange={setDetailEntries} />
          <p className="text-base font-bold uppercase tracking-widest text-secondary border-b border-gray-100 pb-2 pt-2">Meta Data</p>
          <div className="grid gap-4">
            <SelectionButtons label="Choose one category" items={categories} selectedName={metaCategory}
              onSelect={(item) => { setMetaCategory(item.name); setMetaCategoryImg(item.image_url ?? ""); }} />
            <SelectionButtons label="Choose one collection" items={collections} selectedName={metaCollection}
              onSelect={(item) => { setMetaCollection(item.name); setMetaCollectionImg(item.image_url ?? ""); }} />
            <PlayerSelection players={players} selectedName={metaPlayer}
              onSelect={(item) => { setMetaPlayer(item.name); setMetaPlayerImg(item.image_url ?? ""); }}
              onClear={() => { setMetaPlayer(""); setMetaPlayerImg(""); }} />
          </div>
        </div>
        <div className="h-px bg-gray-100" />
        <div className="flex gap-3 px-6 py-4">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-gray-200 text-base font-bold text-secondary hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2 rounded-xl bg-secondary text-base font-bold text-white hover:bg-secondary/90 disabled:opacity-50">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

//  Product Card 

function ProductCard({ product, view, onEdit, onToggle, onDelete }: {
  product: AdminProduct; view: CardView;
  onEdit: () => void; onToggle: () => void; onDelete: () => void;
}) {
  const discountedPrice = product.discount > 0
    ? product.price * (1 - product.discount / 100)
    : product.price;

  const small = view === "small";
  const btn = small ? "h-7 w-7" : "h-8 w-8";
  const btnIcon = small ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <div className={`rounded-2xl border border-[var(--color-container-border)] overflow-hidden bg-white ${!product.is_active ? "opacity-80" : ""}`}>
      <div className="relative">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name}
            className={`w-full ${IMG_HEIGHT[view]} object-cover ${!product.is_active ? "grayscale" : ""}`} />
        ) : (
          <div className={`w-full ${IMG_HEIGHT[view]} bg-gray-100 flex items-center justify-center`}>
            <span className="text-secondary text-base">No image</span>
          </div>
        )}
        <div className={`absolute top-2 right-2 flex ${small ? "gap-0.5" : "gap-1"}`}>
          <button onClick={onEdit} className={`flex ${btn} items-center justify-center rounded-full bg-white shadow text-secondary hover:bg-gray-50`}>
            <PencilIcon className={btnIcon} />
          </button>
          <button onClick={onToggle} className={`flex ${btn} items-center justify-center rounded-full bg-white shadow text-secondary hover:bg-gray-50`}>
            {product.is_active ? <EyeIcon className={btnIcon} /> : <EyeSlashIcon className={`${btnIcon} text-secondary`} />}
          </button>
          <button onClick={onDelete} className={`flex ${btn} items-center justify-center rounded-full bg-white shadow text-red-500 hover:bg-red-50`}>
            <TrashIcon className={btnIcon} />
          </button>
        </div>
        {product.discount > 0 && (
          <span className="absolute top-2 left-2 bg-primary text-secondary text-base font-bold px-2 py-1 rounded-full">
            -{product.discount}%
          </span>
        )}
      </div>
      <div className={small ? "p-2" : "p-4"}>
        <p className="font-bold text-base text-secondary truncate">{product.name}</p>
        {!small && <p className="text-base text-secondary mt-1 line-clamp-2">{product.description}</p>}
        <div className="flex items-center gap-2 mt-2">
          <p className="text-base font-extrabold text-secondary">${discountedPrice.toFixed(2)}</p>
          {product.discount > 0 && <p className="text-base text-secondary line-through">${product.price.toFixed(2)}</p>}
        </div>
        {!small && (product.product_details as any)?.category && (
          <span className="mt-2 inline-block text-base uppercase tracking-wide font-bold text-white bg-secondary/70 px-2 py-0.5 rounded-full">
            {(product.product_details as any).category}
          </span>
        )}
      </div>
    </div>
  );
}

//  Product Row (list view)

function ProductRow({ product, onEdit, onToggle, onDelete }: {
  product: AdminProduct; onEdit: () => void; onToggle: () => void; onDelete: () => void;
}) {
  const discountedPrice = product.discount > 0
    ? product.price * (1 - product.discount / 100)
    : product.price;

  const category = (product.meta_data as any)?.category?.name;

  return (
    <div className={`group flex items-center gap-4 rounded-2xl border border-[var(--color-container-border)] bg-white px-3 py-2.5 transition-all hover:border-secondary/40 hover:shadow-md ${!product.is_active ? "opacity-70" : ""}`}>
      <div className="relative flex-shrink-0">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name}
            className={`h-16 w-16 rounded-xl object-cover ring-1 ring-black/5 ${!product.is_active ? "grayscale" : ""}`} />
        ) : (
          <div className="h-16 w-16 rounded-xl bg-gray-100 flex items-center justify-center ring-1 ring-black/5">
            <PhotoIcon className="h-6 w-6 text-gray-500" />
          </div>
        )}
        {product.discount > 0 && (
          <span className="absolute -top-1.5 -left-1.5 bg-primary text-secondary text-base font-extrabold px-1.5 py-0.5 rounded-full shadow">
            -{product.discount}%
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-bold text-base text-secondary truncate">{product.name}</p>
          {!product.is_active && (
            <span className="text-base uppercase tracking-wide font-bold text-secondary border border-gray-200 px-1.5 py-0.5 rounded-full flex-shrink-0">Hidden</span>
          )}
        </div>
        <p className="text-base text-secondary truncate mt-0.5">{product.description}</p>
        {category && (
          <span className="mt-1 inline-block text-base uppercase tracking-wide font-bold text-white bg-secondary/70 px-2 py-0.5 rounded-full">
            {category}
          </span>
        )}
      </div>

      <div className="text-right flex-shrink-0 mr-1">
        <p className="text-base font-extrabold text-secondary leading-none">${discountedPrice.toFixed(2)}</p>
        {product.discount > 0 && <p className="text-base text-secondary line-through mt-0.5">${product.price.toFixed(2)}</p>}
      </div>

      <div className="flex gap-1 flex-shrink-0 sm:opacity-60 sm:group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit} aria-label="Edit" className="flex h-8 w-8 items-center justify-center rounded-full bg-white ring-1 ring-black/5 shadow-sm text-secondary hover:bg-secondary hover:text-white transition-colors">
          <PencilIcon className="h-4 w-4" />
        </button>
        <button onClick={onToggle} aria-label="Toggle visibility" className="flex h-8 w-8 items-center justify-center rounded-full bg-white ring-1 ring-black/5 shadow-sm text-secondary hover:bg-secondary hover:text-white transition-colors">
          {product.is_active ? <EyeIcon className="h-4 w-4" /> : <EyeSlashIcon className="h-4 w-4 text-secondary" />}
        </button>
        <button onClick={onDelete} aria-label="Delete" className="flex h-8 w-8 items-center justify-center rounded-full bg-white ring-1 ring-black/5 shadow-sm text-red-500 hover:bg-red-500 hover:text-white transition-colors">
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

//  Compact Item (dense Windows-list view)

function ProductCompactItem({ product, onEdit, onToggle, onDelete }: {
  product: AdminProduct; onEdit: () => void; onToggle: () => void; onDelete: () => void;
}) {
  const discountedPrice = product.discount > 0
    ? product.price * (1 - product.discount / 100)
    : product.price;

  const category = (product.meta_data as any)?.category?.name;

  return (
    <div className={`group flex items-center gap-3 rounded-xl border border-[var(--color-container-border)] bg-white px-2.5 py-2 hover:border-secondary/40 hover:shadow-sm transition-all ${!product.is_active ? "opacity-60" : ""}`}>
      <div className="relative flex-shrink-0">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name}
            className={`h-11 w-11 rounded-lg object-cover ring-1 ring-black/5 ${!product.is_active ? "grayscale" : ""}`} />
        ) : (
          <div className="h-11 w-11 rounded-lg bg-gray-100 flex items-center justify-center ring-1 ring-black/5">
            <PhotoIcon className="h-4 w-4 text-gray-500" />
          </div>
        )}
        {product.discount > 0 && (
          <span className="absolute -top-1 -left-1 bg-primary text-secondary text-base font-extrabold px-1 py-0.5 rounded-full shadow">
            -{product.discount}%
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <button onClick={onEdit} className="text-left block w-full">
          <span className="text-base text-secondary font-bold truncate block hover:underline">{product.name}</span>
        </button>
        <p className="text-base text-secondary truncate leading-tight">{product.description}</p>
        {category && (
          <span className="mt-1 inline-block text-base uppercase tracking-wide font-bold text-white bg-secondary/70 px-2 py-0.5 rounded-full">
            {category}
          </span>
        )}
      </div>

      <div className="text-right flex-shrink-0">
        <p className="text-base font-extrabold text-secondary leading-none tabular-nums">${discountedPrice.toFixed(2)}</p>
        {product.discount > 0 && <p className="text-base text-secondary line-through tabular-nums">${product.price.toFixed(2)}</p>}
      </div>

      <div className="flex gap-0.5 flex-shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit} aria-label="Edit" className="flex h-7 w-7 items-center justify-center rounded-full text-secondary hover:bg-secondary hover:text-white transition-colors">
          <PencilIcon className="h-3.5 w-3.5" />
        </button>
        <button onClick={onToggle} aria-label="Toggle visibility" className="flex h-7 w-7 items-center justify-center rounded-full text-secondary hover:bg-secondary hover:text-white transition-colors">
          {product.is_active ? <EyeIcon className="h-3.5 w-3.5" /> : <EyeSlashIcon className="h-3.5 w-3.5 text-secondary" />}
        </button>
        <button onClick={onDelete} aria-label="Delete" className="flex h-7 w-7 items-center justify-center rounded-full text-red-500 hover:bg-red-500 hover:text-white transition-colors">
          <TrashIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

//  New Product Form

const MISSING_LABELS: Record<string, string> = {
  name: "Product Name",
  price: "Price",
  category: "Category",
  collection: "Collection",
};

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
  const [missing, setMissing] = useState<string[]>([]);
  const [serverErr, setServerErr] = useState(false);

  const clearMiss = (key: string) => setMissing((m) => m.filter((k) => k !== key));

  const handleSubmit = async () => {
    const miss: string[] = [];
    if (!name.trim()) miss.push("name");
    if (!price) miss.push("price");
    if (!metaCategory) miss.push("category");
    if (!metaCollection) miss.push("collection");
    setMissing(miss);
    setServerErr(false);
    if (miss.length > 0) return;

    setSaving(true);
    const ok = await createProduct({
      name: name.trim(), description: description.trim(),
      image_url: imageUrl.trim() || null,
      price: parseFloat(price), discount: parseFloat(discount || "0"),
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
      setDetailEntries([]); setMetaCategory(""); setMetaCategoryImg("");
      setMetaCollection(""); setMetaCollectionImg(""); setMetaPlayer(""); setMetaPlayerImg("");
      setMissing([]);
      onCreated();
      setTimeout(() => setSuccess(false), 3000);
    } else { setServerErr(true); }
    setSaving(false);
  };

  const field = (label: string, value: string, onChange: (v: string) => void, placeholder = "", type = "text", invalid = false) => (
    <div>
      <label className={`text-base font-bold uppercase tracking-widest mb-1 block ${invalid ? "text-red-500" : "text-secondary"}`}>{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className={`w-full rounded-xl border px-4 py-3 text-base text-secondary outline-none transition-colors ${invalid ? "border-red-400 bg-red-50/40 focus:border-red-500" : "border-gray-200 focus:border-secondary"}`} />
      {invalid && <p className="text-red-500 text-sm font-semibold mt-1">This field is required.</p>}
    </div>
  );

  return (
    <div className="mx-auto">
      <div className="rounded-2xl border border-[var(--color-container-border)] bg-white overflow-hidden">
        <div className="bg-secondary px-6 py-5">
          <p className="text-white/60 text-base uppercase tracking-widest font-semibold">Addition to the shop</p>
          <h2 className="text-2xl font-extrabold text-white pt-1">New Product</h2>
        </div>
        <div className="p-6 space-y-5">
          <p className="text-base font-bold uppercase tracking-widest text-secondary border-b border-gray-100 pb-2">Basic Info</p>
          {field("Product Name *", name, (v) => { setName(v); clearMiss("name"); }, "e.g. Warriors City Edition Jersey", "text", missing.includes("name"))}
          <div>
            <label className="text-base font-bold uppercase tracking-widest text-secondary mb-1 block">Description</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the product..."
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base text-secondary outline-none focus:border-secondary" />
          </div>
          <ImageInput value={imageUrl} onChange={setImageUrl} />
          <div className="grid grid-cols-2 gap-4">
            {field("Price (USD) *", price, (v) => { setPrice(v); clearMiss("price"); }, "0.00", "number", missing.includes("price"))}
            {field("Discount (%)", discount, setDiscount, "0", "number")}
          </div>
          <p className="text-base font-bold uppercase tracking-widest text-secondary border-b border-gray-100 pb-2 pt-2">Product Details</p>
          <DynamicDetails entries={detailEntries} onChange={setDetailEntries} />
          <p className="text-base font-bold uppercase tracking-widest text-secondary border-b border-gray-100 pb-2 pt-2">Meta Data</p>
          <div className="grid gap-4">
            <SelectionButtons label="Choose one category *" items={categories} selectedName={metaCategory} invalid={missing.includes("category")}
              onSelect={(item) => { setMetaCategory(item.name); setMetaCategoryImg(item.image_url ?? ""); clearMiss("category"); }} />
            <SelectionButtons label="Choose one collection *" items={collections} selectedName={metaCollection} invalid={missing.includes("collection")}
              onSelect={(item) => { setMetaCollection(item.name); setMetaCollectionImg(item.image_url ?? ""); clearMiss("collection"); }} />
            <PlayerSelection players={players} selectedName={metaPlayer}
              onSelect={(item) => { setMetaPlayer(item.name); setMetaPlayerImg(item.image_url ?? ""); }}
              onClear={() => { setMetaPlayer(""); setMetaPlayerImg(""); }} />
          </div>
          {success && <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-base font-semibold text-green-600">Product created successfully!</div>}
          {missing.length > 0 && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-base font-semibold text-red-600">
              Missing required {missing.length === 1 ? "field" : "fields"}:{" "}
              {missing.map((k) => MISSING_LABELS[k]).join(", ")}. Highlighted in red above.
            </div>
          )}
          {serverErr && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-base font-semibold text-red-600">Could not create the product. Please try again.</div>}
          <button onClick={handleSubmit} disabled={saving}
            className="w-full py-3 rounded-xl bg-secondary text-white font-bold text-base hover:bg-secondary/90 disabled:opacity-50 transition-colors">
            {saving ? "Creating..." : "Create Product"}
          </button>
        </div>
      </div>
    </div>
  );
}

//  Product Grid with Search + Filters 

function ProductGrid({ products, loading, onEdit, onToggle, onDelete }: {
  products: AdminProduct[];
  loading: boolean;
  onEdit: (p: AdminProduct) => void;
  onToggle: (p: AdminProduct) => void;
  onDelete: (p: AdminProduct) => void;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [inputValue, setInputValue] = useState(searchParams.get("search") || "");
  const [isFiltersDrawerOpen, setIsFiltersDrawerOpen] = useState(false);
  const [isDesktopFiltersOpen, setIsDesktopFiltersOpen] = useState(false);
  const [view, setView] = useState<ViewMode>(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(VIEW_STORAGE_KEY) : null;
    return (stored as ViewMode) || "medium";
  });

  const changeView = (mode: ViewMode) => {
    setView(mode);
    try { localStorage.setItem(VIEW_STORAGE_KEY, mode); } catch { /* ignore */ }
  };

  const SKELETON_COUNT = 8;

  // Build filtered list from live search input + URL filter params
  const filtered = useMemo(() => {
    const search = inputValue.toLowerCase().trim();

    return products.filter((p) => {
      // Search by name
      if (search && !p.name.toLowerCase().includes(search)) return false;

      // Filter by meta_data keys (category, collection, player)
      for (const [key, value] of searchParams.entries()) {
        if (key === "search") continue;
        const trimmed = value.trim();
        if (!trimmed) continue;
        const md = p.meta_data as any;
        if (md?.[key]?.name !== trimmed) return false;
      }

      return true;
    });
  }, [products, searchParams, inputValue]);

  const handleClearSearch = () => {
    setInputValue("");
    const next = new URLSearchParams(searchParams);
    next.delete("search");
    setSearchParams(next);
  };

  return (
    <div className="relative flex min-h-0 flex-1 overflow-visible">
      {/* Desktop filters panel */}
      {isDesktopFiltersOpen && (
        <div className="hidden md:flex shrink-0">
          <Filters className="h-full" onClose={() => setIsDesktopFiltersOpen(false)} showCloseOnDesktop />
        </div>
      )}

      <div className="flex-1 min-w-0">
        {/* Search bar */}
        <div className="flex w-full items-center gap-2 mb-6">
          {!isDesktopFiltersOpen && (
            <button type="button" aria-label="Open filters"
              onClick={() => setIsDesktopFiltersOpen(true)}
              className="hidden md:inline-flex items-center justify-center rounded-2xl border-4 border-secondary bg-white p-3 text-black transition-colors hover:border-primary hover:text-primary">
              <AdjustmentsHorizontalIcon className="h-6 w-6" />
            </button>
          )}
          <div className="relative flex-1">
            <input type="text" placeholder="Search products..." value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full rounded-2xl border-4 border-secondary bg-white px-4 py-3 pr-12 font-lato transition-colors focus:border-primary focus:outline-none" />
            {inputValue && (
              <button type="button" aria-label="Clear search" onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-secondary hover:text-primary">
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
          </div>
          <button type="button" aria-label="Open filters"
            onClick={() => setIsFiltersDrawerOpen(true)}
            className="md:hidden inline-flex items-center justify-center rounded-2xl border-4 border-secondary bg-white p-3 text-black transition-colors hover:border-primary hover:text-primary">
            <AdjustmentsHorizontalIcon className="h-6 w-6" />
          </button>

          {/* View mode toggle */}
          <div className="hidden sm:inline-flex items-center rounded-2xl border-4 border-secondary bg-white overflow-hidden">
            {VIEW_MODES.map((m) => (
              <button key={m.id} type="button" aria-label={`${m.label} view`} title={`${m.label} view`}
                onClick={() => changeView(m.id)}
                className={`flex items-center justify-center p-2 transition-colors ${
                  view === m.id ? "bg-secondary text-white" : "text-secondary hover:text-primary"
                }`}>
                {m.icon}
              </button>
            ))}
          </div>
        </div>

        {/* Grid / List / Compact */}
        {loading ? (
          <div className={GRID_CLASSES[view === "large" ? "large" : view === "small" ? "small" : "medium"]}>
            {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <SkeletonCard key={i} view={view === "large" ? "large" : view === "small" ? "small" : "medium"} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-secondary py-10">No products found.</p>
        ) : view === "list" ? (
          <div className="flex flex-col gap-2">
            {filtered.map((product) => (
              <ProductRow key={product.id} product={product}
                onEdit={() => onEdit(product)}
                onToggle={() => onToggle(product)}
                onDelete={() => onDelete(product)} />
            ))}
          </div>
        ) : view === "compact" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0.5">
            {filtered.map((product) => (
              <ProductCompactItem key={product.id} product={product}
                onEdit={() => onEdit(product)}
                onToggle={() => onToggle(product)}
                onDelete={() => onDelete(product)} />
            ))}
          </div>
        ) : (
          <div className={GRID_CLASSES[view]}>
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} view={view}
                onEdit={() => onEdit(product)}
                onToggle={() => onToggle(product)}
                onDelete={() => onDelete(product)} />
            ))}
          </div>
        )}
      </div>

      {/* Mobile filters drawer */}
      {isFiltersDrawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true">
          <button type="button" aria-label="Close filters" className="absolute inset-0 bg-black/40"
            onClick={() => setIsFiltersDrawerOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-80 max-w-[85%] bg-white shadow-xl">
            <div className="h-full overflow-y-auto pt-4">
              <Filters className="max-w-none" onClose={() => setIsFiltersDrawerOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

//  Main Page 

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

  return (
    <div className="min-h-screen bg-[var(--color-background)] font-[family-name:var(--font-lato)]">
      <main className="w-full px-8 pb-10 pt-5 lg:px-8">

        <section className="rounded-2xl bg-secondary overflow-hidden mb-5">
          <div className="px-8 py-6">
            <p className="text-white/60 text-base uppercase tracking-widest font-semibold">Admin Panel</p>
            <h1 className="text-3xl font-extrabold text-white">Shop Manager</h1>
            <p className="text-[var(--color-primary)] font-semibold mt-2 text-base">
              {loading ? "Loading..." : `${activeProducts.length} visible · ${disabledProducts.length} disabled`}
            </p>
          </div>
          <div className="flex border-t border-white/10">
            {TABS.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-base font-bold uppercase tracking-wide transition-colors ${
                  activeTab === tab.id ? "bg-[var(--color-primary)] text-secondary" : "text-white/60 hover:text-white hover:bg-white/5"
                }`}>
                {tab.icon}{tab.label}
              </button>
            ))}
          </div>
        </section>

        <ErrorBoundary key={activeTab} label="This section crashed">

        {activeTab === "visible" && (
          <div>
            <h2 className="text-2xl font-extrabold text-secondary pb-6">Products Accessible to Users</h2>
            <ProductGrid
              products={activeProducts}
              loading={loading}
              onEdit={setEditingProduct}
              onToggle={toggleProduct}
              onDelete={setDeleteTarget}
            />
          </div>
        )}

        {activeTab === "disabled" && (
          <div>
            <h2 className="text-2xl font-extrabold text-secondary pb-6">Products Hidden to Users</h2>
            <ProductGrid
              products={disabledProducts}
              loading={loading}
              onEdit={setEditingProduct}
              onToggle={toggleProduct}
              onDelete={setDeleteTarget}
            />
          </div>
        )}

        {activeTab === "new" && (
          <NewProductForm onCreated={fetchProducts} categories={categories} collections={collections} players={players} />
        )}

        {activeTab === "audit" && <AuditLogs />}

        </ErrorBoundary>

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