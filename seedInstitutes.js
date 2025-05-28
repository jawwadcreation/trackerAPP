const { initializeApp } = require("firebase/app");
const { getDatabase, ref, set, remove, push } = require("firebase/database");

// ✅ Aapka config yahan lagaya gaya hai:
const firebaseConfig = {
  apiKey: "AIzaSyBS4vydyTkjHd0r5Y3_5lp-YhDExozuPPg",
  authDomain: "studentpointtracker-8a46d.firebaseapp.com",
  databaseURL: "https://studentpointtracker-8a46d-default-rtdb.firebaseio.com",
  projectId: "studentpointtracker-8a46d",
  storageBucket: "studentpointtracker-8a46d.appspot.com",
  messagingSenderId: "261469524300",
  appId: "1:261469524300:android:6eee11fc1d51414b087fe9"
};

// 🔌 Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 🎓 Institutes ki list
const institutes = [
  "FAST-NUCES",
  "IBA Karachi",
  "SZABIST",
  "NED University",
  "DHA Suffa University",
  "Iqra University",
  "Bahria University",
  "University of Karachi"
];

// 🚀 Seed function
async function seedInstitutes() {
  const institutesRef = ref(db, 'institutes');

  // Purani list hatao (optional)
  await remove(institutesRef);

  // Nayi list add karo
  institutes.forEach(name => {
    const newRef = push(institutesRef);
    set(newRef, {
      name,
      referenceCount: 0,
      createdAt: Date.now()
    });
  });

  console.log("✅ Institutes successfully added to Firebase Realtime Database!");
}

seedInstitutes();
