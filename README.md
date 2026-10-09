# Lamin Gold — tienda online

Joyería en oro laminado premium. Catálogo público + carrito de invitado + checkout que termina
en un mensaje de WhatsApp (no hay pasarela de pago). Reescritura completa del sitio original en
Flask/Appwrite, ahora sobre **Next.js (App Router) + Supabase**, desplegado en **Vercel**.

- **Producción:** https://lamin-gold-remasterizado.vercel.app
- **Repo:** https://github.com/Juand13go/LaminGoldRemasterizado
- **Dashboard Vercel:** https://vercel.com/juand13gos-projects/lamin-gold-remasterizado
- **Dashboard Supabase:** https://supabase.com/dashboard/project/slgbniepemgefwdjpmii

## Stack

- Next.js 16 (App Router, TypeScript, Turbopack)
- Supabase: Postgres + Auth + Storage, con Row Level Security en todas las tablas
- `@supabase/ssr` para datos server-side (Server Components + Server Actions), sin API REST propia
- Zod para validar todo lo que entra por formularios/Server Actions
- Vitest (unit) + Playwright (e2e)

## Primeros pasos (desarrollo local)

```bash
npm install
cp .env.local.example .env.local   # llenar con las credenciales de Supabase (pedir al admin del proyecto)
npm run dev                         # http://localhost:3000
```

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción (lo mismo que corre Vercel) |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Tests unitarios (Vitest) |
| `npm run test:e2e` | Tests e2e (Playwright) — necesita `TEST_USER_EMAIL`/`TEST_USER_PASSWORD` y al menos un producto activo |
| `npm run migrate:appwrite` | Script de migración única Appwrite → Supabase (ya ejecutado, no debería volver a correr) |

CI (GitHub Actions) corre lint + typecheck + tests en cada PR. Vercel hace su propio build de
verificación en cada preview.

## Panel de administración

URL: `/login` → iniciar sesión con una cuenta con rol `admin` → redirige automáticamente a `/admin`.

El acceso está protegido en dos capas: el middleware (`proxy.ts`) bloquea `/admin/*` a cualquiera
que no tenga `role = admin` en la tabla `profiles`, y además Postgres mismo (RLS) rechaza
escrituras de productos/pedidos que no vengan de un admin, aunque alguien se saltara el middleware.

Las credenciales del admin **no están en este README** porque el repositorio es público — se
comparten por fuera (gestor de contraseñas / mensaje directo).

Desde el panel se puede:

- **Categorías** (`/admin/categorias`): crear y eliminar. No hay "editar" todavía (por diseño, ver Gaps abajo).
- **Productos** (`/admin/products`): crear con imagen obligatoria (jpg/png/webp, máx. 5MB,
  validado por el contenido real del archivo, no por la extensión) y eliminar. **Eliminar un
  producto es permanente** — pide confirmación antes de borrar, pero no hay papelera ni deshacer.
  Los pedidos ya hechos no se rompen (el nombre/precio queda guardado en el pedido al momento de
  la compra, no se vuelve a consultar el producto).
- **Pedidos** (`/admin/orders`): ver el detalle de cada pedido y cambiar su estado
  (`nuevo → contactado → en_proceso → enviado → entregado → cancelado`).

## Mantenimiento y precauciones

- **Supabase (plan free) se pausa solo tras 7 días sin actividad.** Esto ya nos pasó una vez en
  producción (el sitio devolvía 500). Para evitarlo hay un **cron de Vercel** (`vercel.json`) que
  llama a `/api/cron/keep-alive` todos los días y hace una consulta trivial a la base de datos.
  Aun así, conviene **revisar 1 vez al mes** en el dashboard de Supabase que el proyecto siga
  "Active" — si el cron falla silenciosamente o el proyecto de Vercel se desactiva, el reloj de
  pausado vuelve a correr. Si queda pausado más de ~90 días, Supabase puede llegar a eliminarlo.
- **El dominio corto de Vercel no siempre se re-alias solo tras un push.** Ya pasó una vez: el
  deploy quedó "Ready" pero el dominio público seguía sirviendo la versión anterior hasta que se
  corrió `vercel alias set <deployment> lamin-gold-remasterizado.vercel.app` a mano. Después de
  cada deploy importante, confirmar que el sitio en vivo realmente cambió (no solo que el deploy
  diga "Ready").
- **Límites del plan free que pueden obligar a subir de plan:**
  - Supabase free: 500MB de base de datos, 1GB de Storage, 50k usuarios activos/mes, pausa a los
    7 días de inactividad (mitigado arriba).
  - Vercel Hobby: **sus términos de servicio prohíben uso comercial.** Si esta tienda genera
    ventas reales, corresponde pasar a Vercel Pro (usd $20/mes por miembro) para estar en regla.
- Eliminar un producto borra la fila en la base de datos pero **no borra la imagen** del bucket de
  Storage — se acumulan archivos huérfanos con el tiempo (gap conocido, no urgente).

## Variables de entorno

Definidas en Vercel (Project → Settings → Environment Variables) y localmente en `.env.local`
(ver `.env.local.example`). Nunca se commitean valores reales.

| Variable | Para qué |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cliente Supabase (público) |
| `SUPABASE_SERVICE_ROLE_KEY` | Cliente admin server-side, bypassa RLS |
| `CART_COOKIE_SECRET` | Firma HMAC de la cookie del carrito de invitado |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Número de WhatsApp del negocio para el checkout |
| `CRON_SECRET` | Protege `/api/cron/keep-alive` de llamadas externas |

## Gaps conocidos / por hacer

Ver [`TODO.md`](./TODO.md) para el detalle completo priorizado (P0/P1/P2). Resumen de lo más
relevante para quien use el panel día a día:

- No hay "editar" de categorías, solo crear/eliminar.
- No hay paginación en pedidos (límite 50) ni en el catálogo público.
- No hay página de error personalizada; una caída de Supabase hoy se ve como el 500 genérico de
  Next.js (es justamente lo que pasó y motivó el cron de arriba).
