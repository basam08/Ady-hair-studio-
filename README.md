# Ady Hair Cut — solución digital

Sitio web + sistema de reservas 24/7 + panel de administración para una
peluquería. Basado en el brief de **Ceronix** (`prompt_proyecto_peluqueria.md`).

Stack: **Next.js 15** (App Router) · **TypeScript** · **Tailwind CSS 4** ·
**Prisma** (SQLite en desarrollo) · **JWT + bcrypt** para el panel.

Todo vive en un único proyecto Next.js: las *Route Handlers* (`src/app/api`)
hacen de backend, por lo que el despliegue en Vercel es directo.

---

## Puesta en marcha

```bash
npm install
cp .env.example .env        # revisa/ajusta los valores
npm run db:push             # crea el esquema en SQLite
npm run db:seed             # admin + servicios + reservas de ejemplo
npm run dev                 # http://localhost:3000
```

**Acceso al panel** (`/admin`) con las credenciales del `.env`:
por defecto `ady@adyhaircut.com` / `AdyDemo2026!` — cámbialas antes de producción.

---

## Estructura

```
src/
├── config/salon.ts        ← ÚNICO archivo a editar para adaptar el negocio
│                            (nombre, contacto, horarios, servicios, galería)
├── app/
│   ├── (site)/             páginas públicas: home, servicios, galería,
│   │                       contacto, reservar, reserva/[token], privacidad
│   ├── admin/              login + panel (grupo (panel): dashboard, reservas,
│   │                       disponibilidad, clientes)
│   └── api/                availability · bookings · auth · admin/* · cron
├── components/site|booking|admin
├── lib/
│   ├── availability.ts     motor de huecos (horario + capacidad + bloqueos)
│   ├── bookings.ts         alta / cancelación / cambio de cita + efectos
│   ├── auth.ts / auth-edge.ts   sesión JWT (cookie httpOnly)
│   ├── time.ts             zona horaria sin dependencias (con horario verano)
│   ├── validation.ts       esquemas Zod de todas las entradas
│   ├── rate-limit.ts       límite de peticiones en memoria
│   ├── stats.ts            métricas del dashboard
│   └── integrations/       email (Resend) · whatsapp (Twilio) · google-calendar
├── middleware.ts           cabeceras de seguridad + protección de /admin
prisma/schema.prisma        modelos: Admin, Service, Stylist, Client, Booking, Blackout
```

## Adaptar a un negocio real

1. Edita **`src/config/salon.ts`**: nombre, dirección, WhatsApp, horario
   semanal (con pausas), festivos, peluqueros (`stylists`), y la lista de
   servicios con precio y duración. Un servicio con `bookableOnline: false`
   no se puede reservar desde la web (el cliente debe escribir por
   WhatsApp). Sustituye las URLs de `gallery` por fotos propias.
2. `npm run db:seed` vuelve a cargar los servicios en la base de datos.
3. Cambia `ADMIN_EMAIL` / `ADMIN_PASSWORD` y vuelve a sembrar el admin.

## Integraciones (opcionales)

Si las variables del `.env` están vacías, cada integración **registra el
mensaje en consola** en lugar de fallar — el flujo de reservas funciona igual.

| Integración | Variables | Notas |
|---|---|---|
| Email | `RESEND_API_KEY`, `EMAIL_FROM` | API de [Resend](https://resend.com) (sin SDK), 3000 emails/mes gratis. |
| WhatsApp / SMS | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM` | API REST de Twilio, sin SDK. |
| Google Calendar | `GOOGLE_CALENDAR_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | Cuenta de servicio con acceso al calendario. |

**Recordatorios**: `GET /api/cron/reminders` (cabecera
`Authorization: Bearer $CRON_SECRET`) envía el aviso de las citas que empiezan
en las próximas 2 h. `vercel.json` ya programa un cron cada 15 min.

## Producción

1. **Base de datos**: cambia el `provider` de `prisma/schema.prisma` a
   `postgresql` (recomendado en Vercel) y `DATABASE_URL` a la cadena real.
   `npm run db:push`. La lógica de la app no cambia.
2. Genera secretos reales: `openssl rand -base64 48` para `AUTH_SECRET`,
   `openssl rand -hex 32` para `CRON_SECRET`.
3. `NEXT_PUBLIC_SITE_URL` con el dominio final.
4. Despliega en Vercel (framework detectado automáticamente).

## Seguridad aplicada

- Validación Zod en todos los *endpoints*; consultas parametrizadas (Prisma).
- Contraseñas con bcrypt (coste 12); sesión en cookie `httpOnly`, `sameSite`,
  `secure` en producción.
- Límite de peticiones en reservas, login y disponibilidad.
- Cabeceras: CSP, HSTS, X-Frame-Options, X-Content-Type-Options,
  Referrer-Policy, Permissions-Policy. `x-powered-by` desactivado.
- Comprobación de sesión en el `middleware` **y** en cada *route handler* admin.
- Doble verificación del hueco dentro de una transacción → sin dobles reservas.
- Datos personales mínimos (nombre, teléfono, email opcional), con finalidad
  declarada y vía de borrado — ver `/privacidad` (revísala con asesoría legal).

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` / `npm start` | Producción |
| `npm run db:push` | Aplica el esquema a la base de datos |
| `npm run db:seed` | Carga admin + servicios + datos de ejemplo |

## Qué NO incluye este arranque (extras del brief)

ADY AI (chatbot), automatización avanzada de WhatsApp con flujos, y tienda
online son *extras* con precio aparte en la propuesta. La arquitectura queda
preparada para añadirlos (capa de integraciones y modelos aislados).
