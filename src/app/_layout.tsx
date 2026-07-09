import { useFonts } from 'expo-font';
import { Tabs, TabList, TabTrigger, TabSlot } from 'expo-router/ui';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, TAB_BAR_HEIGHT } from '@/constants/theme';

SplashScreen.preventAutoHideAsync();

function TabBar() {
  const insets = useSafeAreaInsets();
  const tabs: Array<{ name: string; href: string; label: string; icon: React.ComponentType<{ color: string }>; center?: boolean }> = [
    { name: 'index', href: '/', label: 'Inicio', icon: HouseIcon },
    { name: 'colmenares', href: '/colmenares', label: 'Colmenares', icon: HexagonIcon },
    { name: 'polen', href: '/polen', label: 'Polen', icon: FlowerIcon, center: true },
    { name: 'cosechas', href: '/cosechas', label: 'Cosechas', icon: JarIcon },
    { name: 'calendario', href: '/calendario', label: 'Calendario', icon: CalendarIcon },
  ];

  return (
    <TabList asChild>
      <View style={[styles.tabBar, { paddingBottom: insets.bottom || 8 }]}>
        {tabs.map((tab) => (
          <TabTrigger key={tab.name} name={tab.name} href={tab.href} asChild>
            <TabItem label={tab.label} Icon={tab.icon} center={tab.center ?? false} />
          </TabTrigger>
        ))}
      </View>
    </TabList>
  );
}

function TabItem({
  label,
  Icon,
  center,
  isFocused,
  ...props
}: {
  label: string;
  Icon: React.ComponentType<{ color: string }>;
  center?: boolean;
  isFocused?: boolean;
  [key: string]: unknown;
}) {
  if (center) {
    return (
      <TouchableOpacity {...(props as object)} style={styles.centerTabWrapper} activeOpacity={0.8}>
        <View style={[styles.centerBadge, { backgroundColor: isFocused ? Colors.greenDark : Colors.honeyFaint }]}>
          <Icon color={isFocused ? '#fff' : Colors.textMuted} />
        </View>
        <Text style={[styles.tabLabel, { color: isFocused ? Colors.greenDark : Colors.tabInactive }]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity {...(props as object)} style={styles.tabItem} activeOpacity={0.8}>
      <Icon color={isFocused ? Colors.honeyDark : Colors.tabInactive} />
      <Text style={[styles.tabLabel, { color: isFocused ? Colors.honeyDark : Colors.tabInactive }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function HouseIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
      <View style={[{ width: 18, height: 12, backgroundColor: color, borderRadius: 2, marginTop: 4 }]} />
      <View style={[{ width: 0, height: 0, borderLeftWidth: 12, borderRightWidth: 12, borderBottomWidth: 9, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: color, position: 'absolute', top: 0 }]} />
    </View>
  );
}

function HexagonIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 18, height: 18, backgroundColor: color, borderRadius: 4, transform: [{ rotate: '30deg' }] }} />
    </View>
  );
}

function FlowerIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: color, position: 'absolute' }} />
      {[0, 45, 90, 135].map((angle) => (
        <View key={angle} style={{ position: 'absolute', width: 6, height: 10, borderRadius: 3, backgroundColor: color, transform: [{ rotate: `${angle}deg` }, { translateY: -7 }] }} />
      ))}
    </View>
  );
}

function JarIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 8, height: 3, backgroundColor: color, borderRadius: 1, marginBottom: 1 }} />
      <View style={{ width: 14, height: 14, backgroundColor: color, borderRadius: 3, borderBottomLeftRadius: 5, borderBottomRightRadius: 5 }} />
    </View>
  );
}

function CalendarIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 18, height: 16, backgroundColor: color, borderRadius: 3, overflow: 'hidden' }}>
        <View style={{ height: 5, backgroundColor: color }} />
        <View style={{ flex: 1, backgroundColor: '#fff', opacity: 0.25, margin: 2, borderRadius: 1 }} />
      </View>
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Nunito: require('@expo-google-fonts/nunito/700Bold/Nunito_700Bold.ttf'),
    'Nunito-Bold': require('@expo-google-fonts/nunito/700Bold/Nunito_700Bold.ttf'),
    'Nunito-ExtraBold': require('@expo-google-fonts/nunito/800ExtraBold/Nunito_800ExtraBold.ttf'),
    'Nunito-Black': require('@expo-google-fonts/nunito/900Black/Nunito_900Black.ttf'),
    NunitoSans: require('@expo-google-fonts/nunito-sans/400Regular/NunitoSans_400Regular.ttf'),
    'NunitoSans-Medium': require('@expo-google-fonts/nunito-sans/500Medium/NunitoSans_500Medium.ttf'),
    'NunitoSans-SemiBold': require('@expo-google-fonts/nunito-sans/600SemiBold/NunitoSans_600SemiBold.ttf'),
    'NunitoSans-Bold': require('@expo-google-fonts/nunito-sans/700Bold/NunitoSans_700Bold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <Tabs>
          <TabSlot style={styles.slot} />
          <TabBar />
        </Tabs>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  slot: { flex: 1 },
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
