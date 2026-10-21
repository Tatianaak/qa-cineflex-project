// Suite principal de pruebas automatizadas UI con Selenium WebDriver
// Implementa 15 Casos de Prueba modulares aplicando Page Object Model (POM)
// Ejecución secuencial con aserciones centralizadas en este archivo.

const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const assert = require('assert');
const path = require('path');

const LoginPage = require('./pages/LoginPage');
const CarteleraPage = require('./pages/CarteleraPage');
const ReservaPage = require('./pages/ReservaPage');

// Ruta local del frontend
const FRONTEND_URL = 'file:///' + path.resolve(__dirname, '../frontend/index.html').replace(/\\/g, '/');

// Helper para reiniciar intentos en el backend antes de comenzar
async function resetBackendState() {
  try {
    const http = require('http');
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/reset-attempts',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    req.write(JSON.stringify({}));
    req.end();
  } catch (e) {
    // Si el backend no esta encendido o esta en otro puerto
  }
}

async function runTestSuite() {
  console.log('===============================================================');
  console.log('   INICIANDO SUITE DE PRUEBAS AUTOMATIZADAS CINEFLEX (15 CPs)  ');
  console.log('   Patrón: Page Object Model (POM) | Driver: Chrome Headless   ');
  console.log('===============================================================\n');

  await resetBackendState();

  const options = new chrome.Options();
  options.addArguments('--headless=new');
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');
  options.addArguments('--window-size=1280,800');

  let driver;
  let passedTests = 0;
  let failedTests = 0;

  try {
    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();

    const loginPage = new LoginPage(driver);
    const carteleraPage = new CarteleraPage(driver);
    const reservaPage = new ReservaPage(driver);

    // Helper para formatear resultados de pruebas
    async function ejecutarCaso(id, nombre, testFn) {
      try {
        process.stdout.write(`[EJECUTANDO] CP-${id}: ${nombre}... `);
        await testFn();
        console.log('✓ PASÓ');
        passedTests++;
      } catch (err) {
        console.log(`✗ FALLÓ`);
        console.error(`   Error en CP-${id}: ${err.message}`);
        failedTests++;
      }
    }

    // -------------------------------------------------------------
    // BLOQUE 1: PRUEBAS DE ACCESO, INTENTOS FALLIDOS Y BLOQUEO
    // -------------------------------------------------------------

    await ejecutarCaso('01', 'Carga inicial de la aplicación y vista de Login', async () => {
      await driver.get(FRONTEND_URL);
      const titulo = await loginPage.obtenerTitulo();
      assert.strictEqual(titulo, 'Iniciar Sesión', 'El título de login debe renderizarse correctamente');
    });

    await ejecutarCaso('02', 'Primer intento fallido de autenticación (Credencial errónea 1)', async () => {
      await loginPage.ingresarCredenciales('usuario1@test.com', 'ClaveInvalida1');
      const alerta = await loginPage.obtenerMensajeAlerta();
      assert(alerta.includes('Credenciales incorrectas'), 'Debe mostrar advertencia de credenciales incorrectas');
    });

    await ejecutarCaso('03', 'Segundo intento fallido de autenticación (Credencial errónea 2)', async () => {
      await loginPage.ingresarCredenciales('usuario1@test.com', 'ClaveInvalida2');
      const alerta = await loginPage.obtenerMensajeAlerta();
      assert(alerta.includes('Intentos restantes: 1') || alerta.includes('incorrectas'), 'Debe contabilizar el segundo fallo');
    });

    await ejecutarCaso('04', 'Bloqueo preventivo del sistema tras 3 intentos erróneos consecutivos', async () => {
      await loginPage.ingresarCredenciales('usuario1@test.com', 'ClaveInvalida3');
      const alerta = await loginPage.obtenerMensajeAlerta();
      const botonBloqueado = await loginPage.estaBotonDeshabilitado();
      assert(alerta.includes('Cuenta bloqueada'), 'Debe indicar que la cuenta ha sido bloqueada');
      assert.strictEqual(botonBloqueado, true, 'El botón de ingresar debe quedar deshabilitado');
    });

    // -------------------------------------------------------------
    // BLOQUE 2: AUTENTICACIÓN EXITOSA Y NAVEGACIÓN EN CARTELERA
    // -------------------------------------------------------------

    await ejecutarCaso('05', 'Inicio de sesión exitoso con credenciales autorizadas', async () => {
      // Recargar para limpiar bloqueo de prueba anterior
      await driver.get(FRONTEND_URL);
      await loginPage.ingresarCredenciales('admin@cineflex.com', 'CineFlex2024*');
      await driver.sleep(1000); // Esperar transicion de vista
      const visible = await carteleraPage.estaVisible();
      assert.strictEqual(visible, true, 'La sección de cartelera debe estar activa');
    });

    await ejecutarCaso('06', 'Validación explícita del renderizado del título "Cartelera"', async () => {
      const titulo = await carteleraPage.obtenerTitulo();
      assert.strictEqual(titulo, 'Cartelera', 'El elemento h1 debe contener exactamente el texto Cartelera');
    });

    await ejecutarCaso('07', 'Validación de carga de películas en la cartelera', async () => {
      await carteleraPage.esperarCargaPeliculas();
      const cantidad = await carteleraPage.obtenerCantidadPeliculas();
      assert(cantidad >= 3, `Debe haber al menos 3 películas renderizadas (obtenidas: ${cantidad})`);
    });

    await ejecutarCaso('08', 'Saludo personalizado con el nombre del usuario autenticado', async () => {
      const saludo = await carteleraPage.obtenerSaludoUsuario();
      assert(saludo.includes('Tatiana Gomez'), 'El navbar debe saludar al usuario autenticado');
    });

    await ejecutarCaso('09', 'Filtrado dinámico de películas por buscador', async () => {
      await carteleraPage.buscarPelicula('Avengers');
      await driver.sleep(300);
      const cantidad = await carteleraPage.obtenerCantidadPeliculas();
      assert.strictEqual(cantidad, 1, 'El filtro debe mostrar exactamente 1 película con el término Avengers');
      // Limpiar filtro
      await carteleraPage.buscarPelicula('');
      await driver.sleep(300);
    });

    // -------------------------------------------------------------
    // BLOQUE 3: SELECCIÓN DE ASIENTOS Y STUB DE PAGOS
    // -------------------------------------------------------------

    await ejecutarCaso('10', 'Transición a la vista de reserva al hacer clic en "Comprar Boletos"', async () => {
      await carteleraPage.hacerClicComprarPelicula(1);
      const tituloReserva = await reservaPage.obtenerTituloReserva();
      assert(tituloReserva.includes('Selección de Asientos'), 'Debe abrir la pantalla de selección de asientos');
    });

    await ejecutarCaso('11', 'Selección de un asiento libre en el mapa de la sala', async () => {
      await reservaPage.seleccionarAsiento('A1');
      const textoAsiento = await reservaPage.obtenerAsientoSeleccionadoTexto();
      const habilitado = await reservaPage.estaBotonPagoHabilitado();
      assert.strictEqual(textoAsiento, 'A1', 'El resumen debe indicar que se eligió el asiento A1');
      assert.strictEqual(habilitado, true, 'El botón de pago debe activarse tras elegir asiento');
    });

    await ejecutarCaso('12', 'Prueba negativa de pago: Rechazo bancario con tarjeta no autorizada (4000...)', async () => {
      await reservaPage.ingresarDatosPago('USUARIO PRUEBA', '4000123456789010', '08/27', '999');
      await reservaPage.hacerClicPagar();
      const errorMsg = await reservaPage.obtenerMensajeErrorPago();
      assert(errorMsg.includes('rechazada por el banco'), 'Debe mostrar el mensaje de rechazo de la pasarela bancaria');
    });

    await ejecutarCaso('13', 'Flujo de compra exitoso (End-to-End) con emisión de Ticket Virtual', async () => {
      // Ingresar tarjeta aprobada por el Stub
      await reservaPage.ingresarDatosPago('TATIANA GOMEZ', '4532888899991111', '12/28', '123');
      await reservaPage.hacerClicPagar();

      const tituloTicket = await reservaPage.obtenerTituloTicket();
      const codigoTicket = await reservaPage.obtenerCodigoTicket();
      const asientoConfirmado = await reservaPage.obtenerAsientoConfirmado();

      assert.strictEqual(tituloTicket, '¡Reserva Exitosa!', 'Debe confirmarse la pantalla de éxito');
      assert(codigoTicket.startsWith('TICK-'), 'El código del ticket debe tener el formato TICK-XXXXXX');
      assert.strictEqual(asientoConfirmado, 'A1', 'El ticket debe confirmar el asiento reservado');
    });

    // -------------------------------------------------------------
    // BLOQUE 4: NAVEGACIÓN SEGURA Y CONTROL DE SESIÓN
    // -------------------------------------------------------------

    await ejecutarCaso('14', 'Cierre de sesión seguro mediante botón "Cerrar sesión"', async () => {
      // Volver a cartelera para tener el navbar visible
      await reservaPage.hacerClicNuevoTicket();
      await carteleraPage.hacerClicCerrarSesion();

      const loginVisible = await loginPage.estaVisible();
      assert.strictEqual(loginVisible, true, 'Al cerrar sesión debe volver a la vista de login');
    });

    await ejecutarCaso('15', 'Navegación segura: Impedir acceso a Cartelera con botón "Atrás" tras logout', async () => {
      // Simular usuario presionando el botón "Atrás" del navegador
      await driver.navigate().back();
      await driver.sleep(500);

      const loginVisible = await loginPage.estaVisible();
      const carteleraVisible = await carteleraPage.estaVisible();

      assert.strictEqual(loginVisible, true, 'El usuario debe mantenerse en la pantalla de login');
      assert.strictEqual(carteleraVisible, false, 'La cartelera NO debe ser accesible tras cerrar sesión');
    });

  } finally {
    if (driver) {
      await driver.quit();
    }

    console.log('\n===============================================================');
    console.log(`   RESUMEN FINAL: ${passedTests} PASADOS | ${failedTests} FALLADOS DE UN TOTAL DE 15 CPs`);
    console.log('===============================================================\n');

    if (failedTests > 0) {
      process.exit(1);
    }
  }
}

// Ejecutar suite si se invoca directamente
if (require.main === module) {
  runTestSuite().catch(err => {
    console.error('Error fatal al ejecutar suite Selenium:', err);
    process.exit(1);
  });
}

module.exports = { runTestSuite };
