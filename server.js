const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const users = [];
const orders = [];
const adminCredentials = {
  login: 'montogem',
  password: 'Yarik1310'
};

function createUser({ name, email, password, phone }) {
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2),
    name,
    email,
    password,
    phone,
    createdAt: new Date().toISOString()
  };
}

function findUserByEmail(email) {
  return users.find((user) => user.email.toLowerCase() === email.toLowerCase());
}

function findUserById(id) {
  return users.find((user) => user.id === id);
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password || !phone) {
    return res.status(400).json({ success: false, message: 'Все поля обязательны' });
  }

  if (!phone.startsWith('+373')) {
    return res.status(400).json({ success: false, message: 'Телефон должен начинаться с +373' });
  }

  if (findUserByEmail(email)) {
    return res.status(409).json({ success: false, message: 'Пользователь с такой почтой уже существует' });
  }

  const user = createUser({ name, email, password, phone });
  users.push(user);
  res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, phone: user.phone } });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Введите почту и пароль' });
  }

  const user = findUserByEmail(email);
  if (!user || user.password !== password) {
    return res.status(401).json({ success: false, message: 'Неверная почта или пароль' });
  }

  res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, phone: user.phone } });
});

app.get('/api/auth/me/:id', (req, res) => {
  const user = findUserById(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'Пользователь не найден' });
  }

  res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, phone: user.phone } });
});

app.get('/api/orders', (req, res) => {
  res.json({ success: true, orders });
});

io.on('connection', (socket) => {
  socket.on('new-order', (payload) => {
    const user = findUserById(payload.userId);
    if (!user) {
      return socket.emit('order-error', { message: 'Пользователь не найден' });
    }

    const order = {
      id: Date.now().toString(36),
      userId: user.id,
      buyerName: user.name,
      buyerEmail: user.email,
      ticketName: payload.ticketName,
      status: 'new',
      createdAt: new Date().toISOString()
    };

    orders.push(order);
    io.emit('orders-updated', { orders });
  });

  socket.on('admin-login', (payload) => {
    if (payload.login === adminCredentials.login && payload.password === adminCredentials.password) {
      socket.emit('admin-auth-success', { success: true });
    } else {
      socket.emit('admin-auth-error', { success: false, message: 'Неверный логин или пароль' });
    }
  });

  socket.on('update-order-status', ({ orderId, status }) => {
    const order = orders.find((item) => item.id === orderId);
    if (!order) {
      return socket.emit('order-status-error', { message: 'Заявка не найдена' });
    }

    order.status = status;
    io.emit('orders-updated', { orders });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
