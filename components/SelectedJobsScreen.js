import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  TextInput,
  Image
} from 'react-native';
import { collection, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';

const SelectedJobsScreen = () => {
  const [groupedJobs, setGroupedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [descriptionMap, setDescriptionMap] = useState({});

  const fetchSelectedJobs = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'SelectedJobs'));
      const jobData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const grouped = {};
      jobData.forEach(job => {
        const key = job.jobTitle || 'Tidak diketahui';
        if (!grouped[key]) {
          grouped[key] = {
            title: job.jobTitle,
            jobPlace: job.jobPlace,
            students: [],
            ids: [] // Store document IDs for deletion
          };
        }
        grouped[key].students.push(job);
        grouped[key].ids.push(job.id); // Store the document ID
      });

      setGroupedJobs(Object.values(grouped));
    } catch (error) {
      console.error('Gagal mengambil data SelectedJobs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSelectedJobs();
  }, []);

  const handleCameraPress = async (jobGroup) => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Izin ditolak', 'Izin kamera diperlukan.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 1,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const imageUri = result.assets[0].uri;

      setSelectedJob({
        ...jobGroup,
        imageUri
      });
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Terjadi kesalahan saat memproses gambar.');
    }
  };

  const handleUpload = async () => {
    if (!selectedJob || !selectedJob.imageUri) {
      Alert.alert('Error', 'Gambar belum tersedia.');
      return;
    }

    const { students, imageUri, title, ids } = selectedJob;
    const description = descriptionMap[title] || '';

    try {
      // Step 1: Upload image to Cloudinary
      const data = new FormData();
      data.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'photo.jpg'
      });
      data.append('upload_preset', 'Gambar_Saya');
      data.append('cloud_name', 'ddmz8ct9u');

      const response = await fetch(
        'https://api.cloudinary.com/v1_1/ddmz8ct9u/image/upload',
        {
          method: 'POST',
          body: data
        }
      );

      const resultData = await response.json();
      if (!resultData.secure_url) {
        Alert.alert('Error', 'Gagal mendapatkan URL gambar dari Cloudinary.');
        return;
      }

      const imageUrl = resultData.secure_url;

      // Step 2: Get student emails from SelectedJobs
      const selectedJobsSnapshot = await getDocs(collection(db, 'SelectedJobs'));
      const selectedJobs = selectedJobsSnapshot.docs.map(doc => doc.data());

      // Step 3: Get emails of students who took the job
      const takenEmails = selectedJobs.map(job => job.email);

      // Step 4: Get user data and filter students who took the job
      const usersSnapshot = await getDocs(collection(db, 'Users'));
      const users = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const studentsWithEmail = users.filter(user => takenEmails.includes(user.Email));

      // Step 5: Update student data
      for (const student of studentsWithEmail) {
        const userDocRef = doc(db, 'Users', student.id);
        await updateDoc(userDocRef, {
          Jam: 0,
          Points: 0,
          imageUrl: imageUrl,
          ImageApproved: false,
          description: description
        });
      }

      // Step 6: Delete all SelectedJobs documents for this job group
      for (const id of ids) {
        const jobDocRef = doc(db, 'SelectedJobs', id);
        await deleteDoc(jobDocRef);
      }

      // Step 7: Update UI by removing the deleted job
      setGroupedJobs(prevJobs => prevJobs.filter(job => job.title !== title));
      
      Alert.alert('Berhasil', 'Data berhasil diperbarui dan pekerjaan berhasil dihapus.');
      setSelectedJob(null);
      setDescriptionMap(prev => ({ ...prev, [title]: '' }));
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Gagal mengunggah gambar atau memperbarui data.');
    }
  };

  const renderJobBox = ({ item }) => {
    const isSelected = selectedJob && selectedJob.title === item.title;

    return (
      <View style={styles.jobBox}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.jobLabel}>
              Jenis Pekerjaan: <Text style={styles.jobValue}>{item.title}</Text>
            </Text>
            <Text style={styles.jobLabel}>
              Tempat Kerja: <Text style={styles.jobValue}>{item.jobPlace}</Text>
            </Text>
          </View>
          <TouchableOpacity onPress={() => handleCameraPress(item)}>
            <MaterialIcons name="camera-alt" size={26} color="#000" />
          </TouchableOpacity>
        </View>

        {item.students.map((student, index) => (
          <View key={index} style={styles.studentCard}>
            <Text style={styles.studentText}>Nama Siswa: {student.name}</Text>
          </View>
        ))}

        {isSelected && (
          <>
            {selectedJob.imageUri && (
              <Image
                source={{ uri: selectedJob.imageUri }}
                style={styles.imagePreview}
              />
            )}
            <TextInput
              style={styles.input}
              placeholder="Deskripsi pekerjaan..."
              value={descriptionMap[item.title] || ""}
              onChangeText={(text) =>
                setDescriptionMap(prev => ({ ...prev, [item.title]: text }))
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

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 50 }} />;
  }

  return (
    <FlatList
      data={groupedJobs}
      keyExtractor={(_, index) => index.toString()}
      renderItem={renderJobBox}
      contentContainerStyle={styles.container}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f4f4f4',
    paddingBottom: 100
  },
  jobBox: {
    backgroundColor: '#e0f7fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  jobLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#004d40',
    marginBottom: 4
  },
  jobValue: {
    fontWeight: 'normal',
    color: '#00796b'
  },
  studentCard: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#ccc'
  },
  studentText: {
    fontSize: 15,
    color: '#333'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginTop: 10
  },
  uploadButton: {
    backgroundColor: '#FF9800',
    padding: 10,
    borderRadius: 5,
    marginTop: 10
  },
  uploadButtonText: {
    color: '#fff',
    textAlign: 'center'
  },
  imagePreview: {
    width: 200,
    height: 200,
    marginTop: 10,
    borderRadius: 10
  }
});

export default SelectedJobsScreen;