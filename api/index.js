const express = require('express');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, updateDoc } = require('firebase/firestore');

const app = express();
app.use(express.json());

// --- ត្រូវប្រាកដថា Config នេះត្រូវជាមួយ Firebase របស់អ្នក ១០០% ---
const firebaseConfig = {
  apiKey: "AIza...", 
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:..."
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

app.post('/api/aba-webhook', async (req, res) => {
    try {
        const message = req.body.message;
        if (!message || !message.text) return res.status(200).send("No Text");

        const notiText = message.text;
        console.log("សារដែលទទួលបាន:", notiText);

        // ឆែករកលេខ 9.99 ក្នុងសារ (មិនថាមានសញ្ញា $ ឬអត់)
        if (notiText.includes("9.99")) {
            // ស្វែងរក User ដែលកំពុងរង់ចាំ
            const userQuery = query(
                collection(db, "users"), 
                where("status", "==", "pending"),
                where("pendingAmount", "==", "$9.99")
            );

            const querySnapshot = await getDocs(userQuery);

            if (querySnapshot.empty) {
                console.log("រកមិនឃើញ User ដែលមាន Status 'pending' និង Amount '$9.99'");
                return res.status(200).send("No matching user found");
            }

            // ធ្វើការ Update Status ទៅជា 'paid'
            for (const userDoc of querySnapshot.docs) {
                await updateDoc(userDoc.ref, { 
                    status: "paid",
                    updatedAt: new Date()
                });
                console.log("បាន Update ជោគជ័យសម្រាប់ ID:", userDoc.id);
            }
            return res.status(200).send("Success Updated");
        }

        res.status(200).send("Not a payment message");
    } catch (error) {
        console.error("Error occurred:", error.message);
        res.status(500).send(error.message);
    }
});

module.exports = app;
