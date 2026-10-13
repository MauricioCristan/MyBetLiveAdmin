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

## Confirmación y recuperación de cuentas Android

Se agrega la ruta pública `/verify-email` y una opción para continuar en la app desde `/verify-email` o `/reset-password`, antes de consumir el enlace. El intent limita el paquete a com.mybetlive y usa fallback HTTPS del dominio exacto de producción. Si se completa en navegador, el usuario puede regresar a Android e iniciar sesión. Los enlaces no se confirman automáticamente (evita activación por lectores de correo).

Las rutas sensibles no envían Referer y no se cachean; ninguna operación pública de auth adjunta el JWT guardado. Los formularios de contraseña conservan espacios y validan la longitud UTF-8 admitida por BCrypt. Después de publicar estos cambios debe configurarse SMTP en Railway; los secretos no se agregan a Cloudflare.

Registro y recuperación: 47 pruebas web sin fallos; build de producción correcto. Validado que las rutas públicas de auth no reciben JWT viejos y que los intents rechazan tokens inválidos y dominios de fallback ajenos. La recepción de correo real requiere configurar SMTP en Railway.

## Android App Links

`public/.well-known/assetlinks.json` asocia el dominio `mybetliveadmin.pages.dev` con `com.mybetlive` y el certificado SHA-256 de la APK release actual. Debe copiarse al build en `dist/cloudflare/browser/.well-known/assetlinks.json` y servirse como JSON con HTTP 200, sin redirecciones. Android limita los enlaces a `/reset-password` y `/verify-email`; el resto del admin continúa en navegador. El formulario y el botón para abrir Android permanecen disponibles como alternativa.

Cuando se publique con Google Play App Signing, agregar la huella SHA-256 del certificado de firma de aplicación de Play Console, que puede ser distinta de la clave de subida. La huella es pública; ninguna clave privada debe estar en este archivo. No agregar la firma debug al dominio de producción.
