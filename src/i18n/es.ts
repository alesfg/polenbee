import type { en } from './en';

export const es: Record<keyof typeof en, string> = {
  appName: 'PolenBee',

  // Onboarding
  'onboarding.skip': 'Saltar',
  'onboarding.next': 'Siguiente',
  'onboarding.start': 'Empezar 🐝',
  'onboarding.permissionNote': 'Te pediremos permiso para usar tu ubicación.',
  'onboarding.welcome.title': 'Bienvenido a PolenBee',
  'onboarding.welcome.subtitle': 'Descubre de qué flores vienen tus abejas con solo una foto.',
  'onboarding.photo.title': 'Fotografía la abeja',
  'onboarding.photo.subtitle': 'Acércate cuando vuelva a la colmena con las patas cargadas de polen. Que se vean bien las bolitas de color.',
  'onboarding.place.title': 'Miramos dónde y cuándo',
  'onboarding.place.subtitle': 'Usamos tu ubicación, la hora y las plantas que están floreciendo cerca de ti ahora mismo.',
  'onboarding.odds.title': 'Te damos las probabilidades',
  'onboarding.odds.subtitle': 'Verás qué plantas pueden ser y con qué probabilidad. Cada análisis se guarda en el historial de tu zona.',
  'onboarding.odds.cardTitle': 'Polen amarillo',
  'onboarding.odds.cardSubtitle': '3 plantas posibles',
  'onboarding.odds.plant1': 'Hiedra',
  'onboarding.odds.plant2': 'Madroño',
  'onboarding.odds.plant3': 'Brezo',

  // Home
  'home.history': 'Historial',
  'home.locating': 'Buscando tu ubicación…',
  'home.choosePlace': 'Elige dónde están tus abejas',
  'home.change': 'Cambiar',
  'home.choose': 'Elegir',
  'home.edit': 'Editar',
  'home.heroTitle': '¿De qué flor viene el polen?',
  'home.heroText': 'Haz una foto a una abeja con las patas cargadas de polen. Aunque no salga perfecta, te daremos una estimación con tu zona y la fecha.',
  'home.takePhoto': '📷  Hacer foto',
  'home.fromGallery': 'Elegir de la galería',
  'home.recentInArea': 'Últimos en tu zona',
  'home.seeAll': 'Ver todo',
  'home.today': 'Hoy, {time}',
  'home.yesterday': 'Ayer, {time}',

  // Review
  'review.title': 'Revisa antes de analizar',
  'review.text': 'La ubicación y el momento de la foto ayudan a saber qué estaba en flor.',
  'review.choosePlace': 'Elige la ubicación',
  'review.placeFromPhoto': 'Según la foto',
  'review.placeCurrent': 'Ubicación actual',
  'review.placeRequired': 'Necesaria para estimar',
  'review.dateFromPhoto': 'Según la foto',
  'review.dateTaken': 'Momento de la foto',
  'review.analyze': 'Analizar polen',
  'review.changePhoto': 'Cambiar foto',

  // Analyzing
  'analyzing.1': 'Buscando las cargas de polen…',
  'analyzing.2': 'Midiendo el color del polen…',
  'analyzing.3': 'Mirando qué florece cerca de ti…',
  'analyzing.4': 'Teniendo en cuenta la hora y el tiempo…',
  'analyzing.5': 'Calculando probabilidades…',

  // Result
  'result.title': 'Resultado',
  'result.estimateTitle': 'Estimación',
  'result.pollen': 'Polen {color}',
  'result.expectedPollen': 'Polen esperado: {color}',
  'result.noPollenBanner': 'En la foto no se ve el polen, así que estimamos con lo que florece en tu zona en esa fecha.',
  'result.unclearBanner': 'La foto no deja ver bien el color del polen: la estimación se apoya más en tu zona y la fecha.',
  'result.disclaimer': 'Estimación orientativa basada en el color del polen, tu zona, la fecha y las plantas en flor cercanas. No sustituye un análisis palinológico de laboratorio.',
  'result.history': 'Historial',
  'result.newPhoto': 'Nueva foto',

  // Errors
  'error.title': 'No hemos podido analizarla',
  'error.retry': 'Reintentar',
  'error.back': 'Volver',
  'error.rateLimited': 'Has llegado al límite de análisis de hoy. Vuelve mañana.',
  'error.unauthorized': 'No se pudo iniciar la sesión. Revisa tu conexión e inténtalo de nuevo.',
  'error.aiUnavailable': 'El analizador no está disponible ahora mismo. Inténtalo en un rato.',
  'error.generic': 'Algo ha fallado al analizar la foto. Inténtalo de nuevo.',
  'error.network': 'No hemos podido conectar. Revisa tu conexión e inténtalo de nuevo.',
  'error.image': 'No se pudo procesar la imagen',

  // History
  'history.title': 'Historial de polen',
  'history.allAreas': 'Todas las zonas',
  'history.count': '{count} análisis',
  'history.countOne': '1 análisis',
  'history.emptyTitle': 'Aún no hay análisis',
  'history.emptyText': 'Cada foto que analices se guardará aquí, agrupada por zona.',
  'history.emptyCta': 'Hacer la primera foto',
  'history.noLocation': 'Sin ubicación',
  'history.privacy': 'Política de privacidad',

  // Location modal
  'location.title': '¿Dónde están tus abejas?',
  'location.cancel': 'Cancelar',
  'location.searchPlaceholder': 'Buscar localidad, municipio…',
  'location.useCurrent': 'Usar mi ubicación actual',
  'location.gpsHint': 'Detectar automáticamente por GPS',
  'location.gpsError': 'No pudimos obtener tu ubicación. Revisa el permiso o busca a mano.',
  'location.noResults': 'Sin resultados para "{query}"',

  // Date modal
  'date.title': '¿Cuándo hiciste la foto?',
  'date.now': 'Ahora',
  'date.hourAgo': 'Hace 1 h',
  'date.yesterday': 'Ayer',
  'date.day': 'Día',
  'date.time': 'Hora',
  'date.cancel': 'Cancelar',
  'date.save': 'Guardar',
};
