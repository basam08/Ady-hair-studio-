# Enseñar la web a un cliente desde la tablet

Tres formas, de la más recomendable a la más rápida.

---

## Opción A — Publicar en Vercel (recomendado para la reunión)

Consigues un enlace **permanente y con HTTPS** (`https://ady-hair-cut.vercel.app`)
que se abre en cualquier tablet o móvil, sin que tu portátil tenga que estar
encendido. Es gratis. Unos 15 minutos la primera vez.

### 1. Base de datos en la nube (Neon — Postgres gratis)

1. Entra en <https://neon.tech> → *Sign up* (con GitHub o Google).
2. *Create project* → nombre `ady-hair-cut` → región *Europe (Frankfurt)*.
3. Copia la **connection string** que te da (empieza por
   `postgresql://...` e incluye `?sslmode=require`).

### 2. Cambiar el proyecto a Postgres

En `prisma/schema.prisma`, cambia una línea:

```prisma
datasource db {
  provider = "postgresql"   // antes: "sqlite"
  url      = env("DATABASE_URL")
}
```

En tu `.env`, pon la cadena de Neon:

```
DATABASE_URL="postgresql://...  (la que copiaste de Neon)"
```

Y crea las tablas + datos de ejemplo en Neon:

```bash
npx prisma generate
npx prisma db push
npm run db:seed
```

> Para volver a trabajar en local con SQLite, deshaz el cambio del `provider`
> y pon `DATABASE_URL="file:./dev.db"`.

### 3. Subir a GitHub

```bash
git init
git add -A
git commit -m "Ady Hair Cut — primera versión"
```

Crea un repo vacío en <https://github.com/new> (privado) y sigue las
instrucciones de "push an existing repository".

### 4. Desplegar en Vercel

1. Entra en <https://vercel.com> → *Sign up* con GitHub.
2. *Add New → Project* → importa el repo `ady-hair-cut`.
3. En **Environment Variables**, añade (copia los valores de tu `.env`):

   | Nombre | Valor |
   |---|---|
   | `DATABASE_URL` | la cadena de Neon |
   | `AUTH_SECRET` | genera uno nuevo: `openssl rand -base64 48` |
   | `ADMIN_EMAIL` | `ady@adyhaircut.com` |
   | `ADMIN_PASSWORD` | una contraseña buena |
   | `NEXT_PUBLIC_SITE_URL` | `https://TU-PROYECTO.vercel.app` |
   | `CRON_SECRET` | genera uno: `openssl rand -hex 32` |

4. *Deploy*. En 1–2 minutos tienes el enlace.
5. Abre ese enlace en la tablet. Listo para la reunión.

> El panel `/admin` funciona con `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
> Si `db:seed` no llegó a ejecutarse contra Neon, el admin se crea igualmente
> la primera vez con esas variables.

---

## Opción B — Túnel temporal (si la reunión es ya)

Enlace público al instante, **sin cuentas**, pero tu portátil tiene que quedarse
encendido en casa con el servidor abierto, y la URL cambia cada vez.

En una terminal, dentro de la carpeta del proyecto:

```bash
npm run dev
```

En **otra** terminal:

```bash
npx --yes cloudflared tunnel --url http://localhost:3000
```

Te imprime una URL tipo `https://algo-aleatorio.trycloudflare.com`.
Ábrela en la tablet. Mientras no cierres ninguna de las dos terminales, funciona.

Alternativa equivalente: `npx --yes localtunnel --port 3000`.

---

## Opción C — Sin conexión: PDF o vídeo

Si en la cafetería el wifi falla:

1. Con el servidor en marcha (`npm run dev`), abre el sitio en Chrome.
2. Móvil/tablet en modo responsive (F12 → icono de móvil) y **imprime a PDF**
   cada página (`Ctrl+P` → *Guardar como PDF*).
3. O graba un vídeo corto de pantalla navegando por la web y la reserva.
4. Pásalo a la tablet (AirDrop, Drive, correo) y lo enseñas sin depender del wifi.

---

## Recomendación

Para una reunión con cliente, **Opción A**: un enlace propio, estable y con el
dominio `.vercel.app` da mucha mejor imagen que un túnel que se puede caer.
Cuando el cliente contrate, se conecta el dominio real (`adyhaircut.com`) en
Vercel en 5 minutos.
