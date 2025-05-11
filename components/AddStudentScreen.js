import React, { useState, useEffect, useRef } from 'react';
import {
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
  View,
  Platform,
  TouchableOpacity,
  Animated,
  ImageBackground,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as XLSX from 'xlsx';
import { doc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../firebaseConfig';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const AddStudentScreen = () => {
  const [nama, setNama] = useState('');
  const [nim, setNim] = useState('');
  const [regis, setRegis] = useState('');
  const [seating, setSeating] = useState('');
  const [point, setPoint] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const navigation = useNavigation();

  const MovingText = () => {
    const translateX = useRef(new Animated.Value(-300)).current;

    useEffect(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(translateX, {
            toValue: 300,
            duration: 6000,
            useNativeDriver: true,
          }),
          Animated.timing(translateX, {
            toValue: -300,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, []);

    return (
      <View style={{ width: '100%', height: 30, overflow: 'hidden', justifyContent: 'center' }}>
        <Animated.Text
          style={{
            position: 'absolute',
            transform: [{ translateX }],
            fontSize: 18,
            fontWeight: 'bold',
            color: '#fff',
            alignSelf: 'center',
          }}
        >
        Register New Student
        </Animated.Text>
      </View>
    );
  };

  const showMessage = (text, type = 'error') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 3000);
  };

  const handleAddStudent = async () => {
    if (!nama || !nim || !regis || !seating || !point || !email) {
      showMessage('All data must be filled in!', 'error');
      return;
    }

    try {
      const password = '123456';
      const lowerEmail = email.toLowerCase();
      const docRef = doc(db, 'Users', lowerEmail);
      const pointsNumber = parseInt(point);
      const jamKerja = Math.floor(pointsNumber / 2);

      await setDoc(docRef, {
        AuthUID: '',
        Name: nama,
        Nim: Number(nim),
        Regis: regis,
        Seating: seating,
        Points: point,
        Email: lowerEmail,
        Password: password,
        Jam: jamKerja,
        ImageApproved: false,
      }, { merge: true });

      const userCredential = await createUserWithEmailAndPassword(auth, lowerEmail, password);
      const uid = userCredential.user.uid;

      await setDoc(docRef, { AuthUID: uid }, { merge: true });

      showMessage('Student data successfully added!', 'success');
      setNama(''); setNim(''); setRegis(''); setSeating(''); setPoint(''); setEmail('');
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        try {
          const userCredential = await signInWithEmailAndPassword(auth, lowerEmail, password);
          const uid = userCredential.user.uid;
          await setDoc(docRef, { AuthUID: uid }, { merge: true });
          showMessage('Email is already registered. Data is still updated.', 'success');
        } catch (signInError) {
          showMessage('Failed to login to existing account: ' + signInError.message, 'error');
        }
      }
    }
  };

  const handleFileUpload = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (res.canceled || !res.assets || res.assets.length === 0) {
        showMessage('No file selected.', 'error');
        return;
      }

      const fileUri = res.assets[0].uri;
      const response = await fetch(fileUri);
      const blob = await response.blob();
      const reader = new FileReader();

      reader.onload = async (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        for (const row of jsonData) {
          const email = (row.Email || '').toLowerCase();
          const password = '123456';
          const docRef = doc(db, 'Users', email);
          const pointVal = parseInt(row.Point || 0);
          const jamKerja = Math.floor(pointVal / 2);

          try {
            await setDoc(docRef, {
              AuthUID: '',
              Name: row.Name || '',
              Nim: Number(row.Nim) || 0,
              Regis: row.Regis || '',
              Seating: row['Seating'] || '',
              Points: row.Point || '0',
              Email: email,
              Password: password,
              Jam: jamKerja,
              ImageApproved: false,
            }, { merge: true });

            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const uid = userCredential.user.uid;
            await setDoc(docRef, { AuthUID: uid }, { merge: true });
          } catch (error) {
            if (error.code === 'auth/email-already-in-use') {
              await signInWithEmailAndPassword(auth, email, password);
            } else {
              console.error('Upload failed:', row, error.message);
            }
          }
        }

        showMessage('File successfully uploaded & student data added!', 'success');
      };

      reader.readAsArrayBuffer(blob);
    } catch (err) {
      showMessage('Gagal memilih file: ' + err.message, 'error');
    }
  };

  return (
    <ImageBackground
      source={require('../assets/gambar1.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBackButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <MovingText />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.formContainer}>
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
  <Ionicons name="person-circle-outline" size={60} color="#800080" />
  <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#800080', marginTop: 5 }}>
    Add Student
  </Text>
  
  <TouchableOpacity onPress={handleFileUpload} style={{ padding: 8 }}>
    <Ionicons name="cloud-upload-outline" size={28} color="#800080" />
    <Text style={{ fontSize: 12, color: '#800080', textAlign: 'center' }}>Import</Text>
  </TouchableOpacity>
</View>

          {message ? (
            <View style={[styles.messageBox, messageType === 'success' ? styles.successBox : styles.errorBox]}>
              <Text style={styles.messageText}>{message}</Text>
            </View>
          ) : null}

          <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <TextInput style={styles.input} placeholder="Full name" value={nama} onChangeText={setNama} />
          <TextInput style={styles.input} placeholder="Nim" value={nim} onChangeText={setNim} keyboardType="numeric" />
          <TextInput style={styles.input} placeholder="Registration Number" value={regis} onChangeText={setRegis} />
          <TextInput style={styles.input} placeholder="Seating" value={seating} onChangeText={setSeating} />
          <TextInput style={styles.input} placeholder="Point" value={point} onChangeText={setPoint} keyboardType="numeric" />

          <TouchableOpacity style={styles.customButton} onPress={handleAddStudent}>
  <Text style={styles.buttonText}>Save Student</Text>
</TouchableOpacity>
        </View>
      </ScrollView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 30,
    paddingHorizontal: 10,
  },
  formContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 25,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#FAFAFA',
    padding: 12,
    borderRadius: 10,
    fontSize: 14,
    marginBottom: 12,
  },
  buttonContainer: {
    marginVertical: 15,
  },
  messageBox: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  successBox: {
    backgroundColor: '#d4edda',
  },
  errorBox: {
    backgroundColor: '#f8d7da',
  },
  messageText: {
    fontSize: 13,
    textAlign: 'center',
    color: '#333',
  },
  uploadButton: {
    flexDirection: 'row',
    backgroundColor: '#800080',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 14,
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgb(204, 87, 204)',
    paddingHorizontal: 15,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 15,
  },
  navBackButton: {
    paddingRight: 10,
    paddingLeft: 5,
  },

  customButton: {
    backgroundColor: '#800080',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 10,
    width: '60%', // Perkecil ukuran tombol
  },
  
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
  
  
});

export default AddStudentScreen;
