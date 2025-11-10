import { useState } from 'react';

export interface PropertyForComparison {
  id: string;
  title: string;
  expected_annual_return: number;
  minimum_investment: number;
  risk_rating: number;
  property_type: string;
  total_value: number;
  target_funding: number;
  current_funding: number;
  property_status: string;
  image?: string;
  images?: string[];
}

export function usePropertyCompare() {
  const [selectedProperties, setSelectedProperties] = useState<PropertyForComparison[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  const addToCompare = (property: PropertyForComparison & { images?: string[] }) => {
    if (selectedProperties.length < 3 && !selectedProperties.find(p => p.id === property.id)) {
      const normalizedProperty: PropertyForComparison = {
        ...property,
        image: property.image ?? property.images?.[0],
        images: property.images
      };
      const newSelection = [...selectedProperties, normalizedProperty];
      setSelectedProperties(newSelection);
      if (newSelection.length > 1 && !isCompareOpen) {
        setIsCompareOpen(true);
      }
    }
  };

  const removeFromCompare = (propertyId: string) => {
    const newSelection = selectedProperties.filter(p => p.id !== propertyId);
    setSelectedProperties(newSelection);
    if (newSelection.length === 0) {
      setIsCompareOpen(false);
    }
  };

  const clearCompare = () => {
    setSelectedProperties([]);
    setIsCompareOpen(false);
  };

  const toggleCompare = () => {
    if (selectedProperties.length > 1) {
      setIsCompareOpen(!isCompareOpen);
    }
  };

  const isSelected = (propertyId: string) => {
    return selectedProperties.some(p => p.id === propertyId);
  };

  const canAddMore = selectedProperties.length < 3;

  return {
    selectedProperties,
    isCompareOpen,
    addToCompare,
    removeFromCompare,
    clearCompare,
    toggleCompare,
    isSelected,
    canAddMore,
    setIsCompareOpen
  };
}
