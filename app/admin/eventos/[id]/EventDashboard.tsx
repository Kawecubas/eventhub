"use client";

import type { EventItem } from "@/lib/event-platform-store";

type EventDashboardProps = {
  event: EventItem;
};

export default function EventDashboard({ event }: EventDashboardProps) {
  const totalInvites = event.guests.length;
  const confirmed = event.guests.filter(
    (guest) => guest.status === "confirmed"
  );
  const pending = event.guests.filter((guest) => guest.status === "pending");
  const declined = event.guests.filter((guest) => guest.status === "declined");
  const totalParticipants = confirmed.reduce(
    (sum, guest) => sum + (guest.participants || 1),
    0
  );

  const confirmationRate =
    totalInvites > 0
      ? Math.round((confirmed.length / totalInvites) * 100)
      : 0;

  const confirmedByDate = event.dates.map((eventDate) => ({
    id: eventDate.id,
    label: eventDate.label,
    invites: confirmed.filter(
      (guest) => guest.selectedDate === eventDate.label
    ).length,
    participants: confirmed
      .filter((guest) => guest.selectedDate === eventDate.label)
      .reduce((sum, guest) => sum + (guest.participants || 1), 0),
  }));

  return (
    <section className="event-dashboard">
      <div className="dashboard-heading">
        <div>
          <span className="dashboard-eyebrow">VISÃO GERAL</span>
          <h2>Dashboard do evento</h2>
        </div>
        <div className="dashboard-heading-actions">
          <span className="dashboard-update">
            Atualizado com as respostas registradas
          </span>
          <a
            className="export-guests-button"
            href={`/api/eventos/${event.id}/exportar-convidados`}
          >
            Exportar convidados
          </a>
        </div>
      </div>

      <div className="dashboard-cards">
        <article className="metric-card">
          <span>Total de convites</span>
          <strong>{totalInvites}</strong>
        </article>
        <article className="metric-card confirmed">
          <span>Convites confirmados</span>
          <strong>{confirmed.length}</strong>
        </article>
        <article className="metric-card participants">
          <span>Participantes confirmados</span>
          <strong>{totalParticipants}</strong>
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
              <h3>Participantes por data</h3>
            </div>
          </div>

          {confirmedByDate.length > 0 ? (
            <div className="date-results">
              {confirmedByDate.map((item) => {
                const percentage =
                  totalParticipants > 0
                    ? Math.round((item.participants / totalParticipants) * 100)
                    : 0;

                return (
                  <div className="date-result" key={item.id}>
                    <div className="date-result-header">
                      <span>{item.label}</span>
                      <strong>{item.participants}</strong>
                    </div>
                    <small>{item.invites} convite(s) confirmado(s)</small>
                    <div className="progress">
                      <span style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="dashboard-empty">Nenhuma data cadastrada.</p>
          )}
        </article>

        <article className="dashboard-panel confirmed-panel">
          <div className="panel-heading">
            <div>
              <span>Participantes</span>
              <h3>Lista de confirmados</h3>
            </div>
            <strong>{totalParticipants}</strong>
          </div>

          {confirmed.length > 0 ? (
            <div className="confirmed-table-wrap">
              <table className="confirmed-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Participantes</th>
                    <th>Observação</th>
                    <th>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {confirmed.map((guest) => (
                    <tr key={guest.id}>
                      <td>
                        <strong>{guest.name}</strong>
                        {guest.company && <small>{guest.company}</small>}
                      </td>
                      <td>{guest.participants || 1}</td>
                      <td className="observation-cell">
                        {guest.notes || "—"}
                      </td>
                      <td>
                        <span className="confirmed-date">
                          {guest.selectedDate || "Data não informada"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
