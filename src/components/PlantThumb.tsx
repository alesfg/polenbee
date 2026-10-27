import { Image } from 'expo-image';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { PlantPhoto } from '@/lib/plantPhoto';

type ViewerInfo = { title: string; subtitle?: string };

/** Square plant photo with its pollen colour as a badge; just the colour while there's no photo. Tap to enlarge. */
export function PlantThumb({ photo, pollenColor, size = 64, viewer }: { photo: PlantPhoto | null; pollenColor: string; size?: number; viewer?: ViewerInfo }) {
  const [open, setOpen] = useState(false);
  const badge = Math.round(size * 0.32);
  return (
    <>
      <Pressable onPress={() => photo && viewer && setOpen(true)} style={{ width: size, height: size }}>
        <View style={[styles.frame, { width: size, height: size, borderRadius: size * 0.26, backgroundColor: pollenColor }]}>
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
      </Pressable>
      {photo && viewer ? <PhotoViewer visible={open} photo={photo} info={viewer} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

/** Wide photo for the top of a plant card, with the pollen colour and credit on it. Tap to enlarge. */
export function PlantBanner({ photo, pollenColor, pollenLabel, height = 170, viewer }: { photo: PlantPhoto | null; pollenColor: string; pollenLabel?: string; height?: number; viewer: ViewerInfo }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable onPress={() => photo && setOpen(true)} style={[styles.banner, { height, backgroundColor: pollenColor }]}>
        {photo ? (
          <Image source={{ uri: photo.url }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} cachePolicy="memory-disk" />
        ) : (
          <Text style={[styles.placeholder, { fontSize: height * 0.32 }]}>🌼</Text>
        )}
        {pollenLabel ? (
          <View style={styles.pollenPill}>
            <View style={[styles.pollenDot, { backgroundColor: pollenColor }]} />
            <Text style={styles.pollenPillText}>{pollenLabel}</Text>
          </View>
        ) : null}
        {photo ? <Text style={styles.credit} numberOfLines={1}>{photo.attribution}</Text> : null}
      </Pressable>
      {photo ? <PhotoViewer visible={open} photo={photo} info={viewer} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function PhotoViewer({ visible, photo, info, onClose }: { visible: boolean; photo: PlantPhoto; info: ViewerInfo; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={[styles.viewer, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]} onPress={onClose}>
        <Image source={{ uri: photo.largeUrl }} placeholder={{ uri: photo.url }} style={styles.viewerImage} contentFit="contain" transition={200} />
        <Text style={styles.viewerTitle}>{info.title}</Text>
        {info.subtitle ? <Text style={styles.viewerSubtitle}>{info.subtitle}</Text> : null}
        <Text style={styles.viewerCredit}>{photo.attribution}</Text>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  frame: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderColor: '#00000010' },
  badge: { position: 'absolute', borderWidth: 2.5, borderColor: Colors.card },
  placeholder: { opacity: 0.55 },

  banner: { width: '100%', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  pollenPill: { position: 'absolute', left: 10, top: 10, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFFFFFE6', borderRadius: 100, paddingHorizontal: 10, paddingVertical: 5 },
  pollenDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 1, borderColor: '#00000020' },
  pollenPillText: { fontFamily: 'NunitoSans-Bold', fontSize: 12, color: Colors.textPrimary },
  credit: { position: 'absolute', right: 0, bottom: 0, maxWidth: '100%', fontFamily: 'NunitoSans', fontSize: 9.5, color: '#fff', backgroundColor: '#00000055', paddingHorizontal: 7, paddingVertical: 3, borderTopLeftRadius: 8 },

  viewer: { flex: 1, backgroundColor: '#000000EE', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, gap: 6 },
  viewerImage: { width: '100%', flex: 1, maxHeight: 620 },
  viewerTitle: { fontFamily: 'Nunito-Black', fontSize: 20, color: '#fff', marginTop: 12 },
  viewerSubtitle: { fontFamily: 'NunitoSans', fontStyle: 'italic', fontSize: 14, color: '#FFFFFFB0' },
  viewerCredit: { fontFamily: 'NunitoSans', fontSize: 11, color: '#FFFFFF90', textAlign: 'center' },
});
