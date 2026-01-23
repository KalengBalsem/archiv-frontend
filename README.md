# ARCH-IV

<div align="center">
  <img src="public/images/asterisk_light.png" alt="ARCH-IV Logo" width="80" />
  <h3>Design Intelligence Network</h3>
  <p>
    <strong>The infrastructure to turn ephemeral student projects into a living, searchable, and scalable database.</strong>
  </p>
  <p>
    <a href="#features">Features</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#architecture">Architecture</a> •
    <a href="#database-schema">Database</a> •
    <a href="#development">Development</a> •
    <a href="#deployment">Deployment</a>
  </p>
</div>

---

## Overview

**ARCH-IV** (Architectural Archive) is a centralized repository for architectural student works. It stores and showcases 3D models (GLTF/GLB), 2D technical drawings, project images, and comprehensive metadata—making student portfolios discoverable, interactive, and permanently preserved.

### Key Capabilities

- **3D Model Viewing** — Interactive WebGL-based model viewer with wireframe, section planes, orthographic views, and fullscreen mode
- **PDF-to-Image Conversion** — Automatically converts architectural PDFs to optimized WebP images
- **Advanced Search & Filtering** — Filter by typology, location, tags, software used, and more
- **User Profiles** — Personal portfolio pages with social links and bio
- **View Analytics** — Tracks unique project views with IP-based 24-hour deduplication
- **Row-Level Security** — Fine-grained access control via Supabase RLS policies

---

## Features

### Public Features
| Feature | Description |
|---------|-------------|
| **Project Gallery** | Browse published architectural projects with thumbnail previews |
| **Project Detail Page** | View full project info including 3D model viewer, image gallery, metadata |
| **3D Model Viewer** | Interactive viewer powered by Three.js with orbit controls, wireframe mode, section planes, auto-rotate, grid toggle, and orthographic view |
| **Search & Filter** | Search by title, filter by building typology, location, tags, and software |
| **Sorting Options** | Sort projects by newest, oldest, most viewed, or alphabetically |

### User Features
| Feature | Description |
|---------|-------------|
| **Authentication** | Email/password and Google OAuth sign-in via Supabase Auth |
| **Email Verification** | OTP-based email verification for new accounts |
| **Profile Management** | Edit username, full name, bio, avatar, and social links |
| **My Projects** | View and manage personal project submissions |

### Admin Features
| Feature | Description |
|---------|-------------|
| **Project Upload** | Upload 3D models (GLTF/GLB), thumbnails, and additional images |
| **PDF Processing** | Automatic PDF-to-WebP conversion for architectural drawings |
| **Metadata Management** | Assign typologies, locations, licenses, tags, and software |
| **Manual Author Mode** | Assign projects to registered users or enter manual author names |
| **Contributors** | Add team members/contributors to projects |

---

## Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| [Next.js 15](https://nextjs.org/) | React framework with App Router |
| [React 19](https://react.dev/) | UI library |
| [TypeScript](https://www.typescriptlang.org/) | Type-safe JavaScript |
| [Tailwind CSS](https://tailwindcss.com/) | Utility-first CSS framework |
| [shadcn/ui](https://ui.shadcn.com/) | Radix-based UI component library |
| [Three.js](https://threejs.org/) | 3D graphics library |
| [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber) | React renderer for Three.js |
| [@react-three/drei](https://github.com/pmndrs/drei) | Three.js helpers and abstractions |
| [Lucide React](https://lucide.dev/) | Icon library |
| [Tabler Icons](https://tabler-icons.io/) | Additional icons |
| [pdfjs-dist](https://mozilla.github.io/pdf.js/) | PDF rendering and conversion |

### Backend & Infrastructure
| Technology | Purpose |
|------------|---------|
| [Supabase](https://supabase.com/) | PostgreSQL database, Auth, Row-Level Security |
| [Cloudflare R2](https://developers.cloudflare.com/r2/) | Object storage for assets (via S3-compatible API) |
| [AWS SDK (S3 Client)](https://aws.amazon.com/sdk-for-javascript/) | Presigned URL generation for R2 uploads |

### Development Tools
| Tool | Purpose |
|------|---------|
| [pnpm](https://pnpm.io/) | Fast, disk-efficient package manager |
| [ESLint](https://eslint.org/) | Code linting |
| [PostCSS](https://postcss.org/) | CSS processing |

---

## Getting Started

### Prerequisites

- **Node.js** 18.x or higher
- **pnpm** (recommended) or npm
- **Supabase Account** — [Create free account](https://supabase.com/)
- **Cloudflare R2 Bucket** — For asset storage (optional for local development)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/KalengBalsem/archiv-frontend.git
   cd archiv-frontend
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

   # Cloudflare R2 Configuration (for file uploads)
   R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
   R2_BUCKET=your-bucket-name
   R2_ACCESS_KEY_ID=your-access-key
   R2_SECRET_ACCESS_KEY=your-secret-key
   ```

4. **Set up the database**
   
   Run the SQL schema in your Supabase SQL Editor:
   ```bash
   # Option 1: Copy and run supabase_db_schema.sql manually
   
   # Option 2: Use Supabase CLI
   supabase db push
   ```

5. **Run the development server**
   ```bash
   pnpm dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
archiv-frontend/
├── public/                 # Static assets (images, icons)
├── src/
│   ├── app/                # Next.js App Router pages
│   │   ├── (admin)/        # Admin-only routes (upload)
│   │   ├── (auth)/         # Authentication routes (login, register)
│   │   ├── (main)/         # Main app routes (projects, profile, about)
│   │   ├── api/            # API route handlers
│   │   │   ├── upload/     # Presigned URL generation for R2
│   │   │   ├── views/      # Project view tracking
│   │   │   └── waitlist/   # Waitlist signup
│   │   ├── layout.tsx      # Root layout with providers
│   │   └── page.tsx        # Landing page
│   ├── components/
│   │   ├── project_page/   # Project-specific components
│   │   │   ├── model-viewer.tsx    # 3D model viewer
│   │   │   ├── project-card.tsx    # Project card component
│   │   │   └── attachment-modal.tsx
│   │   ├── ui/             # shadcn/ui components
│   │   ├── layout/         # Layout components
│   │   └── ...             # Other shared components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility libraries
│   ├── providers/          # React context providers
│   ├── styles/             # Global CSS
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   │   ├── supabaseClient.ts       # Browser Supabase client
│   │   ├── supabaseServerClient.ts # Server Supabase client
│   │   └── pdf-converter.ts        # PDF to image conversion
│   └── middleware.ts       # Next.js middleware (auth)
├── supabase/
│   ├── config.toml         # Supabase local config
│   ├── migrations/         # Database migrations
│   └── seed.sql            # Seed data
├── supabase_db_schema.sql  # Complete database schema
└── package.json
```

---

## Architecture

### Application Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                        │
├─────────────────────────────────────────────────────────────────┤
│  Next.js App (React 19)                                         │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐          │
│  │  Landing Page │ │ Project List  │ │ Project Detail│          │
│  └───────────────┘ └───────────────┘ └───────────────┘          │
│           │                │                 │                  │
│           ▼                ▼                 ▼                  │
│  ┌─────────────────────────────────────────────────┐            │
│  │              AuthProvider (Context)             │            │
│  │         Session & User State Management         │            │
│  └─────────────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NEXT.JS API ROUTES                         │
├─────────────────────────────────────────────────────────────────┤
│  /api/upload   → Generates presigned URLs for R2 uploads        │
│  /api/views    → Tracks project views (IP deduplication)        │
│  /api/waitlist → Handles waitlist signups                       │
└─────────────────────────────────────────────────────────────────┘
                              │
               ┌──────────────┼──────────────┐
               ▼              ▼              ▼
┌──────────────────┐ ┌──────────────┐ ┌──────────────────┐
│   SUPABASE       │ │ CLOUDFLARE   │ │   MIDDLEWARE     │
│   (PostgreSQL)   │ │     R2       │ │   (Auth Guard)   │
├──────────────────┤ ├──────────────┤ ├──────────────────┤
│ • Authentication │ │ • 3D Models  │ │ • Route protect  │
│ • Database (RLS) │ │ • Images     │ │ • Session check  │
│ • Realtime       │ │ • Documents  │ │ • Redirects      │
└──────────────────┘ └──────────────┘ └──────────────────┘
```

### Authentication Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Register  │────>│  Supabase   │────>│  OTP Email  │
│    Page     │     │   Sign Up   │     │  Verified   │
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
┌─────────────┐     ┌─────────────┐           ▼
│    Login    │────>│  Supabase   │     ┌─────────────┐
│    Page     │     │   Sign In   │────>│   Session   │
└─────────────┘     └─────────────┘     │   Created   │
                          │             └─────────────┘
                          ▼                    │
                    ┌─────────────┐            ▼
                    │   Google    │     ┌─────────────┐
                    │    OAuth    │────>│  /projects  │
                    └─────────────┘     └─────────────┘
```

### File Upload Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Admin     │     │  /api/      │     │ Cloudflare  │
│   Upload    │────>│  upload     │────>│     R2      │
│   Page      │     │  (Presign)  │     │  (Storage)  │
└─────────────┘     └─────────────┘     └─────────────┘
      │                   │                    │
      │   1. Request      │                    │
      │   presigned URL   │                    │
      │──────────────────>│                    │
      │                   │                    │
      │   2. Return       │                    │
      │   uploadUrl +     │                    │
      │   publicUrl       │                    │
      │<──────────────────│                    │
      │                   │                    │
      │   3. PUT file     │                    │
      │   directly to R2  │                    │
      │───────────────────────────────────────>│
      │                   │                    │
      │   4. Save publicUrl to Supabase        │
      │──────────────────>│                    │
```

---

## Database Schema

### Entity Relationship Diagram
(coming soon)

### Row-Level Security (RLS) Policies

#### Master Data (Public Read)
| Table | Policy | Rule |
|-------|--------|------|
| `users` | Public Read | Anyone can view user profiles |
| `licenses` | Public Read | Reference data is publicly readable |
| `building_typologies` | Public Read | Reference data is publicly readable |
| `locations` | Public Read | Reference data is publicly readable |
| `tags` | Public Read | Reference data is publicly readable |
| `software` | Public Read | Reference data is publicly readable |

#### Projects
| Policy | Rule |
|--------|------|
| Public View | `status IN ('published', 'completed')` — Anyone can view published/completed projects |
| Owners & Admins Manage | `auth.uid() = user_id OR is_admin = true` — Owners and admins have full CRUD access |

#### Project Assets & Relations
| Table | Public View | Manage |
|-------|-------------|--------|
| `project_images` | Images from published/completed projects | Owner OR Admin |
| `project_tags` | Tags from published/completed projects | Owner OR Admin |
| `project_software` | Software from published/completed projects | Owner OR Admin |
| `project_contributors` | Contributors from published/completed projects | Owner OR Admin |

#### View Tracking
| Table | Policy | Rule |
|-------|--------|------|
| `project_views` | Insert | Anyone can insert views (for tracking) |
| `project_views` | Select | Blocked — No direct read access (privacy protection) |

---

## API Reference

### POST `/api/upload`

Generates a presigned URL for uploading files to Cloudflare R2.

**Request Body:**
```json
{
  "filename": "model.glb",
  "filetype": "model/gltf-binary",
  "folder": "models",
  "filesize": 52428800
}
```

**Response:**
```json
{
  "uploadUrl": "https://r2.cloudflarestorage.com/...",
  "publicUrl": "https://assets.archiv.tech/models/user_id/uuid-model.glb"
}
```

### POST `/api/views`

Tracks a project view with IP-based deduplication (24-hour window).

**Request Body:**
```json
{
  "slug": "modern-house-12345678"
}
```

**Response:**
```json
{
  "success": true,
  "is_new_view": true,
  "view_count": 42
}
```

### POST `/api/waitlist`

Adds an email to the waitlist.

**Request Body:**
```json
{
  "email": "student@university.edu"
}
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous/public key |
| `R2_ENDPOINT` | ✅ | Cloudflare R2 endpoint URL |
| `R2_BUCKET` | ✅ | R2 bucket name |
| `R2_ACCESS_KEY_ID` | ✅ | R2 access key ID |
| `R2_SECRET_ACCESS_KEY` | ✅ | R2 secret access key |

---

## Development

### Available Scripts

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linting
pnpm lint
```

### Database Migrations

Migrations are stored in `supabase/migrations/`. To apply:

```bash
# Using Supabase CLI
supabase db push

# Or run SQL files manually in Supabase SQL Editor
```

---

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy

### Docker

```dockerfile
# Example Dockerfile (create as needed)
FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
```

---

## Security Considerations

1. **Row-Level Security** — All database tables use Supabase RLS policies
2. **Auth Middleware** — Protected routes require authentication
3. **Rate Limiting** — View tracking API has IP-based rate limiting (30 req/min)
4. **File Validation** — Upload API validates file types and sizes
5. **IP Hashing** — View tracking stores MD5-hashed IPs for privacy
6. **Security Headers** — X-Frame-Options, X-Content-Type-Options, CSP configured

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is proprietary software. All rights reserved.

---

## Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) — Beautiful UI components
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) — React renderer for Three.js
- [Supabase](https://supabase.com/) — Open source Firebase alternative
- [Cloudflare R2](https://developers.cloudflare.com/r2/) — S3-compatible object storage

---
  <br/>
<div align="center">
  <p>
    <strong>ARCH-IV</strong> — Preserving Architectural Knowledge <br/>
    <sub>Built with <3</sub>
  </p>
</div>