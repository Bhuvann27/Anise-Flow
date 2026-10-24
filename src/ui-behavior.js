const INSTAGRAM_LABEL = 'Instagram Check Later';
const INSTAGRAM_ROUTE = 'Instagram Research';

function replaceInstagramLabels(root = document) {
  const candidates = root.querySelectorAll?.('.sidebar nav button span, .breadcrumbs strong, .instagram-research-head h2') || [];
  candidates.forEach((node) => {
    if (node.textContent?.trim() === 'Instagram Research') node.textContent = INSTAGRAM_LABEL;
  });
}

function closeQuickActions() {
  const fab = document.querySelector('.mobile-fab.active');
  if (fab) fab.click();
}

function ensureInstagramQuickAction() {
  const menu = document.querySelector('.mobile-quick-menu');
  if (!menu || menu.querySelector('.quick-instagram-action')) return;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'quick-instagram-action';
  button.innerHTML = '<span class="quick-instagram-icon">◎</span><span>Instagram Check Later</span>';
  button.addEventListener('click', (event) => {
    event.stopPropagation();
    history.pushState({ aniseFlowPage: INSTAGRAM_ROUTE, peopleFilter: { status: 'all', priority: 'all' } }, '', location.href);
    window.dispatchEvent(new PopStateEvent('popstate'));
    closeQuickActions();
  });
  menu.appendChild(button);
}

function installOutsideQuickActionClose() {
  document.addEventListener('pointerdown', (event) => {
    const actions = document.querySelector('.mobile-quick-actions');
    const fab = document.querySelector('.mobile-fab.active');
    if (!actions || !fab || actions.contains(event.target)) return;
    closeQuickActions();
  }, true);
}

function syncUi() {
  replaceInstagramLabels();
  ensureInstagramQuickAction();
}

if (typeof document !== 'undefined') {
  const observer = new MutationObserver(syncUi);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('load', syncUi);
  installOutsideQuickActionClose();
}
