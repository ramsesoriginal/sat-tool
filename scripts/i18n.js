import { setCookie, getCookie } from './cookie.js';

// Private variable to store loaded translations
const translations = {};

/**
 * Check if language data has already been loaded.
 * @param {string} [language] - The language code to check.
 * @returns {boolean} True if language data is loaded (for the specified language or any language), false otherwise.
 */
function isLanguageLoaded(language) {
  if (!language) {
    // If no language parameter is provided, check if any language data has been loaded.
    return Object.keys(translations).length > 0;
  }
  return !!translations[language];
}


/**
 * Get the current language.
 * @returns {string} The current language code.
 */
function getCurrentLanguage() {
  const languageCookie = getCookie('userLanguage');

  const browserLanguage = navigator.language.split('-')[0];
  const languageToUse = languageCookie || browserLanguage || 'en';

  // Create a HEAD request to check if the translation file exists on the server.
  fetch(`translations/${languageToUse}.json`, { method: 'HEAD' })
    .then(response => {
      if (response.ok) {
        // Translation file exists, load it.
        if (languageToUse !== 'en') {
          loadLanguageData('en'); // Load English if not already loaded
        }
        loadLanguageData(languageToUse);
      } else {
        // Translation file doesn't exist, load English.
        setCurrentLanguage('en');
      }
    })
    .catch(error => {
      console.error(`Error checking translation file: ${error}`);
    });

  return languageToUse;
}

/**
 * Load language data for a given language code.
 * @param {string} language - The language code to load.
 * @param {boolean} [reload=false] - Whether to reload the language data even if it's already loaded.
 */
function loadLanguageData(language, reload = false) {
  if (!reload && isLanguageLoaded(language)) {
    // Language data is already loaded, no need to reload.
    return;
  }

  fetch(`translations/${language}.json`)
    .then(response => response.json())
    .then(data => {
      translations[language] = data;
      // Trigger a custom event indicating language data has been loaded.
      const event = new Event('language-loaded');
      document.dispatchEvent(event);
    })
    .catch(error => {
      console.error(`Error loading translation file: ${error}`);
    });
}


/**
 * Set the current language and store it in a cookie.
 * @param {string} language - The language code to set.
 */
function setCurrentLanguage(language) {
  setCookie('userLanguage', language);
  loadLanguageData(language);
}

/**
 * Retrieve the translation for a given key.
 * @param {string} key - The translation key.
 * @returns {string} The translated text or the key if not found.
 */
function translate(key) {
  const currentLanguage = getCurrentLanguage();

  if (translations[currentLanguage] && translations[currentLanguage][key]) {
    return translations[currentLanguage][key];
  } else if (translations['en'] && translations['en'][key]) {
    return translations['en'][key];
  }

  return key; // Return the key if translation not found
}

// Load language data as soon as the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const currentLanguage = getCurrentLanguage();
  if (!isLanguageLoaded(currentLanguage)) {
    loadLanguageData(currentLanguage);
  }
});

export {
  isLanguageLoaded,
  getCurrentLanguage,
  setCurrentLanguage,
  translate,
};
