# 🇱🇰 Sri Lanka Business AI Finder (HTML/JS)

A lightweight, zero-dependency Vanilla JavaScript web application that searches, extracts, and organizes local business contacts, addresses, and details across Sri Lanka in real time using AI.

---

## 🔗 Live Demo
Check out the live web app here:  
👉 **[Open Live Demo](https://<YOUR-GITHUB-USERNAME>.github.io/lk-business-finder-web/)**

---

## ✨ Features
- **Zero Backend Required:** Runs entirely in the browser using Vanilla HTML5, CSS3, and JavaScript.
- **Real-Time Data Extraction:** Uses Gemini AI combined with Google Search Grounding to fetch live, verified business data instead of relying on outdated training cutoffs.
- **Structured Output:** Automatically parses AI responses into clean, responsive business cards with contacts, addresses, and shop descriptions.
- **Secure Key Storage:** Saves the user's Gemini API key locally in the browser's `localStorage` (it never leaves the browser).

---

## 🤖 How AI is Used in this Project

This application leverages the **Google Gemini API (`gemini-3.6-flash`)** along with **Google Search Grounding** to solve the problem of locating local, unstructured contact information:

```text
[User Prompt] 
      │
      ▼
[Gemini 3.6 Flash] ─── (Google Search Grounding) ───► [Live Web Pages / Google Maps Data]
      │                                                          │
      ▼                                                          ▼
[Extract & Validate] ◄────────────────────────────────── [Raw Search Results]
      │
      ▼
[Structured JSON Output] ──► [Frontend Render (DOM Cards)]
