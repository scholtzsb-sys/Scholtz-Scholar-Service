import { getToken } from './tokenStorage';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}/api${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  // Auth
  ownersExist: () => request('/auth/owners-exist', { auth: false }),
  firstOwner: (payload) => request('/auth/first-owner', { method: 'POST', body: payload, auth: false }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload, auth: false }),
  me: () => request('/auth/me'),
  switchRole: (role) => request('/auth/switch-role', { method: 'POST', body: { role } }),

  // Schools
  listSchools: () => request('/schools'),
  addSchool: (name) => request('/schools', { method: 'POST', body: { name } }),

  // Guardians
  listGuardians: () => request('/guardians'),
  getGuardian: (id) => request(`/guardians/${id}`),

  // Owners
  listOwners: () => request('/owners'),
  addOwner: (payload) => request('/owners', { method: 'POST', body: payload }),

  // Drivers
  listDrivers: () => request('/drivers'),
  getDriver: (id) => request(`/drivers/${id}`),
  addDriver: (payload) => request('/drivers', { method: 'POST', body: payload }),
  updateDriver: (id, payload) => request(`/drivers/${id}`, { method: 'PATCH', body: payload }),
  deactivateDriver: (id) => request(`/drivers/${id}/deactivate`, { method: 'POST' }),
  reactivateDriver: (id) => request(`/drivers/${id}/reactivate`, { method: 'POST' }),
  deleteDriver: (id) => request(`/drivers/${id}`, { method: 'DELETE' }),

  // Scholars
  listScholars: () => request('/scholars'),
  getScholar: (id) => request(`/scholars/${id}`),
  addScholar: (payload) => request('/scholars', { method: 'POST', body: payload }),
  updateScholar: (id, payload) => request(`/scholars/${id}`, { method: 'PATCH', body: payload }),
  deactivateScholar: (id) => request(`/scholars/${id}/deactivate`, { method: 'POST' }),
  reactivateScholar: (id) => request(`/scholars/${id}/reactivate`, { method: 'POST' }),
  deleteScholar: (id) => request(`/scholars/${id}`, { method: 'DELETE' }),

  // Trip events
  listTripEvents: ({ today } = {}) => request(`/trip-events${today ? '?today=1' : ''}`),
  logTripEvent: (payload) => request('/trip-events', { method: 'POST', body: payload }),
  logBulkTripEvents: (scholarIds, eventType) => request('/trip-events/bulk', { method: 'POST', body: { scholarIds, eventType } }),

  // Invoices
  listFamilyInvoices: (billingGuardianId) => request(`/invoices/family/${billingGuardianId}`),
  getInvoice: (id) => request(`/invoices/${id}`),
  generateInvoice: (payload) => request('/invoices', { method: 'POST', body: payload }),
  recordPayment: (id, amount) => request(`/invoices/${id}/payments`, { method: 'POST', body: { amount } }),
  attachProof: (id, filename) => request(`/invoices/${id}/proof`, { method: 'POST', body: { filename } }),
};
