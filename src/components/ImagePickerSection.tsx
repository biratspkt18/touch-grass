import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ImagePlus, Camera } from 'lucide-react-native';
import { colors, fonts, radius, spacing } from '../theme/theme';

type Props = {
  localImage: string | null;
  setLocalImage: (uri: string | null) => void;
  setImageUrl: (url: string) => void;
  loading: boolean;
};

export default function ImagePickerSection({
  localImage,
  setLocalImage,
  setImageUrl,
  loading,
}: Props) {
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setLocalImage(result.assets[0].uri);
      setImageUrl(''); // Clear imageUrl until upload
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Camera permission is required to take a photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setLocalImage(result.assets[0].uri);
      setImageUrl('');
    }
  };

  return (
    <>
      <Text style={styles.label}>Photo</Text>
      {localImage ? (
        <Image source={{ uri: localImage }} style={styles.preview} />
      ) : (
        <View style={styles.emptyPreview}>
          <Text style={styles.emptyEmoji}>📸</Text>
          <Text style={styles.emptyText}>Add a photo so people know the vibe</Text>
        </View>
      )}
      <View style={styles.row}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={pickImage}
          disabled={loading}
          activeOpacity={0.85}
        >
          <ImagePlus color={colors.primaryInk} size={18} />
          <Text style={styles.actionText}>Gallery</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={takePhoto}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Camera color={colors.primaryInk} size={18} />
          <Text style={styles.actionText}>Camera</Text>
        </TouchableOpacity>
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
  preview: {
    width: '100%',
    height: 200,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  emptyPreview: {
    height: 130,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderStyle: 'dashed',
    backgroundColor: colors.surfaceSunken,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: 6,
  },
  emptyEmoji: { fontSize: 28 },
  emptyText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.inkMuted },
  row: { flexDirection: 'row', gap: spacing.md },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  actionText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.primaryInk },
});
