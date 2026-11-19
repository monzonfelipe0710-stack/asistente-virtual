-- Estado para dar de baja a un usuario ya aprobado, sin confundirlo con
-- RECHAZADO, que corresponde al circuito de alta.
ALTER TYPE "EstadoUsuario" ADD VALUE 'SUSPENDIDO';
