export const publicEventOrigin = "https://gambini.kgconsulting.com.br";

export function publicEventUrl(path: string): string {
  return new URL(path, publicEventOrigin).toString();
}
