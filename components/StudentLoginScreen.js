import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { useWindowDimensions } from "react-native";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig"; // Pastikan Firestore diinisialisasi di firebaseConfig.js

const StudentLoginScreen = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secureText, setSecureText] = useState(true);
  const { width } = useWindowDimensions();

  const isLargeScreen = width > 768;
  const auth = getAuth();
  const firestore = getFirestore();

  // Daftar email pihak kerja dan admin yang tidak boleh login
  const blockedEmails = [
    "s21810030@student.unklab.ac.id",
    "s11810307@student.unklab.ac.id",
  ];

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Email and Password must be filled in!");
      return;
    }

    // Cek apakah email masuk dalam daftar yang dilarang
    if (blockedEmails.includes(email.toLowerCase())) {
      Alert.alert("Login Failed", "You do not have access to this system!");
      return;
    }

    try {
      // Login ke Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Ambil data pengguna dari Firestore berdasarkan email
      const usersRef = collection(firestore, "Users");
      const q = query(usersRef, where("Email", "==", email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        navigation.replace("DashboardStudent", { email: userData.Email });
      } else {
        Alert.alert("Login Failed", "Email is not registered in the system!");
      }
    } catch (error) {
      let errorMessage = "Wrong password.";
      if (error.code === "auth/user-not-found") errorMessage = "Email not registered!";
      else if (error.code === "auth/wrong-password") errorMessage = "Password salah!";
      else if (error.code === "auth/invalid-email") errorMessage = "Invalid email format!";
      Alert.alert("Login Failed", errorMessage);
    }
  };

  return (
    <View style={[styles.container, { paddingHorizontal: isLargeScreen ? 50 : 20 }]}>
      <Text style={[styles.header, { fontSize: width * 0.04 }]}>
        Welcome back to Klabat University {"\n"} point redemption login menu
      </Text>

      <View style={styles.inputContainer}>
        <TextInput style={styles.input} value="Student" editable={false} />
      </View>

      <View style={styles.inputContainer}>
        <FontAwesome5 name="user-alt" size={width * 0.05} color="#C96DD8" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Email Address"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputContainer}>
        <FontAwesome5 name="lock" size={width * 0.05} color="#C96DD8" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={secureText}
        />
        <TouchableOpacity onPress={() => setSecureText(!secureText)} style={styles.eyeIcon}>
          <MaterialIcons name={secureText ? "visibility-off" : "visibility"} size={width * 0.06} color="gray" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={[styles.loginButton, { width: isLargeScreen ? "50%" : "80%" }]} onPress={handleLogin}>
        <Text style={styles.loginText}>Login</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 2,
    backgroundColor: "#EAD1F5",
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginVertical: 5,
    width: "90%",
    elevation: 3,
  },
  icon: {
    marginRight: 20,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
    borderBottomWidth: 0, // Menghindari garis bawah hitam kecil
    outlineStyle: "none", // Untuk mencegah efek focus di web
  },
  
  eyeIcon: {
    padding: 5,
  },
  loginButton: {
    backgroundColor: "#800080",
    paddingVertical: 14,
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

export default StudentLoginScreen;
