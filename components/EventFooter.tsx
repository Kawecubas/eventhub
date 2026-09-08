import { privacyPolicyUrl } from "@/lib/privacy-policy";

export default function EventFooter({ policyUrl, policyText }: { policyUrl?: string; policyText?: string }) {
  const href = privacyPolicyUrl(policyUrl);
  const text = policyText?.trim();

  return (
    <footer className="event-footer">
      <span>Gestão de eventos</span>
      {text && <p className="event-privacy-text">{text}</p>}
      {href && (
        <a className="event-privacy-link" href={href} target="_blank" rel="noopener noreferrer">
          Política de privacidade
        </a>
      )}
    </footer>
  );
}
