import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";

export interface WishlistEntry {
  id: string;
  title: string;
  address: string;
  city: string;
  property_type: string;
  property_status: string;
  target_funding: number;
  current_funding: number;
  funding_deadline?: string;
  expected_annual_return: number;
  minimum_investment: number;
  image?: string;
}

const STORAGE_KEY = "investor-wishlist";

export function useWishlist() {
  const [wishlist, setWishlist] = useLocalStorage<WishlistEntry[]>(STORAGE_KEY, []);

  const isInWishlist = useCallback(
    (propertyId: string) => wishlist.some((item) => item.id === propertyId),
    [wishlist]
  );

  const toggleWishlist = useCallback(
    (entry: WishlistEntry) => {
      setWishlist((prev) => {
        const exists = prev.some((item) => item.id === entry.id);
        if (exists) {
          return prev.filter((item) => item.id !== entry.id);
        }
        return [...prev, entry];
      });
    },
    [setWishlist]
  );

  const removeFromWishlist = useCallback(
    (propertyId: string) => {
      setWishlist((prev) => prev.filter((item) => item.id !== propertyId));
    },
    [setWishlist]
  );

  const wishlistLookup = useMemo(() => {
    const map = new Map<string, WishlistEntry>();
    for (const item of wishlist) {
      map.set(item.id, item);
    }
    return map;
  }, [wishlist]);

  return {
    wishlist,
    wishlistLookup,
    toggleWishlist,
    removeFromWishlist,
    isInWishlist
  };
}
