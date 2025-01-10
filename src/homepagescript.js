const API_KEY = 'f3eb2f97d9fd7a94bd7b81e3c5dfd68a64911536b5cfbb1ef824bffef0a531e8';  // Replace with your API key
const API_URL = 'https://bocabookcafe-degxe0e3bkebgxgr.southeastasia-01.azurewebsites.net/';  // Replace with your actual API URL

document.getElementById('submit-book').addEventListener('click', getFoodRecommendations);

// Fetch books data from API
async function loadBooks() {
    try {
        const response = await fetch(`${API_URL}/api/secure/books/`, {
            method: 'GET',
            headers: {
                'X-API-Key': API_KEY,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch books');
        }

        const booksData = await response.json();
        console.log('Books data received:', booksData);

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

        populateDropdown(formattedBooks);
    } catch (error) {
        console.error('Error fetching books:', error);
    }
}

// Populate the book dropdown
function populateDropdown(books) {
    const bookDropdown = document.getElementById('book-dropdown');
    console.log('Populating dropdown with formatted books:', books);
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
        const response = await fetch(`${API_URL}/api/secure/recommendations/${bookData.id}`, {
            method: 'GET',
            headers: {
                'X-API-Key': API_KEY,  // Include API key in header
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

// Load books on page load
window.onload = loadBooks;