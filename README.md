# MyBetLive · Administración

Repositorio independiente: [MyBetLiveAdmin](https://github.com/MauricioCristan/MyBetLiveAdmin). Proyecto Angular `mybetlive-admin`; producción en Cloudflare Pages y API en Railway.

Portal Angular 22. El sidebar agrupa MyBetLive, Clientes, Suscripciones, Deportes y Ligas. Planes está dentro de Suscripciones. Los seguimientos y marcadores pertenecen a Android.

## Desarrollo

Para publicar en Cloudflare Pages y conectar con Railway: [guía de producción](docs/Cloudflare-Pages.md). Ejecutar `npm run build:cloudflare`; publicar `dist/cloudflare/browser`.

```powershell
npm ci
npm start
```

La configuración predeterminada conecta con el backend en `http://localhost:8080/api/v1`. Para el backend PostgreSQL local en 8081:

```powershell
npm run start:nfl
```

La configuración `nfl-live` y `src/enviroment/environment.nfl-live.ts` son ejemplos reproducibles, sin credenciales, y deben conservarse junto con `angular.json`. El nombre de carpeta `enviroment` procede de la semilla.

Desde el backend se puede iniciar el perfil `demo` con H2 temporal. Sus cuentas exclusivamente de demostración son `admin-demo / admin-demo-change-me` y `demo / demo-change-me`. No usar estos datos ni el perfil demo para producción.

## Administración

- `/admin/mybet`: dashboard agregado de clientes, suscripciones, catálogo, planes y próximos vencimientos, con actualización y estados de carga/error.
- `/admin/mybet/clients`: búsqueda, creación y edición de clientes; excluye cuentas ADMIN.
- `/admin/mybet/subscriptions`: concesión, edición y revocación de accesos manuales; las compras Play son de consulta.
- `/admin/mybet/subscriptions/plans`: planes, beneficios, publicación e IDs de producto/plan base Google Play. Los precios se obtienen desde Google Play en Android.
- `/admin/mybet/sports` y `/admin/mybet/leagues`: catálogo administrable con versiones y auditoría. Las capacidades y restricciones de integración proceden del backend.
- Settings → MyBetLive → Operación de APIs: intervalo automático, presupuesto, caché y pausa por deporte, con diagnóstico sin peticiones deportivas externas.

Los permisos de Angular complementan la autorización obligatoria del servidor. La publicidad y los beneficios de planes se configuran mediante los contratos existentes del backend; el portal no contiene claves deportivas, credenciales Google ni tokens de compra.

## Validación

```powershell
npm test -- --watch=false
npx ng build --configuration=nfl-live
```

Las pruebas usan respuestas HTTP simuladas. Antes de publicar, preparar una configuración de producción con API HTTPS y CORS adecuados; las URLs loopback incluidas son para desarrollo.

No incluir en Git `.local/`, `.env`, credenciales, logs, `node_modules/`, cachés, cobertura ni compilaciones generadas. Conservar fuentes, pruebas y archivos de dependencias. La evidencia de pruebas físicas se mantiene en la documentación local del proyecto Android.

## Diseño MyBetLive
El portal incorpora el tema y las vistas administrativas de Penpot, con sidebar y tablas adaptadas a celular. Operación de APIs y Publicidad tienen rutas independientes dentro de Settings. Véase [guía del web admin](docs/Web-admin-Penpot.md) para configuración, comportamiento y validación.
