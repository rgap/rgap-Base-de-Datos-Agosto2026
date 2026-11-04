export type Dialect = 'mysql' | 'sqlserver';

export interface Exercise {
  id: string;
  /** Número del problema (el mismo en MySQL y en SQL Server). */
  num: number;
  title: string;
  context: string;
  dialect: Dialect;
  statement: string;
  /** Código modelo que se muestra para tipear. */
  model: string;
  /** Soluciones aceptadas. La primera es el modelo. */
  solutions: string[];
  note?: string;
}

const aplicarMy = `CREATE FUNCTION aplicar_porcentaje(
    p_precio     DECIMAL(10,2),
    p_porcentaje DECIMAL(5,2))
RETURNS DECIMAL(10,2)
DETERMINISTIC
RETURN p_precio - p_precio * p_porcentaje / 100;`;

const aplicarMs = `CREATE FUNCTION dbo.aplicar_porcentaje(
    @precio     DECIMAL(10,2),
    @porcentaje DECIMAL(5,2))
RETURNS DECIMAL(10,2)
AS
BEGIN
    RETURN @precio - @precio * @porcentaje / 100;
END;`;

const vigenteMy = `CREATE FUNCTION es_vigente(
    p_estado VARCHAR(10),
    p_desde  DATETIME,
    p_hasta  DATETIME,
    p_fecha  DATETIME)
RETURNS BOOLEAN
DETERMINISTIC
RETURN p_estado = 'activo'
   AND p_desde <= p_fecha
   AND (p_hasta IS NULL OR p_fecha < p_hasta);`;

const vigenteMs = `CREATE FUNCTION dbo.es_vigente(
    @estado VARCHAR(10),
    @desde  DATETIME2,
    @hasta  DATETIME2,
    @fecha  DATETIME2)
RETURNS BIT
AS
BEGIN
    RETURN IIF(@estado = 'activo'
           AND @desde <= @fecha
           AND (@hasta IS NULL OR @fecha < @hasta), 1, 0);
END;`;

const vigenteMsCase = `CREATE FUNCTION dbo.es_vigente(
    @estado VARCHAR(10),
    @desde  DATETIME2,
    @hasta  DATETIME2,
    @fecha  DATETIME2)
RETURNS BIT
AS
BEGIN
    RETURN CASE
        WHEN @estado = 'activo'
         AND @desde <= @fecha
         AND (@hasta IS NULL OR @fecha < @hasta) THEN 1
        ELSE 0
    END;
END;`;

// Variantes equivalentes que también se aceptan.
const swap = (code: string, pairs: [string, string][]) =>
  pairs.reduce((acc, [a, b]) => acc.split(a).join(b), code);

// Las comparaciones escritas al revés (a <= b  ≡  b >= a).
const flips = (code: string, desde: string, hasta: string, fecha: string): string[] => {
  const a: [string, string] = [`${desde} <= ${fecha}`, `${fecha} >= ${desde}`];
  const b: [string, string] = [`${fecha} < ${hasta}`, `${hasta} > ${fecha}`];
  return [code, swap(code, [a]), swap(code, [b]), swap(code, [a, b])];
};

export const EXERCISES: Exercise[] = [
  {
    id: 'aplicar-mysql',
    num: 1,
    title: 'Aplicar un porcentaje',
    context: 'Tienda en línea',
    dialect: 'mysql',
    statement:
      'Escribe la función aplicar_porcentaje: recibe un precio y un porcentaje de descuento y devuelve cuánto paga el cliente (el precio menos ese porcentaje).',
    model: aplicarMy,
    solutions: [aplicarMy],
  },
  {
    id: 'aplicar-sqlserver',
    num: 1,
    title: 'Aplicar un porcentaje',
    context: 'Tienda en línea',
    dialect: 'sqlserver',
    statement:
      'La misma función aplicar_porcentaje, ahora en SQL Server. Fíjate en lo que cambia: los parámetros llevan @, después de RETURNS va AS y el cuerpo va entre BEGIN y END.',
    model: aplicarMs,
    solutions: [aplicarMs],
  },
  {
    id: 'vigente-mysql',
    num: 2,
    title: '¿El cupón está vigente?',
    context: 'App móvil / tienda pública',
    dialect: 'mysql',
    statement:
      "Una app móvil quiere saber si un cupón se puede usar en una fecha dada. Según la Regla 6, un cupón está vigente cuando está 'activo', ya llegó su fecha de inicio y su fecha final es nula o todavía no ha llegado. Devuelve 1 (sí) o 0 (no).",
    model: vigenteMy,
    solutions: flips(vigenteMy, 'p_desde', 'p_hasta', 'p_fecha'),
  },
  {
    id: 'vigente-sqlserver',
    num: 2,
    title: '¿El cupón está vigente?',
    context: 'App móvil / tienda pública',
    dialect: 'sqlserver',
    statement:
      "La misma regla en SQL Server: el cupón está vigente si está 'activo', ya empezó y su fecha final es nula o todavía no llega. Devuelve 1 (sí) o 0 (no).",
    note: 'SQL Server no tiene BOOLEAN: se usa BIT. Y una condición no se puede devolver directo: IIF(condición, 1, 0) devuelve 1 si se cumple y 0 si no. También se acepta con CASE WHEN ... THEN 1 ELSE 0 END.',
    model: vigenteMs,
    solutions: [
      ...flips(vigenteMs, '@desde', '@hasta', '@fecha'),
      ...flips(vigenteMsCase, '@desde', '@hasta', '@fecha'),
    ],
  },
];
