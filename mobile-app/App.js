import 'react-native-gesture-handler';
import React, { useEffect, useState, useMemo } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform, View, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';

// Import screens
import SignInScreen from './src/screens/Auth/SignInScreen';
import SignUpScreen from './src/screens/Auth/SignUpScreen';
import HomeScreen from './src/screens/Home/HomeScreen';
import TournamentDetailScreen from './src/screens/Tournaments/TournamentDetailScreen';
import CatchCameraScreen from './src/screens/Catch/CatchCameraScreen';
import CatchSubmitScreen from './src/screens/Catch/CatchSubmitScreen';
import LeaderboardScreen from './src/screens/Leaderboard/LeaderboardScreen';
import ProfileScreen from './src/screens/Profile/ProfileScreen';
import MyTournamentsScreen from './src/screens/Tournaments/MyTournamentsScreen';
import LogFishScreen from './src/screens/Catch/LogFishScreen';
import { JoinedTournamentsProvider } from './src/state/joined-tournaments-context';
import { UserLocationProvider } from './src/state/user-location-context';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Main tabs after authentication
function MainTabs() {
  useEffect(() => {
    MaterialIcons.loadFont();
  }, []);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'MyTournaments') {
            iconName = 'event';
          } else if (route.name === 'Leaderboards') {
            iconName = 'leaderboard';
          } else if (route.name === 'Profile') {
            iconName = 'person';
          }

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: 'Tournaments' }}
      />
      <Tab.Screen
        name="MyTournaments"
        component={MyTournamentsScreen}
        options={{ tabBarLabel: 'My Tournaments' }}
      />
      <Tab.Screen
        name="Leaderboards"
        component={LeaderboardScreen}
        options={{ tabBarLabel: 'Leaderboards' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

// Main app component
export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const shouldBypassAuth = true;

  useEffect(() => {
    if (shouldBypassAuth) {
      setIsAuthenticated(true);
      setIsLoading(false);
      return;
    }

    checkAuthStatus();
  }, [shouldBypassAuth]);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      setIsAuthenticated(!!token);
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const navigationTree = useMemo(
    () => (
      <UserLocationProvider>
        <JoinedTournamentsProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              {!isAuthenticated ? (
                <>
                  <Stack.Screen name="SignIn" component={SignInScreen} />
                  <Stack.Screen name="SignUp" component={SignUpScreen} />
                </>
              ) : (
                <>
                  <Stack.Screen name="MainTabs" component={MainTabs} />
                  <Stack.Screen
                    name="TournamentDetail"
                    component={TournamentDetailScreen}
                    options={{ headerShown: true, title: 'Tournament' }}
                  />
                  <Stack.Screen
                    name="CatchCamera"
                    component={CatchCameraScreen}
                    options={{ headerShown: true, title: 'Log Catch' }}
                  />
                  <Stack.Screen
                    name="LogFish"
                    component={LogFishScreen}
                    options={{ headerShown: true, title: 'Log Fish' }}
                  />
                  <Stack.Screen
                    name="CatchSubmit"
                    component={CatchSubmitScreen}
                    options={{ headerShown: true, title: 'Submit Catch' }}
                  />
                </>
              )}
            </Stack.Navigator>
          </NavigationContainer>
        </JoinedTournamentsProvider>
      </UserLocationProvider>
    ),
    [isAuthenticated]
  );

  if (isLoading) {
    return null; // Or a loading screen
  }

  if (Platform.OS !== 'web') {
    return navigationTree;
  }

  return (
    <View style={styles.webRoot}>
      <View style={styles.webAmbient} />
      <View style={styles.webDeviceShadow}>
        <View style={styles.webDeviceBody}>
          <View style={styles.webDeviceNotch} />
          <View style={styles.webScreen}>{navigationTree}</View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  webRoot: {
    flex: 1,
    minHeight: '100vh',
    backgroundColor: '#030712',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  webAmbient: {
    position: 'absolute',
    width: 620,
    height: 620,
    borderRadius: 310,
    backgroundColor: '#0f172a',
    opacity: 0.75,
    marginTop: -40,
  },
  webDeviceShadow: {
    width: 420,
    borderRadius: 48,
    padding: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    shadowColor: '#0b1220',
    shadowOpacity: 0.45,
    shadowRadius: 46,
    shadowOffset: { width: 0, height: 28 },
  },
  webDeviceBody: {
    width: '100%',
    height: 860,
    borderRadius: 40,
    backgroundColor: '#0b1020',
    borderWidth: 2,
    borderColor: 'rgba(148, 163, 184, 0.25)',
    overflow: 'hidden',
    position: 'relative',
  },
  webDeviceNotch: {
    position: 'absolute',
    top: 0,
    left: '50%',
    transform: [{ translateX: -90 }],
    width: 180,
    height: 30,
    backgroundColor: '#0b1020',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    zIndex: 2,
  },
  webScreen: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 38,
    overflow: 'hidden',
  },
});
