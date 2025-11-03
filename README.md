# 📅 QuickAgenda

QuickAgenda is a Spring Boot + React (Vite + MUI) app to create simple event agendas, share them via link/QR, send email invites, and collect RSVPs.

## 🧰 Tech Stack

- Backend: Spring Boot 3, Spring Data JPA, PostgreSQL (Supabase), HikariCP, ical4j
- Frontend: React + Vite, Material UI
- Email: Resend (HTTP API via RestTemplate)

## ✨ Features

- 🗓️ Create an event with date and one or more sessions
- 🔗 Share link and 📱 QR code for attendees
- 📥 Download .ics or ➕ Add to Google Calendar
- ✉️ Invite guests by email (stores `invites_sent` on the event)
- ✅ RSVP collection: Yes / No / Maybe
  - 🚫 Works even if recipient didn’t get the email (enter email on the Share page)
  - 👀 Host sees attendee list with counts, auto-refresh every 10s

## 🖼️ Screenshots

<div align="center">

<img alt="Create Event" src="./Screenshot%20from%202025-11-03%2012-46-59.png" width="46%" />
<img alt="Share Page" src="./Screenshot%20from%202025-11-03%2012-47-14.png" width="46%" />

<p/>

<img alt="Attendees / RSVP" src="./Screenshot%20from%202025-11-03%2012-47-53.png" width="94%" />

</div>

## 📁 Project structure

```
quickagenda/
├─ quickagenda-backend/         # Spring Boot app
│  ├─ src/main/java/com/example/quickagenda
│  │  ├─ controller/            # REST controllers
│  │  ├─ dto/                   # Request/response DTOs
│  │  ├─ entity/                # JPA entities (Event, Session, Attendee)
│  │  └─ repository/            # Spring Data repositories
│  └─ src/main/resources/application.yml
└─ quickagenda-frontend/        # React + Vite app
   └─ src/                      # App.jsx, Share.jsx, components
```

## ⚙️ Backend setup

1) Java 17+, Maven
2) PostgreSQL (Supabase pooled endpoint recommended)
3) Configure `application.yml` (already committed for local demo). For production, configure via env vars and avoid committing secrets.

Important pooler note (Supabase/pgBouncer): we configure the PG driver in `application.yml` to avoid server-side prepared statements:

```yaml
spring:
  datasource:
    hikari:
      data-source-properties:
        preferQueryMode: simple
        prepareThreshold: 0
```

### 🔑 Environment variables

- `RESEND_API_KEY`: Resend API key. For dev, you can set it in env or rely on the default coded value (not recommended for prod).
- `RESEND_FROM`: Sender address. For dev, defaults to `onboarding@resend.dev`. For production, verify a domain in Resend and use an address on it (e.g., `noreply@yourdomain.com`).

### ▶️ Run backend

```bash
cd quickagenda-backend
./mvnw spring-boot:run
```

Server starts on http://localhost:8080

## 🗃️ Database schema

We rely on Hibernate `ddl-auto: update` for local development. If you manage schema manually, apply these SQL changes:

- Add invites tracking to events (if not present):

```sql
ALTER TABLE event
ADD COLUMN IF NOT EXISTS invites_sent JSONB NOT NULL DEFAULT '[]'::jsonb;
```

- Create attendees table for RSVP:

```sql
CREATE TABLE IF NOT EXISTS attendees (
  id BIGSERIAL PRIMARY KEY,
  event_id BIGINT NOT NULL REFERENCES event(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  rsvp TEXT CHECK (rsvp IN ('YES', 'NO', 'MAYBE')),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (event_id, email)
);
```

Note: Hibernate naming maps `Event` to `event` and `shareCode` to `share_code`.

## 🌐 REST API (key endpoints)

- POST `/api/events` → create event + sessions (already implemented)
- GET `/api/events/{code}` → event details with sessions
- GET `/api/events/{code}.ics` → download calendar
- PATCH `/api/events/{code}/sessions/{id}` → update session times (HH:mm for same day)
- POST `/api/events/{code}/invites` → send invites via Resend and store `invites_sent`
- GET `/api/events/{code}/attendees` → list attendees + counts { yes, no, maybe }
- PATCH `/api/events/{code}/rsvp` → upsert attendee RSVP `{ email, rsvp: YES|NO|MAYBE }`

## ✉️ Email with Resend

- For dev: `RESEND_FROM` defaults to `onboarding@resend.dev`. Emails may only appear in Resend’s Test Inbox until you verify a domain.
- For prod: verify a domain in Resend and set `RESEND_FROM` to an address at that domain, and set `RESEND_API_KEY` in the environment.

## 🖥️ Frontend setup

Requirements: Node 18+

```bash
cd quickagenda-frontend
npm install
npm run dev
```

Vite dev server (default): http://localhost:5173

### 🚀 Frontend usage

- Create an event: name + date + at least one session.
- After creation:
  - Copy the share link (top-right), or use QR.
  - Send invites by entering emails and clicking “Send Invites”.
  - Monitor RSVPs in the “Attendees” panel (auto-refresh every 10s).
  - A “Create New Event” button lets you reset and start over.
- Share page (`/s/{code}`): shows agenda and actions.
  - If the URL includes `?email=alice@example.com`, RSVP buttons auto-fill for that email.
  - If not, guest can enter their email and RSVP directly.

## 🔒 CORS

Configured in `CorsConfig` to allow the frontend origins and methods (including PATCH). Update origins for your deployment as needed.

## 🛡️ Security & production tips

- Do not commit secrets. Prefer environment variables for DB and email keys.
- Verify your sender domain in Resend for real email delivery.
- Keep pgBouncer-related settings (simple query mode) if you use Supabase pooled endpoints.
- Consider adding rate limits and basic input validation for production.

## 🧪 Troubleshooting

- “prepared statement already exists”: ensure `preferQueryMode: simple` (and optionally `prepareThreshold: 0`) is set, or use a non-pooled/session connection.
- Didn’t receive email: check Resend Test Inbox if using `onboarding@resend.dev`; for live delivery, verify domain and update `RESEND_FROM`.
- RSVP not visible yet: attendee list auto-refreshes every 10s; wait or refresh the page.

## 📄 License

MIT (or your preferred license).
