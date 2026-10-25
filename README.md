# avance-de-agente

Mod de Claude Code: un panel al lado del chat con el avance de cada agente de una
investigación que corre con varios agentes en paralelo. Muestra una barra por agente,
con su porcentaje y una nota de qué está haciendo.

## Cómo funciona

Cada agente escribe su avance en un archivo propio, dentro de la carpeta de su
investigación:

```
<carpeta>/<investigacion>/progreso/<rol>.json
```

```json
{ "hecho": 4, "total": 11, "estado": "corriendo", "nota": "subpregunta 5" }
```

El panel lee la investigación con el progreso más reciente cada 3 segundos. Se abre
solo cuando una investigación escribe avance nuevo, y también con `/avance`. Un agente
con `"estado": "listo"` se muestra completo.

La carpeta de investigaciones es una opción del mod (`carpeta`), relativa al directorio
de la sesión o absoluta. Por defecto, `lineamientos/investigaciones`.

## Instalación

En una sesión de terminal:

```
/plugin install avance-de-agente --marketplace gonzalogiovannelli/avance-de-agente
```

Desde una shell:

```
claude plugin install avance-de-agente --marketplace gonzalogiovannelli/avance-de-agente
```

En la app de escritorio, donde `/plugin` no corre: + junto al cuadro del prompt, Plugins,
Add marketplace con `gonzalogiovannelli/avance-de-agente`, y después Add plugin.
