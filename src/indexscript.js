import {
    app, auth, provider, db, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword,
    GoogleAuthProvider, signInWithPopup, doc, getDoc, setDoc, updateDoc
} from "./firebase.js";

// Toggle between Sign-Up and Login forms
function toggleForms() {
    const signupForm = document.getElementById('signup-form');
    const loginForm = document.getElementById('login-form');
    signupForm.classList.toggle('active');
    loginForm.classList.toggle('active');
}

// Expose the function to global scope
window.toggleForms = toggleForms;

// Create user with email and password 
const signupButton = document.getElementById("signup-button");
signupButton.addEventListener("click", function (event) {
    event.preventDefault()
    const signupEmail = document.getElementById("signup-email").value;
    const signupPassword = document.getElementById("signup-password").value;
    createUserWithEmailAndPassword(auth, signupEmail, signupPassword)
        .then((userCredential) => {
            // Signed up 
            const user = userCredential.user;
            const userData = {
                email: signupEmail,
                api_keys: [],
                history: []
            }
            alert("Creating account...")

            const docRef = doc(db, "users", user.uid);
            setDoc(docRef, userData)
                .then(() => {
                    toggleForms();
                    alert("Please log in with your newly made account");
                })
                .catch((error) => {
                    console.error("Error writing document", error);
                });
        })
        .catch((error) => {
            const errorCode = error.code;
            if (errorCode == 'auth/email-already-in-use') {
                alert('Email is already in use');
            }
            else {
                const errorMessage = error.message;
                alert(errorMessage, ', unable to create account');
            }
        });
})

// Log in with email and password 
const loginButton = document.getElementById("login-button");
loginButton.addEventListener("click", function (event) {
    event.preventDefault()
    const loginEmail = document.getElementById("login-email").value;
    const loginPassword = document.getElementById("login-password").value;
    signInWithEmailAndPassword(auth, loginEmail, loginPassword)
        .then((userCredential) => {
            // logged in 
            const user = userCredential.user;
            localStorage.setItem('loggedInUserID', user.uid);
            alert("Logging in...")
            window.location.href = "homepage.html";
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            if (errorCode === "auth/wrong-password") {
                alert("Incorrect password. Please try again.");
            } else if (errorCode === "auth/user-not-found") {
                alert("No account found with this email.");
            //} else if (errorCode === "auth/invalid-credential") {
            //    alert("This email is linked to Google Sign-In. Please use 'Continue with Google' to log in.");
            } else {
                alert(`An error occurred during sign-in: ${errorMessage} (Code: ${errorCode}).`);
            }
        });
});

//Sign up or log in with Google account 
const googleButton = document.querySelectorAll('.btn-google');
googleButton.forEach(function (googleButton) {
    googleButton.addEventListener("click", function () {
        signInWithPopup(auth, provider)
            .then((result) => {
                // This gives you a Google Access Token. You can use it to access the Google API.
                const credential = GoogleAuthProvider.credentialFromResult(result);
                const token = credential.accessToken;
                // The signed-in user info.
                const user = result.user;
                console.log(user);
                // Check if the logged account already exists or not 
                const docRef = doc(db, "users", user.uid);
                getDoc(docRef).then((docSnap) => {
                    // If user exists 
                    if (docSnap.exists()) {
                        alert("Logging in...");
                    }
                    // If user doesn't exist then create a new account for them 
                    else {
                        const userData = {
                            email: user.email,
                            api_keys: [],
                            history: [],
                            googleSignIn: true, // Flag to indicate sign in using Google 
                        };
                        alert("Creating account...");
                        setDoc(docRef, userData)
                            .catch((error) => {
                                console.error("Error writing document: ", error);
                            });
                    }
                    localStorage.setItem('loggedInUserID', user.uid);
                    window.location.href = "homepage.html";
                }).catch((error) => {
                    // Handle Errors here.
                    const errorCode = error.code;
                    const errorMessage = error.message;
                    // The email of the user's account used.
                    // const email = error.customData.email;
                    // The AuthCredential type that was used.
                    const credential = GoogleAuthProvider.credentialFromError(error);
                    // Specific error handling
                    if (errorCode === "auth/account-exists-with-different-credential") {
                        alert(
                            `This email is already associated with a different sign-in method. Please use the correct method to sign in.`
                        );
                    } else if (errorCode === "auth/popup-closed-by-user") {
                        alert("Sign-in popup was closed before completing the process. Please try again.");
                    } else if (errorCode === "auth/network-request-failed") {
                        alert("Network error occurred. Please check your internet connection and try again.");
                    } else {
                        // Default error handler
                        alert(`An error occurred during sign-in: ${errorMessage} (Code: ${errorCode}).`);
                    }
                });
            });
    });
});