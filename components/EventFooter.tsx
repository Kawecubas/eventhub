import { privacyPolicyUrl } from "@/lib/privacy-policy";
import { getCompanySettings } from "@/lib/company-settings";

export default async function EventFooter({ policyUrl, policyText }: { policyUrl?: string; policyText?: string }) {
  const { footerText, footerLogo, tradeName, footerBackgroundColor, footerTextColor } = await getCompanySettings();
  const href = privacyPolicyUrl(policyUrl);
  const text = policyText?.trim();

  return (
    <footer className="event-footer" style={{ backgroundColor: footerBackgroundColor, color: footerTextColor }}>
      {footerLogo && <img className="event-footer-logo" src={footerLogo} alt={tradeName} />}
      <p className="event-company-footer">{footerText}</p>
      {text && <p className="event-privacy-text">{text}</p>}
      {href && (
        <a className="event-privacy-link" href={href} target="_blank" rel="noopener noreferrer">
          Política de privacidade
        </a>
      )}
    </footer>
  );
}
