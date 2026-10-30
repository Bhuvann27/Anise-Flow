const INSTAGRAM_LABEL = 'Instagram Check Later';
const INSTAGRAM_ROUTE = 'Instagram Research';

function replaceInstagramLabels(root = document) {
  const candidates = root.querySelectorAll?.('.sidebar nav button span, .breadcrumbs strong, .instagram-research-head h2') || [];
  candidates.forEach((node) => {
    if (node.textContent?.trim() === 'Instagram Research') node.textContent = INSTAGRAM_LABEL;
  });
}

function hideInstagramWebsiteShortcut() {
  const page = document.querySelector('.breadcrumbs strong')?.textContent?.trim();
  const instagramPanel = document.querySelector('.instagram-research-panel');
  if (page !== INSTAGRAM_LABEL && !instagramPanel) return;

  document.querySelectorAll('button').forEach((button) => {
    if (button.textContent?.trim() !== 'Website Research') return;
    if (button.closest('.sidebar') || button.closest('.mobile-quick-menu')) return;
    if (instagramPanel && instagramPanel.contains(button)) button.style.display = 'none';
  });
}

function removeLegacyCheckLaterFloatingButton() {
  document.querySelectorAll('button').forEach((button) => {
    const text = button.textContent?.trim();
    if (text !== 'Check Later') return;
    if (button.closest('.sidebar') || button.closest('.mobile-quick-actions')) return;
    button.remove();
  });
}

function openCheckLaterFromFab(event) {
  const fab = event.target?.closest?.('.mobile-fab');
  if (!fab) return;
  event.preventDefault();
  event.stopPropagation();
  history.pushState({ aniseFlowPage: INSTAGRAM_ROUTE, peopleFilter: { status: 'all', priority: 'all' } }, '', location.href);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function installMobileFabNavigation() {
  document.addEventListener('click', openCheckLaterFromFab, true);
}

function syncUi() {
  replaceInstagramLabels();
  hideInstagramWebsiteShortcut();
  removeLegacyCheckLaterFloatingButton();
}

if (typeof document !== 'undefined') {
  const observer = new MutationObserver(syncUi);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('load', syncUi);
  installMobileFabNavigation();
}
