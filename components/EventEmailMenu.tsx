import Link from "next/link";

type Props = {
  eventId: string;
};

export default function EventEmailMenu({ eventId }: Props) {
  return (
    <nav className="event-email-menu" aria-label="Comunicação do evento">
      <Link href={`/admin/eventos/${eventId}/email`}>
        Personalizar e-mail
      </Link>

      <Link href={`/admin/eventos/${eventId}/email/selecionar-template`}>
        Selecionar template
      </Link>

      <Link href={`/admin/eventos/${eventId}#convidados`}>
        Enviar convites
      </Link>
    </nav>
  );
}
