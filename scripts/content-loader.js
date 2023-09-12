let currentPage = null;

/**
 * Get the current page stored in the 'currentPage' variable.
 * @returns {string|null} The current page name, or null if not set.
 */
function getCurrentPage() {
  return currentPage;
}

/**
 * Load a new page by name.
 * @param {string} pageName - The name of the new page to load.
 */
function loadNewPage(pageName) {
  // Check if there is a current page to unload
  if (currentPage) {
    // Remove existing scripts and content
    document.querySelectorAll('.dynamic-script').forEach(script => {
      script.remove();
    });
    document.querySelector("#content").innerHTML = '';
  }

  // Fetch and insert content specific to the new page
  fetch(`content/${pageName}.html`)
    .then(response => response.text())
    .then(contentHTML => {
      // Insert the content HTML into the main section
      document.querySelector("#content").innerHTML = contentHTML;

      // Load the corresponding script dynamically
      const script = document.createElement('script');
      script.src = `scripts/${pageName}.js`;
      script.classList.add('dynamic-script');
      document.body.appendChild(script);

      // Update the page title
      script.onload = function () {
        // Raise a custom event indicating page loading is complete
        const event = new Event('page-loaded');
        document.dispatchEvent(event);
      };

      // Set the 'currentPage' variable to the new page name
      currentPage = pageName;

      // Set the pushState to the new page
      const newURL = `${pageName}.html`;
      history.pushState({ page: pageName }, null, newURL);
    })
    .catch(error => {
      console.error('Error fetching content:', error);
    });
}

/**
 * Load the initial page defined by the search parameter when DOM content is ready.
 */
function loadInitialPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const pageName = urlParams.get('page');
  if (pageName) {
    history.replaceState({}, document.title, `${pageName}.html`);
    loadNewPage(pageName);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadInitialPage();
});

/**
 * Handle navigation when the user clicks the "back" button.
 */
function handleBackNavigation(event) {
  if (event.state && event.state.page) {
    const pageName = event.state.page;
    loadNewPage(pageName);
  }
}

// Listen for the 'popstate' event to handle back button navigation
window.addEventListener('popstate', handleBackNavigation);


export { getCurrentPage, loadNewPage, loadInitialPage };
