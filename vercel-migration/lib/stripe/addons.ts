// Add-on price IDs from Stripe
export const ADDON_PRICES = {
  EXTRA_LOCATION: process.env.NEXT_PUBLIC_STRIPE_PRICE_ADDON_EXTRA_LOCATION || 'price_1SUu5kCpe9CE4d2l13VFVUj4',
  EXTRA_DOCTOR: process.env.NEXT_PUBLIC_STRIPE_PRICE_ADDON_EXTRA_DOCTOR || 'price_1SUu5lCpe9CE4d2lv2Jvafmb',
} as const;

export type AddonType = 'extra_location' | 'extra_doctor';

export interface AddonConfig {
  id: AddonType;
  name: string;
  description: string;
  price: number; // in MXN
  priceId: string;
  maxQuantity: number; // max units that can be purchased
  icon: string;
}

export const ADDON_CONFIGS: Record<AddonType, AddonConfig> = {
  extra_location: {
    id: 'extra_location',
    name: 'Ubicación Extra',
    description: 'Agrega consultorios en diferentes direcciones. Ideal si atiendes en hospital + consultorio privado.',
    price: 499,
    priceId: ADDON_PRICES.EXTRA_LOCATION,
    maxQuantity: 10, // Basico/Pro can add up to 10 extra locations
    icon: '🏥',
  },
  extra_doctor: {
    id: 'extra_doctor',
    name: 'Doctor Adicional',
    description: 'Agrega más doctores/colaboradores a tu cuenta para trabajar en equipo.',
    price: 199,
    priceId: ADDON_PRICES.EXTRA_DOCTOR,
    maxQuantity: 50, // can add up to 50 extra doctors
    icon: '👨‍⚕️',
  },
};

export function getAddonConfig(addonType: AddonType): AddonConfig | undefined {
  return ADDON_CONFIGS[addonType];
}

export function getAllAddons(): AddonConfig[] {
  return Object.values(ADDON_CONFIGS);
}
