export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "https://api.tclinic.com.br/v1",
  appName: process.env.NEXT_PUBLIC_APP_NAME || "TClinic",
  appVersion: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
  memedScriptUrl:
    process.env.NEXT_PUBLIC_MEMED_SCRIPT_URL ||
    "https://integrations.memed.com.br/modulos/plataforma.sinapse-prescricao/build/sinapse-prescricao.min.js",
  memedColor: process.env.NEXT_PUBLIC_MEMED_COLOR || "#2563eb",
} as const;
