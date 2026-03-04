# Cirpman Homes

A comprehensive real estate and property management platform designed to streamline property listings, client interactions, and administrative workflows.

## 🚀 Overview

Cirpman Homes is a robust web application built for modern real estate management. It provides a seamless experience for potential buyers to browse properties, clients to manage their subscriptions, and administrators to oversee operations.

**Developed by:** [Jeremiah Ojonimi](https://jeremiahojonimi.vercel.app)

---

## ✨ Key Features

- **Property Listings:** Comprehensive view of available properties with detailed information and high-quality imagery.
- **Client & Admin Dashboards:** Dedicated panels for users to manage their profiles, subscriptions, and activities.
- **Booking System:** Integrated "Book a Site Visit" functionality for efficient lead conversion.
- **Multi-role Support:** Tailored experiences for Customers, Consultants, and Administrators.
- **Subscription Management:** Automated management for Consultant and Customer subscription plans.
- **Visitor Logs & Feedback:** Tools for tracking engagement and gathering valuable user insights.
- **Blog & News:** Integrated content management and display for industry updates.

---

## 🛠️ Technology Stack

- **Frontend:** [React](https://reactjs.org/) (v18)
- **Framework:** [Vite](https://vitejs.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/)
- **State Management:** [TanStack Query](https://tanstack.com/query/latest) (React Query)
- **Forms:** [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)
- **Backend:** [Cloudflare Workers](https://workers.cloudflare.com/) 
- **Database:** [Cloudflare D1](https://developers.cloudflare.com/d1/) (SQL)
- **File Storage:** [Cloudflare R2](https://developers.cloudflare.com/r2/)
- **Authentication:** [Firebase Auth](https://firebase.google.com/products/auth)
- **Icons:** [Lucide React](https://lucide.dev/)

---

## 🛠️ Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (Recommended version: 18.x or higher)
- npm or yarn

### Installation

1. **Clone the repository:**
   ```sh
   git clone <repository-url>
   cd cirpman-homes
   ```

2. **Install dependencies:**
   ```sh
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env` file in the root directory and add your Supabase and Firebase credentials (refer to `.env.example` if available).

4. **Start the development server:**
   ```sh
   npm run dev
   ```

---

## 🏗️ Project Structure

- `src/components`: Reusable UI components powered by shadcn/ui.
- `src/pages`: Main application views (Dashboard, Properties, Auth, etc.).
- `src/hooks`: Custom React hooks for shared logic.
- `src/lib`: Utility functions and third-party library initializations.
- `src/types`: TypeScript definitions for project-wide use.

---

## 🌐 Deployment

The project is optimized for deployment on modern cloud platforms:

- **Vercel:** Optimized for Vite and React applications.
- **Cloudflare Pages:** High-performance static and dynamic hosting.

---

## 📄 License

Copyright © 2024 Jeremiah Ojonimi. All rights reserved.
