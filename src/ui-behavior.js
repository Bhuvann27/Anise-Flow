import { supabase } from './lib/supabase';

const INSTAGRAM_LABEL = 'Instagram Check Later';
const INSTAGRAM_ROUTE = 'Check Later';
const DETAIL_TYPES = ['YouTube','Google Maps','Phone number','WhatsApp','Email','Website','Other link'];

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
    if (button.closest('.sidebar') || button.classList.contains('mobile-fab') || button.closest('.mobile-quick-actions')) return;
    button.remove();
  });
}

function simplifyMobileQuickAction() {
  const menu = document.querySelector('.mobile-quick-menu');
  if (menu) {
    menu.style.display = 'none';
    menu.style.pointerEvents = 'none';
  }
  const fab = document.querySelector('.mobile-fab');
  if (fab) {
    fab.style.transform = 'none';
    fab.style.rotate = 'none';
    fab.setAttribute('aria-label', 'Open Check Later');
    fab.dataset.checkLaterReady = 'true';
  }
}

function isDashboardPage() {
  const page = document.querySelector('.breadcrumbs strong')?.textContent?.trim();
  return !page || page === 'Dashboard';
}

function syncFloatingCheckLaterVisibility() {
  const container = document.querySelector('.mobile-quick-actions');
  if (!container) return;
  const show = isDashboardPage();
  container.style.display = show ? 'block' : 'none';
  container.style.pointerEvents = show ? 'auto' : 'none';
}

function navigateToCheckLater() {
  const current = history.state;
  const next = {
    ...(current?.aniseFlowNavigation ? current : {}),
    aniseFlowPage: INSTAGRAM_ROUTE,
    page: INSTAGRAM_ROUTE,
    peopleFilter: { status: 'all', priority: 'all' },
    checkLaterSource: null,
  };
  history.pushState(next, '', location.href);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function openCheckLaterFromFab(event) {
  const target = event.target?.closest?.('.mobile-fab, .mobile-quick-actions button');
  if (!target) return;
  if (!isDashboardPage()) return;
  const text = target.textContent?.trim() || '';
  if (!target.classList.contains('mobile-fab') && text !== 'Check Later') return;
  event.preventDefault();
  event.stopPropagation();
  navigateToCheckLater();
}

function installMobileFabNavigation() {
  document.addEventListener('click', openCheckLaterFromFab, true);
}

function transferPriority(score) {
  const value = Number(score || 5);
  if (value >= 8) return 'high';
  if (value <= 3) return 'low';
  return 'medium';
}

function cleanInstagramHandle(value = '') {
  return String(value).trim().replace(/^@+/, '');
}

function mergeLinks(existing = [], incoming = []) {
  const combined = [...(Array.isArray(existing) ? existing : []), ...(Array.isArray(incoming) ? incoming : [])];
  return combined.filter((item, index, array) => item && array.findIndex(other => JSON.stringify(other) === JSON.stringify(item)) === index);
}

async function transferCheckLaterCard(card, button) {
  if (button.dataset.busy === 'true') return;
  button.dataset.busy = 'true';
  button.textContent = 'Transferring…';
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Please sign in again before transferring this person.');
    const name = card.querySelector('.instagram-card-main h3')?.textContent?.trim();
    const handle = cleanInstagramHandle(card.querySelector('.check-later-handle')?.textContent || '');
    if (!name) throw new Error('This saved person has no name.');

    let lookup = supabase.from('instagram_research').select('*').eq('owner_id', user.id).limit(1);
    lookup = handle ? lookup.eq('handle', handle) : lookup.eq('name', name);
    const { data: savedRows, error: savedError } = await lookup;
    if (savedError) throw savedError;
    const saved = savedRows?.[0];
    if (!saved) throw new Error('Could not find the saved Check Later record. Refresh and try again.');

    const links = Array.isArray(saved.additional_links) ? saved.additional_links : [];
    const instagram = saved.source_category === 'Instagram' && saved.handle ? `@${cleanInstagramHandle(saved.handle)}` : null;
    const speciality = saved.account_type && saved.account_type !== 'Doctor to add later' && saved.account_type !== 'Other' ? saved.account_type : null;
    const incomingNotes = [
      saved.notes,
      saved.account_type && saved.account_type !== 'Doctor to add later' ? `Check Later category: ${saved.account_type}` : null,
      saved.custom_category ? `Check Later category detail: ${saved.custom_category}` : null,
    ].filter(Boolean).join('\n');

    const { data: existingRows, error: existingError } = await supabase.from('prospects').select('*').eq('owner_id', user.id).ilike('name', name).limit(1);
    if (existingError) throw existingError;

    let prospectId;
    if (existingRows?.[0]) {
      const existing = existingRows[0];
      const mergedNotes = [existing.notes, incomingNotes].filter(Boolean).join(existing.notes && incomingNotes ? '\n\n' : '');
      const { error } = await supabase.from('prospects').update({
        phone: saved.phone || existing.phone || null,
        whatsapp: saved.whatsapp || existing.whatsapp || null,
        email: saved.email || existing.email || null,
        instagram: instagram || existing.instagram || null,
        youtube_id: saved.youtube_id || existing.youtube_id || null,
        additional_links: mergeLinks(existing.additional_links, links),
        source: saved.source_category || existing.source || null,
        speciality: speciality || existing.speciality || null,
        notes: mergedNotes || null,
        updated_at: new Date().toISOString(),
      }).eq('id', existing.id).eq('owner_id', user.id);
      if (error) throw error;
      prospectId = existing.id;
    } else {
      const { data: created, error } = await supabase.from('prospects').insert({
        owner_id: user.id,
        name,
        speciality,
        phone: saved.phone || null,
        whatsapp: saved.whatsapp || null,
        instagram,
        email: saved.email || null,
        source: saved.source_category || 'Check Later',
        status: 'new',
        priority: transferPriority(saved.potential_score),
        notes: incomingNotes || null,
        youtube_id: saved.youtube_id || null,
        additional_links: links,
      }).select('id').single();
      if (error) throw error;
      prospectId = created?.id;
    }

    const { error: deleteError } = await supabase.from('instagram_research').delete().eq('id', saved.id).eq('owner_id', user.id);
    if (deleteError) throw deleteError;

    button.textContent = 'Transferred';
    button.disabled = true;
    button.classList.add('transferred');
    window.setTimeout(() => {
      history.pushState({ aniseFlowPage: 'People', page: 'People', peopleFilter: { status: 'all', priority: 'all' }, transferredProspectId: prospectId }, '', location.href);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, 250);
  } catch (error) {
    console.error('ANISE Flow Check Later transfer failed:', error);
    button.dataset.busy = 'false';
    button.textContent = 'Transfer to Prospect';
    window.alert(error?.message || 'Could not transfer this person.');
  }
}

function ensureCheckLaterTransferButtons() {
  document.querySelectorAll('.check-later-card').forEach((card) => {
    if (card.querySelector('.check-later-transfer-btn')) return;
    const actions = card.querySelector('.instagram-card-actions');
    if (!actions) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'secondary-btn check-later-transfer-btn';
    button.textContent = 'Transfer to Prospect';
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      transferCheckLaterCard(card, button);
    });
    actions.insertBefore(button, actions.firstChild);
  });
}

function createDetailSection(form) {
  if (!form || form.querySelector('.prospect-detail-section')) return;
  const notesField = [...form.querySelectorAll('.full-field')].find(el => /Notes/i.test(el.textContent || ''));
  const section = document.createElement('div');
  section.className = 'prospect-detail-section check-later-detail-section';
  section.innerHTML = `<div class="check-later-detail-head"><div><strong>Add other contact details</strong><span>Add only what you find. No extra name or label is needed.</span></div><button type="button" class="secondary-btn prospect-add-detail-btn"><span aria-hidden="true">＋</span> Add other contact details</button></div><div class="prospect-detail-rows"></div>`;
  (notesField || form.querySelector('.modal-actions'))?.before(section);
  const rows = section.querySelector('.prospect-detail-rows');
  const addButton = section.querySelector('.prospect-add-detail-btn');
  const addRow = () => {
    const row = document.createElement('div');
    row.className = 'check-later-detail-row prospect-detail-row';
    row.innerHTML = `<select aria-label="Contact detail type">${DETAIL_TYPES.map(type => `<option>${type}</option>`).join('')}</select><input aria-label="Contact detail value" placeholder="Enter the detail"/><button type="button" class="icon-btn prospect-remove-detail" aria-label="Remove contact detail">×</button>`;
    const select = row.querySelector('select');
    const input = row.querySelector('input');
    const updatePlaceholder = () => {
      const type = select.value;
      input.placeholder = type === 'Phone number' ? 'Enter phone number' : type === 'WhatsApp' ? 'Enter WhatsApp number' : type === 'Email' ? 'Enter email' : type === 'YouTube' ? 'YouTube ID or channel URL' : type === 'Google Maps' ? 'Google Maps link' : type === 'Website' ? 'Website URL' : 'Paste link or detail';
    };
    select.addEventListener('change', updatePlaceholder);
    row.querySelector('.prospect-remove-detail').addEventListener('click', () => { row.remove(); syncDetailButton(); });
    rows.appendChild(row);
    updatePlaceholder();
    input.focus();
    syncDetailButton();
  };
  const syncDetailButton = () => { addButton.textContent = rows.children.length ? '＋ Add another contact detail' : '＋ Add other contact details'; };
  addButton.addEventListener('click', addRow);
  section._getDetails = () => [...rows.querySelectorAll('.prospect-detail-row')].map(row => ({ type: row.querySelector('select')?.value || '', value: row.querySelector('input')?.value.trim() || '' })).filter(item => item.value);
  syncDetailButton();
}

function findField(form, labelText) {
  const label = [...form.querySelectorAll('label')].find(node => (node.firstChild?.textContent || node.textContent || '').trim().startsWith(labelText));
  return label?.querySelector('input,select,textarea') || null;
}

async function saveEnhancedProspect(form, detailSection, submitButton) {
  const value = name => findField(form, name)?.value?.trim() || '';
  const name = value('Doctor name');
  if (!name) throw new Error('Doctor name is required.');
  const email = value('Email');
  const phone = value('Phone');
  const whatsapp = value('WhatsApp');
  const instagram = value('Instagram');
  const details = detailSection?._getDetails?.() || [];
  const youtube = details.find(d => d.type === 'YouTube')?.value || '';
  const detailPhone = details.find(d => d.type === 'Phone number')?.value || '';
  const detailWhatsapp = details.find(d => d.type === 'WhatsApp')?.value || '';
  const detailEmail = details.find(d => d.type === 'Email')?.value || '';
  const links = details.filter(d => !['YouTube','Phone number','WhatsApp','Email'].includes(d.type)).map(d => ({type:d.type,value:d.value}));
  const finalPhone = phone || detailPhone || null;
  const finalWhatsapp = whatsapp || detailWhatsapp || null;
  const finalEmail = email || detailEmail || null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Please sign in again before saving.');
  const normalized = name.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const { data: existing, error: existingError } = await supabase.from('prospects').select('id,name').eq('owner_id', user.id).ilike('name', name).limit(1);
  if (existingError) throw existingError;
  if (existing?.[0] || normalized && existing?.some(p => String(p.name||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim() === normalized)) throw new Error(`Already exists: ${existing?.[0]?.name || name}`);
  submitButton.disabled = true;
  submitButton.textContent = 'Saving...';
  const payload = {
    owner_id: user.id,
    name,
    speciality: value('Speciality') || null,
    phone: finalPhone,
    whatsapp: finalWhatsapp,
    instagram: instagram || null,
    email: finalEmail,
    location: value('Location') || null,
    source: value('Source') || 'College PG',
    notes: value('Notes') || null,
    priority: value('Priority') || 'medium',
    status: 'new',
    youtube_id: youtube || null,
    additional_links: links,
  };
  const { error } = await supabase.from('prospects').insert(payload);
  if (error) throw error;
  submitButton.textContent = 'Created';
  window.setTimeout(() => window.location.reload(), 250);
}

function enhanceAddDoctorModal() {
  const forms = document.querySelectorAll('.modal form');
  forms.forEach(form => {
    const heading = form.querySelector('.modal-head h2')?.textContent?.trim();
    if (heading === 'Add doctor') createDetailSection(form);
  });
}

function interceptEnhancedProspectSubmit(event) {
  const form = event.target;
  if (!(form instanceof HTMLFormElement) || !form.querySelector('.prospect-detail-section')) return;
  const section = form.querySelector('.prospect-detail-section');
  const details = section?._getDetails?.() || [];
  if (!details.length) return;
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  const submitButton = form.querySelector('button[type="submit"], .add-btn:not(.secondary-btn)');
  saveEnhancedProspect(form, section, submitButton).catch(error => {
    console.error('ANISE Flow enhanced prospect save failed:', error);
    if (submitButton) { submitButton.disabled = false; submitButton.textContent = 'Create prospect'; }
    window.alert(error?.message || 'Could not create this prospect.');
  });
}

function syncUi() {
  replaceInstagramLabels();
  hideInstagramWebsiteShortcut();
  removeLegacyCheckLaterFloatingButton();
  simplifyMobileQuickAction();
  syncFloatingCheckLaterVisibility();
  ensureCheckLaterTransferButtons();
  enhanceAddDoctorModal();
}

if (typeof document !== 'undefined') {
  const observer = new MutationObserver(syncUi);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('submit', interceptEnhancedProspectSubmit, true);
  window.addEventListener('load', syncUi);
  installMobileFabNavigation();
}
