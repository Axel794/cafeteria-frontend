// API simulada con el MISMO contrato que cafeteria-backend (rama practica-3).
// Solo para probar el frontend cuando el backend real no esta levantado.
import { createServer } from 'node:http';

let cats = [
  { id: 1, nombre: 'Cafes', activa: true }, { id: 2, nombre: 'Bebidas Frias', activa: true },
  { id: 3, nombre: 'Reposteria', activa: true }, { id: 4, nombre: 'Metodos de Extraccion', activa: true },
];
const P = (id, nombre, precio, categoriaId, disponible = true) => ({ id, nombre, descripcion: null, precio, disponible, categoriaId, categoria: '', imagenUrl: null, alergenos: null });
let prods = [P(1,'Espresso',8,1),P(2,'Cappuccino',12,1),P(3,'Latte',13,1),P(4,'Cold Brew',14,2),P(5,'Frappe de Caramelo',16,2,false),P(6,'Brownie Artesanal',9.5,3),P(7,'Cheesecake de Maracuya',12.5,3),P(8,'V60',15,4)];
let pedidos = [];
const ORDEN = ['PENDIENTE','EN_PREPARACION','LISTO','ENTREGADO'];
const catNombre = (id) => cats.find((c) => c.id === id)?.nombre ?? '';
const prodOut = (p) => ({ ...p, categoria: catNombre(p.categoriaId) });
const err = (res, status, mensaje, detalles = []) => send(res, status, { timestamp: new Date().toISOString(), status, error: 'Error', mensaje, detalles });
function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS' });
  res.end(body === undefined ? '' : JSON.stringify(body));
}
const rolDe = (req) => { const t = (req.headers.authorization ?? '').replace('Bearer ', ''); return t === 'tok-admin' ? 'ADMINISTRADOR' : t === 'tok-barista' ? 'BARISTA' : null; };
const leer = (req) => new Promise((ok) => { let d = ''; req.on('data', (c) => (d += c)); req.on('end', () => ok(d ? JSON.parse(d) : {})); });
const MENSAJES = { PENDIENTE: 'Recibimos tu pedido y esta en cola.', EN_PREPARACION: 'Estamos preparando tu pedido.', ENTREGADO: 'Pedido entregado. Buen provecho.' };
const msg = (p) => p.estado === 'LISTO' ? (p.tipoPedido === 'PICKUP' ? 'Tu pedido esta listo. Recogelo en barra.' : 'Tu pedido esta listo y va en camino a tu mesa.') : MENSAJES[p.estado];

createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204);
  const url = new URL(req.url, 'http://x'); const ruta = url.pathname.replace('/api/v1', ''); const m = req.method; const rol = rolDe(req);
  const body = ['POST','PUT'].includes(m) ? await leer(req) : {};
  let r;
  if (ruta === '/auth/login' && m === 'POST') {
    if (body.username === 'admin' && body.password === 'Admin123*') return send(res, 200, { token: 'tok-admin', tipo: 'Bearer', username: 'admin', rol: 'ADMINISTRADOR', expiraEnMinutos: 120 });
    if (body.username === 'barista' && body.password === 'Barista123*') return send(res, 200, { token: 'tok-barista', tipo: 'Bearer', username: 'barista', rol: 'BARISTA', expiraEnMinutos: 120 });
    return err(res, 401, 'Credenciales invalidas');
  }
  if (ruta === '/categorias' && m === 'GET') return send(res, 200, cats.filter((c) => c.activa));
  if (ruta === '/productos' && m === 'GET') {
    let l = prods; const c = url.searchParams.get('categoriaId'); if (c) l = l.filter((p) => p.categoriaId === +c);
    if (url.searchParams.get('soloDisponibles') === 'true') l = l.filter((p) => p.disponible);
    return send(res, 200, l.map(prodOut));
  }
  if ((ruta.startsWith('/categorias') || ruta.startsWith('/productos')) && m !== 'GET') {
    if (!rol) return err(res, 401, 'Se requiere autenticacion'); if (rol !== 'ADMINISTRADOR') return err(res, 403, 'No tienes permisos');
    const id = +ruta.split('/')[2]; const esCat = ruta.startsWith('/categorias');
    if (m === 'POST') { if (!body.nombre) return err(res, 400, 'Datos invalidos', ['nombre: obligatorio']); const n = esCat ? { id: Math.max(...cats.map(c=>c.id))+1, nombre: body.nombre, activa: true } : { ...body, id: Math.max(...prods.map(p=>p.id))+1 }; (esCat ? cats : prods).push(n); return send(res, 201, esCat ? n : prodOut(n)); }
    if (m === 'PUT') { const lista = esCat ? cats : prods; const i = lista.findIndex((x) => x.id === id); if (i < 0) return err(res, 404, 'No encontrado'); lista[i] = { ...lista[i], ...body, id }; return send(res, 200, esCat ? lista[i] : prodOut(lista[i])); }
    if (m === 'DELETE') {
      if (esCat && prods.some((p) => p.categoriaId === id)) return err(res, 409, 'No se puede eliminar la categoria porque tiene productos asociados');
      if (!esCat && pedidos.some((p) => p.detalles.some((d) => d.productoId === id))) return err(res, 409, 'No se puede eliminar el producto porque tiene pedidos asociados');
      if (esCat) cats = cats.filter((c) => c.id !== id); else prods = prods.filter((p) => p.id !== id); return send(res, 204);
    }
  }
  if (ruta === '/pedidos' && m === 'POST') {
    if (body.tipoPedido === 'LOCAL' && !(body.numeroMesa > 0)) return err(res, 422, 'Los pedidos LOCAL requieren numeroMesa mayor a 0');
    if (body.tipoPedido === 'PICKUP' && (!body.nombreCliente || !body.telefonoCliente)) return err(res, 422, 'Los pedidos PICKUP requieren nombreCliente y telefonoCliente');
    let total = 0; const detalles = [];
    for (const d of body.detalles ?? []) { const p = prods.find((x) => x.id === d.productoId); if (!p) return err(res, 404, 'Producto no encontrado: ' + d.productoId); if (!p.disponible) return err(res, 422, 'El producto no esta disponible: ' + p.nombre); const sub = p.precio * d.cantidad; total += sub; detalles.push({ productoId: p.id, producto: p.nombre, cantidad: d.cantidad, precioUnitario: p.precio, subtotal: sub, notas: d.notas }); }
    const id = pedidos.length + 1; const ped = { id, codigoTicket: 'CDD-' + String(id).padStart(6, '0'), fechaHora: new Date().toISOString(), estado: 'PENDIENTE', tipoPedido: body.tipoPedido, numeroMesa: body.numeroMesa ?? null, nombreCliente: body.nombreCliente ?? null, telefonoCliente: body.telefonoCliente ?? null, total, detalles };
    pedidos.push(ped); return send(res, 201, ped);
  }
  if ((r = ruta.match(/^\/pedidos\/(\d+)\/tracker$/)) && m === 'GET') { const p = pedidos.find((x) => x.id === +r[1]); if (!p) return err(res, 404, 'Pedido no encontrado con id: ' + r[1]); return send(res, 200, { id: p.id, codigoTicket: p.codigoTicket, estado: p.estado, tipoPedido: p.tipoPedido, fechaHora: p.fechaHora, mensaje: msg(p) }); }
  if (ruta.startsWith('/pedidos')) {
    if (!rol) return err(res, 401, 'Se requiere autenticacion');
    if ((r = ruta.match(/^\/pedidos\/(\d+)$/)) && m === 'GET') { const p = pedidos.find((x) => x.id === +r[1]); return p ? send(res, 200, p) : err(res, 404, 'Pedido no encontrado con id: ' + r[1]); }
    if (ruta === '/pedidos' && m === 'GET') { const e = url.searchParams.get('estado'); return send(res, 200, e ? pedidos.filter((p) => p.estado === e) : pedidos); }
    if ((r = ruta.match(/^\/pedidos\/(\d+)\/estado$/)) && m === 'PUT') { const p = pedidos.find((x) => x.id === +r[1]); if (!p) return err(res, 404, 'Pedido no encontrado'); if (ORDEN.indexOf(body.estado) !== ORDEN.indexOf(p.estado) + 1) return err(res, 422, 'Transicion de estado invalida: de ' + p.estado + ' a ' + body.estado); p.estado = body.estado; return send(res, 200, p); }
  }
  err(res, 404, 'Ruta no encontrada');
}).listen(8080, () => console.log('Mock API en http://localhost:8080/api/v1'));
