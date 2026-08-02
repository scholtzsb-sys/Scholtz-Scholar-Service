import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import { api } from '../lib/api';
import { getToken, setToken, clearToken } from '../lib/tokenStorage';
import { TRANSPORT_PLANS } from '../lib/mockData';

const AppStateContext = createContext(null);

const initialState = {
  session: null, // { role: 'owner' | 'driver', ownerId?, driverId?, phone, name }
  authLoading: true, // restoring a stored token on first mount
  dataLoading: false,
  owners: [],
  drivers: [],
  guardians: [],
  scholars: [],
  schools: [],
  tripEvents: [],
};

// The backend uses Prisma enums (FULL, HOME_PICKUP, WHATSAPP, ...); the
// screens and selectors were built against the mock's lowercase strings.
// Normalizing here means only this file needs to know about that mismatch.
function normalizeGuardian(g) {
  return {
    ...g,
    type: g.type?.toLowerCase(),
    billingChannel: g.billingChannel ? g.billingChannel.toLowerCase() : null,
  };
}

function normalizeScholar(s) {
  return {
    ...s,
    transportPlan: s.transportPlan?.toLowerCase(),
    guardianLinks: (s.guardianLinks || []).map((l) => ({ guardianId: l.guardianId, notify: l.notify })),
  };
}

function normalizeTripEvent(e) {
  return { ...e, eventType: e.eventType?.toLowerCase() };
}

const COLLECTION_FETCHERS = {
  schools: () => api.listSchools(),
  guardians: () => api.listGuardians().then((rows) => rows.map(normalizeGuardian)),
  drivers: () => api.listDrivers(),
  scholars: () => api.listScholars().then((rows) => rows.map(normalizeScholar)),
  owners: () => api.listOwners(),
  tripEvents: () => api.listTripEvents({ today: true }).then((rows) => rows.map(normalizeTripEvent)),
};

async function fetchCollections(which) {
  const entries = await Promise.all(which.map(async (key) => [key, await COLLECTION_FETCHERS[key]()]));
  return Object.fromEntries(entries);
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_AUTH_LOADING':
      return { ...state, authLoading: action.value };
    case 'SET_DATA_LOADING':
      return { ...state, dataLoading: action.value };
    case 'SET_SESSION':
      return { ...state, session: action.session };
    case 'SET_COLLECTIONS':
      return { ...state, ...action.collections };
    case 'APPEND_TRIP_EVENT':
      return { ...state, tripEvents: [...state.tripEvents, action.event] };
    case 'RESET':
      return { ...initialState, authLoading: false };
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    async function restore() {
      const token = getToken();
      if (!token) {
        dispatch({ type: 'SET_AUTH_LOADING', value: false });
        return;
      }
      try {
        const { session } = await api.me();
        dispatch({ type: 'SET_SESSION', session });
        const collections = await fetchCollections(['schools', 'guardians', 'drivers', 'scholars', 'owners', 'tripEvents']);
        dispatch({ type: 'SET_COLLECTIONS', collections });
      } catch {
        clearToken();
      } finally {
        dispatch({ type: 'SET_AUTH_LOADING', value: false });
      }
    }
    restore();
  }, []);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export function useAppActions() {
  const { dispatch } = useApp();

  const loadCoreData = useCallback(async () => {
    dispatch({ type: 'SET_DATA_LOADING', value: true });
    const collections = await fetchCollections(['schools', 'guardians', 'drivers', 'scholars', 'owners', 'tripEvents']);
    dispatch({ type: 'SET_COLLECTIONS', collections });
    dispatch({ type: 'SET_DATA_LOADING', value: false });
  }, [dispatch]);

  // Resolves to { roles } when the phone+password holds more than one role
  // (caller should route to the Continue-as screen), or { session } once a
  // token has been issued and core data loaded.
  const login = useCallback(
    async (phone, password, role) => {
      const result = await api.login({ phone, password, role });
      if (result.roles) return { roles: result.roles };
      setToken(result.token);
      dispatch({ type: 'SET_SESSION', session: result.session });
      await loadCoreData();
      return { session: result.session };
    },
    [dispatch, loadCoreData]
  );

  const firstOwner = useCallback(
    async (payload) => {
      const result = await api.firstOwner(payload);
      setToken(result.token);
      dispatch({ type: 'SET_SESSION', session: result.session });
      await loadCoreData();
      return result.session;
    },
    [dispatch, loadCoreData]
  );

  // Flips to the other role on the same phone (owner <-> driver) without
  // re-entering a password — only valid when session.availableRoles
  // includes the target, which the backend re-verifies independently.
  const switchRole = useCallback(
    async (role) => {
      const result = await api.switchRole(role);
      setToken(result.token);
      dispatch({ type: 'SET_SESSION', session: result.session });
      return result.session;
    },
    [dispatch]
  );

  const logOut = useCallback(() => {
    clearToken();
    dispatch({ type: 'RESET' });
  }, [dispatch]);

  const addSchool = useCallback(
    async (name) => {
      const school = await api.addSchool(name);
      dispatch({ type: 'SET_COLLECTIONS', collections: await fetchCollections(['schools']) });
      return school.id;
    },
    [dispatch]
  );

  const addOwner = useCallback(
    async (payload) => {
      const result = await api.addOwner(payload);
      dispatch({ type: 'SET_COLLECTIONS', collections: await fetchCollections(['owners', 'drivers', 'scholars']) });
      return result.owner.id;
    },
    [dispatch]
  );

  const addScholar = useCallback(
    async (payload) => {
      const scholar = await api.addScholar(payload);
      dispatch({ type: 'SET_COLLECTIONS', collections: await fetchCollections(['scholars', 'guardians']) });
      return scholar.id;
    },
    [dispatch]
  );

  const updateScholar = useCallback(
    async (id, payload) => {
      await api.updateScholar(id, payload);
      dispatch({ type: 'SET_COLLECTIONS', collections: await fetchCollections(['scholars', 'guardians']) });
    },
    [dispatch]
  );

  const deactivateScholar = useCallback(
    async (id) => {
      await api.deactivateScholar(id);
      dispatch({ type: 'SET_COLLECTIONS', collections: await fetchCollections(['scholars']) });
    },
    [dispatch]
  );

  const reactivateScholar = useCallback(
    async (id) => {
      await api.reactivateScholar(id);
      dispatch({ type: 'SET_COLLECTIONS', collections: await fetchCollections(['scholars']) });
    },
    [dispatch]
  );

  const deleteScholar = useCallback(
    async (id) => {
      await api.deleteScholar(id);
      dispatch({ type: 'SET_COLLECTIONS', collections: await fetchCollections(['scholars']) });
    },
    [dispatch]
  );

  const addDriver = useCallback(
    async (payload) => {
      const driver = await api.addDriver(payload);
      dispatch({ type: 'SET_COLLECTIONS', collections: await fetchCollections(['drivers', 'scholars']) });
      return driver.id;
    },
    [dispatch]
  );

  const updateDriver = useCallback(
    async (id, payload) => {
      await api.updateDriver(id, payload);
      dispatch({ type: 'SET_COLLECTIONS', collections: await fetchCollections(['drivers', 'scholars']) });
    },
    [dispatch]
  );

  const deactivateDriver = useCallback(
    async (id) => {
      await api.deactivateDriver(id);
      dispatch({ type: 'SET_COLLECTIONS', collections: await fetchCollections(['drivers']) });
    },
    [dispatch]
  );

  const reactivateDriver = useCallback(
    async (id) => {
      await api.reactivateDriver(id);
      dispatch({ type: 'SET_COLLECTIONS', collections: await fetchCollections(['drivers']) });
    },
    [dispatch]
  );

  const deleteDriver = useCallback(
    async (id) => {
      await api.deleteDriver(id);
      dispatch({ type: 'SET_COLLECTIONS', collections: await fetchCollections(['drivers']) });
    },
    [dispatch]
  );

  const logTripEvent = useCallback(
    async (scholarId, eventType) => {
      const result = await api.logTripEvent({ scholarId, eventType });
      dispatch({ type: 'APPEND_TRIP_EVENT', event: normalizeTripEvent(result.event) });
      return result.notifications;
    },
    [dispatch]
  );

  const generateInvoice = useCallback((payload) => api.generateInvoice(payload), []);
  const markInvoicePaid = useCallback((id, paid) => api.markInvoicePaid(id, paid), []);
  const attachProofOfPayment = useCallback((id, filename) => api.attachProof(id, filename), []);

  return useMemo(
    () => ({
      loadCoreData,
      login,
      firstOwner,
      switchRole,
      logOut,
      addSchool,
      addOwner,
      addScholar,
      updateScholar,
      deactivateScholar,
      reactivateScholar,
      deleteScholar,
      addDriver,
      updateDriver,
      deactivateDriver,
      reactivateDriver,
      deleteDriver,
      logTripEvent,
      generateInvoice,
      markInvoicePaid,
      attachProofOfPayment,
    }),
    [
      loadCoreData,
      login,
      firstOwner,
      switchRole,
      logOut,
      addSchool,
      addOwner,
      addScholar,
      updateScholar,
      deactivateScholar,
      reactivateScholar,
      deleteScholar,
      addDriver,
      updateDriver,
      deactivateDriver,
      reactivateDriver,
      deleteDriver,
      logTripEvent,
      generateInvoice,
      markInvoicePaid,
      attachProofOfPayment,
    ]
  );
}

export { TRANSPORT_PLANS };
