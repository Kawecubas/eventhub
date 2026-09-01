"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Html5QrcodeScanner } from "html5-qrcode";

type CheckinResult = {
  ok: boolean;
  alreadyCheckedIn?: boolean;
  guest?: { name: string; company: string; participants: number };
  error?: string;
};

export default function CheckinPage() {
  const params = useParams<{ id: string }>();
  const [result, setResult] = useState<CheckinResult | null>(null);
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    if (!scanning) return;

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: 250 },
      false
    );

    scanner.render(
      async (decodedText) => {
        setScanning(false);
        scanner.clear();

        const res = await fetch(`/api/eventos/${params.id}/checkin`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ checkinToken: decodedText }),
        });

        const data: CheckinResult = await res.json();
        setResult(data);
      },
      () => {
        // erro de leitura contínua — ignorar silenciosamente
      }
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [scanning, params.id]);

  const reiniciarScanner = () => {
    setResult(null);
    setScanning(true);
  };

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>
        Check-in do Evento
      </h1>

      {scanning && <div id="qr-reader" style={{ width: "100%" }} />}

      {result && (
        <div
          style={{
            marginTop: 24,
            padding: 20,
            borderRadius: 12,
            background: result.ok ? "#e6f9ec" : "#fdeaea",
            border: `1px solid ${result.ok ? "#34c759" : "#ff3b30"}`,
          }}
        >
          {result.ok ? (
            <>
              <p style={{ fontSize: 18, fontWeight: 600 }}>
                {result.alreadyCheckedIn
                  ? "⚠️ Já registrado anteriormente"
                  : "✅ Presença confirmada!"}
              </p>
              <p>Nome: {result.guest?.name}</p>
              <p>Empresa: {result.guest?.company || "—"}</p>
              <p>Participantes: {result.guest?.participants}</p>
            </>
          ) : (
            <p style={{ color: "#ff3b30" }}>❌ {result.error}</p>
          )}

          <button
            onClick={reiniciarScanner}
            style={{
              marginTop: 16,
              padding: "10px 20px",
              borderRadius: 8,
              background: "#173b57",
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
          >
            Ler próximo QR Code
          </button>
        </div>
      )}
    </div>
  );
}
