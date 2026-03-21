# Bible Journal Anak - Project Journal

## 2026-03-18: Initial Audit & Planning
- **Goal**: Help kids save notes easily and extract metadata/organize using AI.
- **Status**: Researching codebase.
- **Observations**:
    - The project uses Vite, React, and Gemini AI (SDK `@google/genai`).
    - Currently, AI is used for avatar generation but not for journaling metadata.
    - `README.md` is a generic template.
    - S.O.A.P journaling is implemented with textareas but lacks intelligent organization.
- **Action Items**:
    - Audit and rewrite `README.md`.
    - Implement AI metadata extraction using Gemini Flash.
    - Enhance journal organization in the UI.
    - **Added**: Mock Mode/Offline support (allows running without API Key).

### Perubahan Terbaru (18 Maret 2026)
- **Fix Overlapping Layout**: Mengatasi masalah teks "ORANG" dan "ORMAS" yang menutupi tampilan.
    - Penyebab: Browser (seperti Chrome) mencoba menerjemahkan nama ikon (ligature) Material Symbols (contoh: `person` -> `orang`, `info` -> `informasi`).
    - Solusi: Menambahkan atribut `translate="no"`, class `notranslate`, serta menggunakan hex code (`&#xe...;`) untuk ikon-ikon utama agar tidak terpengaruh fitur auto-translate browser.
- **CSS Hardening**: Menambahkan aturan CSS yang lebih ketat untuk `.material-symbols-outlined` agar ukurannya tetap konsisten dan tidak terpengaruh CSS `uppercase`.
- **TypeScript Fix**: Memperbaiki pemanggilan Google GenAI SDK agar sesuai dengan versi terbaru dan mengatasi problem "undefined prompt".

## Offline / Mock Mode
If `VITE_GEMINI_API_KEY` is not found, the app will:
- Use **DiceBear API** to generate avatars instead of Gemini.
- Use **Mock Metadata** (preset tags/summary) for journal entries.
- This allows immediate testing without configuration.

## Roadmap Audit
The current implementation acts as a solid "Alpha" phase.
- **Phase 1: Foundation (Done)** - S.O.A.P structure, Reading Plan, Rewards/Badges.
- **Phase 2: AI Companion (In Progress)** - Avatar generation is done. Metadata extraction is next.
- **Phase 3: Deep Insights (Future)** - Progress reports for parents, thematic study grouping, and voice interaction.
