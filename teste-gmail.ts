import nodemailer from "nodemailer";

async function main() {
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASSWORD?.replace(/\s+/g, "");

  if (!user || !pass) {
    throw new Error("SMTP_USER ou SMTP_PASSWORD não carregados.");
  }

  console.log({
    user,
    passwordLength: pass.length,
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
  });

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: { user, pass },
  });

  await transporter.verify();

  const result = await transporter.sendMail({
    from: `"EventHub" <${user}>`,
    to: user,
    subject: "Teste SMTP EventHub",
    html: "<h2>SMTP configurado com sucesso.</h2>",
  });

  console.log("Enviado:", result.messageId);
}

main().catch((error) => {
  console.error("Erro SMTP:", error);
  process.exitCode = 1;
});