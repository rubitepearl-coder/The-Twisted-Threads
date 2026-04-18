"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type DeliveryLocation = {
  id: number;
  locationName: string;
  deliveryFee: number;
  inStock: boolean;
};

type Props = {
  initialLocations: DeliveryLocation[];
};

export default function DeliverySettingsClient({ initialLocations }: Props) {
  const router = useRouter();
  const [locations, setLocations] = useState<DeliveryLocation[]>(initialLocations);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [otherToggle, setOtherToggle] = useState(false);

  const [newLocation, setNewLocation] = useState({
    locationName: "",
    deliveryFee: "",
  });

  const [editForm, setEditForm] = useState({
    locationName: "",
    deliveryFee: "",
    inStock: true,
  });

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/delivery-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationName: newLocation.locationName,
          deliveryFee: parseFloat(newLocation.deliveryFee) || 0,
        }),
      });
      if (!res.ok) throw new Error("Failed to add");
      const created = await res.json();
      setLocations((prev) => [...prev, created]);
      setNewLocation({ locationName: "", deliveryFee: "" });
      setShowAddForm(false);
      showMessage("✅ Location added!");
    } catch {
      showMessage("❌ Failed to add location");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (location: DeliveryLocation) => {
    setEditingId(location.id);
    setEditForm({
      locationName: location.locationName,
      deliveryFee: location.deliveryFee.toString(),
      inStock: location.inStock,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/delivery-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          locationName: editForm.locationName,
          deliveryFee: parseFloat(editForm.deliveryFee) || 0,
          inStock: editForm.inStock,
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
      const updated = await res.json();
      setLocations((prev) =>
        prev.map((l) => (l.id === editingId ? updated : l))
      );
      setEditingId(null);
      showMessage("✅ Location updated!");
    } catch {
      showMessage("❌ Failed to update location");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this location?")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/delivery-settings?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setLocations((prev) => prev.filter((l) => l.id !== id));
      showMessage("✅ Location deleted!");
    } catch {
      showMessage("❌ Failed to delete location");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleOther = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/delivery-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggleOther",
          toggleOther: !otherToggle,
        }),
      });
      if (!res.ok) throw new Error("Failed to toggle");
      const otherLoc = await res.json();
      setLocations((prev) => {
        const filtered = prev.filter((l) => l.locationName !== "__OTHER__");
        return [...filtered, otherLoc];
      });
      setOtherToggle(!otherToggle);
      showMessage(`✅ "Other (Not Listed)" ${!otherToggle ? "enabled" : "disabled"}!`);
    } catch {
      showMessage("❌ Failed to toggle option");
    } finally {
      setSaving(false);
    }
  };

  const regularLocations = locations.filter(
    (l) => l.locationName !== "__OTHER__"
  );

  return (
    <div>
      {/* Message Toast */}
      {message && (
        <div className="fixed top-4 right-4 bg-[#2d1f14] border border-[#7a4f2e] text-[#f5ede0] px-4 py-3 rounded-xl shadow-lg z-50 text-sm">
          {message}
        </div>
      )}

      {/* Other Option Info */}
      <div className="bg-[#2d1f14] rounded-2xl p-6 border border-[#7a4f2e] mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[#f5ede0] font-bold">&quot;Other (Not Listed)&quot; Option</h3>
            <p className="text-[#c4a882] text-sm">
              This option is always shown in checkout. When selected, customers will be switched to Pickup mode.
            </p>
          </div>
          <span className="px-4 py-2 rounded-full text-sm font-medium bg-green-900 text-green-200">
            ✓ Always Enabled
          </span>
        </div>
      </div>

      {/* Locations Table */}
      <div className="bg-[#2d1f14] rounded-2xl p-6 border border-[#7a4f2e]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[#f5ede0] font-bold">
            Delivery Locations ({regularLocations.length})
          </h3>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-[#7a4f2e] text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-[#5c3a1e] transition-colors"
          >
            {showAddForm ? "Cancel" : "+ Add Location"}
          </button>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <form
            onSubmit={handleAddLocation}
            className="bg-[#1e1410] rounded-xl p-4 mb-6 border border-[#5c3a1e]"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs text-[#c4a882] mb-1">
                  Location Name *
                </label>
                <input
                  type="text"
                  value={newLocation.locationName}
                  onChange={(e) =>
                    setNewLocation((l) => ({
                      ...l,
                      locationName: e.target.value,
                    }))
                  }
                  placeholder="e.g., San Francisco (Talisayan)"
                  className="w-full bg-[#1e1410] border border-[#5c3a1e] rounded-lg px-3 py-2 text-[#f5ede0] text-sm focus:outline-none focus:ring-1 focus:ring-[#c4a882]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-[#c4a882] mb-1">
                  Delivery Fee (₱) *
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={newLocation.deliveryFee}
                  onChange={(e) =>
                    setNewLocation((l) => ({
                      ...l,
                      deliveryFee: e.target.value,
                    }))
                  }
                  placeholder="0"
                  className="w-full bg-[#1e1410] border border-[#5c3a1e] rounded-lg px-3 py-2 text-[#f5ede0] text-sm focus:outline-none focus:ring-1 focus:ring-[#c4a882]"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="bg-[#7a4f2e] text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-[#5c3a1e] transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Add Location"}
            </button>
          </form>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#5c3a1e]">
                <th className="text-left text-xs text-[#c4a882] pb-3 font-medium">
                  Location Name
                </th>
                <th className="text-left text-xs text-[#c4a882] pb-3 font-medium">
                  Fee (₱)
                </th>
                <th className="text-left text-xs text-[#c4a882] pb-3 font-medium">
                  Status
                </th>
                <th className="text-right text-xs text-[#c4a882] pb-3 font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {regularLocations.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="text-center text-[#c4a882] py-8"
                  >
                    No locations yet. Add one to get started.
                  </td>
                </tr>
              ) : (
                regularLocations.map((location) => (
                  <tr
                    key={location.id}
                    className="border-b border-[#5c3a1e]/50"
                  >
                    <td className="py-3 text-[#f5ede0]">
                      {editingId === location.id ? (
                        <input
                          type="text"
                          value={editForm.locationName}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              locationName: e.target.value,
                            }))
                          }
                          className="bg-[#1e1410] border border-[#5c3a1e] rounded px-2 py-1 text-[#f5ede0] text-sm w-full"
                        />
                      ) : (
                        location.locationName
                      )}
                    </td>
                    <td className="py-3 text-[#f5ede0]">
                      {editingId === location.id ? (
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={editForm.deliveryFee}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              deliveryFee: e.target.value,
                            }))
                          }
                          className="bg-[#1e1410] border border-[#5c3a1e] rounded px-2 py-1 text-[#f5ede0] text-sm w-24"
                        />
                      ) : (
                        `₱${location.deliveryFee}`
                      )}
                    </td>
                    <td className="py-3">
                      {editingId === location.id ? (
                        <button
                          onClick={() =>
                            setEditForm((f) => ({ ...f, inStock: !f.inStock }))
                          }
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            editForm.inStock
                              ? "bg-green-900 text-green-200"
                              : "bg-red-900 text-red-200"
                          }`}
                        >
                          {editForm.inStock ? "Active" : "Disabled"}
                        </button>
                      ) : location.inStock ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-900 text-green-200">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-900 text-red-200">
                          Disabled
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      {editingId === location.id ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={handleSaveEdit}
                            disabled={saving}
                            className="text-green-400 hover:text-green-300 text-sm font-medium disabled:opacity-50"
                          >
                            {saving ? "Saving..." : "Save"}
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-gray-400 hover:text-gray-300 text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => handleEdit(location)}
                            className="text-[#c4a882] hover:text-[#f5ede0] text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(location.id)}
                            className="text-red-400 hover:text-red-300 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}