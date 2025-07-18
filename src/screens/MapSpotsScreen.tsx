import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import supabase from '../components/Supabase';

export default function MapSpotsScreen() {
  const [spots, setSpots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSpots = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('Spots').select('*');
      if (error) {
        setError(error.message);
      } else {
        setSpots(data || []);
      }
      setLoading(false);
    };
    fetchSpots();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#888" />
        <Text>Loading spots...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ color: 'red' }}>Error: {error}</Text>
      </View>
    );
  }

  // Default region (centered on Melbourne, Australia)
  const initialRegion = {
    latitude: -37.8136,
    longitude: 144.9631,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  };

  return (
    <View style={styles.container}>
      <MapView style={styles.map} initialRegion={initialRegion}>
        {spots.map((spot) => {
          let latitude, longitude;
          if (
            spot.location &&
            typeof spot.location.lat !== 'undefined' &&
            typeof spot.location.lng !== 'undefined'
          ) {
            latitude = Number(spot.location.lat);
            longitude = Number(spot.location.lng);
          } else if (
            typeof spot.lat !== 'undefined' &&
            typeof spot.lng !== 'undefined'
          ) {
            latitude = Number(spot.lat);
            longitude = Number(spot.lng);
          }
          if (
            typeof latitude === 'number' &&
            !isNaN(latitude) &&
            typeof longitude === 'number' &&
            !isNaN(longitude)
          ) {
            return (
              <Marker
                key={spot.id}
                coordinate={{ latitude, longitude }}
                title={spot.title}
                description={spot.description}
              />
            );
          }
          return null;
        })}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
