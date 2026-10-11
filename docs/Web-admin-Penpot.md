# Web admin MyBetLive — diseño de Penpot implementado

La identidad del portal utiliza el emblema Impulso aprobado, Inter Tight servido localmente y la paleta de Penpot (ink, panel, raised, borde, blanco, verde lima y estados verde/ámbar/rojo). La licencia de la tipografía se conserva en public/fonts/OFL.txt. No depende de fuentes de terceros durante el uso del portal.

## Vistas y navegación

- Acceso, recuperación y establecimiento de contraseña con el tema MyBetLive; se conserva la autenticación existente.
- Sidebar de escritorio con resumen, clientes, suscripciones, deportes, ligas, planes, operación de APIs, publicidad y configuración. En celular se utiliza el menú offcanvas.
- Dashboard con datos del backend: clientes habilitados/deshabilitados, Free/Premium, accesos vigentes por origen, disponibilidad de deportes y ligas, planes y próximos vencimientos. La distribución conserva cantidades y porcentajes, incluidos ceros. No incluye ingresos, picks ni marcadores.
- Listas y formularios existentes, con tarjetas en pantallas estrechas. Los campos corresponden al contrato real: el cliente tiene usuario y correo, no un nombre completo independiente. Las cuentas Google con usuario generado se identifican visualmente por correo; IDs y usuario persistido se conservan.
- Google Play y accesos no editables siguen en modo de consulta. Se conserva la validación, versiones y permisos de cada recurso.

## Configuración operativa

| Ruta | Vista |
|---|---|
| /admin/settings | Configuración existente compatible |
| /admin/settings/operations | Resumen de proveedores y consumo por deporte |
| /admin/settings/operations/:sport | Proveedor, intervalo, presupuesto, cachés y pausa del deporte |
| /admin/settings/ads | Configuración de publicidad Free y recompensas |

Las vistas de operación/publicidad exigen acceso administrativo, además de los permisos que aplica Settings. No se agregan endpoints ni se consulta una API deportiva al guardar o recargar el portal.

Los proveedores se muestran como opciones configuradas o no disponibles. Un cambio de proveedor requiere confirmación que explica el alcance, conserva picks anteriores y muestra proveedor anterior/nuevo. Cancelar conserva el borrador; Descartar restaura los valores recibidos. La confirmación atrapa el foco, permite Escape y devuelve el foco al control anterior. Al abandonar Settings se advierte sobre cambios pendientes; esta protección no bloquea logout o redirección a login.

## Verificación

Pruebas del frontend: navegación, permisos, formularios y datos reales mediante mocks, confirmación, descarte, foco/teclado, salida con borrador y logout. Compilación de producción. Revisión en navegador a 1440 px y 390 px: acceso, dashboard, operación, menú, clientes, formulario de cliente y planes. Las comprobaciones manuales no guardaron clientes, suscripciones, planes ni cambios operativos.

Las capturas y logs de esa ejecución quedan en .local/verification/admin-penpot-2026-10-08, excluidos de Git. El frontend conserva las advertencias de presupuesto de tamaño del bundle y del stylesheet de MyBet; no se aumentaron los límites de compilación.

### Selección de ligas de fútbol
En Ligas → Crear liga, Fútbol carga automáticamente el catálogo de API-Football. País y búsqueda filtran localmente. El selector completa ID, nombre y país; las ligas registradas quedan deshabilitadas en el selector para evitar duplicados. Guardar registra y habilita únicamente la liga elegida. El listado permite habilitar o deshabilitar mediante un interruptor; Fútbol debe estar habilitado en Deportes.

GET /api/v1/admin/mybet/leagues/available?sport=SOCCER requiere ROLE_ADMIN. API-Football GET /leagues se reutiliza durante 24 horas y alimenta la caché de búsquedas e identificadores, respetando la cuota y pausa existentes. Un error no se guarda en caché; no se importan ni habilitan todas las ligas automáticamente.
