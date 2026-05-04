import {
  faker as defaultFaker,
  Faker,
  base,
  en,
  es,
  fr,
  de,
} from "@faker-js/faker";
import { franc } from "franc-min";

let faker = defaultFaker;
const PERSONA_STORAGE_KEY = "formFillerPersonasByOrigin";
const MAX_PERSONA_AGE_MS = 6 * 60 * 60 * 1000;
const fakerByLocale = {
  en: new Faker({ locale: [en, base] }),
  es: new Faker({ locale: [es, en, base] }),
  fr: new Faker({ locale: [fr, en, base] }),
  de: new Faker({ locale: [de, en, base] }),
};

const SUPPORTED_LANGS = new Set(["en", "es", "fr", "de"]);

const AUTOCOMPLETE_FIELD_MAP = {
  name: "FULL_NAME",
  honorific_prefix: "TEXT",
  given_name: "FIRST_NAME",
  additional_name: "TEXT",
  family_name: "LAST_NAME",
  honorific_suffix: "TEXT",
  nickname: "TEXT",
  email: "EMAIL",
  username: "TEXT",
  "new-password": "PASSWORD",
  "current-password": "PASSWORD",
  "one-time-code": "NUMBER",
  organization: "COMPANY",
  "organization-title": "JOB_TITLE",
  "street-address": "ADDRESS",
  "address-line1": "ADDRESS",
  "address-line2": "ADDRESS",
  "address-line3": "ADDRESS",
  "address-level1": "CITY",
  "address-level2": "CITY",
  "address-level3": "CITY",
  "address-level4": "CITY",
  country: "COUNTRY",
  "country-name": "COUNTRY",
  "postal-code": "ZIP_CODE",
  "cc-name": "FULL_NAME",
  "cc-given-name": "FIRST_NAME",
  "cc-family-name": "LAST_NAME",
  "cc-number": "NUMBER",
  "cc-exp": "DATE",
  "cc-exp-month": "NUMBER",
  "cc-exp-year": "NUMBER",
  "cc-csc": "NUMBER",
  bday: "DATE",
  "bday-day": "NUMBER",
  "bday-month": "NUMBER",
  "bday-year": "NUMBER",
  sex: "TEXT",
  tel: "PHONE",
  "tel-country-code": "PHONE",
  "tel-national": "PHONE",
  "tel-area-code": "PHONE",
  "tel-local": "PHONE",
  "tel-local-prefix": "PHONE",
  "tel-local-suffix": "PHONE",
  "tel-extension": "PHONE",
  url: "URL",
};

const KEYWORDS = {
  en: {
    EMAIL: ["email", "e-mail", "mail"],
    PASSWORD: ["password", "pwd", "pass"],
    PHONE: ["phone", "tel", "telephone", "mobile", "cell", "contact number"],
    URL: ["url", "website", "link", "homepage"],
    DATE: ["date", "birthday", "birth", "dob"],
    NUMBER: ["number", "num", "age", "quantity", "amount"],
    FIRST_NAME: ["first name", "firstname", "fname", "given name"],
    LAST_NAME: ["last name", "lastname", "lname", "surname", "family name"],
    FULL_NAME: ["full name", "fullname", "complete name", "your name", "name"],
    COMPANY: ["company", "organization", "organisation", "employer", "business", "corporation", "office", "workplace"],
    JOB_TITLE: ["job", "position", "title", "role", "occupation", "profession"],
    SUPERVISOR: ["supervisor", "manager", "boss", "superior", "lead", "director"],
    ADDRESS: ["address", "street", "location", "residence"],
    CITY: ["city", "town", "municipality"],
    COUNTRY: ["country", "nation", "nationality"],
    ZIP_CODE: ["zip", "postal", "postcode", "post code"],
    TEXT: ["comment", "description", "message", "note", "detail", "about", "bio"],
  },
  es: {
    EMAIL: ["correo", "correo electronico", "e-mail", "mail"],
    PASSWORD: ["contrasena", "clave", "password"],
    PHONE: ["telefono", "movil", "celular", "contacto"],
    URL: ["sitio web", "url", "enlace", "pagina web"],
    DATE: ["fecha", "nacimiento", "cumpleanos"],
    NUMBER: ["numero", "edad", "cantidad", "monto"],
    FIRST_NAME: ["nombre", "nombre de pila"],
    LAST_NAME: ["apellido", "apellidos"],
    FULL_NAME: ["nombre completo"],
    COMPANY: ["empresa", "organizacion", "empleador", "trabajo"],
    JOB_TITLE: ["puesto", "cargo", "profesion", "rol"],
    SUPERVISOR: ["supervisor", "jefe", "gerente", "director"],
    ADDRESS: ["direccion", "calle", "domicilio"],
    CITY: ["ciudad", "municipio", "poblacion"],
    COUNTRY: ["pais", "nacionalidad"],
    ZIP_CODE: ["codigo postal", "postal"],
    TEXT: ["comentario", "descripcion", "mensaje", "nota", "detalle", "bio"],
  },
  fr: {
    EMAIL: ["email", "e-mail", "courriel", "mail"],
    PASSWORD: ["mot de passe", "password"],
    PHONE: ["telephone", "tel", "portable", "mobile"],
    URL: ["site web", "url", "lien"],
    DATE: ["date", "naissance", "anniversaire"],
    NUMBER: ["numero", "age", "quantite", "montant"],
    FIRST_NAME: ["prenom"],
    LAST_NAME: ["nom de famille", "nom"],
    FULL_NAME: ["nom complet"],
    COMPANY: ["entreprise", "organisation", "employeur", "travail"],
    JOB_TITLE: ["poste", "fonction", "role", "profession"],
    SUPERVISOR: ["superviseur", "manager", "responsable", "directeur"],
    ADDRESS: ["adresse", "rue", "domicile"],
    CITY: ["ville", "commune"],
    COUNTRY: ["pays", "nationalite"],
    ZIP_CODE: ["code postal", "postal"],
    TEXT: ["commentaire", "description", "message", "note", "detail", "bio"],
  },
  de: {
    EMAIL: ["email", "e-mail", "mail"],
    PASSWORD: ["passwort"],
    PHONE: ["telefon", "handy", "mobil", "kontakt"],
    URL: ["webseite", "url", "link", "homepage"],
    DATE: ["datum", "geburtstag", "geburtsdatum"],
    NUMBER: ["nummer", "alter", "menge", "betrag"],
    FIRST_NAME: ["vorname"],
    LAST_NAME: ["nachname", "familienname"],
    FULL_NAME: ["vollstandiger name", "voller name", "name"],
    COMPANY: ["firma", "unternehmen", "organisation", "arbeitgeber", "arbeitsplatz"],
    JOB_TITLE: ["position", "rolle", "beruf", "titel"],
    SUPERVISOR: ["vorgesetzter", "manager", "leiter", "direktor", "chef"],
    ADDRESS: ["adresse", "strasse", "wohnort"],
    CITY: ["stadt", "ort", "gemeinde"],
    COUNTRY: ["land", "nationalitat"],
    ZIP_CODE: ["plz", "postleitzahl", "postal"],
    TEXT: ["kommentar", "beschreibung", "nachricht", "notiz", "detail", "bio"],
  },
};

// Listener for messages from the popup and background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "executeFill") {
    const model = message.model; // Get the model from the popup/background script
    let useBasicMode = message.useBasicMode || false; // Check if basic mode is requested
    
    console.log(`🚀 Starting form fill with model: ${model}, Basic Mode: ${useBasicMode}`);
    
    // Double-check mode from storage to ensure consistency
    (async () => {
      try {
        const storageResult = await chrome.storage.local.get(['currentMode']);
        const storedMode = storageResult.currentMode;
        
        if (storedMode) {
          const shouldUseBasic = storedMode === 'basic';
          if (shouldUseBasic !== useBasicMode) {
            console.log(`🔄 Mode mismatch detected. Message: ${useBasicMode}, Storage: ${shouldUseBasic}. Using storage value.`);
            useBasicMode = shouldUseBasic;
          }
        }
        
        console.log(`📋 Final mode decision: Basic Mode = ${useBasicMode}`);
        
        const results = await fillForms(model, useBasicMode);
        console.log(`✅ Form fill completed: ${results.length} fields processed`);
        sendResponse({ success: true, results });
        
      } catch (error) {
        console.error("❌ Error filling forms:", error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    
    return true; // Indicates that the response is sent asynchronously
  }
});

async function fillForms(model, useBasicMode = false) {
  // Now takes model and basic mode parameters
  const results = [];

  // Deterministic mode is default for zero-cost, browser-stable behavior.
  const deterministicMode = true;
  if (!useBasicMode && deterministicMode) {
    console.log("🔒 AI mode requested, but deterministic mode is active. Falling back to basic mode.");
  }
  useBasicMode = true;

  console.log(`📋 Fill mode: BASIC (Deterministic + Session Persona)`);
  const inputs = document.querySelectorAll(
    'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="file"]):not([type="image"]), textarea, select, output'
  );

  const lang = detectPageLanguage();
  faker = getFakerForLanguage(lang);
  console.log("Detected language:", lang);

  const originKey = window.location.origin;
  let generatedUserData = await getOrCreatePersona(originKey, lang);

  // Track processed radio groups to avoid duplicates
  const processedRadioGroups = new Set();

  for (const input of inputs) {
    // Skip if this is a radio button and we've already processed its group
    if (input.type === "radio" && processedRadioGroups.has(input.name)) {
      continue;
    }

    // For non-radio/checkbox inputs, only fill if empty
    // For radio/checkbox, process regardless of current state
    const shouldProcess =
      input.type === "radio" ||
      input.type === "checkbox" ||
      (!input.value && !input.checked);

    if (shouldProcess) {
      const label = findLabelForInput(input);
      const textToAnalyze = label
        ? label.innerText
        : input.placeholder || input.name || input.id || "";

      // Handle select dropdowns directly without AI
      if (input.tagName?.toLowerCase() === "select") {
        const options = Array.from(input.options).filter(
          (opt) => opt.value && opt.value !== ""
        );
        if (options.length > 0) {
          const randomOption = options[Math.floor(Math.random() * options.length)];
          input.value = randomOption.value;
          console.log(
            `🎯 Selected dropdown option: "${randomOption.text}" (value: "${randomOption.value}") for field: "${textToAnalyze}"`
          );
          results.push({
            field: textToAnalyze,
            filled_with: `${randomOption.text} (${randomOption.value})`,
            method: "dropdown-selection",
            entities: [{ entity: "DROPDOWN_SELECTION", score: 1.0 }],
          });
          continue; // Skip AI processing for select elements
        }
      }

      if (textToAnalyze) {
        console.log(
          `Analyzing field: "${textToAnalyze}" for input:`,
          input.name || input.id
        );

        // Mark radio group as processed
        if (input.type === "radio") {
          processedRadioGroups.add(input.name);
        }

        // Choose processing method based on mode
        if (useBasicMode) {
          // BASIC MODE: Skip AI entirely, use pattern matching only
          console.log(`🔧 BASIC MODE: Using pattern matching for "${textToAnalyze}"`);
          
          const expectedType = detectFieldType(textToAnalyze, input, lang);
          const patternFilled = fillFieldWithPatterns(
            input,
            textToAnalyze,
            expectedType,
            generatedUserData
          );
          
          if (patternFilled) {
            let displayValue;
            if (input.type === "radio") {
              const selectedRadio = document.querySelector(
                `input[type="radio"][name="${input.name}"]:checked`
              );
              displayValue = selectedRadio
                ? `${selectedRadio.value} (selected)`
                : "none selected";
            } else if (input.type === "checkbox") {
              displayValue = `${input.checked ? "checked" : "unchecked"}`;
            } else {
              displayValue = input.value;
            }

            console.log(`✅ BASIC filled: ${textToAnalyze} -> ${displayValue}`);
            results.push({
              field: textToAnalyze,
              filled_with: displayValue,
              method: "pattern-matching",
              entities: [{ entity: expectedType || "PATTERN", score: 1.0 }],
            });
          }
        } else {
          // AI MODE: Use AI + pattern matching fallback
          try {
            // Get more context for better AI analysis
            const contextText = getFieldContext(input, textToAnalyze);
            console.log(`🤖 Sending to AI: "${contextText}"`);

            // Detect expected field type ahead of AI to reconcile conflicts (e.g., work -> company, city -> location)
            const expectedType = detectFieldType(textToAnalyze, input);

            // Send message to background script where AI models are loaded
            const aiResponse = await chrome.runtime.sendMessage({
              action: "performNER",
              text: contextText,
              model: model,
            });

          if (aiResponse && aiResponse.success) {
            const entities = aiResponse.entities;
            const modelUsed = aiResponse.modelUsed || 'unknown';
            const modelStatus = aiResponse.modelStatus || 'unknown';
            
            console.log(`🤖 AI Response for "${textToAnalyze}":`, entities);
            console.log(`🤖 Model Used: ${modelUsed}`);
            console.log(`🤖 Model Status: ${modelStatus}`);

            const aiFilled = fillField(
              input,
              entities,
              lang,
              textToAnalyze,
              expectedType,
              generatedUserData
            );
            if (aiFilled) {
              // Determine the method and display value
              let method = "ai-ner";
              let displayValue;
              let topEntities = "";

              if (entities && entities.length > 0) {
                topEntities = entities
                  .slice(0, 3)
                  .map((e) => `${e.entity}(${Math.round(e.score * 100)}%)`)
                  .join(", ");
                console.log(`✅ AI MODEL USED: ${modelUsed} (${modelStatus}) - Entities: ${topEntities}`);
              } else {
                method = "fallback";
                topEntities = "no-entities-from-ai";
                console.log(`⚠️ AI MODEL RETURNED NO ENTITIES: ${modelUsed} (${modelStatus})`);
              }

              if (input.type === "radio") {
                const selectedRadio = document.querySelector(
                  `input[type="radio"][name="${input.name}"]:checked`
                );
                displayValue = selectedRadio
                  ? `${selectedRadio.value} (selected)`
                  : "none selected";
              } else if (input.type === "checkbox") {
                displayValue = `${input.checked ? "checked" : "unchecked"}`;
              } else {
                displayValue = input.value;
              }

              console.log(
                `✅ ${
                  method === "ai-ner" ? "AI" : "Fallback"
                } filled: ${textToAnalyze} -> ${displayValue} (entities: ${topEntities})`
              );
              results.push({
                field: textToAnalyze,
                filled_with: displayValue,
                method: method,
                entities:
                  entities && entities.length > 0
                    ? entities.slice(0, 3)
                    : [{ entity: "FALLBACK", score: 1.0 }],
              });
            } else {
              console.log(
                `❌ AI couldn't fill: ${textToAnalyze} (entities: ${entities
                  .map((e) => e.entity)
                  .join(", ")})`
              );
            }
          } else {
            console.warn(
              "❌ AI analysis failed for text:",
              textToAnalyze,
              "Error:",
              aiResponse?.error
            );
          }
        } catch (error) {
          console.warn("Error during AI analysis:", error);
        }
        } // End of AI mode block
      }
    }
  }
  await persistPersona(originKey, generatedUserData, lang);
  return results;
}

function normalizeLang(lang) {
  if (!lang || typeof lang !== "string") return "en";
  const normalized = lang.toLowerCase().split("-")[0];
  return SUPPORTED_LANGS.has(normalized) ? normalized : "en";
}

function detectPageLanguage() {
  const htmlLang = document.documentElement.lang;
  if (htmlLang) {
    return normalizeLang(htmlLang);
  }

  const detected = franc(document.body?.innerText || "");
  if (detected === "spa") return "es";
  if (detected === "fra") return "fr";
  if (detected === "deu") return "de";
  return "en";
}

function getFakerForLanguage(lang) {
  const normalized = normalizeLang(lang);
  return fakerByLocale[normalized] || fakerByLocale.en;
}

async function getOrCreatePersona(origin, lang) {
  const normalizedLang = normalizeLang(lang);
  const storage = await chrome.storage.local.get([PERSONA_STORAGE_KEY]);
  const personasByOrigin = storage[PERSONA_STORAGE_KEY] || {};
  const now = Date.now();
  const existing = personasByOrigin[origin];

  if (
    existing?.persona &&
    existing.lang === normalizedLang &&
    now - (existing.updatedAt || 0) < MAX_PERSONA_AGE_MS
  ) {
    return existing.persona;
  }

  const persona = buildPersona(normalizedLang);
  personasByOrigin[origin] = { persona, lang: normalizedLang, updatedAt: now };
  await chrome.storage.local.set({ [PERSONA_STORAGE_KEY]: personasByOrigin });
  return persona;
}

async function persistPersona(origin, persona, lang) {
  const storage = await chrome.storage.local.get([PERSONA_STORAGE_KEY]);
  const personasByOrigin = storage[PERSONA_STORAGE_KEY] || {};
  personasByOrigin[origin] = {
    persona,
    lang: normalizeLang(lang),
    updatedAt: Date.now(),
  };
  await chrome.storage.local.set({ [PERSONA_STORAGE_KEY]: personasByOrigin });
}

function buildPersona(lang) {
  const localeFaker = getFakerForLanguage(lang);
  const firstName = localeFaker.person.firstName();
  const lastName = localeFaker.person.lastName();
  const provider = localeFaker.helpers.arrayElement([
    "gmail.com",
    "yahoo.com",
    "outlook.com",
    "protonmail.com",
  ]);
  return {
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
    email: `${firstName}.${lastName}`.replace(/\s+/g, "").toLowerCase() + `@${provider}`,
    company: localeFaker.company.name(),
    city: localeFaker.location.city(),
    address: localeFaker.location.streetAddress(),
    country: localeFaker.location.country(),
    zipCode: localeFaker.location.zipCode(),
    jobTitle: localeFaker.person.jobTitle(),
  };
}

// Pattern-only filling function for basic mode
function fillFieldWithPatterns(input, textToAnalyze, expectedType, userData) {
  console.log(`🔧 Pattern filling: "${textToAnalyze}" (type: ${expectedType})`);
  
  let value;
  switch (expectedType) {
    case "PERSON_NAME":
    case "FULL_NAME":
    case "NAME":
      value = generatePersonName(userData);
      break;
    case "FIRST_NAME":
      ensureUserData(userData);
      value = userData.firstName;
      break;
    case "LAST_NAME":
      ensureUserData(userData);
      value = userData.lastName;
      break;
    case "EMAIL":
      value = generateEmail(userData);
      break;
    case "COMPANY":
    case "ORGANIZATION":
      value = userData.company || faker.company.name();
      break;
    case "PHONE":
      value = generatePhoneNumber(input);
      break;
    case "CITY":
    case "LOCATION":
      value = userData.city || faker.location.city();
      break;
    case "ADDRESS":
      value = userData.address || faker.location.streetAddress();
      break;
    case "COUNTRY":
      value = userData.country || faker.location.country();
      break;
    case "ZIP_CODE":
      value = userData.zipCode || faker.location.zipCode();
      break;
    case "JOB_TITLE":
      value = userData.jobTitle || faker.person.jobTitle();
      break;
    case "SUPERVISOR":
      value = generatePersonName({}); // Different person for supervisor
      break;
    case "PASSWORD":
      value = faker.internet.password();
      break;
    case "URL":
      value = faker.internet.url();
      break;
    case "DATE":
      value = faker.date.future().toISOString().split("T")[0];
      break;
    case "NUMBER":
      value = faker.number.int({ min: 1, max: 100 }).toString();
      break;
    case "TEXT":
    default:
      // For text fields, generate appropriate content based on context
      const lowerContext = textToAnalyze.toLowerCase();
      if (
        lowerContext.includes("comment") ||
        lowerContext.includes("description") ||
        lowerContext.includes("message") ||
        lowerContext.includes("note") ||
        lowerContext.includes("detail")
      ) {
        value = "This is a sample comment for testing purposes.";
      } else if (
        lowerContext.includes("supervisor") ||
        lowerContext.includes("manager") ||
        lowerContext.includes("boss")
      ) {
        value = generatePersonName({}); // Different person for supervisor
      } else if (
        lowerContext.includes("work") ||
        lowerContext.includes("company") ||
        lowerContext.includes("employ")
      ) {
        value = faker.company.name();
      } else if (
        lowerContext.includes("city") ||
        lowerContext.includes("from") ||
        lowerContext.includes("location")
      ) {
        value = faker.location.city();
      } else if (lowerContext.includes("name")) {
        value = generatePersonName(userData);
      } else {
        // Generic fallback - use a person name as it's most commonly needed
        value = generatePersonName(userData);
      }
      break;
  }

  if (value) {
    console.log(`🎲 Pattern-generated value: "${value}"`);
    handleInputType(input, value);
    
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    
    console.log(`✅ Pattern filled: ${textToAnalyze} -> ${input.value || input.checked}`);
    return true;
  }

  // Final fallback for radio buttons and checkboxes
  if (input.type === "radio" || input.type === "checkbox") {
    console.log(`🔄 Final Fallback: Handling ${input.type} directly`);
    handleInputType(input, null);
    
    const displayValue =
      input.type === "radio"
        ? (document.querySelector(
            `input[type="radio"][name="${input.name}"]:checked`
          )?.value || "none") + " (selected)"
        : `${input.checked ? "checked" : "unchecked"}`;

    console.log(`✅ Fallback filled: ${textToAnalyze} -> ${displayValue}`);
    return true;
  }

  return false;
}

function findLabelForInput(input) {
  // Check for a wrapping label
  let label = input.closest("label");
  if (label) return label;

  // Check for a `for` attribute
  if (input.id) {
    label = document.querySelector(`label[for="${input.id}"]`);
    if (label) return label;
  }

  // For radio buttons and checkboxes, try to find group label
  if (input.type === "radio" || input.type === "checkbox") {
    // Look for a parent container with a label
    const container = input.closest(
      ".input-group, .form-group, .field-group, fieldset"
    );
    if (container) {
      // Try to find a label within the container that's not wrapping an input
      const containerLabel = container.querySelector("label:not(:has(input))");
      if (containerLabel) return containerLabel;

      // Try to find any label in the container
      const anyLabel = container.querySelector("label");
      if (anyLabel) return anyLabel;
    }

    // Look for preceding text or label
    let prev = input.parentElement?.previousElementSibling;
    while (prev) {
      if (prev.tagName === "LABEL") return prev;
      if (prev.textContent?.trim()) {
        // Create a virtual label element for text content
        const virtualLabel = document.createElement("label");
        virtualLabel.innerText = prev.textContent.trim();
        return virtualLabel;
      }
      prev = prev.previousElementSibling;
    }
  }

  return null;
}

function getFieldContext(input, textToAnalyze) {
  // Get surrounding context to help AI understand the field better
  let context = textToAnalyze;

  // Special handling for radio buttons and checkboxes
  if (input.type === "radio" || input.type === "checkbox") {
    // Add the input's value/label to context
    if (input.value) {
      context += ` ${input.value}`;
    }

    // For radio buttons, add all options in the group
    if (input.type === "radio" && input.name) {
      const radioGroup = document.querySelectorAll(
        `input[type="radio"][name="${input.name}"]`
      );
      const options = Array.from(radioGroup)
        .map((radio) => {
          const radioLabel = findLabelForInput(radio);
          return radioLabel ? radioLabel.innerText.trim() : radio.value;
        })
        .filter(Boolean);

      if (options.length > 0) {
        context += ` (options: ${options.join(", ")})`;
      }
    }

    // For checkboxes with the same name, add all options
    if (input.type === "checkbox" && input.name) {
      const checkboxGroup = document.querySelectorAll(
        `input[type="checkbox"][name="${input.name}"]`
      );
      if (checkboxGroup.length > 1) {
        const options = Array.from(checkboxGroup)
          .map((checkbox) => {
            const checkboxLabel = findLabelForInput(checkbox);
            return checkboxLabel
              ? checkboxLabel.innerText.trim()
              : checkbox.value;
          })
          .filter(Boolean);

        if (options.length > 0) {
          context += ` (options: ${options.join(", ")})`;
        }
      }
    }
  } else {
    // Add nearby text content for context (for non-radio/checkbox inputs)
    const parent = input.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children);
      const inputIndex = siblings.indexOf(input);

      // Get text from previous and next siblings
      if (inputIndex > 0) {
        const prevText = siblings[inputIndex - 1].textContent?.trim();
        if (prevText && prevText.length < 50) {
          context = prevText + " " + context;
        }
      }

      if (inputIndex < siblings.length - 1) {
        const nextText = siblings[inputIndex + 1].textContent?.trim();
        if (nextText && nextText.length < 50) {
          context = context + " " + nextText;
        }
      }
    }
  }

  // Add input attributes for more context
  if (input.type) context += ` (${input.type} field)`;
  if (input.required) context += " (required)";
  if (input.pattern) context += ` (pattern: ${input.pattern})`;

  return context.trim();
}

function fillField(
  input,
  entities,
  lang,
  textToAnalyze = "",
  analysis = null,
  userData = {}
) {
  // Map expected field types to compatible NER entity labels
  const compatibleEntitiesByType = {
    COMPANY: new Set(["ORG", "B-ORG", "I-ORG", "ORGANIZATION", "B-ORGANIZATION", "I-ORGANIZATION"]),
    ORGANIZATION: new Set(["ORG", "B-ORG", "I-ORG", "ORGANIZATION", "B-ORGANIZATION", "I-ORGANIZATION"]),
    CITY: new Set(["LOC", "B-LOC", "I-LOC", "LOCATION", "B-LOCATION", "I-LOCATION", "GPE", "B-GPE", "I-GPE"]),
    LOCATION: new Set(["LOC", "B-LOC", "I-LOC", "LOCATION", "B-LOCATION", "I-LOCATION", "GPE", "B-GPE", "I-GPE"]),
    FULL_NAME: new Set(["PER", "B-PER", "I-PER", "PERSON", "B-PERSON", "I-PERSON"]),
    PERSON_NAME: new Set(["PER", "B-PER", "I-PER", "PERSON", "B-PERSON", "I-PERSON"]),
    NAME: new Set(["PER", "B-PER", "I-PER", "PERSON", "B-PERSON", "I-PERSON"]),
    FIRST_NAME: new Set(["PER", "B-PER", "I-PER", "PERSON", "B-PERSON", "I-PERSON"]),
    LAST_NAME: new Set(["PER", "B-PER", "I-PER", "PERSON", "B-PERSON", "I-PERSON"]),
    EMAIL: new Set(["EMAIL"]),
    PHONE: new Set(["PHONE"]),
    DATE: new Set(["DATE", "B-DATE", "I-DATE", "TIME", "B-TIME", "I-TIME"]),
    NUMBER: new Set(["NUMBER", "PERCENT", "MONEY"]),
  };

  function isEntityCompatible(expectedType, entityLabel) {
    if (!expectedType) return true; // no constraint
    const set = compatibleEntitiesByType[expectedType];
    if (!set) return true; // unknown type → allow
    return set.has(entityLabel) || set.has(entityLabel.toUpperCase());
  }
  const entityMap = {
    // BIO tagging format (B- = Beginning, I- = Inside)
    "B-PER": () => generatePersonName(userData),
    "I-PER": () => generatePersonName(userData),
    "B-PERSON": () => generatePersonName(userData),
    "I-PERSON": () => generatePersonName(userData),
    "B-ORG": () => faker.company.name(),
    "I-ORG": () => faker.company.name(),
    "B-ORGANIZATION": () => faker.company.name(),
    "I-ORGANIZATION": () => faker.company.name(),
    "B-LOC": () => faker.location.city(),
    "I-LOC": () => faker.location.city(),
    "B-LOCATION": () => faker.location.city(),
    "I-LOCATION": () => faker.location.city(),
    "B-GPE": () => faker.location.city(), // Geopolitical entity
    "I-GPE": () => faker.location.city(),
    "B-DATE": () => faker.date.future().toISOString().split("T")[0],
    "I-DATE": () => faker.date.future().toISOString().split("T")[0],
    "B-TIME": () => faker.date.future().toISOString().split("T")[0],
    "I-TIME": () => faker.date.future().toISOString().split("T")[0],
    "B-MONEY": () => faker.finance.amount(),
    "I-MONEY": () => faker.finance.amount(),
    "B-PERCENT": () => faker.number.int({ min: 1, max: 100 }) + "%",
    "I-PERCENT": () => faker.number.int({ min: 1, max: 100 }) + "%",

    // Legacy format (without BIO tags)
    PER: () => generatePersonName(userData),
    PERSON: () => generatePersonName(userData),
    ORG: () => faker.company.name(),
    ORGANIZATION: () => faker.company.name(),
    LOC: () => faker.location.city(),
    LOCATION: () => faker.location.city(),
    GPE: () => faker.location.city(),
    DATE: () => faker.date.future().toISOString().split("T")[0],
    TIME: () => faker.date.future().toISOString().split("T")[0],
    PHONE: () => generatePhoneNumber(input),
    EMAIL: () => generateEmail(userData),
    MONEY: () => faker.finance.amount(),
    PERCENT: () => faker.number.int({ min: 1, max: 100 }) + "%",
    NUMBER: () => faker.number.int({ min: 1, max: 100 }).toString(),
    TEXT: () => faker.person.fullName(), // Better default for text fields
    PASSWORD: () => faker.internet.password(),
    URL: () => faker.internet.url(),
    SEARCH: () => faker.commerce.productName(),
    COLOR: () => faker.internet.color(),
    RANGE: () => faker.number.int({ min: 0, max: 100 }).toString(),
    TIME: () =>
      faker.date.recent().toTimeString().split(" ")[0].substring(0, 5),
    DATETIME: () => faker.date.recent().toISOString().slice(0, 16),
    MONTH: () => faker.date.recent().toISOString().slice(0, 7),
    WEEK: () => {
      const date = faker.date.recent();
      const year = date.getFullYear();
      const week = Math.ceil(
        (date.getTime() - new Date(year, 0, 1).getTime()) /
          (7 * 24 * 60 * 60 * 1000)
      );
      return `${year}-W${week.toString().padStart(2, "0")}`;
    },

    // Additional entity types for better field recognition
    GENDER: () => faker.person.sex(),
    EXPERIENCE: () =>
      faker.helpers.arrayElement([
        "beginner",
        "intermediate",
        "advanced",
        "expert",
      ]),
    PRIORITY: () =>
      faker.helpers.arrayElement(["low", "medium", "high", "urgent"]),
    INTEREST: () =>
      faker.helpers.arrayElement([
        "technology",
        "sports",
        "music",
        "travel",
        "reading",
      ]),
    INTERESTS: () =>
      faker.helpers.arrayElement([
        "technology",
        "sports",
        "music",
        "travel",
        "reading",
      ]),
    PREFERENCE: () => faker.datatype.boolean(),
    PREFERENCES: () => faker.datatype.boolean(),
    NEWSLETTER: () => faker.datatype.boolean(),
    TERMS: () => faker.datatype.boolean(),
    PRIVACY: () => faker.datatype.boolean(),
    COUNTRY: () => faker.location.countryCode(),
    SELECTION: () => faker.commerce.productName(),
    OPTION: () => faker.commerce.productName(),
    CHOICE: () => faker.commerce.productName(),
  };

  // Skip fast path - let everything go through AI for better accuracy
  console.log(`🤖 Skipping fast path, sending to AI: "${textToAnalyze}"`);

  // AI path - use NER results to understand field context
  if (entities && entities.length > 0) {
    console.log(`🤖 Processing AI entities for "${textToAnalyze}":`, entities);

    // Sort entities by confidence if available
    const sortedEntities = entities.sort(
      (a, b) => (b.score || 0) - (a.score || 0)
    );

    // If we have an expected analysis/type, filter to compatible entities first
    const candidateEntities = analysis
      ? sortedEntities.filter((e) => isEntityCompatible(analysis, e.entity))
      : sortedEntities;

    for (const entity of candidateEntities) {
      console.log(
        `🤖 Checking entity: ${entity.entity} (score: ${entity.score})`
      );

      // Try exact match first
      if (entityMap[entity.entity]) {
        console.log(`✅ Found exact match for: ${entity.entity}`);
        const generator = entityMap[entity.entity];
        let value = generator();
        console.log(`🎲 Generated value: "${value}" (type: ${typeof value})`);

        // Apply constraints
        console.log(
          `🔍 Input maxLength: ${input.maxLength}, value length: ${value.length}`
        );
        if (
          input.maxLength &&
          input.maxLength > 0 &&
          value.length > input.maxLength
        ) {
          console.log(
            `✂️ Trimming value from ${value.length} to ${input.maxLength} chars`
          );
          value = value.substring(0, input.maxLength);
        }

        console.log(`📝 Setting input.value to: "${value}"`);
        console.log(
          `🔍 Input properties: readonly=${input.readOnly}, disabled=${input.disabled}, type=${input.type}`
        );

        // Handle all input types with a comprehensive function
        handleInputType(input, value);

        // Try triggering input events to make sure the change is registered
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));

        console.log(`✅ Input value after setting: "${input.value}"`);
        return true;
      }

      // Try uppercase match
      if (entityMap[entity.entity.toUpperCase()]) {
        console.log(
          `✅ Found uppercase match for: ${entity.entity.toUpperCase()}`
        );
        const generator = entityMap[entity.entity.toUpperCase()];
        let value = generator();

        // Apply constraints
        if (
          input.maxLength &&
          input.maxLength > 0 &&
          value.length > input.maxLength
        ) {
          value = value.substring(0, input.maxLength);
        }

        handleInputType(input, value);

        // Try triggering input events to make sure the change is registered
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));

        return true;
      }

      console.log(`❌ No mapping found for entity: ${entity.entity}`);
    }

    console.log(`❌ No usable entities found for "${textToAnalyze}"`);
  }

  // Smart Fallback: If AI didn't return entities or couldn't match them,
  // try pattern-based field recognition
  console.log(
    `🔄 Smart Fallback: Analyzing "${textToAnalyze}" with pattern matching`
  );

  const fieldType = analysis || detectFieldType(textToAnalyze, input, lang);
  if (fieldType) {
    console.log(`🎯 Pattern detected: ${fieldType}`);

    let value;
    switch (fieldType) {
      case "PERSON_NAME":
      case "FULL_NAME":
      case "NAME":
        value = generatePersonName(userData);
        break;
      case "FIRST_NAME":
        ensureUserData(userData);
        value = userData.firstName;
        break;
      case "LAST_NAME":
        ensureUserData(userData);
        value = userData.lastName;
        break;
      case "EMAIL":
        value = generateEmail(userData);
        break;
      case "COMPANY":
      case "ORGANIZATION":
        value = userData.company || faker.company.name();
        break;
      case "PHONE":
        value = generatePhoneNumber(input);
        break;
      case "CITY":
      case "LOCATION":
        value = userData.city || faker.location.city();
        break;
      case "ADDRESS":
        value = userData.address || faker.location.streetAddress();
        break;
      case "COUNTRY":
        value = userData.country || faker.location.country();
        break;
      case "ZIP_CODE":
        value = userData.zipCode || faker.location.zipCode();
        break;
      case "JOB_TITLE":
        value = userData.jobTitle || faker.person.jobTitle();
        break;
      case "SUPERVISOR":
        value = generatePersonName({}); // Different person for supervisor
        break;
      case "PASSWORD":
        value = faker.internet.password();
        break;
      case "URL":
        value = faker.internet.url();
        break;
      case "DATE":
        value = faker.date.future().toISOString().split("T")[0];
        break;
      case "NUMBER":
        value = faker.number.int({ min: 1, max: 100 }).toString();
        break;
      case "TEXT":
      default:
        // For text fields, generate appropriate content based on context
        const lowerContext = textToAnalyze.toLowerCase();
        if (
          lowerContext.includes("comment") ||
          lowerContext.includes("description") ||
          lowerContext.includes("message") ||
          lowerContext.includes("note") ||
          lowerContext.includes("detail")
        ) {
          value = "This is a sample comment for testing purposes.";
        } else if (
          lowerContext.includes("supervisor") ||
          lowerContext.includes("manager") ||
          lowerContext.includes("boss")
        ) {
          value = generatePersonName({}); // Different person for supervisor
        } else if (
          lowerContext.includes("work") ||
          lowerContext.includes("company") ||
          lowerContext.includes("employ")
        ) {
          value = faker.company.name();
        } else if (
          lowerContext.includes("city") ||
          lowerContext.includes("from") ||
          lowerContext.includes("location")
        ) {
          value = faker.location.city();
        } else if (lowerContext.includes("name")) {
          value = generatePersonName(userData);
        } else {
          // Generic fallback - use a person name as it's most commonly needed
          value = generatePersonName(userData);
        }
        break;
    }

    console.log(`🎲 Pattern-generated value: "${value}"`);
    handleInputType(input, value);

    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));

    console.log(`✅ Pattern filled: ${textToAnalyze} -> ${input.value}`);
    return true;
  }

  // Final fallback for radio buttons and checkboxes
  if (input.type === "radio" || input.type === "checkbox") {
    console.log(
      `🔄 Final Fallback: Handling ${input.type} directly without AI entities`
    );
    handleInputType(input, null);

    const displayValue =
      input.type === "radio"
        ? (document.querySelector(
            `input[type="radio"][name="${input.name}"]:checked`
          )?.value || "none") + " (selected)"
        : `${input.checked ? "checked" : "unchecked"}`;

    console.log(`✅ Fallback filled: ${textToAnalyze} -> ${displayValue}`);
    return true;
  }

  return false;
}

function normalizeAutocompleteToken(autocomplete) {
  if (!autocomplete) return null;
  const tokens = autocomplete
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((token) => token && token !== "on" && token !== "off")
    .filter((token) => !token.startsWith("section-"))
    .filter((token) => token !== "shipping" && token !== "billing");

  if (!tokens.length) return null;
  return tokens[tokens.length - 1].replace(/-/g, "_");
}

function resolveFromAutocomplete(input) {
  const token = normalizeAutocompleteToken(input.autocomplete);
  if (!token) return null;
  return AUTOCOMPLETE_FIELD_MAP[token] || null;
}

function getAccessibleLabel(input) {
  const ariaLabel = input.getAttribute("aria-label") || "";
  const labelledBy = input.getAttribute("aria-labelledby");
  let labelledByText = "";
  if (labelledBy) {
    labelledByText = labelledBy
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.innerText || "")
      .join(" ");
  }
  return `${ariaLabel} ${labelledByText}`.trim();
}

function includesKeyword(allText, keyword) {
  return allText.includes(keyword.toLowerCase());
}

// Smart field type detection based on semantic priorities.
function detectFieldType(text, input, lang = "en") {
  const resolvedFromAutocomplete = resolveFromAutocomplete(input);
  if (resolvedFromAutocomplete) return resolvedFromAutocomplete;

  const inputType = input.type?.toLowerCase() || "";
  if (inputType === "email") return "EMAIL";
  if (inputType === "password") return "PASSWORD";
  if (inputType === "tel") return "PHONE";
  if (inputType === "url") return "URL";
  if (inputType === "date") return "DATE";
  if (inputType === "number") return "NUMBER";

  const labelText = findLabelForInput(input)?.innerText || "";
  const accessibleText = getAccessibleLabel(input);
  const allText = [
    text || "",
    labelText,
    accessibleText,
    input.placeholder || "",
    input.name || "",
    input.id || "",
  ]
    .join(" ")
    .toLowerCase();

  const normalizedLang = normalizeLang(lang);
  const mergedKeywords = {
    ...KEYWORDS.en,
    ...(KEYWORDS[normalizedLang] || {}),
  };

  const typePriority = [
    "EMAIL",
    "PASSWORD",
    "PHONE",
    "URL",
    "DATE",
    "NUMBER",
    "FIRST_NAME",
    "LAST_NAME",
    "FULL_NAME",
    "COMPANY",
    "JOB_TITLE",
    "SUPERVISOR",
    "ADDRESS",
    "CITY",
    "COUNTRY",
    "ZIP_CODE",
    "TEXT",
  ];

  for (const type of typePriority) {
    const keywords = mergedKeywords[type] || [];
    if (keywords.some((keyword) => includesKeyword(allText, keyword))) {
      return type;
    }
  }

  if (input.tagName?.toLowerCase() === "textarea") {
    return "TEXT";
  }

  return null;
}

// Helper function to ensure user data is initialized
function ensureUserData(userData) {
  if (!userData.firstName || !userData.lastName) {
    userData.firstName = faker.person.firstName();
    userData.lastName = faker.person.lastName();
    userData.fullName = `${userData.firstName} ${userData.lastName}`;
    console.log(
      `👤 Generated new user: ${userData.firstName} ${userData.lastName}`
    );
  }
}

// Helper function to generate consistent person names
function generatePersonName(userData) {
  ensureUserData(userData);
  console.log(`👤 Returning full name: "${userData.fullName}"`);
  return userData.fullName;
}

// Helper function to generate consistent emails
function generateEmail(userData) {
  ensureUserData(userData);
  if (userData.email) {
    return userData.email;
  }

  // Generate email based on user's name (lowercase, no spaces)
  const emailName = `${userData.firstName}.${userData.lastName}`.toLowerCase();
  
  // Use realistic email providers instead of random domains
  const commonEmailProviders = [
    'gmail.com',
    'yahoo.com',
    'hotmail.com',
    'outlook.com',
    'icloud.com',
    'aol.com',
    'protonmail.com',
    'live.com',
    'msn.com',
    'yandex.com'
  ];
  
  // Pick a random provider from the list
  const domain = faker.helpers.arrayElement(commonEmailProviders);
  const email = `${emailName}@${domain}`;
  userData.email = email;
  
  console.log(
    `📧 Generated realistic email: "${email}" for user: ${userData.firstName} ${userData.lastName}`
  );
  return email;
}

// Helper to generate phone numbers respecting existing formatting patterns
function generatePhoneNumber(input) {
  const placeholder = (input.placeholder || "").trim();
  const nameId = `${input.name || ""} ${input.id || ""}`.toLowerCase();
  const label = findLabelForInput(input)?.innerText?.trim() || "";
  const context = `${label} ${placeholder} ${nameId}`.toLowerCase();

  // Hints for extension and digit count
  const pattern = placeholder || label;
  const hintedDigits = (pattern.match(/\d/g) || []).length;
  const hasExplicitExtDigits = /(?:x|ext\.?)[^\d]*(\d{1,5})/i.exec(pattern);
  const wantsExtension = /\b(ext|x|extension)\b/.test(context) || !!hasExplicitExtDigits;

  // Compute total digits: prefer digits seen in the pattern; else respect input.maxLength; else default to 10
  let totalDigits = hintedDigits >= 7 ? hintedDigits : 0;
  if (!totalDigits && typeof input.maxLength === "number" && input.maxLength > 0) {
    totalDigits = input.maxLength;
  }
  if (!totalDigits) totalDigits = 10;

  // If extension is hinted but pattern didn't include ext digits, add 3-5 extra digits
  if (wantsExtension && (!hasExplicitExtDigits || !hasExplicitExtDigits[1])) {
    totalDigits += faker.number.int({ min: 3, max: 5 });
  }

  // Produce a digits-only string of the desired length
  let digits = "";
  for (let i = 0; i < totalDigits; i++) {
    digits += faker.number.int({ min: 0, max: 9 }).toString();
  }
  return digits;
}

// Comprehensive input type handler
function handleInputType(input, value) {
  const inputType = input.type?.toLowerCase();
  const tagName = input.tagName?.toLowerCase();

  if (tagName === "select") {
    const options = Array.from(input.options).filter(
      (opt) => opt.value && opt.value !== ""
    );
    if (options.length > 0) {
      const randomOption = options[Math.floor(Math.random() * options.length)];
      input.value = randomOption.value;
      console.log(
        `🎯 Selected dropdown option: "${randomOption.text}" (value: "${randomOption.value}")`
      );
    } else {
      input.value = value;
    }
  } else if (inputType === "radio") {
    const radioGroup = document.querySelectorAll(
      `input[type="radio"][name="${input.name}"]`
    );
    if (radioGroup.length > 0) {
      // First, uncheck all radios in the group
      radioGroup.forEach((radio) => (radio.checked = false));
      // Then select a random one
      const randomRadio =
        radioGroup[Math.floor(Math.random() * radioGroup.length)];
      randomRadio.checked = true;
      console.log(
        `🔘 Selected radio option: "${randomRadio.value}" from group "${input.name}"`
      );

      // Trigger change events on the selected radio
      randomRadio.dispatchEvent(new Event("change", { bubbles: true }));
      randomRadio.dispatchEvent(new Event("input", { bubbles: true }));
    }
  } else if (inputType === "checkbox") {
    // 70% chance to check each checkbox
    input.checked = Math.random() > 0.3;
    console.log(
      `☑️ Checkbox ${input.checked ? "checked" : "unchecked"}: "${
        input.value || input.name || "unnamed"
      }"`
    );

    // Trigger change events
    input.dispatchEvent(new Event("change", { bubbles: true }));
    input.dispatchEvent(new Event("input", { bubbles: true }));
  } else if (inputType === "range") {
    const min = parseInt(input.min) || 0;
    const max = parseInt(input.max) || 100;
    input.value = faker.number.int({ min, max }).toString();
    console.log(`🎚️ Range set to: ${input.value} (${min}-${max})`);
  } else if (inputType === "color") {
    input.value = faker.internet.color();
    console.log(`🎨 Color set to: ${input.value}`);
  } else if (inputType === "time") {
    const time = faker.date
      .recent()
      .toTimeString()
      .split(" ")[0]
      .substring(0, 5);
    input.value = time;
    console.log(`⏰ Time set to: ${input.value}`);
  } else if (inputType === "datetime-local") {
    const datetime = faker.date.recent().toISOString().slice(0, 16);
    input.value = datetime;
    console.log(`📅⏰ DateTime set to: ${input.value}`);
  } else if (inputType === "month") {
    const month = faker.date.recent().toISOString().slice(0, 7);
    input.value = month;
    console.log(`📅 Month set to: ${input.value}`);
  } else if (inputType === "week") {
    const date = faker.date.recent();
    const year = date.getFullYear();
    const week = Math.ceil(
      (date.getTime() - new Date(year, 0, 1).getTime()) /
        (7 * 24 * 60 * 60 * 1000)
    );
    const weekStr = `${year}-W${week.toString().padStart(2, "0")}`;
    input.value = weekStr;
    console.log(`📅 Week set to: ${input.value}`);
  } else if (inputType === "search") {
    input.value = faker.commerce.productName();
    console.log(`🔍 Search set to: ${input.value}`);
  } else if (inputType === "url") {
    input.value = faker.internet.url();
    console.log(`🔗 URL set to: ${input.value}`);
  } else if (inputType === "number") {
    const min = parseInt(input.min) || 1;
    const max = parseInt(input.max) || 100;
    input.value = faker.number.int({ min, max }).toString();
    console.log(`🔢 Number set to: ${input.value} (${min}-${max})`);
  } else if (tagName === "output") {
    input.value = faker.number.int({ min: 1, max: 1000 }).toString();
    console.log(`📊 Output set to: ${input.value}`);
  } else if (tagName === "textarea") {
    input.value =
      "This is a sample text for testing purposes. It provides meaningful content instead of random Latin text.";
    console.log(`📝 Textarea set to: ${input.value.substring(0, 50)}...`);
  } else {
    // Default handling for text, email, password, tel, etc.
    input.value = value;
    console.log(`📄 Default input set to: ${input.value}`);
  }
}
