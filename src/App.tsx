import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import type { IScannerControls } from "@zxing/browser";
import { supabase } from "./supabase";
import type { Product } from "./types";
import logoDuca from "./assets/logo-duca.png";

const MAX_VISIBLE_PRODUCTS = 100;

function formatPrice(price: number) {
  return price.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2
  });
}

type ScanResult =
  | { status: "idle" }
  | { status: "found"; product: Product }
  | { status: "notFound"; code: string };

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [result, setResult] = useState<ScanResult>({ status: "idle" });

  const [cameraError, setCameraError] = useState<string | null>(null);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState("");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // El callback del escáner se crea una sola vez; para que "vea" la lista de
  // productos actualizada y el último código escaneado, usamos refs.
  const productsRef = useRef<Product[]>([]);
  const lastScanRef = useRef<{ code: string; t: number }>({ code: "", t: 0 });

  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  // ---- Carga del catálogo (una sola vez; después todo es local) ----
  const loadProducts = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    const all: Product[] = [];
    const pageSize = 1000;
    let from = 0;

    try {
      while (true) {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .order("name", { ascending: true })
          .range(from, from + pageSize - 1);

        if (error) {
          setLoadError(error.message);
          break;
        }

        all.push(...((data as Product[]) || []));
        if (!data || data.length < pageSize) break;
        from += pageSize;
      }

      if (all.length > 0) setProducts(all);
    } catch (e) {
      setLoadError((e as Error).message);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // ---- Sonido de confirmación ----
  function beep(ok: boolean) {
    try {
      const AudioCtx =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioCtxRef.current) audioCtxRef.current = new AudioCtx();
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = ok ? 900 : 200;
      gain.gain.value = 0.07;
      osc.start();
      setTimeout(() => osc.stop(), 120);
    } catch {
      // el sonido es opcional, nunca debe frenar el escaneo
    }
  }

  // ---- Búsqueda de un código (en memoria: rápido y funciona offline) ----
  const handleCode = useCallback((raw: string) => {
    const code = raw.trim();
    if (!code) return;

    // Evita procesar el mismo código repetido en menos de 1,2 s.
    const now = Date.now();
    if (code === lastScanRef.current.code && now - lastScanRef.current.t < 1200) return;
    lastScanRef.current = { code, t: now };

    const list = productsRef.current;
    let found = list.find((p) => String(p.barcode).trim() === code);
    if (!found) {
      found = list.find(
        (p) =>
          Array.isArray(p.sub_barcodes) &&
          p.sub_barcodes.map((s) => String(s).trim()).includes(code)
      );
    }

    if (found) {
      setResult({ status: "found", product: found });
      beep(true);
    } else {
      setResult({ status: "notFound", code });
      beep(false);
    }
  }, []);

  // ---- Cámara: escaneo continuo con la cámara trasera ----
  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    let controls: IScannerControls | null = null;
    let cancelled = false;

    (async () => {
      try {
        controls = await reader.decodeFromConstraints(
          { video: { facingMode: { ideal: "environment" } } },
          videoRef.current!,
          (res) => {
            if (res) handleCode(res.getText());
          }
        );
        if (cancelled) controls.stop();
      } catch (e) {
        const err = e as Error;
        if (err.name === "NotAllowedError") {
          setCameraError(
            "No se dio permiso para usar la cámara. Activalo en el candado de la barra de direcciones y recargá."
          );
        } else if (err.name === "NotFoundError") {
          setCameraError("No se encontró ninguna cámara en este dispositivo.");
        } else {
          setCameraError("No se pudo abrir la cámara: " + err.message);
        }
      }
    })();

    return () => {
      cancelled = true;
      controls?.stop();
    };
  }, [handleCode]);

  // ---- Lista para el panel "Buscar" ----
  const filtered = useMemo(() => {
    const clean = searchText.trim().toLowerCase();
    if (!clean) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(clean) ||
        p.barcode.toLowerCase().includes(clean)
    );
  }, [products, searchText]);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <img src={logoDuca} alt="Fiambrería Duca" className="brand-logo" />
          <span className="brand-name">Fiambrería Duca</span>
        </div>
        <button
          className="search-toggle"
          onClick={() => setSearchOpen(true)}
          aria-label="Buscar productos"
        >
          <span className="hamburger" aria-hidden="true">
            <span></span>
            <span></span>
            <span></span>
          </span>
          Buscar
        </button>
      </header>

      <main className="scanner-view">
        <div className="camera-box">
          <video ref={videoRef} className="camera-video" muted playsInline autoPlay />
          {!cameraError && (
            <div className="scan-frame" aria-hidden="true">
              <span className="scan-line"></span>
            </div>
          )}
          {cameraError && (
            <div className="camera-error">
              <p>📷</p>
              <p>{cameraError}</p>
              <button onClick={() => window.location.reload()}>Reintentar</button>
            </div>
          )}
        </div>

        <p className="hint">Apuntá la cámara al código de barras</p>

        <div className={`result result-${result.status}`}>
          {result.status === "idle" && (
            <p className="result-idle">Esperando un código…</p>
          )}

          {result.status === "found" && (
            <>
              <span className="result-name">{result.product.name}</span>
              <strong className="result-price">
                {formatPrice(result.product.price)}
              </strong>
              <span className="result-meta">
                {result.product.barcode}
                {result.product.category ? ` · ${result.product.category}` : ""}
              </span>
            </>
          )}

          {result.status === "notFound" && (
            <>
              <span className="result-notfound-title">Producto no encontrado</span>
              <span className="result-meta">Código: {result.code}</span>
            </>
          )}
        </div>

        {loading && <p className="status-line">Cargando catálogo…</p>}
        {loadError && !products.length && (
          <p className="status-line status-error">
            No se pudo cargar el catálogo: {loadError}
          </p>
        )}
      </main>

      {searchOpen && (
        <div className="search-overlay">
          <header className="search-header">
            <input
              autoFocus
              className="search-input"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Buscar por nombre o código…"
            />
            <button
              className="search-close"
              onClick={() => {
                setSearchOpen(false);
                setSearchText("");
              }}
              aria-label="Cerrar búsqueda"
            >
              ✕
            </button>
          </header>

          <p className="search-count">
            {filtered.length} producto{filtered.length === 1 ? "" : "s"}
            {filtered.length > MAX_VISIBLE_PRODUCTS &&
              ` — mostrando los primeros ${MAX_VISIBLE_PRODUCTS}`}
          </p>

          <div className="search-list">
            {filtered.slice(0, MAX_VISIBLE_PRODUCTS).map((p) => (
              <div key={p.id} className="search-item">
                <div className="search-item-info">
                  <span className="search-item-name">{p.name}</span>
                  <span className="search-item-meta">
                    {p.barcode}
                    {p.category ? ` · ${p.category}` : ""}
                  </span>
                </div>
                <strong className="search-item-price">{formatPrice(p.price)}</strong>
              </div>
            ))}

            {!filtered.length && (
              <p className="status-line">Sin resultados para “{searchText}”.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
