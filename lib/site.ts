// Values not supplied are deliberately null: the UI displays an honest pending state.
export const site = {
  whatsapp: process.env.NEXT_PUBLIC_SALES_WHATSAPP?.replace(/\D/g, '') || null,
  video: process.env.NEXT_PUBLIC_PRODUCT_VIDEO_URL || null,
  videoCaptions: process.env.NEXT_PUBLIC_PRODUCT_VIDEO_CAPTIONS_URL || null,
  panel: 'https://citara-prod.web.app/agenda',
  trialDays: 7,
  salesMessage: 'Hola, quiero conocer Citara para mi negocio y hablar con ventas.',
  implementation: { price: null as number | null, includes: [] as string[] },
};
export const plans = [
  { name: 'Mensual', months: 1, total: null as number | null, description: 'Un mes a la vez.' },
  { name: 'Trimestral', months: 3, total: null as number | null, description: 'Organiza los próximos tres meses.' },
  { name: 'Semestral', months: 6, total: null as number | null, description: 'Planea medio año con Citara.' },
  { name: 'Anual', months: 12, total: null as number | null, description: 'Dale continuidad a tu agenda.' },
];
export const money = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
export const salesHref = site.whatsapp && /^[1-9]\d{7,14}$/.test(site.whatsapp) ? `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(site.salesMessage)}` : '/ventas/';
