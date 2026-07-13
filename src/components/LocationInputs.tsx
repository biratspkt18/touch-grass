import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { MapPin, Check } from 'lucide-react-native';
import { colors, fonts, radius, spacing } from '../theme/theme';

type Props = {
  latitude: string;
  setLatitude: (lat: string) => void;
  longitude: string;
  setLongitude: (lng: string) => void;
  navigation: any;
};

export default function LocationInputs({
  latitude,
  setLatitude,
  longitude,
  setLongitude,
  navigation,
}: Props) {
  const hasLocation = !!latitude && !!longitude;

  return (
    <>
      <Text style={styles.label}>Location</Text>

      <TouchableOpacity
        style={[styles.pickButton, hasLocation && styles.pickButtonSet]}
        onPress={() => navigation.navigate('MapPickerScreen')}
        activeOpacity={0.85}
      >
        {hasLocation ? (
          <Check color={colors.primary} size={18} />
        ) : (
          <MapPin color={colors.onPrimary} size={18} />
        )}
        <Text style={[styles.pickText, hasLocation && styles.pickTextSet]}>
          {hasLocation ? 'Location set — tap to change' : 'Pick location on map'}
        </Text>
      </TouchableOpacity>

      <View style={styles.coordRow}>
        <View style={styles.coordField}>
          <Text style={styles.coordLabel}>Latitude</Text>
          <TextInput
            style={styles.coordInput}
            value={latitude}
            onChangeText={setLatitude}
            keyboardType="numbers-and-punctuation"
            placeholder="-37.8128"
            placeholderTextColor={colors.inkFaint}
          />
        </View>
        <View style={styles.coordField}>
          <Text style={styles.coordLabel}>Longitude</Text>
          <TextInput
            style={styles.coordInput}
            value={longitude}
            onChangeText={setLongitude}
            keyboardType="numbers-and-punctuation"
            placeholder="145.2369"
            placeholderTextColor={colors.inkFaint}
          />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.ink,
    marginBottom: 8,
    marginTop: spacing.lg,
  },
  pickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
  },
  pickButtonSet: {
    backgroundColor: colors.primarySoft,
  },
  pickText: { fontFamily: fonts.bodyBold, fontSize: 14.5, color: colors.onPrimary },
  pickTextSet: { color: colors.primaryInk },
  coordRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  coordField: { flex: 1 },
  coordLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.inkFaint,
    marginBottom: 5,
  },
  coordInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.ink,
    backgroundColor: colors.surface,
  },
});
