"use client"

import { useTranslation } from "react-i18next"
import { useRouter, useSearchParams } from "next/navigation"

const COUNTRIES = [
  "All Regions",
  "Japan",
  "Indonesia",
  "China",
  "Philippines",
  "Iran",
  "Turkey",
  "Peru",
  "USA",
  "California",
  "Alaska",
  "Italy",
  "Mexico",
  "Chile",
  "New Zealand",
  "Taiwan",
  "Greece"
];

export function AdvancedSearch() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentRegion = searchParams.get("region") || "";

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const region = e.target.value;
    if (!region || region === "All Regions") {
      router.push(window.location.pathname);
    } else {
      router.push(`${window.location.pathname}?region=${encodeURIComponent(region)}`);
    }
  };

  return (
    <div className="w-full relative">
      <select
        suppressHydrationWarning
        value={currentRegion || "All Regions"}
        onChange={handleCountryChange}
        className="w-full px-3 py-2 bg-slate-800 border border-cyan-500/30 rounded-lg text-white appearance-none cursor-pointer focus:outline-none focus:border-cyan-500"
        aria-label={t("nav.selectCountry")}
      >
        <option suppressHydrationWarning value="" disabled className="text-slate-400">
          {t("nav.selectCountry")}
        </option>
        {COUNTRIES.map((country) => (
          <option key={country} value={country === "All Regions" ? "" : country}>
            {country}
          </option>
        ))}
      </select>
    </div>
  )
}

