const DETAIL_TYPES = ['YouTube','Google Maps','Phone number','WhatsApp','Email','Website','Other link'];

function getLabelInput(form, labelText) {
  return [...form.querySelectorAll('label')].find(label => {
    const text = (label.textContent || '').trim().toLowerCase();
    return text.startsWith(labelText.toLowerCase());
  })?.querySelector('input,select,textarea') || null;
}

function buildDetailSection(form) {
  if (!form || form.querySelector('.prospect-detail-section')) return;
  const heading = form.querySelector('.modal-head h2')?.textContent?.trim();
  if (heading !== 'Add doctor') return;

  const sourceInput = getLabelInput(form, 'Source');
  const notesLabel = [...form.querySelectorAll('label')].find(label => {
    const text = (label.textContent || '').trim().toLowerCase();
    return text.startsWith('notes');
  });
  const anchor = sourceInput?.closest('label') || notesLabel || form.querySelector('.modal-actions');
  if (!anchor?.parentNode) return;

  const section = document.createElement('section');
  section.className = 'prospect-detail-section check-later-detail-section';
  section.innerHTML = `
    <div class="check-later-detail-head">
      <div>
        <strong>Add other contact details</strong>
        <span>Add only what you find. No extra name or label is needed.</span>
      </div>
      <button type="button" class="secondary-btn prospect-add-detail-btn">＋ Add other contact details</button>
    </div>
    <div class="prospect-detail-rows"></div>
  `;

  anchor.parentNode.insertBefore(section, anchor);
  const rows = section.querySelector('.prospect-detail-rows');
  const addButton = section.querySelector('.prospect-add-detail-btn');

  const syncButton = () => {
    addButton.textContent = rows.children.length ? '＋ Add another contact detail' : '＋ Add other contact details';
  };

  const placeholderFor = type => ({
    'YouTube':'YouTube ID or channel URL',
    'Google Maps':'Google Maps link or location',
    'Phone number':'Enter phone number',
    'WhatsApp':'Enter WhatsApp number',
    'Email':'Enter email address',
    'Website':'Website URL',
    'Other link':'Paste link or detail',
  }[type] || 'Enter the detail');

  const addRow = () => {
    const row = document.createElement('div');
    row.className = 'check-later-detail-row prospect-detail-row';
    row.innerHTML = `<select aria-label="Contact detail type">${DETAIL_TYPES.map(type => `<option value="${type}">${type}</option>`).join('')}</select><input aria-label="Contact detail value" placeholder="${placeholderFor('YouTube')}"><button type="button" class="icon-btn prospect-remove-detail" aria-label="Remove contact detail">×</button>`;
    const select = row.querySelector('select');
    const input = row.querySelector('input');
    select.addEventListener('change', () => { input.placeholder = placeholderFor(select.value); });
    row.querySelector('.prospect-remove-detail').addEventListener('click', () => { row.remove(); syncButton(); });
    rows.appendChild(row);
    input.focus();
    syncButton();
  };

  addButton.addEventListener('click', addRow);
  section._getDetails = () => [...rows.querySelectorAll('.prospect-detail-row')]
    .map(row => ({
      type: row.querySelector('select')?.value || '',
      value: row.querySelector('input')?.value?.trim() || '',
    }))
    .filter(item => item.value);
  syncButton();
}

function enhanceProspectModal() {
  document.querySelectorAll('.modal form').forEach(buildDetailSection);
}

function reinforceCheckLaterNavigation() {
  document.addEventListener('click', event => {
    const fab = event.target?.closest?.('.mobile-fab');
    if (!fab) return;
    window.setTimeout(() => {
      const page = document.querySelector('.breadcrumbs strong')?.textContent?.trim();
      if (page === 'Dashboard') {
        const button = [...document.querySelectorAll('.sidebar nav button')]
          .find(item => item.textContent?.trim() === 'Check Later');
        if (button) button.click();
      }
    }, 0);
  }, false);
}

function observeUi() {
  enhanceProspectModal();
  reinforceCheckLaterNavigation();
  const observer = new MutationObserver(() => enhanceProspectModal());
  observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', observeUi, { once: true });
} else {
  observeUi();
}
