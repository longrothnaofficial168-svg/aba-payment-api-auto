const express = require('express');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, updateDoc } = require('firebase/firestore');

const app = express();
app.use(express.json());

// --- ដាក់ Firebase Config របស់អ្នកនៅទីនេះ ---
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// ផ្លូវ (Route) សម្រាប់ Webhook
app.post('/api/aba-webhook', async (req, res) => {
    try {
        const notiText = req.body.text || "";
        console.log("សារទទួលបាន៖", notiText);

        if (!notiText) {
            return res.status(400).send("No text provided");
        }

        let durationMonths = 0;
        let priceString = "";

        if (notiText.includes("9.99")) { durationMonths = 1; priceString = "$9.99"; }
        else if (notiText.includes("109.99")) { durationMonths = 12; priceString = "$109.99"; }

        if (durationMonths > 0) {
            const userQuery = query(collection(db, "users"), 
                              where("status", "==", "pending"), 
                              where("pendingAmount", "==", priceString));

            const querySnapshot = await getDocs(userQuery);
            if (querySnapshot.empty) return res.status(404).send("User not found");

            for (const userDoc of querySnapshot.docs) {
                const expiryDate = new Date();
                expiryDate.setMonth(expiryDate.getMonth() + durationMonths);
                await updateDoc(userDoc.ref, { status: "paid", expiryDate: expiryDate });
            }
            return res.status(200).send("Success");
        }
        res.status(422).send("Invalid Amount");
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
});

// សំខាន់បំផុត៖ សម្រាប់ Vercel ត្រូវប្រើ module.exports
module.exports = app;
