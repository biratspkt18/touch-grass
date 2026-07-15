import * as React from 'react';
import { useCallback } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import * as SplashScreen from 'expo-splash-screen';
import { Home, Map as MapIcon, Plus, UserRound } from 'lucide-react-native';
import {
  useFonts,
  Fredoka_500Medium,
  Fredoka_600SemiBold,
  Fredoka_700Bold,
} from '@expo-google-fonts/fredoka';
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';

import HomeScreen from './src/screens/HomeScreen';
import AddSpotScreen from './src/screens/AddSpotScreen';
import MapPickerScreen from './src/screens/MapPicker';
import MapSpotsScreen from './src/screens/MapSpotsScreen';
import SpotDetailScreen from './src/screens/SpotDetailScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import { AuthProvider } from './src/lib/auth';
import { colors, fonts, gradients, radius, shadow } from './src/theme/theme';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

SplashScreen.preventAutoHideAsync().catch(() => {});

function FeedStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen name="SpotDetailScreen" component={SpotDetailScreen} />
    </Stack.Navigator>
  );
}

function AddStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AddSpotScreen" component={AddSpotScreen} />
      <Stack.Screen name="MapPickerScreen" component={MapPickerScreen} />
    </Stack.Navigator>
  );
}

// Raised, gradient center button — the classic "post" affordance.
function AddTabButton({ onPress }: { onPress?: (e: any) => void }) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Add a spot"
      activeOpacity={0.85}
      onPress={onPress}
      style={styles.addButtonSlot}
    >
      <LinearGradient
        colors={gradients.brand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.addButton}
      >
        <Plus color="#fff" size={28} strokeWidth={2.6} />
      </LinearGradient>
    </TouchableOpacity>
  );
}

function TabLabel({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text
      style={[
        styles.tabLabel,
        { color: focused ? colors.primary : colors.inkFaint },
      ]}
    >
      {label}
    </Text>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Fredoka_500Medium,
    Fredoka_600SemiBold,
    Fredoka_700Bold,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  const onReady = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <AuthProvider>
      <StatusBar style="dark" />
      <NavigationContainer onReady={onReady}>
        <Tab.Navigator
          initialRouteName="Map"
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.inkFaint,
            tabBarStyle: styles.tabBar,
            tabBarItemStyle: { paddingTop: 8 },
          }}
        >
          <Tab.Screen
            name="Map"
            component={MapSpotsScreen}
            options={{
              tabBarIcon: ({ color, focused }) => (
                <MapIcon
                  color={color}
                  size={24}
                  fill={focused ? color : 'transparent'}
                  strokeWidth={focused ? 2 : 1.8}
                />
              ),
              tabBarLabel: ({ focused }) => (
                <TabLabel label="Map" focused={focused} />
              ),
            }}
          />
          <Tab.Screen
            name="Feed"
            component={FeedStack}
            options={{
              tabBarIcon: ({ color, focused }) => (
                <Home
                  color={color}
                  size={24}
                  fill={focused ? color : 'transparent'}
                  strokeWidth={focused ? 2 : 1.8}
                />
              ),
              tabBarLabel: ({ focused }) => (
                <TabLabel label="Feed" focused={focused} />
              ),
            }}
          />
          <Tab.Screen
            name="Add"
            component={AddStack}
            options={{
              tabBarLabel: () => null,
              tabBarIcon: () => null,
              tabBarButton: (props) => <AddTabButton onPress={props.onPress} />,
            }}
          />
          <Tab.Screen
            name="You"
            component={ProfileScreen}
            options={{
              tabBarIcon: ({ color, focused }) => (
                <UserRound
                  color={color}
                  size={24}
                  fill={focused ? color : 'transparent'}
                  strokeWidth={focused ? 2 : 1.8}
                />
              ),
              tabBarLabel: ({ focused }) => (
                <TabLabel label="You" focused={focused} />
              ),
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: Platform.select({ ios: 88, default: 68 }),
    paddingBottom: Platform.select({ ios: 28, default: 10 }),
    paddingTop: 8,
    backgroundColor: colors.surface,
    borderTopWidth: 0,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    ...shadow.lifted,
  },
  tabLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    marginTop: 2,
  },
  addButtonSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: 62,
    height: 62,
    borderRadius: radius.pill,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: colors.surface,
    transform: [{ translateY: -18 }],
    ...shadow.lifted,
  },
});
