// Page Object para la vista de Reserva, Selección de Asientos y Ticket
// Regla estricta: NO aserciones aquí, solo localizadores y métodos de acción puros.
const { By, until } = require('selenium-webdriver');

class ReservaPage {
  /**
   * @param {import('selenium-webdriver').WebDriver} driver
   */
  constructor(driver) {
    this.driver = driver;

    // Localizadores de la vista de Reserva
    this.reservaTitleLocator = By.id('reservaTitle');
    this.selectedMovieTitleLocator = By.id('selectedMovieTitle');
    this.selectedSeatLabelLocator = By.id('selectedSeatLabel');
    this.totalPriceLabelLocator = By.id('totalPriceLabel');
    this.backToCarteleraBtnLocator = By.id('backToCarteleraBtn');

    // Formulario de pago
    this.cardHolderInputLocator = By.id('cardHolderInput');
    this.cardNumberInputLocator = By.id('cardNumberInput');
    this.cardExpiryInputLocator = By.id('cardExpiryInput');
    this.cardCvvInputLocator = By.id('cardCvvInput');
    this.paySubmitBtnLocator = By.id('paySubmitBtn');
    this.paymentAlertLocator = By.id('paymentAlert');

    // Localizadores de la pantalla de confirmación (Ticket)
    this.ticketTitleLocator = By.id('ticketTitle');
    this.ticketCodeLocator = By.id('ticketCode');
    this.ticketMovieLocator = By.id('ticketMovie');
    this.ticketSeatLocator = By.id('ticketSeat');
    this.ticketAmountLocator = By.id('ticketAmount');
    this.newBookingBtnLocator = By.id('newBookingBtn');
  }

  // Acciones en la sala y asientos

  async obtenerTituloReserva() {
    const el = await this.driver.wait(until.elementLocated(this.reservaTitleLocator), 5000);
    return await el.getText();
  }

  async obtenerPeliculaSeleccionada() {
    const el = await this.driver.wait(until.elementLocated(this.selectedMovieTitleLocator), 5000);
    return await el.getText();
  }

  async seleccionarAsiento(seatId) {
    const seatBtn = await this.driver.wait(until.elementLocated(By.id(`seat-${seatId}`)), 5000);
    await seatBtn.click();
  }

  async obtenerAsientoSeleccionadoTexto() {
    const el = await this.driver.wait(until.elementLocated(this.selectedSeatLabelLocator), 5000);
    return await el.getText();
  }

  async estaBotonPagoHabilitado() {
    const btn = await this.driver.wait(until.elementLocated(this.paySubmitBtnLocator), 5000);
    return await btn.isEnabled();
  }

  // Acciones en el formulario de pago

  async ingresarDatosPago(titular, numeroTarjeta, expiracion, cvv) {
    const holderInput = await this.driver.wait(until.elementLocated(this.cardHolderInputLocator), 5000);
    await holderInput.clear();
    await holderInput.sendKeys(titular);

    const numberInput = await this.driver.wait(until.elementLocated(this.cardNumberInputLocator), 5000);
    await numberInput.clear();
    await numberInput.sendKeys(numeroTarjeta);

    const expiryInput = await this.driver.wait(until.elementLocated(this.cardExpiryInputLocator), 5000);
    await expiryInput.clear();
    await expiryInput.sendKeys(expiracion);

    const cvvInput = await this.driver.wait(until.elementLocated(this.cardCvvInputLocator), 5000);
    await cvvInput.clear();
    await cvvInput.sendKeys(cvv);
  }

  async hacerClicPagar() {
    const btn = await this.driver.wait(until.elementLocated(this.paySubmitBtnLocator), 5000);
    await btn.click();
  }

  async obtenerMensajeErrorPago() {
    const alert = await this.driver.wait(until.elementLocated(this.paymentAlertLocator), 5000);
    await this.driver.wait(until.elementIsVisible(alert), 5000);
    return await alert.getText();
  }

  // Acciones en la pantalla final de Ticket

  async obtenerTituloTicket() {
    const el = await this.driver.wait(until.elementLocated(this.ticketTitleLocator), 7000);
    return await el.getText();
  }

  async obtenerCodigoTicket() {
    const el = await this.driver.wait(until.elementLocated(this.ticketCodeLocator), 5000);
    return await el.getText();
  }

  async obtenerAsientoConfirmado() {
    const el = await this.driver.wait(until.elementLocated(this.ticketSeatLocator), 5000);
    return await el.getText();
  }

  async hacerClicNuevoTicket() {
    const btn = await this.driver.wait(until.elementLocated(this.newBookingBtnLocator), 5000);
    await btn.click();
  }
}

module.exports = ReservaPage;
