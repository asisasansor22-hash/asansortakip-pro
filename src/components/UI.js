import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal as RNModal,
  ScrollView,
} from 'react-native';
import { getIlceRenk } from '../utils/constants';

export function Card({ title, children, style }) {
  return (
    <View style={[styles.card, style]}>
      {title ? <Text style={styles.cardTitle}>{title}</Text> : null}
      <View style={styles.cardBody}>{children}</View>
    </View>
  );
}

export function Empty({ text }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>— {text} —</Text>
    </View>
  );
}

export function Stat({ icon, label, value, color }) {
  return (
    <View style={[styles.stat, { borderLeftColor: color || '#007AFF' }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color: color || '#e0e6f0' }]}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function IlceBadge({ ilce }) {
  const c = getIlceRenk(ilce);
  return (
    <View style={[styles.ilceBadge, { backgroundColor: c + '20' }]}>
      <Text style={[styles.ilceText, { color: c }]}>{ilce}</Text>
    </View>
  );
}

export function Badge({ color, label }) {
  return (
    <View style={[styles.badge, { backgroundColor: (color || '#007AFF') + '22' }]}>
      <Text style={[styles.badgeText, { color: color || '#007AFF' }]}>
        {label}
      </Text>
    </View>
  );
}

export function PrimaryButton({ onPress, label, color, icon, disabled, style }) {
  return (
    <TouchableOpacity
      style={[
        styles.primaryBtn,
        { backgroundColor: color || '#007AFF' },
        disabled && { opacity: 0.5 },
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {icon ? <Text style={styles.btnIcon}>{icon}</Text> : null}
      <Text style={styles.primaryBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

export function IconButton({ onPress, icon, danger, style }) {
  return (
    <TouchableOpacity
      style={[
        styles.iconBtn,
        { backgroundColor: danger ? 'rgba(255,59,48,0.15)' : '#2a2d3a' },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <Text style={styles.iconBtnText}>{icon}</Text>
    </TouchableOpacity>
  );
}

export function Input({ value, onChangeText, placeholder, style, multiline, ...rest }) {
  return (
    <TextInput
      style={[styles.input, multiline && styles.textarea, style]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#64748b"
      multiline={multiline}
      {...rest}
    />
  );
}

export function Label({ children }) {
  return <Text style={styles.label}>{children}</Text>;
}

export function Field({ label, children }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

export function Toggle({ active, onPress, onLabel, offLabel, color }) {
  const c = color || '#34c759';
  return (
    <TouchableOpacity
      style={[
        styles.toggle,
        {
          backgroundColor: active ? c + '20' : '#2a2d3a',
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.toggleText,
          { color: active ? c : '#94a3b8' },
        ]}
      >
        {active ? onLabel : offLabel}
      </Text>
    </TouchableOpacity>
  );
}

export function SheetModal({ visible, onClose, title, children, onSave, saveLabel }) {
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={onClose}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>{children}</ScrollView>
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: '#2a2d3a' }]}
              onPress={onClose}
            >
              <Text style={styles.modalBtnTextMuted}>İptal</Text>
            </TouchableOpacity>
            {onSave ? (
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#007AFF' }]}
                onPress={onSave}
              >
                <Text style={styles.modalBtnText}>{saveLabel || 'Kaydet'}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
    </RNModal>
  );
}

export function StatGrid({ items }) {
  return (
    <View style={styles.statGrid}>
      {items.map((it, i) => (
        <View
          key={i}
          style={[styles.statSmall, { borderColor: it.color + '44' }]}
        >
          <Text style={[styles.statSmallValue, { color: it.color }]}>
            {it.value}
          </Text>
          <Text style={styles.statSmallLabel}>{it.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1c1e2a',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: '#2a3050',
  },
  cardTitle: {
    padding: 14,
    fontSize: 14,
    fontWeight: '700',
    color: '#e0e6f0',
    borderBottomWidth: 0.5,
    borderBottomColor: '#1e2236',
  },
  cardBody: {
    padding: 14,
  },
  empty: {
    padding: 28,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
  },
  stat: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#1c1e2a',
    borderRadius: 16,
    padding: 14,
    borderLeftWidth: 3,
  },
  statIcon: {
    fontSize: 22,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  ilceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  ilceText: {
    fontSize: 11,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    minHeight: 44,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  btnIcon: {
    fontSize: 15,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnText: {
    fontSize: 14,
  },
  input: {
    backgroundColor: '#2a2d3a',
    borderRadius: 12,
    padding: 12,
    paddingHorizontal: 14,
    color: '#e0e6f0',
    fontSize: 15,
    minHeight: 44,
  },
  textarea: {
    minHeight: 90,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 6,
  },
  field: {
    marginBottom: 14,
  },
  toggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#1c1e2a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  modalHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    backgroundColor: '#2a3050',
    borderRadius: 2,
    marginTop: 10,
    marginBottom: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 4,
    paddingBottom: 10,
  },
  modalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: '#e0e6f0',
  },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2a2d3a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    color: '#94a3b8',
    fontWeight: '700',
  },
  modalBody: {
    maxHeight: 500,
    paddingHorizontal: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    paddingTop: 10,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  modalBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  modalBtnTextMuted: {
    color: '#94a3b8',
    fontWeight: '600',
    fontSize: 15,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  statSmall: {
    flex: 1,
    minWidth: 90,
    backgroundColor: '#1a1f2e',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  statSmallValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  statSmallLabel: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
});
