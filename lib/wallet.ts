export const GRADIENTS = [
  { from: "#3B82F6", to: "#6C5CE7" },
  { from: "#6C5CE7", to: "#F97316" },
  { from: "#3B82F6", to: "#F97316" },
  { from: "#F97316", to: "#8B5CF6" },
  { from: "#8B5CF6", to: "#6C5CE7" },
];

export function getGradient(address: string) {
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = (hash * 31 + address.charCodeAt(i)) >>> 0;
  }
  return GRADIENTS[hash % GRADIENTS.length];
}

export function truncate(address: string) {
  return `${address.slice(0, 5)}…${address.slice(-4)}`;
}
