// Servidor principal de CineFlex
// API REST mock para autenticación, cartelera, salas y reservas
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuracion de middlewares de seguridad, logs y parseo de peticiones
app.use(helmet());
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

// Control de intentos de login en memoria para simular bloqueo tras 3 intentos fallidos
const loginAttempts = {};

// Base de datos simulada en memoria
const movies = [
  {
    id: 1,
    title: 'Avengers: Secret Wars',
    genre: 'Acción / Ciencia Ficción',
    duration: '180 min',
    classification: '+13',
    price: 15000,
    poster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 2,
    title: 'Interestelar 2',
    genre: 'Ciencia Ficción / Drama',
    duration: '165 min',
    classification: '+12',
    price: 14000,
    poster: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 3,
    title: 'El Conjuro: La Revelación',
    genre: 'Terror / Suspenso',
    duration: '115 min',
    classification: '+18',
    price: 13500,
    poster: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=500&auto=format&fit=crop&q=60'
  }
];

// Asientos para la sala principal (A1..A5, B1..B5, C1..C5)
const initialSeats = [
  { id: 'A1', row: 'A', number: 1, status: 'available' },
  { id: 'A2', row: 'A', number: 2, status: 'occupied' },
  { id: 'A3', row: 'A', number: 3, status: 'available' },
  { id: 'A4', row: 'A', number: 4, status: 'available' },
  { id: 'A5', row: 'A', number: 5, status: 'occupied' },
  { id: 'B1', row: 'B', number: 1, status: 'available' },
  { id: 'B2', row: 'B', number: 2, status: 'available' },
  { id: 'B3', row: 'B', number: 3, status: 'available' },
  { id: 'B4', row: 'B', number: 4, status: 'occupied' },
  { id: 'B5', row: 'B', number: 5, status: 'available' },
  { id: 'C1', row: 'C', number: 1, status: 'available' },
  { id: 'C2', row: 'C', number: 2, status: 'available' },
  { id: 'C3', row: 'C', number: 3, status: 'available' },
  { id: 'C4', row: 'C', number: 4, status: 'available' },
  { id: 'C5', row: 'C', number: 5, status: 'available' }
];

let seats = JSON.parse(JSON.stringify(initialSeats));
const bookings = [];

// Token de sesion simulado para pruebas
const VALID_TOKEN = 'cineflex-mock-jwt-token-xyz123456';

// Middleware simple para verificar autorizacion con Bearer Token
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Acceso no autorizado: Token no proporcionado'
    });
  }

  const token = authHeader.replace('Bearer ', '').trim();
  if (token !== VALID_TOKEN) {
    return res.status(401).json({
      success: false,
      message: 'Token invalido o expirado'
    });
  }

  next();
}

// ------------------- RUTAS DEL SERVIDOR -------------------

// Estado del servicio
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'CineFlex Backend API', timestamp: new Date() });
});

// Endpoint 1: Login de usuarios con bloqueo preventivo tras 3 intentos
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Usuario y contraseña requeridos'
    });
  }

  // Inicializar contador si no existe
  if (!loginAttempts[username]) {
    loginAttempts[username] = 0;
  }

  // Verificar si la cuenta ya se encuentra bloqueada
  if (loginAttempts[username] >= 3) {
    return res.status(403).json({
      success: false,
      blocked: true,
      message: 'Cuenta bloqueada preventivamente tras 3 intentos fallidos consecutivos'
    });
  }

  // Credenciales válidas de prueba
  if (username === 'admin@cineflex.com' && password === 'CineFlex2024*') {
    loginAttempts[username] = 0; // Reiniciamos contador al acertar
    return res.status(200).json({
      success: true,
      message: 'Autenticación exitosa',
      token: VALID_TOKEN,
      user: {
        name: 'Tatiana Gomez',
        email: username,
        role: 'CLIENT'
      }
    });
  } else {
    loginAttempts[username] += 1;
    const remaining = 3 - loginAttempts[username];

    if (loginAttempts[username] >= 3) {
      return res.status(403).json({
        success: false,
        blocked: true,
        message: 'Cuenta bloqueada preventivamente tras 3 intentos fallidos consecutivos'
      });
    }

    return res.status(401).json({
      success: false,
      blocked: false,
      message: `Credenciales incorrectas. Intentos restantes: ${remaining}`
    });
  }
});

// Reiniciar intentos de login (util para resetear pruebas automatizadas)
app.post('/api/auth/reset-attempts', (req, res) => {
  const { username } = req.body;
  if (username && loginAttempts[username]) {
    delete loginAttempts[username];
  } else {
    for (const key in loginAttempts) delete loginAttempts[key];
  }
  res.status(200).json({ success: true, message: 'Intentos reiniciados' });
});

// Endpoint 2: Consulta de Cartelera protegida con Token
app.get('/api/movies', authMiddleware, (req, res) => {
  res.status(200).json({
    success: true,
    count: movies.length,
    movies: movies
  });
});

// Consulta de asientos disponibles (usado tanto en el flujo de reserva como en JMeter)
app.get('/api/seats', (req, res) => {
  res.status(200).json({
    success: true,
    total: seats.length,
    availableCount: seats.filter(s => s.status === 'available').length,
    seats: seats
  });
});

// Endpoint 3: Reserva y procesamiento de pago (con Stub simulado del banco)
app.post('/api/reservations', authMiddleware, (req, res) => {
  const { movieId, seatId, payment } = req.body;

  if (!movieId || !seatId || !payment) {
    return res.status(400).json({
      success: false,
      message: 'Faltan datos requeridos para la reserva'
    });
  }

  // Validar si el asiento existe y está disponible
  const seatIndex = seats.findIndex(s => s.id === seatId);
  if (seatIndex === -1) {
    return res.status(404).json({ success: false, message: 'Asiento no encontrado' });
  }

  if (seats[seatIndex].status === 'occupied') {
    return res.status(409).json({ success: false, message: 'El asiento seleccionado ya no está disponible' });
  }

  // --- STUB BANCARIO (Simulación de pasarela de pagos externa) ---
  const { cardNumber, cardHolder, cvv, expiry } = payment;

  // Regla del Stub: Si el número de tarjeta empieza por '4000' se considera tarjeta falsa/rechazada
  if (!cardNumber || cardNumber.startsWith('4000') || cardNumber.replace(/\s+/g, '').length < 16) {
    return res.status(402).json({
      success: false,
      errorCode: 'PAYMENT_REJECTED',
      message: 'Transacción rechazada por el banco: Tarjeta inválida o fondos insuficientes'
    });
  }

  // En caso de tarjeta simulada aprobada (ej. inicia por 4532 o cualquier otra válida)
  seats[seatIndex].status = 'occupied';

  const selectedMovie = movies.find(m => m.id === parseInt(movieId)) || movies[0];
  const newBooking = {
    ticketId: 'TICK-' + Math.floor(100000 + Math.random() * 900000),
    movie: selectedMovie.title,
    seat: seatId,
    amount: selectedMovie.price,
    holder: cardHolder || 'Cliente CineFlex',
    createdAt: new Date().toISOString(),
    status: 'CONFIRMED'
  };

  bookings.push(newBooking);

  return res.status(201).json({
    success: true,
    message: 'Reserva procesada exitosamente',
    ticket: newBooking
  });
});

// Reiniciar estado de asientos (utilidad de QA)
app.post('/api/seats/reset', (req, res) => {
  seats = JSON.parse(JSON.stringify(initialSeats));
  res.status(200).json({ success: true, message: 'Asientos reiniciados al estado original' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(` Servidor CineFlex API corriendo en puerto ${PORT}`);
  console.log(` Entorno: MOCK REST API con Helmet y Morgan`);
  console.log(` URL Base: http://localhost:${PORT}`);
  console.log(`===============================================`);
});
