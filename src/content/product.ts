export type GuideVersion = {
  id: 'clasica' | 'plus';
  name: string;
  label?: string;
  price: string;
  amount: number;
  currency: 'mxn';
  paymentUrl: string;
  coverImage: string;
  coverAlt: string;
  sampleImage?: string;
  sampleAlt?: string;
  shortDescription: string;
  idealFor: string;
  features: string[];
};

export const product = {
  exam: 'EXANI-II®',
  title: 'Guía impresa para preparar el EXANI-II®',
  heroTitle: 'Guía para el examen más importante de tu vida',
  heroSubtitle:
    'Material físico con reactivos propios, respuestas, procedimientos y argumentaciones para practicar con orden antes del examen de admisión.',
  coverImage: '/images/guia-plus.webp',
  stats: [
    'Cuadernillo físico tamaño carta',
    'Más de 300 reactivos',
    'Envío sin costo a México'
  ],
  versions: [
    {
      id: 'clasica',
      name: 'Guía Clásica',
      label: 'Envío gratis a todo México',
      price: '$419 MXN',
      amount: 41900,
      currency: 'mxn',
      paymentUrl: '/comprar?version=clasica',
      coverImage: '/images/guia-clasica.webp',
      coverAlt: 'Portada de la Guía Clásica para examen de ingreso a educación superior',
      sampleImage: '/images/muestra-guia-clasica.svg',
      sampleAlt: 'Página de muestra de lectura y preguntas de la Guía Clásica',
      shortDescription:
        'Para quien quiere practicar con una guía física clara, organizada y enfocada en el examen.',
      idealFor: 'Aspirantes que quieren resolver, revisar respuestas y ordenar su preparación.',
      features: [
        'Más de 300 reactivos inéditos',
        'Organización por área, tema y subtema',
        'Hoja de respuestas',
        'Procedimientos y argumentaciones',
        'Bibliografía sugerida',
        'Soporte por WhatsApp'
      ]
    },
    {
      id: 'plus',
      name: 'Guía Plus',
      label: 'Envío gratis a todo México',
      price: '$519 MXN',
      amount: 51900,
      currency: 'mxn',
      paymentUrl: '/comprar?version=plus',
      coverImage: '/images/guia-plus.webp',
      coverAlt: 'Portada blanca de la Guía Plus para examen de ingreso a educación superior',
      shortDescription:
        'Para quien quiere una preparación más completa y mayor acompañamiento durante su estudio.',
      idealFor: 'Aspirantes que buscan reforzar áreas débiles con más apoyo y seguimiento.',
      features: [
        'Más de 500 reactivos inéditos',
        'Material adicional o ampliado',
        'Mayor acompañamiento por WhatsApp',
        'Recursos complementarios',
        'Prioridad en soporte',
        'Actualizaciones comerciales definidas por el equipo'
      ]
    }
  ] satisfies GuideVersion[],
  benefits: [
    {
      title: 'Reactivos propios e inéditos',
      body: 'No es una recopilación pegada de internet. El material está construido y revisado manualmente, reactivo por reactivo.'
    },
    {
      title: 'Formato físico',
      body: 'Está pensado para resolver con lápiz, subrayar, anotar procedimientos y estudiar con una dinámica más parecida a una sesión real de concentración.'
    },
    {
      title: 'Sin distracciones',
      body: 'El celular y la computadora sirven, pero también fragmentan la atención. Esta guía está hecha para sentarte a resolver.'
    },
    {
      title: 'Organizado por tema',
      body: 'Puedes ubicar qué estás practicando, qué dominas y qué necesitas reforzar antes del examen.'
    },
    {
      title: 'Alineado al temario público',
      body: 'Se construye tomando como base los temas públicos disponibles del examen, evitando relleno innecesario.'
    },
    {
      title: 'Explicado',
      body: 'Incluye respuestas, procedimientos, argumentaciones, asesoría y bibliografía sugerida para estudiar con más claridad.'
    }
  ]
};
