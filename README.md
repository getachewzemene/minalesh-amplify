# Minalesh - Ethiopia's Intelligent Marketplace

A full-stack e-commerce application built with Next.js.

## Getting Started

### Prerequisites

- Node.js 18+ and npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

### Installation

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project directory
cd minalesh-amplify

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your PostgreSQL database URL and JWT secret
# IMPORTANT: Use a strong, random JWT_SECRET in production

# Run database migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Start the development server
npm run dev
```

### Security Notes

⚠️ **Important Security Considerations:**

1. **JWT Secret**: Always set a strong, random `JWT_SECRET` in production. The application will fail to start if this is not set.
2. **Token Storage**: Currently using localStorage for JWT tokens. For production, consider implementing httpOnly cookies for better XSS protection.
3. **Admin Routes**: The vendor approval endpoint (`/api/profile/[vendorId]/approve`) requires admin role verification before use in production.
4. **Password Policy**: Enforces minimum 8 characters with at least one letter and one number.
5. **Database Connection**: Ensure your PostgreSQL connection string uses SSL in production.

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Technologies Used

This project is built with:

- Next.js 14 (App Router)
- TypeScript
- React 18
- Tailwind CSS
- shadcn-ui
- PostgreSQL (Database)
- Prisma ORM
- TanStack Query
- JWT Authentication

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the production application
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint

## Deployment

This Next.js application can be deployed to platforms like:
- Vercel
- Netlify
- AWS Amplify
- Any Node.js hosting platform
