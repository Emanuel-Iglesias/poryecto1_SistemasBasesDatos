# 📦 Sistema de Gestión de Inventario

Sistema web completo para la gestión de productos, proveedores, distribución y salidas de inventario, desarrollado como proyecto universitario para el curso de Sistemas de Bases de Datos.

---

## 📋 Descripción

Este sistema permite administrar el inventario de una empresa de forma digital. Registra productos, proveedores, las relaciones entre ellos (distribución), y las salidas de mercancía. Incluye autenticación de usuarios, reportes con consultas JOIN, exportación a Excel y PDF, y visualización de datos mediante gráficos.

---

## 🚀 Funcionalidades

### 🔐 Módulo de Autenticación
- Registro de nuevos usuarios con validación de datos
- Inicio de sesión con verificación de credenciales
- Contraseñas encriptadas con **bcrypt**
- Sesiones protegidas mediante **JSON Web Tokens (JWT)**
- Todas las rutas del sistema requieren sesión activa

### 📦 Módulo de Productos
- Crear, editar y eliminar productos
- Campos: nombre, descripción, precio, stock y fecha de ingreso
- Indicador visual de stock bajo (badge rojo cuando stock < 10)
- El stock se actualiza automáticamente según entradas (distribución) y salidas

### 🏢 Módulo de Proveedores
- Crear, editar y eliminar proveedores
- Campos: nombre, teléfono, correo electrónico y dirección

### 🔄 Módulo de Distribución (Entradas de Mercancía)
- Asignar productos a proveedores con cantidad suministrada
- Al registrar una distribución, el stock del producto **aumenta automáticamente**
- Al eliminar una distribución, el stock **disminuye automáticamente**
- Si ya existe la relación producto-proveedor, la cantidad se acumula

### ⬇️ Módulo de Salidas de Productos
- Registrar retiro de productos del inventario
- Validación de stock suficiente antes de registrar la salida
- El stock del producto **disminuye automáticamente** al registrar una salida
- Historial completo de salidas con fecha y producto

### 📊 Módulo de Reportes
- **Stock bajo:** productos con stock por debajo de un límite configurable
- **Productos por fecha:** filtrar productos ingresados en un rango de fechas
- **Salidas por fecha:** filtrar salidas registradas en un rango de fechas
- **INNER JOIN:** productos que tienen proveedor asignado
- **LEFT JOIN:** todos los productos con o sin proveedor
- **RIGHT JOIN:** todos los proveedores con o sin productos
- **Gráfico de barras:** cantidad suministrada por proveedor (Chart.js)
- **Exportar a Excel:** reporte con 4 hojas (Productos, Proveedores, Distribución, Stock Bajo)
- **Exportar a PDF:** reporte completo con portada y tablas formateadas

---

## 🛠️ Tecnologías Utilizadas

### Backend
| Tecnología | Uso |
|-----------|-----|
| Node.js | Entorno de ejecución |
| Express.js 5 | Framework del servidor |
| mssql | Conexión a SQL Server |
| bcrypt | Encriptación de contraseñas |
| jsonwebtoken | Autenticación con JWT |
| exceljs | Generación de archivos Excel |
| pdfkit | Generación de archivos PDF |
| dotenv | Variables de entorno |
| cors | Manejo de CORS |

### Frontend
| Tecnología | Uso |
|-----------|-----|
| HTML5 / CSS3 | Estructura y estilos |
| JavaScript (vanilla) | Lógica del cliente |
| Bootstrap 5.3 | Componentes UI y diseño responsive |
| Bootstrap Icons | Iconografía |
| Chart.js | Gráfico de barras interactivo |

### Base de Datos
| Tecnología | Uso |
|-----------|-----|
| SQL Server (local) | Motor de base de datos |
| Puerto 1433 | Conexión estándar |

---

## 🗄️ Estructura de la Base de Datos

```sql
-- Productos
tb_productos (id_producto, nombre_producto, descripcion, precio, stock, fecha_ingreso)

-- Proveedores
tb_proveedores (id_proveedor, nombre_proveedor, telefono, correo_electronico, direccion)

-- Relación Producto-Proveedor (Distribución)
tb_producto_proveedor (id_producto, id_proveedor, cantidad_suministrada)

-- Salidas de Productos
tb_salida_productos (IdSalida, IdProducto, Cantidad, FechaSalida)

-- Usuarios del Sistema
tb_usuarios (IdUsuario, NombreUsuario, Contrasena, CorreoElectronico, FechaRegistro)
```

---

## 📁 Estructura del Proyecto

```
proyecto1/
├── backend/
│   ├── config/
│   │   └── db.js                  ← Conexión a SQL Server
│   ├── middleware/
│   │   └── authMiddleware.js      ← Verificación de JWT
│   ├── routes/
│   │   ├── auth.js                ← Login y registro
│   │   ├── productos.js           ← CRUD de productos
│   │   ├── proveedores.js         ← CRUD de proveedores
│   │   ├── distribucion.js        ← Asignación + control de stock
│   │   ├── salidas.js             ← Registro de salidas
│   │   └── reportes.js            ← Consultas, JOINs, Excel, PDF
│   ├── .env                       ← Variables de entorno (no incluido en el repo)
│   └── server.js                  ← Punto de entrada del servidor
│
└── frontend/
    ├── css/
    │   └── styles.css             ← Estilos globales (tema oscuro glassmorphism)
    ├── js/
    │   ├── auth.js                ← Helper de autenticación (token, headers)
    │   ├── productos.js
    │   ├── proveedores.js
    │   ├── distribucion.js
    │   └── reportes.js
    └── pages/
        ├── login.html             ← Inicio de sesión y registro
        ├── index.html             ← Panel principal
        ├── productos.html
        ├── proveedores.html
        ├── distribucion.html
        ├── salidas.html
        └── reportes.html
```

---

## ⚙️ Instalación y Configuración

### Prerrequisitos
- [Node.js](https://nodejs.org/) v18 o superior
- SQL Server instalado localmente (puerto 1433)
- [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) (extensión de VS Code) para el frontend

### 1. Clonar el repositorio

```bash
git clone https://github.com/Emanuel-Iglesias/poryecto1_SistemasBasesDatos.git
cd poryecto1_SistemasBasesDatos
```

### 2. Configurar la base de datos

Ejecutar en **SQL Server Management Studio**:

```sql
CREATE DATABASE db_proyecto1;
USE db_proyecto1;

CREATE TABLE tb_productos (
    id_producto     INT PRIMARY KEY IDENTITY(1,1),
    nombre_producto VARCHAR(100)  NOT NULL,
    descripcion     TEXT          NULL,
    precio          DECIMAL(10,2) NOT NULL,
    stock           INT           NOT NULL,
    fecha_ingreso   DATETIME      NOT NULL DEFAULT GETDATE()
);

CREATE TABLE tb_proveedores (
    id_proveedor       INT PRIMARY KEY IDENTITY(1,1),
    nombre_proveedor   VARCHAR(100) NOT NULL,
    telefono           VARCHAR(15)  NULL,
    correo_electronico VARCHAR(100) NULL,
    direccion          VARCHAR(255) NULL
);

CREATE TABLE tb_producto_proveedor (
    id_producto           INT NOT NULL,
    id_proveedor          INT NOT NULL,
    cantidad_suministrada INT NOT NULL,
    PRIMARY KEY (id_producto, id_proveedor),
    CONSTRAINT fk_pp_producto  FOREIGN KEY (id_producto)
        REFERENCES tb_productos(id_producto)  ON DELETE CASCADE,
    CONSTRAINT fk_pp_proveedor FOREIGN KEY (id_proveedor)
        REFERENCES tb_proveedores(id_proveedor) ON DELETE CASCADE
);

CREATE TABLE tb_salida_productos (
    IdSalida    INT PRIMARY KEY IDENTITY(1,1),
    IdProducto  INT NOT NULL,
    Cantidad    INT NOT NULL CHECK (Cantidad > 0),
    FechaSalida DATETIME DEFAULT GETDATE(),
    CONSTRAINT fk_salida_producto FOREIGN KEY (IdProducto)
        REFERENCES tb_productos(id_producto) ON DELETE CASCADE
);

CREATE TABLE tb_usuarios (
    IdUsuario         INT          PRIMARY KEY IDENTITY(1,1),
    NombreUsuario     VARCHAR(50)  UNIQUE NOT NULL,
    Contrasena        VARCHAR(255) NOT NULL,
    CorreoElectronico VARCHAR(100) UNIQUE NOT NULL,
    FechaRegistro     DATETIME     DEFAULT GETDATE()
);
```

### 3. Configurar variables de entorno

Crear el archivo `backend/.env` con el siguiente contenido:

```env
DB_USER=sa
DB_PASSWORD=tu_contraseña_aqui
DB_SERVER=localhost
DB_NAME=db_proyecto1
DB_PORT=1433
PORT=3000
JWT_SECRET=proyecto1_secret_key_2024
```

> ⚠️ El archivo `.env` no está incluido en el repositorio por seguridad. Debes crearlo manualmente.

### 4. Instalar dependencias del backend

```bash
cd backend
npm install
```

### 5. Iniciar el servidor

```bash
node server.js
```

Deberías ver en la consola:
```
🚀 Servidor corriendo en http://localhost:3000
✅ Conectado a SQL Server
```

### 6. Iniciar el frontend

Abrir `frontend/pages/login.html` con **Live Server** desde VS Code (clic derecho → *Open with Live Server*).

---

## 🔑 Uso del Sistema

1. Ir a `login.html` y **crear una cuenta** con el formulario de registro
2. **Iniciar sesión** con las credenciales registradas
3. Desde el **Panel Principal** navegar a cualquier módulo:

| Módulo | Qué hacer ahí |
|--------|--------------|
| **Productos** | Registrar los artículos del inventario (el stock empieza en 0) |
| **Proveedores** | Registrar las empresas que suministran los productos |
| **Distribución** | Asignar qué proveedor suministra qué producto y en qué cantidad → el stock **sube** |
| **Salidas** | Registrar cuando se retira mercancía del almacén → el stock **baja** |
| **Reportes** | Consultar datos, ver gráficos y exportar a Excel o PDF |

---

## 🔒 Seguridad

- Las contraseñas se almacenan encriptadas con **bcrypt** (10 rondas de salt)
- Cada sesión genera un **JWT** con expiración de **8 horas**
- Todas las rutas del backend verifican el token antes de procesar cualquier solicitud
- Si el token expira, el sistema redirige automáticamente al login

---

## 👨‍💻 Autor

**Emanuel Iglesias**  
Estudiante de Ingeniería en Sistemas  
Curso: Sistemas de Bases de Datos

---

## 📄 Licencia

Este proyecto fue desarrollado con fines académicos.
