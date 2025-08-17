import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, MapPin, PlusCircle } from 'lucide-react-native'; // 👈 Lucide icons

import HomeScreen from './src/screens/HomeScreen';
import AddSpotScreen from './src/screens/AddSpotScreen';
import MapPickerScreen from './src/screens/MapPicker';
import MapSpotsScreen from './src/screens/MapSpotsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function FeedStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="HomeScreen" component={HomeScreen} options={{ title: 'Spots' }} />
    </Stack.Navigator>
  );
}

function AddStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="AddSpotScreen" component={AddSpotScreen} options={{ title: 'Add a Spot' }} />
      <Stack.Screen name="MapPickerScreen" component={MapPickerScreen} options={{ title: 'Pick Location' }} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: '#0EA5E9',
          tabBarInactiveTintColor: '#94A3B8',
          tabBarIcon: ({ color, size }) => {
            if (route.name === 'Feed') {
              return <Home color={color} size={size} />;
            }
            if (route.name === 'Map') {
              return <MapPin color={color} size={size} />; // 👈 using Lucide MapPin
            }
            if (route.name === 'Add') {
              return <PlusCircle color={color} size={size} />;
            }
          },
        })}
      >
        <Tab.Screen name="Feed" component={FeedStack} options={{ title: 'Spots' }} />
        <Tab.Screen name="Map" component={MapSpotsScreen} options={{ title: 'Map' }} />
        <Tab.Screen name="Add" component={AddStack} options={{ title: 'Add' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
