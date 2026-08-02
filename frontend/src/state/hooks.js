import { useApp } from './AppContext';

export function useCurrentOwner() {
  const { state } = useApp();
  if (state.session?.role !== 'owner') return null;
  return state.owners.find((o) => o.id === state.session.ownerId) ?? null;
}

export function useCurrentDriver() {
  const { state } = useApp();
  if (state.session?.role !== 'driver') return null;
  return state.drivers.find((d) => d.id === state.session.driverId) ?? null;
}
