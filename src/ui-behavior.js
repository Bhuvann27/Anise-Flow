import { supabase } from './lib/supabase';

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
  }
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
      history.pushState({ aniseFlowPage: 'People', peopleFilter: { status: 'all', priority: 'all' }, transferredProspectId: prospectId }, '', location.href);
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

function syncUi() {
  replaceInstagramLabels();
  hideInstagramWebsiteShortcut();
  removeLegacyCheckLaterFloatingButton();
  simplifyMobileQuickAction();
  ensureCheckLaterTransferButtons();
}

if (typeof document !== 'undefined') {
  const observer = new MutationObserver(syncUi);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('load', syncUi);
  installMobileFabNavigation();
}
