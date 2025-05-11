import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';

const windowWidth = Dimensions.get('window').width;

const WorkPartnerDashboard = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      {/* Container Baru yang Membungkus Semua */}
      <View style={styles.mainContent}>
        {/* Navbar with Logo */}
        <View style={styles.navbar}>
       <Image
  source={require('../assets/logo.png')}
  style={styles.logo}
  resizeMode="contain"
/>

        </View>

        {/* All Menu inside Centered Container */}
        <View style={styles.centerContainer}>
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('SelectedJobsScreen')}>
              <Icon name="users" size={24} color="#4CAF50" />
              <Text style={styles.menuText}>Daftar Mahasiswa</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('EditStudentScreen')}>
             <Icon name="edit" size={24} color="#4CAF50" />
             <Text style={styles.menuText}>Edit Pekerjaan Mahasiswa</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('StudentJobOfferScreen')}>
              <Icon name="building" size={24} color="#4CAF50" />
              <Text style={styles.menuText}>Tempat Kerja</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

export default WorkPartnerDashboard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center', // Supaya isi (logo + tombol) di tengah-tengah
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  navbar: {
    alignItems: 'center',
    marginBottom: 30, // Jarak bawah logo ke tombol
  },
  logo: {
    width: windowWidth * 0.6, // dari 0.5 → 0.6 (lebih lebar)
    height: 150,               // dari 70 → 90 (lebih tinggi)
  },
  
  centerContainer: {
    width: '100%', 
  },
  menuContainer: {
    width: '100%',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  menuText: {
    marginLeft: 16,
    fontSize: 18,
    color: '#333',
    fontWeight: '500',
  },
});
