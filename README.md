# 📝 TextCollab: Collaborative Text Editor

[Live Demo](https://txt-collab.vercel.app/)
TextCollab is a real-time collaborative text editor designed to make document editing seamless, whether online or offline. Built with modern web technologies, it allows multiple users to edit the same document concurrently with live updates and a smooth user experience.

---

## 🚀 Technology Stack

- **Frontend Framework**: Next.js (App Router)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com) (built on Radix UI primitives)
- **Styling**: Tailwind CSS
- **Database & Real-time Sync**: Firebase Realtime Database
- **State Management**: React Hooks
- **Deployment**: Vercel

---

## 🏗️ Architecture Overview

- **Client-side Rendering**: Powered by Next.js for optimized performance
- **Real-time Synchronization**: Firebase ensures instant updates between users
- **Offline Support**: Local storage is used to retain changes while offline
- **Responsive UI**: Fully adaptive layout for mobile, tablet, and desktop

---

## 🧩 Key Components

### 🔤 SimpleEditor
- Lightweight textarea editor
- Auto-expands with input
- Keyboard shortcut support (e.g., Ctrl+A + Delete)

### 📄 DocumentPage
- Manages document state, syncing, saving, and errors
- Includes sharing, download, and clear options
- Displays saving and connection indicators

### 🔥 Firebase Service
- Handles all CRUD operations
- Listens for live document changes
- Detects and manages offline mode

### 📱 Responsive UI
- Mobile slide-out menu and adaptive headers
- Desktop layout with full controls
- Touch-friendly interactions

---

## ✨ Features

### 🔁 Real-time Collaboration
- Simultaneous editing by multiple users
- Live syncing across clients

### 📴 Offline Support
- Saves to local storage when offline
- Auto-sync when back online

### 📂 Document Management
- Create, share, download, and clear documents
- Shareable document URLs

### 📱 Responsive Design
- Optimized for all devices
- Slide-out navigation on mobile

### 🛠 Status Indicators
- Real-time saving feedback
- Online/offline detection
- Last saved timestamp

---

## 🔍 Implementation Details

### 🔄 Data Flow

- **Loading**: Attempts Firebase load → falls back to local → creates new if needed
- **Editing**: Local updates first → Firebase save with debounce
- **Real-time**: Subscriptions apply updates unless local changes conflict
- **Offline Handling**: Local cache + reconnect queue

### ⚙️ Performance Optimizations

- **Debounced Saves**: Reduces write load on Firebase
- **Local-First Rendering**: Instant updates
- **Auto-resize Editor**: No scrollbars, clean UX
- **Conditional Rendering**: Mobile-only components load when needed

---

## 📱 Responsive Design Highlights

- **Mobile-First**: Optimized base styles
- **Adaptive Layouts**: Different headers, controls for each device
- **Flexible UI**: Full-height editor, toast-based notifications

---

## ☁️ Deployment Notes

- **Firebase Setup**:
  - Ensure security rules are enforced
  - (Optional) Add authentication for document ownership

- **Monitoring & Scaling**:
  - Firebase scales automatically
  - Sharding may be needed for very large data sets

- **Security Enhancements**:
  - Rate-limiting
  - Access control mechanisms for shared documents

---

## 📌 Final Thoughts

TextCollab is a fast, modern, and responsive tool for collaborative document editing. Whether you're online or offline, on desktop or mobile, it ensures your writing experience is fluid and accessible.

---

> Built with ❤️ by Jaydeep

