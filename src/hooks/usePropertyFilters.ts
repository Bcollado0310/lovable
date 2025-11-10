import { useState, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';

export interface PropertyFilters {
  search: string;
  minReturn: number;
  maxInvestment: number;
  riskMin: number;
  riskMax: number;
  fundingStatus: string;
  distributionFreq: string;
  sortBy: string;
  propertyType: string;
  status: string;
}

export interface SavedSearch {
  id: string;
  name: string;
  filters: PropertyFilters;
  emailAlert: boolean;
  createdAt: string;
}

const defaultFilters: PropertyFilters = {
  search: '',
  minReturn: 0,
  maxInvestment: 1000000,
  riskMin: 1,
  riskMax: 10,
  fundingStatus: 'all',
  distributionFreq: 'all',
  sortBy: 'recommended',
  propertyType: 'all',
  status: 'all'
};

export function usePropertyFilters() {
  const [filters, setStoredFilters] = useLocalStorage<PropertyFilters>('propertyFilters', defaultFilters);
  const [savedSearches, setSavedSearches] = useLocalStorage<SavedSearch[]>('savedSearches', []);
  const [viewMode, setViewMode] = useLocalStorage<'list' | 'map'>('propertyViewMode', 'list');
  
  const updateFilter = (key: keyof PropertyFilters, value: string | number) => {
    setStoredFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setStoredFilters(defaultFilters);
  };

  const saveSearch = (name: string, emailAlert: boolean = false) => {
    const newSearch: SavedSearch = {
      id: Date.now().toString(),
      name,
      filters: { ...filters },
      emailAlert,
      createdAt: new Date().toISOString()
    };
    setSavedSearches(prev => [...prev, newSearch]);
    return newSearch;
  };

  const deleteSavedSearch = (id: string) => {
    setSavedSearches(prev => prev.filter(search => search.id !== id));
  };

  const loadSavedSearch = (search: SavedSearch) => {
    setStoredFilters(search.filters);
  };

  const hasActiveFilters = () => {
    return Object.entries(filters).some(([key, value]) => {
      const defaultValue = defaultFilters[key as keyof PropertyFilters];
      return value !== defaultValue;
    });
  };

  return {
    filters,
    updateFilter,
    resetFilters,
    viewMode,
    setViewMode,
    savedSearches,
    saveSearch,
    deleteSavedSearch,
    loadSavedSearch,
    hasActiveFilters
  };
}