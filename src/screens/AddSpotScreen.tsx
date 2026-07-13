import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  Alert,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import supabase from '../components/Supabase'
import CategoryDropdown from '../components/CategoryDropdown'
import ImagePickerSection from '../components/ImagePickerSection'
import LocationInputs from '../components/LocationInputs'
import { StackNavigationProp } from '@react-navigation/stack'
import {
  colors,
  fonts,
  gradients,
  radius,
  shadow,
  spacing,
  categoryFace,
} from '../theme/theme'

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
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'AddSpotScreen'>>()
  const route = useRoute<AddSpotRouteProp>()
  const insets = useSafeAreaInsets()
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
        return
      }
      const mapped: CategoryItem[] = (data as string[]).map((cat: string) => {
        const face = categoryFace(cat)
        return { label: `${face.emoji}  ${face.label}`, value: cat }
      })
      setCategories(mapped)
    }
    fetchCategories()
  }, [])

  const hasLocation = !!latitude && !!longitude

  const handleAddSpot = async () => {
    // Title, a write-up, and a location are the essentials. Category, tags and
    // an image are optional so a spot can be pinned quickly.
    if (!title || !description || !latitude || !longitude) {
      Alert.alert('Almost there', 'Add a title, a few words, and a location to pin your spot.')
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
    const location = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
    }
    const parsedTags = tags
      .split(',')
      .map(tag => tag.trim())
      .filter(Boolean)
    const { error } = await supabase.from('Spots').insert([
      {
        title,
        description,
        category,
        tags: parsedTags,
        image_url: finalImageUrl ? [finalImageUrl] : [],
        location,
      },
    ])
    setLoading(false)
    if (error) {
      Alert.alert('Error', error.message)
    } else {
      Alert.alert('Pinned! 🌱', 'Your spot is on the map.')
      navigation.goBack()
    }
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradients.brand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + spacing.md }]}
      >
        <Text style={styles.headerTitle}>Pin a spot ✨</Text>
        <Text style={styles.headerSubtitle}>Share a place worth leaving the house for.</Text>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.label}>Name of the place</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Albert Lake Park"
            placeholderTextColor={colors.inkFaint}
          />

          <Text style={styles.label}>Your write-up</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="What makes it special? The vibe, the view, the snack…"
            placeholderTextColor={colors.inkFaint}
            multiline
          />

          <Text style={styles.label}>Category</Text>
          <CategoryDropdown
            open={open}
            setOpen={setOpen}
            category={category}
            setCategory={setCategory}
            categories={categories}
            setCategories={setCategories}
          />

          <Text style={styles.label}>Tags</Text>
          <TextInput
            style={styles.input}
            value={tags}
            onChangeText={setTags}
            placeholder="chill, free, sunset"
            placeholderTextColor={colors.inkFaint}
          />
          <Text style={styles.hint}>Separate with commas — think vibes & activities.</Text>

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

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleAddSpot}
            disabled={loading}
            style={styles.submitWrap}
          >
            <LinearGradient
              colors={gradients.brand}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.submit, loading && { opacity: 0.7 }]}
            >
              <Text style={styles.submitText}>
                {loading ? 'Pinning…' : hasLocation ? 'Pin this spot 🌱' : 'Pin this spot'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
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
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  headerTitle: { fontFamily: fonts.displayBold, fontSize: 26, color: '#fff' },
  headerSubtitle: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  scroll: { padding: spacing.xl, paddingBottom: spacing.huge },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.ink,
    marginBottom: 8,
    marginTop: spacing.lg,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 13,
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.ink,
    backgroundColor: colors.surface,
  },
  textArea: { height: 96, paddingTop: 13, textAlignVertical: 'top' },
  hint: {
    fontFamily: fonts.body,
    fontSize: 12.5,
    color: colors.inkFaint,
    marginTop: 6,
  },
  submitWrap: { marginTop: spacing.xxl, borderRadius: radius.md, ...shadow.soft },
  submit: {
    paddingVertical: 16,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  submitText: { fontFamily: fonts.bodyBlack, fontSize: 16, color: '#fff' },
})
