export const publicLocales = ["pt-BR", "en", "es", "it"] as const;

export type PublicLocale = (typeof publicLocales)[number];

const messages = {
  "pt-BR": {
    language: "Idioma", registration: "Inscrição", register: "Inscreva-se no evento",
    introduction: "Preencha seus dados para confirmar sua participação.", name: "Nome completo",
    email: "E-mail", company: "Empresa", phone: "Telefone", date: "Escolha uma data",
    participants: "Participantes", notes: "Observações", optional: "opcional", submit: "Confirmar inscrição",
    submitting: "Enviando...", successTitle: "Inscrição confirmada!", successText: "Enviamos sua confirmação e o QR Code para o seu e-mail.",
    emailNotice: "Apresente o QR Code recebido na entrada para fazer o check-in.", unavailable: "As inscrições públicas não estão disponíveis para este evento.",
    closed: "As inscrições para este evento estão encerradas.", invalidEmail: "Informe um e-mail válido.", required: "Preencha os campos obrigatórios.",
    genericError: "Não foi possível concluir sua inscrição. Tente novamente.", select: "Selecione", maxPeople: "Máximo de {count} pessoas.",
    confirmation: "Confirmação de presença", eventDetails: "Detalhes do evento"
  },
  en: {
    language: "Language", registration: "Registration", register: "Register for the event",
    introduction: "Fill in your details to confirm your attendance.", name: "Full name", email: "Email", company: "Company", phone: "Phone", date: "Choose a date",
    participants: "Attendees", notes: "Notes", optional: "optional", submit: "Confirm registration", submitting: "Sending...",
    successTitle: "Registration confirmed!", successText: "We sent your confirmation and QR code to your email.", emailNotice: "Show the QR code at the entrance to check in.",
    unavailable: "Public registration is not available for this event.", closed: "Registration for this event is closed.", invalidEmail: "Enter a valid email address.",
    required: "Complete the required fields.", genericError: "We could not complete your registration. Please try again.", select: "Select", maxPeople: "Maximum of {count} people.",
    confirmation: "Attendance confirmation", eventDetails: "Event details"
  },
  es: {
    language: "Idioma", registration: "Inscripción", register: "Inscríbete al evento", introduction: "Completa tus datos para confirmar tu participación.",
    name: "Nombre completo", email: "Correo electrónico", company: "Empresa", phone: "Teléfono", date: "Elige una fecha", participants: "Participantes", notes: "Observaciones", optional: "opcional",
    submit: "Confirmar inscripción", submitting: "Enviando...", successTitle: "¡Inscripción confirmada!", successText: "Enviamos tu confirmación y código QR a tu correo.",
    emailNotice: "Presenta el código QR en la entrada para realizar el check-in.", unavailable: "La inscripción pública no está disponible para este evento.", closed: "Las inscripciones para este evento están cerradas.",
    invalidEmail: "Ingresa un correo electrónico válido.", required: "Completa los campos obligatorios.", genericError: "No fue posible completar tu inscripción. Inténtalo nuevamente.", select: "Selecciona", maxPeople: "Máximo de {count} personas.",
    confirmation: "Confirmación de asistencia", eventDetails: "Detalles del evento"
  },
  it: {
    language: "Lingua", registration: "Iscrizione", register: "Iscriviti all'evento", introduction: "Compila i dati per confermare la tua partecipazione.",
    name: "Nome completo", email: "Email", company: "Azienda", phone: "Telefono", date: "Scegli una data", participants: "Partecipanti", notes: "Note", optional: "facoltativo",
    submit: "Conferma iscrizione", submitting: "Invio in corso...", successTitle: "Iscrizione confermata!", successText: "Abbiamo inviato la conferma e il codice QR alla tua email.",
    emailNotice: "Mostra il codice QR all'ingresso per effettuare il check-in.", unavailable: "Le iscrizioni pubbliche non sono disponibili per questo evento.", closed: "Le iscrizioni a questo evento sono chiuse.",
    invalidEmail: "Inserisci un indirizzo email valido.", required: "Completa i campi obbligatori.", genericError: "Non è stato possibile completare l'iscrizione. Riprova.", select: "Seleziona", maxPeople: "Massimo {count} persone.",
    confirmation: "Conferma di partecipazione", eventDetails: "Dettagli dell'evento"
  },
} as const;

export type PublicMessages = (typeof messages)[PublicLocale];

export function getPublicMessages(locale: PublicLocale): PublicMessages {
  return messages[locale] || messages["pt-BR"];
}
