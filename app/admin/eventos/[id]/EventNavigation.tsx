import Link from "next/link";

type Props = {
  eventId: string;
};

export default function EventNavigation({ eventId }: Props) {
  return (
    <nav className="event-section-navigation" aria-label="Menu do evento">
      <Link href={`/admin/eventos/${eventId}/dashboard`}>Dashboard</Link>
      <Link href={`/admin/eventos/${eventId}?aba=dados`}>Dados do evento</Link>
      <Link href={`/admin/eventos/${eventId}?aba=visual`}>Identidade visual</Link>
      <Link href={`/admin/eventos/${eventId}?aba=datas`}>Datas</Link>
      <Link href={`/admin/eventos/${eventId}?aba=convidados`}>Convidados</Link>
      <Link href={`/admin/eventos/${eventId}/email`}>E-mail</Link>
      <Link href={`/admin/eventos/${eventId}/configuracoes`}>Configurações</Link>
    </nav>
  );
}
