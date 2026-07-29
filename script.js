const buttons = document.querySelectorAll('.buy-btn');
const selectedPackage = document.getElementById('selected-package');
const selectedPrice = document.getElementById('selected-price');

buttons.forEach((button) => {
    button.addEventListener('click', () => {
        const packageName = button.dataset.package;
        const price = button.dataset.price;

        if (selectedPackage && selectedPrice) {
            selectedPackage.textContent = packageName;
            selectedPrice.textContent = `От ${price}`;
        }
    });
});