// Única lista de rubros del sitio (docs/rediseno/REDISENO.md §12). Son ejemplos de negocios con cita previa,
// no una lista cerrada: agregar un rubro es agregar una entrada aquí, sin tocar componentes.
// Nunca se cuentan los rubros ni se promete que Citara funciona para uno que no esté configurado.

export type Vertical = {
  id: string;
  tab: string; // etiqueta de la pestaña
  name: string; // título del panel
  subtitle: string;
  description: string;
  tags: string[];
  tone: string; // fondo del panel: uno de los tokens --rubro-* de app/globals.css
  example: {
    business: string;
    initial: string;
    messages: { from: 'cliente' | 'citara'; text: string }[];
    handoff?: string; // aviso de paso al equipo, si aplica
  };
};

export const verticals: Vertical[] = [
  {
    id: 'spa',
    tab: 'Spas',
    name: 'Spas',
    subtitle: 'Más calma, también en recepción.',
    description: 'Organiza las citas de masajes y servicios del spa, las confirmaciones y los cambios de horario.',
    tags: ['Masajes', 'Servicios', 'Cabinas'],
    tone: 'var(--rubro-1)',
    example: {
      business: 'Tu spa',
      initial: 'S',
      messages: [
        { from: 'cliente', text: 'Hola, ¿tienen masaje relajante el sábado en la tarde?' },
        { from: 'citara', text: '¡Hola! El sábado tengo 3:00 p. m. o 4:30 p. m. en la cabina 2. ¿Cuál prefieres?' },
        { from: 'cliente', text: 'La de las 3:00 p. m.' },
        { from: 'citara', text: 'Listo. Tu masaje quedó para el sábado a las 3:00 p. m.' },
      ],
    },
  },
  {
    id: 'fisioterapia',
    tab: 'Fisioterapia',
    name: 'Centros de fisioterapia',
    subtitle: 'La agenda acompaña cada sesión.',
    description: 'Gestiona citas y reprogramaciones para que tu equipo se concentre en la atención de sus pacientes.',
    tags: ['Pacientes', 'Sesiones', 'Profesionales'],
    tone: 'var(--rubro-2)',
    example: {
      business: 'Tu centro de fisioterapia',
      initial: 'F',
      messages: [
        { from: 'cliente', text: 'Buenas, necesito agendar mi próxima sesión con Juliana.' },
        { from: 'citara', text: 'Claro. Juliana tiene espacio el martes a las 7:00 a. m. o a las 6:00 p. m. ¿Cuál te sirve?' },
        { from: 'cliente', text: 'Martes a las 7:00 a. m., por favor.' },
        { from: 'citara', text: 'Hecho. Tu sesión con Juliana quedó para el martes a las 7:00 a. m.' },
      ],
    },
  },
  {
    id: 'depilacion-laser',
    tab: 'Depilación láser',
    name: 'Depilación láser',
    subtitle: 'Cada sesión tiene su espacio.',
    description: 'Coordina los horarios de las sesiones y sus cambios. Las dudas clínicas pasan a tu equipo.',
    tags: ['Sesiones', 'Horarios', 'Equipo'],
    tone: 'var(--rubro-3)',
    example: {
      business: 'Tu clínica',
      initial: 'C',
      messages: [
        { from: 'cliente', text: 'Hola, quiero agendar mi sesión de depilación láser.' },
        { from: 'citara', text: '¡Hola! Tengo el jueves a las 11:00 a. m. o a las 5:30 p. m. ¿Cuál prefieres?' },
        { from: 'cliente', text: '¿La sesión duele?' },
        { from: 'citara', text: 'Esa pregunta la responde el equipo de la clínica. Ya les paso tu mensaje.' },
      ],
      handoff: 'Pasa a tu equipo · Por atender',
    },
  },
];
