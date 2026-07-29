// Базовый массив товаров (пока генерируем 4 штуки для теста)
const products = [
    { id: 1, name: "Двубортное пальто", price: 18500, img: "https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=500&q=80" },
    { id: 2, name: "Шелковая блузка", price: 6200, img: "https://images.unsplash.com/photo-1596755094514-f87e32f85e2c?w=500&q=80" },
    { id: 3, name: "Брюки прямого кроя", price: 8900, img: "https://images.unsplash.com/photo-1624378439575-d1ead6bb2411?w=500&q=80" },
    { id: 4, name: "Кожаный ремень Classic", price: 3400, img: "https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=500&q=80" }
];

// Функция динамической отрисовки карточек товаров
function renderProducts() {
    const grid = document.getElementById('products-grid');
    if (!grid) return; // Защита от ошибок, если элемента нет на странице

    grid.innerHTML = ''; // Очищаем контейнер
    
    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <img src="${product.img}" alt="${product.name}" class="product-img">
            <div class="product-info">
                <h3>${product.name}</h3>
                <p class="product-price">${product.price.toLocaleString('ru-RU')} ₽</p>
                <button class="add-to-cart" onclick="addToCart(${product.id})">В корзину</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Простая функция счетчика корзины (полноценную сделаем на Этапе 3)
let cartCount = 0;
function addToCart(id) {
    cartCount++;
    document.getElementById('cart-count').innerText = cartCount;
    
    // Небольшая визуальная обратная связь
    const btn = event.target;
    btn.innerText = "Добавлено!";
    btn.style.backgroundColor = "#28a745"; // Зеленый цвет
    
    setTimeout(() => {
        btn.innerText = "В корзину";
        btn.style.backgroundColor = "#000";
    }, 1000);
}

// Запускаем отрисовку при полной загрузке HTML
document.addEventListener('DOMContentLoaded', renderProducts);