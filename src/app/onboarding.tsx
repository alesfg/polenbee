import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    emoji: null,
    logo: true,
    title: 'Bienvenido a PolenBee',
    subtitle: 'Tu colmenar, siempre a mano.\nGestiona, analiza y cosecha más inteligente.',
  },
  {
    emoji: '🏡',
    logo: false,
    title: 'Gestiona tus colmenares',
    subtitle: 'Registra apiarios y colmenas. Lleva el control de inspecciones, reinas y cosechas en un solo lugar.',
  },
  {
    emoji: '🌸',
    logo: false,
    title: 'Analiza el polen',
    subtitle: 'Fotografía las flores y la IA identifica el tipo de polen que recolectan tus abejas, con localización exacta.',
  },
] as const;

export const ONBOARDING_KEY = 'onboarding_complete';

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  async function finish() {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    router.replace('/login');
  }

  function next() {
    if (currentIndex < SLIDES.length - 1) {
      const nextIdx = currentIndex + 1;
      scrollRef.current?.scrollTo({ x: nextIdx * width, animated: true });
      setCurrentIndex(nextIdx);
    } else {
      finish();
    }
  }

  const isLast = currentIndex === SLIDES.length - 1;

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}>
      {!isLast && (
        <TouchableOpacity style={styles.skipBtn} onPress={finish}>
          <Text style={styles.skipText}>Saltar</Text>
        </TouchableOpacity>
      )}

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        style={{ flex: 1 }}
      >
        {SLIDES.map((slide, i) => (
          <View key={i} style={[styles.slide, { width }]}>
            <View style={styles.illustrationArea}>
              {slide.logo ? (
                <Image
                  source={require('../../assets/images/icon.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.emojiCircle}>
                  <Text style={styles.emojiLarge}>{slide.emoji}</Text>
                </View>
              )}
            </View>
            <View style={styles.textArea}>
              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.subtitle}>{slide.subtitle}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === currentIndex && styles.dotActive]} />
          ))}
        </View>
        <TouchableOpacity style={styles.nextBtn} onPress={next} activeOpacity={0.85}>
          <Text style={styles.nextBtnText}>{isLast ? 'Empezar 🐝' : 'Siguiente'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  skipBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  skipText: {
    color: Colors.textMuted,
    fontFamily: 'NunitoSans-SemiBold',
    fontSize: 14,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  illustrationArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 160,
    height: 160,
    borderRadius: 36,
  },
  emojiCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.honeyFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiLarge: {
    fontSize: 72,
  },
  textArea: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 8,
  },
  title: {
    fontFamily: 'Nunito-Black',
    fontSize: 26,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontFamily: 'NunitoSans',
    fontSize: 16,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 24,
    gap: 20,
    alignItems: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border2,
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.honeyPrimary,
  },
  nextBtn: {
    width: '100%',
    backgroundColor: Colors.greenDark,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  nextBtnText: {
    color: '#fff',
    fontFamily: 'Nunito-ExtraBold',
    fontSize: 17,
  },
});
