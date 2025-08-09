# TrackSmart - Expense Tracker

A modern, responsive expense tracking application built with Next.js, TypeScript, and Tailwind CSS.

## Features

- **Dashboard**: Overview of income, expenses, and net balance
- **Transaction Management**: Add, view, and delete transactions
- **Profile Management**: Create, edit, and delete custom expense profiles
- **Profile-Specific Currency**: Each profile can have its own currency setting
- **Filtering & Sorting**: Filter transactions by type and search functionality
- **Monthly View**: Navigate through different months
- **Export**: Export transactions to CSV
- **Currency Support**: Multiple currency options with per-profile settings
- **Local Storage**: Persistent data storage in browser

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Profile Management

- Click the profile selector in the header to switch between profiles
- Add new profiles by clicking "Add New Profile" in the dropdown
- Edit existing profiles using the edit icon
- Delete profiles using the trash icon (requires confirmation)
- Each profile maintains its own currency setting (defaults to USD)
- Currency changes are automatically synced to Firebase for authenticated users

## Tech Stack

- **Framework**: Next.js 15
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Charts**: Recharts
- **Forms**: React Hook Form
- **Icons**: Lucide React
