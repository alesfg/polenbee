import { ReactNode, useEffect, useRef } from 'react';
import { Animated, Dimensions, Modal, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';

const SCREEN_H = Dimensions.get('window').height;

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Called when the dark backdrop is tapped. Defaults to onClose. */
  onBackdropPress?: () => void;
  children: ReactNode;
  maxHeight?: number | `${number}%`;
}

export function BottomSheet({ visible, onClose, onBackdropPress, children, maxHeight = '85%' }: Props) {
  const translateY = useRef(new Animated.Value(SCREEN_H)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(overlayOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, damping: 22, stiffness: 220, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(overlayOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: SCREEN_H, damping: 22, stiffness: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleBackdrop = onBackdropPress ?? onClose;

  return (
    <Modal visible={visible} animationType="none" transparent statusBarTranslucent>
      <View style={styles.container}>
        <TouchableWithoutFeedback onPress={handleBackdrop}>
          <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]} />
        </TouchableWithoutFeedback>
        <Animated.View style={[styles.sheetWrapper, { maxHeight, transform: [{ translateY }] }]}>
          <TouchableWithoutFeedback>
            <View>{children}</View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(58,44,29,0.5)',
  },
  sheetWrapper: {
    width: '100%',
  },
});
