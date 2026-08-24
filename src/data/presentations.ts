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
 * Modo Presentación (Fase 31, "Masterclass TED") — versión de conferencia
 * extensa de cada Manual Metodológico: mínimo 15 diapositivas por manual,
 * siguiendo siempre el mismo arco narrativo de 5 actos (Contexto → Ciencia
 * NSCA → Método del Club → Control y Monitoreo → Impacto Institucional).
 * No reemplaza al manual en PDF — es la charla que el Director de
 * Rendimiento da con esto proyectado en pantalla completa.
 */
export const PRESENTATIONS: Presentation[] = [
  {
    manualTo: '/metodologia/manual-fuerza',
    titulo: 'Manual Área de Fuerza (General)',
    slides: [
      // Acto 1 — Contexto (1-3)
      {
        titulo: 'El Fútbol Cambió.',
        subtitulo: 'Ya no gana el que corre más, gana el que frena y acelera mejor.',
      },
      {
        titulo: 'El Error del Siglo XX',
        subtitulo:
          'Décadas entrenando resistencia aeróbica pura fabricaron corredores lentos, no futbolistas explosivos.',
      },
      {
        titulo: 'Bienvenidos al Área de Fuerza',
        subtitulo: 'Este es el marco científico que sostiene cada ejercicio que se prescribe en este club.',
      },
      // Acto 2 — Ciencia NSCA (4-7)
      {
        titulo: 'El Motor: Bioenergética',
        subtitulo:
          '90% de las acciones decisivas del partido las sostiene el sistema de Fosfágenos (ATP-PCr), no el aeróbico.',
      },
      {
        titulo: 'Fosfágeno vs. Glucólisis',
        subtitulo:
          '6-10 segundos de potencia pura contra minutos de tolerancia a la fatiga — dos sistemas, dos entrenamientos distintos.',
      },
      {
        titulo: 'Filamentos que se Deslizan',
        subtitulo:
          'Toda la fuerza del cuerpo humano nace del mismo evento microscópico: actina y miosina deslizándose una sobre otra.',
      },
      {
        titulo: 'La Curva Fuerza-Velocidad',
        subtitulo: 'Cuanto más pesado, más lento. Entrenar sólo un extremo de la curva deja al jugador incompleto.',
      },
      // Acto 3 — Método del Club (8-11)
      {
        titulo: 'Periodización en Olas',
        subtitulo: 'No subimos la carga en línea recta. La ondulamos, semana a semana, para no agotar al sistema nervioso.',
      },
      {
        titulo: 'El Plan GENERAL',
        subtitulo: 'La base común de todo el plantel: patrones multiarticulares, tensión mecánica, progresión predecible.',
      },
      {
        titulo: 'Ejercicios VITAMINA',
        subtitulo: 'La corrección individual que el plan general no puede dar — asimetrías, isquiotibiales, zona media.',
      },
      {
        titulo: 'Del Gimnasio a la Cancha',
        subtitulo: 'Cada ejercicio que prescribimos tiene una razón biomecánica directa con un gesto del partido.',
      },
      // Acto 4 — Control y Monitoreo (12-14)
      {
        titulo: 'ACWR: El Semáforo de Riesgo',
        subtitulo:
          'Comparamos la carga de los últimos 7 días contra el promedio de las últimas 4 semanas. Fuera de 0.8-1.3, el riesgo se dispara.',
      },
      {
        titulo: 'El Tonelaje también Cuenta',
        subtitulo:
          'El ACWR de campo no ve lo que pasa en el gimnasio. Cruzamos ambos para tener el cuadro completo de fatiga del jugador.',
      },
      {
        titulo: 'Cero Sorpresas',
        subtitulo:
          'Ningún salto de carga —de campo o de gimnasio— ocurre sin que el sistema lo detecte antes de que se convierta en lesión.',
      },
      // Acto 5 — Impacto Institucional (15)
      {
        titulo: 'El Jugador es Patrimonio del Club',
        subtitulo: 'Cada decisión de carga que tomamos protege el activo más valioso que tiene esta institución: su plantel.',
      },
    ],
  },
  {
    manualTo: '/metodologia/isometria',
    titulo: 'Escuela de Movimiento (Isometría)',
    slides: [
      // Acto 1 — Contexto (1-3)
      {
        titulo: 'El Instante que Decide el Partido',
        subtitulo: '80 milisegundos. Eso dura un apoyo de sprint a máxima velocidad — y ahí se juega todo.',
      },
      {
        titulo: 'La Fuerza Tradicional no Alcanza',
        subtitulo: 'Una sentadilla pesada tarda segundos en construirse. El fútbol exige fuerza en centésimas.',
      },
      {
        titulo: 'La Isometría, Reinventada',
        subtitulo:
          'Alex Natera reformuló la isometría: no es un complemento, es el método específico para las demandas reales del fútbol.',
      },
      // Acto 2 — Ciencia NSCA (4-7)
      {
        titulo: 'Yielding: Sostener sin Ceder',
        subtitulo: 'El atleta resiste una carga que amenaza con vencerlo. Entrena la absorción, la deceleración, el frenado.',
      },
      {
        titulo: 'Overcoming: Empujar lo Inamovible',
        subtitulo: 'Máxima intención voluntaria contra una resistencia que no cede. Entrena la producción de fuerza pura.',
      },
      {
        titulo: 'El Huso Muscular',
        subtitulo:
          'Un sensor que detecta el estiramiento y dispara, en milisegundos, una contracción refleja — la base de la rigidez reactiva.',
      },
      {
        titulo: 'Stiffness: El Resorte Humano',
        subtitulo:
          'Cuanto más rígido el complejo tobillo-rodilla en el apoyo, más energía elástica devuelve en vez de absorber.',
      },
      // Acto 3 — Método del Club (8-11)
      {
        titulo: 'Overcoming para Acelerar',
        subtitulo: 'El primer paso de la aceleración es, biomecánicamente, producción de fuerza horizontal máxima contra el suelo.',
      },
      {
        titulo: 'Yielding para Frenar',
        subtitulo: 'Cada frenada brusca es una isometría Yielding en tiempo real. La entrenamos antes de que ocurra en el partido.',
      },
      {
        titulo: 'Vectores Laterales para el COD',
        subtitulo: 'Cambiar de dirección exige fuerza isométrica en ángulos que el trabajo lineal nunca toca.',
      },
      {
        titulo: 'Isometría Específica de Sprint',
        subtitulo: 'Tiempos de contacto de 80-100ms, entrenados exactamente en esa ventana — no más, no menos.',
      },
      // Acto 4 — Control y Monitoreo (12-14)
      {
        titulo: 'Progresión por Categoría',
        subtitulo:
          'Overcoming máximo recién a partir de 7ma división — antes, el tejido no está preparado para esa intensidad.',
      },
      {
        titulo: 'Sin Desgaste Articular',
        subtitulo: 'La isometría permite repetir intención máxima sin el costo articular de un levantamiento dinámico equivalente.',
      },
      {
        titulo: 'Monitoreo del Tiempo de Contacto',
        subtitulo: 'El Índice de Fuerza Reactiva (RSI) nos dice si la rigidez reactiva está mejorando semana a semana.',
      },
      // Acto 5 — Impacto Institucional (15)
      {
        titulo: 'Menos Lesiones, Más Velocidad',
        subtitulo: 'Un jugador con isquiotibiales y tobillos preparados para el CEA rápido es un jugador que llega entero a diciembre.',
      },
    ],
  },
  {
    manualTo: '/metodologia/ltad-10ma-pre9na',
    titulo: 'LTAD 10ma y Pre 9na (12-13 años)',
    slides: [
      // Acto 1 — Contexto (1-3)
      {
        titulo: 'El Cuerpo que Cambia Solo',
        subtitulo: 'A los 12 años, el esqueleto de un jugador puede crecer más en un año que en cualquier otro momento de su vida.',
      },
      {
        titulo: 'Un Cuerpo Nuevo cada Semana',
        subtitulo:
          'El jugador no se volvió torpe. Su palanca cambió de longitud más rápido de lo que su cerebro pudo aprender a manejarla.',
      },
      {
        titulo: 'Bienvenidos al Pico de Velocidad de Crecimiento',
        subtitulo: 'El Peak Height Velocity (PHV) es la ventana más delicada — y más importante— de todo el recorrido LTAD.',
      },
      // Acto 2 — Ciencia NSCA (4-7)
      {
        titulo: 'Huesos Largos, Músculo Corto',
        subtitulo:
          'El fémur y la tibia crecen en longitud más rápido que la capacidad del músculo y el tendón de estirarse para acompañarlos.',
      },
      {
        titulo: 'El Cartílago de Crecimiento',
        subtitulo:
          'En los extremos de cada hueso largo hay tejido activo, más débil frente a la carga que el hueso adulto que eventualmente lo reemplaza.',
      },
      {
        titulo: 'Torpeza Adolescente, Explicada',
        subtitulo:
          'No es psicológico. La relación entre longitud de palanca y fuerza disponible cambió más rápido de lo que el sistema nervioso pudo recalibrar.',
      },
      {
        titulo: 'Ganancias que Engañan',
        subtitulo: 'La poca fuerza que se ve en esta etapa es casi enteramente neural — coordinación, no músculo nuevo.',
      },
      // Acto 3 — Método del Club (8-11)
      {
        titulo: 'Alfabetización Motora, No Carga',
        subtitulo: 'Sentadilla, bisagra, empuje, tracción, rotación — los cinco patrones fundamentales, sin resistencia externa relevante.',
      },
      {
        titulo: 'Control Motor Pélvico',
        subtitulo: 'Antes de cargar la columna, el jugador tiene que dominar la posición neutra de su propia pelvis.',
      },
      {
        titulo: 'Aterrizajes: la Primera Prevención',
        subtitulo: 'Enseñar a aterrizar de un salto, en esta etapa, previene más lesiones de rodilla que cualquier ejercicio de fuerza futuro.',
      },
      {
        titulo: 'Técnica sin Kilos',
        subtitulo: 'Todo levantamiento se enseña con el propio peso corporal o implementos livianos — el objetivo es el patrón, no la carga.',
      },
      // Acto 4 — Control y Monitoreo (12-14)
      {
        titulo: 'Cero Sobrecarga Axial',
        subtitulo: 'El cartílago de crecimiento activo no tolera compresión repetida alta — es una restricción biomecánica, no una precaución exagerada.',
      },
      {
        titulo: 'Supervisión Individual Constante',
        subtitulo: 'Cada jugador crece a su propio ritmo — el entrenador ajusta la exigencia técnica según lo que ese cuerpo específico puede dar hoy.',
      },
      {
        titulo: 'Prevención Básica, sin Excepciones',
        subtitulo: 'Activación, control postural, educación del aterrizaje — nunca sobrecarga, ni siquiera individualizada.',
      },
      // Acto 5 — Impacto Institucional (15)
      {
        titulo: 'Sembrar para Cosechar en 6ta',
        subtitulo: 'Lo que el club invierte hoy en técnica, sin apuro, es lo que en cuatro años sostiene una fuerza máxima segura.',
      },
    ],
  },
  {
    manualTo: '/metodologia/ltad-9na-8va',
    titulo: 'LTAD 9na y 8va (14-15 años)',
    slides: [
      // Acto 1 — Contexto (1-3)
      {
        titulo: 'El Cuerpo Empieza a Responder',
        subtitulo: 'Por primera vez, el mismo estímulo de gimnasio construye músculo nuevo, no sólo coordinación.',
      },
      {
        titulo: 'La Ventana que se Cierra',
        subtitulo: 'Perder esta etapa sin cargar el cuerpo correctamente es perder la ventana biológica más favorable para construir estructura.',
      },
      {
        titulo: 'La Ventana Anabólica Post-PHV',
        subtitulo: 'Entre 14 y 15 años, el entorno hormonal del cuerpo cambia de forma que no se repite en ningún otro momento del desarrollo.',
      },
      // Acto 2 — Ciencia NSCA (4-7)
      {
        titulo: 'Testosterona, GH, IGF-1',
        subtitulo: 'Tres hormonas anabólicas suben de forma marcada justo después del PHV — la condición que habilita la hipertrofia real.',
      },
      {
        titulo: 'Área de Sección Transversal',
        subtitulo: 'Más sarcómeros en paralelo significa, literalmente, más fuerza máxima disponible. Así crece un músculo.',
      },
      {
        titulo: 'Síntesis de Proteína Neta Positiva',
        subtitulo: 'Tensión mecánica repetida + entorno hormonal favorable = el músculo agrega tejido contráctil nuevo, no sólo eficiencia.',
      },
      {
        titulo: 'Dos Condiciones, No Una',
        subtitulo: 'Sin el estímulo mecánico correcto, el entorno hormonal no sirve de nada. Sin el entorno hormonal, el estímulo no rinde igual.',
      },
      // Acto 3 — Método del Club (8-11)
      {
        titulo: 'Fuerza Estructural',
        subtitulo: 'Ahora sí: volumen moderado, técnica ya consolidada, cargas que empiezan a construir tejido real.',
      },
      {
        titulo: 'Hipertrofia Funcional, No Estética',
        subtitulo: 'Cada kilo de músculo que sumamos tiene un propósito de rendimiento y prevención, no un espejo.',
      },
      {
        titulo: 'El Excéntrico Empieza Acá',
        subtitulo: 'Primera introducción sistemática del trabajo excéntrico — el control de la fase de frenado del movimiento.',
      },
      {
        titulo: 'Blindaje de Isquiotibiales',
        subtitulo: 'Un desbalance de fuerza excéntrica en isquiotibiales es uno de los predictores de lesión mejor documentados del fútbol.',
      },
      // Acto 4 — Control y Monitoreo (12-14)
      {
        titulo: 'Zona Media como Base',
        subtitulo: 'Ningún trabajo excéntrico de pierna rinde si la zona media no sostiene la posición pélvica bajo fatiga.',
      },
      {
        titulo: 'Progresión Conservadora',
        subtitulo: 'El tejido tendinoso todavía no adaptó a la velocidad del crecimiento óseo — el volumen sube, pero de forma paulatina.',
      },
      {
        titulo: 'Monitoreo de Síntomas de Sobreuso',
        subtitulo: 'Rodilla de saltador, apofisitis — el control semanal de síntomas es tan importante como la progresión de carga.',
      },
      // Acto 5 — Impacto Institucional (15)
      {
        titulo: 'Construyendo el Cimiento Definitivo',
        subtitulo: 'Lo que se blinda hoy en isquiotibiales y zona media es lo que en dos años sostiene la fuerza máxima sin lesión.',
      },
    ],
  },
  {
    manualTo: '/metodologia/ltad-7ma-6ta',
    titulo: 'LTAD 7ma y 6ta (16-17 años)',
    slides: [
      // Acto 1 — Contexto (1-3)
      {
        titulo: 'La Carrocería ya está Armada',
        subtitulo: 'Ahora necesitamos que el motor sea rápido y explosivo.',
      },
      {
        titulo: 'Fuerte no es lo Mismo que Rápido',
        subtitulo: 'Un jugador puede tener fuerza máxima alta y seguir siendo lento para producirla a tiempo.',
      },
      {
        titulo: 'Fuerza Máxima y RFD',
        subtitulo: 'Esta etapa entrena, por primera vez con pleno sentido fisiológico, las dos caras de la misma moneda.',
      },
      // Acto 2 — Ciencia NSCA (4-7)
      {
        titulo: 'El Principio del Tamaño',
        subtitulo: 'El sistema nervioso recluta unidades motoras de menor a mayor umbral — las grandes, Tipo IIx y IIa, sólo entran bajo demanda alta.',
      },
      {
        titulo: 'Fibras que Sólo Ahora se Activan',
        subtitulo: 'Reclutar unidades motoras grandes exige un tejido y una sincronización neural que recién convergen a los 16-17 años.',
      },
      {
        titulo: 'Tensión Mecánica como Estímulo',
        subtitulo: 'No es el volumen de repeticiones lo que construye fuerza máxima — es la tensión sostenida bajo carga alta.',
      },
      {
        titulo: 'RFD: la Fuerza contra el Reloj',
        subtitulo: 'Cuánta fuerza produce el atleta en los primeros 100-250 milisegundos — no cuánta fuerza tiene eventualmente.',
      },
      // Acto 3 — Método del Club (8-11)
      {
        titulo: 'Contrastes Fuerza-Velocidad',
        subtitulo: 'Alternar una serie pesada con un movimiento explosivo liviano potencia ambos extremos de la misma curva.',
      },
      {
        titulo: 'Isometría Avanzada, sin Techo',
        subtitulo: 'Overcoming e Yielding pesado entran de lleno — el tejido ya tolera la intensidad máxima.',
      },
      {
        titulo: 'Periodización Ondulante Semanal',
        subtitulo: 'El microciclo por Día de Partido se aplica en su forma completa: cada día ataca una ventana distinta de la curva.',
      },
      {
        titulo: 'Derivados de Levantamiento',
        subtitulo: 'Despegues y tirones entran al programa — patrones que exigen la técnica ya consolidada en las etapas previas.',
      },
      // Acto 4 — Control y Monitoreo (12-14)
      {
        titulo: 'Fuerza Unilateral Pesada',
        subtitulo: 'Cada pierna se carga por separado — la única forma real de detectar y corregir una asimetría interlimb.',
      },
      {
        titulo: 'El Umbral del 10-15%',
        subtitulo: 'Un desbalance de fuerza entre piernas por encima de ese umbral se asocia con mayor riesgo de lesión de rodilla y tobillo.',
      },
      {
        titulo: 'La Técnica Manda sobre la Carga',
        subtitulo: 'La regla operativa de esta etapa: la carga se reduce antes de que la técnica se deteriore, nunca al revés.',
      },
      // Acto 5 — Impacto Institucional (15)
      {
        titulo: 'Los Cimientos del Jugador Profesional',
        subtitulo: 'Lo que se construye acá —fuerza máxima, RFD, simetría— es lo que sostiene toda una carrera.',
      },
    ],
  },
  {
    manualTo: '/metodologia/ltad-5ta-4ta',
    titulo: 'LTAD 5ta y 4ta (18-20 años)',
    slides: [
      // Acto 1 — Contexto (1-3)
      {
        titulo: 'La Puerta al Profesionalismo',
        subtitulo: 'Margen de error cero. Rendimiento puro.',
      },
      {
        titulo: 'Ya no hay Ventana que Explotar',
        subtitulo: 'El desarrollo biológico terminó. Lo que queda es transferencia, no construcción.',
      },
      {
        titulo: 'Transferencia y Potencia',
        subtitulo: 'Esta etapa convierte toda la capacidad construida en las anteriores en rendimiento competitivo directo.',
      },
      // Acto 2 — Ciencia NSCA (4-7)
      {
        titulo: 'Especificidad Metabólica',
        subtitulo: 'El estímulo de entrenamiento tiene que coincidir con la demanda real del partido: potencia repetida sobre 90+ minutos.',
      },
      {
        titulo: 'Fatiga Periférica y Acidosis',
        subtitulo: 'La acumulación de iones de hidrógeno interfiere con el ciclo de los puentes cruzados — el jugador produce menos fuerza y más lento.',
      },
      {
        titulo: 'El Minuto 80, Explicado',
        subtitulo: 'No es sólo cansancio. Es una interferencia bioquímica medible en la maquinaria contráctil del músculo.',
      },
      {
        titulo: 'Transferir, no Construir',
        subtitulo: 'El margen de mejora general ya se agotó. Lo que queda es optimización fina, individual, de detalle.',
      },
      // Acto 3 — Método del Club (8-11)
      {
        titulo: 'Levantamientos Olímpicos',
        subtitulo: 'Arranque y envión adaptados — la máxima expresión de potencia que existe en el entrenamiento de fuerza.',
      },
      {
        titulo: 'Pliometría Compleja',
        subtitulo: 'Combinaciones de saltos que exigen el ciclo estiramiento-acortamiento en su forma más avanzada y específica.',
      },
      {
        titulo: 'Velocity Based Training (VBT)',
        subtitulo: 'Medimos la velocidad de cada repetición en tiempo real — la carga se ajusta al estado del jugador ese día, no a una planilla fija.',
      },
      {
        titulo: 'Fuerza como Vehículo de Potencia',
        subtitulo: 'El objetivo ya no es levantar más peso. Es levantar el mismo peso más rápido.',
      },
      // Acto 4 — Control y Monitoreo (12-14)
      {
        titulo: 'Perfilado Individual de Riesgo',
        subtitulo: 'Cada jugador entra al programa con su propio historial de lesiones como punto de partida, no como nota al margen.',
      },
      {
        titulo: 'Dosis de Mantenimiento Estricta',
        subtitulo: 'Un jugador con antecedente de isquiotibiales no entrena igual que uno sin historial — la dosis se ajusta, no se genera.',
      },
      {
        titulo: 'GPS y Fuerza, Cruzados',
        subtitulo: 'El volumen de sprints y aceleraciones de cada jugador define, semana a semana, cuánta fuerza adicional puede tolerar.',
      },
      // Acto 5 — Impacto Institucional (15)
      {
        titulo: 'El Último Escalón antes de Primera',
        subtitulo: 'Cada decisión de carga en esta etapa es la última oportunidad del club de proteger a un jugador antes de que sea, literalmente, su capital.',
      },
    ],
  },
]
