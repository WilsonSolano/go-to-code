# Go To Code 📍

¡Marca puntos importantes en el código y navega rápidamente entre ellos! 

**Go To Code** es la herramienta definitiva para desarrolladores que necesitan moverse ágilmente entre diferentes partes de un mismo archivo o múltiples archivos. Olvídate de hacer scroll interminable buscando dónde estabas trabajando; simplemente coloca un "Pin" y salta directamente cuando lo necesites.

---

## ✨ Características Principales

- **📍 Pines visuales con descripciones:** Agrega pines a líneas específicas. Cada pin mostrará un ícono en el margen y un texto flotante interactivo (CodeLens) encima del código con la nota que le hayas puesto. ¡Haz clic en la nota para ir directo a la línea!
- **⚡ Atajos rápidos en el editor:** No pierdas tiempo buscando. En la esquina superior derecha del editor encontrarás:
  - `⬆️` Un botón para saltar de inmediato al último pin que dejaste arriba.
  - `≡` Un menú hamburguesa para ver todos los pines únicamente del archivo actual.
- **📂 Panel Lateral Dedicado:** Una vista global en la barra de actividades (`actvitybar`) donde puedes ver, editar y administrar todos tus pines organizados por archivo.
- **🗑️ Gestión rápida:** Elimina pines con un solo clic, sin molestas ventanas de confirmación, para mantener tu flujo de trabajo ininterrumpido.

---

## ⌨️ Comandos y Atajos de Teclado

La extensión incluye los siguientes comandos y atajos por defecto para que no tengas que usar el mouse:

| Comando | Atajo (Windows/Linux) | Atajo (macOS) | Descripción |
|---------|-----------------------|---------------|-------------|
| **Agregar pin** | `Ctrl + Alt + P` | `Cmd + Alt + P` | Agrega un nuevo pin en la línea actual. Te pedirá una descripción opcional. |
| **Eliminar pin** | `Ctrl + Alt + D` | `Cmd + Alt + D` | Elimina el pin de la línea actual sin pedir confirmación. |
| **Ir al siguiente pin** | `Ctrl + Alt + N` | `Cmd + Alt + N` | Salta al próximo pin hacia abajo. |
| **Ir al pin anterior** | `Ctrl + Alt + B` | `Cmd + Alt + B` | Salta al pin anterior hacia arriba. |

También puedes acceder a estos comandos desde la Paleta de Comandos (`Ctrl+Shift+P` o `Cmd+Shift+P`) escribiendo `Go To Code:`.

- `Go To Code: Mostrar lista de pins`
- `Go To Code: Mostrar pines de este archivo`
- `Go To Code: Eliminar todos los pins`
- `Go To Code: Editar descripción del pin`
- `Go To Code: Ir al pin más cercano arriba`

---

## 🎨 Personalización

El color de la marca del pin en la barra de desplazamiento (Overview Ruler) se adapta automáticamente a tu tema claro u oscuro, pero si lo deseas, puedes personalizarlo en tu `settings.json`:

```json
"workbench.colorCustomizations": {
  "go-to-code.decorationColor": "#FF0000"
}
```

---

## 🚀 Instalación

1. Abre Visual Studio Code.
2. Ve a la pestaña de Extensiones (`Ctrl+Shift+X` o `Cmd+Shift+X`).
3. Busca **"Go To Code"**.
4. Haz clic en Instalar.

---

**¡Disfruta navegando por tu código a la velocidad de la luz! 🚀**
