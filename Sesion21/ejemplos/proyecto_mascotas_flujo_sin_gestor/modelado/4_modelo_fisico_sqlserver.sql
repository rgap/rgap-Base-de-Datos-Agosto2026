-- SQL dump generated using DBML (dbml.dbdiagram.io)
-- Database: SQL Server
-- Generated at: 2026-10-21T06:14:16.301Z

CREATE TABLE [cliente] (
  [id] integer PRIMARY KEY IDENTITY(1, 1),
  [nombre] varchar(100) NOT NULL,
  [telefono] varchar(20) UNIQUE
)
GO

CREATE TABLE [mascota] (
  [id] integer PRIMARY KEY IDENTITY(1, 1),
  [nombre] varchar(50),
  [especie] varchar(30) NOT NULL,
  [raza] varchar(50),
  [cliente_id] integer NOT NULL
)
GO

CREATE TABLE [servicio] (
  [id] integer PRIMARY KEY IDENTITY(1, 1),
  [nombre] varchar(100) UNIQUE NOT NULL,
  [duracion] integer NOT NULL CHECK (duracion > 0),
  [precio] decimal(8,2) NOT NULL CHECK (precio > 0),
  [orden] integer NOT NULL
)
GO

CREATE TABLE [empleado] (
  [id] integer PRIMARY KEY IDENTITY(1, 1),
  [nombre] varchar(100) UNIQUE NOT NULL,
  [orden] integer NOT NULL
)
GO

CREATE TABLE [cita] (
  [id] integer PRIMARY KEY IDENTITY(1, 1),
  [fecha_hora] datetime NOT NULL,
  [estado] varchar(20) NOT NULL CHECK (estado IN ('programada', 'completada', 'cancelada')) DEFAULT 'programada',
  [mascota_id] integer NOT NULL,
  [servicio_id] integer NOT NULL,
  [empleado_id] integer NOT NULL
)
GO

CREATE TABLE [pago] (
  [id] integer PRIMARY KEY IDENTITY(1, 1),
  [monto] decimal(8,2) NOT NULL,
  [metodo] varchar(20) NOT NULL CHECK (metodo IN ('efectivo', 'tarjeta', 'transferencia')),
  [cita_id] integer UNIQUE NOT NULL
)
GO

CREATE TABLE [encargado] (
  [id] integer PRIMARY KEY IDENTITY(1, 1),
  [usuario] varchar(50) UNIQUE NOT NULL,
  [contrasena] varchar(255) NOT NULL
)
GO

CREATE UNIQUE INDEX [mascota_index_0] ON [mascota] ("cliente_id", "nombre")
GO

CREATE UNIQUE INDEX [cita_index_1] ON [cita] ("empleado_id", "fecha_hora")
GO

EXEC sp_addextendedproperty
@name = N'Column_Description',
@value = 'Opcional',
@level0type = N'Schema', @level0name = 'dbo',
@level1type = N'Table',  @level1name = 'mascota',
@level2type = N'Column', @level2name = 'nombre';
GO

EXEC sp_addextendedproperty
@name = N'Column_Description',
@value = 'En minutos',
@level0type = N'Schema', @level0name = 'dbo',
@level1type = N'Table',  @level1name = 'servicio',
@level2type = N'Column', @level2name = 'duracion';
GO

EXEC sp_addextendedproperty
@name = N'Column_Description',
@value = 'En soles',
@level0type = N'Schema', @level0name = 'dbo',
@level1type = N'Table',  @level1name = 'servicio',
@level2type = N'Column', @level2name = 'precio';
GO

EXEC sp_addextendedproperty
@name = N'Column_Description',
@value = 'En soles',
@level0type = N'Schema', @level0name = 'dbo',
@level1type = N'Table',  @level1name = 'pago',
@level2type = N'Column', @level2name = 'monto';
GO

EXEC sp_addextendedproperty
@name = N'Column_Description',
@value = 'Hash con sal de la contraseña, nunca en claro',
@level0type = N'Schema', @level0name = 'dbo',
@level1type = N'Table',  @level1name = 'encargado',
@level2type = N'Column', @level2name = 'contrasena';
GO

ALTER TABLE [mascota] ADD FOREIGN KEY ([cliente_id]) REFERENCES [cliente] ([id])
GO

ALTER TABLE [cita] ADD FOREIGN KEY ([mascota_id]) REFERENCES [mascota] ([id])
GO

ALTER TABLE [cita] ADD FOREIGN KEY ([servicio_id]) REFERENCES [servicio] ([id])
GO

ALTER TABLE [cita] ADD FOREIGN KEY ([empleado_id]) REFERENCES [empleado] ([id])
GO

ALTER TABLE [pago] ADD FOREIGN KEY ([cita_id]) REFERENCES [cita] ([id])
GO
