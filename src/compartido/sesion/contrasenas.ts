export function validarCoincidencia(nueva: string, confirmar: string): string {
  if (nueva !== confirmar) {
    return "Las contraseñas no coinciden.";
  }
  return "";
}
