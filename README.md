# 📦 Sistema de Gestión de Inventario

Sistema web completo para la gestión de productos, proveedores, distribución, clientes y ventas, desarrollado como proyecto universitario para el curso de Sistemas de Bases de Datos.

---

## 📋 Descripción

Este sistema permite administrar el inventario de una empresa de forma digital. Registra productos, proveedores, las relaciones entre ellos (distribución), clientes y las ventas de mercancía. Incluye autenticación de usuarios, integración con dos bases de datos (SQL Server y MySQL), reportes con consultas JOIN, exportación a Excel y PDF, y visualización de datos mediante gráficos.

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
- El stock se actualiza automáticamente según entradas (distribución) y ventas

### 🏢 Módulo de Proveedores
- Crear, editar y eliminar proveedores
- Campos: nombre, teléfono, correo electrónico y dirección

### 🔄 Módulo de Distribución (Entradas de Mercancía)
- Asignar productos a proveedores con cantidad suministrada
- Al registrar una distribución, el stock del producto **aumenta automáticamente**
- Al eliminar una distribución, el stock **disminuye automáticamente**
- Si ya existe la relación producto-proveedor, la cantidad se acumula

### 👥 Módulo de Clientes *(MySQL)*
- Crear, editar y eliminar clientes almacenados en **MySQL**
- Los datos del cliente se guardan en formato **JSON** dentro del campo `datos_cliente`
- Campos: NIT, nombre, dirección, teléfono, correo
- Base de datos independiente de SQL Server (`db_clientes`)

### 🛒 Módulo de Ventas
- Requiere ingresar el **NIT del cliente** antes de registrar la venta
- Consulta automáticamente en **MySQL** si el cliente existe
- Muestra los datos del cliente (nombre, dirección, teléfono, correo) antes de confirmar
- Si el cliente no existe en MySQL, bloquea el registro y sugiere registrarlo primero
- Valida stock suficiente antes de registrar la venta
- El stock del producto **disminuye automáticamente** al registrar una venta
- Historial completo de ventas con NIT del cliente y fecha

### 📊 Módulo de Reportes
- **Stock bajo:** productos con stock por debajo de un límite configurable
- **Productos por fecha:** filtrar productos ingresados en un rango de fechas
- **Salidas por fecha:** filtrar ventas registradas en un rango de fechas
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
| mysql2 | Conexión a MySQL |
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

### Bases de Datos
| Motor | Base de datos | Uso |
|-------|--------------|-----|
| SQL Server | `db_proyecto1` | Productos, proveedores, distribución, ventas, usuarios |
| MySQL | `db_clientes` | Clientes con datos en formato JSON |

---

## 🗄️ Estructura de las Bases de Datos

### SQL Server — `db_proyecto1`
```sql
tb_productos       (id_producto, nombre_producto, descripcion, precio, stock, fecha_ingreso)
tb_proveedores     (id_proveedor, nombre_proveedor, telefono, correo_electronico, direccion)
tb_producto_proveedor (id_producto, id_proveedor, cantidad_suministrada)
tb_salida_productos   (IdSalida, IdProducto, Cantidad, NIT_Cliente, FechaSalida)
tb_usuarios           (IdUsuario, NombreUsuario, Contrasena, CorreoElectronico, FechaRegistro)
```

### MySQL — `db_clientes`
```sql
clientes (id, datos_cliente JSON)

-- Ejemplo del contenido de datos_cliente:
-- {"nit":"123456789","nombre":"Juan Pérez","direccion":"Calle 123","telefono":"5551234","correo":"juan@gmail.com"}
```

---

## 📁 Estructura del Proyecto

```
proyecto1/
├── backend/
│   ├── config/
│   │   ├── db.js                  ← Conexión a SQL Server
│   │   └── dbMysql.js             ← Conexión a MySQL
│   ├── middleware/
│   │   └── authMiddleware.js      ← Verificación de JWT
│   ├── routes/
│   │   ├── auth.js                ← Login y registro
│   │   ├── productos.js           ← CRUD de productos
│   │   ├── proveedores.js         ← CRUD de proveedores
│   │   ├── distribucion.js        ← Asignación + control de stock
│   │   ├── clientes.js            ← CRUD de clientes (MySQL)
│   │   ├── salidas.js             ← Registro de ventas
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
        ├── clientes.html          ← Gestión de clientes (MySQL)
        ├── salidas.html           ← Ventas con verificación de cliente
        └── reportes.html
```

---

## ⚙️ Instalación y Configuración

### Prerrequisitos
- [Node.js](https://nodejs.org/) v18 o superior
- SQL Server instalado localmente (puerto 1433)
- MySQL instalado localmente (puerto 3306)
- [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) (extensión de VS Code)

### 1. Clonar el repositorio

```bash
git clone https://github.com/Emanuel-Iglesias/poryecto1_SistemasBasesDatos.git
cd poryecto1_SistemasBasesDatos
```

### 2. Configurar SQL Server

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
    NIT_Cliente VARCHAR(20) NULL,
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

### 3. Configurar MySQL

Ejecutar en **MySQL Workbench**:

```sql
CREATE DATABASE IF NOT EXISTS db_clientes;
USE db_clientes;

CREATE TABLE IF NOT EXISTS clientes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    datos_cliente JSON NOT NULL
);

-- Datos de prueba
INSERT INTO clientes (datos_cliente) VALUES
('{"nit":"123456789","nombre":"Juan Pérez","direccion":"Calle 123","telefono":"5551234","correo":"juan@gmail.com"}'),
('{"nit":"987654321","nombre":"María López","direccion":"Avenida 456","telefono":"5559876","correo":"maria@gmail.com"}');
```

### 4. Configurar variables de entorno

Crear el archivo `backend/.env`:

```env
DB_USER=sa
DB_PASSWORD=tu_contraseña_sqlserver
DB_SERVER=localhost
DB_NAME=db_proyecto1
DB_PORT=1433
PORT=3000
JWT_SECRET=proyecto1_secret_key_2024
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=tu_contraseña_mysql
MYSQL_DATABASE=db_clientes
```

> ⚠️ El archivo `.env` no está incluido en el repositorio por seguridad. Debes crearlo manualmente.

### 5. Instalar dependencias

```bash
cd backend
npm install
```

### 6. Iniciar el servidor

```bash
node server.js
```

Deberías ver:
```
🚀 Servidor corriendo en http://localhost:3000
✅ Conectado a SQL Server
✅ Conectado a MySQL
```

### 7. Iniciar el frontend

Abrir `frontend/pages/login.html` con **Live Server** desde VS Code.

---

## 🔑 Uso del Sistema

1. Ir a `login.html` y **crear una cuenta**
2. **Iniciar sesión**
3. Desde el **Panel Principal** navegar a cualquier módulo:

| Módulo | Qué hacer ahí |
|--------|--------------|
| **Productos** | Registrar artículos del inventario |
| **Proveedores** | Registrar empresas proveedoras |
| **Distribución** | Asignar proveedor a producto → stock **sube** |
| **Clientes** | Registrar clientes con su NIT (guardado en MySQL) |
| **Ventas** | Ingresar NIT → sistema verifica cliente en MySQL → registrar venta → stock **baja** |
| **Reportes** | Consultar datos, ver gráficos, exportar Excel/PDF |

---

## 🔗 Integración de Bases de Datos

El sistema conecta simultáneamente a **dos motores de base de datos**:

- **SQL Server** maneja toda la lógica del inventario: productos, proveedores, distribución, ventas y usuarios
- **MySQL** almacena los clientes en formato JSON usando el campo `datos_cliente`

Al registrar una venta, el sistema consulta automáticamente MySQL con la función `JSON_EXTRACT`:

```sql
SELECT datos_cliente FROM clientes
WHERE JSON_EXTRACT(datos_cliente, '$.nit') = '123456789'
```

Si el cliente existe, muestra su información completa. Si no existe, bloquea la venta y solicita registrar al cliente primero.

---

## 🔒 Seguridad

- Contraseñas encriptadas con **bcrypt** (10 rondas de salt)
- Sesiones con **JWT** de expiración en **8 horas**
- Todas las rutas del backend verifican el token
- El archivo `.env` está excluido del repositorio mediante `.gitignore`

---

## 👨‍💻 Autor

**Emanuel Iglesias**  
Estudiante de Ingeniería en Sistemas  
Curso: Sistemas de Bases de Datos

---

## 📄 Licencia

Este proyecto fue desarrollado con fines académicos.