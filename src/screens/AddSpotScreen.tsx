import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  Alert,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import supabase from '../components/Supabase'
import CategoryDropdown from '../components/CategoryDropdown'
import ImagePickerSection from '../components/ImagePickerSection'
import LocationInputs from '../components/LocationInputs'

import { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
  AddSpotScreen: {
    latitude?: number
    longitude?: number
  }
  MapPickerScreen: undefined
}

type AddSpotRouteProp = RouteProp<RootStackParamList, 'AddSpotScreen'>

type CategoryItem = {
  label: string
  value: string
}

export default function AddSpotScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'AddSpotScreen'>>();
  const route = useRoute<AddSpotRouteProp>()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<string | null>(null)
  const [tags, setTags] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [localImage, setLocalImage] = useState<string | null>(null)
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (route.params?.latitude && route.params?.longitude) {
      setLatitude(route.params.latitude.toString())
      setLongitude(route.params.longitude.toString())
    }
  }, [route.params])

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase.rpc('get_category_enum_values')
      if (error || !data) {
        console.error('Failed to fetch categories:', error?.message)
        Alert.alert('Error fetching categories', error?.message || 'Unknown error')
        return
      }
      const mapped: CategoryItem[] = (data as string[]).map((cat: string) => ({
        label: cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value: cat,
      }))
      setCategories(mapped)
    }
    fetchCategories()
  }, [])

  const handleAddSpot = async () => {
    if (!title || !description || !category || !tags || !latitude || !longitude) {
      Alert.alert('Missing Fields', 'Please fill in all fields.')
      return
    }
    setLoading(true)
    let finalImageUrl = imageUrl
    if (localImage) {
      const uploadedUrl = await uploadImageToSupabase(localImage)
      if (!uploadedUrl) {
        setLoading(false)
        return
      }
      finalImageUrl = uploadedUrl
    }
    if (!finalImageUrl) {
      Alert.alert('Missing Image', 'Please pick or take an image.')
      setLoading(false)
      return
    }
    const location = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
    }
    const { error } = await supabase.from('Spots').insert([
      {
        title,
        description,
        category,
        tags: tags.split(',').map(tag => tag.trim()),
        image_url: [finalImageUrl],
        location,
      },
    ])
    setLoading(false)
    if (error) {
      Alert.alert('Error', error.message)
    } else {
      Alert.alert('Success', 'Spot added!')
      navigation.goBack()
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.label}>Title</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="e.g. Albert Lake Park" />
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          value={description}
          onChangeText={setDescription}
          placeholder="A peaceful lake with a city view"
          multiline
        />
        <CategoryDropdown
          open={open}
          setOpen={setOpen}
          category={category}
          setCategory={setCategory}
          categories={categories}
          setCategories={setCategories}
        />
        <Text style={styles.label}>Tags (comma-separated)</Text>
        <TextInput style={styles.input} value={tags} onChangeText={setTags} placeholder="e.g. chill, free, sunset" />
        <ImagePickerSection
          localImage={localImage}
          setLocalImage={setLocalImage}
          setImageUrl={setImageUrl}
          loading={loading}
        />
        <LocationInputs
          latitude={latitude}
          setLatitude={setLatitude}
          longitude={longitude}
          setLongitude={setLongitude}
          navigation={navigation}
        />
        <TouchableOpacity style={styles.button} onPress={handleAddSpot} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Adding...' : 'Add Spot'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const uploadImageToSupabase = async (uri: string): Promise<string | null> => {
  try {
    const ext = uri.split('.').pop()
    const fileName = `spot_${Date.now()}.${ext}`
    const response = await fetch(uri)
    const blob = await response.blob()
    const { error } = await supabase.storage.from('location-images').upload(fileName, blob, {
      cacheControl: '3600',
      upsert: false,
      contentType: blob.type,
    })
    if (error) {
      Alert.alert('Image Upload Error', error.message)
      return null
    }
    const { data: publicUrlData } = supabase.storage.from('location-images').getPublicUrl(fileName)
    if (publicUrlData?.publicUrl) {
      return publicUrlData.publicUrl
    } else {
      Alert.alert('Error', 'Could not get public image URL')
      return null
    }
  } catch (e) {
    Alert.alert('Image Upload Error', (e as Error).message)
    return null
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fdfdfd',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  button: {
    marginTop: 20,
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
})
