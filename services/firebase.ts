import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/database';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBS4vydyTkjHd0r5Y3_5lp-YhDExozuPPg",
  authDomain: "studentpointtracker-8a46d.firebaseapp.com",
  databaseURL: "https://studentpointtracker-8a46d-default-rtdb.firebaseio.com",
  projectId: "studentpointtracker-8a46d",
  storageBucket: "studentpointtracker-8a46d.appspot.com",
  messagingSenderId: "261469524300",
  appId: "1:261469524300:android:6eee11fc1d51414b087fe9"
};

// Initialize Firebase if it's not already initialized
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export { firebase };