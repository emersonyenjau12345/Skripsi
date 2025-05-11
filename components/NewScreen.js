import React, { useState } from 'react';
import {
  View, Text, TextInput,
  TouchableOpacity, StyleSheet, Alert
} from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AddPihakKerjaScreen = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [successMessage, setSuccessMessage] = useState(''); // State for success message
  const password = '123456';

  const handleAddEmployer = async () => {
    if (!email || !name) {
      Alert.alert("Error", "Email dan Nama harus diisi.");
      return;
    }

    const docRef = doc(db, "Pemberikerja", email);

    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        Alert.alert("Error", "Email sudah terdaftar sebagai pihak kerja.");
        return;
      }

      // Buat akun di Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Simpan data ke koleksi Pemberikerja (email sebagai ID dokumen)
      await setDoc(docRef, {
        email: user.email,
        name: name,
        role: "pihak_kerja",
        password: password
      });

      // Update success message
      setSuccessMessage('Pihak kerja berhasil ditambahkan.');

      // Clear input fields
      setEmail('');
      setName('');
    } catch (error) {
      console.error("Gagal menambahkan pihak kerja:", error);
      Alert.alert("Error", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tambah Pihak Kerja</Text>
      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Nama Pihak Kerja"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Email Pihak Kerja"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddEmployer}>
          <Text style={styles.addButtonText}>Submit</Text>
        </TouchableOpacity>

        {/* Display success message if available */}
        {successMessage ? (
          <Text style={styles.successMessage}>{successMessage}</Text>
        ) : null}
      </View>
    </View>
  );
};

export default AddPihakKerjaScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center', // Center the content vertically
    alignItems: 'center', // Center the content horizontally
    padding: 16,
    backgroundColor: '#C96DD8',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  formContainer: {
    width: '90%', // Width 90% for better responsiveness
    maxWidth: 400, // Max width for larger screens
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    elevation: 5, // Shadow effect for iOS
    shadowColor: '#000', // Shadow effect for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    alignItems: 'center',
  },
  input: {
    width: '100%',
    height: 45,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    backgroundColor: '#fafafa',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 18,
  },
  successMessage: {
    marginTop: 20,
    fontSize: 16,
    color: '#28a745', // Green color for success
    fontWeight: 'bold',
  },
});
