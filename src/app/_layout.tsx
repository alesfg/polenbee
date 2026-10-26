import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { posthog } from '@/lib/posthog';
import { ONBOARDING_KEY } from './onboarding';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Nunito-Bold': require('@expo-google-fonts/nunito/700Bold/Nunito_700Bold.ttf'),
    'Nunito-ExtraBold': require('@expo-google-fonts/nunito/800ExtraBold/Nunito_800ExtraBold.ttf'),
    'Nunito-Black': require('@expo-google-fonts/nunito/900Black/Nunito_900Black.ttf'),
    NunitoSans: require('@expo-google-fonts/nunito-sans/400Regular/NunitoSans_400Regular.ttf'),
    'NunitoSans-Medium': require('@expo-google-fonts/nunito-sans/500Medium/NunitoSans_500Medium.ttf'),
    'NunitoSans-SemiBold': require('@expo-google-fonts/nunito-sans/600SemiBold/NunitoSans_600SemiBold.ttf'),
    'NunitoSans-Bold': require('@expo-google-fonts/nunito-sans/700Bold/NunitoSans_700Bold.ttf'),
  });
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  useEffect(() => {
    if (!fontsLoaded) return;
    AsyncStorage.getItem(ONBOARDING_KEY).then((done) => {
      setOnboardingChecked(true);
      if (!done) router.replace('/onboarding');
      else posthog.capture('app_open');
    });
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.bg },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" options={{ animation: onboardingChecked ? 'fade' : 'none' }} />
        <Stack.Screen name="historial" />
        <Stack.Screen name="onboarding" options={{ animation: 'fade', gestureEnabled: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}
