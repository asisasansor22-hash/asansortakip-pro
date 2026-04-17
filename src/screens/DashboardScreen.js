import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { MONTHS, getIlceRenk } from '../utils/constants';

function StatCard({ icon, label, value, color }) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SectionCard({ title, children }) {
  return (
    <View style={styles.sectionCard}>
      {title ? <Text style={styles.sectionTitle}>{title}</Text> : null}
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

export default function DashboardScreen({ data, onRefresh }) {
  const { elevs, maints, faults, tasks, loading } = data;

  const now = new Date();
  const todayStr =
    now.getFullYear() +
    '-' +
    String(now.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(now.getDate()).padStart(2, '0');

  const currentMonth = now.getMonth();

  const aylikBakimlar = useMemo(() => {
    return maints.filter((m) => {
      const d = new Date(m.tarih);
      return d.getMonth() === currentMonth && d.getFullYear() === now.getFullYear();
    });
  }, [maints, currentMonth]);

  const acikArizalar = useMemo(() => {
    return faults.filter((f) => f.durum !== 'Çözüldü');
  }, [faults]);

  const gunlukIsler = useMemo(() => {
    return tasks.filter((t) => t.tarih === todayStr);
  }, [tasks, todayStr]);

  const tamamlananIsler = gunlukIsler.filter((t) => t.bitti);

  const bakimOrani = elevs.length > 0
    ? Math.round((aylikBakimlar.length / elevs.length) * 100)
    : 0;

  const ilceDagilimi = useMemo(() => {
    const map = {};
    elevs.forEach((e) => {
      map[e.ilce] = (map[e.ilce] || 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [elevs]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.header}>
        {MONTHS[currentMonth]} Özeti
      </Text>

      <View style={styles.statGrid}>
        <StatCard
          icon="🛗"
          label="Toplam Asansör"
          value={elevs.length}
          color="#007AFF"
        />
        <StatCard
          icon="🔧"
          label="Aylık Bakım"
          value={`${aylikBakimlar.length}/${elevs.length}`}
          color="#34c759"
        />
        <StatCard
          icon="⚠️"
          label="Açık Arıza"
          value={acikArizalar.length}
          color={acikArizalar.length > 0 ? '#ff3b30' : '#34c759'}
        />
        <StatCard
          icon="📋"
          label="Günlük İşler"
          value={`${tamamlananIsler.length}/${gunlukIsler.length}`}
          color="#ff9500"
        />
      </View>

      <SectionCard title="Bakım İlerleme">
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${bakimOrani}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          %{bakimOrani} tamamlandı
        </Text>
      </SectionCard>

      <SectionCard title="İlçe Dağılımı">
        {ilceDagilimi.map(([ilce, count]) => (
          <View key={ilce} style={styles.ilceRow}>
            <View
              style={[
                styles.ilceDot,
                { backgroundColor: getIlceRenk(ilce) },
              ]}
            />
            <Text style={styles.ilceText}>{ilce}</Text>
            <Text style={styles.ilceCount}>{count}</Text>
          </View>
        ))}
      </SectionCard>

      {acikArizalar.length > 0 && (
        <SectionCard title="Açık Arızalar">
          {acikArizalar.slice(0, 5).map((f, i) => {
            const elev = elevs.find((e) => e.id === f.asansorId);
            return (
              <View key={f.id || i} style={styles.faultRow}>
                <View style={styles.faultDot} />
                <View style={styles.flex1}>
                  <Text style={styles.faultTitle}>
                    {elev ? elev.ad : 'Bilinmeyen'}
                  </Text>
                  <Text style={styles.faultDesc} numberOfLines={1}>
                    {f.aciklama || 'Açıklama yok'}
                  </Text>
                </View>
                <Text style={styles.faultDate}>
                  {f.tarih ? f.tarih.slice(5) : ''}
                </Text>
              </View>
            );
          })}
        </SectionCard>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1117',
  },
  content: {
    padding: 16,
  },
  header: {
    fontSize: 22,
    fontWeight: '800',
    color: '#e0e6f0',
    marginBottom: 16,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#1c1e2a',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 3,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  sectionCard: {
    backgroundColor: '#1c1e2a',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  sectionTitle: {
    padding: 14,
    paddingBottom: 10,
    fontSize: 14,
    fontWeight: '700',
    color: '#e0e6f0',
    borderBottomWidth: 0.5,
    borderBottomColor: '#1e2236',
  },
  sectionBody: {
    padding: 14,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#2a2d3a',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#34c759',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'right',
  },
  ilceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 10,
  },
  ilceDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  ilceText: {
    flex: 1,
    fontSize: 14,
    color: '#e0e6f0',
  },
  ilceCount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94a3b8',
  },
  faultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#1e2236',
  },
  faultDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff3b30',
  },
  flex1: {
    flex: 1,
  },
  faultTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e0e6f0',
  },
  faultDesc: {
    fontSize: 12,
    color: '#94a3b8',
  },
  faultDate: {
    fontSize: 12,
    color: '#64748b',
  },
});
