import React, { createContext, useContext, useState } from "react";

type FilterCtx = {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCity: string;
  setSelectedCity: (city: string) => void;
};

const FilterContext = createContext<FilterCtx | null>(null);

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("");

  return (
    <FilterContext.Provider
      value={{ searchQuery, setSearchQuery, selectedCity, setSelectedCity }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function useFilter() {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error("useFilter must be used inside <FilterProvider>");
  return ctx;
}