"use client";

import { useState } from "react";
import Image from "next/image";

type Product = {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  salePrice: number | null;
  stockQuantity: number | null;
  inStock: boolean;
  imageEmoji: string;
  imageUrl: string | null;
};

type WrapperColor = {
  id: number;
  name: string;
  colorHex: string;
  imageUrl: string | null;
  inStock: boolean;
};

type Props = {
  initialProducts: Product[];
  initialColors: WrapperColor[];
};

export default function InventoryClient({
  initialProducts,
  initialColors,
}: Props) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [colors, setColors] = useState<WrapperColor[]>(initialColors);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Product>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    category: "flower",
    price: "",
    salePrice: "",
    stockQuantity: "",
    imageEmoji: "🌸",
    imageUrl: "",
  });
  const [activeTab, setActiveTab] = useState<"products" | "colors">("products");

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'new' | 'edit') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');

      const { url } = await res.json();
      
      if (target === 'new') {
        setNewProduct(p => ({ ...p, imageUrl: url }));
      } else {
        setEditForm(prev => ({ ...prev, imageUrl: url }));
      }
      showMessage('✅ Image uploaded!');
    } catch {
      showMessage('❌ Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setEditForm({ ...product });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/products/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error("Failed to save");
      const updated = await res.json();
      setProducts((prev) =>
        prev.map((p) => (p.id === editingId ? { ...p, ...updated } : p))
      );
      setEditingId(null);
      showMessage("✅ Product updated!");
    } catch {
      showMessage("❌ Failed to update product");
    } finally {
      setSaving(false);
    }
  };

  const toggleStock = async (product: Product) => {
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inStock: !product.inStock }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, inStock: !p.inStock } : p
        )
      );
      showMessage(
        `✅ ${product.name} marked as ${!product.inStock ? "In Stock" : "Out of Stock"}`
      );
    } catch {
      showMessage("❌ Failed to update stock");
    }
  };

  const deleteProduct = async (id: number, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setProducts((prev) => prev.filter((p) => p.id !== id));
      showMessage(`✅ "${name}" deleted`);
    } catch {
      showMessage("❌ Failed to delete product");
    }
  };

  const addProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newProduct,
          price: parseFloat(newProduct.price),
          salePrice: newProduct.salePrice ? parseFloat(newProduct.salePrice) : null,
          stockQuantity: newProduct.stockQuantity ? parseInt(newProduct.stockQuantity) : null,
        }),
      });
      if (!res.ok) throw new Error("Failed to add");
      const created = await res.json();
      setProducts((prev) => [...prev, created]);
      setNewProduct({
        name: "",
        description: "",
        category: "flower",
        price: "",
        salePrice: "",
        stockQuantity: "",
        imageEmoji: "🌸",
        imageUrl: "",
      });
      setShowAddForm(false);
      showMessage("✅ Product added!");
    } catch {
      showMessage("❌ Failed to add product");
    } finally {
      setSaving(false);
    }
  };

  const flowers = products.filter((p) => p.category === "flower");
  const finishedGoods = products.filter((p) => p.category === "finished_good");
  const pots = products.filter((p) => p.category === "pot");
  const fuzzyFlowers = products.filter((p) => p.category === "fuzzy_wire_flower");

  return (
    <div>
      {/* Message Toast */}
      {message && (
        <div className="fixed top-4 right-4 bg-[#2d1f14] border border-[#7a4f2e] text-[#f5ede0] px-4 py-3 rounded-xl shadow-lg z-50 text-sm">
          {message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("products")}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            activeTab === "products"
              ? "bg-[#7a4f2e] text-white"
              : "bg-[#2d1f14] text-[#c4a882] hover:text-[#f5ede0] border border-[#5c3a1e]"
          }`}
        >
          Products ({products.length})
        </button>
        <button
          onClick={() => setActiveTab("colors")}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            activeTab === "colors"
              ? "bg-[#7a4f2e] text-white"
              : "bg-[#2d1f14] text-[#c4a882] hover:text-[#f5ede0] border border-[#5c3a1e]"
          }`}
        >
          Wrapper Colors ({colors.length})
        </button>
      </div>

      {activeTab === "products" && (
        <div>
          {/* Add Product Button */}
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-[#7a4f2e] text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-[#5c3a1e] transition-colors"
            >
              {showAddForm ? "Cancel" : "+ Add Product"}
            </button>
          </div>

          {/* Add Product Form */}
          {showAddForm && (
            <form
              onSubmit={addProduct}
              className="bg-[#2d1f14] rounded-2xl p-6 border border-[#7a4f2e] mb-6"
            >
              <h3 className="text-[#f5ede0] font-bold mb-4">
                Add New Product
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#c4a882] mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={newProduct.name}
                    onChange={(e) =>
                      setNewProduct((p) => ({ ...p, name: e.target.value }))
                    }
                    className="w-full bg-[#1e1410] border border-[#5c3a1e] rounded-lg px-3 py-2 text-[#f5ede0] text-sm focus:outline-none focus:ring-1 focus:ring-[#c4a882]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#c4a882] mb-1">
                    Price (₱) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newProduct.price}
                    onChange={(e) =>
                      setNewProduct((p) => ({ ...p, price: e.target.value }))
                    }
                    className="w-full bg-[#1e1410] border border-[#5c3a1e] rounded-lg px-3 py-2 text-[#f5ede0] text-sm focus:outline-none focus:ring-1 focus:ring-[#c4a882]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#c4a882] mb-1">
                    Sale Price (₱)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newProduct.salePrice}
                    onChange={(e) =>
                      setNewProduct((p) => ({ ...p, salePrice: e.target.value }))
                    }
                    placeholder="Leave empty for no sale"
                    className="w-full bg-[#1e1410] border border-[#5c3a1e] rounded-lg px-3 py-2 text-[#f5ede0] text-sm focus:outline-none focus:ring-1 focus:ring-[#c4a882]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#c4a882] mb-1">
                    Quantity in Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newProduct.stockQuantity}
                    onChange={(e) =>
                      setNewProduct((p) => ({ ...p, stockQuantity: e.target.value }))
                    }
                    placeholder="0"
                    className="w-full bg-[#1e1410] border border-[#5c3a1e] rounded-lg px-3 py-2 text-[#f5ede0] text-sm focus:outline-none focus:ring-1 focus:ring-[#c4a882]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#c4a882] mb-1">
                    Category
                  </label>
                  <select
                    value={newProduct.category}
                    onChange={(e) =>
                      setNewProduct((p) => ({ ...p, category: e.target.value }))
                    }
                    className="w-full bg-[#1e1410] border border-[#5c3a1e] rounded-lg px-3 py-2 text-[#f5ede0] text-sm focus:outline-none focus:ring-1 focus:ring-[#c4a882]"
                  >
                    <option value="flower">Flower (stem)</option>
                    <option value="finished_good">Finished Good</option>
                    <option value="pot">Mini Pot</option>
                    <option value="fuzzy_wire_flower">Fuzzy Wire Flower</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#c4a882] mb-1">
                    Emoji (fallback)
                  </label>
                  <input
                    type="text"
                    value={newProduct.imageEmoji}
                    onChange={(e) =>
                      setNewProduct((p) => ({
                        ...p,
                        imageEmoji: e.target.value,
                      }))
                    }
                    className="w-full bg-[#1e1410] border border-[#5c3a1e] rounded-lg px-3 py-2 text-[#f5ede0] text-sm focus:outline-none focus:ring-1 focus:ring-[#c4a882]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-[#c4a882] mb-1">
                    Photo <span className="text-[#7a5c3e]">(square image)</span>
                  </label>
                  <div className="flex gap-2 items-start">
                    <div className="flex-1">
                      <input
                        type="url"
                        value={newProduct.imageUrl}
                        onChange={(e) =>
                          setNewProduct((p) => ({ ...p, imageUrl: e.target.value }))
                        }
                        placeholder="Or paste image URL..."
                        className="w-full bg-[#1e1410] border border-[#5c3a1e] rounded-lg px-3 py-2 text-[#f5ede0] text-sm focus:outline-none focus:ring-1 focus:ring-[#c4a882]"
                      />
                    </div>
                    <label className="bg-[#7a4f2e] text-white px-3 py-2 rounded-lg cursor-pointer hover:bg-[#5c3a1e] transition-colors text-sm font-medium">
                      {uploading ? 'Uploading...' : 'Upload'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, 'new')}
                        disabled={uploading}
                      />
                    </label>
                  </div>
                  {newProduct.imageUrl && (
                    <div className="mt-2 w-16 h-16 rounded-lg overflow-hidden border border-[#5c3a1e]">
                      <Image
                        src={newProduct.imageUrl}
                        alt="Preview"
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    </div>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-[#c4a882] mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={newProduct.description}
                    onChange={(e) =>
                      setNewProduct((p) => ({
                        ...p,
                        description: e.target.value,
                      }))
                    }
                    className="w-full bg-[#1e1410] border border-[#5c3a1e] rounded-lg px-3 py-2 text-[#f5ede0] text-sm focus:outline-none focus:ring-1 focus:ring-[#c4a882]"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="mt-4 bg-[#7a4f2e] text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-[#5c3a1e] transition-colors disabled:opacity-50"
              >
                {saving ? "Adding..." : "Add Product"}
              </button>
            </form>
          )}

          {/* Flowers */}
          {flowers.length > 0 && (
            <section className="mb-8">
              <h3 className="text-[#c4a882] text-sm font-medium uppercase tracking-wider mb-3">
                🌸 Flower Stems ({flowers.length})
              </h3>
              <ProductTable
                products={flowers}
                editingId={editingId}
                editForm={editForm}
                saving={saving}
                uploading={uploading}
                onEdit={startEdit}
                onCancel={cancelEdit}
                onSave={saveEdit}
                onToggleStock={toggleStock}
                onDelete={deleteProduct}
                onEditFormChange={(field, value) =>
                  setEditForm((prev) => ({ ...prev, [field]: value }))
                }
                onImageUpload={handleImageUpload}
              />
            </section>
          )}

          {/* Finished Goods */}
          {finishedGoods.length > 0 && (
            <section className="mb-8">
              <h3 className="text-[#c4a882] text-sm font-medium uppercase tracking-wider mb-3">
                🎁 Finished Goods ({finishedGoods.length})
              </h3>
              <ProductTable
                products={finishedGoods}
                editingId={editingId}
                editForm={editForm}
                saving={saving}
                uploading={uploading}
                onEdit={startEdit}
                onCancel={cancelEdit}
                onSave={saveEdit}
                onToggleStock={toggleStock}
                onDelete={deleteProduct}
                onEditFormChange={(field, value) =>
                  setEditForm((prev) => ({ ...prev, [field]: value }))
                }
                onImageUpload={handleImageUpload}
              />
            </section>
          )}

          {/* Pots */}
          {pots.length > 0 && (
            <section className="mb-8">
              <h3 className="text-[#c4a882] text-sm font-medium uppercase tracking-wider mb-3">
                🪴 Mini Pots ({pots.length})
              </h3>
              <ProductTable
                products={pots}
                editingId={editingId}
                editForm={editForm}
                saving={saving}
                uploading={uploading}
                onEdit={startEdit}
                onCancel={cancelEdit}
                onSave={saveEdit}
                onToggleStock={toggleStock}
                onDelete={deleteProduct}
                onEditFormChange={(field, value) =>
                  setEditForm((prev) => ({ ...prev, [field]: value }))
                }
                onImageUpload={handleImageUpload}
              />
            </section>
          )}

          {/* Fuzzy Wire Flowers */}
          {fuzzyFlowers.length > 0 && (
            <section className="mb-8">
              <h3 className="text-[#c4a882] text-sm font-medium uppercase tracking-wider mb-3">
                🌼 Fuzzy Wire Flowers ({fuzzyFlowers.length})
              </h3>
              <ProductTable
                products={fuzzyFlowers}
                editingId={editingId}
                editForm={editForm}
                saving={saving}
                uploading={uploading}
                onEdit={startEdit}
                onCancel={cancelEdit}
                onSave={saveEdit}
                onToggleStock={toggleStock}
                onDelete={deleteProduct}
                onEditFormChange={(field, value) =>
                  setEditForm((prev) => ({ ...prev, [field]: value }))
                }
                onImageUpload={handleImageUpload}
              />
            </section>
          )}

          {products.length === 0 && (
            <div className="bg-[#2d1f14] rounded-2xl p-8 text-center border border-[#5c3a1e]">
              <p className="text-[#7a5c3e]">
                No products yet. Add your first product above!
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === "colors" && (
        <WrapperColorsTab colors={colors} setColors={setColors} showMessage={showMessage} />
      )}
    </div>
  );
}

function ProductTable({
  products,
  editingId,
  editForm,
  saving,
  uploading,
  onEdit,
  onCancel,
  onSave,
  onToggleStock,
  onDelete,
  onEditFormChange,
  onImageUpload,
}: {
  products: Product[];
  editingId: number | null;
  editForm: Partial<Product>;
  saving: boolean;
  uploading: boolean;
  onEdit: (p: Product) => void;
  onCancel: () => void;
  onSave: () => void;
  onToggleStock: (p: Product) => void;
  onDelete: (id: number, name: string) => void;
  onEditFormChange: (field: string, value: string | number | boolean | null) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>, target: 'new' | 'edit') => void;
}) {
  // Helper to check if image URL is valid
  const isValidImageUrl = (url: string | null | undefined): boolean => {
    if (!url || typeof url !== 'string') return false;
    return url.startsWith('http://') || url.startsWith('https://');
  };
  return (
    <div className="bg-[#2d1f14] rounded-2xl border border-[#5c3a1e] overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#5c3a1e]">
            <th className="text-left px-4 py-3 text-[#c4a882] text-xs font-medium uppercase">
              Product
            </th>
            <th className="text-left px-4 py-3 text-[#c4a882] text-xs font-medium uppercase">
              Photo
            </th>
            <th className="text-left px-4 py-3 text-[#c4a882] text-xs font-medium uppercase">
              Price
            </th>
            <th className="text-left px-4 py-3 text-[#c4a882] text-xs font-medium uppercase">
              Sale
            </th>
            <th className="text-left px-4 py-3 text-[#c4a882] text-xs font-medium uppercase">
              Qty
            </th>
            <th className="text-left px-4 py-3 text-[#c4a882] text-xs font-medium uppercase">
              Status
            </th>
            <th className="text-left px-4 py-3 text-[#c4a882] text-xs font-medium uppercase">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr
              key={product.id}
              className="border-b border-[#3d2c1e] last:border-0"
            >
              {editingId === product.id ? (
                <>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editForm.imageEmoji ?? ""}
                        onChange={(e) =>
                          onEditFormChange("imageEmoji", e.target.value)
                        }
                        className="w-12 bg-[#1e1410] border border-[#5c3a1e] rounded px-2 py-1 text-[#f5ede0] text-sm text-center"
                        title="Emoji"
                      />
                      <input
                        type="text"
                        value={editForm.name ?? ""}
                        onChange={(e) =>
                          onEditFormChange("name", e.target.value)
                        }
                        className="flex-1 bg-[#1e1410] border border-[#5c3a1e] rounded px-2 py-1 text-[#f5ede0] text-sm"
                      />
                    </div>
                    <input
                      type="text"
                      value={editForm.description ?? ""}
                      onChange={(e) =>
                        onEditFormChange("description", e.target.value)
                      }
                      placeholder="Description"
                      className="mt-1 w-full bg-[#1e1410] border border-[#5c3a1e] rounded px-2 py-1 text-[#c4a882] text-xs"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 items-start">
                      <input
                        type="url"
                        value={editForm.imageUrl ?? ""}
                        onChange={(e) =>
                          onEditFormChange("imageUrl", e.target.value)
                        }
                        placeholder="https://..."
                        className="w-full bg-[#1e1410] border border-[#5c3a1e] rounded px-2 py-1 text-[#f5ede0] text-xs"
                      />
                      <label className="bg-[#7a4f2e] text-white px-2 py-1 rounded cursor-pointer hover:bg-[#5c3a1e] text-xs whitespace-nowrap">
                        {uploading ? '...' : '📤'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => onImageUpload(e, 'edit')}
                          disabled={uploading}
                        />
                      </label>
                    </div>
                    {editForm.imageUrl && (
                      <div className="mt-1 w-10 h-10 rounded overflow-hidden border border-[#5c3a1e]">
                        <Image
                          src={editForm.imageUrl}
                          alt="Preview"
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editForm.price ?? ""}
                      onChange={(e) =>
                        onEditFormChange("price", parseFloat(e.target.value))
                      }
                      className="w-24 bg-[#1e1410] border border-[#5c3a1e] rounded px-2 py-1 text-[#f5ede0] text-sm"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editForm.salePrice ?? ""}
                      onChange={(e) =>
                        onEditFormChange("salePrice", e.target.value ? parseFloat(e.target.value) : null)
                      }
                      placeholder="No sale"
                      className="w-24 bg-[#1e1410] border border-[#5c3a1e] rounded px-2 py-1 text-[#f5ede0] text-sm"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min="0"
                      value={editForm.stockQuantity ?? ""}
                      onChange={(e) =>
                        onEditFormChange("stockQuantity", parseInt(e.target.value))
                      }
                      className="w-20 bg-[#1e1410] border border-[#5c3a1e] rounded px-2 py-1 text-[#f5ede0] text-sm"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[#c4a882] text-sm">
                      {product.inStock ? "In Stock" : "Out of Stock"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={onSave}
                        disabled={saving}
                        className="text-xs bg-green-800 text-green-200 px-3 py-1 rounded-full hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {saving ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={onCancel}
                        className="text-xs bg-[#3d2c1e] text-[#c4a882] px-3 py-1 rounded-full hover:bg-[#5c3a1e] transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                </>
              ) : (
                <>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {isValidImageUrl(product.imageUrl) ? (
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-[#5c3a1e] flex-shrink-0">
                          <Image
                            src={product.imageUrl as string}
                            alt={product.name}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <span className="text-2xl">{product.imageEmoji}</span>
                      )}
                      <div>
                        <p className="text-[#f5ede0] text-sm font-medium">
                          {product.name}
                        </p>
                        {product.description && (
                          <p className="text-[#7a5c3e] text-xs">
                            {product.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {isValidImageUrl(product.imageUrl) ? (
                      <span className="text-[#7a5c3e] text-xs truncate max-w-[120px] block" title={product.imageUrl || ''}>
                        ✓ Set
                      </span>
                    ) : (
                      <span className="text-[#5c3a1e] text-xs italic">No photo</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[#c4a882] text-sm font-medium">
                    {product.salePrice ? (
                      <div>
                        <span className="text-green-400">₱{product.salePrice.toFixed(2)}</span>
                        <span className="text-[#7a5c3e] line-through ml-1 text-xs">₱{product.price.toFixed(2)}</span>
                      </div>
                    ) : (
                      <span>₱{product.price.toFixed(2)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[#c4a882] text-sm">
                    {product.stockQuantity}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => onToggleStock(product)}
                      className={`text-xs px-3 py-1 rounded-full border font-medium transition-colors ${
                        product.inStock
                          ? "bg-green-900/40 text-green-300 border-green-700 hover:bg-green-900/60"
                          : "bg-red-900/40 text-red-300 border-red-700 hover:bg-red-900/60"
                      }`}
                    >
                      {product.inStock ? "✓ In Stock" : "✗ Out of Stock"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => onEdit(product)}
                        className="text-xs bg-[#3d2c1e] text-[#c4a882] px-3 py-1 rounded-full hover:bg-[#5c3a1e] transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(product.id, product.name)}
                        className="text-xs bg-red-900/30 text-red-400 px-3 py-1 rounded-full hover:bg-red-900/50 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WrapperColorsTab({
  colors,
  setColors,
  showMessage,
}: {
  colors: WrapperColor[];
  setColors: React.Dispatch<React.SetStateAction<WrapperColor[]>>;
  showMessage: (msg: string) => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [newColor, setNewColor] = useState({ name: "", colorHex: "#ffffff", imageUrl: "" });
  const [saving, setSaving] = useState(false);
  const [editingColorId, setEditingColorId] = useState<number | null>(null);
  const [editColorForm, setEditColorForm] = useState<Partial<WrapperColor>>({});
  const [uploading, setUploading] = useState(false);

  // Helper to check if image URL is valid
  const isValidImageUrl = (url: string | null | undefined): boolean => {
    if (!url || typeof url !== 'string') return false;
    return url.startsWith('http://') || url.startsWith('https://');
  };

  const handleColorImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'new' | 'edit') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');

      const { url } = await res.json();
      
      if (target === 'new') {
        setNewColor(c => ({ ...c, imageUrl: url }));
      } else {
        setEditColorForm(prev => ({ ...prev, imageUrl: url }));
      }
      showMessage('✅ Image uploaded!');
    } catch {
      showMessage('❌ Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const toggleColorStock = async (color: WrapperColor) => {
    try {
      const res = await fetch(`/api/wrapper-colors/${color.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inStock: !color.inStock }),
      });
      if (!res.ok) throw new Error("Failed");
      setColors((prev) =>
        prev.map((c) =>
          c.id === color.id ? { ...c, inStock: !c.inStock } : c
        )
      );
      showMessage(`✅ ${color.name} updated`);
    } catch {
      showMessage("❌ Failed to update");
    }
  };

  const startEditColor = (color: WrapperColor) => {
    setEditingColorId(color.id);
    setEditColorForm({ ...color });
  };

  const cancelEditColor = () => {
    setEditingColorId(null);
    setEditColorForm({});
  };

  const saveEditColor = async () => {
    if (!editingColorId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/wrapper-colors/${editingColorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editColorForm),
      });
      if (!res.ok) throw new Error("Failed");
      const updated = await res.json();
      setColors((prev) =>
        prev.map((c) => (c.id === editingColorId ? { ...c, ...updated } : c))
      );
      setEditingColorId(null);
      showMessage("✅ Color updated!");
    } catch {
      showMessage("❌ Failed to update color");
    } finally {
      setSaving(false);
    }
  };

  const deleteColor = async (id: number, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/wrapper-colors/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setColors((prev) => prev.filter((c) => c.id !== id));
      showMessage(`✅ "${name}" deleted`);
    } catch {
      showMessage("❌ Failed to delete color");
    }
  };

  const addColor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/wrapper-colors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newColor),
      });
      if (!res.ok) throw new Error("Failed");
      const created = await res.json();
      setColors((prev) => [...prev, created]);
      setNewColor({ name: "", colorHex: "#ffffff", imageUrl: "" });
      setShowAdd(false);
      showMessage("✅ Color added!");
    } catch {
      showMessage("❌ Failed to add color");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="bg-[#7a4f2e] text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-[#5c3a1e] transition-colors"
        >
          {showAdd ? "Cancel" : "+ Add Color"}
        </button>
      </div>

      {showAdd && (
        <form
          onSubmit={addColor}
          className="bg-[#2d1f14] rounded-2xl p-6 border border-[#7a4f2e] mb-6"
        >
          <h3 className="text-[#f5ede0] font-bold mb-4">Add Wrapper Color</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#c4a882] mb-1">
                Color Name *
              </label>
              <input
                type="text"
                value={newColor.name}
                onChange={(e) =>
                  setNewColor((c) => ({ ...c, name: e.target.value }))
                }
                placeholder="e.g. Sage Green"
                className="w-full bg-[#1e1410] border border-[#5c3a1e] rounded-lg px-3 py-2 text-[#f5ede0] text-sm focus:outline-none focus:ring-1 focus:ring-[#c4a882]"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-[#c4a882] mb-1">
                Color (hex)
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={newColor.colorHex}
                  onChange={(e) =>
                    setNewColor((c) => ({ ...c, colorHex: e.target.value }))
                  }
                  className="w-10 h-10 rounded cursor-pointer border border-[#5c3a1e]"
                />
                <input
                  type="text"
                  value={newColor.colorHex}
                  onChange={(e) =>
                    setNewColor((c) => ({ ...c, colorHex: e.target.value }))
                  }
                  className="flex-1 bg-[#1e1410] border border-[#5c3a1e] rounded-lg px-3 py-2 text-[#f5ede0] text-sm focus:outline-none focus:ring-1 focus:ring-[#c4a882]"
                />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-[#c4a882] mb-1">
                Photo <span className="text-[#7a5c3e]">(square image of the wrapper)</span>
              </label>
              <div className="flex gap-2 items-start">
                <div className="flex-1">
                  <input
                    type="url"
                    value={newColor.imageUrl}
                    onChange={(e) =>
                      setNewColor((c) => ({ ...c, imageUrl: e.target.value }))
                    }
                    placeholder="Or paste image URL..."
                    className="w-full bg-[#1e1410] border border-[#5c3a1e] rounded-lg px-3 py-2 text-[#f5ede0] text-sm focus:outline-none focus:ring-1 focus:ring-[#c4a882]"
                  />
                </div>
                <label className="bg-[#7a4f2e] text-white px-3 py-2 rounded-lg cursor-pointer hover:bg-[#5c3a1e] transition-colors text-sm font-medium">
                  {uploading ? 'Uploading...' : 'Upload'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleColorImageUpload(e, 'new')}
                    disabled={uploading}
                  />
                </label>
              </div>
              {isValidImageUrl(newColor.imageUrl) && (
                <div className="mt-2 w-16 h-16 rounded-lg overflow-hidden border border-[#5c3a1e]">
                  <Image
                    src={newColor.imageUrl}
                    alt="Preview"
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                </div>
              )}
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="mt-4 bg-[#7a4f2e] text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-[#5c3a1e] transition-colors disabled:opacity-50"
          >
            {saving ? "Adding..." : "Add Color"}
          </button>
        </form>
      )}

      <div className="bg-[#2d1f14] rounded-2xl border border-[#5c3a1e] overflow-hidden">
        {colors.length === 0 ? (
          <div className="p-8 text-center text-[#7a5c3e]">
            No wrapper colors yet.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#5c3a1e]">
                <th className="text-left px-4 py-3 text-[#c4a882] text-xs font-medium uppercase">
                  Color
                </th>
                <th className="text-left px-4 py-3 text-[#c4a882] text-xs font-medium uppercase">
                  Photo URL
                </th>
                <th className="text-left px-4 py-3 text-[#c4a882] text-xs font-medium uppercase">
                  Stock
                </th>
                <th className="text-left px-4 py-3 text-[#c4a882] text-xs font-medium uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {colors.map((color) => (
                <tr
                  key={color.id}
                  className="border-b border-[#3d2c1e] last:border-0"
                >
                  {editingColorId === color.id ? (
                    <>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={editColorForm.colorHex ?? "#ffffff"}
                            onChange={(e) =>
                              setEditColorForm((f) => ({ ...f, colorHex: e.target.value }))
                            }
                            className="w-8 h-8 rounded cursor-pointer border border-[#5c3a1e]"
                          />
                          <input
                            type="text"
                            value={editColorForm.name ?? ""}
                            onChange={(e) =>
                              setEditColorForm((f) => ({ ...f, name: e.target.value }))
                            }
                            className="flex-1 bg-[#1e1410] border border-[#5c3a1e] rounded px-2 py-1 text-[#f5ede0] text-sm"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 items-start">
                          <input
                            type="url"
                            value={editColorForm.imageUrl ?? ""}
                            onChange={(e) =>
                              setEditColorForm((f) => ({ ...f, imageUrl: e.target.value }))
                            }
                            placeholder="https://..."
                            className="w-full bg-[#1e1410] border border-[#5c3a1e] rounded px-2 py-1 text-[#f5ede0] text-xs"
                          />
                          <label className="bg-[#7a4f2e] text-white px-2 py-1 rounded cursor-pointer hover:bg-[#5c3a1e] text-xs whitespace-nowrap">
                            {uploading ? '...' : '📤'}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleColorImageUpload(e, 'edit')}
                              disabled={uploading}
                            />
                          </label>
                        </div>
                        {isValidImageUrl(editColorForm.imageUrl) && (
                          <div className="mt-1 w-10 h-10 rounded overflow-hidden border border-[#5c3a1e]">
                            <Image
                              src={editColorForm.imageUrl as string}
                              alt="Preview"
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                              unoptimized
                            />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[#c4a882] text-sm">
                          {color.inStock ? "In Stock" : "Out of Stock"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={saveEditColor}
                            disabled={saving}
                            className="text-xs bg-green-800 text-green-200 px-3 py-1 rounded-full hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            {saving ? "Saving..." : "Save"}
                          </button>
                          <button
                            onClick={cancelEditColor}
                            className="text-xs bg-[#3d2c1e] text-[#c4a882] px-3 py-1 rounded-full hover:bg-[#5c3a1e] transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {isValidImageUrl(color.imageUrl) ? (
                            <div className="w-10 h-10 rounded-lg overflow-hidden border border-[#5c3a1e] flex-shrink-0">
                              <Image
                                src={color.imageUrl as string}
                                alt={color.name}
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <span
                              className="w-8 h-8 rounded-full border border-[#5c3a1e] flex-shrink-0"
                              style={{ backgroundColor: color.colorHex }}
                            />
                          )}
                          <div>
                            <p className="text-[#f5ede0] text-sm font-medium">
                              {color.name}
                            </p>
                            <p className="text-[#7a5c3e] text-xs">{color.colorHex}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {isValidImageUrl(color.imageUrl) ? (
                          <span className="text-[#7a5c3e] text-xs">✓ Set</span>
                        ) : (
                          <span className="text-[#5c3a1e] text-xs italic">No photo</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleColorStock(color)}
                          className={`text-xs px-3 py-1 rounded-full border font-medium transition-colors ${
                            color.inStock
                              ? "bg-green-900/40 text-green-300 border-green-700 hover:bg-green-900/60"
                              : "bg-red-900/40 text-red-300 border-red-700 hover:bg-red-900/60"
                          }`}
                        >
                          {color.inStock ? "✓ In Stock" : "✗ Out of Stock"}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEditColor(color)}
                            className="text-xs bg-[#3d2c1e] text-[#c4a882] px-3 py-1 rounded-full hover:bg-[#5c3a1e] transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteColor(color.id, color.name)}
                            className="text-xs bg-red-900/30 text-red-400 px-3 py-1 rounded-full hover:bg-red-900/50 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
