# Sesiones del web admin

El login y refresh usan `/api/v1/auth/admin/login` y `/api/v1/auth/admin/refresh`; desplegar primero el backend compatible. Todas las rutas del panel y sus hijos verifican `ROLE_ADMIN` contra `/me`. Una sesión cliente guardada no puede abrir el panel.

El interceptor solo envía credenciales a la API exacta del environment. Un 401 dispara una renovación compartida y una única repetición; no renueva solicitudes públicas ni un 403 de negocio. El refresh viaja sin Authorization, evitando que un access token vencido impida renovarlo. Se conserva la sesión ante errores temporales, y se termina si el refresh es rechazado o vuelve a fallar la autorización.

Las generaciones de sesión impiden que una petición antigua sobrescriba los tokens o permisos de una cuenta nueva. Web Locks coordina la rotación entre pestañas cuando el navegador lo admite; la misma pestaña siempre comparte una sola renovación.
