import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ImagePlus, Camera, X } from 'lucide-react-native';
import { colors, fonts, radius, spacing } from '../theme/theme';

/** First-iteration cap: a spot carries at most this many photos. */
export const MAX_SPOT_IMAGES = 5;

type Props = {
  localImages: string[];
  setLocalImages: (uris: string[]) => void;
  loading: boolean;
};

export default function ImagePickerSection({
  localImages,
  setLocalImages,
  loading,
}: Props) {
  const remaining = MAX_SPOT_IMAGES - localImages.length;
  const full = remaining <= 0;

  // Full quality here: the storage wrapper resizes and compresses (and strips
  // metadata) right before upload, so don't degrade the source twice.
  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 1,
    });
    if (!result.canceled && result.assets?.length) {
      setLocalImages(
        [...localImages, ...result.assets.map((a) => a.uri)].slice(0, MAX_SPOT_IMAGES)
      );
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
      quality: 1,
    });
    if (!result.canceled && result.assets?.length) {
      setLocalImages([...localImages, result.assets[0].uri].slice(0, MAX_SPOT_IMAGES));
    }
  };

  const removeImage = (uri: string) => {
    setLocalImages(localImages.filter((u) => u !== uri));
  };

  return (
    <>
      <View style={styles.labelRow}>
        <Text style={styles.label}>Photos</Text>
        <Text style={styles.count}>
          {localImages.length}/{MAX_SPOT_IMAGES}
        </Text>
      </View>
      {localImages.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.thumbRow}
        >
          {localImages.map((uri) => (
            <View key={uri} style={styles.thumbWrap}>
              <Image source={{ uri }} style={styles.thumb} />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeImage(uri)}
                disabled={loading}
                hitSlop={8}
                accessibilityLabel="Remove photo"
              >
                <X color="#fff" size={13} strokeWidth={3} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyPreview}>
          <Text style={styles.emptyEmoji}>📸</Text>
          <Text style={styles.emptyText}>
            Add up to {MAX_SPOT_IMAGES} photos so people know the vibe
          </Text>
        </View>
      )}
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.actionButton, full && styles.actionDisabled]}
          onPress={pickImages}
          disabled={loading || full}
          activeOpacity={0.85}
        >
          <ImagePlus color={colors.primaryInk} size={18} />
          <Text style={styles.actionText}>Gallery</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, full && styles.actionDisabled]}
          onPress={takePhoto}
          disabled={loading || full}
          activeOpacity={0.85}
        >
          <Camera color={colors.primaryInk} size={18} />
          <Text style={styles.actionText}>Camera</Text>
        </TouchableOpacity>
      </View>
      {full ? (
        <Text style={styles.hint}>
          That's the lot — remove a photo to swap in another.
        </Text>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    marginBottom: 8,
  },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.ink,
  },
  count: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12.5,
    color: colors.inkFaint,
  },
  thumbRow: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  thumbWrap: {
    position: 'relative',
  },
  thumb: {
    width: 96,
    height: 96,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSunken,
  },
  removeButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(15,23,42,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
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
  actionDisabled: { opacity: 0.45 },
  actionText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.primaryInk },
  hint: {
    fontFamily: fonts.body,
    fontSize: 12.5,
    color: colors.inkFaint,
    marginTop: 6,
  },
});
