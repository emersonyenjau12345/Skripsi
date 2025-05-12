import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Linking, StyleSheet, TextInput, Alert } from 'react-native';
import { MaterialIcons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';

const Kontak = () => {
  const [dosenList] = useState([
    { 
      id: '1', 
      nama: 'Sir Denny Sumajow', 
      noHp: '081221939777', 
      matkul: 'Kepala departement village dean',
      email: 's2200681@student.unklab.ac.id',
    },
    // Add more contacts as needed
  ]);

  const [searchQuery, setSearchQuery] = useState('');

  const filteredDosen = dosenList.filter(
    (dosen) =>
      dosen.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dosen.matkul.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const callDosen = (noHp) => Linking.openURL(`tel:${noHp}`);
  const emailDosen = (email) => Linking.openURL(`mailto:${email}`);

  const handleWhatsApp = async (noHp) => {
    try {
      let formattedNumber = noHp.replace(/[^0-9]/g, '');
      
      if (!formattedNumber.startsWith('62') && !formattedNumber.startsWith('0')) {
        formattedNumber = '62' + formattedNumber;
      } else if (formattedNumber.startsWith('0')) {
        formattedNumber = '62' + formattedNumber.substring(1);
      }

      const whatsappUrl = `whatsapp://send?phone=${formattedNumber}`;
      const supported = await Linking.canOpenURL(whatsappUrl);

      if (supported) {
        await Linking.openURL(whatsappUrl);
      } else {
        await Linking.openURL(`https://api.whatsapp.com/send?phone=${formattedNumber}`);
      }
    } catch (error) {
      console.error('Error opening WhatsApp:', error);
      Alert.alert('Error', 'Tidak dapat membuka WhatsApp');
    }
  };

  return (

    <View style={styles.container}>
      <Text style={styles.header}>
      </Text>
    <View style={styles.container}>
      <TextInput
        style={styles.searchBar}
        placeholder="Cari nama..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <FlatList
        data={filteredDosen}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.dosenItem}>
            <View style={styles.dosenHeader}>
              <MaterialIcons name="account-circle" size={40} color="#3498db" />
              <View style={styles.dosenInfo}>
                <Text style={styles.dosenNama}>{item.nama}</Text>
                <Text style={styles.dosenMatkul}>
                  <MaterialCommunityIcons name="book" size={14} color="#666" /> {item.matkul}
                </Text>
              </View>
            </View>

            <View style={styles.contactActions}>
              <TouchableOpacity 
                style={styles.contactButton} 
                onPress={() => callDosen(item.noHp)}
              >
                <FontAwesome name="phone" size={20} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.contactButton, {backgroundColor: '#25D366'}]}
                onPress={() => handleWhatsApp(item.noHp)}
              >
                <FontAwesome name="whatsapp" size={20} color="#fff" />
              </TouchableOpacity>

              {item.email && (
                <TouchableOpacity 
                  style={[styles.contactButton, {backgroundColor: '#EA4335'}]}
                  onPress={() => emailDosen(item.email)}
                >
                  <MaterialCommunityIcons name="email" size={20} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      />
    </View>
    </View>
  );
};

// Styles definition moved inside the same file
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    height: 45,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 25,
    paddingHorizontal: 15,
    marginBottom: 20,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  dosenItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dosenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  dosenInfo: {
    marginLeft: 10,
  },
  dosenNama: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  dosenMatkul: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  contactActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  contactButton: {
    backgroundColor: '#3498db',
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Kontak;