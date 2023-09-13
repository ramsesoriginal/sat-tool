// Import functions from i18n.js and cookie.js
import {
  isLanguageLoaded,
  getCurrentLanguage,
  setCurrentLanguage,
  translate
} from './i18n.js';

import { setCookie, getCookie } from './cookie.js';
import { getCurrentPage, loadNewPage } from './content-loader.js';
import { updatePageTitles, updateNavigationLinks } from './content-tools.js';

// Export the imported functions to make them available in other modules
export {
  /*isLanguageLoaded,
  getCurrentLanguage,
  setCurrentLanguage,
  translate,
  setCookie,
  getCookie,
  getCurrentPage,
  loadNewPage,*/
  updatePageTitles/*,
  updateNavigationLinks*/
};
