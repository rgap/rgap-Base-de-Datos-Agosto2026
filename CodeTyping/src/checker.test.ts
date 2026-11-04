import { describe, expect, it } from 'vitest';
import { check } from './checker';
import { EXERCISES } from './exercises';

const ex = (id: string) => EXERCISES.find((e) => e.id === id)!;
const ok = (id: string, code: string) => expect(check(code, ex(id).solutions).ok).toBe(true);
const bad = (id: string, code: string) => check(code, ex(id).solutions);

describe('el modelo de cada ejercicio es correcto', () => {
  for (const e of EXERCISES) it(e.id, () => ok(e.id, e.model));
});

describe('tolerante a espacios, mayúsculas y comentarios', () => {
  it('todo en una línea, minúsculas, sin espacios', () =>
    ok('aplicar-mysql', 'create function aplicar_porcentaje(p_precio decimal(10,2),p_porcentaje decimal(5,2)) returns decimal(10,2) deterministic return p_precio-p_precio*p_porcentaje/100'));
  it('tabs, espacios de más y saltos de línea raros', () =>
    ok('aplicar-mysql', '\n\n\tCREATE   FUNCTION\taplicar_porcentaje (\r\n\t\tp_precio DECIMAL( 10 , 2 ) ,\n p_porcentaje   DECIMAL(5,2)\n)\n\nRETURNS DECIMAL (10,2)\n  DETERMINISTIC\n\n RETURN   p_precio -  p_precio *p_porcentaje/ 100 ;\n\n'));
  it('espacio no separable', () =>
    ok('aplicar-mysql', 'CREATE FUNCTION aplicar_porcentaje(p_precio DECIMAL(10,2), p_porcentaje DECIMAL(5,2)) RETURNS DECIMAL(10,2) DETERMINISTIC RETURN p_precio - p_precio * p_porcentaje / 100;'));
  it('comentarios', () =>
    ok('aplicar-mysql', '-- mi función\nCREATE FUNCTION aplicar_porcentaje( /* precio */ p_precio DECIMAL(10,2), p_porcentaje DECIMAL(5,2)) RETURNS DECIMAL(10,2) DETERMINISTIC RETURN p_precio - p_precio * p_porcentaje / 100; -- fin'));
  it('DROP FUNCTION IF EXISTS y DELIMITER', () =>
    ok('aplicar-mysql', 'DROP FUNCTION IF EXISTS aplicar_porcentaje;\nDELIMITER $$\nCREATE FUNCTION aplicar_porcentaje(p_precio DECIMAL(10,2), p_porcentaje DECIMAL(5,2)) RETURNS DECIMAL(10,2) DETERMINISTIC RETURN p_precio - p_precio * p_porcentaje / 100$$\nDELIMITER ;'));
  it('backticks', () =>
    ok('aplicar-mysql', 'CREATE FUNCTION `aplicar_porcentaje`(p_precio DECIMAL(10,2), p_porcentaje DECIMAL(5,2)) RETURNS DECIMAL(10,2) DETERMINISTIC RETURN p_precio - p_precio * p_porcentaje / 100;'));
  it('números 100.00 = 100', () =>
    ok('aplicar-mysql', 'CREATE FUNCTION aplicar_porcentaje(p_precio DECIMAL(10,2), p_porcentaje DECIMAL(5,2)) RETURNS DECIMAL(10,2) DETERMINISTIC RETURN p_precio - p_precio * p_porcentaje / 100.00;'));
  it('BOOL = BOOLEAN y >= al revés', () =>
    ok('vigente-mysql', "create function es_vigente(p_estado varchar(10), p_desde datetime, p_hasta datetime, p_fecha datetime) returns bool deterministic return p_estado='activo' and p_fecha>=p_desde and (p_hasta is null or p_fecha<p_hasta)"));
});

describe('SQL Server', () => {
  const base = (name: string, extra = '') =>
    `${extra}CREATE OR ALTER FUNCTION ${name}(@p_precio DECIMAL(10,2), @p_porcentaje DECIMAL(5,2)) RETURNS DECIMAL(10,2) AS BEGIN RETURN @p_precio - @p_precio * @p_porcentaje / 100 END\nGO`;
  it('CREATE OR ALTER, sin dbo, otros nombres de @, sin ; y con GO', () => ok('aplicar-sqlserver', base('aplicar_porcentaje')));
  it('[dbo].[nombre]', () => ok('aplicar-sqlserver', base('[dbo].[aplicar_porcentaje]')));
  it('NVARCHAR/DATETIME2 equivalentes no rompen', () => ok('aplicar-sqlserver', base('dbo.aplicar_porcentaje', 'GO\n')));
  it('usar p_ en vez de @ da una pista', () => {
    const r = bad('aplicar-sqlserver', 'CREATE FUNCTION dbo.aplicar_porcentaje(p_precio DECIMAL(10,2)');
    expect(r.ok).toBe(false);
    expect(r.detail).toMatch(/@/);
  });
  it('es_vigente con IIF en una línea y nombres distintos', () =>
    ok('vigente-sqlserver', "create or alter function es_vigente(@p_estado nvarchar(10),@p_desde datetime2,@p_hasta datetime2,@p_fecha datetime2) returns bit as begin return iif(@p_estado=N'activo' and @p_fecha>=@p_desde and (@p_hasta is null or @p_fecha<@p_hasta),1,0) end"));
  it('es_vigente con CASE', () =>
    ok('vigente-sqlserver', "CREATE FUNCTION dbo.es_vigente(@estado VARCHAR(10), @desde DATETIME2, @hasta DATETIME2, @fecha DATETIME2) RETURNS BIT AS BEGIN RETURN CASE WHEN @estado = 'activo' AND @desde <= @fecha AND (@hasta IS NULL OR @fecha < @hasta) THEN 1 ELSE 0 END; END;"));
  it('olvidar AS', () => {
    const r = bad('aplicar-sqlserver', 'CREATE FUNCTION dbo.aplicar_porcentaje(@precio DECIMAL(10,2), @porcentaje DECIMAL(5,2)) RETURNS DECIMAL(10,2) BEGIN');
    expect(r.detail).toMatch(/AS/);
  });
});

describe('errores bien ubicados', () => {
  it('falta código', () => {
    const r = bad('aplicar-mysql', 'CREATE FUNCTION aplicar_porcentaje(');
    expect(r.title).toMatch(/falta/i);
    expect(r.progress).toBeGreaterThan(0);
  });
  it('error de tipeo en la línea correcta', () => {
    const r = bad('aplicar-mysql', 'CREATE FUNCTION aplicar_porcentaje(\n  p_precio DECIMAL(10,2),\n  p_porcentaje DECIMAL(5,2))\nRETURNS DECIMAL(10,2)\nDETERMINISTC\nRETURN 1;');
    expect(r.line).toBe(5);
    expect(r.detail).toMatch(/tipeo/);
  });
  it('texto entre comillas distinto', () => {
    const r = bad('vigente-mysql', "CREATE FUNCTION es_vigente(p_estado VARCHAR(10), p_desde DATETIME, p_hasta DATETIME, p_fecha DATETIME) RETURNS BOOLEAN DETERMINISTIC RETURN p_estado = 'Activo'");
    expect(r.detail).toMatch(/comillas/);
  });
  it('sobra código', () => {
    const r = bad('aplicar-mysql', ex('aplicar-mysql').model + '\nSELECT 1;');
    expect(r.title).toMatch(/sobra/i);
  });
  it('vacío', () => expect(bad('aplicar-mysql', '  \n\t ').ok).toBe(false));
});
