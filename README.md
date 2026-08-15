# 🏥 Kutumbh Care - Predictive AI Health Ecosystem

![Kutumbh Care Logo/Banner Placeholder]

**STAMPERS National Hackathon 2026 — Track 3 (Healthcare)**
**Team:** Swasthya Rakshak

---

## 🚀 Overview

Kutumbh Care is a **Predictive AI Health Ecosystem** designed to shift the medical paradigm from *reactive* care to *predictive* early intervention. Built for rural and semi-urban India, the platform seamlessly connects patients, doctors, and expecting mothers through a unified, offline-capable Tri-Portal system.

Unlike traditional telemedicine platforms that simply digitize consultations, Kutumbh Care leverages **Explainable AI (XAI)** and **Time-Series Anomaly Detection** to flag health risks *before* they become irreversible emergencies.

---

## 🌟 Core Innovations

### 1. 🧠 Predictive AI & Explainable AI (XAI)
*   **Time-Series Vitals Engine:** Continuously monitors Blood Pressure, Heart Rate, and SpO2 to generate a dynamic 0-100 Risk Score.
*   **XAI Risk Alerts:** Eliminates "black-box" AI skepticism by providing doctors with clear clinical reasoning (e.g., *"Systolic BP rising for 5 consecutive days"*).

### 2. 📴 Built for India (Offline-First)
*   **Zero Connectivity? No Problem:** Uses IndexedDB and Service Workers to cache vitals and health logs locally. 
*   **Background Sync:** Automatically pushes encrypted data to the cloud the moment connectivity is restored.
*   **Multilingual:** Full React-i18next support for English, Hindi, and Punjabi.

### 3. 🔄 Seamless Heterogeneous Data Ingestion
*   **Wearable Sync API:** Pulls continuous, real-time data directly from Apple Watch and Fitbit.
*   **Lab Report AI Parsing (OCR/NLP):** Instantly extracts structured clinical data from uploaded PDF reports, eliminating manual data entry.

---

## 🛠️ Tri-Portal System

The application offers three dedicated workspaces optimized for specific user needs:

1.  **👨‍👩‍👧 Patient / Family Portal:** Allows entire households to use a single device. Features Teleconsultation (WebRTC), Vitals Tracking, and a Pharmacy Wallet.
2.  **👨‍⚕️ Doctor Dashboard:** Provides clinicians with XAI Risk Alerts, Patient Records, and a fully digital Prescription Pad.
3.  **🤰 Maternity & Period Care:** Specialized tracking for expecting mothers, including week-by-week baby development and personalized diet plans.

---

## 🏗️ Technical Architecture

Kutumbh Care is built using a modern, scalable, and highly secure tech stack:

*   **Frontend:** React, Vite, Tailwind CSS, TypeScript (Progressive Web App).
*   **State & Offline Layer:** React Context API + LocalStorage/IndexedDB.
*   **Backend & Auth:** Supabase (PostgreSQL, Row Level Security, Real-time sync).
*   **AI Engine:** Python/TensorFlow (Time-Series Anomaly Detection & NLP).
*   **Communication:** WebRTC (Live Video Teleconsultation).

---

## 💻 Getting Started

### Prerequisites
*   Node.js (v18+)
*   npm or yarn

### Installation
1. Clone the repository:
   \`\`\`bash
   git clone https://github.com/Rizz-Vizz/kutumbh-care.git
   \`\`\`
2. Navigate to the project directory:
   \`\`\`bash
   cd kutumbh-care
   \`\`\`
3. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`
4. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`
5. Open your browser and navigate to \`http://localhost:3000\`.

---

## 🛡️ Security & Compliance
*   **End-to-End Encryption:** Satisfies stringent Track 3 medical data security requirements.
*   **Row Level Security (RLS):** Supabase policies ensure patients can only access their own household data.

---
*Built with ❤️ by Team Swasthya Rakshak for STAMPERS 2026.*
