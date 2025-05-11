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
import { getFirestore, doc, updateDoc, getDoc } from "firebase/firestore";

const VillageDeanLoginScreen = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secureText, setSecureText] = useState(true);
  const [role, setRole] = useState("Village Dean");

  const auth = getAuth();
  const db = getFirestore();

  const ADMIN_EMAIL = "s21810030@student.unklab.ac.id";
  const WORKER_EMAILS = ["s11810307@student.unklab.ac.id"];

  const updatePasswordInFirestore = async (email, newPassword, role) => {
    try {
      let userDocRef;

      if (role === "Village Dean") {
        userDocRef = doc(db, "Users", "admin");
      } else if (role === "Pihak Kerja") {
        userDocRef = doc(db, "Users", "pekerjaan");
      } else {
        return;
      }

      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        await updateDoc(userDocRef, { Password: newPassword });
        console.log(`✅ Password diperbarui di Firestore untuk ${role}.`);
      } else {
        console.log(`❌ Data ${role} tidak ditemukan di Firestore.`);
      }
    } catch (error) {
      console.error(`❌ Gagal memperbarui password di Firestore untuk ${role}:`, error);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Email dan Password harus diisi!");
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (role === "Village Dean" && email === ADMIN_EMAIL) {
        await updatePasswordInFirestore(email, password, "Village Dean");
        Alert.alert("Login Sukses", "Selamat datang, Village Dean!");
        navigation.navigate("VillageDeanDashboard");
      } else if (role === "Pihak Kerja" && WORKER_EMAILS.includes(email)) {
        await updatePasswordInFirestore(email, password, "Pihak Kerja");
        Alert.alert("Login Sukses", "Selamat datang, Pihak Kerja!");
        navigation.navigate("WorkLoginScreen");
      } else {
        Alert.alert("Akses Ditolak", "Email tidak cocok dengan role yang dipilih.");
      }
    } catch (error) {
      console.error("❌ Login Gagal:", error);
      Alert.alert("Login Gagal", "Email atau password salah.");
    }
  };

  return (
    <ImageBackground
      source={require("../assets/pc_unklab.jpeg")} // Pastikan gambar ada di folder yang sama
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.containerWrapper}>
        <View style={styles.container}>
          <Text style={styles.header}>
            Welcome back to the Klabat University point redemption login menu
          </Text>

          <View style={styles.inputContainer}>
       <TextInput
         value="Village Dean"
         editable={false}
         style={styles.disabledInput}
       />
       </View>




          <View style={styles.inputContainer}>
            <FontAwesome5 name="user-alt" size={20} color="#C96DD8" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <FontAwesome5 name="lock" size={20} color="#C96DD8" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={secureText}
            />
            <TouchableOpacity onPress={() => setSecureText(!secureText)} style={styles.eyeIcon}>
              <MaterialIcons name={secureText ? "visibility-off" : "visibility"} size={24} color="gray" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => navigation.navigate("ForgotPasswordScreen")} style={styles.forgotPassword}>
            <Text style={styles.forgotText}>Forgot Password ?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginText}>Login</Text>
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
    backgroundColor: "rgba(192, 117, 163, 0.6)", // Transparan agar teks tetap terbaca
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
    backgroundColor: "#fff", // Latar belakang putih
    borderRadius: 8, // Sudut membulat
    paddingHorizontal: 10,
    marginVertical: 8,
    width: "100%",
    elevation: 0, // Hilangkan bayangan di Android
    borderWidth: 1, // Tambahkan border tipis agar mirip dropdown
    borderColor: "#ccc", // Warna border netral
    shadowOpacity: 0, // Hilangkan shadow di iOS
  },
  
  input: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: "transparent", // Pastikan latar belakang transparan
    color: "#000", // Warna teks tetap hitam
    borderWidth: 0, // Hilangkan border tambahan
    outlineStyle: "none", // Hilangkan outline saat fokus (Web)
  },
  
  picker: {
    flex: 1,
    height: 40,
    borderWidth: 0,
    borderColor: "transparent",
    outlineStyle: "none", // Hilangkan garis saat fokus di web
    backgroundColor: "transparent", // Hilangkan warna default
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
  disabledInput: {
    fontSize: 17,
    color: '#555',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },  
  
});

export default VillageDeanLoginScreen;
