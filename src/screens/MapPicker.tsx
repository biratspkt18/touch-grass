// screens/MapPickerScreen.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker, MapPressEvent, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
  HomeScreen: undefined;
  AddSpotScreen: { latitude: number; longitude: number } | undefined;
  MapPickerScreen: undefined;
};

type MapPickerNavigationProp = StackNavigationProp<RootStackParamList, 'MapPickerScreen'>;

export default function MapPickerScreen() {
  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [awaitingSelection, setAwaitingSelection] = useState(false);
  const navigation = useNavigation<MapPickerNavigationProp>();

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to pick your spot.');
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      setRegion({
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      Alert.alert(
        'Are you at the spot?',
        'Tap Yes to use your current location, or No to select a spot on the map.',
        [
          {
            text: 'Yes',
            onPress: () => {
              navigation.navigate('AddSpotScreen', { latitude, longitude });
            },
          },
          {
            text: 'No',
            onPress: () => setAwaitingSelection(true),
            style: 'cancel',
          },
        ]
      );
    })();
  }, [navigation]);

  const handleMapPress = (event: MapPressEvent) => {
    if (!awaitingSelection) return;
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });
  };

  const confirmLocation = () => {
    if (selectedLocation) {
      navigation.navigate('AddSpotScreen', {
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
      });
    }
  };

  if (!region) {
    return <View style={styles.container}><Text>Loading map...</Text></View>;
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        onPress={handleMapPress}
        initialRegion={region}
        showsUserLocation={true}
      >
        {selectedLocation && (
          <Marker coordinate={selectedLocation} />
        )}
      </MapView>
      {awaitingSelection && (
        <TouchableOpacity style={styles.button} onPress={confirmLocation} disabled={!selectedLocation}>
          <Text style={styles.buttonText}>Confirm Location</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  button: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: '#1e90ff',
    padding: 12,
    borderRadius: 10,
  },
  buttonText: { color: 'white', fontWeight: 'bold' },
});
