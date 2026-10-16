-- Rol para que los ciudadanos puedan registrarse sin aprobación.
-- Los empleados (ADMINISTRADOR) siguen entrando por el circuito de solicitud
-- pendiente de aprobación por la administración.
ALTER TYPE "Rol" ADD VALUE 'CIUDADANO';
