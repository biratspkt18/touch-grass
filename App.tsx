import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
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
      <Tab.Navigator>
        <Tab.Screen name="Feed" component={FeedStack} />
        <Tab.Screen name="Map" component={MapSpotsScreen} />
        <Tab.Screen name="Add" component={AddStack} options={{ title: 'Add a Spot' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}