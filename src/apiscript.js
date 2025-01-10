import {
    app, auth, provider, db, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword,
    GoogleAuthProvider, signInWithPopup, doc, getDoc, setDoc, updateDoc, arrayUnion
} from "./firebase.js";


// Function to check the logged in user before generating API key 
function checkApiKey() {
    // Check if the user is logged in
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // Get user reference from Firestore
            const userRef = doc(db, "users", user.uid);
            // Get the current user's data
            getDoc(userRef).then((docSnap) => {
                if (docSnap.exists()) {
                    const userData = docSnap.data();
                    const apiKeys = userData.api_keys || [];

                    // If there are already 5 API keys, prevent generating more
                    if (apiKeys.length >= 5) {
                        alert("You can only generate up to 5 API keys.");
                        return;
                    }

                    // Generate random API key
                    const apiKey = generateApiKey();

                    // Mask the API key initially in the input field
                    const apiKeyField = document.getElementById("api-key");
                    apiKeyField.value = "******";  // Mask the API key initially

                    // Show the input field and button
                    document.getElementById("api-key-container").style.display = "block";

                    // Store the actual API key in the data attribute for toggling
                    apiKeyField.dataset.apiKey = apiKey;

                    // Store the generated API key in Firestore
                    storeApiKey(userRef, apiKey);
                } else {
                    console.log("No such user data!");
                }
            });
        } else {
            console.log("No user is logged in");
        }
    });
}

// Function to generate random API key
function generateApiKey() {
    // Create a new Uint8Array of 32 bytes (256 bits)
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array); // Generate cryptographically secure random values

    // Convert the byte array to a hexadecimal string
    const apiKey = Array.from(array).map(byte => byte.toString(16).padStart(2, '0')).join('');

    return apiKey;
}

// Function to store the generated API key in Firestore for the current logged-in user
function storeApiKey(userRef, apiKey) {
    updateDoc(userRef, {
        api_keys: arrayUnion(apiKey)  // Add the new API key to the user's API keys array
    })
        .then(() => {
            console.log("API key stored successfully");
        })
        .catch((error) => {
            console.error("Error storing API key: ", error);
        });
}

// Function to show or hide the API key
function toggleApiKey() {
    const apiKeyField = document.getElementById("api-key");

    if (apiKeyField.value === "******") {
        // Reveal the actual API key
        apiKeyField.value = apiKeyField.dataset.apiKey;
    } else {
        // Hide the API key again
        apiKeyField.value = "******";
    }
}

function copyApiKey() {
    const apiKeyField = document.getElementById("api-key");
    apiKeyField.select();
    document.execCommand('copy');  // Copy the API key to clipboard
    alert('API Key copied to clipboard!');
}


window.checkApiKey = checkApiKey;
window.toggleApiKey = toggleApiKey;
window.copyApiKey = copyApiKey;