export const site = {
  name: 'Guías Universitarias',
  domain: 'guiasuniversitarias.com',
  tagline: 'Material físico para preparar tu examen de admisión',
  whatsappNumber: '528141890555',
  whatsappText: 'Hola, quiero información sobre la guía EXANI-II.',
  facebookUrl: 'https://www.facebook.com/guiasunimexico',
  email: 'contacto@guiasuniversitarias.com',
  cities: ['Monterrey', 'Guadalajara', 'Veracruz'],
  shipping: 'Envío sin costo a todo México',
  legalNotice:
    'EXANI-II® es una marca registrada de sus respectivos titulares. Este material es independiente y no está afiliado, avalado ni emitido por Ceneval.'
};

export function whatsappHref(message = site.whatsappText) {
  return `https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
