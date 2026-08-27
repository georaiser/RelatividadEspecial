# Laboratorio de Relatividad Especial

## Idea general

**Pregunta central:**

> ¿Cómo cambia la descripción de un mismo fenómeno cuando cambia el sistema de referencia?

El proyecto será una aplicación interactiva desarrollada con **HTML, CSS, JavaScript y Python**, orientada a la visualización y exploración de conceptos fundamentales de la relatividad especial.

El desarrollo se realizará **panel a panel**, de manera que cada módulo pueda desarrollarse, probarse y ajustarse de forma independiente. Esta estrategia permite controlar tanto el tiempo de desarrollo como el tiempo disponible para la presentación académica.

---

## Estructura general del laboratorio

```text
RELATIVIDAD ESPECIAL
│
├── A. Postulados de Einstein
│        Problema: ¿por qué Galileo no funciona?
│
├── B. Transformaciones de Lorentz
│        Herramienta matemática: γ, coordenadas, intervalo, simultaneidad
│
├── C. Diagrama de Minkowski  ◄── núcleo visual del laboratorio
│        ├── eventos y líneas de mundo
│        ├── intervalo espacio-temporal e invarianza
│        ├── simultaneidad relativa
│        └── cono de luz y causalidad
│
├── D. Dilatación temporal
│        Consecuencia geométrica: leer Δt en el diagrama de Minkowski
│
├── E. Contracción de longitud
│        Consecuencia geométrica: leer Δx en el diagrama de Minkowski
│
├── F. Energía y momento relativista
│        Extensión a la dinámica
│
└── G. Aplicaciones modernas
         ├── GPS
         ├── aceleradores
         └── muones atmosféricos / física de partículas
```

**Lógica del orden:**
El Diagrama de Minkowski es el **núcleo visual** del laboratorio. Las transformaciones de Lorentz (Panel B) proporcionan la herramienta matemática; el diagrama de Minkowski (Panel C) la representa geométricamente en su totalidad — incluyendo eventos, intervalo, simultaneidad y cono de luz. Desde él, la dilatación temporal (D) y la contracción de longitud (E) se presentan como lecturas directas sobre el diagrama, no como fenómenos aislados.

---

# Eje conceptual

El laboratorio no debe plantearse como una colección independiente de efectos relativistas.

La idea unificadora será el **cambio de sistema de referencia**.

El recorrido conceptual principal será:

**A: Postulados → B: Lorentz → C: Minkowski (eventos, intervalo, simultaneidad, cono de luz) → D: Dilatación temporal → E: Contracción espacial → F: Energía → G: Aplicaciones**

El **Diagrama de Minkowski** ocupa el centro del recorrido: es donde la herramienta matemática de Lorentz se convierte en geometría del espacio-tiempo. Los efectos relativistas (dilatación, contracción) se leen directamente sobre ese diagrama, no se introducen como fenómenos separados.

## Idea principal del proyecto: Simulador de Transformaciones de Lorentz

El **Simulador de Transformaciones de Lorentz** será el núcleo principal del proyecto y la experiencia interactiva central del laboratorio.

La idea es que el usuario controle la velocidad relativa `v` entre dos sistemas de referencia y observe **simultáneamente** cómo cambia la descripción de un mismo fenómeno al pasar de `S` a `S'`.

El simulador integrará:

- sistema de referencia `S`;
- sistema de referencia `S'`;
- transformación de coordenadas de Lorentz;
- contracción de longitudes;
- dilatación temporal;
- relatividad de la simultaneidad;
- intervalo espacio-temporal;
- cono de luz;
- diagrama espacio-tiempo de Minkowski.

De esta manera, los demás contenidos del laboratorio no se tratarán como fenómenos independientes, sino como **consecuencias, interpretaciones o aplicaciones de las transformaciones de Lorentz**.

El recorrido conceptual principal será:

```text
    Panel A                  Panel B
  POSTULADOS    ──────►  TRANSFORMACIONES DE LORENTZ
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
               Coordenadas    Simultaneidad    Intervalo Δs²
                    │               │               │
                    └───────────────┼───────────────┘
                                    │
                                    ▼
                          Panel C: DIAGRAMA DE MINKOWSKI
                          ◄── núcleo visual del laboratorio
                                    │
               ┌────────────────────┼────────────────────┐
               ▼                    ▼                    ▼
         Líneas de mundo      Cono de luz           Simultaneidad
                                    │                 relativa
                            ┌───────┴────────┐
                            ▼                ▼
                    Panel D:             Panel E:
               Dilatación temporal   Contracción de longitud
                    │
                    └────────────────────────────────────────┐
                                                             ▼
                                                    Panel F: Energía y momento
                                                             │
                                                             ▼
                                                    Panel G: Aplicaciones
                                              (GPS, aceleradores, muones)
```

Esta organización permite que la aplicación tenga una **idea física unificadora**, en lugar de convertirse en una colección de demostraciones independientes.

La pregunta central seguirá siendo:

> **¿Cómo cambia la descripción de un mismo fenómeno cuando cambia el sistema de referencia?**

El usuario podrá cambiar `v` y observar cómo las coordenadas, la simultaneidad, las longitudes y los tiempos dependen del sistema de referencia, mientras determinadas relaciones físicas permanecen invariantes.

La aplicación deberá enfatizar que:

- las coordenadas de espacio y tiempo dependen del sistema de referencia;
- un mismo evento puede tener diferentes coordenadas para distintos observadores;
- la simultaneidad no es absoluta;
- el intervalo espacio-temporal permanece invariante;
- la velocidad de la luz establece la estructura causal del espacio-tiempo.

---

# Objetivo del desarrollo

Construir un laboratorio interactivo en el que el usuario pueda modificar parámetros físicos y observar inmediatamente sus consecuencias.

La experiencia central debería permitir:

1. Definir uno o más eventos en un sistema de referencia.
2. Cambiar la velocidad relativa de otro observador.
3. Transformar las coordenadas mediante las transformaciones de Lorentz.
4. Observar cómo cambian posición y tiempo.
5. Analizar la simultaneidad de eventos.
6. Calcular y comparar el intervalo espacio-temporal.
7. Visualizar el cono de luz y las relaciones causales.
8. Relacionar estos resultados con dilatación temporal y contracción de longitud.

La interacción debe mostrar que **las coordenadas cambian, pero determinadas relaciones físicas permanecen invariantes**.

---

# Arquitectura conceptual de la aplicación

La aplicación puede organizarse alrededor de un motor relativista común:

```text
                 MOTOR FÍSICO
                     │
          ┌──────────┼──────────┐
          │          │          │
          ▼          ▼          ▼
      Lorentz     Intervalo    γ
          │          │          │
          └──────┬───┴──────────┘
                 │
                 ▼
          VISUALIZACIÓN JS
                 │
       ┌─────────┼─────────┐
       ▼         ▼         ▼
   Eventos    Minkowski   Gráficas
```

## Distribución de tecnologías

### HTML + CSS

Responsables de:

- estructura de los paneles;
- textos explicativos;
- controles;
- organización visual;
- navegación.

### JavaScript

Responsable principalmente de:

- interacción;
- sliders;
- animaciones;
- transformación de coordenadas;
- visualización de eventos;
- diagramas de Minkowski;
- gráficos dinámicos;
- actualización de resultados en tiempo real.

### Python

Se utilizará como apoyo científico y numérico para:

- cálculos de referencia;
- validación de resultados;
- generación de datos;
- análisis numérico;
- posibles gráficos y comparaciones;
- comprobación independiente de las implementaciones JavaScript.

La utilización de Python no implica necesariamente que cada interacción deba depender de un backend. Cuando sea suficiente, los cálculos podrán realizarse directamente en JavaScript para mantener la aplicación interactiva y autónoma.

---

# Desarrollo panel por panel

## Panel A — Postulados de Einstein

### Objetivo

Introducir los dos postulados fundamentales de la relatividad especial y establecer el problema físico que conduce a las transformaciones de Lorentz.

### Contenido

- sistemas de referencia inerciales;
- principio de relatividad;
- invariancia de la velocidad de la luz;
- necesidad de modificar las transformaciones clásicas de Galileo.

### Interactividad

Puede incluir una animación conceptual de dos observadores y una señal luminosa.

### Complejidad estimada

**Baja.**

No requiere un motor numérico complejo.

### Función dentro de la narrativa

Establece la pregunta:

> Si todos los observadores inerciales miden la misma velocidad de la luz, ¿cómo deben relacionarse sus medidas de espacio y tiempo?

---

# Panel B — Transformaciones de Lorentz

### Objetivo

Introducir las transformaciones que relacionan las coordenadas de un evento entre dos sistemas de referencia inerciales.

### Submódulos

- coordenadas;
- simultaneidad;
- espacio-tiempo.

### Interactividad

El usuario podrá modificar la velocidad relativa:

**v/c = 0 → valores cercanos a 1**

y observar cómo cambian las coordenadas de un evento.

### Experiencia central

Un evento definido en el sistema `S` tendrá coordenadas `(x,t)`.

Al cambiar el sistema de referencia a `S'`, se mostrarán las coordenadas transformadas:

`(x,t) → (x',t')`

La aplicación debe enfatizar que se trata del **mismo evento físico**, descrito desde diferentes sistemas de referencia.

### Complejidad estimada

**Media.**

Este será uno de los módulos fundamentales del motor matemático.

---

# Panel C — Dilatación temporal

### Objetivo

Mostrar que el tiempo propio de un sistema y el tiempo medido por otro observador pueden diferir.

### Interactividad

El usuario podrá modificar la velocidad relativa y observar:

- factor de Lorentz;
- tiempo propio;
- tiempo medido por el observador;
- evolución de relojes representados gráficamente.

### Visualización

Puede utilizarse una representación sencilla de dos relojes:

```text
Sistema S

        reloj
          ↓
         🕐


Sistema S'

        🚀
         ↓
        🕐
```

La animación debe mostrar la diferencia temporal sin convertir el módulo en una explicación puramente matemática.

### Complejidad estimada

**Baja-media.**

La parte matemática es relativamente sencilla; la dificultad principal está en hacer que la animación comunique correctamente el concepto.

---

# Panel D — Contracción de longitud

### Objetivo

Mostrar cómo cambia la longitud medida de un objeto cuando existe movimiento relativo entre el objeto y el observador.

### Interactividad

El usuario podrá modificar `v/c` y observar el cambio de la longitud medida.

### Visualización conceptual

```text
Sistema S

🚀════════════════════🚀
          L₀


Sistema S'

🚀════════════🚀
       L
```

### Aspecto conceptual importante

Debe aclararse que la contracción de longitud es una diferencia entre mediciones realizadas en distintos sistemas de referencia.

No debe presentarse simplemente como una "compresión física" que experimenta la nave desde su propio sistema.

### Complejidad estimada

**Media.**

La dificultad principal será representar correctamente las mediciones y mantener clara la distinción entre longitud propia y longitud observada.

---

# Panel E — Diagrama de Minkowski

Este será probablemente el **núcleo visual del laboratorio**.

## Submódulos

### E.1 Eventos

Representar eventos en un diagrama espacio-tiempo:

```text
             ct
              ↑
              │
              │       B ●
              │
              │
              │
              A ●
──────────────┼──────────────→ x
```

El usuario podrá seleccionar o arrastrar eventos.

---

### E.2 Líneas de mundo

Representar la trayectoria de objetos en el espacio-tiempo.

Por ejemplo:

```text
             ct
              ↑
              │       /
              │      /
              │     /
              │    /
              │   /
──────────────┼──────────────→ x
```

La pendiente de la línea de mundo estará relacionada con la velocidad del objeto.

---

### E.3 Cono de luz

Representar las regiones causalmente conectadas con un evento:

```text
             ct
              ↑
             /│            / │            /  │            /   │   ─────────●────┼──────→ x
          \   │   /
           \  │  /
            \ │ /
             \│/
```

La aplicación podrá clasificar la separación entre eventos como:

- tipo temporal;
- tipo luz;
- tipo espacial.

### Complejidad estimada

**Media-alta.**

Es probablemente el módulo que requerirá más trabajo de visualización.

Sin embargo, una vez implementado el sistema de coordenadas y eventos, podrá reutilizarse para otros módulos.

---

# Panel F — Energía y momento relativista

### Objetivo

Extender el laboratorio desde la cinemática relativista hacia la dinámica.

### Contenido

- momento relativista;
- energía relativista;
- energía en reposo;
- relación energía-momento;
- comportamiento cuando `v` se aproxima a `c`.

### Interactividad

El usuario modifica la velocidad y observa la evolución de:

- `γ`;
- momento;
- energía total;
- energía cinética.

Puede incluirse una gráfica que muestre la divergencia de las magnitudes relativistas respecto de las aproximaciones clásicas.

### Complejidad estimada

**Media.**

Este módulo amplía significativamente el alcance físico del laboratorio.

---

# Panel G — Aplicaciones modernas

## Objetivo

Mostrar que la relatividad especial no es solamente una teoría histórica, sino una herramienta necesaria para describir sistemas físicos modernos.

### G.1 GPS

Presentar de manera introductoria el papel de la relatividad en la sincronización temporal de sistemas satelitales.

Debe aclararse que el funcionamiento preciso del GPS requiere considerar **relatividad especial y relatividad general**.

### G.2 Aceleradores

Mostrar cómo la velocidad de partículas puede aproximarse a `c`, mientras las relaciones relativistas entre energía, momento y velocidad se vuelven fundamentales.

### G.3 Física de partículas

Mostrar aplicaciones de la relatividad en:

- partículas relativistas;
- colisiones;
- energía y momento;
- interpretación de observaciones experimentales.

### Posible aplicación adicional: muones atmosféricos

La producción y detección de muones atmosféricos puede utilizarse como ejemplo experimental de los efectos relativistas.

Puede compararse:

- descripción desde el sistema terrestre;
- descripción desde el sistema del muón.

### Complejidad estimada

**Media.**

La dificultad dependerá de cuánto se quiera simular y no solamente explicar.

---

# Escenario unificador

Para evitar que el laboratorio se convierta en una colección de simulaciones independientes, se recomienda utilizar un escenario físico común.

## Dos eventos

Por ejemplo:

```text
                 B ●
                   │
                   │
                   │
                 A ●
──────────────────────────── x
```

El usuario puede modificar la velocidad relativa del observador:

```text
v/c = 0.00
       ↓
v/c = 0.50
       ↓
v/c = 0.80
       ↓
v/c = 0.95
```

La aplicación actualiza simultáneamente:

### Coordenadas

`(x,t) → (x',t')`

### Simultaneidad

`Δt → Δt'`

### Separación espacial

`Δx → Δx'`

### Intervalo

`Δs² → Δs'²`

### Clasificación causal

- temporal;
- espacial;
- tipo luz.

### Diagrama de Minkowski

La descripción gráfica cambia con el sistema de referencia.

Esto permite demostrar experimentalmente la pregunta central:

> **¿Cómo cambia la descripción de un mismo fenómeno cuando cambia el sistema de referencia?**

---

# Invarianza como concepto central

Uno de los resultados conceptuales más importantes del laboratorio será mostrar la diferencia entre:

**Magnitudes dependientes del sistema de referencia**

- posición;
- tiempo;
- simultaneidad;
- longitud medida;
- energía y momento individualmente.

y **magnitudes o relaciones invariantes**.

El intervalo espacio-temporal será especialmente importante porque permite mostrar que:

`Δs² = Δs'²`

aunque:

`Δx ≠ Δx'`

y

`Δt ≠ Δt'`.

Esto proporciona una transición natural desde las transformaciones de Lorentz hacia la geometría del espacio-tiempo.

---

# Arquitectura y calidad del código

El proyecto deberá desarrollarse desde el comienzo con una estructura de código **limpia, modular y mantenible**.

La organización debe permitir desarrollar cada panel de manera independiente sin convertir el proyecto en un único archivo HTML/JavaScript difícil de mantener.

## Principios de diseño

### KISS — Keep It Simple, Stupid

Se priorizará una implementación simple y comprensible.

- Evitar complejidad innecesaria.
- No incorporar librerías cuando una solución sencilla con JavaScript nativo sea suficiente.
- Mantener las funciones pequeñas y fáciles de probar.
- Evitar abstracciones prematuras.
- Incorporar nuevas funcionalidades solamente cuando aporten valor al simulador.

### Single Responsibility Principle — Responsabilidad única

Cada módulo, función o componente deberá tener una responsabilidad claramente definida.

Por ejemplo:

- un módulo para las transformaciones de Lorentz;
- un módulo para magnitudes relativistas;
- un módulo para eventos;
- un módulo para el intervalo;
- un módulo para el diagrama de Minkowski;
- un módulo para la interfaz de usuario;
- un módulo para la representación gráfica.

La lógica física no debería mezclarse innecesariamente con la manipulación del DOM o con la representación gráfica.

## Organización recomendada

Una estructura inicial podría ser:

```text
laboratorio-relatividad/
│
├── index.html
│
├── css/
│   ├── main.css
│   ├── layout.css
│   └── components.css
│
├── js/
│   ├── main.js
│   │
│   ├── physics/
│   │   ├── lorentz.js
│   │   ├── relativistic.js
│   │   ├── events.js
│   │   └── spacetime.js
│   │
│   ├── visualization/
│   │   ├── minkowski.js
│   │   ├── lightCone.js
│   │   └── worldlines.js
│   │
│   └── ui/
│       ├── controls.js
│       ├── panels.js
│       └── display.js
│
├── python/
│   ├── validation/
│   ├── analysis/
│   └── data/
│
├── assets/
│   ├── images/
│   └── icons/
│
└── docs/
    └── README.md
```

Esta estructura es una referencia inicial y podrá simplificarse o modificarse durante el desarrollo. No se debe crear una cantidad de archivos o carpetas que no aporte una separación real de responsabilidades.

## Separación entre física, visualización e interfaz

Una regla fundamental será mantener separadas tres capas:

```text
┌────────────────────────────────────┐
│              INTERFAZ              │
│   controles, sliders, navegación  │
└─────────────────┬──────────────────┘
                  │
                  ▼
┌────────────────────────────────────┐
│          VISUALIZACIÓN             │
│ Canvas/SVG, Minkowski, animaciones │
└─────────────────┬──────────────────┘
                  │
                  ▼
┌────────────────────────────────────┐
│          MOTOR FÍSICO              │
│ Lorentz, γ, eventos, intervalo     │
└────────────────────────────────────┘
```

La capa física debe poder calcular resultados sin depender directamente de elementos HTML.

Esto permitirá validar el motor matemático de manera independiente y reutilizarlo en diferentes paneles.

## Python como referencia y validación

Python tendrá principalmente una función científica y de validación.

Las implementaciones de JavaScript y Python deberán poder contrastarse para verificar:

- transformaciones de Lorentz;
- factor de Lorentz;
- intervalo espacio-temporal;
- clasificación de eventos;
- energía y momento relativista.

No se debe introducir una arquitectura cliente-servidor compleja solamente para utilizar Python. Si el simulador puede funcionar de manera autónoma en el navegador, esa será inicialmente la opción preferida.

# Estrategia de desarrollo

El proyecto se desarrollará **panel por panel**.

Cada panel deberá pasar por las siguientes etapas:

1. Definición física.
2. Definición de la interacción.
3. Implementación matemática.
4. Implementación JavaScript.
5. Visualización HTML/CSS.
6. Validación numérica con Python.
7. Pruebas de consistencia física.
8. Integración con el resto del laboratorio.
9. Revisión del tiempo de presentación.

Esta estrategia permite detener o ampliar el proyecto sin comprometer los módulos ya terminados.

---

# Control de alcance

## Versión mínima viable

Para una presentación breve, el núcleo mínimo recomendado sería:

1. **A — Postulados** (¿por qué necesitamos nueva física?)
2. **B — Transformaciones de Lorentz** (la herramienta matemática)
3. **C — Diagrama de Minkowski** (eventos, intervalo, cono de luz, simultaneidad)

Estos tres módulos permiten responder de manera completa y visual la pregunta central.

## Versión intermedia

Agregar:

4. **D — Dilatación temporal** (consecuencia leída en el diagrama C)
5. **E — Contracción de longitud** (consecuencia leída en el diagrama C)

## Versión completa

Agregar:

6. **F — Energía y momento**
7. **G — Aplicaciones modernas**

De esta forma, el proyecto puede crecer progresivamente sin que sea necesario desarrollar todo antes de disponer de una versión funcional.

---

# Presentación académica de 5 minutos

La presentación no debe intentar explicar todos los módulos.

La estrategia recomendada es mostrar **una única experiencia interactiva**:

```text
Postulados
     ↓
Sistema de referencia
     ↓
Evento A y evento B
     ↓
Cambiar velocidad relativa
     ↓
Transformación de Lorentz
     ↓
Cambian x y t
     ↓
Cambia la simultaneidad
     ↓
Se calcula el intervalo
     ↓
El intervalo permanece invariante
     ↓
Cono de luz
     ↓
Dilatación temporal
     ↓
Contracción espacial
```

La aplicación puede contener más material del que se muestra durante la presentación.

Esto permite que el laboratorio funcione simultáneamente como:

- herramienta de aprendizaje;
- demostración interactiva;
- proyecto de programación científica;
- material de apoyo para una presentación académica.

---

# Prioridad de desarrollo

El desarrollo sigue dos carriles paralelos: el **motor físico** y la **visualización del diagrama de Minkowski**, que debe avanzar en paralelo desde el principio y no postergarse.

Orden recomendado:

**1. Motor matemático de Lorentz** *(js/physics/lorentz.js)*
— γ, transformaciones de coordenadas, intervalo, suma de velocidades.

↓

**2. Gestión de eventos y simultaneidad** *(js/physics/events.js)*
— Definir eventos (x, t), transformarlos, calcular Δs².

↓

**3. Panel B: Transformación interactiva de coordenadas**
— Slider v/c, mostrar (x,t) → (x',t') en tiempo real.

↓

**4. Panel C: Diagrama de Minkowski — base** *(js/visualization/minkowski.js)*
— Ejes ct/x, trazar eventos y moverlos con v/c.

↓

**5. Panel C: Intervalo e invarianza**
— Mostrar Δs² y su invarianza sobre el diagrama.

↓

**6. Panel C: Cono de luz, líneas de mundo y simultaneidad relativa**
— Completar el núcleo visual del laboratorio.

↓

**7. Panel D: Dilatación temporal**
— Derivada del diagrama de Minkowski.

↓

**8. Panel E: Contracción de longitud**
— Derivada del diagrama de Minkowski.

↓

**9. Panel F: Energía y momento** *(js/physics/relativistic.js)*

↓

**10. Panel G: Aplicaciones modernas**

Los pasos 1–3 constituyen la infraestructura técnica. Los pasos 4–6 construyen el núcleo visual del laboratorio (Panel C). Los pasos 7–10 son extensiones progresivas.

---

# Principio de diseño

El laboratorio debe priorizar:

- claridad física;
- interacción;
- visualización;
- coherencia conceptual;
- validación numérica;
- simplicidad de uso.

No se busca construir una página con una gran cantidad de fórmulas, sino una **simulación interactiva que permita observar las consecuencias de cambiar de sistema de referencia**.

Las fórmulas pueden mostrarse de manera selectiva y utilizarse como referencia de los cálculos, mientras que la visualización y la interacción constituyen el elemento principal de la experiencia.

---

# Resultado esperado

El producto final será un:

## **Laboratorio de Relatividad Especial**

basado en HTML/JavaScript/Python, organizado en paneles independientes pero conectados por una idea física común:

> **El mismo fenómeno puede tener diferentes descripciones dependiendo del sistema de referencia, mientras ciertas relaciones físicas permanecen invariantes.**

La estructura modular permitirá desarrollar y evaluar cada panel de forma independiente, controlar el tiempo de desarrollo y seleccionar posteriormente qué partes mostrar en una presentación de aproximadamente cinco minutos.
