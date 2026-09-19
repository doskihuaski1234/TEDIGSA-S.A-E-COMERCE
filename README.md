# TEDIGSA S.A. — Plataforma E-Commerce

**Proyecto de Graduación**  
Implementación de una plataforma de comercio electrónico basada en arquitectura de microservicios e infraestructura en la nube para TEDIGSA S.A.

**Autor:** Paolo Alexander Marroquín de la Cruz  
**Carnet:** 1790-22-8967  
**Versión:** Alpha

---

## Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Backend | Node.js + Express + TypeScript |
| ORM | Prisma |
| Base de datos | PostgreSQL (Amazon RDS en producción) |
| Auth | JWT + bcrypt |
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS |
| Estilos | Colores institucionales TEDIGSA (#16345C, #F26B1D) |

---

## Estructura del proyecto

```
tedigsa-ecommerce/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Modelo de datos completo (15 entidades)
│   │   └── seed.ts            # Datos iniciales + usuarios de prueba
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/          # Registro, login, JWT
│   │   │   ├── catalogo/      # Productos, categorías, inventario
│   │   │   ├── carrito/       # Carrito de compras
│   │   │   └── ordenes/       # Órdenes, pagos, FEL
│   │   ├── common/middleware/ # Auth & roles
│   │   └── main.ts            # Entry point (API Gateway simulado)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/        # Header, ProductCard
│   │   ├── pages/             # Home, Catálogo, Detalle, Carrito, Login
│   │   ├── context/           # Auth & Cart
│   │   ├── services/api.ts    # Cliente Axios
│   │   └── App.tsx
│   └── package.json
└── README.md
```

---

## Requisitos previos

- Node.js 18+
- PostgreSQL 14+ (local o Docker)
- npm o yarn

---

## Instalación rápida

### 1. Base de datos

```bash
# Crear base de datos
createdb tedigsa_ecommerce

# O con Docker:
docker run -d --name tedigsa-db \
  -e POSTGRES_USER=tedigsa \
  -e POSTGRES_PASSWORD=tedigsa123 \
  -e POSTGRES_DB=tedigsa_ecommerce \
  -p 5432:5432 postgres:16
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Editar DATABASE_URL si es necesario

npm install
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed

npm run dev
# → http://localhost:4000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## Cuentas de prueba (después del seed)

| Rol | Email | Contraseña |
|-----|-------|------------|
| Administrador | admin@tedigsa.net | Admin123! |
| Cliente | cliente@example.com | Cliente123! |

---

## Endpoints principales

### Auth
- `POST /api/auth/register` — Registro de cliente
- `POST /api/auth/login` — Login
- `GET  /api/auth/me` — Perfil (Bearer token)

### Catálogo
- `GET  /api/catalogo/categorias`
- `GET  /api/catalogo/productos?search=&categoria=&page=`
- `GET  /api/catalogo/productos/:id`
- `POST /api/catalogo/productos` (Admin)
- `PATCH /api/catalogo/productos/:id/inventario` (Admin)

### Carrito
- `GET    /api/carrito`
- `POST   /api/carrito/items`
- `PUT    /api/carrito/items/:id`
- `DELETE /api/carrito/items/:id`

### Órdenes
- `POST  /api/ordenes` — Crear orden (checkout)
- `GET   /api/ordenes/mis-ordenes`
- `GET   /api/ordenes/:id`
- `GET   /api/ordenes` (Admin)
- `PATCH /api/ordenes/:id/estado` (Admin)

---

## Entidades de base de datos

Rol · Usuario · Direccion · Categoria · Proveedor · Producto · Inventario ·  
CarritoCompras · CarritoItem · Orden · DetalleOrden · Pago · FacturaFEL · Cupon · Resena

Todas normalizadas a 3FN, con nomenclatura en español (snake_case) y campos de auditoría.

---

## Próximos pasos (Beta)

- [ ] Página de Checkout completa (dirección + método de pago)
- [ ] Panel de Administración (Dashboard, CRUD productos, órdenes)
- [ ] Integración real con pasarela de pago
- [ ] Integración FEL (certificación SAT Guatemala)
- [ ] Registro de reseñas
- [ ] Sincronización de stock con API de proveedores
- [ ] Despliegue en AWS (ECS + RDS + S3)

---

## Colores institucionales

| Color | Hex | Uso |
|-------|-----|-----|
| Azul institucional | `#16345C` | Header, títulos, botones secundarios |
| Naranja acento | `#F26B1D` | CTAs, precios, resaltados |
| Gris neutro | `#7F8C9A` | Texto secundario |
| Fondo | `#F5F7FA` | Background general |

---

**TEDIGSA S.A.** — Tecnología · Innovación · Vanguardia
