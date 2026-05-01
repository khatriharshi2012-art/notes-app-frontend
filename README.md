# Notes App Frontend

A modern note-taking application built with React and Vite.

## Features

- **User Authentication** - Login and registration system
- **Notes Management** - Create, read, update, and delete notes
- **Todo List** - Manage your daily tasks
- **Dashboard** - Overview of your activities
- **Responsive Design** - Works on desktop and mobile devices

## Tech Stack

- **React** - UI library for building the interface
- **Vite** - Build tool and development server
- **React Router** - Client-side routing
- **Axios** - HTTP client for API requests
- **ESLint** - Code linting

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

The app will open at `http://localhost:5173`

### Build

Build for production:

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── assets/          # Static assets (images, icons)
├── components/      # Reusable React components
├── pages/           # Page components
│   ├── Dashboard.jsx
│   ├── Home.jsx
│   ├── Landing.jsx
│   ├── Login.jsx
│   ├── Notes.jsx
│   ├── Register.jsx
│   └── Todo.jsx
├── utils/           # Utility functions (API client)
├── App.css          # Main stylesheet
├── App.jsx          # Main App component
├── index.css       # Global styles
└── main.jsx        # Application entry point
```

## Available Scripts

- `npm run dev` - Start development server with HMR
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## License

MIT


