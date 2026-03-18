<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# ✅ Checkmaster - Smart Checklist & Event Manager

Checkmaster adalah aplikasi manajemen acara dan *checklist* modern bertenaga AI, dirancang untuk penggunaan pribadi maupun kolaborasi tim secara *real-time*.

Dibangun menggunakan React dan terintegrasi dengan teknologi Gemini AI terbaru dari Google, Checkmaster membantu Anda membuat daftar tugas yang komprehensif untuk acara apa pun (perjalanan, pernikahan, acara perusahaan, dll) secara otomatis hanya dalam hitungan detik.

## ✨ Fitur Utama

* **🤖 AI Task Generator:** Ditenagai oleh **Gemini 2.5 Flash** dari Google, membuat kategori dan daftar tugas terstruktur secara instan hanya dari sebuah *prompt* sederhana.
* **⚡ Kolaborasi Real-time:** Menggunakan Firebase Firestore, memungkinkan anggota tim untuk mencentang tugas, menambahkan catatan, dan berdiskusi secara langsung.
* **🌐 Mode Ganda:** Pilih antara "Mode Pribadi" (offline, penyimpanan lokal) atau "Mode Organisasi" (online, sinkronisasi *cloud*).
* **💬 Chat Acara & Berbagi File:** Fitur obrolan *real-time* bawaan untuk anggota acara, lengkap dengan fitur berbagi gambar dan dokumen melalui Firebase Storage.
* **🎨 UI/UX Modern:** Antarmuka yang sepenuhnya responsif dan dilengkapi animasi menggunakan Tailwind CSS dan Framer Motion.
* **🔐 Keamanan API:** Mengimplementasikan penyandian variabel *environment* Base64 dan pembatasan HTTP Referrer untuk mengamankan API key Gemini pada aplikasi yang berjalan murni di *frontend*.

## 🛠️ Teknologi yang Digunakan

* **Frontend:** React (TypeScript), Vite, Tailwind CSS, Framer Motion, Lucide Icons.
* **Backend/BaaS:** Firebase (Authentication, Firestore Database, Cloud Storage).
* **Integrasi AI:** Google Gemini API (Model `gemini-2.5-flash`).
* **Deployment:** GitHub Pages.

## 🚀 Coba Langsung (Live Demo)

Anda tidak perlu menginstal apa pun untuk mencoba Checkmaster! Rasakan langsung pengalaman menggunakan aplikasinya melalui *browser* Anda:

🔗 **Coba Checkmaster:** [https://erpindcoder.github.io/Checkmaster/](https://erpindcoder.github.io/Checkmaster/)

🧠 **Di Balik Layar (AI Studio):** Ingin melihat bagaimana logika AI dan *prompt* disusun? Kunjungi ruang kerja saya di Google AI Studio di sini: [Proyek Checkmaster di AI Studio](https://ai.studio/apps/09530177-bc1e-4ca0-9b3c-660ed7a8c883)

## 🧠 Tantangan & Proses Engineering

Membangun Checkmaster melibatkan pemecahan beberapa tantangan teknis yang menarik:
* **Penyelarasan Skema JSON:** Berhasil memetakan *output* AI Gemini langsung ke dalam *array* bersarang yang dibutuhkan oleh komponen React *frontend*.
* **Keamanan Cloud di Aplikasi Frontend:** Mengatasi sistem pemblokiran bot keamanan otomatis dengan menyandikan API Key menggunakan format Base64, yang dikombinasikan dengan perlindungan ketat HTTP Referrer dari Google Cloud.

---
*Dibuat dengan dedikasi dan proses debugging tiada henti. ☕*
