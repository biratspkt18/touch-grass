// screens/MapPickerScreen.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker, MapPressEvent, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { colors, fonts, radius, shadow } from '../theme/theme';

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
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }]}>
        <Text style={styles.hintText}>Finding you on the map…</Text>
      </View>
    );
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
        <View style={styles.hintBanner}>
          <Text style={styles.hintText}>Tap the map to drop your pin 📍</Text>
        </View>
      )}
      {awaitingSelection && (
        <TouchableOpacity
          style={[styles.button, !selectedLocation && styles.buttonDisabled]}
          onPress={confirmLocation}
          disabled={!selectedLocation}
          activeOpacity={0.9}
        >
          <Text style={styles.buttonText}>Confirm location</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  hintBanner: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.94)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.pill,
    ...shadow.soft,
  },
  hintText: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: colors.ink },
  button: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 15,
    borderRadius: radius.pill,
    ...shadow.lifted,
  },
  buttonDisabled: { backgroundColor: colors.borderStrong },
  buttonText: { fontFamily: fonts.bodyBlack, fontSize: 15, color: '#fff' },
});
