# Pet Adoption Information Card

A React web application for creating and managing pet adoption profile cards, designed with a retro "kennel tag & vet record" aesthetic. It runs a full SQLite database in the browser via WebAssembly (`sql.js`).

## Features

- **Kennel Tag UI**: Custom styled pet profile cards designed like shelter intake records.
- **In-Browser SQLite Database**: Uses `sql.js` (SQLite compiled to WebAssembly) to store and query pet data locally without a backend.
- **Media Support**: Upload photos, take pictures with your webcam, or record video snippets for pet profiles.
- **Pet Management (CRUD)**: Add new pets, update details, change adoption status, or delete entries.
- **Filtering**: Easily filter profiles by animal category (Dog, Cat, Bird, Rabbit, etc.) and availability status.

## Tech Stack

- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Database**: `sql.js` (WebAssembly SQLite)

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation & Run

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/pet-adoption-card.git
   cd pet-adoption-card
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the dev server:
   ```bash
   npm run dev
   ```

4. Open `http://localhost:5173` in your browser.

## Build

To create a production build:

```bash
npm run build
```
