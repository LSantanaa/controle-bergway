"use client";

import { useEffect, useState, useRef } from "react";

interface BarrelInfo {
  id: string;
  code: string;
  capacity_liters: number;
  status: "in" | "out";
  notes: string | null;
  is_active: boolean;
}

interface BarrelSearchProps {
  onBarrelSelect?: (barrel: BarrelInfo | null) => void;
  resetSignal?: number;
}

export function BarrelSearch({ onBarrelSelect, resetSignal = 0 }: BarrelSearchProps) {
  const [code, setCode] = useState("");
  const [barrel, setBarrel] = useState<BarrelInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const cacheRef = useRef<Map<string, BarrelInfo | null>>(new Map());

  useEffect(() => {
    setCode("");
    setBarrel(null);
    setError("");
    setLoading(false);
    onBarrelSelect?.(null);
  }, [resetSignal, onBarrelSelect]);

  useEffect(() => {
    setError("");

    const trimmedCode = code.trim().toUpperCase();

    if (trimmedCode.length < 2) {
      setBarrel(null);
      onBarrelSelect?.(null);
      return;
    }

    // Check cache first
    if (cacheRef.current.has(trimmedCode)) {
      const cached = cacheRef.current.get(trimmedCode);
      setBarrel(cached ?? null);
      onBarrelSelect?.(cached ?? null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/barrels/search?code=${encodeURIComponent(trimmedCode)}`
        );
        const data = await response.json();

        if (!response.ok || !data) {
          setBarrel(null);
          cacheRef.current.set(trimmedCode, null);
          onBarrelSelect?.(null);
        } else {
          setBarrel(data);
          cacheRef.current.set(trimmedCode, data);
          onBarrelSelect?.(data);
        }
      } catch (err) {
        setBarrel(null);
        onBarrelSelect?.(null);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [code, onBarrelSelect]);

  const isAvailable = barrel?.status === "in";

  return (
    <div className="field">
      <label htmlFor="barrel_code">Código do barril</label>
      <input
        className="input"
        id="barrel_code"
        name="barrel_code"
        placeholder="Ex: BR001"
        required
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
      />

      {loading && code.trim().length >= 2 && (
        <p className="muted" style={{ marginTop: "0.5rem" }}>Buscando...</p>
      )}

      {error && (
        <p style={{ marginTop: "0.5rem", color: "#d32f2f" }}>{error}</p>
      )}

      {code.trim().length >= 2 && !barrel && !loading && (
        <p style={{ marginTop: "0.5rem", color: "#d32f2f" }}>
          Barril não encontrado
        </p>
      )}

      {barrel && (
        <div
          style={{
            marginTop: "0.75rem",
            padding: "0.75rem",
            borderRadius: "6px",
            backgroundColor: isAvailable ? "#e8f5e9" : "#fff3e0",
            border: `1px solid ${isAvailable ? "#4caf50" : "#ff9800"}`,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>
            {barrel.code} • {barrel.capacity_liters}L
          </div>
          {barrel.notes && (
            <div style={{ fontSize: "0.9rem", marginBottom: "0.25rem" }}>
              {barrel.notes}
            </div>
          )}
          <div style={{ fontSize: "0.85rem", color: "#666" }}>
            {isAvailable ? (
              <span style={{ color: "#4caf50", fontWeight: 500 }}>✓ Disponível</span>
            ) : (
              <span style={{ color: "#ff9800", fontWeight: 500 }}>
                ⚠ Já está com cliente - registre entrada quando retornar
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
