"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Car, Search, X } from "lucide-react";

interface VehicleModel {
  id: string;
  name: string;
}

interface VehicleMake {
  id: string;
  name: string;
  models: VehicleModel[];
}

export function VehicleSearchWidget() {
  const router = useRouter();
  const currentParams = useSearchParams();
  const [vehicles, setVehicles] = useState<VehicleMake[]>([]);
  const [makeId, setMakeId] = useState(currentParams.get("vehicleMakeId") || "");
  const [modelId, setModelId] = useState(currentParams.get("vehicleModelId") || "");
  const [year, setYear] = useState(currentParams.get("year") || "");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/vehicles")
      .then((response) => response.json())
      .then((result) => setVehicles(result.data || []))
      .finally(() => setIsLoading(false));
  }, []);

  const updateVehicleFilters = (clear = false) => {
    const params = new URLSearchParams(currentParams.toString());
    ["vehicleMakeId", "vehicleModelId", "year", "page"].forEach((key) => params.delete(key));
    if (!clear) {
      if (makeId) params.set("vehicleMakeId", makeId);
      if (modelId) params.set("vehicleModelId", modelId);
      if (year) params.set("year", year);
    }
    router.push(`/products?${params.toString()}`);
  };

  const selectedMake = vehicles.find((vehicle) => vehicle.id === makeId);
  const hasVehicleFilter = Boolean(makeId || modelId || year);

  return (
    <section className="mb-7 rounded-3xl border border-white/10 bg-zinc-900/70 p-5 shadow-xl shadow-black/10 backdrop-blur-xl sm:p-6">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Car size={19} className="text-amber-600" />
          <div>
            <h3 className="text-sm font-black text-white">تأكد من توافق القطعة مع سيارتك</h3>
            <p className="mt-0.5 text-xs text-zinc-500">اختيار الموديل يجعل النتائج أكثر دقة.</p>
          </div>
        </div>
        {hasVehicleFilter && (
          <button
            type="button"
            onClick={() => {
              setMakeId(""); setModelId(""); setYear(""); updateVehicleFilters(true);
            }}
            className="flex items-center gap-1 text-xs font-bold text-red-600"
          >
            <X size={14} /> مسح
          </button>
        )}
      </div>

      <form
        onSubmit={(event) => { event.preventDefault(); updateVehicleFilters(); }}
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <select
          value={makeId}
          onChange={(event) => { setMakeId(event.target.value); setModelId(""); }}
          disabled={isLoading}
          className="h-12 rounded-xl border border-white/10 bg-zinc-950 px-3 text-sm text-zinc-200 outline-none transition focus:border-amber-400/60 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">ماركة السيارة</option>
          {vehicles.map((make) => <option key={make.id} value={make.id}>{make.name}</option>)}
        </select>
        <select
          value={modelId}
          onChange={(event) => setModelId(event.target.value)}
          disabled={!makeId || isLoading}
          className="h-12 rounded-xl border border-white/10 bg-zinc-950 px-3 text-sm text-zinc-200 outline-none transition focus:border-amber-400/60 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">الموديل</option>
          {selectedMake?.models.map((model) => <option key={model.id} value={model.id}>{model.name}</option>)}
        </select>
        <input
          type="number"
          min="1950"
          max={new Date().getFullYear() + 1}
          value={year}
          onChange={(event) => setYear(event.target.value)}
          placeholder="سنة الصنع"
          className="h-12 rounded-xl border border-white/10 bg-zinc-950 px-3 text-sm text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-amber-400/60"
        />
        <button className="flex h-12 items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 text-sm font-black text-zinc-950 transition hover:bg-amber-300">
          <Search size={16} /> تطبيق
        </button>
      </form>
    </section>
  );
}
