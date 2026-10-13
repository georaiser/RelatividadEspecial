# Guion de Video (~7 Minutos) — Evaluación 1: Relatividad Especial

**Curso:** Física Moderna — Módulo 03: Relatividad Especial  
**Duración estimada:** ~7 minutos (a ritmo natural de 130–140 palabras por minuto; máximo permitido: 10 min)  
**Soporte visual:** Laboratorio Interactivo de Relatividad Especial (`index.html` y Paneles A, B, C y D)

---

## Estructura General de Tiempos

| Bloque | Tiempo | Tema Central y Criterio de Evaluación | Panel en Pantalla |
| :--- | :---: | :--- | :--- |
| **1. Introducción y Contexto Histórico** | `0:00 – 1:15` | ¿Qué es la TER? Crisis clásica (Galileo/Newton vs. Maxwell, Michelson-Morley 1887) y los 2 Postulados. | `index.html` → **Panel A** (Inicio) |
| **2. Simultaneidad y Adición de Velocidades** | `1:15 – 2:45` | Experimento mental del vagón en 3D: simultaneidad relativa y composición de velocidades ($u < c$). | **Panel A** (Visor 3D y Arena Comparativa) |
| **3. Álgebra de Lorentz, Minkowski y $\Delta s^2$** | `2:45 – 4:00` | Transformaciones de Lorentz, factor $k$ de Bondi, intervalo invariante $\Delta s^2$ y Cono de Luz (causalidad). | **Panel B** (Tab B.1) → **Panel C** (Tab C.2) |
| **4. Dilatación, Contracción y Evidencia Real** | `4:00 – 5:45` | Reloj de luz ($\Delta t = \gamma \Delta t_0$), contracción ($L = L_0/\gamma$) y las 4 pruebas experimentales (Doppler transversal 1938, Hafele-Keating, muones, CERN y GPS). | **Panel D** (Reloj de luz, Escáner y Evidencia) |
| **5. Impacto en la Física y Conclusión** | `5:45 – 7:00` | Dinámica relativista ($p=\gamma mv$), equivalencia masa-energía ($E_0=mc^2$), fisión/fusión nuclear, espacio-tiempo 4D, Relatividad General y antimateria (Dirac). | **Panel D** (Calculadora $E=\gamma mc^2$ e Impacto) |

---

## Desarrollo Paso a Paso del Guion

---

### ⏱️ BLOQUE 1 (0:00 – 1:15) | Introducción, Crisis Clásica y los Dos Postulados

* **🖥️ Acción en pantalla:**
  1. Inicia en `index.html` mostrando los 4 paneles disponibles del Laboratorio.
  2. Haz clic en el **Panel A — Postulados de Einstein**.
  3. Enfoca el recuadro *"¿Qué es la Teoría Especial de la Relatividad (TER) y por qué surgió en 1905?"* y las dos tarjetas de los Postulados debajo.

* **🗣️ Guion hablado:**
  > «Hola a todos. En este video vamos a explicar qué es la Teoría Especial de la Relatividad, formulada por Albert Einstein en 1905, cuáles son sus dos postulados fundamentales, sus consecuencias físicas más importantes y cuál fue su impacto en toda la física.
  >
  > Para entender por qué nació esta teoría, debemos situarnos a finales del siglo XIX. En esa época la física vivía una crisis profunda entre sus dos grandes pilares:
  > - Por un lado, la **mecánica clásica de Galileo y Newton** asumía que el tiempo era absoluto —igual para cualquier observador en el universo ($t' = t$)— y que las velocidades simplemente se sumaban ($u = u' + v$).
  > - Por otro lado, las **ecuaciones del electromagnetismo de Maxwell** demostraban que la luz en el vacío es una onda electromagnética que viaja siempre a una rapidez fija de casi $300\,000\text{ km/s}$ ($c = 1/\sqrt{\varepsilon_0 \mu_0}$), sin importar quién la emita.
  >
  > Para salvar la física clásica, se pensó que existía un medio invisible llamado **éter**, y que la velocidad de la luz solo era fija respecto a ese éter. Pero en **1887**, el experimento de **Michelson y Morley** buscó medir el movimiento de la Tierra a través del éter y obtuvo un resultado nulo: el éter no existe.
  >
  > En **1905**, Einstein resolvió esta contradicción con la **Teoría Especial de la Relatividad**. Demostró que el espacio y el tiempo no son absolutos ni independientes, sino que forman un solo tejido —el **espacio-tiempo**— a partir de dos postulados simples:
  > 1. **Primer Postulado (Principio de Relatividad):** Las leyes de la física son exactamente las mismas en todos los sistemas de referencia inerciales (los que se mueven a velocidad constante). Ningún experimento permite distinguir el reposo absoluto del movimiento uniforme.
  > 2. **Segundo Postulado (Invariancia de la velocidad de la luz):** La luz en el vacío viaja siempre a la misma rapidez $c$ para todos los observadores, sin importar el movimiento de la fuente o del receptor.»

---

### ⏱️ BLOQUE 2 (1:15 – 2:45) | Simultaneidad Relativa y Composición de Velocidades

* **🖥️ Acción en pantalla:**
  1. Baja al visor 3D **"El Vagón de Einstein"** en el **Panel A**.
  2. Con **"💡 1. Destello de Luz"** seleccionado, elige **"En el Vagón (S')"** y pulsa **"▶ Emitir flash"** (muestra que llegan juntos a $1.00\text{ s}$).
  3. Cambia a **"En el Andén (S)"** y pulsa **"▶ Emitir flash"** (muestra que llega primero al detector trasero A en $0.50\text{ s}$ y luego al delantero B en $2.00\text{ s}$).
  4. Cambia al modo **"🚀 2. Disparar Sonda u'"**, pulsa **"▶ Emitir flash"** y baja un poco a la **Arena Comparativa** mostrando la diferencia entre Galileo (rojo, $1.10c$) y Lorentz (verde, $0.8462c$).

* **🗣️ Guion hablado:**
  > «Aceptar que la velocidad de la luz es siempre la misma tiene consecuencias inmediatas que vemos en esta simulación 3D del vagón de Einstein, moviéndose al 60% de la velocidad de la luz ($\beta = 0.60$).
  >
  > Primero veamos el **destello de luz en el centro del vagón**. Para el pasajero que viaja adentro (sistema $S'$), los dos detectores están a la misma distancia y la luz llega a ambos al mismo tiempo ($1.00\text{ s}$). Para él, los dos impactos son simultáneos.
  >
  > Pero si cambiamos la cámara al observador en el **andén** (sistema $S$), la luz sigue viajando a la misma velocidad $c$ hacia ambos lados; sin embargo, mientras la luz viaja, el detector trasero del vagón avanza al encuentro de la luz y el detector delantero se aleja. Por eso, desde el andén el rayo golpea primero atrás ($0.50\text{ s}$) y después adelante ($2.00\text{ s}$). Esta es la primera gran consecuencia: **la simultaneidad es relativa**; dos eventos que ocurren al mismo tiempo para un observador, ocurren en instantes distintos para otro.
  >
  > La segunda consecuencia aparece cuando **disparamos una sonda** hacia adelante a $0.50c$ desde el vagón que ya viaja a $0.60c$. Según Galileo, las velocidades se sumarían dando $1.10c$, superando a la luz (representado por la esfera roja). Pero en la realidad relativista de Einstein y Lorentz, como el tiempo y el espacio se transforman, la suma se divide por el factor $(1 + u'v/c^2)$, dando $0.8462c$ (la esfera verde). Así, ninguna partícula ni señal puede superar jamás la velocidad límite $c$.»

---

### ⏱️ BLOQUE 3 (2:45 – 4:00) | Transformaciones de Lorentz, Diagrama de Minkowski e Invariante $\Delta s^2$

* **🖥️ Acción en pantalla:**
  1. Haz clic hacia el **Panel B — Transformaciones de Lorentz**.
  2. En la pestaña **B.1 · Coordenadas**, mueve el slider superior de $\beta$ y señala la tabla de la derecha (mostrando cómo cambian $\gamma, k, x', t'$ mientras que $\Delta s^2 = -7$ no cambia).
  3. Haz clic hacia el **Panel C — Diagrama de Minkowski** y selecciona la pestaña **C.2 · Cono de luz y causalidad**.

* **🗣️ Guion hablado:**
  > «¿Cuál es la regla matemática exacta que conecta las medidas de distintos observadores? Son las **Transformaciones de Lorentz**, que vemos aquí en el Panel B.
  >
  > Como demostró Hermann Bondi usando señales de luz y el factor Doppler $k = \sqrt{(1+\beta)/(1-\beta)}$, las coordenadas entre dos sistemas se relacionan mediante el **factor de Lorentz** $\gamma = 1/\sqrt{1-\beta^2}$. En la tabla vemos que, al cambiar la velocidad $\beta$, para un mismo evento físico cambian su posición $x'$ y su tiempo $t'$.
  >
  > Pero fíjense en la última fila de la tabla: el **intervalo espacio-temporal** $\Delta s^2 = c^2\Delta t^2 - \Delta x^2$ se mantiene fijo en $-7$ para cualquier velocidad. Es decir, aunque el espacio y el tiempo cambian por separado, esta distancia espacio-temporal es **invariante** para todos los observadores.
  >
  > En el **Panel C** vemos su significado geométrico en el **Diagrama de Minkowski**. La luz viaja por las diagonales a $45^\circ$ formando el **Cono de Luz**. Los eventos dentro del cono tienen intervalo positivo ($\Delta s^2 > 0$, tipo tiempo) y están conectados causalmente: en ellos el orden entre causa y efecto nunca se invierte. De este modo, la Relatividad Especial protege la causalidad en todo el universo.»

---

### ⏱️ BLOQUE 4 (4:00 – 5:45) | Dilatación del Tiempo, Contracción de Longitud y Evidencia Experimental

* **🖥️ Acción en pantalla:**
  1. Pasa al **Panel D — Dilatación, Contracción, Evidencia e Impacto**.
  2. En el **Reloj de Luz**, pulsa **"▶ Iniciar fotones"** y señala la trayectoria vertical a la izquierda vs. diagonal a la derecha.
  3. Baja al **Escáner de Contracción de Longitud** y mueve el slider de velocidad de la nave.
  4. Baja a la sección **"Evidencia Experimental de la Dilatación del Tiempo"** (mostrando las 4 tarjetas: Doppler transversal 1938, Hafele-Keating 1972, Muones CERN 1977 y GPS).

* **🗣️ Guion hablado:**
  > «Llegamos ahora al Panel D para analizar qué pasa con la duración del tiempo y el tamaño de los objetos.
  >
  > En esta simulación vemos dos **relojes de luz**. En el reloj de la izquierda, en reposo con el observador, el fotón sube y baja verticalmente recorriendo una distancia $2L$. Pero en el reloj de la derecha, que se mueve hacia adelante, el fotón debe recorrer un camino diagonal más largo para seguir a los espejos. Como la luz viaja exactamente a la misma rapidez $c$ en ambos casos, recorrer un camino más largo toma más tiempo. Aplicando el teorema de Pitágoras a ese triángulo se obtiene $\Delta t = \gamma \cdot \Delta t_0$: **el tiempo de un reloj en movimiento transcurre más lento** visto desde afuera.
  >
  > De forma complementaria, en el escáner inferior vemos la **contracción de longitud de Lorentz**: todo objeto en movimiento se acorta en la dirección en que viaja según $L = L_0 / \gamma$, mientras que su altura transversal no cambia.
  >
  > Esto no es solo teoría; aquí tenemos las **cuatro grandes pruebas experimentales** de la dilatación del tiempo:
  > 1. **El Efecto Doppler Transversal:** Predicho por Einstein en 1907 y medido por Ives y Stilwell en 1938. Cuando un átomo emite luz a $90^\circ$ de su movimiento, el efecto Doppler clásico vale cero; sin embargo, midieron que la frecuencia atómica bajaba ($f = f_0/\gamma$) exactamente porque el tiempo interno del átomo en movimiento iba más lento.
  > 2. **Relojes atómicos en aviones y ópticos:** En 1972, Hafele y Keating dieron la vuelta al mundo con relojes de cesio en aviones comerciales y comprobaron el desfase en nanosegundos. Y en 2010, Chou y su equipo midieron la dilatación del tiempo con relojes ópticos de aluminio a tan solo $10\text{ m/s}$, la velocidad de una bicicleta.
  > 3. **Los muones cósmicos y del CERN:** Los muones viven solo $2.2$ microsegundos en reposo; sin relatividad no alcanzarían a cruzar los $10\text{ km}$ de atmósfera, pero a $0.998c$ su vida se dilata casi 16 veces desde la Tierra (o la atmósfera se contrae desde el muón) y llegan al suelo. Además, en 1977 en el anillo del CERN aceleraron muones a $0.9994c$ ($\gamma \approx 29.3$) y su vida media aumentó casi 30 veces, hasta $64.4$ microsegundos.
  > 4. **El sistema GPS:** Los satélites GPS corrigen cada día el desfase relativista de sus relojes en órbita; sin estas correcciones, la ubicación en nuestros teléfonos fallaría por más de $10\text{ km}$ al día.»

---

### ⏱️ BLOQUE 5 (5:45 – 7:00) | Impacto en la Física General y Conclusión

* **🖥️ Acción en pantalla:**
  1. En el mismo **Panel D**, baja a la **Calculadora Interactiva** y haz clic en los botones `🔬 Ives-Stilwell (0.005c)`, `🌧️ Muón Cósmico (0.998c)` y `🧲 Muón CERN (0.9994c)`, mostrando la tarjeta 3 de **Dinámica Relativista y Equivalencia Masa-Energía ($E = \gamma mc^2$)**.
  2. Finalmente, enfoca las 4 tarjetas de **"Impacto de la Relatividad Especial en la Física General"**.

* **🗣️ Guion hablado:**
  > «Finalmente, ¿cuál fue el impacto de la Relatividad Especial en la física en general? Podemos resumirlo en cuatro grandes revoluciones:
  >
  > 1. **Nueva dinámica y equivalencia masa-energía ($E_0 = mc^2$):** Como vemos aquí en la calculadora dinámica, Einstein redefinió el momentum como $p = \gamma mv$ y la energía total como $E = \gamma mc^2$. A medida que nos acercamos a $c$, la energía crece hacia el infinito, impidiendo superar la velocidad de la luz. Además, demostró que un cuerpo en reposo almacena una energía enorme dada por $E_0 = mc^2$: un solo gramo de materia equivale a $25$ millones de kilowatts-hora. Y con la relación general $E^2 = (pc)^2 + (mc^2)^2$ se explicó por qué los fotones de luz, aunque no tienen masa ($m=0$), sí tienen energía y momentum ($E = pc$).
  > 2. **Física nuclear y energía de las estrellas ($\Delta E = \Delta m \cdot c^2$):** La masa por sí sola no se conserva. Una pequeña pérdida de masa se convierte en gran cantidad de energía tanto en la **fisión nuclear** del uranio como en la **fusión nuclear** que hace brillar al Sol y a las estrellas, relación comprobada con un error menor a media millonésima por ciento.
  > 3. **El camino hacia la Relatividad General (1908–1915):** Al unir el espacio y el tiempo en una geometría de 4 dimensiones, Minkowski dio el paso clave para que Einstein formulara en 1915 la Relatividad General, donde la gravedad es la curvatura del espacio-tiempo.
  > 4. **Mecánica cuántica relativista y antimateria (1928):** Cuando Paul Dirac combinó la Relatividad Especial con la mecánica cuántica, explicó el espín del electrón y predijo la existencia de la **antimateria** (el positrón), pilar de la física de partículas moderna y de tecnologías médicas como la tomografía PET.
  >
  > En conclusión, la Relatividad Especial nació para resolver un conflicto entre la mecánica y la luz, y terminó transformando para siempre nuestra comprensión del tiempo, el espacio, la energía y el universo. ¡Muchas gracias!»
