const buttons = document.querySelectorAll('.package-btn');
const selectedTicket = document.getElementById('selected-ticket');
const selectedPrice = document.getElementById('selected-price');
const ticketSelect = document.getElementById('ticket-select');
const orderForm = document.getElementById('order-form');
const messageBox = document.getElementById('form-message');

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

if (orderForm && messageBox) {
    orderForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const name = document.getElementById('name').value.trim();
        const ticketName = ticketSelect ? ticketSelect.value : 'Базовый набор';
        const comment = document.getElementById('comment').value.trim();

        messageBox.textContent = `Спасибо, ${name || 'пользователь'}! Заявка на «${ticketName}» принята. ${comment ? 'Мы учтём ваш комментарий.' : 'Сейчас откроется окно оплаты.'}`;
        openPaymentWindow(ticketName);
        orderForm.reset();
    });
}