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

const eventUi = {
  "pt-BR": { invitationMissing: "Convite não localizado.", invitationHint: "Abra o link individual recebido por e-mail ou solicite um novo convite ao organizador.", print: "Imprimir / Salvar em PDF", receipt: "COMPROVANTE DE RESPOSTA", confirmed: "Participação confirmada", declined: "Ausência registrada", greeting: "Olá", responseSaved: "Sua resposta para o evento foi registrada.", event: "Evento", guest: "Convidado", company: "Empresa", selectedDate: "Data escolhida", participants: "Participantes", location: "Local", answeredAt: "Respondido em", notes: "Observações", yes: "Sim", generatingQr: "Gerando QR Code...", checkinQr: "QR Code de check-in", invitationQr: "Convite individual", qrHint: "Apresente este QR Code quando solicitado.", calendar: "Adicione o evento à sua agenda", calendarHint: "Disponível quando a data possui dia, mês e ano.", google: "Google Agenda", dateFormat: "Cadastre a data no padrão DD/MM/AAAA.", changeHint: "Para alterar a resposta, entre em contato com o organizador.", requiredField: "Preencha o campo “{field}”.", requiredCheck: "Marque o campo “{field}”.", submitError: "Não foi possível registrar sua resposta.", networkError: "Não foi possível conectar ao servidor.", select: "Selecione", maxPeople: "Máximo de {count} pessoas por convite.", attendee: "Convidado", attend: "Quero participar", cannotAttend: "Não poderei participar", submit: "Enviar resposta", sending: "Enviando...", language: "Idioma", notProvided: "Não informado" },
  en: { invitationMissing: "Invitation not found.", invitationHint: "Open the individual link received by email or ask the organizer for a new invitation.", print: "Print / Save as PDF", receipt: "RESPONSE RECEIPT", confirmed: "Attendance confirmed", declined: "Absence recorded", greeting: "Hello", responseSaved: "Your response for the event has been recorded.", event: "Event", guest: "Guest", company: "Company", selectedDate: "Selected date", participants: "Attendees", location: "Location", answeredAt: "Answered at", notes: "Notes", yes: "Yes", generatingQr: "Generating QR code...", checkinQr: "Check-in QR code", invitationQr: "Individual invitation", qrHint: "Show this QR code when requested.", calendar: "Add the event to your calendar", calendarHint: "Available when the date includes day, month and year.", google: "Google Calendar", dateFormat: "Use the DD/MM/YYYY date format.", changeHint: "To change your response, contact the organizer.", requiredField: "Complete the “{field}” field.", requiredCheck: "Check the “{field}” field.", submitError: "We could not save your response.", networkError: "Could not connect to the server.", select: "Select", maxPeople: "Maximum of {count} people per invitation.", attendee: "Guest", attend: "I want to attend", cannotAttend: "I cannot attend", submit: "Send response", sending: "Sending...", language: "Language", notProvided: "Not provided" },
  es: { invitationMissing: "Invitación no encontrada.", invitationHint: "Abre el enlace individual recibido por correo o solicita una nueva invitación al organizador.", print: "Imprimir / Guardar como PDF", receipt: "COMPROBANTE DE RESPUESTA", confirmed: "Participación confirmada", declined: "Ausencia registrada", greeting: "Hola", responseSaved: "Tu respuesta al evento ha sido registrada.", event: "Evento", guest: "Invitado", company: "Empresa", selectedDate: "Fecha elegida", participants: "Participantes", location: "Lugar", answeredAt: "Respondido el", notes: "Observaciones", yes: "Sí", generatingQr: "Generando código QR...", checkinQr: "Código QR de check-in", invitationQr: "Invitación individual", qrHint: "Presenta este código QR cuando se solicite.", calendar: "Añade el evento a tu calendario", calendarHint: "Disponible cuando la fecha contiene día, mes y año.", google: "Google Calendar", dateFormat: "Registra la fecha en formato DD/MM/AAAA.", changeHint: "Para cambiar tu respuesta, contacta al organizador.", requiredField: "Completa el campo “{field}”.", requiredCheck: "Marca el campo “{field}”.", submitError: "No fue posible registrar tu respuesta.", networkError: "No fue posible conectar con el servidor.", select: "Selecciona", maxPeople: "Máximo de {count} personas por invitación.", attendee: "Invitado", attend: "Quiero participar", cannotAttend: "No podré participar", submit: "Enviar respuesta", sending: "Enviando...", language: "Idioma", notProvided: "No informado" },
  it: { invitationMissing: "Invito non trovato.", invitationHint: "Apri il link individuale ricevuto via email o chiedi un nuovo invito all'organizzatore.", print: "Stampa / Salva come PDF", receipt: "RICEVUTA DI RISPOSTA", confirmed: "Partecipazione confermata", declined: "Assenza registrata", greeting: "Ciao", responseSaved: "La tua risposta all'evento è stata registrata.", event: "Evento", guest: "Ospite", company: "Azienda", selectedDate: "Data selezionata", participants: "Partecipanti", location: "Luogo", answeredAt: "Risposto il", notes: "Note", yes: "Sì", generatingQr: "Generazione del codice QR...", checkinQr: "Codice QR per il check-in", invitationQr: "Invito individuale", qrHint: "Mostra questo codice QR quando richiesto.", calendar: "Aggiungi l'evento al calendario", calendarHint: "Disponibile quando la data include giorno, mese e anno.", google: "Google Calendar", dateFormat: "Inserisci la data nel formato GG/MM/AAAA.", changeHint: "Per modificare la risposta, contatta l'organizzatore.", requiredField: "Compila il campo “{field}”.", requiredCheck: "Seleziona il campo “{field}”.", submitError: "Non è stato possibile registrare la risposta.", networkError: "Impossibile connettersi al server.", select: "Seleziona", maxPeople: "Massimo {count} persone per invito.", attendee: "Ospite", attend: "Voglio partecipare", cannotAttend: "Non potrò partecipare", submit: "Invia risposta", sending: "Invio in corso...", language: "Lingua", notProvided: "Non fornito" },
} as const;

export function getEventUiCopy(locale: PublicLocale) {
  return eventUi[locale] || eventUi["pt-BR"];
}
