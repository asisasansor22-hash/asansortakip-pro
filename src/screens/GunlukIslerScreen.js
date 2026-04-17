import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Empty,
  IconButton,
  SheetModal,
  Field,
  Input,
  PrimaryButton,
} from '../components/UI';

function todayISO() {
  const d = new Date();
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
}

export default function GunlukIslerScreen({ data }) {
  const { tasks, setTasks, elevs } = data;
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ metin: '', tarih: todayISO() });

  const today = todayISO();

  const groupedTasks = useMemo(() => {
    const sorted = [...tasks].sort((a, b) =>
      String(b.tarih).localeCompare(String(a.tarih)),
    );
    const groups = {};
    sorted.forEach((t) => {
      if (!groups[t.tarih]) groups[t.tarih] = [];
      groups[t.tarih].push(t);
    });
    return Object.entries(groups);
  }, [tasks]);

  const save = () => {
    if (!form.metin.trim()) {
      Alert.alert('Eksik Bilgi', 'İş açıklaması zorunlu.');
      return;
    }
    setTasks((p) => [
      ...p,
      {
        id: Date.now(),
        metin: form.metin.trim(),
        tarih: form.tarih,
        bitti: false,
      },
    ]);
    setForm({ metin: '', tarih: todayISO() });
    setModalVisible(false);
  };

  const toggleBitti = (id) => {
    setTasks((p) =>
      p.map((t) => (t.id === id ? { ...t, bitti: !t.bitti } : t)),
    );
  };

  const del = (id) => {
    Alert.alert('İş Silinsin mi?', '', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => setTasks((p) => p.filter((t) => t.id !== id)),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📋 Günlük İşler</Text>
        <PrimaryButton
          label="+ Ekle"
          onPress={() => {
            setForm({ metin: '', tarih: todayISO() });
            setModalVisible(true);
          }}
          style={{ paddingVertical: 8, paddingHorizontal: 14, minHeight: 36 }}
        />
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {groupedTasks.length === 0 ? (
          <Empty text="Henüz iş yok" />
        ) : (
          groupedTasks.map(([tarih, ts]) => (
            <View key={tarih} style={styles.dayGroup}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayTitle}>
                  {tarih === today ? 'Bugün' : tarih}
                </Text>
                <Text style={styles.dayCount}>
                  {ts.filter((t) => t.bitti).length}/{ts.length}
                </Text>
              </View>
              {ts.map((t) => (
                <View key={t.id} style={styles.taskRow}>
                  <TouchableOpacity
                    style={[
                      styles.checkbox,
                      t.bitti && styles.checkboxDone,
                    ]}
                    onPress={() => toggleBitti(t.id)}
                  >
                    {t.bitti ? (
                      <Text style={styles.checkmark}>✓</Text>
                    ) : null}
                  </TouchableOpacity>
                  <Text
                    style={[
                      styles.taskText,
                      t.bitti && styles.taskTextDone,
                    ]}
                  >
                    {t.metin}
                  </Text>
                  <IconButton
                    icon="🗑️"
                    danger
                    onPress={() => del(t.id)}
                  />
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>

      <SheetModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={save}
        title="Yeni İş"
      >
        <Field label="İş Açıklaması">
          <Input
            value={form.metin}
            onChangeText={(t) => setForm({ ...form, metin: t })}
            placeholder="Yapılacak iş..."
            multiline
          />
        </Field>
        <Field label="Tarih">
          <Input
            value={form.tarih}
            onChangeText={(t) => setForm({ ...form, tarih: t })}
            placeholder="YYYY-MM-DD"
          />
        </Field>
      </SheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1117',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 10,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    color: '#e0e6f0',
  },
  list: {
    padding: 16,
    paddingTop: 4,
    paddingBottom: 40,
  },
  dayGroup: {
    marginBottom: 20,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  dayTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dayCount: {
    fontSize: 12,
    color: '#64748b',
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1e2a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 6,
    gap: 12,
    borderWidth: 0.5,
    borderColor: '#2a3050',
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#64748b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    backgroundColor: '#34c759',
    borderColor: '#34c759',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
  },
  taskText: {
    flex: 1,
    fontSize: 14,
    color: '#e0e6f0',
  },
  taskTextDone: {
    textDecorationLine: 'line-through',
    color: '#64748b',
  },
});
