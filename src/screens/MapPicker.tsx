// screens/MapPickerScreen.tsx

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker, MapPressEvent, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PlaceSearch, { Place } from '../components/PlaceSearch';
import { loadStartRegion, WORLD_REGION } from '../lib/startRegion';
import { colors, fonts, radius, shadow, spacing } from '../theme/theme';

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
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        try {
          const location = await Location.getCurrentPositionAsync({});
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
          return;
        } catch {
          // GPS unavailable — fall through to the manual flow below.
        }
      }
      // No location permission (or no fix): still fully usable. Start at the
      // remembered city (or a world view), search to jump anywhere, tap to pin.
      const saved = await loadStartRegion();
      setRegion(saved ?? WORLD_REGION);
      setAwaitingSelection(true);
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

  const jumpTo = (place: Place) => {
    const r: Region = {
      latitude: place.latitude,
      longitude: place.longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
    setRegion(r);
    mapRef.current?.animateToRegion(r, 600);
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
        ref={mapRef}
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
        <View style={[styles.searchCard, { top: insets.top + spacing.md }]}>
          <PlaceSearch
            placeholder="Search a city or place…"
            onSelect={jumpTo}
          />
          <Text style={styles.searchHint}>…then tap the map to drop your pin 📍</Text>
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
  searchCard: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadow.card,
  },
  searchHint: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12.5,
    color: colors.inkMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
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
