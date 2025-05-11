import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  TextInput,
} from "react-native";
import { db } from "../firebaseConfig";
import {
  doc,
  getDocs,
  updateDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";

const EditStudentScreen = () => {
  const [students, setStudents] = useState([]);
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [editedJam, setEditedJam] = useState("");
  const [initialJam, setInitialJam] = useState(0);
  const [initialPoints, setInitialPoints] = useState(0);
  const [pendingImage, setPendingImage] = useState({});
  const [descriptionMap, setDescriptionMap] = useState({});
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const takenSnapshot = await getDocs(collection(db, "TakenJobs"));
        const takenStudentIds = takenSnapshot.docs
          .map((doc) => doc.data().studentId)
          .filter(Boolean);

        const selectedSnapshot = await getDocs(collection(db, "SelectedJobs"));
        const selectedEmails = selectedSnapshot.docs
          .map((doc) => doc.data().email)
          .filter(Boolean);

        const userSnapshot = await getDocs(collection(db, "Users"));
        const filteredStudents = [];

        userSnapshot.forEach((doc) => {
          const data = doc.data();
          if (
            data.Role !== "admin" &&
            !takenStudentIds.includes(doc.id) &&
            !selectedEmails.includes(data.Email)
          ) {
            filteredStudents.push({ id: doc.id, ...data });
          }
        });

        setStudents(filteredStudents);
      } catch (error) {
        Alert.alert("Error", "Gagal memuat data mahasiswa");
        console.error(error);
      }
    };

    fetchData();
  }, []);

  const startEditing = (student) => {
    setEditingStudentId(student.id);
    setEditedJam(student.Jam.toString());
    setInitialJam(student.Jam);
    setInitialPoints(student.Points);
  };

  const cancelEditing = () => {
    setEditingStudentId(null);
    setEditedJam("");
    setInitialJam(0);
    setInitialPoints(0);
  };

  const saveEditing = async (studentId) => {
    const newJam = parseInt(editedJam) || 0;
    const selisihJam = newJam - initialJam;
    const newPoints = initialPoints + selisihJam * 2;

    try {
      const studentRef = doc(db, "Users", studentId);
      await updateDoc(studentRef, {
        Jam: newJam,
        Points: newPoints,
      });

      setStudents((prev) =>
        prev.map((student) =>
          student.id === studentId
            ? { ...student, Jam: newJam, Points: newPoints }
            : student
        )
      );

      cancelEditing();
      Alert.alert("Sukses", "Data berhasil diperbarui");
    } catch (error) {
      Alert.alert("Error", "Gagal menyimpan data");
      console.error(error);
    }
  };

  const handlePickImage = async (studentId) => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Izin diperlukan", "Akses lokasi wajib diizinkan");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const geoCode = await Location.reverseGeocodeAsync(loc.coords);
      let locationString = "Lokasi tidak ditemukan";
      if (geoCode.length > 0) {
        const locInfo = geoCode[0];
        locationString = `${locInfo.name || ""}, ${locInfo.city || ""}, ${locInfo.region || ""}, ${locInfo.country || ""}`;
      }

      let result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled) {
        const imageUri = result.assets[0].uri;
        setPendingImage({
          studentId,
          uri: imageUri,
          location: locationString,
        });
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Gagal mengambil gambar");
    }
  };

  const handleUpload = async () => {
    try {
      const { studentId, uri, location } = pendingImage;
      const description = descriptionMap[studentId] || "";

      const data = new FormData();
      data.append("file", {
        uri,
        type: "image/jpeg",
        name: "upload.jpg",
      });
      data.append("upload_preset", "Gambar_Saya");
      data.append("cloud_name", "ddmz8ct9u");

      const response = await fetch("https://api.cloudinary.com/v1_1/ddmz8ct9u/image/upload", {
        method: "POST",
        body: data,
      });

      const uploadResult = await response.json();

      const studentRef = doc(db, "Users", studentId);
      await updateDoc(studentRef, {
        imageUrl: uploadResult.secure_url,
        ImageApproved: false,
        Timestamp: serverTimestamp(),
        Location: location,
        description: description,
      });

      Alert.alert("Sukses", "Gambar dan deskripsi berhasil diunggah");
      setPendingImage({});
      setDescriptionMap((prev) => ({ ...prev, [studentId]: "" }));
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Gagal mengunggah gambar");
    }
  };

  const renderStudentItem = ({ item }) => {
    const isEditing = editingStudentId === item.id;
    const isPendingUpload = pendingImage.studentId === item.id;

    return (
      <View style={styles.studentItem}>
        <Text style={styles.studentText}>Nama: {item.Name}</Text>
        <Text style={styles.studentText}>NIM: {item.Nim}</Text>

        {isEditing ? (
          <>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={editedJam}
              onChangeText={(text) => setEditedJam(text)}
            />
            <View style={styles.editButtonGroup}>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => saveEditing(item.id)}
              >
                <Text style={styles.buttonText}>Simpan</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={cancelEditing}
              >
                <Text style={styles.buttonText}>Batal</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.studentText}>Jam Kerja: {item.Jam}</Text>
            <Text style={styles.studentText}>Points: {item.Points}</Text>

            <TouchableOpacity
              style={styles.editButton}
              onPress={() => startEditing(item)}
            >
              <Text style={styles.editButtonText}>Edit Jam Kerja</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => handlePickImage(item.id)}
        >
          <MaterialIcons name="camera-alt" size={24} color="black" />
        </TouchableOpacity>

        {isPendingUpload && (
          <>
            <TextInput
              style={styles.input}
              placeholder="Deskripsi"
              value={descriptionMap[item.id] || ""}
              onChangeText={(text) =>
                setDescriptionMap((prev) => ({ ...prev, [item.id]: text }))
              }
            />
            <TouchableOpacity style={styles.uploadButton} onPress={handleUpload}>
              <Text style={styles.uploadButtonText}>Upload</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch = student.Name && 
      student.Name.toLowerCase().includes(searchQuery.toLowerCase());
    const hasPoints = student.Points && student.Points > 0;
    return matchesSearch && hasPoints;
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}></Text>

      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={24} color="black" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Cari nama mahasiswa"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredStudents}
        keyExtractor={(item) => item.id}
        renderItem={renderStudentItem}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5", padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  listContainer: { paddingBottom: 100 },
  studentItem: { 
    backgroundColor: "#fff", 
    padding: 15, 
    borderRadius: 8, 
    marginBottom: 10,
    position: 'relative',
  },
  studentText: { fontSize: 16, marginBottom: 5 },
  input: { 
    borderWidth: 1, 
    borderColor: "#ccc", 
    borderRadius: 5, 
    padding: 8, 
    marginTop: 10,
    marginBottom: 10,
  },
  editButton: { 
    backgroundColor: "#4CAF50", 
    padding: 10, 
    borderRadius: 5, 
    marginTop: 10,
  },
  editButtonText: { color: "#fff", textAlign: "center" },
  editButtonGroup: { 
    flexDirection: "row", 
    marginTop: 10,
    marginBottom: 10,
  },
  saveButton: { 
    backgroundColor: "#2196F3", 
    flex: 1, 
    padding: 10, 
    borderRadius: 5, 
    marginRight: 5,
  },
  cancelButton: { 
    backgroundColor: "#f44336", 
    flex: 1, 
    padding: 10, 
    borderRadius: 5, 
    marginLeft: 5,
  },
  buttonText: { color: "#fff", textAlign: "center" },
  iconButton: { 
    position: "absolute", 
    top: 15, 
    right: 15,
  },
  uploadButton: { 
    backgroundColor: "#FF9800", 
    padding: 10, 
    borderRadius: 5,
  },
  uploadButtonText: { color: "#fff", textAlign: "center" },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
  },
});

export default EditStudentScreen;