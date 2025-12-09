# Eventia Ticketing Platform

## Overview
Eventia is a modern event ticketing application that allows users to browse events, purchase tickets, and attend events. It includes features for event organizers to create and manage events, and for administrators to oversee the platform.

## Architecture
The application is built with:
- **Frontend**: React with TypeScript, utilizing Vite as the build tool
- **Backend**: Express.js backend API with PostgreSQL database
- **Authentication**: JWT-based authentication with HTTP-only cookies
- **Styling**: Tailwind CSS with shadcn/ui component library

## Key Features
- Event browsing and search
- Seat selection for events
- Ticket purchasing with UPI payments
- QR code ticket generation
- Admin dashboard for event management
- User authentication and authorization

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+

### Environment Setup
Create a `.env` file in the project root with the following variables:
```
# API Configuration
VITE_API_URL=http://localhost:8080/api
VITE_WS_URL=ws://localhost:8080
```

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/eventia-ticketing-platform.git
cd eventia-ticketing-platform
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the development server**
```bash
npm run dev
```

### Running the Backend
The frontend requires the Express backend to be running. To set up the backend:

1. **Navigate to the backend directory**
```bash
cd ../eventia-backend-express
```

2. **Install backend dependencies**
```bash
npm install
```

3. **Configure the database**
Modify the `.env` file to point to your PostgreSQL database.

4. **Run migrations**
```bash
npx prisma migrate dev
```

5. **Start the backend server**
```bash
npm run dev
```

## Project Structure

```
eventia-ticketing-flow1/
├── public/             # Static assets
├── src/
│   ├── components/     # Reusable UI components
│   ├── contexts/       # React context providers
│   ├── hooks/          # Custom React hooks
│   ├── pages/          # Page components
│   ├── services/       # API service modules
│   │   └── api/        # API client modules for Express backend
│   ├── styles/         # Global styles
│   ├── types/          # TypeScript type definitions
│   └── utils/          # Utility functions
├── .env.example        # Example environment variables
└── package.json        # Project dependencies
```

## Authentication
The application uses JWT-based authentication with:
- Access tokens for short-lived authentication (15 minutes)
- Refresh tokens stored in HTTP-only cookies for security (7 days)
- Token refresh mechanism to maintain user sessions

## API Integration
All data fetching is managed through the Express backend API. The frontend makes HTTP requests to the API endpoints defined in the `services/api` directory.

## License
This project is licensed under the MIT License - see the LICENSE file for details.
