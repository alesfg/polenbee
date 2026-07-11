import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity } from 'react-native';

import { Colors } from '@/constants/theme';

// En Android el picker inline abre un diálogo nativo en bucle; ahí se muestra
// un campo que abre el diálogo bajo demanda. En iOS se mantiene el spinner inline.
export function DateField({ value, onChange }: { value: Date; onChange: (d: Date) => void }) {
  const [show, setShow] = useState(false);

  if (Platform.OS === 'ios') {
    return (
      <DateTimePicker
        value={value}
        mode="date"
        display="spinner"
        locale="es-ES"
        onChange={(_, d) => d && onChange(d)}
        textColor={Colors.textPrimary}
        style={{ marginBottom: 8 }}
      />
    );
  }

  return (
    <>
      <TouchableOpacity style={styles.field} onPress={() => setShow(true)} activeOpacity={0.7}>
        <Text style={styles.fieldText}>
          {value.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
        </Text>
        <Text style={styles.fieldIcon}>📅</Text>
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={value}
          mode="date"
          display="default"
          onChange={(event, d) => {
            setShow(false);
            if (event.type === 'set' && d) onChange(d);
          }}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  field: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.honeyFaint, borderRadius: 12, padding: 14, marginBottom: 14 },
  fieldText: { fontSize: 14, color: Colors.textPrimary, fontFamily: 'NunitoSans' },
  fieldIcon: { fontSize: 16 },
});
