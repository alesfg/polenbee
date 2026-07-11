import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import { Tabs, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSession } from '@/hooks/useSession';
import { posthog } from '@/lib/posthog';
import { ONBOARDING_KEY } from './onboarding';

import { CalendarIcon, FlowerIcon, HiveIcon, HouseIcon, JarIcon } from '@/components/TabIcons';
import { Colors, TAB_BAR_HEIGHT } from '@/constants/theme';

SplashScreen.preventAutoHideAsync();

const TAB_CONFIG = [
  { name: 'index', label: 'Inicio', Icon: HouseIcon },
  { name: 'colmenares', label: 'Colmenares', Icon: HiveIcon },
  { name: 'polen', label: 'Polen', Icon: FlowerIcon, center: true },
  { name: 'cosechas', label: 'Cosechas', Icon: JarIcon },
  { name: 'calendario', label: 'Calendario', Icon: CalendarIcon },
] as const;

function CustomTabBar({ state, navigation }: { state: any; navigation: any }) {
  const insets = useSafeAreaInsets();
  const currentRoute = state.routes[state.index]?.name;
  if (currentRoute === 'onboarding' || currentRoute === 'login') return null;

  return (
    <View style={[styles.tabBar, { paddingBottom: insets.bottom || 8 }]}>
      {state.routes.map((route: { key: string; name: string }, index: number) => {
        const config = TAB_CONFIG.find((t) => t.name === route.name);
        if (!config) return null;
        const isFocused = state.index === index;
        const { Icon, label, center } = config as (typeof TAB_CONFIG)[number] & { center?: boolean };

        const onPress = () => {
          if (!isFocused) navigation.navigate(route.name);
        };

        if (center) {
          return (
            <TouchableOpacity key={route.key} onPress={onPress} style={styles.centerTabWrapper} activeOpacity={0.8}>
              <View style={[styles.centerBadge, { backgroundColor: isFocused ? Colors.greenDark : Colors.honeyFaint }]}>
                <Icon color={isFocused ? '#fff' : Colors.textMuted} size={28} />
              </View>
              <Text style={[styles.tabLabel, { color: isFocused ? Colors.greenDark : Colors.tabInactive }]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity key={route.key} onPress={onPress} style={styles.tabItem} activeOpacity={0.8}>
            <Icon color={isFocused ? Colors.honeyDark : Colors.tabInactive} />
            <Text style={[styles.tabLabel, { color: isFocused ? Colors.honeyDark : Colors.tabInactive }]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

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

  const session = useSession();
  const router = useRouter();

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  useEffect(() => {
    if (!fontsLoaded || session === undefined) return;
    AsyncStorage.getItem(ONBOARDING_KEY).then((done) => {
      if (!done) {
        router.replace('/onboarding');
        return;
      }
      if (session === null) {
        router.replace('/login');
      } else {
        posthog.identify(session.user.id, session.user.email ? { email: session.user.email } : {});
        posthog.capture('app_open');
      }
    });
  }, [fontsLoaded, session]);

  if (!fontsLoaded || session === undefined) return null;

  return (
    <SafeAreaProvider>
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{ headerShown: false, animation: 'none' }}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="colmenares" />
        <Tabs.Screen name="polen" />
        <Tabs.Screen name="cosechas" />
        <Tabs.Screen name="calendario" />
        <Tabs.Screen name="login" options={{ href: null }} />
        <Tabs.Screen name="perfil" options={{ href: null }} />
        <Tabs.Screen name="onboarding" options={{ href: null }} />
      </Tabs>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 6,
    alignItems: 'flex-end',
    minHeight: TAB_BAR_HEIGHT,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 4,
    gap: 3,
  },
  centerTabWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 4,
    gap: 3,
    marginTop: -20,
  },
  centerBadge: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: 'NunitoSans-SemiBold',
  },
});
