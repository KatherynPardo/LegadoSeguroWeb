# Herramientas del proyecto

Scripts que generan el manual en Word, los diagramas del modelo de datos y las capturas de la aplicación, y que dejan la demo lista. Todos usan rutas relativas al repositorio.

## Instalación (una sola vez)

```bash
cd docs/herramientas
npm install
```

Instala `jszip` (arma el .docx) y `puppeteer-core` (maneja Google Chrome para las capturas y los diagramas). Necesitas Google Chrome instalado; si no está en `C:/Program Files/Google/Chrome/Application/chrome.exe`, define la variable `CHROME_PATH`.

## Qué hace cada archivo

| Archivo | Para qué sirve | Cómo se usa |
|---|---|---|
| `generar-word.js` | Convierte `MANUAL_CONSTRUCCION.md` en el Word con el formato del curso | `node generar-word.js MANUAL_CONSTRUCCION_v8.docx` |
| `PLANTILLA CARATULA.docx` | Carátula de la universidad que usa el generador | No se toca |
| `generar-er.js` | Crea los diagramas ER (`docs/capturas/2-1_er_*.png`) desde el diccionario de datos | `node generar-er.js` (necesita internet) |
| `capturas-app.js` | Toma capturas reales de la aplicación con Chrome | `node capturas-app.js tablet` (ver el encabezado del archivo) |
| `render-paginas.ps1` | Guarda como PNG páginas del Word, para revisarlas (necesita Word) | `.\render-paginas.ps1 -Docx ... -Salida ... -Buscar "125\|Procedimiento 7.14.3"` |
| `reset-demo.ts` | Deja a Hugo (heredero de prueba) como al inicio de la demo | `cd backend` y `npx tsx ../docs/herramientas/reset-demo.ts hugo` |

## Regenerar el manual (flujo completo)

1. Edita `MANUAL_CONSTRUCCION.md` (es la fuente única; **no edites el Word**).
2. Si cambió la base de datos: `cd backend && npm run diccionario`, y copia el diccionario nuevo a la sección 2.2 del manual.
3. Si cambió el modelo: `node generar-er.js`.
4. `node generar-word.js MANUAL_CONSTRUCCION_vN.docx` con un nombre nuevo (nunca pises un Word abierto).
5. Abre el Word y pulsa F9 sobre el índice para que se actualicen los números de página.

## Sintaxis del manual (`MANUAL_CONSTRUCCION.md`)

- `## 3. Título` es el nivel 1 y `### 3.1 Título` el nivel 2. `#### Título` es un nivel 3 que no entra en el índice.
- Un procedimiento va entre `:::paso 7.1.2 Título` y `:::`. Dentro, las claves son `Objetivo:`, `Acción:`, `Comando:`, `Explicación:`, `Evidencia:`, `Resultado esperado:`, `Error frecuente:`, `Solución:` y `Verificación:`.
- En `Evidencia:`: `![Título de la figura](docs/capturas/archivo.png)` inserta una imagen. Si el archivo no existe, el Word muestra un recuadro amarillo "CAPTURA PENDIENTE".
- Un resultado de terminal o de base de datos se escribe así (el texto debe ser **real**, no inventado):

  ````
  resultado: Título de la figura
  ```resultado
  > git log --oneline
  bd9351b NUEVAS ACTUALIZACIONES
  ```
  ````

  La primera línea con `> ` es el comando. Según el comando se dibuja como Git Bash (`git`, `grep`, `ls`, `head`), como el SQL Editor de Supabase (`SELECT ...`) o como la terminal de VS Code (lo demás).
- `==texto==` resalta en amarillo lo que falta completar. `Tabla: Título` pone el encabezado de una tabla común. `ref: ...` es una referencia APA con sangría francesa.
- Las figuras y las tablas se numeran solas; el índice se arma solo.
