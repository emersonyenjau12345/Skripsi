
// VillageDeanDashboardScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  ScrollView,
  Linking,
} from "react-native";
import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { db } from "../firebaseConfig"; // Pastikan ini adalah konfigurasi Firebase Anda
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { useNavigation } from '@react-navigation/native';

const VillageDeanDashboardScreen = () => {
  const navigation = useNavigation();
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeTab, setActiveTab] = useState("viewPoints");
  const [searchQuery, setSearchQuery] = useState("");
  const [editedData, setEditedData] = useState({});

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersCollection = collection(db, "Users");
        const userSnapshot = await getDocs(usersCollection);
        const usersList = userSnapshot.docs
          .map((doc, index) => ({
            id: doc.id,
            No: index + 1,
            ...doc.data(),
          }))
          .filter((user) => user.Name !== "admin" && user.Name !== "pekerjaan");
        console.log("Fetched Users: ", usersList);
        setUsers(usersList);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    const fetchMessages = async () => {
      try {
        const messagesCollection = collection(db, "chats");
        const messagesSnapshot = await getDocs(messagesCollection);
        const messagesList = messagesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMessages(messagesList);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchUsers();
    fetchMessages();
  }, []);

  const filteredUsers = users.filter((user) =>
    user.Name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (id, field, value) => {
    setEditedData({ 
      ...editedData, 
      [id]: { ...editedData[id], [field]: value } 
    });
  };

  const openImage = (imageUrl) => {
    if (imageUrl) {
      Linking.openURL(imageUrl);
    } else {
      alert("Tidak ada gambar untuk ditampilkan!");
    }
  };


  const approveImage = async (id, email) => {
    try {
        console.log("Mencari pengguna dengan email:", email);

        const usersCollection = collection(db, "Users");
        const userSnapshot = await getDocs(usersCollection);

        const allUsers = userSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        console.log("Semua user yang ditemukan:", allUsers);

        const userData = allUsers.find((user) => user.Email.toLowerCase() === email.toLowerCase());

        if (!userData) {
            alert("Error: Pengguna tidak ditemukan!");
            return;
        }

        if (!userData.imageUrl || userData.imageUrl.trim() === "") {
            alert("Error: Gambar belum tersedia!");
            return;
        }

        if (parseInt(userData.Points, 10) !== 0) {
            alert("Error: Poin harus 0 untuk approve!");
            return;
        }

        // Pastikan ImageApproved tetap true setelah disetujui
        const userRef = doc(db, "Users", userData.id);
        await updateDoc(userRef, { ImageApproved: true });

        setUsers(users.map(user =>
            user.id === userData.id ? { ...user, ImageApproved: true } : user
        ));

        alert("Gambar Disetujui!");

        // Panggil approvePoints untuk memperbarui poin dan status
        approvePoints(userData.id, parseInt(userData.Points, 10), userData.imageUrl);

    } catch (error) {
        console.error("Error approving image:", error);
    }
};

const approvePoints = async (id, points, imageUrl) => {
  try {
    const userRef = doc(db, "Users", id);
    
    // Ambil data lama sebelum update
    const userSnapshot = await getDoc(userRef);
    const oldUserData = userSnapshot.data();

    if (!oldUserData) return;

    // Periksa perubahan poin dan gambar
    const pointsChanged = oldUserData.Points !== points;
    const imageChanged = oldUserData.imageUrl !== imageUrl;
    const imageDeleted = !imageUrl || imageUrl.trim() === ""; // Jika gambar dihapus

    // Status ImageApproved hanya berubah ke false jika poin atau gambar berubah/hilang
    const imageApproved = (pointsChanged || imageChanged || imageDeleted) ? false : oldUserData.ImageApproved;

    await updateDoc(userRef, {
      Points: points,
      ImageApproved: imageApproved, 
    });

    // Update state lokal agar tampilan diperbarui tanpa reload
    setFilteredUsers(prevUsers =>
      prevUsers.map(user =>
        user.id === id ? { ...user, Points: points, ImageApproved: imageApproved } : user
      )
    );

    console.log("Data berhasil diperbarui di Firestore.");
  } catch (error) {
    console.error("Gagal memperbarui data di Firestore:", error);
  }
};

const handleSave = async (id) => {
    const updatedUser = editedData[id];
    if (updatedUser) {
        // Ambil data lama sebelum diupdate
        const oldUserData = users.find(user => user.id === id);
        
        // Periksa apakah poin atau gambar berubah/hilang
        const pointsChanged = oldUserData.Points !== parseInt(updatedUser.Points, 10);
        const imageChanged = oldUserData.imageUrl !== updatedUser.imageUrl;
        const imageDeleted = !updatedUser.imageUrl || updatedUser.imageUrl.trim() === "";

        await updateDoc(doc(db, "Users", id), {
            ...updatedUser,
            // Jika poin atau gambar berubah/hilang, reset persetujuan gambar
            ImageApproved: (pointsChanged || imageChanged || imageDeleted) ? false : oldUserData.ImageApproved,
        });

        setUsers(users.map((user) => (user.id === id ? { ...user, ...updatedUser } : user)));
        setEditedData({ ...editedData, [id]: {} });

        alert("Data Updated!");
    }
};

  
  const handleCancel = (id) => {
    const originalUser  = users.find((user) => user.id === id);
    if (originalUser ) {
      setEditedData({
        ...editedData, 
        [id]: {
          Seating: originalUser .Tempat_Kerja,
          Points: String(originalUser .Points),
        }
      });
    }
  };

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
  
// Di dalam komponen
return (
  <View style={styles.container}>
    <View style={styles.navbar}>
      <View style={styles.navbarLeft}>
        <Image source={require("../assets/logo.png")} style={styles.logo} />
        <Text style={styles.navbarTitle}>Redeem Point System</Text>
      </View>

      <View style={styles.navLinks}>
        <TouchableOpacity onPress={() => Linking.openURL("https://www.unklab.ac.id/visi-misi-tujuan/")}>
          <Text style={styles.navLink}>Visi & Misi</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Linking.openURL("https://www.unklab.ac.id/counter/")}>
          <Text style={styles.navLink}>Contact Us</Text>
        </TouchableOpacity>
      </View>

     
      {/* Search input */}
      <TextInput
        style={styles.searchInput}
        placeholder="Search by name..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
    </View>

      <View style={styles.mainContent}>
        <View style={styles.sidebar}>
          <Text style={styles.sidebarTitle}>Redeem Point</Text>

          <TouchableOpacity onPress={() => setActiveTab("editPoints")}>
  <Text style={[
    styles.sidebarItem,
    activeTab === "editPoints" && styles.activeSidebarItem
  ]}>
    Edit Point
  </Text>
</TouchableOpacity>

<TouchableOpacity onPress={() => setActiveTab("viewPoints")}>
  <Text style={[
    styles.sidebarItem,
    activeTab === "viewPoints" && styles.activeSidebarItem
  ]}>
    View Point
  </Text>
</TouchableOpacity>

<TouchableOpacity onPress={() => setActiveTab("approvePoints")}>
  <Text style={[
    styles.sidebarItem,
    activeTab === "approvePoints" && styles.activeSidebarItem
  ]}>
    Approve Student
  </Text>
</TouchableOpacity>

<TouchableOpacity onPress={() => navigation.navigate('VillageChating')}>
  <Text style={styles.sidebarItem}>Chat</Text>
</TouchableOpacity>

<TouchableOpacity onPress={() => navigation.navigate('NewScreen')}>
  <Text style={styles.sidebarItem}>Add Work Party</Text>
</TouchableOpacity>


          <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate("AddStudentScreen")}
            >
          <Text style={styles.addButtonText}>Add Student</Text> </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>
            {activeTab === "editPoints"
              ? "EDIT POINT"
              : activeTab === "approvePoints"
              ? "APPROVE POINT"
              : "VIEW POINT"}
          </Text>

          {activeTab === "viewPoints" && (
  <View>
    {/* Keterangan Tabel */}
    <View style={styles.tableHeader}>
      <Text style={styles.headerCell}>Name</Text>
      <Text style={styles.headerCell}>NIM</Text>
      <Text style={styles.headerCell}>Regis</Text>
      <Text style={styles.headerCell}>Seating</Text>
      <Text style={styles.headerCell}>Punishment Description</Text>
      <Text style={styles.headerCell}>point</Text>
      <Text style={styles.headerCell}>Registration status information</Text>

    </View>

    {/* Data Tabel */}
    <ScrollView style={styles.tableBody}>
    <FlatList
  data={filteredUsers}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => {
    const points = parseInt(item.Points) || 0;
    return (
      <View style={styles.tableRow}>
        {/* Ganti kolom No dengan icon user */}
        <View style={styles.iconCell}>
        <FontAwesome5 name="user" size={20} color="rgb(107, 40, 104)" />

        </View>
        <Text style={styles.tableCell}>{item.Name}</Text>
        <Text style={styles.tableCell}>{item.Nim}</Text>
        <Text style={styles.tableCell}>{item.Regis}</Text>
        <Text style={styles.tableCell}>{item.Seating}</Text>
        <Text style={styles.tableCell}>{getKeterangan(points)}</Text>
        <Text style={styles.tableCell}>{points}</Text>
        <Text style={styles.tableCell}>{item.ImageApproved ? "Disetujui" : "Belum Disetujui"}</Text>
      </View>
    );
  }}
/>

</ScrollView>
  </View>
)}


{activeTab === "approvePoints" && (
  <View>
    {/* Header */}
    <ScrollView horizontal style={styles.tableBody}>
      <View>
        <View style={styles.tableHeader}>
          <View style={[styles.headerCell, { width: 60, alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={styles.headerText}></Text>
          </View>
          <View style={[styles.headerCell, { width: 120, alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={styles.headerText}>Name</Text>
          </View>
          <View style={[styles.headerCell, { width: 100, alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={styles.headerText}>Nim</Text>
          </View>
          <View style={[styles.headerCell, { width: 100, alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={styles.headerText}>Points</Text>
          </View>
          <View style={[styles.headerCell, { width: 180, alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={styles.headerText}>Description</Text>
          </View>
          <View style={[styles.headerCell, { width: 180, alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={styles.headerText}>Location</Text>
          </View>
          <View style={[styles.headerCell, { width: 180, alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={styles.headerText}>Date & Time</Text>
          </View>
          <View style={[styles.headerCell, { width: 100, alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={styles.headerText}>Action</Text>
          </View>
        </View>

        {/* Table Body */}
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const points = parseInt(item.Points) || 0;
            const hasImage = item.imageUrl && item.imageUrl.trim() !== "";

            const descriptionWords = item.description ? item.description.split(' ') : [];
            const descriptionChunks = [];
            for (let i = 0; i < descriptionWords.length; i += 15) {
              descriptionChunks.push(descriptionWords.slice(i, i + 15).join(' '));
            }

            const formattedTime = item.Timestamp && item.Timestamp.toDate
              ? new Intl.DateTimeFormat('id-ID', {
                  timeZone: 'Asia/Makassar',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                }).format(item.Timestamp.toDate())
              : "";

            const formattedLocation = item.Location?.split(',').slice(1).join(',').trim() || '';

            return (
              <View style={styles.tableRow}>
                {/* Icon User */}
                <View style={[styles.tableCell, { width: 60, alignItems: 'center', justifyContent: 'center' }]}>
                  <FontAwesome5 name="user" size={20} color="rgb(119, 49, 102)" />
                </View>

                {/* Name */}
                <View style={[styles.tableCell, { width: 120, alignItems: 'center', justifyContent: 'center' }]}>
                  <Text>{item.Name}</Text>
                </View>

                {/* Nim */}
                <View style={[styles.tableCell, { width: 100, alignItems: 'center', justifyContent: 'center' }]}>
                  <Text>{item.Nim}</Text>
                </View>

                {/* Points */}
                <View style={[styles.tableCell, { width: 100, alignItems: 'center', justifyContent: 'center' }]}>
                  <Text>{points}</Text>
                </View>

                {/* Description */}
                <View style={[styles.tableCell, { width: 180, alignItems: 'center', justifyContent: 'center' }]}>
                  {descriptionChunks.map((chunk, index) => (
                    <Text key={index} style={{ marginBottom: 4, textAlign: 'center' }}>{chunk}</Text>
                  ))}
                </View>

                {/* Location */}
                <View style={[styles.tableCell, { width: 180, alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={{ fontStyle: 'italic', color: '#333', textAlign: 'center' }}>
                    {formattedLocation}
                  </Text>
                </View>

                {/* Date & Time */}
                <View style={[styles.tableCell, { width: 180, alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={{ fontWeight: 'bold', color: '#333', textAlign: 'center' }}>
                    {formattedTime}
                  </Text>
                </View>

                {/* Action Buttons */}
                <View style={[styles.tableCell, { width: 100, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }]}>
                  <TouchableOpacity onPress={() => approvePoints(item.id, points, item.imageUrl)}>
                    <FontAwesome5
                      name={points === 0 ? "check-circle" : "times-circle"}
                      size={20}
                      color={points === 0 ? "green" : "red"}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => openImage(item.imageUrl)}>
                    <FontAwesome5
                      name="image"
                      size={20}
                      color={item.imageUrl ? "green" : "blue"}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => approveImage(item.id, item.Email)}>
                    <FontAwesome5
                      name="thumbs-up"
                      size={20}
                      color={item.ImageApproved && points === 0 && hasImage ? "green" : "gray"}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      </View>
    </ScrollView>
  </View>
)}


{activeTab === "editPoints" && (
  <View>
    {/* Keterangan Header Tabel */}
    <View style={styles.tableHeader}>
      <Text style={[styles.headerCell, { flex: 1.5 }]}>Name</Text>
      <Text style={[styles.headerCell, { flex: 1.5 }]}>NIM</Text>
      <Text style={[styles.headerCell, { flex: 1.5 }]}>Regis</Text>
      <Text style={[styles.headerCell, { flex: 1.3 }]}>Working hours</Text>
      <Text style={[styles.headerCell, { flex: 1.3}]}>Point</Text>
      <Text style={[styles.headerCell, { flex: 1.5 }]}>Action</Text>
    </View>

    {/* Data Tabel */}
    <ScrollView style={styles.tableBody}>
    <FlatList
      data={filteredUsers}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.tableRow}>
        {/* Ganti kolom No dengan icon user */}
        <View style={styles.iconCell}>
        <FontAwesome5 name="user" size={20} color="rgb(133, 55, 116)" />

        </View>
          <Text style={styles.tableCell}>{item.Name}</Text>
          <Text style={styles.tableCell}>{item.Nim}</Text>
          <Text style={styles.tableCell}>{item.Regis}</Text>

          <TextInput
            style={styles.input}
            value={editedData[item.id]?.Jam ?? String(item.Jam)}
            onChangeText={(text) => handleEdit(item.id, "Jam", text)}
            keyboardType="numeric"
            placeholder="Jam Kerja"
          />

          <TextInput
            style={styles.input}
            value={editedData[item.id]?.Points ?? String(item.Points)}
            onChangeText={(text) => handleEdit(item.id, "Points", text)}
            keyboardType="numeric"
            placeholder="Poin"
          />

          <View style={styles.iconContainer}>
            <TouchableOpacity onPress={() => handleSave(item.id)}>
              <MaterialIcons name="save" size={24} color="green" />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => handleCancel(item.id)}>
              <FontAwesome5 name="undo" size={20} color="orange" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    />
    </ScrollView>
  </View>
)}


        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  navbar: {
    backgroundColor: "#800080",
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 4,
  },
  navbarTitle: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  searchInput: {
    backgroundColor: "#fff",
    padding: 8,
    borderRadius: 5,
    width: 200,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  mainContent: { flex: 1, flexDirection: "row" },
  sidebar: {
    width: 200,
    backgroundColor: "#EE82EE",
    padding: 15,
  },
  sidebarTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 10,
  },
  sidebarItem: {
    fontSize: 14,
    marginVertical: 8,
    color: "#000000",
    paddingVertical: 10,
  },
  content: { flex: 1, padding: 15 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  tableRow: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderColor: "#DDD",
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
    marginVertical: 5,
    paddingHorizontal: 10,
  },
  tableCell: { flex: 1, textAlign: "center", fontSize: 14, color: "#37474F" },
  logo: { width: 40, height: 40, marginRight: 10 },
  navLinks: { flexDirection: "row" },
  navLink: {
    color: "white",
    marginHorizontal: 10,
    fontSize: 16,
    fontWeight: "bold",
  },
  iconContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 100,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    padding: 8,
    marginVertical: 5,
    flex: 1,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#D8BFD8",
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 5,
    justifyContent: "space-around",
  },
  headerCell: {
    flex: 1,
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFF",
    textAlign: "center",
  },

  tableBody: { maxHeight: 420 }, // Hanya tabel yang bisa di-scroll
tableRow: { flexDirection: "row", padding: 10, borderBottomWidth: 1, borderColor: "#ddd" },
tableCell: { flex: 1, color: "#333", textAlign: "center" },

addButton: {
  paddingVertical: 8,
  paddingHorizontal: 5,
  borderRadius: 5,
  marginRight: 5,
  marginBottom: 900, // 👈 ini buat nambah jarak ke bawah
},

activeSidebarItem: {
  backgroundColor: '#6C63FF',
  color: 'white',
  paddingVertical: 5,
  paddingHorizontal: 5,
  borderRadius: 5,
},
iconCell: {
  width: 40, // atau sesuai kebutuhan
  justifyContent: 'center',
  alignItems: 'center',
  padding: 5,
},



});


export default VillageDeanDashboardScreen;