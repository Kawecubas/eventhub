"use client";

import { useState } from "react";

interface GenerateGenericLinkButtonProps {
  eventId: string;
}

export default function GenerateGenericLinkButton({ eventId }: GenerateGenericLinkButtonProps) {
  const [link, setLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateLink = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/eventos/${encodeURIComponent(eventId)}/link-publico`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Erro ao gerar link");
      }

      const data = await response.json();
      setLink(data.link);
    } catch (err) {
      setError("Erro ao gerar link, tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (link) {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleGenerateLink}
        disabled={loading}
        title="Gera um link público de acesso ao evento, sem vincular a um convidado específico"
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition"
      >
        🔗 {loading ? "Gerando..." : "Gerar link sem convidado"}
      </button>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {link && (
        <div className="flex items-center gap-2 mt-2">
          <input
            type="text"
            readOnly
            value={link}
            className="flex-1 px-3 py-2 border rounded-lg text-sm bg-gray-50"
          />
          <button
            onClick={handleCopy}
            className="px-3 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-sm transition"
          >
            {copied ? "Copiado!" : "Copiar"}
          </button>
        </div>
      )}
    </div>
  );
}
