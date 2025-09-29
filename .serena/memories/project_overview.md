# MostlyJournal - Decentralized Journal App Project Overview

## Project Purpose
A decentralized journal application built with Next.js and TypeScript that allows users to create, organize, and manage notes in a hierarchical folder structure. The app uses blockchain-based authentication (Privy/SIWE) and decentralized storage (Tableland) for data persistence.

## Key Features
- **Authentication**: Wallet-based login using Privy or SIWE (Sign-In with Ethereum)
- **Decentralized Storage**: Notes and folders stored on Tableland (decentralized SQL on Polygon)
- **Hierarchical Organization**: Google Drive-like folder structure for organizing notes
- **Real-time Updates**: Observable views with polling for real-time synchronization
- **Responsive UI**: Google Docs-like note editor with modern React components

## Tech Stack
- **Frontend**: Next.js 14+ with TypeScript, App Router, Tailwind CSS
- **Authentication**: Privy (easy onboarding) or SIWE (custom control)
- **Web3**: Viem (modern Ethereum library replacing ethers.js)
- **Database**: Tableland SDK for decentralized SQL storage
- **State Management**: Zustand for global state, React Query for data fetching
- **Blockchain**: Polygon Amoy testnet
- **Deployment**: Vercel

## Architecture Pattern
- **MVC Structure**:
  - **Models**: Data entities and DA logic (Tableland interactions)
  - **Views**: React components for UI rendering
  - **Controllers**: Hooks and services orchestrating interactions
- **Layered Architecture**: Clear separation of concerns across authentication, data access, business logic, and UI layers