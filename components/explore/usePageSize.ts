import { useState, useEffect } from "react";

export function usePageSize(rowHeight = 48, offset = 220) {
  const [size, setSize] = useState(20);

  useEffect(() => {
    function calc() {
      const available = window.innerHeight - offset;
      const rows = Math.floor(available / rowHeight);
      setSize(Math.max(15, rows));
    }
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, [rowHeight, offset]);

  return size;
}
