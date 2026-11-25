/**
 * Configuracion para el despliegue (ng build, configuracion "production").
 * apiUrl es RELATIVA: el servidor web (nginx, ver nginx.conf) reenvia /api/ al backend,
 * asi el navegador solo habla con un origen y no hace falta CORS.
 */
export const environment = {
  apiUrl: '/api/v1',
  moneda: 'S/',
};
