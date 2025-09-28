# AI Form Filler Chrome Extension

**AI Form Filler** is a Chrome extension that automatically fills form fields on web pages using AI models and smart heuristics.  
It supports multiple languages and uses **Faker.js** for known field types and **transformers.js** for AI-powered inference on ambiguous fields.

---

## Features

- **Hybrid Language Detection:**  
  - Uses `<html lang>` attribute if present.  
  - Falls back to **franc** library for detecting the main language from page text.  
  - Default fallback is English (`en`).  

- **Smart Field Filling:**  
  - **Fast path:** fills common fields like email, phone, name, date, number, company, city, and address using Faker.js.  
  - **AI path:** fills ambiguous or unusual fields using **NER models** from `@xenova/transformers`.  
  - Applies input constraints such as `maxlength` and `pattern` wherever possible.  

- **User Model Selection:**  
  - Multi-lingual high-accuracy: `gunghio/xlm-roberta-base-finetuned-panx-ner`  
  - Fast & lightweight multi-lingual: `gunghio/distilbert-base-multilingual-cased-finetuned-conll2003-ner`  
  - High-accuracy English-only: `dslim/bert-base-NER`  

- **Controlled Execution:**  
  - The form is only filled **after the user clicks the button** in the popup.  
  - Avoids unexpected automatic filling.  

- **Logging & Debugging:**  
  - All steps are logged in DevTools for testing: model loading, language detection, field filling, errors, etc.  

- **Browser-Only:**  
  - No server required.  
  - Fully runs in-browser using JS libraries and WebAssembly models.  

---

## Installation

1. **Clone or download** this repository:

```bash
git clone https://github.com/yourusername/ai-form-filler.git
cd ai-form-filler
