# DEEEP Platform

A modern, full-stack Next.js application with TypeScript, Tailwind CSS, and Supabase authentication.

## Features

- ⚡ **Next.js 15** with App Router
- 🔒 **Supabase Authentication** (email + password)
- 🎨 **Tailwind CSS** for beautiful, responsive design
- 📱 **TypeScript** for type safety
- 🚀 **Vercel Ready** for easy deployment

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd deeep-platform
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API
3. Copy your Project URL and anon/public key

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
src/
├── app/
│   ├── dashboard/     # Protected dashboard page
│   ├── login/         # Login page
│   ├── signup/        # Signup page
│   └── page.tsx       # Landing page
├── lib/
│   ├── auth.ts        # Authentication utilities
│   └── supabase.ts    # Supabase client configuration
```

## Pages

- **Home** (`/`) - Landing page with links to login/signup
- **Login** (`/login`) - User authentication
- **Signup** (`/signup`) - User registration
- **Dashboard** (`/dashboard`) - Protected user dashboard

## Authentication Flow

1. Users can sign up with email and password
2. Email verification is handled by Supabase
3. Users can log in with their credentials
4. Authenticated users are redirected to the dashboard
5. Users can log out from the dashboard

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add your environment variables in Vercel dashboard
4. Deploy!

### Environment Variables for Production

Make sure to set these in your deployment platform:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel (recommended)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details
# Force Vercel to use latest commit
