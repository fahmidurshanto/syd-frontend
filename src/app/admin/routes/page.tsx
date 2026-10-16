"use client";

import { useEffect, useState } from "react";
import {
  getAdminPlacesApi,
  savePlaceRouteApi,
  deletePlaceRouteApi,
  seedDefaultRoutesApi,
  type PlaceRoute,
} from "@/lib/api";
import {
  RoutesHeader,
  RoutesTable,
  RouteModal,
} from "./components";

export default function AdminRoutesPage() {
  const [places, setPlaces] = useState<PlaceRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingRoute, setEditingRoute] = useState<Partial<PlaceRoute> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchPlaces = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const data = await getAdminPlacesApi(searchTerm.trim() || undefined, 150);
      setPlaces(data);
    } catch (err: any) {
      console.error("Failed loading routes:", err);
      setStatusMessage({ type: "error", text: "Failed to load routes from server." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaces();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPlaces();
  };

  const handleOpenAddModal = () => {
    setEditingRoute({
      firstPlace: "Sydney Airport T1",
      lastPlace: "",
      increaseFarePerPerson: {
        taxi: 5,
        executive: 5,
        suv: 10,
      },
      currency: "AUD",
      distanceKm: 15,
      durationMin: 25,
      vehicleAndFares: {
        taxi: 75,
        executive: 95,
        suv: 115,
      },
      isActive: true,
      firstPlaceDetails: {
        address: "Airport Dr, Mascot NSW 2020",
        code: "SYD",
      },
      lastPlaceDetails: {
        address: "",
      },
    });
  };

  const handleToggleVehicle = (slug: string) => {
    if (!editingRoute) return;
    const currentFares = { ...(editingRoute.vehicleAndFares || editingRoute.vehicleFares || {}) };
    const currentPerPerson =
      typeof editingRoute.increaseFarePerPerson === "object" && editingRoute.increaseFarePerPerson !== null
        ? { ...(editingRoute.increaseFarePerPerson as Record<string, number>) }
        : {};

    if (currentFares[slug] !== undefined) {
      delete currentFares[slug];
      delete currentPerPerson[slug];
    } else {
      currentFares[slug] = 75;
      currentPerPerson[slug] = 5;
    }

    setEditingRoute({
      ...editingRoute,
      vehicleAndFares: currentFares,
      increaseFarePerPerson: currentPerPerson,
    });
  };

  const handleVehicleFareChange = (slug: string, amount: number) => {
    if (!editingRoute) return;
    const currentFares = { ...(editingRoute.vehicleAndFares || editingRoute.vehicleFares || {}) };
    currentFares[slug] = amount;
    setEditingRoute({
      ...editingRoute,
      vehicleAndFares: currentFares,
    });
  };

  const handleVehiclePaxSurchargeChange = (slug: string, amount: number) => {
    if (!editingRoute) return;
    const currentPerPerson =
      typeof editingRoute.increaseFarePerPerson === "object" && editingRoute.increaseFarePerPerson !== null
        ? { ...(editingRoute.increaseFarePerPerson as Record<string, number>) }
        : {};
    currentPerPerson[slug] = amount;
    setEditingRoute({
      ...editingRoute,
      increaseFarePerPerson: currentPerPerson,
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoute || !editingRoute.firstPlace || !editingRoute.lastPlace) {
      alert("Origin and Destination are required");
      return;
    }

    const vFares = editingRoute.vehicleAndFares || editingRoute.vehicleFares || {};
    if (Object.keys(vFares).length === 0) {
      alert("Please select at least 1 vehicle type and provide a fare");
      return;
    }

    setIsSaving(true);

    const payload: Partial<PlaceRoute> = {
      ...editingRoute,
      firstPlace: editingRoute.firstPlace.trim(),
      lastPlace: editingRoute.lastPlace.trim(),
      vehicleAndFares: vFares,
      increaseFarePerPerson:
        typeof editingRoute.increaseFarePerPerson === "object"
          ? editingRoute.increaseFarePerPerson
          : {},
    };

    const result = await savePlaceRouteApi(payload);
    if (result.success) {
      setEditingRoute(null);
      setStatusMessage({ type: "success", text: "Route and vehicle fares saved successfully." });
      await fetchPlaces();
    } else {
      alert(`Failed to save route: ${result.error || "Check backend connectivity"}`);
    }
    setIsSaving(false);
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!confirm("Are you sure you want to delete this route fare?")) return;
    const ok = await deletePlaceRouteApi(id);
    if (ok) {
      setStatusMessage({ type: "success", text: "Route deleted successfully." });
      fetchPlaces();
    } else {
      alert("Failed to delete route.");
    }
  };

  const handleToggleActive = async (route: PlaceRoute) => {
    const updated = { ...route, isActive: !route.isActive };
    const res = await savePlaceRouteApi(updated);
    if (res.success) {
      setPlaces((prev) =>
        prev.map((r) => (r._id === route._id ? { ...r, isActive: !route.isActive } : r))
      );
    } else {
      alert(`Failed to toggle status: ${res.error}`);
    }
  };

  const handleSeed = async () => {
    if (!confirm("Seed default Sydney airport and landmark routes?")) return;
    setIsSeeding(true);
    const res = await seedDefaultRoutesApi();
    if (res.success) {
      setStatusMessage({ type: "success", text: "Default routes seeded successfully." });
      await fetchPlaces();
    } else {
      alert(`Seeding failed: ${res.error}`);
    }
    setIsSeeding(false);
  };

  return (
    <div className="space-y-6">
      <RoutesHeader
        totalRoutes={places.length}
        searchTerm={searchTerm}
        isSeeding={isSeeding}
        onSearchChange={setSearchTerm}
        onSearchSubmit={handleSearchSubmit}
        onAddNew={handleOpenAddModal}
        onRefresh={fetchPlaces}
        onSeed={handleSeed}
        statusMessage={statusMessage}
      />

      <RoutesTable
        routes={places}
        loading={loading}
        onEdit={(r) => setEditingRoute(r)}
        onDelete={handleDelete}
        onToggleActive={handleToggleActive}
      />

      {editingRoute && (
        <RouteModal
          route={editingRoute}
          isSaving={isSaving}
          onClose={() => setEditingRoute(null)}
          onSave={handleSave}
          onChange={setEditingRoute}
          onToggleVehicle={handleToggleVehicle}
          onVehicleFareChange={handleVehicleFareChange}
          onVehiclePaxSurchargeChange={handleVehiclePaxSurchargeChange}
        />
      )}
    </div>
  );
}
