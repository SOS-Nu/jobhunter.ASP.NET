// src/hooks/useMediaQuery.ts
import { useState, useEffect } from "react";

const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => {
      setMatches(media.matches);
    };

    // Dùng addEventListener và removeEventListener thay vì addListener/removeListener đã cũ
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [matches, query]);

  return matches;
};

export default useMediaQuery;
