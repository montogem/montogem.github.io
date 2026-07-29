const buttons = document.querySelectorAll('.package-btn');
const selectedTicket = document.getElementById('selected-ticket');
const selectedPrice = document.getElementById('selected-price');
const ticketSelect = document.getElementById('ticket-select');
const orderForm = document.getElementById('order-form');
const messageBox = document.getElementById('form-message');
const authForm = document.getElementById('auth-form');
const authMessage = document.getElementById('auth-message');
const authMode = document.getElementById('auth-mode');
const nameField = document.getElementById('name-field');
const userWelcome = document.getElementById('user-welcome');
const logoutBtn = document.getElementById('logout-btn');
const adminLoginForm = document.getElementById('admin-login-form');
const adminMessage = document.getElementById('admin-message');
const adminAuthCard = document.getElementById('admin-auth-card');
const adminPanel = document.getElementById('admin-panel');
const ordersList = document.getElementById('orders-list');

const socket = io();
let currentUser = null;

function saveUser(user) {
    currentUser = user;
    localStorage.setItem('ticket-user', JSON.stringify(user));
}

function loadUser() {
    const saved = localStorage.getItem('ticket-user');
    if (!saved) return null;
    try {
        return JSON.parse(saved);
    } catch {
        return null;
    }
}

function setMessage(element, text, isError = false) {
    if (!element) return;
    element.textContent = text;
    element.style.color = isError ? '#ff8d8d' : '#ffe6a1';
}

function renderAuthState() {
    const user = currentUser || loadUser();
    if (!user) {
        if (userWelcome) userWelcome.innerHTML = 'Войдите в аккаунт, и мы возьмём ваши данные автоматически.';
        if (logoutBtn) logoutBtn.hidden = true;
        return;
    }

    if (userWelcome) {
        userWelcome.innerHTML = `Здравствуйте, <strong>${user.name}</strong>! Мы подставим ваше имя и почту при оформлении заявки.`;
    }

    if (logoutBtn) logoutBtn.hidden = false;
}

buttons.forEach((button) => {
    button.addEventListener('click', () => {
        const ticketName = button.dataset.ticket;
        const price = button.dataset.price;

        if (selectedTicket && selectedPrice) {
            selectedTicket.textContent = ticketName;
            selectedPrice.textContent = `От ${price}`;
        }

        if (ticketSelect) {
            ticketSelect.value = ticketName;
        }
    });
});

function openPaymentWindow(ticketName) {
    const paymentWindow = window.open('', '_blank', 'width=760,height=760,noopener,noreferrer');

    if (paymentWindow) {
        paymentWindow.document.write(`<!DOCTYPE html>
            <html lang="ru">
            <head>
                <meta charset="UTF-8" />
                <title>Оплата билета</title>
                <style>
                    body { font-family: Arial, sans-serif; background: #111; color: #fff; padding: 24px; }
                    .box { background: #1d1d1d; border: 1px solid #4a4a4a; border-radius: 16px; padding: 24px; max-width: 560px; margin: 20px auto; }
                    .btn { display: inline-block; margin-top: 16px; padding: 12px 16px; background: #f4b400; color: #111; text-decoration: none; border-radius: 999px; font-weight: 700; }
                </style>
            </head>
            <body>
                <div class="box">
                    <h2>Окно оплаты</h2>
                    <p>Вы выбрали: <b>${ticketName}</b></p>
                    <p>Здесь можно оформить оплату в отдельном окне, подключив настоящую платёжную систему.</p>
                    <a class="btn" href="https://www.example.com" target="_blank">Перейти к оплате</a>
                </div>
            </body>
            </html>`);
        paymentWindow.document.close();
    }
}

if (authMode && nameField) {
    authMode.addEventListener('change', () => {
        const isLogin = authMode.value === 'login';
        nameField.hidden = isLogin;
        nameField.querySelector('input').required = !isLogin;
    });
}

if (authForm) {
    authForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const data = {
            name: document.getElementById('reg-name').value.trim(),
            email: document.getElementById('reg-email').value.trim(),
            password: document.getElementById('reg-password').value.trim(),
            phone: document.getElementById('reg-phone').value.trim()
        };

        const isLogin = authMode ? authMode.value === 'login' : false;

        if (!isLogin && !data.name) {
            setMessage(authMessage, 'Введите имя', true);
            return;
        }

        if (!data.email || !data.password) {
            setMessage(authMessage, 'Введите почту и пароль', true);
            return;
        }

        if (!isLogin && !data.phone.startsWith('+373')) {
            setMessage(authMessage, 'Телефон должен начинаться с +373', true);
            return;
        }

        try {
            const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (!result.success) throw new Error(result.message || 'Ошибка');

            saveUser(result.user);
            renderAuthState();
            setMessage(authMessage, isLogin ? 'Вы успешно вошли' : 'Аккаунт создан');
            authForm.reset();
        } catch (error) {
            setMessage(authMessage, error.message || 'Ошибка авторизации', true);
        }
    });
}

if (orderForm && messageBox) {
    orderForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const user = currentUser || loadUser();
        if (!user) {
            setMessage(messageBox, 'Сначала авторизуйтесь, чтобы оставить заявку', true);
            return;
        }

        const ticketName = ticketSelect ? ticketSelect.value : 'Базовый набор';

        try {
            socket.emit('new-order', {
                userId: user.id,
                ticketName
            });

            setMessage(messageBox, `Заявка на «${ticketName}» отправлена. Администратор увидит её в реальном времени.`);
            openPaymentWindow(ticketName);
            orderForm.reset();
        } catch (error) {
            setMessage(messageBox, error.message || 'Не удалось отправить заявку', true);
        }
    });
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('ticket-user');
        currentUser = null;
        renderAuthState();
        setMessage(authMessage, 'Вы вышли из аккаунта');
    });
}

function renderOrders() {
    if (!ordersList) return;
    ordersList.innerHTML = '';

    fetch('/api/orders')
        .then((response) => response.json())
        .then((data) => {
            if (!data.success) return;
            if (!data.orders.length) {
                ordersList.innerHTML = '<p class="form-message">Пока нет заявок</p>';
                return;
            }

            data.orders.forEach((order) => {
                const card = document.createElement('article');
                card.className = 'product-card';
                card.innerHTML = `
                    <h3>${order.buyerName}</h3>
                    <p><strong>Email:</strong> ${order.buyerEmail}</p>
                    <p><strong>Билет:</strong> ${order.ticketName}</p>
                    <p><strong>Статус:</strong> ${order.status === 'new' ? 'Новая' : order.status === 'approved' ? 'Одобрена' : 'Отклонена'}</p>
                    <div class="hero-actions">
                        <button class="btn primary" data-action="approve" data-id="${order.id}">Одобрить</button>
                        <button class="btn secondary" data-action="reject" data-id="${order.id}">Отклонить</button>
                    </div>
                `;
                ordersList.appendChild(card);
            });

            ordersList.querySelectorAll('button').forEach((button) => {
                button.addEventListener('click', () => {
                    const action = button.dataset.action;
                    const orderId = button.dataset.id;
                    socket.emit('update-order-status', {
                        orderId,
                        status: action === 'approve' ? 'approved' : 'rejected'
                    });
                });
            });
        });
}

if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', (event) => {
        event.preventDefault();
        socket.emit('admin-login', {
            login: document.getElementById('admin-login').value,
            password: document.getElementById('admin-password').value
        });
    });
}

if (window.location.pathname === '/admin') {
    socket.on('admin-auth-success', () => {
        if (adminAuthCard) adminAuthCard.hidden = true;
        if (adminPanel) adminPanel.hidden = false;
        renderOrders();
    });

    socket.on('admin-auth-error', (payload) => {
        setMessage(adminMessage, payload.message || 'Ошибка входа', true);
    });

    socket.on('orders-updated', (payload) => {
        if (!payload.orders) return;
        if (!ordersList) return;
        ordersList.innerHTML = '';

        if (!payload.orders.length) {
            ordersList.innerHTML = '<p class="form-message">Пока нет заявок</p>';
            return;
        }

        payload.orders.forEach((order) => {
            const card = document.createElement('article');
            card.className = 'product-card';
            card.innerHTML = `
                <h3>${order.buyerName}</h3>
                <p><strong>Email:</strong> ${order.buyerEmail}</p>
                <p><strong>Билет:</strong> ${order.ticketName}</p>
                <p><strong>Статус:</strong> ${order.status === 'new' ? 'Новая' : order.status === 'approved' ? 'Одобрена' : 'Отклонена'}</p>
                <div class="hero-actions">
                    <button class="btn primary" data-action="approve" data-id="${order.id}">Одобрить</button>
                    <button class="btn secondary" data-action="reject" data-id="${order.id}">Отклонить</button>
                </div>
            `;
            ordersList.appendChild(card);
        });

        ordersList.querySelectorAll('button').forEach((button) => {
            button.addEventListener('click', () => {
                const action = button.dataset.action;
                const orderId = button.dataset.id;
                socket.emit('update-order-status', {
                    orderId,
                    status: action === 'approve' ? 'approved' : 'rejected'
                });
            });
        });
    });
}

currentUser = loadUser();
renderAuthState();
