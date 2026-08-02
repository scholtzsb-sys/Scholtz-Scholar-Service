// Fixed scholar color rotation, assigned by registration order — never chosen
// by the parent, never tied to gender, so it scales to any number of siblings
// without collisions.
export const SCHOLAR_COLOR_ROTATION = [
  { name: 'teal', bg: 'var(--teal-tint)', fg: 'var(--teal-dark)', solid: 'var(--teal)' },
  { name: 'coral', bg: 'var(--coral-tint)', fg: '#b5372c', solid: 'var(--coral)' },
  { name: 'amber', bg: 'var(--amber-tint)', fg: '#8a5a0a', solid: 'var(--amber)' },
  { name: 'purple', bg: 'var(--purple-tint)', fg: '#5c3fc4', solid: 'var(--purple)' },
];

export function scholarColor(registrationIndex) {
  return SCHOLAR_COLOR_ROTATION[registrationIndex % SCHOLAR_COLOR_ROTATION.length];
}

export function initials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}
