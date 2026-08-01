"use client";

import type { EventItem } from "@/lib/event-platform-store";

type EventDashboardProps = {
  event: EventItem;
};

export default function EventDashboard({
  event,
}: EventDashboardProps) {
  const total = event.guests.length;

  const confirmed = event.guests.filter(
    (guest) => guest.status === "confirmed"
  );

  const pending = event.guests.filter(
    (guest) => guest.status === "pending"
  );

  const declined = event.guests.filter(
    (guest) => guest.status === "declined"
  );

  const confirmationRate =
    total > 0
      ? Math.round((confirmed.length / total) * 100)
      : 0;

  const confirmedByDate = event.dates.map((eventDate) => ({
    id: eventDate.id,
    label: eventDate.label,
    total: confirmed.filter(
      (guest) => guest.selectedDate === eventDate.label
    ).length,
  }));

  return (
    <section className="event-dashboard">
      <div className="dashboard-heading">
        <div>
          <span className="dashboard-eyebrow">
            VISÃO GERAL
          </span>

          <h2>Dashboard do evento</h2>
        </div>

        <span className="dashboard-update">
          Atualizado com as respostas registradas
        </span>
      </div>

      <div className="dashboard-cards">
        <article className="metric-card">
          <span>Total de convidados</span>
          <strong>{total}</strong>
        </article>

        <article className="metric-card confirmed">
          <span>Confirmados</span>
          <strong>{confirmed.length}</strong>
        </article>

        <article className="metric-card pending">
          <span>Pendentes</span>
          <strong>{pending.length}</strong>
        </article>

        <article className="metric-card declined">
          <span>Não participarão</span>
          <strong>{declined.length}</strong>
        </article>

        <article className="metric-card rate">
          <span>Taxa de confirmação</span>
          <strong>{confirmationRate}%</strong>
        </article>
      </div>

      <div className="dashboard-grid">
        <article className="dashboard-panel">
          <div className="panel-heading">
            <div>
              <span>Distribuição</span>
              <h3>Confirmados por data</h3>
            </div>
          </div>

          {confirmedByDate.length > 0 ? (
            <div className="date-results">
              {confirmedByDate.map((item) => {
                const percentage =
                  confirmed.length > 0
                    ? Math.round(
                        (item.total / confirmed.length) * 100
                      )
                    : 0;

                return (
                  <div className="date-result" key={item.id}>
                    <div className="date-result-header">
                      <span>{item.label}</span>
                      <strong>{item.total}</strong>
                    </div>

                    <div className="progress">
                      <span
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="dashboard-empty">
              Nenhuma data cadastrada.
            </p>
          )}
        </article>

        <article className="dashboard-panel">
          <div className="panel-heading">
            <div>
              <span>Participantes</span>
              <h3>Lista de confirmados</h3>
            </div>

            <strong>{confirmed.length}</strong>
          </div>

          {confirmed.length > 0 ? (
            <div className="confirmed-list">
              {confirmed.map((guest) => (
                <div className="confirmed-row" key={guest.id}>
                  <div>
                    <strong>{guest.name}</strong>

                    <span>
                      {guest.email}
                      {guest.company
                        ? ` · ${guest.company}`
                        : ""}
                    </span>
                  </div>

                  <div className="confirmed-date">
                    {guest.selectedDate || "Data não informada"}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="dashboard-empty">
              Ainda não existem convidados confirmados.
            </p>
          )}
        </article>
      </div>
    </section>
  );
}