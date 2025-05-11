import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native";
import {
  getAuth,
  updatePassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { useRoute, useNavigation } from "@react-navigation/native";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore"; // Firestore digunakan

import Icon from "react-native-vector-icons/FontAwesome";

const ChangePasswordScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { email } = route.params || {};

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    if (email) {
      setDisplayName(email.split("@")[0]);
    }
  }, [email]);

  const auth = getAuth();
  const firestore = getFirestore();

  // ✅ Update Password di Firestore
  const updatePasswordInFirestore = async (newPassword) => {
    try {
      const usersCollection = collection(firestore, "Users");
      const q = query(usersCollection, where("Email", "==", email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        querySnapshot.forEach(async (docSnapshot) => {
          const userRef = doc(firestore, "Users", docSnapshot.id);
          await updateDoc(userRef, { Password: newPassword });
          console.log(
            `✅ Password diperbarui di Firestore untuk ${docSnapshot.id}`
          );
        });
      } else {
        console.log("❌ User tidak ditemukan di Firestore.");
      }
    } catch (error) {
      console.error("❌ Gagal memperbarui password di Firestore:", error);
    }
  };

  const handleChangePassword = async () => {
    if (!email) {
      Alert.alert("Error", "Email tidak ditemukan.");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "Password baru harus minimal 6 karakter!");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Password baru tidak cocok!");
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        oldPassword
      );
      const user = userCredential.user;

      await updatePassword(user, newPassword);
      console.log("✅ Password berhasil diubah di Firebase Auth!");

      await updatePasswordInFirestore(newPassword);

      await signOut(auth);
      console.log("✅ User berhasil logout!");

      Alert.alert(
        "Sukses",
        "Password berhasil diperbarui di Firebase dan Firestore! Silakan login kembali dengan password baru.",
        [
          {
            text: "OK",
            onPress: () => navigation.replace("StudentLoginScreen"),
          },
        ]
      );

      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("❌ Gagal memperbarui password:", error);
      Alert.alert(
        "Error",
        "Gagal memperbarui password. Pastikan password lama benar."
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.userContainer}>
          <Icon name="user-circle" size={60} color="#EE82EE" />
          <Text style={styles.userName}>{displayName}</Text>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Old Password"
          secureTextEntry
          value={oldPassword}
          onChangeText={setOldPassword}
        />
        <TextInput
          style={styles.input}
          placeholder="New Password"
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm New Password"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        <TouchableOpacity style={styles.button} onPress={handleChangePassword}>
          <Text style={styles.buttonText}>Change Password</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: "90%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  userContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 5,
    color: "#333",
  },
  userEmail: {
    fontSize: 14,
    color: "#777",
  },
  input: {
    backgroundColor: "#F2F2F2",
    padding: 12,
    borderRadius: 5,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#DDD",
  },
  button: {
    backgroundColor: "#800080",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ChangePasswordScreen;
