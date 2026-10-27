import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/theme';

// Realistic bees with pollen loads of different colours (AI-generated artwork, 1264×848).
const PHOTOS = [
  { source: require('../../assets/images/bee-photo-1.jpg'), pollen: ['#E8742C'] },
  { source: require('../../assets/images/bee-photo-2.jpg'), pollen: ['#4B4FA0', '#B33A2E'] },
];

/** Cross-fades between the bee photos, with the pollen colours of the current one as dots. */
export function BeePhotos({ height = 200, interval = 4500 }: { height?: number; interval?: number }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % PHOTOS.length), interval);
    return () => clearInterval(id);
  }, [interval]);

  const photo = PHOTOS[index];
  return (
    <View style={[styles.frame, { height }]}>
      <Image source={photo.source} style={StyleSheet.absoluteFill} contentFit="cover" transition={700} />
      <View style={styles.dots}>
        {photo.pollen.map((c) => (
          <View key={c} style={[styles.pollen, { backgroundColor: c }]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { width: '100%', borderRadius: 22, overflow: 'hidden', backgroundColor: Colors.honeyLight },
  dots: { position: 'absolute', right: 12, bottom: 12, flexDirection: 'row', gap: 6, backgroundColor: '#FFFFFFD9', borderRadius: 100, paddingHorizontal: 8, paddingVertical: 6 },
  pollen: { width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: '#00000020' },
});
