# Paquete maestro ChatAP + OpenCode

## Contenido
- `CHATAP-OPENCODE-PAQUETE-MAESTRO.md`: prompt maestro, orden de trabajo y copia integrada de la skill.
- `chatap-frontend-SKILL.md`: skill independiente para instalar en `.opencode/skills/chatap-frontend/SKILL.md`.

## Cómo usarlo
1. Abrí OpenCode en la raíz del repositorio.
2. Confirmá que estés trabajando en la rama correcta (`dev-felipe`) y que los cambios locales estén guardados.
3. Pegá el contenido de `CHATAP-OPENCODE-PAQUETE-MAESTRO.md` como instrucción principal.
4. Para que la skill quede disponible en futuras sesiones, copiá `chatap-frontend-SKILL.md` a `.opencode/skills/chatap-frontend/SKILL.md` dentro del repositorio.
5. Revisá el diff antes de hacer commit o push.

El prompt pide autonomía para implementar cambios de frontend de bajo riesgo, pero protege autenticación, permisos, contratos API e integraciones no verificadas.
