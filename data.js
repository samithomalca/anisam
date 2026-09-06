/**
 * ANISAM (Moodly) - Catálogo Local de Recomendaciones (Música y Películas)
 * 100 Canciones + 50 Películas clasificadas en 5 emociones:
 * Feliz, Triste, Energia, Relax, Entretenido
 */

// ==========================================================================
// 1. ARREGLO DE CANCIONES (songsCatalog) - 100 Títulos con Vibe y Descripción
// ==========================================================================
const songsCatalog = [
  // FELIZ
  { title: "Walking on Sunshine", artist: "Katrina and the Waves", album: "Katrina and the Waves 2", genre: "Pop / Pop Rock", year: 1985, mood: "Feliz", vibe: "Alegría & Optimismo", description: "Un clásico ochentero brillante lleno de energía positiva y ritmo contagioso." },
  { title: "Happy", artist: "Pharrell Williams", album: "G I R L", genre: "Soul / Pop", year: 2013, mood: "Feliz", vibe: "Euforia & Sonrisas", description: "Ritmo aplaudible y contagioso que eleva el estado de ánimo al instante." },
  { title: "Don't Stop Me Now", artist: "Queen", album: "Jazz", genre: "Rock / Pop Rock", year: 1979, mood: "Feliz", vibe: "Energía Inagotable", description: "Una explosión vocal de Freddie Mercury sobre disfrutar la vida sin frenos." },
  { title: "September", artist: "Earth, Wind & Fire", album: "The Best of Earth, Wind & Fire", genre: "Disco / Funk", year: 1978, mood: "Feliz", vibe: "Fiesta & Viento de Septiembre", description: "Líneas de bajo funk inconfundibles que invitan a bailar de inmediato." },
  { title: "Can't Stop the Feeling!", artist: "Justin Timberlake", album: "Trolls (Banda Sonora)", genre: "Pop / Disco-pop", year: 2016, mood: "Feliz", vibe: "Ritmo Veraniego", description: "Melodía pop moderna diseñada para contagiar buen humor a cualquiera." },
  { title: "Good Vibrations", artist: "The Beach Boys", album: "Smiley Smile", genre: "Pop psicodélico", year: 1966, mood: "Feliz", vibe: "Buenas Vibras", description: "Armonías vocales legendarias con un espíritu costero y luminoso." },
  { title: "Viva la Vida", artist: "Coldplay", album: "Viva la Vida or Death", genre: "Pop rock / Barroco", year: 2008, mood: "Feliz", vibe: "Grandeza & Cuerdas", description: "Orquestación majestuosa que motiva a conquistar cualquier meta." },
  { title: "I Wanna Dance with Somebody", artist: "Whitney Houston", album: "Whitney", genre: "Dance-pop / R&B", year: 1987, mood: "Feliz", vibe: "Baile & Conexión", description: "La icónica voz de Whitney en una joya del pop bailable de los 80." },
  { title: "Uptown Funk", artist: "Mark Ronson ft. Bruno Mars", album: "Uptown Special", genre: "Funk / Soul", year: 2014, mood: "Feliz", vibe: "Estilo & Groove", description: "Bases brass potentes y soltura para un ritmo urbano invencible." },
  { title: "Watermelon Sugar", artist: "Harry Styles", album: "Fine Line", genre: "Pop rock / Indie pop", year: 2019, mood: "Feliz", vibe: "Días Cálidos", description: "Guitarras frescas e imágenes veraniegas cargadas de nostalgia dulce." },
  { title: "On Top of the World", artist: "Imagine Dragons", album: "Night Visions", genre: "Pop alternativo", year: 2012, mood: "Feliz", vibe: "Triunfo & Gratitud", description: "Percusiones animadas que celebran estar en la cumbre del bienestar." },
  { title: "La bicicleta", artist: "Carlos Vives y Shakira", album: "El Dorado", genre: "Pop latino / Vallenato", year: 2016, mood: "Feliz", vibe: "Brisa Caribeña", description: "Un recorrido alegre y sin preocupaciones por la Costa colombiana." },
  { title: "Vivir mi vida", artist: "Marc Anthony", album: "3.0", genre: "Salsa / Pop tropical", year: 2013, mood: "Feliz", vibe: "Celebración de Vida", description: "Un himno tropical sobre reír, bailar y gozar cada momento." },
  { title: "Bailando", artist: "Enrique Iglesias ft. Descemer Bueno", album: "Sex and Love", genre: "Pop latino", year: 2014, mood: "Feliz", vibe: "Fuego Flamenco-Urbano", description: "Fusión bailable inolvidable con guitarras españolas y ritmos latinos." },
  { title: "Me voy", artist: "Julieta Venegas", album: "Limón y sal", genre: "Pop latino / Folk", year: 2006, mood: "Feliz", vibe: "Nuevos Comienzos", description: "Acordeón ligero y una decisión fresca sobre valorarse a uno mismo." },
  { title: "Colgando en tus manos", artist: "Carlos Baute ft. Marta Sánchez", album: "De mi puño y letra", genre: "Pop latino", year: 2008, mood: "Feliz", vibe: "Romance Alegre", description: "Dúo pop pegadizo cargado de romanticismo y buenas melodías." },
  { title: "Azul", artist: "J Balvin", album: "Colores", genre: "Pop latino", year: 2020, mood: "Feliz", vibe: "Vibra Playera", description: "Reggaetón suave y colorido para tardes soleadas de desconexión." },
  { title: "A bailar", artist: "Lali", album: "A bailar", genre: "Pop urbano", year: 2014, mood: "Feliz", vibe: "Movimiento Constante", description: "Energía synth-pop latina para encender la pista de baile." },
  { title: "Can't Stop", artist: "Red Hot Chili Peppers", album: "By the Way", genre: "Funk rock", year: 2002, mood: "Feliz", vibe: "Flujo Cautivador", description: "Riff de guitarra electrizante y lírica rítmica desenfrenada." },
  { title: "Signed, Sealed, Delivered", artist: "Stevie Wonder", album: "Signed, Sealed & Delivered", genre: "Soul / R&B", year: 1970, mood: "Feliz", vibe: "Motown Puro", description: "El sello indiscutible de Stevie Wonder en un clásico lleno de alma." },

  // TRISTE
  { title: "Fix You", artist: "Coldplay", album: "X&Y", genre: "Rock alternativo / Balada", year: 2005, mood: "Triste", vibe: "Consuelo & Sanación", description: "Una progresión de órgano a guitarra que acompaña en momentos de pérdida." },
  { title: "Everybody Hurts", artist: "R.E.M.", album: "Automatic for the People", genre: "Rock alternativo", year: 1992, mood: "Triste", vibe: "Empatía & Apoyo", description: "Un recordatorio de que no estás solo cuando la tristeza acecha." },
  { title: "The Scientist", artist: "Coldplay", album: "A Rush of Blood to the Head", genre: "Piano rock", year: 2002, mood: "Triste", vibe: "Nostalgia & Arrepentimiento", description: "Acordes de piano melancólicos sobre querer regresar al principio de todo." },
  { title: "Skinny Love", artist: "Bon Iver", album: "For Emma, Forever Ago", genre: "Indie folk", year: 2007, mood: "Triste", vibe: "Fragilidad & Acústica", description: "Voz en falsete e intimidad desgarradora grabada en una cabaña solitaria." },
  { title: "Hurt", artist: "Johnny Cash", album: "American IV", genre: "Folk rock", year: 2002, mood: "Triste", vibe: "Reflexión Profunda", description: "La estremecedora interpretación de Cash sobre el tiempo y la vulnerabilidad." },
  { title: "Creep", artist: "Radiohead", album: "Pablo Honey", genre: "Rock alternativo", year: 1992, mood: "Triste", vibe: "Desadaptación & Sensibilidad", description: "Distorsiones de guitarra dramáticas sobre sentirse fuera de lugar." },
  { title: "Someone Like You", artist: "Adele", album: "21", genre: "Pop / Balada", year: 2011, mood: "Triste", vibe: "Despedida Elegante", description: "La majestuosa voz de Adele junto al piano en una despedida inolvidable." },
  { title: "Yesterday", artist: "The Beatles", album: "Help!", genre: "Pop barroco", year: 1965, mood: "Triste", vibe: "Añoranza Clásica", description: "Guitarra acústica y cuarteto de cuerdas en la balada más universal." },
  { title: "Tears in Heaven", artist: "Eric Clapton", album: "Rush", genre: "Folk rock", year: 1992, mood: "Triste", vibe: "Homenaje & Paz", description: "Una conmovedora composición de guitarra dedicada al amor eterno." },
  { title: "Mad World", artist: "Gary Jules", album: "Trading Snake Oil", genre: "Synth-pop / Melancólico", year: 2001, mood: "Triste", vibe: "Soledad Urbana", description: "Una versión introspectiva en piano que desnuda las prisas del mundo." },
  { title: "Saturno", artist: "Pablo Alborán", album: "Prometo", genre: "Pop latino", year: 2017, mood: "Triste", vibe: "Amor Distante", description: "Metáforas astronómicas y voz profunda sobre amores que no pudieron ser." },
  { title: "Corre", artist: "Jesse & Joy", album: "Con quién se queda el perro?", genre: "Pop balada", year: 2011, mood: "Triste", vibe: "Final de Ciclo", description: "Una potente balada en piano sobre dar el paso definitivo y marcharse." },
  { title: "Mientes", artist: "Camila", album: "Dejarte de amar", genre: "Pop balada", year: 2010, mood: "Triste", vibe: "Desengaño", description: "Dramatismo vocal y de cuerdas sobre descubrir la falsedad." },
  { title: "Duele el amor", artist: "Aleks Syntek ft. Ana Torroja", album: "Mundo Lite", genre: "Pop latino", year: 2003, mood: "Triste", vibe: "Distancia & Dolor", description: "Un dúo nostálgico que explora las complicaciones de amar de lejos." },
  { title: "El triste", artist: "José José", album: "El triste", genre: "Balada romántica", year: 1970, mood: "Triste", vibe: "Lírica Legendaria", description: "La monumental interpretación de 'El Príncipe de la Canción' en 1970." },
  { title: "Si nos dejan", artist: "Luis Miguel", album: "Segundo romance", genre: "Bolero", year: 1994, mood: "Triste", vibe: "Romantisismo Melancólico", description: "Cuerdas y arreglos elegantes para un clásico sentimental." },
  { title: "Recuérdame", artist: "Carlos Rivera", album: "Coco", genre: "Balada", year: 2017, mood: "Triste", vibe: "Memoria & Familia", description: "Una canción entrañable sobre mantener vivos los recuerdos de quienes amamos." },
  { title: "Lo pasado, pasado", artist: "José José", album: "Lo pasado, pasado", genre: "Balada pop", year: 1979, mood: "Triste", vibe: "Cierre & Esperanza", description: "Superar el dolor del ayer con una voz inolvidable y llena de matices." },
  { title: "Costumbres", artist: "Juan Gabriel", album: "Recuerdos II", genre: "Balada / Ranchera", year: 1984, mood: "Triste", vibe: "Desamor Insuperable", description: "La maestría compositiva de Juan Gabriel cantando a la costumbre de amar." },
  { title: "Amiga mía", artist: "Alejandro Sanz", album: "Más", genre: "Balada pop", year: 1997, mood: "Triste", vibe: "Confesión Secreta", description: "Lírica poética sobre guardar un sentimiento no correspondido." },

  // ENERGIA
  { title: "Eye of the Tiger", artist: "Survivor", album: "Eye of the Tiger", genre: "Hard rock", year: 1982, mood: "Energia", vibe: "Motivación Pura", description: "El acorde de guitarra motivacional por excelencia para entrenar o superar retos." },
  { title: "Stronger", artist: "Kanye West", album: "Graduation", genre: "Hip hop / Electronic", year: 2007, mood: "Energia", vibe: "Superación Personal", description: "Muestra electrónica de Daft Punk con Beats potentes para superarse." },
  { title: "Power", artist: "Kanye West", album: "My Beautiful Dark Twisted Fantasy", genre: "Hip hop", year: 2010, mood: "Energia", vibe: "Fuerza Dominante", description: "Cantos marciales y ritmos contundentes que inyectan energía instantánea." },
  { title: "Lose Yourself", artist: "Eminem", album: "8 Mile", genre: "Hip hop", year: 2002, mood: "Energia", vibe: "Enfoque Absoluto", description: "La legendaria narrativa de Eminem sobre aprovechar la única oportunidad." },
  { title: "Believer", artist: "Imagine Dragons", album: "Evolve", genre: "Rock alternativo", year: 2017, mood: "Energia", vibe: "Fuerza Imparable", description: "Percusiones pesadas y vocales explosivas sobre transformar el dolor en fuerza." },
  { title: "Centuries", artist: "Fall Out Boy", album: "American Beauty", genre: "Pop rock", year: 2014, mood: "Energia", vibe: "Legado & Ambición", description: "Sampleos épicos de piano y coro enérgico que resuenan como un himno." },
  { title: "Titanium", artist: "David Guetta ft. Sia", album: "Nothing but the Beat", genre: "EDM / House", year: 2011, mood: "Energia", vibe: "Invencibilidad", description: "La imponente voz de Sia sobre drops electrónicos que levantan el ánimo." },
  { title: "Animals", artist: "Martin Garrix", album: "Sencillo", genre: "Electro house", year: 2013, mood: "Energia", vibe: "Pulse Electrónico", description: "El sintetizador icónico que revolucionó las pistas de festivales globales." },
  { title: "Wake Me Up", artist: "Avicii", album: "True", genre: "Folk EDM", year: 2013, mood: "Energia", vibe: "Espíritu Libre", description: "Inolvidable unión de guitarra folclórica con la energía contagiosa de Avicii." },
  { title: "The Final Countdown", artist: "Europe", album: "The Final Countdown", genre: "Hard rock", year: 1986, mood: "Energia", vibe: "Climax Triunfal", description: "El riff de sintetizador más famoso del rock para iniciar momentos épicos." },
  { title: "Gasolina", artist: "Daddy Yankee", album: "Barrio Fino", genre: "Reggaetón", year: 2004, mood: "Energia", vibe: "Fuego Urbano", description: "El clásico que llevó el ritmo latino a las pistas de todo el planeta." },
  { title: "Con altura", artist: "Rosalía y J Balvin", album: "Sencillo", genre: "Electropop / Urbano", year: 2019, mood: "Energia", vibe: "Estilo & Vuelo", description: "Bases pegajosas y la soltura vanguardista de Rosalía." },
  { title: "La Gozadera", artist: "Gente de Zona ft. Marc Anthony", album: "Visualízate", genre: "Salsa / Urbano", year: 2015, mood: "Energia", vibe: "Sabor Latino", description: "Una descarga de ritmo caribeño que pone a bailar a todos los países." },
  { title: "Dura", artist: "Daddy Yankee", album: "Sencillo", genre: "Reggaetón", year: 2018, mood: "Energia", vibe: "Vibra Retro-Urbana", description: "Bajos divertidos y un ritmo old-school para encender cualquier rutina." },
  { title: "Chantaje", artist: "Shakira ft. Maluma", album: "El Dorado", genre: "Pop latino", year: 2016, mood: "Energia", vibe: "Sensualidad Rítmica", description: "Una colaboración llena de ritmo y juego entre dos grandes del pop latino." },
  { title: "Me Rehúso", artist: "Danny Ocean", album: "55", genre: "Reggaetón romántico", year: 2016, mood: "Energia", vibe: "Contagioso & Leal", description: "Sintetizadores alegres y un estribillo urbano imposible de no cantar." },
  { title: "Te Boté (Remix)", artist: "Bad Bunny, Ozuna, Nicky Jam", album: "Sencillo", genre: "Trap latino", year: 2018, mood: "Energia", vibe: "Catarsis & Despecho", description: "El remix récord que dominó las plataformas urbanas con ritmo pesado." },
  { title: "Taki Taki", artist: "DJ Snake ft. Selena Gomez, Ozuna", album: "Carte Blanche", genre: "Reggaetón", year: 2018, mood: "Energia", vibe: "Ritmo Global", description: "Fusión explosiva de productores y voces internacionales." },
  { title: "Hawái", artist: "Maluma", album: "Papi Juancho", genre: "Pop urbano", year: 2020, mood: "Energia", vibe: "Despecho Bailable", description: "Melodía pop urbana pegajosa sobre aparentar en redes sociales." },
  { title: "Despacito", artist: "Luis Fonsi ft. Daddy Yankee", album: "Vida", genre: "Pop latino", year: 2017, mood: "Energia", vibe: "Éxito Mundial", description: "Cuatro de guitarra acústica y el ritmo que rompió récords históricos." },

  // RELAX
  { title: "Weightless", artist: "Marconi Union", album: "Weightless", genre: "Ambient / New Age", year: 2011, mood: "Relax", vibe: "Calma Científica", description: "Diseñada con musicoterapeutas para reducir la frecuencia cardíaca y el estrés." },
  { title: "Gymnopédie No. 1", artist: "Erik Satie", album: "Trois Gymnopédies", genre: "Música clásica / Piano", year: 1888, mood: "Relax", vibe: "Paz Minimalista", description: "Notas de piano espaciadas que transmiten una serenidad atemporal." },
  { title: "Clair de Lune", artist: "Claude Debussy", album: "Impresionista", genre: "Música clásica", year: 1905, mood: "Relax", vibe: "Luz de Luna", description: "Un paisaje sonoro impresionista que evoca calma y contemplación." },
  { title: "Holocene", artist: "Bon Iver", album: "Bon Iver", genre: "Indie folk", year: 2011, mood: "Relax", vibe: "Perspectiva & Aire", description: "Guitarras entrelazadas que brindan una sensación de tranquilidad expansiva." },
  { title: "Sunset Lover", artist: "Petit Biscuit", album: "Presence", genre: "Chillwave", year: 2015, mood: "Relax", vibe: "Atardecer Calmo", description: "Texturas electrónicas suaves y vocales cortadas ideales para descansar." },
  { title: "Breathe (In the Air)", artist: "Pink Floyd", album: "Dark Side of the Moon", genre: "Rock psicodélico", year: 1973, mood: "Relax", vibe: "Respiración Profunda", description: "Guitarras lap-steel flotantes que invitan a pausar las prisas." },
  { title: "River Flows in You", artist: "Yiruma", album: "First Love", genre: "Neoclásica", year: 2001, mood: "Relax", vibe: "Fluidez de Piano", description: "Melodía de piano delicada que fluye serenamente como un manantial." },
  { title: "Teardrop", artist: "Massive Attack", album: "Mezzanine", genre: "Trip hop / Ambient", year: 1998, mood: "Relax", vibe: "Latido Sereno", description: "Clavecín hipnótico y la pacífica voz de Elizabeth Fraser." },
  { title: "Bloom", artist: "The Paper Kites", album: "Woodland", genre: "Ambient pop", year: 2012, mood: "Relax", vibe: "Brisa Acústica", description: "Guitarras fingerpicking y armonías acústicas reconfortantes." },
  { title: "Nightswimming", artist: "R.E.M.", album: "Automatic for the People", genre: "Rock alternativo", year: 1992, mood: "Relax", vibe: "Noche Silenciosa", description: "Piano fluido y oboe sutil en un recuerdo nocturno pacífico." },
  { title: "Ocean Eyes", artist: "Billie Eilish", album: "Don't Smile at Me", genre: "Dream pop", year: 2015, mood: "Relax", vibe: "Sueño Flotante", description: "Sintetizadores etéreos y vocales susurradas con calma abismal." },
  { title: "Huapango", artist: "José Pablo Moncayo", album: "Orquesta Sinfónica", genre: "Clásica mexicana", year: 1941, mood: "Relax", vibe: "Orgullo & Color", description: "Una obra sinfónica majestuosa que evoca los paisajes de México." },
  { title: "Adoro", artist: "Armando Manzanero", album: "A mi amor...", genre: "Bolero", year: 1967, mood: "Relax", vibe: "Poesía Suave", description: "Piano delicado y la calidez lírica inolvidable de Manzanero." },
  { title: "Contigo en la distancia", artist: "Luis Miguel", album: "Romances", genre: "Bolero", year: 1997, mood: "Relax", vibe: "Intimidad Clásica", description: "Voz sutil y arreglos orquestales para momentos de serenidad." },
  { title: "Sabor a mí", artist: "Luis Miguel", album: "Romances", genre: "Bolero", year: 1997, mood: "Relax", vibe: "Tarde Tranquila", description: "Guitarras acopladas y pausa romántica de gran calidad." },
  { title: "Cucurrucucú paloma", artist: "Caetano Veloso", album: "Hable con ella", genre: "Folclore", year: 2002, mood: "Relax", vibe: "Sentimiento Puro", description: "La voz susurrada de Caetano en una de las mejores versiones acústicas." },
  { title: "Alfonsina y el mar", artist: "Mercedes Sosa", album: "Mujeres Argentinas", genre: "Zamba", year: 1969, mood: "Relax", vibe: "Poesía del Mar", description: "La profunda voz de Mercedes Sosa rindiendo homenaje al océano." },
  { title: "La Llorona", artist: "Chavela Vargas", album: "Volver, Volver", genre: "Folclore mexicano", year: 1991, mood: "Relax", vibe: "Alma & Guitarra", description: "La desgarradora e íntima interpretación de Chavela sólo con guitarra." },
  { title: "Volver a los 17", artist: "Violeta Parra", album: "Últimas composiciones", genre: "Nueva Canción", year: 1966, mood: "Relax", vibe: "Sabiduría Folk", description: "Poesía atemporal sobre rejuvenecer el espíritu mediante el amor." },
  { title: "Gracias a la vida", artist: "Mercedes Sosa", album: "Homenaje a Violeta Parra", genre: "Folclore", year: 1971, mood: "Relax", vibe: "Gratitud Profunda", description: "Una declaración de apreciación por la existencia y la naturaleza." },

  // ENTRETENIDO
  { title: "Uptown Girl", artist: "Billy Joel", album: "An Innocent Man", genre: "Pop rock", year: 1983, mood: "Entretenido", vibe: "Alegría Doo-wop", description: "Armonías vocales estilo años 50 con una narrativa divertida e infecciosa." },
  { title: "Mr. Blue Sky", artist: "Electric Light Orchestra", album: "Out of the Blue", genre: "Pop rock / Orquestal", year: 1977, mood: "Entretenido", vibe: "Sol & Sinfonía Pop", description: "Efectos vocales creativos, campanas y arreglos que sacan una sonrisa." },
  { title: "Dance the Night", artist: "Dua Lipa", album: "Barbie The Album", genre: "Disco / Pop", year: 2023, mood: "Entretenido", vibe: "Glitter & Disco", description: "Guitarras funk relucientes compuestas para pasar un rato espectacular." },
  { title: "Levitating", artist: "Dua Lipa", album: "Future Nostalgia", genre: "Disco-pop", year: 2020, mood: "Entretenido", vibe: "Viaje Espacial", description: "Ritmo cósmico bailable con energía retro de alta fidelidad." },
  { title: "Dynamite", artist: "BTS", album: "BE", genre: "Disco-pop", year: 2020, mood: "Entretenido", vibe: "Chispa Pop", description: "Bases funk en inglés que iluminan el ambiente con pasos de baile." },
  { title: "Blinding Lights", artist: "The Weeknd", album: "After Hours", genre: "Synth-pop", year: 2019, mood: "Entretenido", vibe: "Retrowave 80s", description: "Sintetizadores vibrantes que transportan a una carrera nocturna iluminada." },
  { title: "Shake It Off", artist: "Taylor Swift", album: "1989", genre: "Pop", year: 2014, mood: "Entretenido", vibe: "Despreocupación", description: "Vientos metales alegres y una actitud ligera ante las opiniones ajenas." },
  { title: "Sugar", artist: "Maroon 5", album: "V", genre: "Pop funk", year: 2015, mood: "Entretenido", vibe: "Dulce & Pegajoso", description: "Guitarras rítmicas y falsetes pop ideales para levantar el ánimo." },
  { title: "Hey Ya!", artist: "Outkast", album: "Speakerboxxx", genre: "Funk / Pop", year: 2003, mood: "Entretenido", vibe: "Ritmo Incomparable", description: "Una mezcla explosiva de pop, funk y rock imposible de dejar de bailar." },
  { title: "I Gotta Feeling", artist: "The Black Eyed Peas", album: "The E.N.D.", genre: "Dance-pop", year: 2009, mood: "Entretenido", vibe: "Gran Noche", description: "El himno definitivo para salir a divertirse con amigos." },
  { title: "Oye mi canto", artist: "Shakira", album: "Laundry Service", genre: "Pop latino", year: 2001, mood: "Entretenido", vibe: "Fusión Latina", description: "Trompetas y tambores caribeños con la inconfundible voz de Shakira." },
  { title: "Como la flor", artist: "Selena", album: "Entre a mi mundo", genre: "Cumbia / Tex-Mex", year: 1992, mood: "Entretenido", vibe: "Clásico Tex-Mex", description: "El ritmo insuperable de Selena Quintanilla que sigue haciendo cantar a todos." },
  { title: "Bidi Bidi Bom Bom", artist: "Selena", album: "Amor prohibido", genre: "Cumbia pop", year: 1994, mood: "Entretenido", vibe: "Alegría Contagiosa", description: "Bajo sabroso y el encanto único de la reina del Tex-Mex." },
  { title: "La Macarena", artist: "Los Del Río", album: "A mí me gusta", genre: "Pop latino", year: 1993, mood: "Entretenido", vibe: "Coreografía Mundial", description: "La canción y baile que conquistó las listas globales durante los 90." },
  { title: "Aserejé", artist: "Las Ketchup", album: "Hijas del Tomate", genre: "Pop latino", year: 2002, mood: "Entretenido", vibe: "Fenómeno Pop", description: "Estribillo fonético inolvidable que marcó a toda una generación." },
  { title: "El Tiburón", artist: "Proyecto Uno", album: "In Da House", genre: "Merengue-house", year: 1996, mood: "Entretenido", vibe: "Fiesta 90s", description: "Fusión tropical de merengue con rap que no pasa de moda." },
  { title: "Suavemente", artist: "Elvis Crespo", album: "Suavemente", genre: "Merengue", year: 1998, mood: "Entretenido", vibe: "Sabor Puerto Rico", description: "Vientos potentes y ritmo caribeño indiscutible." },
  { title: "Mayonesa", artist: "Chocolate", album: "Mayonesa", genre: "Pop tropical", year: 2001, mood: "Entretenido", vibe: "Baile Divertido", description: "Un éxito bailable lleno de humor y ritmo rioplatense." },
  { title: "Mambo No. 5", artist: "Lou Bega", album: "A Little Bit of Mambo", genre: "Mambo pop", year: 1999, mood: "Entretenido", vibe: "Orquesta Divertida", description: "Metales de mambo con estribillos pegajosos y energía de fiesta." }
];

// ==========================================================================
// 2. ARREGLO DE PELÍCULAS (moviesCatalog) - Exclusivamente Películas (type: "movie")
// ==========================================================================
const moviesCatalog = [
  // FELIZ (Películas)
  { 
    title: "Amigos (Intouchables)", titulo: "Amigos (Intouchables)", type: "movie", genre: "Comedia / Drama", year: 2011, duration: "1h 52m", mood: "Feliz", match: "99%", poster: "assets/happy_series_poster.png",
    director: "Olivier Nakache, Éric Toledano", actors: "François Cluzet, Omar Sy", theme: "Amistad & Superación", platform: "Netflix",
    description: "La conmovedora e hilarante amistad entre un aristócrata y su cuidador de los suburbios.", synopsis: "La conmovedora e hilarante amistad entre un aristócrata y su cuidador de los suburbios." 
  },
  { 
    title: "La La Land", titulo: "La La Land", type: "movie", genre: "Musical / Romance", year: 2016, duration: "2h 08m", mood: "Feliz", match: "98%", poster: "assets/happy_series_poster.png",
    director: "Damien Chazelle", actors: "Ryan Gosling, Emma Stone", theme: "Sueños & Amor", platform: "Prime Video",
    description: "Un pianista de jazz y una aspirante a actriz persiguen sus sueños en Los Ángeles.", synopsis: "Un pianista de jazz y una aspirante a actriz persiguen sus sueños en Los Ángeles." 
  },
  { 
    title: "Little Miss Sunshine", titulo: "Little Miss Sunshine", type: "movie", genre: "Comedia / Indie", year: 2006, duration: "1h 41m", mood: "Feliz", match: "97%", poster: "assets/happy_series_poster.png",
    director: "Jonathan Dayton, Valerie Faris", actors: "Abigail Breslin, Steve Carell, Toni Collette", theme: "Unión Familiar", platform: "Disney+",
    description: "Una excéntrica familia viaja en furgoneta para apoyar el sueño de su hija pequeña.", synopsis: "Una excéntrica familia viaja en furgoneta para apoyar el sueño de su hija pequeña." 
  },
  { 
    title: "Paddington 2", titulo: "Paddington 2", type: "movie", genre: "Familia / Aventura", year: 2017, duration: "1h 43m", mood: "Feliz", match: "99%", poster: "assets/happy_series_poster.png",
    director: "Paul King", actors: "Ben Whishaw, Hugh Grant", theme: "Bondad & Optimismo", platform: "HBO Max",
    description: "El entrañable oso Paddington busca el regalo perfecto para su tía Lucy en Londres.", synopsis: "El entrañable oso Paddington busca el regalo perfecto para su tía Lucy en Londres." 
  },
  { 
    title: "Amélie", titulo: "Amélie", type: "movie", genre: "Comedia Romántica", year: 2001, duration: "2h 02m", mood: "Feliz", match: "98%", poster: "assets/happy_series_poster.png",
    director: "Jean-Pierre Jeunet", actors: "Audrey Tautou, Mathieu Kassovitz", theme: "Felicidad Cotidiana", platform: "Apple TV+",
    description: "Una camarera parisina decide mejorar en secreto la vida de las personas que la rodean.", synopsis: "Una camarera parisina decide mejorar en secreto la vida de las personas que la rodean." 
  },
  { 
    title: "Sing Street", titulo: "Sing Street", type: "movie", genre: "Música / Comedia", year: 2016, duration: "1h 46m", mood: "Feliz", match: "96%", poster: "assets/happy_series_poster.png",
    director: "John Carney", actors: "Ferdia Walsh-Peelo, Lucy Boynton", theme: "Juventud & Música", platform: "Prime Video",
    description: "Un joven de Dublín en los 80 forma una banda de rock para impresionar a una chica.", synopsis: "Un joven de Dublín en los 80 forma una banda de rock para impresionar a una chica." 
  },
  { 
    title: "Mamma Mia!", titulo: "Mamma Mia!", type: "movie", genre: "Musical / Comedia", year: 2008, duration: "1h 48m", mood: "Feliz", match: "95%", poster: "assets/happy_series_poster.png",
    director: "Phyllida Lloyd", actors: "Meryl Streep, Amanda Seyfried, Pierce Brosnan", theme: "Celebración & Alegría", platform: "Netflix",
    description: "Una novia en una isla griega busca descubrir la identidad de su padre cantando ABBA.", synopsis: "Una novia en una isla griega busca descubrir la identidad de su padre cantando ABBA." 
  },
  { 
    title: "Soul", titulo: "Soul", type: "movie", genre: "Animación / Familia", year: 2020, duration: "1h 40m", mood: "Feliz", match: "98%", poster: "assets/happy_series_poster.png",
    director: "Pete Docter", actors: "Jamie Foxx, Tina Fey", theme: "Propósito de Vida", platform: "Disney+",
    description: "Un profesor de música viaja al Gran Antes para descubrir qué nos hace tener alma.", synopsis: "Un profesor de música viaja al Gran Antes para descubrir qué nos hace tener alma." 
  },
  { 
    title: "Chef", titulo: "Chef", type: "movie", genre: "Comedia / Gastronomía", year: 2014, duration: "1h 54m", mood: "Feliz", match: "96%", poster: "assets/happy_series_poster.png",
    director: "Jon Favreau", actors: "Jon Favreau, Sofía Vergara, John Leguizamo", theme: "Pasión & Reinvención", platform: "Prime Video",
    description: "Un talentoso chef reinicia su pasión creando un food truck de comida latina con su hijo.", synopsis: "Un talentoso chef reinicia su pasión creando un food truck de comida latina con su hijo." 
  },
  { 
    title: "La novicia rebelde (The Sound of Music)", titulo: "La novicia rebelde", type: "movie", genre: "Musical Clásico", year: 1965, duration: "2h 54m", mood: "Feliz", match: "97%", poster: "assets/happy_series_poster.png",
    director: "Robert Wise", actors: "Julie Andrews, Christopher Plummer", theme: "Esperanza & Música", platform: "Disney+",
    description: "Una novicia lleva música y alegría a los siete hijos de un estricto capitán austríaco.", synopsis: "Una novicia lleva música y alegría a los siete hijos de un estricto capitán austríaco." 
  },

  // TRISTE (Películas)
  { 
    title: "Manchester junto al mar", titulo: "Manchester junto al mar", type: "movie", genre: "Drama Profundo", year: 2016, duration: "2h 17m", mood: "Triste", match: "98%", poster: "assets/movie_poster_echoes.png",
    director: "Kenneth Lonergan", actors: "Casey Affleck, Michelle Williams", theme: "Duelo & Culpabilidad", platform: "Prime Video",
    description: "Un hombre atormentado por su pasado regresa a su pueblo para cuidar a su sobrino.", synopsis: "Un hombre atormentado por su pasado regresa a su pueblo para cuidar a su sobrino." 
  },
  { 
    title: "Eterno resplandor de una mente sin recuerdos", titulo: "Eterno resplandor de una mente sin recuerdos", type: "movie", genre: "Drama / Romance", year: 2004, duration: "1h 48m", mood: "Triste", match: "99%", poster: "assets/movie_poster_echoes.png",
    director: "Michel Gondry", actors: "Jim Carrey, Kate Winslet", theme: "Memoria & Desamor", platform: "HBO Max",
    description: "Una pareja se somete a un procedimiento médico para borrar sus recuerdos mutuos.", synopsis: "Una pareja se somete a un procedimiento médico para borrar sus recuerdos mutuos." 
  },
  { 
    title: "En busca de la felicidad", titulo: "En busca de la felicidad", type: "movie", genre: "Drama Inspirador", year: 2006, duration: "1h 57m", mood: "Triste", match: "97%", poster: "assets/movie_poster_echoes.png",
    director: "Gabriele Muccino", actors: "Will Smith, Jaden Smith", theme: "Sacrificio & Amor Paterno", platform: "Netflix",
    description: "Un padre lucha sin descanso junto a su hijo superando la bancarrota en San Francisco.", synopsis: "Un padre lucha sin descanso junto a su hijo superando la bancarrota en San Francisco." 
  },
  { 
    title: "La lista de Schindler", titulo: "La lista de Schindler", type: "movie", genre: "Drama Histórico", year: 1993, duration: "3h 15m", mood: "Triste", match: "99%", poster: "assets/movie_poster_echoes.png",
    director: "Steven Spielberg", actors: "Liam Neeson, Ben Kingsley, Ralph Fiennes", theme: "Humanidad en la Tragedia", platform: "Prime Video",
    description: "Un empresario alemán salva la vida de más de mil refugiados judios durante el Holocausto.", synopsis: "Un empresario alemán salva la vida de más de mil refugiados judios durante el Holocausto." 
  },
  { 
    title: "La tumba de las luciérnagas", titulo: "La tumba de las luciérnagas", type: "movie", genre: "Animación / Bélico", year: 1988, duration: "1h 29m", mood: "Triste", match: "98%", poster: "assets/movie_poster_echoes.png",
    director: "Isao Takahata", actors: "Tsutomu Tatsumi, Ayano Shiraishi", theme: "Inocencia Perdida", platform: "Netflix",
    description: "Dos hermanos luchan por sobrevivir solos en el Japón de la Segunda Guerra Mundial.", synopsis: "Dos hermanos luchan por sobrevivir solos en el Japón de la Segunda Guerra Mundial." 
  },
  { 
    title: "Nace una estrella (A Star Is Born)", titulo: "Nace una estrella", type: "movie", genre: "Drama / Musical", year: 2018, duration: "2h 16m", mood: "Triste", match: "96%", poster: "assets/movie_poster_echoes.png",
    director: "Bradley Cooper", actors: "Lady Gaga, Bradley Cooper", theme: "Fama & Adicciones", platform: "HBO Max",
    description: "Un veterano músico ayuda a lanzar la carrera de una joven artista mientras sus demonios lo consumen.", synopsis: "Un veterano músico ayuda a lanzar la carrera de una joven artista mientras sus demonios lo consumen." 
  },
  { 
    title: "La milla verde", titulo: "La milla verde", type: "movie", genre: "Drama / Fantasía", year: 1999, duration: "3h 09m", mood: "Triste", match: "98%", poster: "assets/movie_poster_echoes.png",
    director: "Frank Darabont", actors: "Tom Hanks, Michael Clarke Duncan", theme: "Justicia & Milagros", platform: "Prime Video",
    description: "Un guardia del corredor de la muerte descubre que un recluso posee un milagroso don.", synopsis: "Un guardia del corredor de la muerte descubre que un recluso posee un milagroso don." 
  },
  { 
    title: "Historia de un matrimonio", titulo: "Historia de un matrimonio", type: "movie", genre: "Drama Intimista", year: 2019, duration: "2h 16m", mood: "Triste", match: "97%", poster: "assets/movie_poster_echoes.png",
    director: "Noah Baumbach", actors: "Scarlett Johansson, Adam Driver", theme: "Ruptura & Comprensión", platform: "Netflix",
    description: "Un director de teatro y su esposa actriz enfrentan un complejo proceso de divorcio.", synopsis: "Un director de teatro y su esposa actriz enfrentan un complejo proceso de divorcio." 
  },
  { 
    title: "La vida es bella", titulo: "La vida es bella", type: "movie", genre: "Drama / Comedia", year: 1997, duration: "1h 56m", mood: "Triste", match: "99%", poster: "assets/movie_poster_echoes.png",
    director: "Roberto Benigni", actors: "Roberto Benigni, Nicoletta Braschi", theme: "Amor Incondicional", platform: "Apple TV+",
    description: "Un padre usa el humor y la imaginación para proteger a su hijo en un campo de concentración.", synopsis: "Un padre usa el humor y la imaginación para proteger a su hijo en un campo de concentración." 
  },
  { 
    title: "La sociedad de los poetas muertos", titulo: "La sociedad de los poetas muertos", type: "movie", genre: "Drama Educativo", year: 1989, duration: "2h 08m", mood: "Triste", match: "98%", poster: "assets/movie_poster_echoes.png",
    director: "Peter Weir", actors: "Robin Williams, Robert Sean Leonard, Ethan Hawke", theme: "Carpe Diem & Libertad", platform: "Disney+",
    description: "Un profesor heterodoxo inspira a sus alumnos a amar la poesía y vivir el momento.", synopsis: "Un profesor heterodoxo inspira a sus alumnos a amar la poesía y vivir el momento." 
  },
  { 
    title: "Echoes of Calm", titulo: "Echoes of Calm", type: "movie", genre: "Drama / Poético", year: 2023, duration: "2h 05m", mood: "Triste", match: "98%", poster: "assets/movie_poster_echoes.png",
    director: "Julian Vance", actors: "Claire Redfield, Samuel Stone", theme: "Serenidad Interior", platform: "ANISAM Original",
    description: "Una conmovedora historia sobre la superación y el abrazo a la serenidad interior.", synopsis: "Una conmovedora historia sobre la superación y el abrazo a la serenidad interior." 
  },

  // ENERGIA (Películas)
  { 
    title: "Mad Max: Furia en el camino", titulo: "Mad Max: Furia en el camino", type: "movie", genre: "Acción Postapocalíptica", year: 2015, duration: "2h 00m", mood: "Energia", match: "99%", poster: "assets/energetic_synth_art.png",
    director: "George Miller", actors: "Tom Hardy, Charlize Theron", theme: "Adrenalina & Libertad", platform: "HBO Max",
    description: "En un desierto distópico, una mujer se rebela contra un tirano liderando una huida frenética.", synopsis: "En un desierto distópico, una mujer se rebela contra un tirano liderando una huida frenética." 
  },
  { 
    title: "Top Gun: Maverick", titulo: "Top Gun: Maverick", type: "movie", genre: "Acción / Aviación", year: 2022, duration: "2h 10m", mood: "Energia", match: "99%", poster: "assets/energetic_synth_art.png",
    director: "Joseph Kosinski", actors: "Tom Cruise, Miles Teller, Jennifer Connelly", theme: "Valentía & Velocidad", platform: "Paramount+ / Prime Video",
    description: "Maverick entrena a una promoción de pilotos de combate para una misión extrema sin retorno.", synopsis: "Maverick entrena a una promoción de pilotos de combate para una misión extrema sin retorno." 
  },
  { 
    title: "Avengers: Endgame", titulo: "Avengers: Endgame", type: "movie", genre: "Acción / Superhéroes", year: 2019, duration: "3h 01m", mood: "Energia", match: "98%", poster: "assets/energetic_synth_art.png",
    director: "Anthony Russo, Joe Russo", actors: "Robert Downey Jr., Chris Evans, Scarlett Johansson", theme: "Épica & Sacrificio", platform: "Disney+",
    description: "Los Vengadores sobrevivientes se reúnen para revertir las acciones de Thanos.", synopsis: "Los Vengadores sobrevivientes se reúnen para revertir las acciones de Thanos." 
  },
  { 
    title: "John Wick", titulo: "John Wick", type: "movie", genre: "Acción / Thriller", year: 2014, duration: "1h 41m", mood: "Energia", match: "97%", poster: "assets/energetic_synth_art.png",
    director: "Chad Stahelski", actors: "Keanu Reeves, Michael Nyqvist", theme: "Venganza & Combate", platform: "Prime Video",
    description: "Un legendario asesino retirado vuelve a las armas para vengar una pérdida personal.", synopsis: "Un legendario asesino retirado vuelve a las armas para vengar una pérdida personal." 
  },
  { 
    title: "Batman: El caballero de la noche", titulo: "Batman: El caballero de la noche", type: "movie", genre: "Acción / Crimen", year: 2008, duration: "2h 32m", mood: "Energia", match: "99%", poster: "assets/energetic_synth_art.png",
    director: "Christopher Nolan", actors: "Christian Bale, Heath Ledger", theme: "Caos vs Justicia", platform: "HBO Max",
    description: "Batman enfrenta su mayor desafío psicológico y físico contra el Guasón en Ciudad Gótica.", synopsis: "Batman enfrenta su mayor desafío psicológico y físico contra el Guasón en Ciudad Gótica." 
  },
  { 
    title: "Rápidos y Furiosos 5", titulo: "Rápidos y Furiosos 5", type: "movie", genre: "Acción / Autos", year: 2011, duration: "2h 10m", mood: "Energia", match: "95%", poster: "assets/energetic_synth_art.png",
    director: "Justin Lin", actors: "Vin Diesel, Paul Walker, Dwayne Johnson", theme: "Fuerza & Lealtad", platform: "Netflix",
    description: "Dominic Toretto y su equipo organizan un atraco de 100 millones en Río de Janeiro.", synopsis: "Dominic Toretto y su equipo organizan un atraco de 100 millones en Río de Janeiro." 
  },
  { 
    title: "Misión Imposible: Repercusión", titulo: "Misión Imposible: Repercusión", type: "movie", genre: "Acción / Espionaje", year: 2018, duration: "2h 27m", mood: "Energia", match: "98%", poster: "assets/energetic_synth_art.png",
    director: "Christopher McQuarrie", actors: "Tom Cruise, Henry Cavill, Rebecca Ferguson", theme: "Riesgo Extremo", platform: "Paramount+",
    description: "Ethan Hunt y su equipo corren contra el tiempo tras una misión fallida que pone en riesgo al mundo.", synopsis: "Ethan Hunt y su equipo corren contra el tiempo tras una misión fallida que pone en riesgo al mundo." 
  },
  { 
    title: "Gladiador", titulo: "Gladiador", type: "movie", genre: "Acción / Épico", year: 2000, duration: "2h 35m", mood: "Energia", match: "98%", poster: "assets/energetic_synth_art.png",
    director: "Ridley Scott", actors: "Russell Crowe, Joaquin Phoenix", theme: "Honor & Venganza", platform: "Netflix",
    description: "Un general romano traicionado busca venganza contra el corrupto emperador en el Coliseo.", synopsis: "Un general romano traicionado busca venganza contra el corrupto emperador en el Coliseo." 
  },
  { 
    title: "Whiplash", titulo: "Whiplash", type: "movie", genre: "Drama / Música", year: 2014, duration: "1h 46m", mood: "Energia", match: "99%", poster: "assets/energetic_synth_art.png",
    director: "Damien Chazelle", actors: "Miles Teller, J.K. Simmons", theme: "Obsesión & Excelencia", platform: "Netflix",
    description: "Un joven baterista de jazz es llevado al límite por su despiadado e insaciable instructor.", synopsis: "Un joven baterista de jazz es llevado al límite por su despiadado e insaciable instructor." 
  },
  { 
    title: "Rocky", titulo: "Rocky", type: "movie", genre: "Deportes / Drama", year: 1976, duration: "1h 59m", mood: "Energia", match: "97%", poster: "assets/energetic_synth_art.png",
    director: "John G. Avildsen", actors: "Sylvester Stallone, Talia Shire", theme: "Perseverancia", platform: "Prime Video",
    description: "Un boxeador de poca monta recibe la oportunidad de luchar contra el campeón mundial pesados.", synopsis: "Un boxeador de poca monta recibe la oportunidad de luchar contra el campeón mundial pesados." 
  },
  { 
    title: "Neon Overdrive", titulo: "Neon Overdrive", type: "movie", genre: "Acción / Cyberpunk", year: 2024, duration: "2h 15m", mood: "Energia", match: "97%", poster: "assets/energetic_synth_art.png",
    director: "Kenji Sato", actors: "Ryu Tanaka, Maya Lin", theme: "Futurismo & Carreras", platform: "ANISAM Original",
    description: "Un thriller cibernético cargado de adrenalina y carreras extremas neon.", synopsis: "Un thriller cibernético cargado de adrenalina y carreras extremas neon." 
  },

  // RELAX (Películas)
  { 
    title: "Mi vecino Totoro", titulo: "Mi vecino Totoro", type: "movie", genre: "Animación / Fantasía", year: 1988, duration: "1h 26m", mood: "Relax", match: "99%", poster: "assets/movie_poster_echoes.png",
    director: "Hayao Miyazaki", actors: "Noriko Hidaka, Chika Sakamoto", theme: "Naturaleza & Magia Infantil", platform: "Netflix",
    description: "Dos niñas entablan amistad con un espíritu del bosque en el Japón rural.", synopsis: "Dos niñas entablan amistad con un espíritu del bosque en el Japón rural." 
  },
  { 
    title: "El viaje de Chihiro", titulo: "El viaje de Chihiro", type: "movie", genre: "Animación / Aventura", year: 2001, duration: "2h 05m", mood: "Relax", match: "99%", poster: "assets/movie_poster_echoes.png",
    director: "Hayao Miyazaki", actors: "Rumi Hiiragi, Miyu Irino", theme: "Madurez & Espiritualidad", platform: "Netflix",
    description: "Una niña de 10 años se adentra en un mundo mágico de espíritus y dioses.", synopsis: "Una niña de 10 años se adentra en un mundo mágico de espíritus y dioses." 
  },
  { 
    title: "Un buen día en el vecindario", titulo: "Un buen día en el vecindario", type: "movie", genre: "Drama Sereno", year: 2019, duration: "1h 49m", mood: "Relax", match: "96%", poster: "assets/movie_poster_echoes.png",
    director: "Marielle Heller", actors: "Tom Hanks, Matthew Rhys", theme: "Bondad & Perdón", platform: "Prime Video",
    description: "Un periodista cínico entabla una reconfortante amistad con el querido presentador Fred Rogers.", synopsis: "Un periodista cínico entabla una reconfortante amistad con el querido presentador Fred Rogers." 
  },
  { 
    title: "Medianoche en París", titulo: "Medianoche en París", type: "movie", genre: "Comedia Romántica", year: 2011, duration: "1h 34m", mood: "Relax", match: "97%", poster: "assets/movie_poster_echoes.png",
    director: "Woody Allen", actors: "Owen Wilson, Rachel McAdams, Marion Cotillard", theme: "Arte & Nostalgia", platform: "HBO Max",
    description: "Un guionista viaja mágicamente al París de los años 20 todas las medianoches.", synopsis: "Un guionista viaja mágicamente al París de los años 20 todas las medianoches." 
  },
  { 
    title: "El fantástico Sr. Zorro", titulo: "El fantástico Sr. Zorro", type: "movie", genre: "Stop-motion / Aventura", year: 2009, duration: "1h 27m", mood: "Relax", match: "96%", poster: "assets/movie_poster_echoes.png",
    director: "Wes Anderson", actors: "George Clooney, Meryl Streep", theme: "Ingenio & Familia", platform: "Disney+",
    description: "Un astuto zorro organiza un ingenioso plan para burla a tres avariciosos granjeros.", synopsis: "Un astuto zorro organiza un ingenioso plan para burla a tres avariciosos granjeros." 
  },
  { 
    title: "La increíble vida de Walter Mitty", titulo: "La increíble vida de Walter Mitty", type: "movie", genre: "Aventura / Drama", year: 2013, duration: "1h 54m", mood: "Relax", match: "97%", poster: "assets/movie_poster_echoes.png",
    director: "Ben Stiller", actors: "Ben Stiller, Kristen Wiig", theme: "Paz & Descubrimiento", platform: "Disney+",
    description: "Un soñador rutinario emprende un viaje real por paisajes asombrosos del mundo.", synopsis: "Un soñador rutinario emprende un viaje real por paisajes asombrosos del mundo." 
  },
  { 
    title: "Baraka", titulo: "Baraka", type: "movie", genre: "Documental Visual", year: 1992, duration: "1h 36m", mood: "Relax", match: "98%", poster: "assets/movie_poster_echoes.png",
    director: "Ron Fricke", actors: "Sin diálogos", theme: "Armonía & Planeta", platform: "YouTube / Prime",
    description: "Un recorrido poético sin palabras por la naturaleza, la religión y la condición humana.", synopsis: "Un recorrido poético sin palabras por la naturaleza, la religión y la condición humana." 
  },
  { 
    title: "Nuestro planeta", titulo: "Nuestro planeta", type: "movie", genre: "Documental Naturaleza", year: 2019, duration: "1h 30m", mood: "Relax", match: "99%", poster: "assets/movie_poster_echoes.png",
    director: "Alastair Fothergill", actors: "David Attenborough, Salma Hayek", theme: "Maravillas Terrestres", platform: "Netflix",
    description: "Asombrosas imágenes en alta definición de la vida salvaje en los ecosistemas de la Tierra.", synopsis: "Asombrosas imágenes en alta definición de la vida salvaje en los ecosistemas de la Tierra." 
  },
  { 
    title: "El Silencio de los Valles", titulo: "El Silencio de los Valles", type: "movie", genre: "Documental / Naturaleza", year: 2022, duration: "1h 30m", mood: "Relax", match: "99%", poster: "assets/movie_poster_echoes.png",
    director: "Laura Sola", actors: "Sonidos de la Naturaleza", theme: "Paz & Bosques", platform: "ANISAM Original",
    description: "Imágenes pacíficas y sonidos envolventes de los bosques más vírgenes del planeta.", synopsis: "Imágenes pacíficas y sonidos envolventes de los bosques más vírgenes del planeta." 
  },
  { 
    title: "El viaje del emperador", titulo: "El viaje del emperador", type: "movie", genre: "Documental", year: 2005, duration: "1h 25m", mood: "Relax", match: "96%", poster: "assets/movie_poster_echoes.png",
    director: "Luc Jacquet", actors: "Morgan Freeman, Charles Berling", theme: "Persistencia Pacífica", platform: "Prime Video",
    description: "El épico viaje de los pingüinos emperador para reproducirse en la Antártida.", synopsis: "El épico viaje de los pingüinos emperador para reproducirse en la Antártida." 
  },

  // ENTRETENIDO (Películas)
  { 
    title: "El origen (Inception)", titulo: "El origen", type: "movie", genre: "Sci-Fi / Thriller", year: 2010, duration: "2h 28m", mood: "Entretenido", match: "99%", poster: "assets/energetic_synth_art.png",
    director: "Christopher Nolan", actors: "Leonardo DiCaprio, Joseph Gordon-Levitt, Elliot Page", theme: "Sueños & Realidad", platform: "HBO Max",
    description: "Un ladrón que roba secretos corporativos a través del sueño debe implantar una idea.", synopsis: "Un ladrón que roba secretos corporativos a través del sueño debe implantar una idea." 
  },
  { 
    title: "Entre navajas y secretos (Knives Out)", titulo: "Entre navajas y secretos", type: "movie", genre: "Misterio / Comedia", year: 2019, duration: "2h 10m", mood: "Entretenido", match: "98%", poster: "assets/energetic_synth_art.png",
    director: "Rian Johnson", actors: "Daniel Craig, Ana de Armas, Chris Evans", theme: "Intriga & Detective", platform: "Netflix",
    description: "Un perspicaz detective investiga la misteriosa muerte del patriarca de una excéntrica familia.", synopsis: "Un perspicaz detective investiga la misteriosa muerte del patriarca de una excéntrica familia." 
  },
  { 
    title: "Volver al futuro", titulo: "Volver al futuro", type: "movie", genre: "Sci-Fi / Aventura", year: 1985, duration: "1h 56m", mood: "Entretenido", match: "99%", poster: "assets/energetic_synth_art.png",
    director: "Robert Zemeckis", actors: "Michael J. Fox, Christopher Lloyd", theme: "Viajes en el Tiempo", platform: "Prime Video",
    description: "Marty McFly viaja accidentalmente a 1955 en un DeLorean inventado por el profesor Doc Brown.", synopsis: "Marty McFly viaja accidentalmente a 1955 en un DeLorean inventado por el profesor Doc Brown." 
  },
  { 
    title: "El gran hotel Budapest", titulo: "El gran hotel Budapest", type: "movie", genre: "Comedia / Estética", year: 2014, duration: "1h 39m", mood: "Entretenido", match: "98%", poster: "assets/energetic_synth_art.png",
    director: "Wes Anderson", actors: "Ralph Fiennes, Tony Revolori", theme: "Aventura & Arte", platform: "Star+ / Disney+",
    description: "Las aventuras de un legendario conserje de un famoso hotel europeo y su leal botones.", synopsis: "Las aventuras de un legendario conserje de un famoso hotel europeo y su leal botones." 
  },
  { 
    title: "Todo en todas partes al mismo tiempo", titulo: "Todo en todas partes al mismo tiempo", type: "movie", genre: "Multiverso / Acción", year: 2022, duration: "2h 19m", mood: "Entretenido", match: "99%", poster: "assets/energetic_synth_art.png",
    director: "Daniel Kwan, Daniel Scheinert", actors: "Michelle Yeoh, Ke Huy Quan, Jamie Lee Curtis", theme: "Multiverso & Familia", platform: "Prime Video",
    description: "Una inmigrante china en EE. UU. se conecta con sus versiones de otros universos para salvar la existencia.", synopsis: "Una inmigrante china en EE. UU. se conecta con sus versiones de otros universos para salvar la existencia." 
  },
  { 
    title: "Atrápame si puedes", titulo: "Atrápame si puedes", type: "movie", genre: "Biografía / Comedia", year: 2002, duration: "2h 21m", mood: "Entretenido", match: "97%", poster: "assets/energetic_synth_art.png",
    director: "Steven Spielberg", actors: "Leonardo DiCaprio, Tom Hanks", theme: "Engaño & Persecución", platform: "Netflix",
    description: "Un audaz joven estafador es perseguido incansablemente por un agente dedicado del FBI.", synopsis: "Un audaz joven estafador es perseguido incansablemente por un agente dedicado del FBI." 
  },
  { 
    title: "Parque Jurásico", titulo: "Parque Jurásico", type: "movie", genre: "Sci-Fi / Aventura", year: 1993, duration: "2h 07m", mood: "Entretenido", match: "98%", poster: "assets/energetic_synth_art.png",
    director: "Steven Spielberg", actors: "Sam Neill, Laura Dern, Jeff Goldblum", theme: "Dinosaurios & Ciencia", platform: "Prime Video",
    description: "Un parque temático con dinosaurios clonados se convierte en una trampa tras una falla de seguridad.", synopsis: "Un parque temático con dinosaurios clonados se convierte en una trampa tras una falla de seguridad." 
  },
  { 
    title: "Spider-Man: Un nuevo universo", titulo: "Spider-Man: Un nuevo universo", type: "movie", genre: "Animación / Acción", year: 2018, duration: "1h 57m", mood: "Entretenido", match: "99%", poster: "assets/energetic_synth_art.png",
    director: "Bob Persichetti, Peter Ramsey", actors: "Shameik Moore, Jake Johnson", theme: "Héroes & Estilo", platform: "Disney+",
    description: "Miles Morales se convierte en el nuevo Spider-Man y une fuerzas con héroes de otras dimensiones.", synopsis: "Miles Morales se convierte en el nuevo Spider-Man y une fuerzas con héroes de otras dimensiones." 
  },
  { 
    title: "La gran estafa (Ocean's Eleven)", titulo: "La gran estafa", type: "movie", genre: "Atraco / Comedia", year: 2001, duration: "1h 56m", mood: "Entretenido", match: "97%", poster: "assets/energetic_synth_art.png",
    director: "Steven Soderbergh", actors: "George Clooney, Brad Pitt, Matt Damon", theme: "Atraco Perfecto", platform: "HBO Max",
    description: "Danny Ocean reúne a once especialistas para robar simultáneamente tres grandes casinos de Las Vegas.", synopsis: "Danny Ocean reúne a once especialistas para robar simultáneamente tres grandes casinos de Las Vegas." 
  },
  { 
    title: "El Enigma del Tiempo", titulo: "El Enigma del Tiempo", type: "movie", genre: "Misterio / Sci-Fi", year: 2023, duration: "2h 10m", mood: "Entretenido", match: "98%", poster: "assets/energetic_synth_art.png",
    director: "Victor Vance", actors: "Arthur Pendelton, Maya Lin", theme: "Acertijos & Tiempo", platform: "ANISAM Original",
    description: "Un detective descubre una anomalía temporal en medio de una red de conspiraciones.", synopsis: "Un detective descubre una anomalía temporal en medio de una red de conspiraciones." 
  }
];
