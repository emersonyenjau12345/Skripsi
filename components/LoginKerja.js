import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ImageBackground,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const LoginKerja = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secureText, setSecureText] = useState(true);

  const auth = getAuth();
  const db = getFirestore();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Email dan Password harus diisi!");
      return;
    }

    try {
      // 1. Login ke Firebase Authentication
      await signInWithEmailAndPassword(auth, email.trim(), password);

      // 2. Ambil data user dari Firestore (dari koleksi 'Pemberikerja')
      const docRef = doc(db, "Pemberikerja", email.trim());
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();
        if (userData.role === "pihak_kerja") {
          Alert.alert("Login Sukses", `Selamat datang, ${userData.name || "Pihak Kerja"}`);
          navigation.navigate("DaftarSiswa");
        } else {
          Alert.alert("Akses Ditolak", "Akun ini bukan role pihak_kerja.");
        }
      } else {
        Alert.alert("Login Gagal", "Data user tidak ditemukan di koleksi 'Pemberikerja'.");
      }
    } catch (error) {
      console.error("Login Error:", error);
      if (error.code === "auth/user-not-found") {
        Alert.alert("Login Gagal", "Email tidak ditemukan di Firebase Authentication.");
      } else if (error.code === "auth/wrong-password") {
        Alert.alert("Login Gagal", "Password salah.");
      } else {
        Alert.alert("Login Gagal", error.message || "Terjadi kesalahan saat login.");
      }
    }
  };

  return (
    <ImageBackground
      source={require("../assets/pc_unklab.jpeg")}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.containerWrapper}>
        <View style={styles.container}>
          <Text style={styles.header}>
            Selamat datang di menu login redeem poin Universitas Klabat
          </Text>

          <View style={styles.inputContainer}>
            <FontAwesome5 name="user-alt" size={20} color="#C96DD8" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Alamat Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <FontAwesome5 name="lock" size={20} color="#C96DD8" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Kata Sandi"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={secureText}
            />
            <TouchableOpacity onPress={() => setSecureText(!secureText)} style={styles.eyeIcon}>
              <MaterialIcons name={secureText ? "visibility-off" : "visibility"} size={24} color="gray" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => navigation.navigate("ForgotPasswordScreen")} style={styles.forgotPassword}>
            <Text style={styles.forgotText}>Lupa Kata Sandi?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginText}>Masuk</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  containerWrapper: {
    flex: 1,
    backgroundColor: "rgba(192, 117, 163, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    width: "100%",
  },
  container: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    elevation: 5,
  },
  header: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginVertical: 8,
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: "transparent",
    color: "#000",
    borderWidth: 0,
  },
  eyeIcon: {
    padding: 5,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginTop: 5,
  },
  forgotText: {
    color: "#555",
  },
  loginButton: {
    backgroundColor: "#800080",
    paddingVertical: 12,
    width: "100%",
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  loginText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
});

export default LoginKerja;
