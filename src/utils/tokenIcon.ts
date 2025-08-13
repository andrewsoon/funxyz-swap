const icons: Record<string, string> = import.meta.glob('/node_modules/cryptocurrency-icons/svg/color/*.svg', { eager: true, import: 'default' });

export function getTokenIcon(symbol: string) {
  const key = `/node_modules/cryptocurrency-icons/svg/color/${symbol.toLowerCase()}.svg`;
  return icons[key] ?? '/default-icon.svg';
}