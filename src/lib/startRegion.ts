// Remembers where the map should open when location permission is off:
// the city the user picked, persisted across app launches.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Region } from 'react-native-maps';

const KEY = 'touchgrass.startRegion';

// Zoomed-out neutral view used only while no better center exists.
export const WORLD_REGION: Region = {
  latitude: 20,
  longitude: 0,
  latitudeDelta: 100,
  longitudeDelta: 100,
};

export async function loadStartRegion(): Promise<Region | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const r = JSON.parse(raw);
    if (Number.isFinite(r.latitude) && Number.isFinite(r.longitude)) {
      return {
        latitude: r.latitude,
        longitude: r.longitude,
        latitudeDelta: Number.isFinite(r.latitudeDelta) ? r.latitudeDelta : 0.12,
        longitudeDelta: Number.isFinite(r.longitudeDelta) ? r.longitudeDelta : 0.12,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function saveStartRegion(region: Region): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(region));
  } catch {
    // Non-fatal: the map just won't remember the city next launch.
  }
}
