import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../api/client';

export default function MyJobs() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchJobs = async () => {
    try {
      const res = await apiClient.get('/driver/jobs/my-jobs');
      if (res.data.success) {
        setJobs(res.data.data.jobs || []);
      }
    } catch (err) {
      console.error("Failed to fetch my jobs", err);
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

  const renderItem = ({ item }: { item: any }) => {
    const isCod = item.isCod;
    const amount = isCod ? item.codAmountToCollect : item.deliveryFee;

    return (
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => router.push(`/job/${item.id}`)}
      >
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
      </TouchableOpacity>
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
            <Ionicons name="list" size={48} color="#a1a1aa" />
            <Text style={{marginTop: 10, color: "#a1a1aa"}}>لا توجد طلبات حالية</Text>
          </View>
        }
      />
    </View>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'accepted': return '#fbbf24';
    case 'picked_up': return '#fbbf24';
    case 'on_the_way': return '#fbbf24';
    default: return '#fbbf24';
  }
}

function getStatusText(status: string) {
  switch (status) {
    case 'accepted': return 'مقبول';
    case 'picked_up': return 'تم الاستلام';
    case 'on_the_way': return 'في الطريق';
    default: return status;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#09090b" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#09090b" },
  listContainer: { padding: 15 },
  card: {
    backgroundColor: "#18181b",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#27272a",
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10, borderBottomWidth: 1, borderBottomColor: "#27272a", paddingBottom: 10 },
  cardTitle: { fontWeight: "bold", fontSize: 16, color: "#fafafa" },
  jobId: { color: "#a1a1aa", fontSize: 14, fontWeight: "500" },
  statusBadge: { backgroundColor: "#fbbf24", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { color: "black", fontSize: 12, fontWeight: "bold" },
  cardBody: { marginBottom: 12 },
  cardRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  cardText: { marginLeft: 8, color: "#a1a1aa", flex: 1 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#27272a', paddingTop: 12 },
  feeText: { fontSize: 14, color: '#a1a1aa' },
  amount: { fontSize: 16, fontWeight: 'bold', color: '#fafafa' },
  codBadge: { fontSize: 12, fontWeight: 'bold', color: '#ef4444' },
  empty: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 16, fontSize: 16, color: '#94a3b8' },
});
