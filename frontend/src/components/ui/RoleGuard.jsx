import { useAuth } from '../../context/AuthContext';

/**
 * RoleGuard — Componente que muestra contenido condicionalmente según el rol del usuario.
 *
 * Props:
 *   adminOnly  {boolean}  — solo Administrador / Administradora / Jefe de Desarrollo
 *   roles      {string[]} — array de roles permitidos (e.g. ['programador', 'tecnico'])
 *   fallback   {ReactNode} — contenido a mostrar si no tiene permiso (opcional)
 *
 * Ejemplos:
 *   <RoleGuard adminOnly>          <-- Solo admins
 *   <RoleGuard roles={['programador']}> <-- Solo programadores
 */
export default function RoleGuard({ children, adminOnly = false, roles = null, fallback = null }) {
  const { isAdmin, hasRole } = useAuth();

  let allowed = true;
  if (adminOnly) allowed = isAdmin();
  else if (roles) allowed = hasRole(...roles);

  return allowed ? children : fallback;
}
