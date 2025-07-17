import { View, Text, Image, StyleSheet } from 'react-native';

type Spot = {
  photo: any; // or ImageSourcePropType if you want to be more specific
  title: string;
  description: string;
  tags: string[];
};

export default function SpotCard({ spot }: { spot: Spot }) {
  return (
    <View style={styles.card}>
      <Image source={spot.photo} style={styles.image} />
      <Text style={styles.title}>{spot.title}</Text>
      <Text>{spot.description}</Text>
      <Text style={styles.tags}>{spot.tags.join(' • ')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  image: {
    height: 160,
    borderRadius: 10,
    marginBottom: 10,
    width: '100%',
  },
  title: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 4,
  },
  tags: {
    marginTop: 6,
    color: 'gray',
  },
});
