# CarmelAlerta · MVP

App web móvil (React + Vite + TS + Tailwind + Leaflet) para reportar incidencias del Carmel, con diseño de Stitch.

## Arrancar
    npm install
    npm run dev

Sin configurar nada funciona en **modo demo**: los datos viven en el navegador (localStorage) y hay incidencias de ejemplo.
En el perfil puedes activar el "mode moderador (demo)" para verificar reportes.

## Pasar a datos reales (Supabase)
1. Crea un proyecto en Supabase y ejecuta `supabase/schema.sql` en el SQL Editor.
2. Copia `.env.example` a `.env` y rellena `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
3. Regístrate en la app y hazte moderador:
   `update public.profiles set is_moderator = true where username = 'TU_USUARIO';`
4. Despliega en Vercel con esas mismas dos variables de entorno.

## Qué incluye
- Mapa con pins por categoría, filtros, ficha con seguimiento de estados, "donar suport" (+5 pts), compartir.
- Reporte: foto (comprimida), GPS, dirección, categoría, descripción, aviso de duplicados cercanos (60 m).
- Moderación manual: verificar (+50 pts), rebutjar, marcar falsa (−100 pts, 3 faltas = 30 días suspendido), cambiar estado, publicar avisos.
- Comercio: saldo, niveles, bescanvi de premios con código.
- Los puntos se calculan en el servidor (funciones SQL), no en el cliente.

## Pendiente / decisiones
- Los comercios y premios son de ejemplo. El sorteo está anunciado ("Aviat"), no implementado.
- Sin IA todavía: la verificación es humana. Las incidencias pendientes solo las ven el autor y los moderadores.
- Sin notificaciones push: el autor ve el estado en su perfil.
- Mapa con tiles de OpenStreetMap (uso razonable); para tráfico alto, cambiar a un proveedor de pago.
- Revisar requisitos legales de los sorteos en España y RGPD (fotos y ubicaciones) antes de lanzar.
