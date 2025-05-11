import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { useRoute } from "@react-navigation/native";

const ViewAbsentScreen = () => {
  const route = useRoute();
  const { email } = route.params || {};
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fungsi untuk mendapatkan keterangan berdasarkan total poin
  const getKeterangan = (points) => {
    if (points >= 1 && points <= 28) {
      return "Menghadap Sir Refly";
    } else if (points >= 29 && points <= 49) {
      return "Pemanggilan Orang Tua";
    } else if (points >= 50) {
      return "Diskors Semester Berikutnya";
    } else {
      return "Boleh Melakukan Pendaftaran"; // Jika tidak ada poin
    }
  };

  useEffect(() => {
    if (!email) {
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

            const imageApproved = user.ImageApproved || false;
            const totalPoin = user.Points || 0; // Default ke 0 jika tidak tersedia

            setProfile({
              name: user.Name || "Tidak Diketahui",
              total_poin: imageApproved ? "" : totalPoin, // Kosongkan jika disetujui
              total_jam_kerja: imageApproved ? "" : user.Jam || "Tidak Diketahui", 
              tempat_kerja: imageApproved ? "" : user.Tempat_Kerja || "Tidak Diketahui",
              keterangan: getKeterangan(totalPoin), // Dapatkan status berdasarkan poin
              imageApproved,
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
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.headerText}>{profile?.name || "User"}</Text>
          </View>

          <TouchableOpacity style={styles.statButton}>
            <Text style={styles.statButtonText}>Sabbath Points Statistics</Text>
          </TouchableOpacity>

          {loading ? (
            <ActivityIndicator size="large" color="#007BFF" />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <>
              {/* Tampilkan data hanya jika ImageApproved === false */}
              {!profile.imageApproved && (
                <View style={styles.dataBox}>
                  <Text style={styles.dataLabel}>Total Working Hours</Text>
                  <Text style={styles.dataValue}>{profile.total_jam_kerja}</Text>
                </View>
              )}

              {!profile.imageApproved && (
                <View style={styles.dataBox}>
                  <Text style={styles.dataLabel}>Total Points</Text>
                  <Text style={styles.dataValue}>{profile.total_poin}</Text>
                </View>
              )}

              {/* Tambahkan status berdasarkan total poin */}
              {!profile.imageApproved && (
                <View style={styles.dataBox}>
                  <Text style={styles.dataLabel}>Punishment Description</Text>
                  <Text style={styles.dataValue}>{profile.keterangan}</Text>
                </View>
              )}

              {/* Status Persetujuan Gambar */}
              <View style={styles.dataBox}>
                <Text style={styles.dataLabel}>Your Registration Status</Text>
                <Text
                  style={[
                    styles.dataValue,
                    { color: profile.imageApproved ? "green" : "red" },
                  ]}
                >
                  {profile.imageApproved ? "Approved ✅" : "Not Approved ❌"}
                </Text>
              </View>
            </>
          )}
        </View>

        <Text style={styles.footerText}>Universitas Klabat</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: "center",
    paddingVertical: 150,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 20,
    width: "90%",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  statButton: {
    backgroundColor: "#FF8C00",
    padding: 12,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 20,
  },
  statButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  dataBox: {
    backgroundColor: "#E9ECEF",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: "center",
  },
  dataLabel: {
    fontSize: 16,
    fontWeight: "bold",
  },
  dataValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    marginTop: 5,
  },
  footerText: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 20,
    textAlign: "center",
  },
  errorText: {
    fontSize: 16,
    color: "red",
    textAlign: "center",
    marginTop: 20,
  },
});

export default ViewAbsentScreen;
