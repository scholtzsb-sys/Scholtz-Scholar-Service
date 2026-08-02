import { createContext, useContext, useMemo, useReducer } from 'react';
import {
  initialDrivers,
  initialGuardians,
  initialInvoices,
  initialOwners,
  initialSchools,
  initialScholars,
  initialTripEvents,
  TRANSPORT_PLANS,
} from '../lib/mockData';
import { hasFreeSessionWindow } from '../lib/selectors';

const AppStateContext = createContext(null);

const initialState = {
  owners: initialOwners,
  drivers: initialDrivers,
  guardians: initialGuardians,
  scholars: initialScholars,
  schools: initialSchools,
  tripEvents: initialTripEvents,
  invoices: initialInvoices,
  nextRegistrationIndex: initialScholars.length,
  notificationLog: [],
  session: null, // { role: 'owner' | 'driver', ownerId?, driverId?, phone }
};

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function reducer(state, action) {
  switch (action.type) {
    case 'START_SESSION':
      return { ...state, session: action.session };

    case 'LOG_OUT':
      return { ...state, session: null };

    case 'ADD_SCHOOL':
      return { ...state, schools: [...state.schools, action.school] };

    case 'ADD_OWNER': {
      const owner = { id: action.owner.id ?? uid('owner'), ...action.owner };
      const drivers = action.owner.alsoDrives
        ? [
            ...state.drivers,
            {
              id: uid('driver'),
              name: owner.name,
              phone: owner.phone,
              password: owner.password,
              vehicleReg: action.owner.vehicleReg || '',
              linkedOwnerId: owner.id,
              active: true,
              deactivatedAt: null,
            },
          ]
        : state.drivers;
      return { ...state, owners: [...state.owners, owner], drivers };
    }

    case 'ADD_SCHOLAR': {
      const scholar = {
        id: action.scholar.id ?? uid('scholar'),
        colorIndex: state.nextRegistrationIndex,
        active: true,
        deactivatedAt: null,
        ...action.scholar,
      };
      const newGuardians = action.newGuardians || [];
      return {
        ...state,
        scholars: [...state.scholars, scholar],
        guardians: [...state.guardians, ...newGuardians],
        nextRegistrationIndex: state.nextRegistrationIndex + 1,
      };
    }

    case 'UPDATE_SCHOLAR': {
      return {
        ...state,
        scholars: state.scholars.map((s) => (s.id === action.scholarId ? { ...s, ...action.patch } : s)),
        guardians:
          action.upsertGuardians?.reduce((acc, g) => {
            const exists = acc.some((existing) => existing.id === g.id);
            return exists ? acc.map((existing) => (existing.id === g.id ? { ...existing, ...g } : existing)) : [...acc, g];
          }, state.guardians) ?? state.guardians,
      };
    }

    case 'DEACTIVATE_SCHOLAR':
      return {
        ...state,
        scholars: state.scholars.map((s) =>
          s.id === action.scholarId ? { ...s, active: false, deactivatedAt: new Date().toISOString() } : s
        ),
      };

    case 'REACTIVATE_SCHOLAR':
      return {
        ...state,
        scholars: state.scholars.map((s) => (s.id === action.scholarId ? { ...s, active: true, deactivatedAt: null } : s)),
      };

    case 'DELETE_SCHOLAR':
      return { ...state, scholars: state.scholars.filter((s) => s.id !== action.scholarId) };

    case 'ADD_DRIVER': {
      const driver = { id: action.driver.id ?? uid('driver'), active: true, deactivatedAt: null, ...action.driver };
      const scholars = state.scholars.map((s) => (action.assignedScholarIds.includes(s.id) ? { ...s, driverId: driver.id } : s));
      // apply pickup order
      const withOrder = scholars.map((s) => {
        const idx = action.assignedScholarIds.indexOf(s.id);
        return idx >= 0 ? { ...s, pickupOrder: idx + 1 } : s;
      });
      return { ...state, drivers: [...state.drivers, driver], scholars: withOrder };
    }

    case 'UPDATE_DRIVER': {
      const scholars = state.scholars.map((s) => {
        if (action.assignedScholarIds && action.assignedScholarIds.includes(s.id)) {
          return { ...s, driverId: action.driverId, pickupOrder: action.assignedScholarIds.indexOf(s.id) + 1 };
        }
        if (s.driverId === action.driverId && action.assignedScholarIds && !action.assignedScholarIds.includes(s.id)) {
          return { ...s, driverId: null };
        }
        return s;
      });
      return {
        ...state,
        drivers: state.drivers.map((d) => (d.id === action.driverId ? { ...d, ...action.patch } : d)),
        scholars,
      };
    }

    case 'DEACTIVATE_DRIVER':
      return {
        ...state,
        drivers: state.drivers.map((d) =>
          d.id === action.driverId ? { ...d, active: false, deactivatedAt: new Date().toISOString() } : d
        ),
      };

    case 'REACTIVATE_DRIVER':
      return {
        ...state,
        drivers: state.drivers.map((d) => (d.id === action.driverId ? { ...d, active: true, deactivatedAt: null } : d)),
      };

    case 'DELETE_DRIVER':
      return { ...state, drivers: state.drivers.filter((d) => d.id !== action.driverId) };

    case 'LOG_TRIP_EVENT': {
      const event = {
        id: uid('trip'),
        scholarId: action.scholarId,
        eventType: action.eventType,
        timestamp: new Date(),
      };
      const scholar = state.scholars.find((s) => s.id === action.scholarId);
      const links = scholar?.guardianLinks ?? [];
      const notifications = links.map((link) => {
        const contact = state.guardians.find((g) => g.id === link.guardianId);
        return {
          id: uid('notif'),
          guardianId: link.guardianId,
          guardianName: contact?.name,
          scholarName: scholar?.name,
          eventType: action.eventType,
          sent: link.notify,
          channel: link.notify ? (hasFreeSessionWindow(contact) ? 'free_session' : 'paid_template') : null,
          reason: link.notify ? null : 'guardian has notifications turned off',
          timestamp: event.timestamp,
        };
      });
      return {
        ...state,
        tripEvents: [...state.tripEvents, event],
        notificationLog: [...notifications, ...state.notificationLog],
      };
    }

    case 'GENERATE_INVOICE': {
      const invoice = { id: uid('invoice'), status: 'unpaid', proofOfPayment: null, paidAt: null, ...action.invoice };
      return { ...state, invoices: [...state.invoices, invoice] };
    }

    case 'MARK_INVOICE_PAID': {
      const willBePaid = action.paid;
      const invoice = state.invoices.find((i) => i.id === action.invoiceId);
      if (willBePaid && invoice && invoice.status !== 'paid') {
        const guardian = state.guardians.find((g) => g.id === invoice.billingGuardianId);
        const notif = guardian
          ? [
              {
                id: uid('notif'),
                guardianId: guardian.id,
                guardianName: guardian.name,
                scholarName: null,
                eventType: 'payment_received',
                sent: true,
                channel: 'paid_template',
                reason: null,
                timestamp: new Date(),
              },
            ]
          : [];
        return {
          ...state,
          invoices: state.invoices.map((i) =>
            i.id === action.invoiceId ? { ...i, status: 'paid', paidAt: new Date().toISOString() } : i
          ),
          notificationLog: [...notif, ...state.notificationLog],
        };
      }
      return {
        ...state,
        invoices: state.invoices.map((i) => (i.id === action.invoiceId ? { ...i, status: willBePaid ? 'paid' : 'unpaid', paidAt: willBePaid ? new Date().toISOString() : null } : i)),
      };
    }

    case 'ATTACH_PROOF_OF_PAYMENT':
      return {
        ...state,
        invoices: state.invoices.map((i) => (i.id === action.invoiceId ? { ...i, proofOfPayment: action.proof } : i)),
      };

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
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
  return useMemo(
    () => ({
      startSession: (session) => dispatch({ type: 'START_SESSION', session }),
      logOut: () => dispatch({ type: 'LOG_OUT' }),
      addSchool: (name) => {
        const id = uid('school');
        dispatch({ type: 'ADD_SCHOOL', school: { id, name } });
        return id;
      },
      addOwner: (owner) => {
        const id = uid('owner');
        dispatch({ type: 'ADD_OWNER', owner: { ...owner, id } });
        return id;
      },
      addScholar: (scholar, newGuardians) => {
        const id = uid('scholar');
        dispatch({ type: 'ADD_SCHOLAR', scholar: { ...scholar, id }, newGuardians });
        return id;
      },
      updateScholar: (scholarId, patch, upsertGuardians) => dispatch({ type: 'UPDATE_SCHOLAR', scholarId, patch, upsertGuardians }),
      deactivateScholar: (scholarId) => dispatch({ type: 'DEACTIVATE_SCHOLAR', scholarId }),
      reactivateScholar: (scholarId) => dispatch({ type: 'REACTIVATE_SCHOLAR', scholarId }),
      deleteScholar: (scholarId) => dispatch({ type: 'DELETE_SCHOLAR', scholarId }),
      addDriver: (driver, assignedScholarIds) => {
        const id = uid('driver');
        dispatch({ type: 'ADD_DRIVER', driver: { ...driver, id }, assignedScholarIds });
        return id;
      },
      updateDriver: (driverId, patch, assignedScholarIds) => dispatch({ type: 'UPDATE_DRIVER', driverId, patch, assignedScholarIds }),
      deactivateDriver: (driverId) => dispatch({ type: 'DEACTIVATE_DRIVER', driverId }),
      reactivateDriver: (driverId) => dispatch({ type: 'REACTIVATE_DRIVER', driverId }),
      deleteDriver: (driverId) => dispatch({ type: 'DELETE_DRIVER', driverId }),
      logTripEvent: (scholarId, eventType) => dispatch({ type: 'LOG_TRIP_EVENT', scholarId, eventType }),
      generateInvoice: (invoice) => {
        const id = uid('invoice');
        dispatch({ type: 'GENERATE_INVOICE', invoice: { ...invoice, id } });
        return id;
      },
      markInvoicePaid: (invoiceId, paid) => dispatch({ type: 'MARK_INVOICE_PAID', invoiceId, paid }),
      attachProofOfPayment: (invoiceId, proof) => dispatch({ type: 'ATTACH_PROOF_OF_PAYMENT', invoiceId, proof }),
    }),
    [dispatch]
  );
}

// Matches phone+password against both owner and driver records — a phone
// held by the same person in both roles shares one password (see ADD_OWNER),
// so a correct login can resolve to one or two roles at once.
export function findRolesForCredentials(state, phone, password) {
  const owner = state.owners.find((o) => o.phone === phone && o.password === password);
  const driver = state.drivers.find((d) => d.phone === phone && d.password === password && d.active);
  const roles = [];
  if (owner) roles.push({ role: 'owner', ownerId: owner.id, label: `Owner — ${owner.name}` });
  if (driver) roles.push({ role: 'driver', driverId: driver.id, label: `Driver — ${driver.name}` });
  return roles;
}

// Used to distinguish "wrong password" from "no such account" for the login error message.
export function phoneHasAnyAccount(state, phone) {
  return state.owners.some((o) => o.phone === phone) || state.drivers.some((d) => d.phone === phone && d.active);
}

export { TRANSPORT_PLANS };
