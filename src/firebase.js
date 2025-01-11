// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { getFirestore, doc, collection, getDoc, getDocs, addDoc, setDoc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-analytics.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyB_RGbYv9rfUYWah3vDsXccpUOvYpbjsQw",
    authDomain: "bookcafeservice.firebaseapp.com",
    projectId: "bookcafeservice",
    storageBucket: "bookcafeservice.firebasestorage.app",
    messagingSenderId: "1076341342932",
    appId: "1:1076341342932:web:1d2cc5af46bacf52247141",
    measurementId: "G-R22KDTRKJD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Initialize Firebase Authentication
const auth = getAuth(app); 
auth.languageCode = 'en' 
// Intialize
const provider = new GoogleAuthProvider(app); 
// Initialize Firestore Database 
const db = getFirestore(app);
// Initialize Firestore Analytics 
const analytics = getAnalytics(app);

// const google-login = document.getElementById('')

export {
    app, auth, provider, db, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword,
    signOut, GoogleAuthProvider, signInWithPopup, doc, collection, getDoc, getDocs, addDoc, setDoc, updateDoc, arrayUnion
};