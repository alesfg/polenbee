import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { PlantPhoto } from '@/lib/plantPhoto';

/** Plant photo with its pollen colour as a badge; just the colour while there's no photo. */
export function PlantThumb({ photo, pollenColor, size = 64 }: { photo: PlantPhoto | null; pollenColor: string; size?: number }) {
  const badge = Math.round(size * 0.36);
  return (
    <View style={{ width: size, height: size }}>
      <View style={[styles.frame, { width: size, height: size, borderRadius: size * 0.28, backgroundColor: pollenColor }]}>
        {photo ? (
          <Image source={{ uri: photo.url }} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} cachePolicy="memory-disk" />
        ) : (
          <Text style={[styles.placeholder, { fontSize: size * 0.4 }]}>🌼</Text>
        )}
      </View>
      {photo ? (
        <View
          style={[
            styles.badge,
            { width: badge, height: badge, borderRadius: badge / 2, backgroundColor: pollenColor, right: -badge * 0.2, bottom: -badge * 0.2 },
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderColor: '#00000010' },
  badge: { position: 'absolute', borderWidth: 2.5, borderColor: Colors.card },
  placeholder: { opacity: 0.55 },
});
