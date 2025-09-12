// Import the functions you need from the SDKs you need
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBlaCGMy87AAfSXIEDOu-uHHo1imWWqdbY",
  authDomain: "studio-8470533760-cc0e2.firebaseapp.com",
  projectId: "studio-8470533760-cc0e2",
  storageBucket: "studio-8470533760-cc0e2.appspot.com",
  messagingSenderId: "173589929744",
  appId: "1:173589929744:web:35bf8be7110eab55d60f95"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
