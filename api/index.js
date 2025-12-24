app.post('/api/aba-webhook', async (req, res) => {
    try {
        const message = req.body.message;
        if (!message || !message.text) return res.status(200).send("No Text");

        const notiText = message.text;
        console.log("សារដែលទទួលបាន:", notiText);

        // ឆែករកតែលេខ 9.99 សុទ្ធ ព្រោះក្នុងសារ ABA អាចមានដកឃ្លាខុសគ្នា
        if (notiText.includes("9.99")) {
            // ស្វែងរកក្នុង Firebase ដែលមាន Status 'pending'
            const userQuery = query(
                collection(db, "users"), 
                where("status", "==", "pending")
            );

            const querySnapshot = await getDocs(userQuery);

            // បើឃើញ User ណាមួយដែលមាន Status 'pending' គឺយើង Update ឱ្យគាត់តែម្ដង
            for (const userDoc of querySnapshot.docs) {
                const userData = userDoc.data();
                // ឆែកមើលបន្ថែមថា តើទឹកប្រាក់ក្នុង Database ត្រូវនឹង $9.99 ដែរឬទេ
                if (userData.pendingAmount === "$9.99") {
                    await updateDoc(userDoc.ref, { 
                        status: "paid",
                        updatedAt: new Date()
                    });
                    console.log("Update ជោគជ័យ!");
                }
            }
            return res.status(200).send("Success");
        }
        res.status(200).send("Not 9.99");
    } catch (error) {
        res.status(500).send(error.message);
    }
});
