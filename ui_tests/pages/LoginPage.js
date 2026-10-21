// Page Object para la vista de Login en CineFlex
// Regla estricta: NO aserciones aquí, solo localizadores y métodos de acción puros.
const { By, until } = require('selenium-webdriver');

class LoginPage {
  /**
   * @param {import('selenium-webdriver').WebDriver} driver
   */
  constructor(driver) {
    this.driver = driver;

    // Localizadores usando IDs y selectores CSS explícitos
    this.titleLocator = By.id('loginTitle');
    this.usernameInputLocator = By.id('usernameInput');
    this.passwordInputLocator = By.id('passwordInput');
    this.submitBtnLocator = By.id('loginSubmitBtn');
    this.alertLocator = By.id('loginAlert');
    this.loginSectionLocator = By.id('loginSection');
  }

  // Métodos de acción puros

  async obtenerTitulo() {
    const el = await this.driver.wait(until.elementLocated(this.titleLocator), 5000);
    return await el.getText();
  }

  async ingresarUsuario(username) {
    const input = await this.driver.wait(until.elementLocated(this.usernameInputLocator), 5000);
    await input.clear();
    await input.sendKeys(username);
  }

  async ingresarPassword(password) {
    const input = await this.driver.wait(until.elementLocated(this.passwordInputLocator), 5000);
    await input.clear();
    await input.sendKeys(password);
  }

  async hacerClicIngresar() {
    const btn = await this.driver.wait(until.elementLocated(this.submitBtnLocator), 5000);
    await btn.click();
  }

  async ingresarCredenciales(username, password) {
    await this.ingresarUsuario(username);
    await this.ingresarPassword(password);
    await this.hacerClicIngresar();
  }

  async obtenerMensajeAlerta() {
    const alert = await this.driver.wait(until.elementLocated(this.alertLocator), 5000);
    await this.driver.wait(until.elementIsVisible(alert), 5000);
    return await alert.getText();
  }

  async estaBotonDeshabilitado() {
    const btn = await this.driver.wait(until.elementLocated(this.submitBtnLocator), 5000);
    const isEnabled = await btn.isEnabled();
    return !isEnabled;
  }

  async estaVisible() {
    const section = await this.driver.findElement(this.loginSectionLocator);
    const classes = await section.getAttribute('class');
    return !classes.includes('d-none');
  }
}

module.exports = LoginPage;
