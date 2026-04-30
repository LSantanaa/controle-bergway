"use client";

import { useEffect, useRef, useState } from "react";

import type { Customer } from "@/lib/types";

type CustomerOption = Pick<Customer, "id" | "name" | "trade_name" | "city" | "phone">;

interface CustomerSearchProps {
  resetSignal?: number;
}

function getCustomerLabel(customer: CustomerOption) {
  return customer.trade_name || customer.name;
}

export function CustomerSearch({ resetSignal = 0 }: CustomerSearchProps) {
  const [query, setQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);
  const [results, setResults] = useState<CustomerOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const cacheRef = useRef<Map<string, CustomerOption[]>>(new Map());

  useEffect(() => {
    setQuery("");
    setSelectedCustomer(null);
    setResults([]);
    setError("");
    setLoading(false);
    setIsOpen(false);
  }, [resetSignal]);

  useEffect(() => {
    const term = query.trim();
    setError("");

    if (selectedCustomer && term === getCustomerLabel(selectedCustomer)) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    if (term.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    if (cacheRef.current.has(term)) {
      setResults(cacheRef.current.get(term) ?? []);
      setIsOpen(true);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);

      try {
        const response = await fetch(
          `/api/customers/search?q=${encodeURIComponent(term)}&limit=8`,
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Erro ao buscar clientes.");
        }

        const items = Array.isArray(data) ? data : [];
        cacheRef.current.set(term, items);
        setResults(items);
        setIsOpen(true);
      } catch (err) {
        setResults([]);
        setIsOpen(false);
        setError(err instanceof Error ? err.message : "Erro ao buscar clientes.");
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, selectedCustomer]);

  function selectCustomer(customer: CustomerOption) {
    setSelectedCustomer(customer);
    setQuery(getCustomerLabel(customer));
    setResults([]);
    setIsOpen(false);
  }

  return (
    <div className="field customer-search">
      <label htmlFor="customer_search">Cliente para saída</label>
      <input
        readOnly
        type="hidden"
        id="customer_id"
        name="customer_id"
        value={selectedCustomer?.id ?? ""}
      />
      <input
        autoComplete="off"
        className="input"
        id="customer_search"
        placeholder="Digite ao menos 2 letras do cliente"
        value={query}
        onBlur={() => setTimeout(() => setIsOpen(false), 120)}
        onChange={(event) => {
          setSelectedCustomer(null);
          setQuery(event.target.value);
        }}
        onFocus={() => {
          if (results.length) {
            setIsOpen(true);
          }
        }}
      />

      {loading && query.trim().length >= 2 && (
        <p className="muted" style={{ marginTop: "0.5rem" }}>Buscando clientes...</p>
      )}

      {error && <p style={{ marginTop: "0.5rem", color: "#b33f3f" }}>{error}</p>}

      {isOpen && !loading && (
        <div className="search-results" role="listbox" aria-label="Clientes encontrados">
          {results.length ? (
            results.map((customer) => (
              <button
                className="search-result"
                key={customer.id}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectCustomer(customer)}
              >
                <strong>{getCustomerLabel(customer)}</strong>
                <span>
                  {[customer.name !== customer.trade_name ? customer.name : "", customer.city, customer.phone]
                    .filter(Boolean)
                    .join(" - ")}
                </span>
              </button>
            ))
          ) : (
            <div className="search-result-empty">Nenhum cliente ativo encontrado.</div>
          )}
        </div>
      )}
    </div>
  );
}
