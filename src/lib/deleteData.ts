import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';

import { t } from '@/i18n';
import { posthog } from './posthog';
import { supabase } from './supabase';

/** Native Alert or browser confirm, resolving to the user's choice. */
export function confirmDeleteData(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(typeof window !== 'undefined' && window.confirm(`${t('delete.title')}\n\n${t('delete.message')}`));
  }
  return new Promise((resolve) => {
    Alert.alert(t('delete.title'), t('delete.message'), [
      { text: t('delete.cancel'), style: 'cancel', onPress: () => resolve(false) },
      { text: t('delete.confirm'), style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}

/** Deletes the pollen history and anonymous user on the server, then wipes everything stored on the device. */
export async function deleteMyData(): Promise<boolean> {
  const { data, error } = await supabase.functions.invoke('polenbee-delete-data', { body: {} });
  if (error || !data?.success) return false;
  await supabase.auth.signOut({ scope: 'local' });
  await AsyncStorage.clear();
  posthog.reset();
  return true;
}
