import {
    app, auth, provider, db, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword,
    GoogleAuthProvider, signInWithPopup, collection, doc, getDoc, getDocs, addDoc, setDoc, updateDoc
} from "./firebase.js";

const API_KEY1 = 'f3eb2f97d9fd7a94bd7b81e3c5dfd68a64911536b5cfbb1ef824bffef0a531e8';  // Replace with your API key
const API_URL1 = 'https://bocabookcafe-degxe0e3bkebgxgr.southeastasia-01.azurewebsites.net/';  // Replace with your actual API URL
const API_KEY2 = 'c6b8b816c8991a66d1964bb6a0012be3'
const API_URL2 = 'https://foodsave-4-menu-bsg9erczatbzeac9.southeastasia-01.azurewebsites.net/'

document.getElementById('submit-book').addEventListener('click', getFoodRecommendations);

// Cart state
let cart = [];
let menuItems = []; // Store menu items globally

// Load both books and menu when page loads
window.onload = async () => {
    await loadBooks();
    await loadMenu();
};

// Make updateQuantity available globally
window.updateQuantity = updateQuantity;

// Fetch books data from API
async function loadBooks() {
    try {
        const response = await fetch(`${API_URL1}/api/secure/books/`, {
            method: 'GET',
            headers: {
                'X-API-Key': API_KEY1,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch books');
        }

        const booksData = await response.json();

        // Transform data format
        const formattedBooks = booksData.map(bookObj => {
            // Get the first (and only) key of the object
            const bookId = Object.keys(bookObj)[0];
            // Return the book data with its ID
            return {
                id: bookId,
                ...bookObj[bookId]
            };
        });
        console.log(formattedBooks);
        populateDropdown(formattedBooks);
    } catch (error) {
        console.error('Error fetching books:', error);
    }
}

// Populate the book dropdown
function populateDropdown(books) {
    const bookDropdown = document.getElementById('book-dropdown');
    bookDropdown.innerHTML = '';

    books.forEach(book => {
        const option = document.createElement('option');
        option.value = book.id; // Simpan ID buku
        option.textContent = book.title; // Tampilkan judul buku
        bookDropdown.appendChild(option);
    });
}

// Get food recommendations based on the selected book
async function getFoodRecommendations() {
    const loadingIndicator = document.getElementById('loading-indicator');
    const recommendationsDiv = document.getElementById('food-recommendations');

    try {
        const selectedBookId = document.getElementById('book-dropdown').value;
        if (!selectedBookId) {
            alert('Please select a book first');
            return;
        }

        // Show loading indicator and hide recommendations
        loadingIndicator.style.display = 'flex';
        recommendationsDiv.style.display = 'none';

        const foodRecommendations = await getRecommendationsFromBook({ id: selectedBookId });
        // Hide loading indicator and show recommendations
        loadingIndicator.style.display = 'none';
        recommendationsDiv.style.display = 'block';

        displayRecommendations(foodRecommendations);
    } catch (error) {
        console.error('Error getting recommendations:', error);
        alert('Failed to get recommendations');

        // Hide loading indicator
        loadingIndicator.style.display = 'none';
        recommendationsDiv.style.display = 'block';
    }
}

async function getRecommendationsFromBook(bookData) {
    // Call the secure API to get food recommendations
    try {
        const response = await fetch(`${API_URL1}/api/secure/recommendations/${bookData.id}`, {
            method: 'GET',
            headers: {
                'X-API-Key': API_KEY1,  // Include API key in header
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch recommendations');
        }

        const data = await response.json();
        return data.recommendations;  // Assuming the response contains a 'recommendations' field
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        return [];
    }
}

// Display the food recommendations
function displayRecommendations(recommendations) {
    const recommendationsDiv = document.getElementById('food-recommendations');
    recommendationsDiv.innerHTML = '';  // Clear previous recommendations

    recommendations.forEach(food => {
        const foodDiv = document.createElement('div');
        foodDiv.classList.add('food-item');
        foodDiv.innerHTML = `<h3>${food.name}</h3><p>${food.description}</p>`;
        recommendationsDiv.appendChild(foodDiv);
    });
}

// Function to load menu
async function loadMenu() {
    try {
        // Fetch menu dari IP sendiri 
        const mainResponse = await fetch(`${API_URL1}/api/secure/menu/`, {
            method: 'GET',
            headers: {
                'X-API-Key': API_KEY1,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        if (!mainResponse.ok) {
            throw new Error('Failed to fetch menu from BOCA API');
        }

        const mainMenu = await mainResponse.json();

        // Transform data format
        const formattedMainMenu = mainMenu.map(mainMenuObj => {
            // Get the first (and only) key of the object
            const menuId = Object.keys(mainMenuObj)[0];
            // Return the book data with its ID
            return {
                id: menuId,
                ...mainMenuObj[menuId]
            };
        });
        console.log(formattedMainMenu);

        // Fetch data dari API teman 
        const externalResponse = await fetch(`${API_URL2}/menu/`, {
            method: 'GET',
            headers: {
                'X-API-Key': API_KEY2,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        if (!externalResponse.ok) {
            throw new Error('Failed to fetch menu from Food Save API');
        }

        const externalMenu = await externalResponse.json();

        // Map data external ke struktur menu 
        const formattedExternalMenu = externalMenu.map(item => ({
            name: item.name,
            price: item.price,
            category: 'Main Course',
            description: item.name === "Cheeseburger"
                ? "A delicious burger made with premium beef covered in cheese."
                : "A delightful pizza topped with fresh pineapple and ham.",
        }));

        // Tambahkan menu eksternal ke Firestore untuk pertama kalinya 
        await addMenuToFirestore(formattedExternalMenu);

        console.log(formattedExternalMenu);
        // Store combined and finalized menu in menuItems 
        menuItems = [...formattedMainMenu, ...formattedExternalMenu];

        displayMenu(menuItems);
    } catch (error) {
        console.error('Error fetching menu:', error);
    }
}

// Fungsi untuk menambahkan menu eksternal ke Firestore
async function addMenuToFirestore(menuItems) {
    const menuCollection = collection(db, 'external-menu');

    // Fetch existing menu items to check for duplicates
    const existingItemsQuery = await getDocs(menuCollection);
    const existingItems = existingItemsQuery.docs.map(doc => doc.data());

    for (const item of menuItems) {
        // Check if the item already exists based on a unique property (e.g., name)
        const exists = existingItems.some(existingItem => existingItem.name === item.name);

        if (!exists) {
            // Use addDoc to automatically generate a unique ID
            await addDoc(menuCollection, item);
            console.log(`Added menu item to Firestore: ${item.name}`);
        } else {
            console.log(`Menu item already exists in Firestore: ${item.name}`);
        }
    }
}

// Mapping from menu to image 
const imageMap = {
    "Apple Cider": "/asset/apple_cider.jpeg",
    "Cappucino": "/asset/cappucino.jpeg",
    "Caramel Apple": "/asset/caramel_apple.jpg",
    "Cheeseburger": "/asset/cheeseburger.jpg",
    "Chocolate Lava Cake": "/asset/chocolate_lava_cake.png",
    "Cranberry Mojito": "/asset/cranberry_mojito.jpg",
    "Hawaiian Pizza": "/asset/hawaiian_pizza.jpg",
    "Kombucha": "/asset/kombucha.jpg",
    "Lemon Soda": "/asset/lemon_soda.jpg",
    "Magic Fruit Wand": "/asset/magic_fruit_wand.jpg",
    "Space Cookies": "/asset/space_cookies.png",
    "Strawberry Cheesecake": "/asset/strawberry_cheesecake.jpg",
};

// Display menu items
function displayMenu(menuItems) {
    const menuContainer = document.getElementById('menu-container');
    menuContainer.innerHTML = '';

    menuItems.forEach(item => {
        const menuItemElement = document.createElement('div');
        menuItemElement.className = 'menu-item';

        // Log item name for debugging
        console.log(`Item name: ${item.name}`); // Debugging log

        // Cek apakah gambar tersedia di imageMap berdasarkan nama menu
        const menuImage = imageMap[item.name]

        const price = item.price ? `Rp. ${item.price.toLocaleString()}` : 'Price not available'; // Handle undefined price
        console.log(`Image for ${item.name}: ${menuImage}`); // Debugging log

        menuItemElement.innerHTML = `
            <img src="${menuImage}" alt="${item.name}">
            <h3>${item.name}</h3>
            <p>${item.description}</p>
            <div class="menu-item-bottom">
                <span class="price">${price}</span>
                <div class="add-to-cart">
                    <div class="quantity-control">
                        <button class="quantity-btn" onclick="updateQuantity('${item.name}', -1)">-</button>
                        <span id="quantity-${item.name}">0</span>
                        <button class="quantity-btn" onclick="updateQuantity('${item.name}', 1)">+</button>
                    </div>
                </div>
            </div>
        `;
        menuContainer.appendChild(menuItemElement);
    });
}

// Update quantity and cart
function updateQuantity(itemName, change) {
    const quantityElement = document.getElementById(`quantity-${itemName}`);
    let quantity = parseInt(quantityElement.textContent) + change;

    if (quantity < 0) quantity = 0;

    quantityElement.textContent = quantity;
    updateCart(itemName, quantity);
}

// Update cart
function updateCart(itemName, quantity) {
    const cartItem = cart.find(item => item.name === itemName);

    if (quantity === 0) {
        cart = cart.filter(item => item.name !== itemName);
    } else if (cartItem) {
        cartItem.quantity = quantity;
    } else {
        cart.push({ name: itemName, quantity: quantity });
    }

    updateCartDisplay();
}

// Update cart display
function updateCartDisplay() {
    const cartContainer = document.getElementById('shopping-cart');
    const cartItems = document.getElementById('cart-items');
    const totalAmount = document.getElementById('total-amount');
    const cartCount = document.getElementById('cart-count');

    // Show cart only if there are items
    if (cart.length === 0) {
        cartContainer.style.display = 'none';
        return;
    } else {
        cartContainer.style.display = 'block';
    }

    cartItems.innerHTML = '';
    let total = 0;
    let itemCount = 0;

    cart.forEach(cartItem => {
        const menuItem = menuItems.find(item => item.name === cartItem.name);
        if (menuItem) {
            const itemTotal = menuItem.price * cartItem.quantity;
            total += itemTotal;
            itemCount += cartItem.quantity;

            cartItems.innerHTML += `
                <div class="cart-item">
                    <span>${cartItem.name} x ${cartItem.quantity}</span>
                    <span>Rp. ${itemTotal.toLocaleString()}</span>
                </div>
            `;
        }
    });

    if (totalAmount) totalAmount.textContent = total.toLocaleString();
    if (cartCount) cartCount.textContent = itemCount;
}

// Function to reset all menu quantities to 0
function resetMenuQuantities() {
    const allQuantityElements = document.querySelectorAll('[id^="quantity-"]');
    allQuantityElements.forEach(element => {
        element.textContent = '0';
    });
}

// Confirm payment
document.getElementById('confirm-payment').addEventListener('click', () => {
    if (cart.length === 0) {
        alert('Please add items to your cart first');
        return;
    }

    resetMenuQuantities(); // Reset all quantities to 0
    document.getElementById('thank-you-modal').style.display = 'flex';
    cart = [];
    updateCartDisplay();
});

// Close thank you modal
window.closeThankYouModal = function () {
    document.getElementById('thank-you-modal').style.display = 'none';
};