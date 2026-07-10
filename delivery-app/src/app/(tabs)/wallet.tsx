import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../api/client';

export default function Wallet() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWallet = async () => {
    try {
      const res = await apiClient.get('/driver/wallet');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch wallet", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchWallet();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#fbbf24" />
      </View>
    );
  }

  const balances = data?.balances || {};
  const transactions = data?.transactions || [];

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#fbbf24"
            colors={["#fbbf24"]}
          />
        }
      >
        <View style={styles.balanceCard}>
          <Text style={styles.balanceTitle}>إجمالي الرصيد</Text>
          <Text style={styles.balanceAmount}>{balances.walletBalance || 0} ج.م</Text>
          <View style={styles.row}>
            <View style={styles.subBalance}>
              <Text style={styles.subBalanceTitle}>نقدية في اليد</Text>
              <Text style={styles.subBalanceAmount}>{balances.cashOnHandBalance || 0} ج.م</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>أحدث العمليات</Text>
        {transactions.length === 0 ? (
          <Text style={{ textAlign: 'center', color: '#94a3b8', marginTop: 20 }}>لا توجد عمليات مالية بعد</Text>
        ) : (
          transactions.map((tx: any) => (
            <View key={tx.id} style={styles.txCard}>
              <View style={styles.txInfo}>
                <Text style={styles.txTitle}>
                  {tx.type === 'credit' ? 'أرباح توصيل' : 
                   tx.type === 'debit' ? 'خصم أو تسوية' : 
                   tx.type === 'cod_collected' ? 'تحصيل نقدي من العميل' : 
                   tx.type === 'cod_settled' ? 'توريد النقدية' : tx.type}
                </Text>
                <Text style={{color: "#a1a1aa", fontSize: 12, textAlign: "left"}}>
                  {new Date(tx.createdAt).toLocaleString('ar-EG', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                </Text>
              </View>
              <Text style={[styles.txAmount, { color: tx.type === 'debit' || tx.type === 'cod_settled' ? "#ef4444" : "#22c55e" }]}>
                {tx.type === 'debit' || tx.type === 'cod_settled' ? "-" : "+"}{Math.abs(Number(tx.amount))} ج.م
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#09090b" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#09090b" },
  scrollContent: { padding: 15 },
  balanceCard: {
    backgroundColor: "#18181b",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#27272a"
  },
  balanceTitle: { color: "#a1a1aa", fontSize: 14, marginBottom: 5 },
  balanceAmount: { color: "#fbbf24", fontSize: 36, fontWeight: "900", marginBottom: 15 },
  row: { flexDirection: "row", justifyContent: "space-around", width: "100%", borderTopWidth: 1, borderTopColor: "#27272a", paddingTop: 15 },
  subBalance: { alignItems: "center" },
  subBalanceTitle: { color: "#a1a1aa", fontSize: 12, marginBottom: 4 },
  subBalanceAmount: { color: "#fafafa", fontSize: 16, fontWeight: "bold" },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 15, color: "#fafafa" },
  txCard: {
    backgroundColor: "#18181b",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#27272a"
  },
  txInfo: { flex: 1 },
  txTitle: { fontWeight: "bold", fontSize: 14, color: "#fafafa", marginBottom: 4 },
  txAmount: { fontWeight: "bold", fontSize: 16 },
});
