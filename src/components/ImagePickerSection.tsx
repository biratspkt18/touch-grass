import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

type Props = {
  localImage: string | null;
  setLocalImage: (uri: string | null) => void;
  setImageUrl: (url: string) => void;
  loading: boolean;
};

export default function ImagePickerSection({ localImage, setLocalImage, setImageUrl, loading }: Props) {
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
      <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 6, marginTop: 16 }}>Image</Text>
      {localImage ? (
        <Image source={{ uri: localImage }} style={{ width: '100%', height: 200, borderRadius: 10, marginBottom: 10 }} />
      ) : null}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
        <TouchableOpacity style={{ backgroundColor: '#0077cc', flex: 1, marginRight: 5, borderRadius: 10, alignItems: 'center', paddingVertical: 14 }} onPress={pickImage} disabled={loading}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Pick Image</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ backgroundColor: '#0077cc', flex: 1, marginLeft: 5, borderRadius: 10, alignItems: 'center', paddingVertical: 14 }} onPress={takePhoto} disabled={loading}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Take Photo</Text>
        </TouchableOpacity>
      </View>
    </>
  );
} 