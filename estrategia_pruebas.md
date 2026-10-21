# DOCUMENTO DE ARQUITECTURA Y ESTRATEGIA DE PRUEBAS - CINEFLIX
**Firma Consultora de QA:** QA Solutions CineFlex  
**Proyecto:** CineFlex (Plataforma Web de Venta de Boletos de Cine)  
**Entregable:** Fase A - Estrategia de Pruebas

---

## 1. Pruebas de Integración (Stubs y Drivers)

### Contexto del Problema
El equipo de Frontend ha finalizado la interfaz gráfica de pagos y el Backend ya expone el endpoint correspondiente para procesar la transacción (`POST /api/reservations`). No obstante, la entidad bancaria externa encargada de la pasarela de pagos no ha otorgado acceso a su API en el ambiente de pruebas.

### Enfoque de Integración Seleccionado: Top-Down
Para abordar esta situación crítica y no frenar el ciclo de entregas ni las pruebas de aceptación, se adopta un **enfoque de integración Top-Down (de arriba hacia abajo)**.
* **Justificación técnica:** Las capas superiores (Frontend y la lógica de negocio en el Backend) ya se encuentran desarrolladas y funcionales. Como el módulo faltante es la dependencia externa en el nivel más bajo (el servicio bancario de terceros), se requiere implementar un **Stub** que simule el comportamiento de dicho servicio. Si se usara Bottom-Up, tendríamos que esperar a construir o tener drivers para capas inferiores inexistentes, lo cual detendría la validación del flujo de usuario.

### Diseño y Programación del Stub
El Stub bancario se programa directamente dentro del controlador de reservas del Backend simulado (`backend/server.js`), interceptando la petición de pago antes de invocar la red externa:

1. **Entrada de Datos:** Recibe el objeto `payment` con número de tarjeta, titular, expiración y CVV.
2. **Lógica de Simulación Determinista:**
   * **Caso Rechazado (Tarjeta falsa / fondos insuficientes):** Si el número de tarjeta inicia con el prefijo `4000` o posee una longitud menor a 16 dígitos, el Stub emite inmediatamente una respuesta HTTP `402 Payment Required` con el mensaje:
     `{"success": false, "errorCode": "PAYMENT_REJECTED", "message": "Transacción rechazada por el banco: Tarjeta inválida o fondos insuficientes"}`.
   * **Caso Exitoso (Tarjeta autorizada):** Si la tarjeta cumple el formato estándar (por ejemplo, tarjetas Visa que comienzan por `4532`), el Stub retorna HTTP `201 Created` simulando la aprobación de la pasarela y expidiendo un identificador único de ticket (`TICK-XXXXXX`).
3. **Ventaja:** Permite ejecutar inmediatamente todas las pruebas funcionales, automatizadas (Selenium) y de API (Postman) sin depender de la pasarela real ni generar cobros bancarios reales.

---

## 2. Pruebas de Sistema y Regresión

### Requisitos Funcionales Clave
* **RF-01 (Búsqueda y filtrado):** El sistema debe permitir al usuario autenticado buscar y filtrar dinámicamente películas por título en tiempo real desde la cartelera.
* **RF-02 (Selección y bloqueo de asientos):** El sistema debe permitir al usuario seleccionar únicamente asientos en estado "disponible", calculando el valor total de la orden y bloqueando dicho asiento para compras concurrentes.

### Requisitos No Funcionales Clave
* **RNF-01 (Rendimiento SLA en API):** El endpoint de consulta de cartelera (`GET /api/movies`) debe responder con un tiempo de latencia inferior a **300 milisegundos** bajo condiciones normales de carga.
* **RNF-02 (Seguridad Perimetral y Control de Acceso):** El sistema debe implementar protección contra ataques de fuerza bruta, bloqueando preventivamente el acceso a cualquier usuario que ingrese credenciales erróneas **3 veces consecutivas**.

### Estrategia de Regresión y Criterio de Selección de Casos
**Pregunta:** *Si un desarrollador cambia el color de un botón secundario en la vista del perfil, ¿se debe volver a ejecutar toda la suite de pruebas de la pasarela de pagos?*

* **Decisión:** **NO se debe ejecutar la suite completa de pagos.**
* **Justificación técnica:** 
  Ejecutar la suite completa para cualquier cambio menor (como una modificación estética de CSS en un botón secundario) representa un desperdicio significativo de tiempo de cómputo, recursos de infraestructura CI/CD y retrasa el feedback a los desarrolladores.
* **Criterio de Selección Basado en Análisis de Impacto (Risk-Based Testing):**
  1. **Smoke / Sanity Test en UI:** Se ejecuta una prueba de humo focalizada sobre la vista de perfil para constatar que el botón mantenga su contraste accesible, su texto y su acción funcional básica.
  2. **Matriz de Trazabilidad y Dependencias:** Como el cambio cosmético no altera contratos de API, bases de datos ni el flujo transaccional de pagos, los casos de prueba de la pasarela bancaria quedan catalogados como de **impacto nulo**.
  3. **Regresión Programada:** La suite pesada de pagos End-to-End se reserva únicamente para cambios que toquen el checkout, endpoints de reserva o despliegues nocturnos previos a releases mayores (Nightly Build).

---

## 3. Comparativa de Herramientas: Selenium WebDriver vs. Cypress

| Criterio Técnico | Selenium WebDriver | Cypress |
| :--- | :--- | :--- |
| **Arquitectura de Ejecución** | Fuera del navegador mediante controladores nativos (JSON Wire / W3C WebDriver). | Se ejecuta dentro del mismo bucle de eventos del navegador (in-browser execution). |
| **Soporte Multi-Pestaña y Multi-Ventana** | Soporte total nativo para múltiples pestañas, ventanas emergentes y dominios cruzados. | Limitado de forma nativa para flujos multi-dominio o manipulación de múltiples pestañas simultáneas. |
| **Soporte de Navegadores y Lenguajes** | Chrome, Firefox, Safari, Edge. Múltiples lenguajes: JavaScript, Java, Python, C#, Ruby. | Principalmente JavaScript / TypeScript y navegadores basados en Chromium / Firefox. |
| **Velocidad y Depuración** | Moderada. Requiere sincronizaciones y esperas explícitas bien diseñadas. | Muy rápida con recarga en caliente, time-travel debugging y capturas automáticas. |
| **Escenario de Negocio Recomendado en CineFlex** | **Recomendado para la navegación segura y flujos cross-origin:** Por ejemplo, validar la redirección a una pasarela bancaria externa o verificar que al pulsar "Atrás" en el historial del navegador no se recupere la sesión tras el logout. | **Recomendado para el desarrollo interactivo de componentes UI:** Por ejemplo, validar en tiempo real el renderizado de los 15 asientos, cambios de color CSS al dar clic y filtrado reactivo del buscador. |
