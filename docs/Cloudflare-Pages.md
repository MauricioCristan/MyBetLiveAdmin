# MyBetLive Admin en Cloudflare Pages

Angular estático, sin SSR ni servidor Node en producción. La API es `https://mybetlivebackend-production.up.railway.app/api/v1`. No subir claves de API, contraseñas ni credenciales de Railway al frontend: el navegador descarga todo su código.

## Desplegar

1. Guardar y subir el web admin a su repositorio independiente de MyBetLive.
2. En Cloudflare → Workers & Pages → Create → Pages → conectar GitHub y seleccionar ese repositorio.
3. Rama de producción: `main`. Preset: Angular (o None usando los siguientes valores explícitos).
4. Build command: `npm run build:cloudflare`.
5. Build output directory: `dist/cloudflare/browser`. Root directory: vacía si el frontend está en la raíz del repo.
6. Node: `24.19.0`, fijado por `.node-version`; también puede configurarse `NODE_VERSION=24.19.0` en Cloudflare. No pegar variables privadas del backend.
7. Deploy. Confirmar carga de `/login` y recarga de `/admin/settings/operations`.

Cloudflare Pages sirve `index.html` para rutas Angular cuando no hay `404.html` en la raíz. No se usa un Worker ni se necesita una regla de redirección que capture también los assets. El build copia las cabeceras de `public/_headers` y los logos/fuentes existentes.

## Conectar con Railway

Cuando Cloudflare genere la URL HTTPS real, en el servicio `MyBetLiveBackend` de Railway configurar `MYBET_CORS_ALLOWED_ORIGINS` con ese origen exacto: por ejemplo `https://nombre-elegido.pages.dev`, sin `/login`, sin `/api/v1` ni slash final. Aplicar el cambio en Railway. No usar `*` ni autorizar todos los dominios pages.dev. Los previews tienen otros orígenes y no quedan autorizados automáticamente contra producción.

El administrador inicial de producción es `owner` (o el nombre configurado en `MYBET_ADMIN_USERNAME`). Usar la contraseña privada establecida en Railway, no las cuentas demo del entorno local. Verificar login, resumen, Settings y Operación de APIs. No importar automáticamente los usuarios/picks de desarrollo.

Desarrollo conserva `npm start` (8080) y `npm run start:nfl` (8081). El build de producción reemplaza el environment local por `environment.production.ts`, sin source maps.

Fuentes: [Angular en Pages](https://developers.cloudflare.com/pages/framework-guides/deploy-an-angular-site/), [rutas SPA](https://developers.cloudflare.com/pages/configuration/serving-pages/).

## Verificación del repositorio independiente

Proyecto `mybetlive-admin` y Angular 22.2.0. Build de producción correcto; 44 pruebas aprobadas. `npm audit` reporta 0 vulnerabilidades después de actualizar dependencias compatibles. El bundle usa Railway, no contiene URLs locales de backend ni source maps y copia `_headers`, marca y fuentes. Quedan dos advertencias de tamaño del presupuesto Angular; no impiden el build. El `src.zip` heredado se conserva como respaldo en `.local`, excluido de Git.
