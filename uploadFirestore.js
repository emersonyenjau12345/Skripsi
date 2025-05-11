const admin = require("firebase-admin");
const fs = require("fs");

// 🔥 Inisialisasi Firebase
const serviceAccount = require("./serviceAccountKey.json"); // Pastikan path benar
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://coneksiaplikasi-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const db = admin.firestore();
const auth = admin.auth();

// 📂 Baca file JSON dengan daftar user
const rawData = fs.readFileSync("daftar_seating_full.json"); // Sesuaikan dengan nama file JSON yang sudah dikonversi dari Excel
const usersData = JSON.parse(rawData).Users;

// 🚀 Fungsi untuk mengunggah data ke Firestore & Auth
async function uploadData() {
  const batch = db.batch();

  for (const [email, userData] of Object.entries(usersData)) {
    const userRef = db.collection("Users").doc(email);

    try {
      // 🔹 Tambahkan user ke Firebase Authentication
      const newUser = await auth.createUser({
        email: email,
        password: userData.Password.toString(), // Ambil password dari file JSON
        displayName: userData.Nama,
        disabled: false,
      });

      console.log(`✅ User ${email} berhasil ditambahkan ke Auth`);

      // 🔹 Ambil semua data dari JSON tanpa hardcode
      const firestoreData = { ...userData, AuthUID: newUser.uid };

      // 🔹 Tambahkan user ke Firestore
      batch.set(userRef, firestoreData);

    } catch (error) {
      console.error(`❌ Gagal menambahkan ${email} ke Auth:`, error.message);
    }
  }

  await batch.commit();
  console.log("🎉 Semua data berhasil diunggah ke Firestore dan Auth!");
}

// 🚀 Jalankan fungsi upload
uploadData().catch(console.error);
