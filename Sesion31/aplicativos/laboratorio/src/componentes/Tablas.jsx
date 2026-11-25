// Tablas con datos fijos, como las muestra MySQL Workbench (NULL incluido).
export function Tabla({ tabla }) {
  const resaltar = tabla.resaltar ?? [];
  return (
    <figure className="tabla">
      {tabla.nombre && <figcaption>{tabla.nombre}</figcaption>}
      <table>
        <thead>
          <tr>
            {tabla.columnas.map((columna, i) => <th key={i}>{columna}</th>)}
          </tr>
        </thead>
        <tbody>
          {tabla.filas.length === 0 && (
            <tr>
              <td className="vacia" colSpan={tabla.columnas.length}>(sin filas)</td>
            </tr>
          )}
          {tabla.filas.map((fila, i) => (
            <tr key={i} className={resaltar.includes(i) ? "resaltada" : undefined}>
              {fila.map((valor, j) => (
                <td key={j}>{valor === null ? <span className="nulo">NULL</span> : valor}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

export function Tablas({ tablas }) {
  return (
    <div className="tablas">
      {tablas.map((tabla, i) => <Tabla key={i} tabla={tabla} />)}
    </div>
  );
}
