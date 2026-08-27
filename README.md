# Laboratorio de Relatividad Especial

Laboratorio interactivo de Relatividad Especial desarrollado con **HTML, CSS, JavaScript** y validado con **Python**.

## Pregunta central

> ¿Cómo cambia la descripción de un mismo fenómeno cuando cambia el sistema de referencia?

## Recorrido conceptual

```
A: Postulados → B: Lorentz → C: Minkowski (núcleo visual) → D: Dilatación → E: Contracción → F: Energía → G: Aplicaciones
```

El **Diagrama de Minkowski** (Panel C) es el núcleo visual del laboratorio.
Todos los efectos relativistas se leen desde él, no se introducen como fenómenos aislados.

## Estructura del proyecto

```
RelatividadEspecial/
│
├── index.html                    ← Índice con los 7 paneles
│
├── panels/
│   ├── panel-a.html              ← A: Postulados de Einstein          ✅
│   ├── panel-b.html              ← B: Transformaciones de Lorentz
│   ├── panel-c.html              ← C: Diagrama de Minkowski ◄ núcleo
│   ├── panel-d.html              ← D: Dilatación temporal
│   ├── panel-e.html              ← E: Contracción de longitud
│   ├── panel-f.html              ← F: Energía y momento
│   └── panel-g.html              ← G: Aplicaciones modernas
│
├── css/
│   ├── main.css                  ← Variables, reset, tipografía
│   ├── layout.css                ← Header, footer, grids
│   └── components.css            ← Tarjetas, botones, canvas
│
├── js/
│   ├── main.js                   ← Estado global, inicialización
│   ├── physics/
│   │   ├── lorentz.js            ← Motor: γ, transformaciones, intervalo  ✅
│   │   ├── spacetime.js          ← Intervalo espacio-temporal
│   │   ├── relativistic.js       ← Energía y momento
│   │   └── events.js             ← Gestión de eventos
│   ├── visualization/
│   │   ├── minkowski.js          ← Diagrama de Minkowski
│   │   ├── lightCone.js          ← Cono de luz
│   │   └── worldlines.js         ← Líneas de mundo
│   └── panels/
│       ├── panel-a.js            ← Animación del Panel A               ✅
│       └── ...
│
└── python/
    └── validation/
        └── lorentz_validation.py ← Validación independiente             ✅
```

## Estado del desarrollo

| Panel | Tema | Rol | Estado |
|-------|------|-----|--------|
| A | Postulados de Einstein | Fundamento conceptual | ✅ Disponible |
| B | Transformaciones de Lorentz | Herramienta matemática | 🔜 Próximamente |
| C | **Diagrama de Minkowski** | **Núcleo visual** | 🔜 Próximamente |
| D | Dilatación temporal | Consecuencia de C | 🔜 Próximamente |
| E | Contracción de longitud | Consecuencia de C | 🔜 Próximamente |
| F | Energía y momento | Extensión dinámica | 🔜 Próximamente |
| G | Aplicaciones modernas | Contexto real | 🔜 Próximamente |

## Cómo abrir el laboratorio

Abrir **`index.html`** directamente en el navegador. No requiere servidor web.

## Validación Python

Python está disponible en **WSL** con el entorno `py311` de micromamba:

```bash
# Desde WSL:
micromamba run -n py311 python python/validation/lorentz_validation.py
```

## Principios de diseño

- **KISS**: sin librerías externas, JS nativo
- **SRP**: física separada de visualización e interfaz
- **Minkowski como núcleo visual**: no se posterga, se construye desde el Panel C
- Desarrollo **panel por panel** para controlar el alcance
