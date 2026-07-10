import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../api/client';

export default function HistoryJobs() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchJobs = async () => {
    try {
      const res = await apiClient.get('/driver/jobs/history');
      if (res.data.success) {
        setJobs(res.data.data.jobs || []);
      }
    } catch (err) {
      console.error("Failed to fetch history jobs", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchJobs();
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'delivered': return 'تم التوصيل';
      case 'cancelled': return 'ملغي';
      case 'failed_delivery': return 'تعذر التسليم';
      case 'returned_to_vendor': return 'أُعيد إلى المتجر';
      case 'expired': return 'انتهت المهمة';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return '#10b981'; // emerald-500
      case 'cancelled': return '#ef4444'; // red-500
      case 'failed_delivery': return '#f97316';
      case 'returned_to_vendor': return '#8b5cf6';
      case 'expired': return '#71717a';
      default: return '#fbbf24';
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const isCod = item.isCod;
    const amount = isCod ? item.codAmountToCollect : item.deliveryFee;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.jobId}>طلب #{item.id.slice(0, 8)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.cardRow}>
            <Ionicons name="storefront" size={16} color="#a1a1aa" />
            <Text style={styles.cardText} numberOfLines={1}>
              {item.subOrder.vendor.storeName}
            </Text>
          </View>
          <View style={styles.cardRow}>
            <Ionicons name="person" size={16} color="#a1a1aa" />
            <Text style={styles.cardText} numberOfLines={1}>
              {item.subOrder.order.user.name} - {item.subOrder.order.user.phone}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.feeText}>التحصيل: <Text style={styles.amount}>{amount} ج.م</Text></Text>
          <Text style={styles.codBadge}>{isCod ? "كاش (COD)" : "دفع مسبق"}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#fbbf24" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#fbbf24"
            colors={["#fbbf24"]}
          />
        }
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="time-outline" size={48} color="#a1a1aa" />
            <Text style={styles.emptyText}>لا يوجد سجل طلبات سابق</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b', // Carbon Dark
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#09090b',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#18181b', // Card Dark
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  jobId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f4f4f5',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardBody: {
    marginBottom: 16,
  },
  cardRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardText: {
    color: '#d4d4d8',
    marginRight: 8,
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
  },
  cardFooter: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    paddingTop: 12,
  },
  feeText: {
    color: '#a1a1aa',
    fontSize: 14,
  },
  amount: {
    color: '#fbbf24',
    fontWeight: 'bold',
    fontSize: 16,
  },
  codBadge: {
    backgroundColor: '#3f3f46',
    color: '#f4f4f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 'bold',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 64,
  },
  emptyText: {
    color: '#a1a1aa',
    fontSize: 16,
    marginTop: 16,
    fontWeight: 'bold',
  },
});
