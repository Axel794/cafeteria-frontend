/**
 * Configuracion del frontend.
 * - apiUrl: direccion del backend Spring Boot (el backend ya acepta peticiones desde http://localhost:4200).
 * - moneda: simbolo que se muestra junto a los precios (el backend solo envia el numero).
 */
export const environment = {
  apiUrl: 'http://localhost:8080/api/v1',
  moneda: 'S/',
};
