import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';

type Props = {
  latitude: string;
  setLatitude: (lat: string) => void;
  longitude: string;
  setLongitude: (lng: string) => void;
  navigation: any;
};

export default function LocationInputs({ latitude, setLatitude, longitude, setLongitude, navigation }: Props) {
  return (
    <>
      <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 6, marginTop: 16 }}>Latitude</Text>
      <TextInput
        style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, fontSize: 16, backgroundColor: '#fff' }}
        value={latitude}
        onChangeText={setLatitude}
        keyboardType="numeric"
        placeholder="-37.8128"
      />
      <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 6, marginTop: 16 }}>Longitude</Text>
      <TextInput
        style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, fontSize: 16, backgroundColor: '#fff' }}
        value={longitude}
        onChangeText={setLongitude}
        keyboardType="numeric"
        placeholder="145.2369"
      />
      <TouchableOpacity
        style={{ marginTop: 20, backgroundColor: '#2196F3', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginBottom: 10 }}
        onPress={() => navigation.navigate('MapPickerScreen')}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Pick Location on Map</Text>
      </TouchableOpacity>
    </>
  );
} 