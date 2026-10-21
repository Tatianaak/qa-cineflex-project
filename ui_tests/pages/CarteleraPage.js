// Page Object para la vista de Cartelera en CineFlex
// Regla estricta: NO aserciones aquí, solo localizadores y métodos de acción puros.
const { By, until } = require('selenium-webdriver');

class CarteleraPage {
  /**
   * @param {import('selenium-webdriver').WebDriver} driver
   */
  constructor(driver) {
    this.driver = driver;

    // Localizadores
    this.titleLocator = By.id('carteleraTitle');
    this.searchInputLocator = By.id('movieSearchInput');
    this.moviesGridLocator = By.id('moviesGrid');
    this.movieCardsLocator = By.css('.movie-card');
    this.logoutBtnLocator = By.id('logoutBtn');
    this.userGreetingLocator = By.id('userGreeting');
    this.carteleraSectionLocator = By.id('carteleraSection');
  }

  // Acciones puras

  async obtenerTitulo() {
    const el = await this.driver.wait(until.elementLocated(this.titleLocator), 5000);
    return await el.getText();
  }

  async esperarCargaPeliculas() {
    await this.driver.wait(until.elementLocated(this.movieCardsLocator), 5000);
  }

  async obtenerCantidadPeliculas() {
    const cards = await this.driver.findElements(this.movieCardsLocator);
    return cards.length;
  }

  async buscarPelicula(texto) {
    const input = await this.driver.wait(until.elementLocated(this.searchInputLocator), 5000);
    await input.clear();
    await input.sendKeys(texto);
  }

  async hacerClicComprarPelicula(movieId) {
    const buyBtn = await this.driver.wait(
      until.elementLocated(By.id(`buyBtn-movie-${movieId}`)),
      5000
    );
    await buyBtn.click();
  }

  async hacerClicCerrarSesion() {
    const btn = await this.driver.wait(until.elementLocated(this.logoutBtnLocator), 5000);
    await btn.click();
  }

  async obtenerSaludoUsuario() {
    const greeting = await this.driver.wait(until.elementLocated(this.userGreetingLocator), 5000);
    return await greeting.getText();
  }

  async estaVisible() {
    const section = await this.driver.findElement(this.carteleraSectionLocator);
    const classes = await section.getAttribute('class');
    return !classes.includes('d-none');
  }
}

module.exports = CarteleraPage;
