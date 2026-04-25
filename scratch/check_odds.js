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

async function checkOdds() {
  const querySnapshot = await getDocs(collection(db, "odds"));
  console.log("Total odds docs:", querySnapshot.size);
  querySnapshot.forEach((doc) => {
    console.log(`${doc.id} =>`, doc.data());
  });
  process.exit(0);
}

checkOdds();
