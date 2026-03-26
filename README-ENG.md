<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# ✅ Checkmaster - Smart Checklist & Event Manager

Checkmaster is a modern, AI-powered checklist and event management application designed for both personal use and real-time team collaboration. 

Built with React and integrated with Google's latest Gemini AI, Checkmaster helps you automatically generate comprehensive task lists for any event (travel, weddings, corporate events, etc.) in seconds.

## ✨ Key Features

* **🤖 AI Task Generator:** Powered by Google's **Gemini 2.5 Flash**, instantly generate structured task categories and checklists based on a simple prompt.
* **⚡ Real-time Collaboration:** Built with Firebase Firestore, allowing team members to check off tasks, add notes, and chat in real-time.
* **🌐 Dual Mode:** Choose between "Personal Mode" (offline, local storage) or "Organization Mode" (online, cloud sync).
* **💬 Event Chat & File Sharing:** Built-in real-time chat for event members, complete with image and document sharing via Firebase Storage.
* **🎨 Modern UI/UX:** Fully responsive, animated interface built with Tailwind CSS and Framer Motion.
* **🔐 Secure API Handling:** Implements Base64 environment variable encoding and HTTP Referrer restrictions to secure the Gemini API key on a frontend-only deployment.

## 🛠️ Tech Stack

* **Frontend:** React (TypeScript), Vite, Tailwind CSS, Framer Motion, Lucide Icons.
* **Backend/BaaS:** Firebase (Authentication, Firestore Database, Cloud Storage).
* **AI Integration:** Google Gemini API (`gemini-2.5-flash` model).
* **Deployment:** GitHub Pages.

## 🚀 Live Demo & Access

You don't need to install anything to try Checkmaster! Experience the app directly through your browser:

🔗 **Play with Checkmaster:** [https://erpindcoder.github.io/Checkmaster/](https://erpindcoder.github.io/Checkmaster/)

🧠 **Behind the Scenes (AI Studio):** Want to see how the AI logic and prompts are structured? Check out my workspace in Google AI Studio here: [Checkmaster AI Studio Project](https://ai.studio/apps/09530177-bc1e-4ca0-9b3c-660ed7a8c883)

****USE DUMMMY GMAIL ACCOUNT IF YOU WANT TO TRY TO LOGIN !**

## 🧠 Engineering Journey & Challenges Overcome

Building Checkmaster involved solving several interesting challenges:
* **JSON Schema Alignment:** Successfully mapping the raw array/object output from the Gemini AI directly into the nested iterable arrays required by the React frontend component state.
* **Cloud Security on Frontend-Only Apps:** Bypassed aggressive automated security bots by obfuscating the API key using Base64 encoding combined with strict Google Cloud HTTP Referrer constraints.

---
*Built with passion and lots of debugging. ☕*
