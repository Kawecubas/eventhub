"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function BackupPage() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"merge" | "replace">("merge");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!file) return;
    setLoading(true);
    setMessage("");
    try {
      const text = await file.text();
      const backup = JSON.parse(text);
      const response = await fetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backup, mode }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Falha ao importar backup");
      setMessage(`${data.imported} evento(s) importado(s) com sucesso.`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Arquivo inválido.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 760, margin: "40px auto", padding: 24 }}>
      <Link href="/admin/eventos">← Voltar aos eventos</Link>
      <h1>Importar backup</h1>
      <p>
        Selecione um arquivo TXT ou JSON exportado pelo EventHub. O conteúdo é
        JSON válido, mesmo quando a extensão usada for .txt.
      </p>
      <form onSubmit={submit} style={{ display: "grid", gap: 18 }}>
        <label>
          Arquivo de backup
          <input
            type="file"
            accept=".txt,.json,application/json,text/plain"
            required
            onChange={(event) => setFile(event.target.files?.[0] || null)}
          />
        </label>
        <label>
          Modo de importação
          <select
            value={mode}
            onChange={(event) =>
              setMode(event.target.value as "merge" | "replace")
            }
          >
            <option value="merge">Mesclar e atualizar eventos existentes</option>
            <option value="replace">Apagar dados atuais e restaurar o backup</option>
          </select>
        </label>
        <button type="submit" disabled={loading || !file}>
          {loading ? "Importando..." : "Importar backup"}
        </button>
      </form>
      {message && <p>{message}</p>}
    </main>
  );
}
