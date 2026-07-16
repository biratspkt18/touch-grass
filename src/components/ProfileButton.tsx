// The app's profile entry point: a floating avatar button shown top-right on
// the main screens. Signed in it shows your avatar; signed out, a person icon.

import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { UserRound } from 'lucide-react-native';
import { useAuth } from '../lib/auth';
import Avatar from './Avatar';
import { colors, radius, shadow } from '../theme/theme';

export default function ProfileButton({ size = 40 }: { size?: number }) {
  const navigation = useNavigation<any>();
  const { profile } = useAuth();

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('Profile')}
      activeOpacity={0.85}
      hitSlop={6}
      accessibilityLabel="Your profile"
      style={[styles.button, { width: size, height: size }]}
    >
      {profile ? (
        <Avatar name={profile.username} size={size - 4} />
      ) : (
        <UserRound color={colors.inkMuted} size={size * 0.5} strokeWidth={2} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    ...shadow.soft,
  },
});
