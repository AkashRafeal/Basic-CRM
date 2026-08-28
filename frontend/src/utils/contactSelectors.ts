import { Contact } from '../types/contact';

/**
 * Shared selector functions for Contact & Stakeholder roles/badges and metrics.
 * Using these ensures cards, badges, and dashboard summary KPI counts are 100% in sync.
 */

export const isPrimaryLead = (contact: Contact | null | undefined): boolean => {
  if (!contact) return false;
  if (contact.isPrimaryContact === true) return true;
  if (contact.tags) {
    const tagsArr = contact.tags.split(',').map((t) => t.trim().toLowerCase());
    return tagsArr.includes('primary lead') || tagsArr.includes('primary contact') || tagsArr.includes('primary');
  }
  return false;
};

export const isDecisionMaker = (contact: Contact | null | undefined): boolean => {
  if (!contact) return false;
  if (contact.contactType === 'DECISION_MAKER') return true;
  if (contact.tags) {
    const tagsArr = contact.tags.split(',').map((t) => t.trim().toLowerCase());
    return tagsArr.includes('decision maker') || tagsArr.includes('decision-maker');
  }
  return false;
};

export const isChampion = (contact: Contact | null | undefined): boolean => {
  if (!contact) return false;
  if (contact.contactType === 'CHAMPION') return true;
  if (contact.tags) {
    const tagsArr = contact.tags.split(',').map((t) => t.trim().toLowerCase());
    return tagsArr.includes('champion');
  }
  return false;
};
