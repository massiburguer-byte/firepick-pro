import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAoZuymYBkVQR3IQxb8nsOuF016clGMds8",
  authDomain: "sportfantasy-d4687.firebaseapp.com",
  projectId: "sportfantasy-d4687",
  storageBucket: "sportfantasy-d4687.firebasestorage.app",
  messagingSenderId: "154349542316",
  appId: "1:154349542316:web:af686f7e4308731da47809",
  measurementId: "G-S36EKLP1YQ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkCollections() {
  console.log("Checking 'odds' collection:");
  const snap1 = await getDocs(collection(db, "odds"));
  console.log("Count:", snap1.size);
  
  console.log("\nChecking 'game_odds' collection:");
  const snap2 = await getDocs(collection(db, "game_odds"));
  console.log("Count:", snap2.size);
  if (snap2.size > 0) {
    console.log("First doc data:", snap2.docs[0].data());
  }
  process.exit(0);
}

checkCollections();
