import React, { useState, useEffect } from "react";
import { View, Text, Image, StyleSheet, ActivityIndicator } from "react-native";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { useRoute } from "@react-navigation/native";

const ProfileView = () => {
  const route = useRoute();
  const { email } = route.params || {};
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!email) {
      console.error("Email tidak tersedia, tidak dapat mengambil data.");
      setError("Email tidak tersedia.");
      setLoading(false);
      return;
    }

    const fetchUserProfile = async () => {
      try {
        console.log("🚀 Mengambil data dari Firestore...");
        const firestore = getFirestore();
        const usersCollection = collection(firestore, "Users");
        const q = query(usersCollection, where("Email", "==", email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          querySnapshot.forEach((docSnapshot) => {
            const user = docSnapshot.data();
            console.log("✅ User ditemukan:", user);

            setProfile({
              name: user.Name || "Tidak Diketahui",
              email: user.Email || "Tidak Diketahui",
              regis: user.Regis || "Tidak Diketahui",
              nim: user.Nim || "Tidak Diketahui",
              seating: user.Seating || "Tidak Diketahui",
            });
          });
        } else {
          console.log("⚠️ User tidak ditemukan dalam Firestore.");
          setError("User tidak ditemukan.");
          setProfile(null);
        }
      } catch (error) {
        console.error("❌ Error saat mengambil data dari Firestore:", error);
        setError("Gagal mengambil data dari server.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [email]);

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : profile ? (
        <>
          <View style={styles.profileSection}>
            <Image
              source={{
                uri: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
              }}
              style={styles.profileImage}
            />
          </View>

          <View style={styles.infoSection}>
            <View style={styles.infoBox}>
              <Text style={styles.label}>Full Name</Text>
              <Text style={styles.value}>{profile.name}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{profile.email}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.label}>Regis</Text>
              <Text style={styles.value}>{profile.regis}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.label}>NIM</Text>
              <Text style={styles.value}>{profile.nim}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.label}>Seating</Text>
              <Text style={styles.value}>{profile.seating}</Text>
            </View>
          </View>
        </>
      ) : (
        <Text style={styles.errorText}>Data tidak ditemukan</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EAEFF5",
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
  profileSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#ccc",
  },
  infoSection: {
    width: "90%",
    padding: 15,
    backgroundColor: "#ffffff",
    borderRadius: 10,
    elevation: 3,
  },
  infoBox: {
    backgroundColor: "#FCE4EC",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: "flex-start",
  },
  label: {
    fontSize: 14,
    color: "#616161",
    fontWeight: "bold",
  },
  value: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
    marginTop: 5,
  },
  errorText: {
    fontSize: 16,
    color: "red",
    textAlign: "center",
    fontWeight: "bold",
  },
});

export default ProfileView;
