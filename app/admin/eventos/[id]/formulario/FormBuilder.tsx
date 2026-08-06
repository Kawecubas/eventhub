"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type {
  EventFormField,
  EventFormFieldType,
  EventItem,
} from "@/lib/event-platform-store";

type Props = {
  event: EventItem;
};

const FIELD_TYPES: Array<{
  type: EventFormFieldType;
  label: string;
  defaultLabel: string;
}> = [
  { type: "content", label: "Somente texto", defaultLabel: "Novo texto" },
  { type: "short_text", label: "Texto curto", defaultLabel: "Resposta curta" },
  { type: "long_text", label: "Texto longo", defaultLabel: "Resposta detalhada" },
  { type: "select", label: "Lista de opções", defaultLabel: "Selecione uma opção" },
  { type: "checkbox", label: "Caixa de seleção", defaultLabel: "Estou de acordo" },
  { type: "event_dates", label: "Datas do evento", defaultLabel: "Escolha uma data" },
  { type: "participants", label: "Quantidade", defaultLabel: "Quantidade de participantes" },
  { type: "notes", label: "Observações", defaultLabel: "Observações" },
];

function newField(type: EventFormFieldType): EventFormField {
  const definition = FIELD_TYPES.find((item) => item.type === type)!;

  return {
    id: crypto.randomUUID(),
    type,
    label: definition.defaultLabel,
    description: type === "content" ? "Insira aqui as orientações do formulário." : "",
    placeholder: "",
    required: type === "event_dates" || type === "participants",
    visible: true,
    options: type === "select" ? ["Opção 1", "Opção 2"] : undefined,
    maxParticipants: type === "participants" ? 10 : undefined,
  };
}

export default function FormBuilder({ event }: Props) {
  const router = useRouter();
  const [fields, setFields] = useState<EventFormField[]>(event.formFields || []);
  const [selectedId, setSelectedId] = useState(fields[0]?.id || "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selected = useMemo(
    () => fields.find((field) => field.id === selectedId),
    [fields, selectedId]
  );

  function add(type: EventFormFieldType) {
    const field = newField(type);
    setFields((current) => [...current, field]);
    setSelectedId(field.id);
  }

  function update(patch: Partial<EventFormField>) {
    setFields((current) =>
      current.map((field) =>
        field.id === selectedId ? { ...field, ...patch } : field
      )
    );
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= fields.length) return;

    const copy = [...fields];
    [copy[index], copy[target]] = [copy[target], copy[index]];
    setFields(copy);
  }

  function remove(id: string) {
    if (!window.confirm("Excluir este campo do formulário?")) return;
    const next = fields.filter((field) => field.id !== id);
    setFields(next);
    if (selectedId === id) setSelectedId(next[0]?.id || "");
  }

  async function save() {
    setBusy(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
  `/api/eventos/${encodeURIComponent(event.id)}/formulario`,
  {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      formFields: fields,
    }),
  }
);

const contentType = response.headers.get("content-type") || "";

const result = contentType.includes("application/json")
  ? await response.json()
  : {
      error: await response.text(),
    };

if (!response.ok) {
  throw new Error(
    result.error ||
      `Não foi possível salvar o formulário. HTTP ${response.status}`
  );
}

      setMessage("Formulário salvo com sucesso.");
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível salvar o formulário."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="form-builder-page">
      <header className="form-builder-header">
        <div>
          <small>EVENTO / FORMULÁRIO</small>
          <h1>Editor de formulário</h1>
          <p>{event.name}</p>
        </div>

        <button type="button" onClick={save} disabled={busy}>
          {busy ? "Salvando..." : "Salvar formulário"}
        </button>
      </header>

      <div className="form-builder-layout">
        <aside className="field-library">
          <h2>Adicionar campo</h2>
          <p>Escolha o conteúdo que será exibido ao convidado.</p>

          {FIELD_TYPES.map((item) => (
            <button
              key={item.type}
              type="button"
              onClick={() => add(item.type)}
            >
              <strong>{item.label}</strong>
              <span>{item.defaultLabel}</span>
            </button>
          ))}
        </aside>

        <section className="field-canvas">
          <header>
            <div>
              <h2>Campos do formulário</h2>
              <span>{fields.length} campo(s)</span>
            </div>
          </header>

          {fields.map((field, index) => (
            <article
              key={field.id}
              className={`field-card ${
                selectedId === field.id ? "selected" : ""
              } ${field.visible === false ? "hidden-field" : ""}`}
              onClick={() => setSelectedId(field.id)}
            >
              <div className="field-order">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    move(index, -1);
                  }}
                  disabled={index === 0}
                  aria-label="Mover para cima"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    move(index, 1);
                  }}
                  disabled={index === fields.length - 1}
                  aria-label="Mover para baixo"
                >
                  ↓
                </button>
              </div>

              <div className="field-card-content">
                <small>
                  {FIELD_TYPES.find((item) => item.type === field.type)?.label}
                </small>
                <strong>{field.label}</strong>
                {field.description && <p>{field.description}</p>}
              </div>

              <div className="field-card-actions">
                <span>{field.visible === false ? "Oculto" : "Visível"}</span>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    remove(field.id);
                  }}
                >
                  Excluir
                </button>
              </div>
            </article>
          ))}

          {!fields.length && (
            <div className="empty-form">
              Adicione campos usando o menu ao lado.
            </div>
          )}
        </section>

        <aside className="field-properties">
          <h2>Propriedades</h2>

          {selected ? (
            <>
              <label>
                Tipo
                <select
                  value={selected.type}
                  onChange={(event) =>
                    update({
                      type: event.target.value as EventFormFieldType,
                    })
                  }
                >
                  {FIELD_TYPES.map((item) => (
                    <option value={item.type} key={item.type}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Título / rótulo
                <input
                  value={selected.label}
                  onChange={(event) => update({ label: event.target.value })}
                />
              </label>

              <label>
                Descrição
                <textarea
                  rows={4}
                  value={selected.description || ""}
                  onChange={(event) =>
                    update({ description: event.target.value })
                  }
                />
              </label>

              {!["content", "event_dates", "participants"].includes(
                selected.type
              ) && (
                <label>
                  Placeholder
                  <input
                    value={selected.placeholder || ""}
                    onChange={(event) =>
                      update({ placeholder: event.target.value })
                    }
                  />
                </label>
              )}

              {selected.type === "select" && (
                <label>
                  Opções — uma por linha
                  <textarea
                    rows={7}
                    value={(selected.options || []).join("\n")}
                    onChange={(event) =>
                      update({
                        options: event.target.value
                          .split("\n")
                          .map((value) => value.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                </label>
              )}

              {selected.type === "participants" && (
                <label>
                  Máximo de participantes
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={selected.maxParticipants || 10}
                    onChange={(event) =>
                      update({
                        maxParticipants: Math.max(
                          1,
                          Number(event.target.value) || 1
                        ),
                      })
                    }
                  />
                </label>
              )}

              <label className="property-check">
                <input
                  type="checkbox"
                  checked={selected.visible !== false}
                  onChange={(event) =>
                    update({ visible: event.target.checked })
                  }
                />
                Mostrar este campo
              </label>

              {selected.type !== "content" && (
                <label className="property-check">
                  <input
                    type="checkbox"
                    checked={Boolean(selected.required)}
                    onChange={(event) =>
                      update({ required: event.target.checked })
                    }
                  />
                  Campo obrigatório
                </label>
              )}
            </>
          ) : (
            <p>Selecione um campo para editar.</p>
          )}
        </aside>
      </div>

      {message && <div className="builder-message success">{message}</div>}
      {error && <div className="builder-message error">{error}</div>}
    </main>
  );
}
