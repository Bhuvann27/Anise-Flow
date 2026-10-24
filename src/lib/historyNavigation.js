import { useCallback, useEffect, useRef } from 'react';

export const APP_NAVIGATION_VERSION = 2;

export function rootNavigationState() {
  return {
    aniseFlowNavigation: APP_NAVIGATION_VERSION,
    aniseFlowKind: 'root',
    aniseFlowPage: 'Dashboard',
    page: 'Dashboard',
    peopleFilter: { status: 'all', priority: 'all' },
  };
}

export function pageNavigationState(page, peopleFilter = { status: 'all', priority: 'all' }) {
  return {
    aniseFlowNavigation: APP_NAVIGATION_VERSION,
    aniseFlowKind: 'page',
    aniseFlowPage: page,
    page,
    peopleFilter,
  };
}

export function useHistoryOverlay(isOpen, overlayId, onClose) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return undefined;

    const current = window.history.state;
    if (!(current?.aniseFlowNavigation === APP_NAVIGATION_VERSION
      && current.aniseFlowKind === 'overlay'
      && current.overlayId === overlayId)) {
      const page = current?.aniseFlowNavigation === APP_NAVIGATION_VERSION
        ? current.page || current.aniseFlowPage || 'Dashboard'
        : 'Dashboard';
      const peopleFilter = current?.peopleFilter || { status: 'all', priority: 'all' };
      window.history.pushState({
        ...pageNavigationState(page, peopleFilter),
        aniseFlowKind: 'overlay',
        overlayId,
      }, '', window.location.href);
    }

    const handlePopState = () => {
      const state = window.history.state;
      const stillOpenInHistory = state?.aniseFlowNavigation === APP_NAVIGATION_VERSION
        && state.aniseFlowKind === 'overlay'
        && state.overlayId === overlayId;
      if (!stillOpenInHistory) onCloseRef.current();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isOpen, overlayId]);

  return useCallback(() => {
    const state = window.history.state;
    if (state?.aniseFlowNavigation === APP_NAVIGATION_VERSION
      && state.aniseFlowKind === 'overlay'
      && state.overlayId === overlayId) {
      window.history.back();
    }
    onCloseRef.current();
  }, [overlayId]);
}
