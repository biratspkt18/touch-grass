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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { useAuth } from '../lib/auth'
import { uploadImage } from '../lib/storage'
import { addSpot, fetchCategories } from '../lib/spots'
import CategoryDropdown from '../components/CategoryDropdown'
import ImagePickerSection from '../components/ImagePickerSection'
import LocationInputs from '../components/LocationInputs'
import { StackNavigationProp } from '@react-navigation/stack'
import {
  colors,
  fonts,
  hairline,
  radius,
  shadow,
  spacing,
} from '../theme/theme'
import { categoryStyle } from '../theme/categoryIcons'

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
  icon?: () => React.JSX.Element
}

export default function AddSpotScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'AddSpotScreen'>>()
  const route = useRoute<AddSpotRouteProp>()
  const insets = useSafeAreaInsets()
  const { session } = useAuth()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<string | null>(null)
  const [tags, setTags] = useState('')
  const [localImages, setLocalImages] = useState<string[]>([])
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
    fetchCategories()
      .then((values) => {
        const mapped: CategoryItem[] = values.map((cat) => {
          const meta = categoryStyle(cat)
          return {
            label: meta.label,
            value: cat,
            icon: () => <meta.Icon color={meta.color} size={17} strokeWidth={2.2} />,
          }
        })
        setCategories(mapped)
      })
      .catch((e) => console.error('Failed to fetch categories:', (e as Error).message))
  }, [])

  const handleAddSpot = async () => {
    // Title, a write-up, and a location are the essentials. Category, tags and
    // an image are optional so a spot can be pinned quickly.
    if (!title || !description || !latitude || !longitude) {
      Alert.alert('Almost there', 'Add a title, a few words, and a location to pin your spot.')
      return
    }
    setLoading(true)
    try {
      // The storage wrapper compresses on-device and returns a path — the
      // database never sees a full URL.
      const imagePaths: string[] = []
      for (const uri of localImages) {
        imagePaths.push(await uploadImage(uri))
      }
      await addSpot({
        title,
        description,
        category,
        tags: tags
          .split(',')
          .map(tag => tag.trim())
          .filter(Boolean),
        imagePaths,
        location: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
        },
        userId: session!.user.id,
      })
      Alert.alert('Pinned! 🌱', 'Your spot is on the map.')
      navigation.goBack()
    } catch (e) {
      Alert.alert('Error', (e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  // Pinning requires an account so spots carry their author's name.
  if (!session) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
          <Text style={styles.headerTitle}>Pin a spot</Text>
          <Text style={styles.headerSubtitle}>Share a place worth leaving the house for.</Text>
        </View>

        <View style={styles.gate}>
          <Text style={styles.gateEmoji}>🌱</Text>
          <Text style={styles.gateTitle}>Sign in to pin spots</Text>
          <Text style={styles.gateBody}>
            Create an account so every spot you share has your name on it.
          </Text>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => (navigation as any).navigate('Profile')}
            style={styles.submitWrap}
          >
            <View style={styles.submit}>
              <Text style={styles.submitText}>Sign in or join</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.headerTitle}>Pin a spot</Text>
        <Text style={styles.headerSubtitle}>Share a place worth leaving the house for.</Text>
      </View>

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
            localImages={localImages}
            setLocalImages={setLocalImages}
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
            <View style={[styles.submit, loading && { opacity: 0.7 }]}>
              <Text style={styles.submitText}>
                {loading ? 'Pinning…' : 'Pin this spot'}
              </Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: hairline,
    borderBottomColor: colors.border,
  },
  headerTitle: { fontFamily: fonts.displayBold, fontSize: 26, color: colors.ink },
  headerSubtitle: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.inkMuted,
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
  gate: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
    paddingBottom: spacing.huge,
  },
  gateEmoji: { fontSize: 44, textAlign: 'center' },
  gateTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 22,
    color: colors.ink,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  gateBody: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.inkMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  submitWrap: { marginTop: spacing.xxl, borderRadius: radius.md, ...shadow.soft },
  submit: {
    paddingVertical: 16,
    borderRadius: radius.md,
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  submitText: { fontFamily: fonts.bodyBlack, fontSize: 16, color: '#fff' },
})
