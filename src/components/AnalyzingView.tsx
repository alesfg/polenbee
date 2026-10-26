import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Bee } from '@/components/illustrations/Bee';
import { Colors } from '@/constants/theme';
import { t } from '@/i18n';

const MESSAGES = [
  t('analyzing.1'),
  t('analyzing.2'),
  t('analyzing.3'),
  t('analyzing.4'),
  t('analyzing.5'),
];

const PHOTO = 180;
const ORBIT = 122;

export function AnalyzingView({ imageUri, placeLabel }: { imageUri: string; placeLabel: string }) {
  const orbit = useSharedValue(0);
  const scan = useSharedValue(0);
  const [msg, setMsg] = useState(0);

  useEffect(() => {
    orbit.value = withRepeat(withTiming(1, { duration: 3200, easing: Easing.linear }), -1);
    scan.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.quad) }), -1, true);
    const id = setInterval(() => setMsg((m) => (m + 1) % MESSAGES.length), 1800);
    return () => {
      clearInterval(id);
      cancelAnimation(orbit);
      cancelAnimation(scan);
    };
  }, []);

  const beeStyle = useAnimatedStyle(() => {
    const a = orbit.value * Math.PI * 2;
    return {
      transform: [
        { translateX: Math.cos(a) * ORBIT },
        { translateY: Math.sin(a) * ORBIT * 0.9 },
        // Face the direction of travel.
        { scaleX: Math.sin(a) > 0 ? -1 : 1 },
      ],
    };
  });
  const scanStyle = useAnimatedStyle(() => ({ transform: [{ translateY: scan.value * (PHOTO - 4) }] }));

  return (
    <View style={styles.container}>
      <View style={styles.stage}>
        <View style={styles.photoWrap}>
          <Image source={{ uri: imageUri }} style={styles.photo} contentFit="cover" />
          <Animated.View style={[styles.scanLine, scanStyle]} />
        </View>
        <Animated.View style={[styles.bee, beeStyle]}>
          <Bee size={64} />
        </Animated.View>
      </View>

      <Animated.Text key={msg} entering={FadeIn.duration(400)} style={styles.message}>
        {MESSAGES[msg]}
      </Animated.Text>
      <Text style={styles.place}>📍 {placeLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingTop: 40, gap: 14 },
  stage: { width: ORBIT * 2 + 70, height: ORBIT * 2 + 40, alignItems: 'center', justifyContent: 'center' },
  photoWrap: { width: PHOTO, height: PHOTO, borderRadius: PHOTO / 2, overflow: 'hidden', borderWidth: 6, borderColor: Colors.card, backgroundColor: Colors.honeyFaint },
  photo: { width: '100%', height: '100%' },
  scanLine: { position: 'absolute', left: 0, right: 0, top: 0, height: 4, backgroundColor: Colors.honeyPrimary, opacity: 0.8 },
  bee: { position: 'absolute' },
  message: { fontFamily: 'Nunito-ExtraBold', fontSize: 17, color: Colors.textPrimary, textAlign: 'center', minHeight: 24 },
  place: { fontFamily: 'NunitoSans', fontSize: 13, color: Colors.textMuted },
});
