/** La cookie de sesión lleva Secure solo cuando la conexión es https:
 *  en local (http) el navegador la rechazaría y el desarrollo se rompería.
 *  Acepta el valor de location.protocol ("https:") o de x-forwarded-proto ("https", quizá con lista). */
export function secureForProtocol(protocol: string | null | undefined): boolean {
  return protocol?.toLowerCase().split(",")[0].trim().replace(/:$/, "") === "https";
}
