# Fiambrería Duca · App Web de Precios

Aplicación web (PWA) para **consultar precios con la cámara del teléfono**.
Es **solo lectura**: escanea códigos de barras y muestra el precio. La carga y
edición de productos se sigue haciendo desde la app de escritorio.

Lee el catálogo desde Supabase (el mismo que usa la PC) y guarda una copia en el
teléfono para seguir funcionando aunque se corte internet.

## Pantallas

- **Principal:** la cámara abierta todo el tiempo. Apuntás al código de barras y
  abajo aparece el nombre y el precio (con un sonido de confirmación).
- **Buscar:** botón arriba a la derecha. Abre la lista completa de productos con
  un buscador por nombre o código.

---

## 🚀 Desplegar en Vercel (paso a paso)

> No hace falta configurar nada extra: la app ya trae la conexión a Supabase.

1. Entrá a **https://vercel.com** e iniciá sesión con tu cuenta de **GitHub**.
2. Clic en **Add New…** → **Project**.
3. En la lista de repositorios, buscá **`app-web-fiambreria`** y clic en **Import**.
4. Vercel detecta solo que es un proyecto **Vite**. Dejá todo como viene:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Clic en **Deploy** y esperá ~1 minuto.
6. Cuando termine, Vercel te da una URL tipo
   **`https://app-web-fiambreria.vercel.app`**. ¡Esa es tu app! 🎉

Cada vez que se suban cambios al repo de GitHub, Vercel vuelve a publicar solo.

### (Opcional) Apuntar a otro Supabase

Si algún día cambiás de proyecto de Supabase, en Vercel entrá a
**Settings → Environment Variables** y agregá:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_KEY`

Después hacé **Redeploy**. Si no las ponés, usa las que ya vienen por defecto.

---

## 📲 Instalar en el teléfono (sin App Store)

Abrí la URL de Vercel en el navegador del teléfono:

**iPhone (Safari):**
1. Tocá el botón **Compartir** (cuadrado con la flecha ↑).
2. **"Agregar a pantalla de inicio"**.
3. Queda como una app más, a pantalla completa.

**Android (Chrome):**
1. Aparece un cartel **"Instalar app"** (o menú ⋮ → **Instalar aplicación**).
2. Listo, queda el ícono en el teléfono.

La primera vez el navegador va a pedir **permiso para usar la cámara**: tocá
**Permitir**.

> ⚠️ La cámara solo funciona sobre **https** (la URL de Vercel ya lo es). No
> funciona abriendo el proyecto con `http://` pelado.

---

## 🧑‍💻 Correr en la computadora (desarrollo)

```bash
npm install
npm run dev
```

Abrí http://localhost:5173 (en localhost la cámara también funciona).

Para generar la versión de producción:

```bash
npm run build
npm run preview
```

## Stack

- React + TypeScript + Vite
- `@zxing/browser` para leer códigos de barras con la cámara (funciona en iPhone)
- `@supabase/supabase-js` para leer el catálogo
- `vite-plugin-pwa` para que sea instalable y funcione offline
