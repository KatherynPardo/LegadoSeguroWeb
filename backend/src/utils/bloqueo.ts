// Evita que dos pedidos del MISMO usuario se ejecuten a la vez (por ejemplo, un doble clic en "Guardar").
// Los pedidos de un usuario se hacen uno detrás de otro; los de usuarios distintos no se afectan.

const colas = new Map<number, Promise<unknown>>();

export function enFila<T>(idUsuario: number, tarea: () => Promise<T>): Promise<T> {
  const anterior = colas.get(idUsuario) ?? Promise.resolve();
  const actual = anterior.then(tarea, tarea); // empieza cuando termina el pedido anterior, haya salido bien o mal

  colas.set(idUsuario, actual.then(() => undefined, () => undefined));
  return actual;
}
