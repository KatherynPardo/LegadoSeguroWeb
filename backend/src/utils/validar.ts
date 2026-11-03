// Validaciones pequeñas que se repiten en los controladores.

// Devuelve el texto sin espacios sobrantes, o null si no es texto, está vacío o supera el máximo.
export function texto(valor: unknown, max: number): string | null {
  if (typeof valor !== 'string') return null;
  const limpio = valor.trim();
  return limpio.length > 0 && limpio.length <= max ? limpio : null;
}

export const esCorreo = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
export const esDni = (v: unknown) => typeof v === 'string' && /^\d{8}$/.test(v);
export const esTelefono = (v: unknown) => typeof v === 'string' && /^\d{9}$/.test(v);
