# SGMM Pro Vercel Migration - Setup Guide

## 🚀 Supabase Configuration

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Choose region and database password
4. Wait for project to be ready

### 2. Setup Database Schema
1. Go to SQL Editor in Supabase Dashboard
2. Copy and paste the content from `supabase_schema.sql`
3. Run the SQL to create all tables, indexes, and RLS policies

### 3. Get Environment Variables
From your Supabase project settings:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Configure Authentication
1. Go to Authentication > Settings in Supabase
2. Enable Email provider
3. Set Site URL to your Vercel domain
4. Configure redirect URLs

## 📁 Project Structure

```
vercel-migration/
├── app/
│   ├── api/
│   │   ├── patients/           # Patient CRUD operations
│   │   │   ├── route.ts        # GET /api/patients, POST /api/patients
│   │   │   └── [id]/route.ts   # GET /api/patients/[id], PUT, DELETE
│   │   ├── treatments/         # Treatment CRUD operations
│   │   │   ├── route.ts        # GET /api/treatments, POST /api/treatments
│   │   │   └── [id]/route.ts   # GET /api/treatments/[id], PUT, DELETE
│   │   └── appointments/       # Appointment CRUD operations
│   │       ├── route.ts        # GET /api/appointments, POST /api/appointments
│   │       └── [id]/route.ts   # GET /api/appointments/[id], PUT, DELETE
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                # Landing page with migration status
├── lib/
│   └── supabase.ts             # Supabase client configuration
├── supabase_schema.sql         # Complete database schema
├── .env.example                # Environment variables template
├── .env.local                  # Your actual environment variables
├── next.config.ts              # Next.js configuration
├── package.json                # Dependencies
└── vercel.json                 # Vercel deployment config
```

## 🔧 API Endpoints

### Patients
- `GET /api/patients` - List all patients
- `POST /api/patients` - Create new patient
- `GET /api/patients/[id]` - Get patient details with treatments/appointments
- `PUT /api/patients/[id]` - Update patient
- `DELETE /api/patients/[id]` - Delete patient

### Treatments
- `GET /api/treatments` - List all treatments
- `POST /api/treatments` - Create new treatment
- `GET /api/treatments/[id]` - Get treatment details
- `PUT /api/treatments/[id]` - Update treatment
- `DELETE /api/treatments/[id]` - Delete treatment

### Appointments
- `GET /api/appointments` - List all appointments
- `POST /api/appointments` - Create new appointment
- `GET /api/appointments/[id]` - Get appointment details
- `PUT /api/appointments/[id]` - Update appointment
- `DELETE /api/appointments/[id]` - Delete appointment

## 🛡️ Security Features

### Row Level Security (RLS)
- Multi-tenant architecture
- Users can only access their own data
- Automatic user_id assignment
- Secure policy enforcement

### Authentication
- NextAuth.js integration ready
- Supabase Auth provider
- JWT token handling
- Secure session management

## 🚀 Next Steps

1. **Setup Supabase Project**
   - Create project and run schema
   - Configure environment variables

2. **Implement Authentication**
   - Setup NextAuth.js
   - Create login/register pages
   - Configure session handling

3. **Build UI Components**
   - Patient management interface
   - Treatment tracking
   - Appointment scheduling
   - Dashboard with analytics

4. **Deploy to Vercel**
   - Connect GitHub repository
   - Configure environment variables
   - Deploy and test

## 📊 Migration Status

✅ **Completed:**
- Next.js 15 project structure
- API endpoints (CRUD operations)
- Supabase client configuration
- Database schema with RLS
- Environment configuration
- TypeScript setup

🔄 **In Progress:**
- Supabase project setup
- Authentication implementation
- UI components development

⭕ **Todo:**
- NextAuth.js configuration
- Dashboard interface
- Data migration from SQLite
- Production deployment

## 🔍 Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run type-check
```

## 📝 Environment Variables

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

Then edit `.env.local` with your actual values from Supabase project settings.