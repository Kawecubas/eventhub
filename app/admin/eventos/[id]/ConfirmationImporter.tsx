"use client";

import { useState } from "react";
import type { EventGuest } from "@/lib/event-platform-store";
import { MAX_CONFIRMATION_ROWS, type ConfirmationRow, type ConfirmationResult } from "@/lib/gambini-confirmations";

type Preview = {
  version: string;
  results: ConfirmationResult[];
  imported: Array<Partial<EventGuest> & { id: string }>;
};

function header(value: string) {
  return value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
}

export default function ConfirmationImporter({ eventId, onImported }: {
  eventId: string;
  onImported: (guests: Preview["imported"]) => void;
}) {
  const [rows, setRows] = useState<ConfirmationRow[]>([]);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const errors = preview?.results.filter((row) => row.error) ?? [];
  const validCount = (preview?.results.length ?? 0) - errors.length;

  async function submit(input: ConfirmationRow[], version?: string) {
    const response = await fetch(`/api/eventos/${encodeURIComponent(eventId)}/convidados/confirmacoes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: input, version }),
    });
    const data = await response.json();
    if (!response.ok) {
      if (response.status === 409) setPreview(null);
      throw new Error(data.error || "Falha ao processar o arquivo.");
    }
    const result = data as Preview;
    setPreview(result);
    if (version !== undefined) {
      onImported(result.imported);
      setMessage(`${result.imported.length} convite(s) atualizado(s). ${result.results.length - result.imported.length} linha(s) rejeitada(s).`);
    }
  }

  async function open(file: File) {
    setBusy(true);
    setRows([]);
    setPreview(null);
    setMessage("");
    try {
      if (!/\.(csv|xlsx)$/i.test(file.name) || file.size > 2_000_000) {
        throw new Error("Selecione um CSV ou XLSX de até 2 MB.");
      }
      const xlsx = await import("xlsx");
      const workbook = xlsx.read(await file.arrayBuffer(), { type: "array", raw: true, sheets: 0, codepage: 65001, dateNF: "dd/mm/yyyy" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!sheet?.["!ref"]) throw new Error("O arquivo está vazio.");
      const range = xlsx.utils.decode_range(sheet["!ref"]);
      if (range.e.r > MAX_CONFIRMATION_ROWS || range.e.c > 49) {
        throw new Error("Use até 1.000 linhas de dados e 50 colunas.");
      }
      const [headers = [], ...records] = xlsx.utils.sheet_to_json<string[]>(sheet, {
        header: 1, raw: false, defval: "", blankrows: true, range: 0,
      });
      const columns = headers.map(header);
      const email = columns.indexOf("email");
      const phone = columns.findIndex((column) => ["celular", "telefone", "whatsapp"].includes(column));
      const slot = columns.findIndex((column) => ["dataehorario", "datahorario"].includes(column));
      const date = columns.indexOf("data");
      const time = columns.indexOf("hora");
      const separate = date >= 0 && time >= 0;
      if ((email < 0 && phone < 0) || (!separate && slot < 0)) {
        throw new Error("Inclua um contato e as colunas DATA e HORA.");
      }
      const input = records.flatMap((record, index) => {
        const day = (record[date] ?? "").trim();
        const hours = (record[time] ?? "").trim();
        const combined = (record[slot] ?? "").trim();
        if (separate && !day && !hours) return [];
        const row = {
          row: index + 2,
          email: (record[email] ?? "").trim(),
          phone: (record[phone] ?? "").trim(),
          slot: separate ? `${day} ${hours}`.trim() : combined,
        };
        return row.email || row.phone || row.slot ? [row] : [];
      });
      if (!input.length) throw new Error("Preencha DATA e HORA nas linhas que deseja confirmar.");
      setRows(input);
      await submit(input);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível ler o arquivo.");
    } finally {
      setBusy(false);
    }
  }

  async function process(version?: string) {
    setBusy(true);
    setMessage("");
    try {
      await submit(rows, version);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao processar o arquivo.");
    } finally {
      setBusy(false);
    }
  }

  function downloadErrors() {
    const report = errors.map(({ row, error }) => `Linha ${row}: ${error}`).join("\r\n");
    const url = URL.createObjectURL(new Blob([report], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "erros-confirmacoes-gambini.txt";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="importer">
      <h3>Importar confirmações</h3>
      <p>Use a planilha do botão Exportar lista de convidados. Preencha DATA e HORA somente para os convites a confirmar, copiando os valores da aba Horários disponíveis. Envie a planilha em XLSX ou CSV UTF-8.</p>
      <a href={`/api/eventos/${encodeURIComponent(eventId)}/exportar-convidados`}>Baixar lista como modelo XLSX</a>
      <div className="import-actions">
        <input aria-label="Planilha de confirmações" type="file" accept=".csv,.xlsx" disabled={busy}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void open(file);
          }} />
      </div>
      {busy && <p role="status">Processando confirmações…</p>}
      {message && <p role="status">{message}</p>}
      {rows.length > 0 && !preview && !busy && <button type="button" onClick={() => process()}>Gerar nova prévia</button>}
      {preview && (
        <>
          <p>{preview.imported.length ? "Resultado" : "Prévia"} · {validCount} válida(s), {errors.length} rejeitada(s).</p>
          <div className="import-preview">
            <table>
              <thead><tr><th>Linha</th><th>Contato</th><th>Convidado</th><th>Data e horário</th><th>Situação</th></tr></thead>
              <tbody>{preview.results.slice(0, 100).map((row) => (
                <tr key={row.row} className={row.error ? "invalid" : "valid"}>
                  <td>{row.row}</td><td>{[row.email, row.phone].filter(Boolean).join(" / ")}</td>
                  <td>{row.guestName || "—"}</td><td>{row.slot}</td>
                  <td>{row.error || (preview.imported.length ? "Confirmado" : "Pronto")}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          {preview.results.length > 100 && <p>Exibindo as primeiras 100 linhas.</p>}
          <div className="import-footer">
            {errors.length > 0 && <button type="button" onClick={downloadErrors}>Baixar relatório de erros</button>}
            {!preview.imported.length && <button className="primary" type="button" disabled={busy || !validCount}
              onClick={() => process(preview.version)}>Confirmar {validCount} convite(s)</button>}
          </div>
        </>
      )}
    </div>
  );
}
