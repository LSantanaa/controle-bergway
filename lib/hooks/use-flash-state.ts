"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export function useFlashState() {
  const searchParams = useSearchParams();
  const [flash, setFlash] = useState(() => ({
    error: searchParams.get("error") ?? "",
    success: searchParams.get("success") ?? "",
  }));

  useEffect(() => {
    setFlash({
      error: searchParams.get("error") ?? "",
      success: searchParams.get("success") ?? "",
    });
  }, [searchParams]);

  return {
    flash,
    setFlash,
  };
}
