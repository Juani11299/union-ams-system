export interface PresentationSlide {
  titulo: string
  subtitulo: string
}

export interface Presentation {
  /** Ruta del manual asociado (`navConfig.ts`) — así `MetodologiaIndexView` sabe qué tarjeta muestra el botón "Iniciar Presentación". */
  manualTo: string
  titulo: string
  slides: PresentationSlide[]
}

/**
 * Modo Presentación (Fase 30) — versión "charla TED" de cada Manual
 * Metodológico: muy poco texto por diapositiva, sin viñetas, pensada para
 * exponerse en pantalla completa frente al cuerpo técnico en vez de
 * repartirse como documento. No reemplaza al manual en PDF — es un resumen
 * de alto impacto visual del mismo contenido.
 */
export const PRESENTATIONS: Presentation[] = [
  {
    manualTo: '/metodologia/manual-fuerza',
    titulo: 'Manual Área de Fuerza (General)',
    slides: [
      {
        titulo: 'El Fútbol Cambió.',
        subtitulo: 'Ya no gana el que corre más, gana el que frena y acelera mejor.',
      },
      {
        titulo: 'El Motor: Bioenergética',
        subtitulo: '90% Sistema de Fosfágenos y Glucólisis Rápida. Entrenemos para eso.',
      },
      {
        titulo: 'Prevención = Rendimiento',
        subtitulo:
          'Nuestra meta no es sacar fisicoculturistas, es construir una armadura con Ejercicios Vitamina.',
      },
      {
        titulo: 'Estructura Autogestionada',
        subtitulo: 'Datos en tiempo real, decisiones al instante. Cero papel.',
      },
    ],
  },
  {
    manualTo: '/metodologia/ltad-10ma-pre9na',
    titulo: 'LTAD 10ma y Pre 9na (12-13 años)',
    slides: [
      {
        titulo: 'El Estirón Puberal (PHV)',
        subtitulo: 'Crecen los huesos, sufren las palancas. Paciencia y control.',
      },
      {
        titulo: 'Alfabetización Motora',
        subtitulo: 'No buscamos kilos en la barra. Buscamos calidad técnica absoluta en los patrones de movimiento.',
      },
      {
        titulo: 'El Objetivo',
        subtitulo: 'Preparar el sistema nervioso y los tendones para las cargas que vendrán.',
      },
    ],
  },
  {
    manualTo: '/metodologia/ltad-9na-8va',
    titulo: 'LTAD 9na y 8va (14-15 años)',
    slides: [
      {
        titulo: 'La Ventana Anabólica',
        subtitulo: 'El entorno hormonal explota. Es nuestro momento de oro.',
      },
      {
        titulo: 'Fuerza Estructural e Hipertrofia',
        subtitulo: 'Momento de cargar la barra. Construcción de masa muscular útil.',
      },
      {
        titulo: 'Prevención Activa',
        subtitulo: 'Inicio del trabajo excéntrico para proteger isquiotibiales y estabilidad lumbo-pélvica.',
      },
    ],
  },
  {
    manualTo: '/metodologia/ltad-7ma-6ta',
    titulo: 'LTAD 7ma y 6ta (16-17 años)',
    slides: [
      {
        titulo: 'La Carrocería ya está Armada',
        subtitulo: 'Ahora necesitamos que el motor sea rápido y explosivo.',
      },
      {
        titulo: 'Fuerza Máxima y RFD',
        subtitulo: 'Tensión mecánica. Menos volumen, intensidad neural máxima.',
      },
      {
        titulo: 'Especificidad',
        subtitulo: 'Fuerza unilateral pesada y contrastes fuerza-velocidad.',
      },
    ],
  },
  {
    manualTo: '/metodologia/ltad-5ta-4ta',
    titulo: 'LTAD 5ta y 4ta (18-20 años)',
    slides: [
      {
        titulo: 'La Puerta al Profesionalismo',
        subtitulo: 'Margen de error cero. Rendimiento puro.',
      },
      {
        titulo: 'Fuerza Potencia y Transferencia',
        subtitulo: 'Levantamientos olímpicos, pliometría compleja y Velocity Based Training (VBT).',
      },
      {
        titulo: 'Perfilado Individual',
        subtitulo: 'Dosis de mantenimiento estricto según historial de lesiones y GPS.',
      },
    ],
  },
]
