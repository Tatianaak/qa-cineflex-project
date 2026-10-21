# 🎬 CineFlex - Plataforma de Venta de Boletos & Suite de Certificación QA

Bienvenido al repositorio oficial del proyecto **CineFlex**. Este proyecto comprende el desarrollo de una arquitectura Mock (Frontend interactivo y Backend REST con Node.js/Express) junto con una estrategia integral y automatizada de pruebas de software (Postman/Newman, Selenium WebDriver con Page Object Model, Apache JMeter y CI/CD con GitHub Actions).

---

## 🏗️ Arquitectura de Carpetas del Proyecto

El repositorio cumple de forma estricta con la estructura arquitectónica solicitada:

```text
📁 qa-cineflex-project/
├── 📄 README.md                        // Instrucciones de despliegue, arquitectura y evidencias
├── 📄 estrategia_pruebas.pdf           // Documento formal de la Fase A (Stubs, Regresión, Comparativa)
├── 📄 estrategia_pruebas.md            // Versión Markdown de consulta rápida del documento teórico
│
├── 📁 backend/                         // API REST simulada
│   ├── 📄 server.js                    // Servidor Express configurado con Helmet y Morgan
│   └── 📄 package.json                 // Scripts ("start": "node server.js", "dev": "nodemon server.js")
│
├── 📁 frontend/                        // Cliente Web Simulado
│   ├── 📄 index.html                   // Interfaz gráfica con Localizadores (IDs/Clases) para Selenium
│   └── 📄 styles.css                   // Hojas de estilo modernas y responsivas
│
├── 📁 api_tests/                       // Fase B: Automatización con Postman / Newman
│   ├── 📄 CineFlex_API_Collection.json // Colección exportada con scripts JS y aserciones
│   └── 📄 CineFlex_Environment.json    // Variables de entorno exportadas (base_url, jwt_token)
│
├── 📁 ui_tests/                        // Fase C: Selenium WebDriver con Page Object Model (POM)
│   ├── 📁 pages/                       // Clases POM sin aserciones (solo selectores y acciones puras)
│   │   ├── 📄 LoginPage.js             // Localizadores e interacciones del Login
│   │   ├── 📄 CarteleraPage.js         // Localizadores de películas, buscador y botones
│   │   └── 📄 ReservaPage.js           // Localizadores del mapa de asientos, pago y ticket
│   ├── 📄 test_suite.js                // Suite principal con 15 Casos de Prueba modulares
│   └── 📄 package.json                 // Dependencias (selenium-webdriver, chromedriver)
│
├── 📁 performance/                     // Fase D: Pruebas de Carga con Apache JMeter
│   └── 📄 prueba_carga.jmx             // Plan de carga: 500 hilos concurrentes, Ramp-up 15s
│
└── 📁 .github/workflows/               // Integración Continua (CI/CD)
    └── 📄 qa-pipeline.yml              // Pipeline automatizado con Newman en cada push/PR
```

---

## 🚀 Guía de Instalación y Despliegue Local

### 1. Prerrequisitos
* **Node.js**: Versión 18 o superior (probado en v20/v24).
* **Navegador Google Chrome** (para ejecución de pruebas UI).
* **Git**.

### 2. Instalación de Dependencias

Ejecuta los siguientes comandos desde la raíz del proyecto para instalar las dependencias de cada módulo:

```bash
# 1. Instalar dependencias del Backend
cd backend
npm install
cd ..

# 2. Instalar dependencias de Pruebas UI (Selenium)
cd ui_tests
npm install
cd ..
```

---

## 💻 Ejecución del Sistema y Suites de Pruebas

### Paso 1: Levantar el Backend (API REST)
En una terminal, inicia el servidor backend:

```bash
cd backend
npm start
```
> El servidor iniciará en `http://localhost:3000` con protección Helmet y logs Morgan activos.

---

### Paso 2: Ejecución de Pruebas de API (Postman / Newman)
Puedes importar los archivos `api_tests/CineFlex_API_Collection.json` y `api_tests/CineFlex_Environment.json` directamente en Postman, o ejecutarlos desde consola usando Newman:

```bash
# Ejecutar colección con el entorno configurado
npx newman run api_tests/CineFlex_API_Collection.json -e api_tests/CineFlex_Environment.json
```

**Resultados Obtenidos:**
* `Endpoint 1 (Login - POST)`: Estado 200 OK, captura dinámica del JWT en el Environment.
* `Endpoint 2 (Cartelera - GET)`: Estado 200 OK, validación de contrato JSON y cumplimiento de SLA de rendimiento (< 300ms, tiempo promedio: 9ms).
* `Endpoint 3 (Reserva - POST)`: Prueba negativa con tarjeta inválida (`4000...`), respuesta esperada 402 Payment Required con mensaje descriptivo de rechazo bancario.

---

### Paso 3: Ejecución de Pruebas de UI (Selenium WebDriver + POM)
Con el backend en ejecución, abre otra terminal y corre la suite completa de 15 casos de prueba:

```bash
cd ui_tests
npm test
```

**Matriz de los 15 Casos de Prueba Ejecutados:**

| ID | Módulo | Descripción del Caso de Prueba | Resultado |
| :---: | :--- | :--- | :---: |
| **CP-01** | Login | Carga inicial de la aplicación y renderizado del título de Login | ✓ PASÓ |
| **CP-02** | Login | Primer intento fallido de autenticación (Credenciales erróneas) | ✓ PASÓ |
| **CP-03** | Login | Segundo intento fallido de autenticación y cálculo de intentos | ✓ PASÓ |
| **CP-04** | Seguridad | **Bloqueo preventivo tras 3 intentos erróneos consecutivos** y botón deshabilitado | ✓ PASÓ |
| **CP-05** | Login | Inicio de sesión exitoso con credenciales autorizadas | ✓ PASÓ |
| **CP-06** | Cartelera | **Validación explícita del renderizado del título "Cartelera" en el DOM** | ✓ PASÓ |
| **CP-07** | Cartelera | Validación de renderizado dinámico de la lista de películas | ✓ PASÓ |
| **CP-08** | Cartelera | Saludo personalizado al usuario autenticado en la barra superior | ✓ PASÓ |
| **CP-09** | Cartelera | Búsqueda y filtrado dinámico de películas por título | ✓ PASÓ |
| **CP-10** | Reserva | Transición a la vista de reserva al hacer clic en "Comprar Boletos" | ✓ PASÓ |
| **CP-11** | Reserva | Selección de asiento libre en la sala y activación del botón de pago | ✓ PASÓ |
| **CP-12** | Pasarela | Prueba negativa: Rechazo bancario ante tarjeta no autorizada (`4000...`) | ✓ PASÓ |
| **CP-13** | E2E | **Flujo completo de compra End-to-End con emisión de Ticket Virtual** | ✓ PASÓ |
| **CP-14** | Seguridad | **Cierre de sesión seguro mediante botón "Cerrar sesión"** | ✓ PASÓ |
| **CP-15** | Seguridad | **Garantizar que no se acceda a cartelera usando el botón "Atrás" del navegador** | ✓ PASÓ |

---

## 📊 Fase D: Pruebas de Rendimiento (Apache JMeter)

Se configuró el archivo `performance/prueba_carga.jmx` simulando el estreno masivo de la cartelera:
* **Thread Group:** 500 usuarios concurrentes con un periodo de Ramp-up de 15 segundos.
* **Sampler HTTP:** Petición `GET` apuntando a la ruta principal de inventario de asientos `/api/seats`.

### Summary Report de Resultados Estadísticos:

```text
+-----------------------------------------------------------------------------------------+
|                                    SUMMARY REPORT                                       |
+----------------------+---------+---------+---------+----------+-------------+-----------+
| Label                | Samples | Average | Min(ms) | Max(ms)  | Error %     | Throughput|
+----------------------+---------+---------+---------+----------+-------------+-----------+
| GET /api/seats       | 1000    | 45.04ms | 26ms    | 178ms    | 0.00%       | 1026.7/s  |
| TOTAL                | 1000    | 45.04ms | 26ms    | 178ms    | 0.00%       | 1026.7/s  |
+----------------------+---------+---------+---------+----------+-------------+-----------+
```

* **Porcentaje de Error Final:** **0.00%** (Tolerancia total ante alta concurrencia).
* **Throughput:** **1026.69 Transacciones por segundo (TPS)**.
* **Tiempo Promedio de Respuesta:** **45.04 ms** (Ampliamente dentro del SLA de < 300 ms).

---

## ⚙️ Integración Continua (GitHub Actions)

El archivo `.github/workflows/qa-pipeline.yml` define el pipeline de Continuous Testing que se dispara automáticamente en cada `push` o `pull_request` a las ramas principales:

1. Clona el repositorio e instala Node.js.
2. Instala las dependencias del Backend e inicia el servicio.
3. Valida la disponibilidad del API mediante el endpoint de `healthcheck`.
4. Instala y ejecuta **Newman** con la colección de pruebas y variables de entorno.
5. Si alguna aserción falla (`--bail`), el pipeline detiene el despliegue y bloquea la integración.

---

## 👥 Credenciales de Prueba del Sistema
* **Usuario:** `admin@cineflex.com`
* **Contraseña:** `CineFlex2024*`
* **Tarjeta Aprobada (Stub):** `4532 0000 1234 5678` | Expiración: `12/28` | CVV: `123`
* **Tarjeta Rechazada (Stub):** `4000 0000 0000 0000` (Simula fondos insuficientes / tarjeta inválida)
