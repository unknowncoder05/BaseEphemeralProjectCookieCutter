// External Authentication Token Providers
// These values must match the backend Django choices
export const AUTH_PROVIDERS = {
  SMS: 'SMS',
  WHATSAPP: 'WH',
  CONSOLE: 'D',
} as const;

export type AuthProvider = typeof AUTH_PROVIDERS[keyof typeof AUTH_PROVIDERS];

// Provider display names for UI
export const AUTH_PROVIDER_LABELS = {
  [AUTH_PROVIDERS.SMS]: 'SMS',
  [AUTH_PROVIDERS.WHATSAPP]: 'WhatsApp',
  [AUTH_PROVIDERS.CONSOLE]: 'Console (Development)',
} as const;
