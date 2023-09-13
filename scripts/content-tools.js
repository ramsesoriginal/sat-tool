/**
 * Update the page titles.
 * @param {string} newTitle - The new title for the page.
 */
function updatePageTitles(newTitle) {
  document.title = newTitle;
  const currentPageTitle = document.querySelector('.current-page-title');
  if (currentPageTitle) {
    currentPageTitle.textContent = newTitle;
  }
}

/**
 * Update navigation links with the "current" class based on the current page.
 */
function updateNavigationLinks() {
  const currentPage = window.location.pathname.split('/').pop();
  const navigationLinks = document.querySelectorAll('a');

  navigationLinks.forEach(link => {
    const linkPage = link.getAttribute('href').split('/').pop();
    if (linkPage === currentPage) {
      link.classList.add('current');
    } else {
      link.classList.remove('current');
    }
  });
}

// Call the functions when the DOM is ready
document.addEventListener('page-loaded', () => {
  updateNavigationLinks();
});


export { updatePageTitles, updateNavigationLinks };
