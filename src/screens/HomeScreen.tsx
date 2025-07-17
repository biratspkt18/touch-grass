import React, { useEffect, useState } from 'react'
import { View, Text, FlatList, Image, StyleSheet, ActivityIndicator } from 'react-native'
import supabase from '../components/Supabase'

export default function HomeScreen() {
  const [spots, setSpots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSpots = async () => {
      console.log('⏳ Fetching spots from Supabase...')
      const { data, error } = await supabase.from('Spots').select('*')

      if (error) {
        console.error('❌ Supabase error:', error.message)
        setError(error.message)
      } else {
        console.log('✅ Data received:', data)
        setSpots(data || [])
      }

      setLoading(false)
    }

    fetchSpots()
  }, [])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#888" />
        <Text style={styles.message}>Loading spots...</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    )
  }

  if (spots.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>No spots found.</Text>
      </View>
    )
  }

  return (
    <FlatList
      data={spots}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <View style={styles.card}>
          {Array.isArray(item.image_url) && item.image_url.length > 0 ? (
            <Image source={{ uri: item.image_url[0] }} style={styles.image} />
          ) : typeof item.image_url === 'string' && item.image_url ? (
            <Image source={{ uri: item.image_url }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.noImage]}>
              <Text style={{ color: '#999' }}>No Image</Text>
            </View>
          )}
          <Text style={styles.title}>{item.title}</Text>
          <Text>{item.description}</Text>
        </View>
      )}
    />
  )
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  message: {
    fontSize: 16,
    color: '#444',
    marginTop: 10,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
  },
  card: {
    padding: 12,
    margin: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImage: {
    backgroundColor: '#f0f0f0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },
})
