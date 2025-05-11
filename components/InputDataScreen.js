import React, { useState, useEffect } from "react";
import { View, Text, FlatList, Image, StyleSheet, Alert, ActivityIndicator, TouchableOpacity } from "react-native";
import { auth, db } from "../firebaseConfig";
import { doc, getDoc, collection, getDocs, runTransaction } from "firebase/firestore";

const InputDataScreen = () => {
  const [userPoints, setUserPoints] = useState(null);
  const [userName, setUserName] = useState("");
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasSelectedJob, setHasSelectedJob] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        await fetchUserData(currentUser.email);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchUserData = async (email) => {
    try {
      const userRef = doc(db, "Users", email);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        setUserPoints(data.Points);
        setUserName(data.Name);

        const selectedJobRef = doc(db, "SelectedJobs", email);
        const selectedJobSnap = await getDoc(selectedJobRef);

        if (selectedJobSnap.exists()) {
          setHasSelectedJob(true);
        } else {
          if (data.Points > 49) {
            await fetchJobs();
          }
        }
      } else {
        console.log("❌ Data user tidak ditemukan");
      }
    } catch (error) {
      console.error("❌ Error mengambil data user:", error);
      Alert.alert("Error", "Gagal mengambil data user.");
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
    try {
      const jobsSnap = await getDocs(collection(db, "TakenJobs"));
      const jobsList = [];
      jobsSnap.forEach((doc) => {
        jobsList.push({ id: doc.id, ...doc.data() });
      });
      setJobs(jobsList);
    } catch (error) {
      console.error("❌ Error mengambil pekerjaan:", error);
      Alert.alert("Error", "Gagal mengambil daftar pekerjaan.");
    }
  };

  const handleJobSelection = async (selectedJob) => {
    if (hasSelectedJob) {
      Alert.alert("Peringatan", "Anda sudah memilih pekerjaan dan tidak bisa mengganti lagi.");
      return;
    }

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert("Error", "User tidak ditemukan. Silakan login kembali.");
        return;
      }

      const jobRef = doc(db, "TakenJobs", selectedJob.id);

      Alert.alert(
        "Konfirmasi",
        `Apakah Anda yakin memilih pekerjaan: ${selectedJob.title}?`,
        [
          { text: "Batal", style: "cancel" },
          {
            text: "Ya, Pilih",
            onPress: async () => {
              try {
                await runTransaction(db, async (transaction) => {
                  const jobDoc = await transaction.get(jobRef);

                  if (!jobDoc.exists()) {
                    throw "Pekerjaan tidak ditemukan.";
                  }

                  const currentLimit = jobDoc.data().limit ?? 0;

                  if (currentLimit <= 0) {
                    throw "Pekerjaan ini sudah penuh.";
                  }

                  // Update limit pekerjaan
                  transaction.update(jobRef, {
                    limit: currentLimit - 1,
                  });

                  // Simpan pilihan mahasiswa dengan tambahan tempat kerja
                  const selectedJobRef = doc(db, "SelectedJobs", currentUser.email);
                  transaction.set(selectedJobRef, {
                    email: currentUser.email,
                    name: userName,
                    jobId: selectedJob.id,
                    jobTitle: selectedJob.title,
                    jobImage: selectedJob.imageUrl,
                    jobPlace: selectedJob.place, // ✅ Menyimpan tempat kerja
                    timestamp: new Date(),
                  });
                });

                setHasSelectedJob(true);
                Alert.alert("Sukses", `Anda berhasil memilih pekerjaan: ${selectedJob.title}`);
              } catch (error) {
                console.error("❌ Transaction error:", error);
                Alert.alert("Error", error?.message || error || "Gagal memilih pekerjaan.");
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error("❌ Error saat memilih pekerjaan:", error);
      Alert.alert("Error", "Gagal memilih pekerjaan. Coba lagi.");
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#800080" />
      </View>
    );
  }

  if (userPoints === null) {
    return (
      <View style={styles.centered}>
        <Text style={styles.warningText}>Data user tidak ditemukan. Silakan login kembali.</Text>
      </View>
    );
  }

  if (userPoints <= 49) {
    return (
      <View style={styles.centered}>
        <Text style={styles.warningText}>Maaf, Anda membutuhkan lebih dari 49 poin untuk melihat pekerjaan.</Text>
      </View>
    );
  }

  if (hasSelectedJob) {
    return (
      <View style={styles.centered}>
        <Text style={styles.warningText}>Anda sudah memilih pekerjaan dan tidak bisa memilih lagi.</Text>
      </View>
    );
  }

  if (jobs.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.warningText}>Belum ada pekerjaan tersedia.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.pointsText}>Total Points Anda: {userPoints}</Text>
      <Text style={styles.title}>Pekerjaan hanya bisa di ambil satu kali</Text>

      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleJobSelection(item)}
            style={[styles.jobCard, item.limit <= 0 && { backgroundColor: "#ccc" }]}
            disabled={item.limit <= 0}
          >
            <Image source={{ uri: item.imageUrl }} style={styles.jobImage} />
            <Text style={styles.jobTitle}>Kerja: {item.title}</Text>
            <Text style={styles.jobPlace}>Tempat: {item.place}</Text>
            <Text style={[styles.jobLimit, item.limit <= 0 && { color: "red" }]}>{item.limit <= 0 ? "Penuh" : `Sisa Kuota: ${item.limit}`}</Text>
          </TouchableOpacity>
        )}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f4f4",
    padding: 15,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  warningText: {
    fontSize: 18,
    color: "red",
    textAlign: "center",
  },
  pointsText: {
    fontSize: 18,
    color: "#800080",
    textAlign: "center",
    marginBottom: 10,
    fontWeight: "bold",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
    textAlign: "center",
  },
  jobCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
    width: "48%",
    alignItems: "center",
    elevation: 2,
  },
  jobImage: {
    width: "100%",
    height: 120,
    borderRadius: 8,
    marginBottom: 10,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    textAlign: "center",
  },
  jobPlace: {
    fontSize: 14,
    color: "#555",
    marginBottom: 4,
    textAlign: "center",
  },
  jobLimit: {
    fontSize: 14,
    color: "#666",
  },
});

export default InputDataScreen;
