import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, TextInput, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const generateId = () => Date.now().toString() + Math.floor(Math.random() * 1000).toString();

const StudentJobOfferScreen = () => {
  const [jobOptions, setJobOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState('');
  const [applicationsCount, setApplicationsCount] = useState({});
  const [newJob, setNewJob] = useState(null);

  useEffect(() => {
    fetchTakenJobs();
    fetchApplications();
  }, []);

  const fetchTakenJobs = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'TakenJobs'));
      const jobs = snapshot.docs.map((docu) => ({
        id: docu.id,
        title: docu.data().title || '',
        place: docu.data().place || '',
        limit: docu.data().limit || 0,
        image: docu.data().imageUrl || '',
      }));
      setJobOptions(jobs);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'StudentJobApplications'));
      const counts = {};
      snapshot.forEach((docu) => {
        const jobId = docu.data().jobId;
        if (jobId) counts[jobId] = (counts[jobId] || 0) + 1;
      });
      setApplicationsCount(counts);
    } catch (error) {
      console.error(error);
    }
  };

  const pickImage = async (isNew = false, id = '') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      quality: 1,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });
    if (!result.canceled && result.assets?.length > 0) {
      const uri = result.assets[0].uri;
      if (isNew) {
        if (!newJob) {
          setNewJob({ id: generateId(), title: '', place: '', limit: '', image: uri });
        } else {
          setNewJob((prev) => ({ ...prev, image: uri }));
        }
      } else {
        setJobOptions((prev) => prev.map((job) => (job.id === id ? { ...job, image: uri } : job)));
      }
    }
  };

  const removeNewJob = () => {
    Alert.alert(
      'Hapus Form',
      'Apakah kamu yakin ingin menghapus form ini?',
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus', onPress: () => setNewJob(null) },
      ],
      { cancelable: true }
    );
  };

  const deleteJob = async (jobId) => {
    Alert.alert(
      'Hapus Pekerjaan',
      'Apakah kamu yakin ingin menghapus pekerjaan ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'TakenJobs', jobId)); // Menghapus data pekerjaan di Firestore
              setJobOptions((prev) => prev.filter((job) => job.id !== jobId)); // Menghapus pekerjaan dari state
              fetchApplications(); // Menyegarkan jumlah aplikasi
              Alert.alert('Berhasil', 'Pekerjaan berhasil dihapus.');
            } catch (error) {
              console.error(error);
              Alert.alert('Gagal', 'Terjadi kesalahan saat menghapus pekerjaan.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const uploadJobData = async (jobData, isNew = false) => {
    if (!jobData.title || !jobData.place || !jobData.limit) {
      Alert.alert('Peringatan', 'Lengkapi semua data terlebih dahulu.');
      return;
    }

    Alert.alert(
      'Konfirmasi',
      'Apakah Anda yakin ingin menyimpan pekerjaan ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Simpan',
          onPress: async () => {
            setSavingId(jobData.id);
            try {
              let imageUrl = '';
              if (jobData.image && !jobData.image.startsWith('https://')) {
                const formData = new FormData();
                formData.append('file', { uri: jobData.image, type: 'image/jpeg', name: 'upload.jpg' });
                formData.append('upload_preset', 'Gambar_Saya');
                formData.append('cloud_name', 'ddmz8ct9u');

                const response = await fetch('https://api.cloudinary.com/v1_1/ddmz8ct9u/image/upload', {
                  method: 'POST',
                  body: formData,
                });
                const result = await response.json();
                imageUrl = result.secure_url;
              } else if (jobData.image) {
                imageUrl = jobData.image;
              }

              await setDoc(doc(db, 'TakenJobs', jobData.id), {
                title: jobData.title || '',
                place: jobData.place || '',
                limit: Number(jobData.limit) || 0,
                imageUrl: imageUrl || '',
              });

              if (isNew) {
                const newItem = {
                  id: jobData.id,
                  title: jobData.title,
                  place: jobData.place,
                  limit: Number(jobData.limit),
                  image: imageUrl,
                };
                setJobOptions((prev) => [newItem, ...prev]);
                setNewJob(null);
              } else {
                setJobOptions((prev) =>
                  prev.map((job) => (job.id === jobData.id ? { ...job, title: jobData.title, place: jobData.place, limit: Number(jobData.limit), image: imageUrl } : job))
                );
              }

              fetchApplications();
              Alert.alert('Berhasil', 'Data pekerjaan berhasil disimpan.');
            } catch (error) {
              console.error(error);
              Alert.alert('Gagal', 'Terjadi kesalahan saat menyimpan data.');
            } finally {
              setSavingId('');
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  const renderNewJobForm = () => (
    <View style={styles.jobCard}>
      <TouchableOpacity onPress={() => pickImage(true)} style={{ width: '100%' }} onLongPress={removeNewJob}>
        {newJob?.image ? (
          <>
            <Image source={{ uri: newJob.image }} style={styles.jobImage} />
            <Text style={styles.removePhotoText}>Tekan lama untuk hapus form</Text>
          </>
        ) : (
          <View style={styles.jobImagePlaceholder}>
            <Text style={styles.addPhotoText}>Pilih Foto</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Nama Pekerjaan */}
      <TextInput
        style={styles.input}
        placeholder="Nama Pekerjaan"
        value={newJob?.title}
        onChangeText={(text) => setNewJob((prev) => ({ ...prev, title: text }))}
      />

      {/* Tempat Kerja */}
      <TextInput
        style={styles.input}
        placeholder="Tempat Kerja"
        value={newJob?.place}
        onChangeText={(text) => setNewJob((prev) => ({ ...prev, place: text }))}
      />

      {/* Kuota */}
      <TextInput
        style={styles.input}
        placeholder="Kuota Mahasiswa"
        keyboardType="numeric"
        value={newJob?.limit}
        onChangeText={(text) => setNewJob((prev) => ({ ...prev, limit: text }))}
      />

      <TouchableOpacity
        style={styles.uploadButton}
        onPress={() => uploadJobData(newJob, true)}
        disabled={savingId === newJob?.id}
      >
        <Text style={styles.uploadButtonText}>
          {savingId === newJob?.id ? 'Menyimpan...' : 'Upload Pekerjaan'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderJobItem = ({ item }) => {
    const applied = applicationsCount[item.id] || 0;

    return (
      <View style={styles.jobCard}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.jobImage} />
        ) : (
          <View style={styles.jobImagePlaceholder}>
            <Text style={styles.addPhotoText}>Tidak ada gambar</Text>
          </View>
        )}

        <Text style={{ color: '#555', marginTop: 3 }}>
          <Text style={{ fontWeight: 'bold' }}>Jenis Pekerjaan:</Text> {item.title}
        </Text>

        <Text style={{ color: '#555', marginTop: 3 }}>
          <Text style={{ fontWeight: 'bold' }}>Tempat Pekerjaan:</Text> {item.place}
        </Text>

        <Text style={{ color: '#333', marginTop: 3 }}>
          <Text style={{ fontWeight: 'bold' }}>Kuota:</Text>{item.limit}
        </Text>

        <TouchableOpacity onPress={() => deleteJob(item.id)} style={styles.deleteButton}>
          <Text style={styles.deleteButtonText}>Hapus Pekerjaan</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manajemen Pekerjaan</Text>
      {loading && <ActivityIndicator size="large" color="#800080" />}

      {newJob && renderNewJobForm()}
      <TouchableOpacity
        style={[styles.uploadButton, { marginBottom: 15 }]}
        onPress={() => setNewJob({ id: generateId(), title: '', place: '', limit: '', image: '' })}
      >
        <Text style={styles.uploadButtonText}>Tambah Pekerjaan Baru</Text>
      </TouchableOpacity>

      <FlatList
        data={jobOptions}
        renderItem={renderJobItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f4', padding: 15 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 15, textAlign: 'center' },
  jobCard: { backgroundColor: '#fff', borderRadius: 10, padding: 10, marginBottom: 15, width: '100%', alignItems: 'center', elevation: 2 },
  jobImage: { width: '100%', height: 120, borderRadius: 8, marginBottom: 5 },
  jobImagePlaceholder: { width: '100%', height: 120, backgroundColor: '#ddd', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 5 },
  addPhotoText: { color: '#666', fontSize: 14 },
  removePhotoText: { textAlign: 'center', fontSize: 10, color: '#999', marginBottom: 5 },
  input: { width: '100%', height: 40, borderColor: '#ccc', borderWidth: 1, borderRadius: 6, paddingHorizontal: 10, marginBottom: 10, fontSize: 14 },
  uploadButton: { backgroundColor: '#800080', paddingVertical: 10, borderRadius: 8, alignItems: 'center', width: '100%', marginTop: 10 },
  uploadButtonText: { fontSize: 14, fontWeight: 'bold', color: '#fff' },
  deleteButton: { backgroundColor: '#FF6347', paddingVertical: 8, borderRadius: 6, alignItems: 'center', marginTop: 10, width: '100%' },
  deleteButtonText: { fontSize: 14, fontWeight: 'bold', color: '#fff' },
});

export default StudentJobOfferScreen;
