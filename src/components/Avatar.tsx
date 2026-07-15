// Deterministic emoji avatar: the same username always gets the same nature
// emoji on the same soft tint, so people are recognisable across the app
// without uploaded profile photos.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { radius } from '../theme/theme';

const EMOJI = ['🌱', '🌿', '🍀', '🌻', '🌵', '🌲', '🍄', '🌸', '🦋', '🐞', '🐝', '⛰️'];
const TINTS = ['#E3F5E8', '#FFE6DF', '#FEF3C7', '#E0F2FE', '#F3E8FF', '#FCE7F3', '#CCFBF1', '#E0E7FF'];

function hash(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export default function Avatar({
  name,
  size = 40,
}: {
  /** Username (or any stable string) the avatar represents. */
  name: string;
  size?: number;
}) {
  const h = hash(name || 'explorer');
  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          backgroundColor: TINTS[h % TINTS.length],
        },
      ]}
    >
      <Text style={{ fontSize: size * 0.48 }}>
        {EMOJI[Math.floor(h / 7) % EMOJI.length]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    borderRadius: radius.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
