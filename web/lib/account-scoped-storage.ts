/** Claves de localStorage con alcance por cuenta.
 *  Los chats de Hubi y las copias de conflicto solo viven en este navegador:
 *  otra cuenta en la misma máquina no debe poder leerlos, y no se borran al cerrar sesión. */
export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export const scopedKey = (prefix: string, agency: string, account: string) => `${prefix}:${agency}:${account}`;

/** Adopta la clave antigua (solo agencia) a la nueva (agencia + cuenta) y borra la antigua.
 *  Devuelve el valor que queda en la clave nueva, o null si no había nada que migrar. */
export function adoptLegacyKey(legacy: string, next: string, storage: StorageLike): string | null {
  try {
    const value = storage.getItem(legacy);
    if (value === null) return null;
    if (storage.getItem(next) === null) storage.setItem(next, value);
    storage.removeItem(legacy);
    return storage.getItem(next);
  } catch {
    return null;
  }
}
