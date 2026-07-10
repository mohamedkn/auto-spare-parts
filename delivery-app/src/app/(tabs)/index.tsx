import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import apiClient from "../../api/client";
import { useAuthStore } from "../../store/useAuthStore";

let MapView: any;
let Marker: any;
if (Platform.OS !== "web") {
  const Maps = require("react-native-maps");
  MapView = Maps.default;
  Marker = Maps.Marker;
}

type DeliveryJob = {
  id: string;
  version: number;
  pickupLat: number | null;
  pickupLng: number | null;
  deliveryFee: number;
  distanceKm: number | null;
  locationPending?: boolean;
  subOrder?: { vendor?: { storeName?: string; address?: string } };
};

const validCoordinate = (value: unknown) => typeof value === "number" && Number.isFinite(value);

export default function DriverMapScreen() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const latestLocation = useRef<Location.LocationObject | null>(null);
  const [jobs, setJobs] = useState<DeliveryJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [driverStatus, setDriverStatus] = useState<"online" | "offline">("offline");
  const [statusLoading, setStatusLoading] = useState(false);
  const driverStatusRef = useRef<"online" | "offline">("offline");
  const mapsConfigured = Platform.OS !== "android" || Boolean(Constants.expoConfig?.extra?.googleMapsConfigured);

  const fetchJobs = useCallback(async (lat: number, lng: number, silent = false) => {
    if (driverStatusRef.current !== "online") {
      setJobs([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    if (!silent) setRefreshing(true);
    try {
      const response = await apiClient.get(`/driver/jobs/available?lat=${lat}&lng=${lng}`);
      const nextJobs = response.data?.data?.jobs || [];
      setJobs(nextJobs);
      setErrorMsg(null);
      setLastUpdated(new Date());
    } catch (error: any) {
      setErrorMsg(error.response?.data?.error || "تعذر تحديث الطلبات القريبة. تحقق من الإنترنت وحاول مرة أخرى.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let subscription: Location.LocationSubscription | undefined;
    let intervalId: ReturnType<typeof setInterval> | undefined;
    let active = true;

    const start = async () => {
      try {
        const statusResponse = await apiClient.get('/driver/status');
        const currentStatus = statusResponse.data?.data?.status === 'online' ? 'online' : 'offline';
        driverStatusRef.current = currentStatus;
        setDriverStatus(currentStatus);

        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== "granted") {
          if (active) {
            setErrorMsg("يلزم السماح بالوصول إلى الموقع لعرض طلبات التوصيل القريبة.");
            setLoading(false);
          }
          return;
        }

        const firstLocation = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (!active) return;
        latestLocation.current = firstLocation;
        setLocation(firstLocation);
        await fetchJobs(firstLocation.coords.latitude, firstLocation.coords.longitude, true);

        subscription = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, timeInterval: 10000, distanceInterval: 25 },
          (nextLocation) => {
            latestLocation.current = nextLocation;
            setLocation(nextLocation);
          },
        );
        intervalId = setInterval(() => {
          const current = latestLocation.current;
          if (current) void fetchJobs(current.coords.latitude, current.coords.longitude, true);
        }, 15000);
      } catch (error: any) {
        if (active) {
          setErrorMsg(error.response?.data?.error || "لم نتمكن من تحديد موقعك. تأكد من تشغيل GPS ثم أعد المحاولة.");
          setLoading(false);
        }
      }
    };

    void start();
    return () => {
      active = false;
      subscription?.remove();
      if (intervalId) clearInterval(intervalId);
    };
  }, [fetchJobs]);

  const refresh = () => {
    const current = latestLocation.current;
    if (current) void fetchJobs(current.coords.latitude, current.coords.longitude);
  };

  const toggleDriverStatus = async () => {
    if (statusLoading) return;
    setStatusLoading(true);
    const nextStatus = driverStatus === "online" ? "offline" : "online";
    try {
      const response = await apiClient.patch('/driver/status', { status: nextStatus });
      const updatedStatus = response.data?.data?.status === 'online' ? 'online' : 'offline';
      driverStatusRef.current = updatedStatus;
      setDriverStatus(updatedStatus);
      setErrorMsg(null);
      if (updatedStatus === "online") refresh();
      else setJobs([]);
    } catch (error: any) {
      Alert.alert("تعذر تغيير الحالة", error.response?.data?.error || "حاول مرة أخرى.");
    } finally {
      setStatusLoading(false);
    }
  };

  const acceptJob = async (job: DeliveryJob) => {
    try {
      const response = await apiClient.post(`/driver/jobs/${job.id}/accept`, { version: job.version });
      if (response.data?.success) {
        router.push(`/job/${job.id}`);
        return;
      }
      Alert.alert("الطلب غير متاح", response.data?.error?.message || "ربما قبله سائق آخر. سيتم تحديث القائمة.");
      refresh();
    } catch (error: any) {
      Alert.alert("تعذر قبول الطلب", error.response?.data?.error || "تحقق من اتصال الإنترنت وحاول مجددًا.");
      refresh();
    }
  };

  if (loading) {
    return <View style={styles.center}><View style={styles.loadingIcon}><Ionicons name="navigate" size={26} color="#fbbf24" /></View><ActivityIndicator size="large" color="#fbbf24" /><Text style={styles.loadingText}>جارٍ تحديد موقعك والبحث عن أقرب الطلبات…</Text></View>;
  }

  return (
    <View style={styles.container}>
      {location && Platform.OS !== "web" && mapsConfigured ? (
        <MapView
          style={StyleSheet.absoluteFill}
          region={{ latitude: location.coords.latitude, longitude: location.coords.longitude, latitudeDelta: 0.055, longitudeDelta: 0.055 }}
          showsUserLocation
          showsMyLocationButton={false}
          toolbarEnabled={false}
        >
          {jobs.filter((job) => validCoordinate(job.pickupLat) && validCoordinate(job.pickupLng)).map((job) => (
            <Marker key={job.id} coordinate={{ latitude: job.pickupLat, longitude: job.pickupLng }} title={job.subOrder?.vendor?.storeName || "نقطة استلام"} description={`${job.deliveryFee} ج.م • ${job.distanceKm} كم`} pinColor="#f59e0b" />
          ))}
        </MapView>
      ) : (
        <View style={styles.mapFallback}>
          <Ionicons name="map-outline" size={54} color="#fbbf24" />
          <Text style={styles.fallbackTitle}>{Platform.OS === "android" && !mapsConfigured ? "الخرائط تحتاج مفتاح Google Maps" : "الخريطة متاحة على تطبيق الهاتف"}</Text>
          <Text style={styles.fallbackText}>{Platform.OS === "android" && !mapsConfigured ? "أضف EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ثم أنشئ نسخة جديدة من التطبيق." : "يمكنك متابعة الطلبات القريبة من القائمة أدناه."}</Text>
        </View>
      )}

      <SafeAreaView pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.iconButton} onPress={() => { logout(); router.replace('/(auth)/login'); }} accessibilityLabel="تسجيل الخروج"><Ionicons name="log-out-outline" size={21} color="#f87171" /></TouchableOpacity>
          <TouchableOpacity style={styles.statusPill} onPress={toggleDriverStatus} disabled={statusLoading} accessibilityLabel="تغيير حالة الاتصال">
            {statusLoading ? <ActivityIndicator size="small" color="#fbbf24" /> : <View style={[styles.liveDot, driverStatus === "offline" && styles.offlineDot]} />}
            <Text style={styles.statusText}>{driverStatus === "online" ? "متصل ويستقبل الطلبات" : "غير متصل — اضغط للبدء"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={refresh} disabled={refreshing} accessibilityLabel="تحديث الطلبات">{refreshing ? <ActivityIndicator size="small" color="#fbbf24" /> : <Ionicons name="refresh" size={21} color="#fbbf24" />}</TouchableOpacity>
        </View>

        {errorMsg && <View style={styles.errorBanner}><Ionicons name="warning-outline" size={18} color="#fca5a5" /><Text style={styles.errorBannerText}>{errorMsg}</Text><TouchableOpacity onPress={refresh}><Text style={styles.retryText}>إعادة</Text></TouchableOpacity></View>}

        <View style={styles.bottomArea}>
          <View style={styles.summaryRow}>
            <View><Text style={styles.summaryTitle}>{driverStatus === "offline" ? "أنت غير متصل حاليًا" : jobs.length ? `${jobs.length} طلب قريب` : "لا توجد طلبات قريبة الآن"}</Text><Text style={styles.summaryMeta}>{driverStatus === "offline" ? "اضغط على حالة الاتصال لبدء استقبال الرحلات" : lastUpdated ? `آخر تحديث ${lastUpdated.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}` : "يتم التحديث تلقائيًا"}</Text></View>
            <View style={styles.countBadge}><Text style={styles.countText}>{jobs.length}</Text></View>
          </View>
          {jobs.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsContent} style={styles.cardsScroller}>
              {jobs.map((job) => (
                <View key={job.id} style={styles.jobCard}>
                  <View style={styles.jobHeader}><View style={styles.storeIcon}><Ionicons name="storefront" size={18} color="#fbbf24" /></View><View style={styles.storeCopy}><Text style={styles.storeName} numberOfLines={1}>{job.subOrder?.vendor?.storeName || "متجر"}</Text><Text style={styles.address} numberOfLines={1}>{job.subOrder?.vendor?.address || "عنوان الاستلام موضح على الخريطة"}</Text></View></View>
                  {job.locationPending && <View style={styles.locationWarning}><Ionicons name="location-outline" size={16} color="#fbbf24" /><Text style={styles.locationWarningText}>موقع الاستلام غير محدد — سيظهر في تفاصيل الرحلة</Text></View>}
                  <View style={styles.metrics}><Text style={styles.metric}><Text style={styles.metricStrong}>{job.deliveryFee}</Text> ج.م</Text><Text style={styles.metric}>{job.distanceKm === null ? "المسافة غير محدة" : <><Text style={styles.metricStrong}>{job.distanceKm}</Text> كم</>}</Text></View>
                  <TouchableOpacity style={styles.acceptButton} onPress={() => acceptJob(job)}><Text style={styles.acceptText}>قبول الرحلة</Text><Ionicons name="arrow-back" size={18} color="#18181b" /></TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          ) : <View style={styles.emptyCard}><Ionicons name="time-outline" size={24} color="#a1a1aa" /><Text style={styles.emptyText}>سنظهر الطلب الجديد هنا فور توفره.</Text></View>}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#09090b" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#09090b", padding: 32 },
  loadingIcon: { width: 58, height: 58, borderRadius: 20, backgroundColor: "#27272a", alignItems: "center", justifyContent: "center", marginBottom: 18 },
  loadingText: { color: "#d4d4d8", marginTop: 16, textAlign: "center", lineHeight: 22 },
  mapFallback: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, alignItems: "center", justifyContent: "center", padding: 32, backgroundColor: "#18181b" },
  fallbackTitle: { color: "white", fontSize: 18, fontWeight: "800", marginTop: 16, textAlign: "center" },
  fallbackText: { color: "#a1a1aa", fontSize: 13, lineHeight: 21, marginTop: 8, textAlign: "center" },
  topBar: { marginHorizontal: 16, marginTop: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  iconButton: { width: 44, height: 44, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(24,24,27,0.94)", borderWidth: 1, borderColor: "#3f3f46" },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 14, height: 40, borderRadius: 20, backgroundColor: "rgba(24,24,27,0.94)", borderWidth: 1, borderColor: "#3f3f46" },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#34d399" },
  offlineDot: { backgroundColor: "#71717a" },
  statusText: { color: "#f4f4f5", fontSize: 12, fontWeight: "700" },
  errorBanner: { margin: 16, padding: 12, borderRadius: 14, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(127,29,29,0.94)", borderWidth: 1, borderColor: "#b91c1c" },
  errorBannerText: { flex: 1, color: "#fee2e2", fontSize: 12, textAlign: "right" },
  retryText: { color: "white", fontWeight: "800", fontSize: 12 },
  bottomArea: { position: "absolute", left: 0, right: 0, bottom: 8 },
  summaryRow: { marginHorizontal: 16, marginBottom: 10, padding: 14, borderRadius: 18, backgroundColor: "rgba(9,9,11,0.94)", borderWidth: 1, borderColor: "#3f3f46", flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between" },
  summaryTitle: { color: "white", fontSize: 15, fontWeight: "800", textAlign: "right" },
  summaryMeta: { color: "#a1a1aa", fontSize: 11, marginTop: 3, textAlign: "right" },
  countBadge: { width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "#fbbf24" },
  countText: { color: "#18181b", fontSize: 16, fontWeight: "900" },
  cardsScroller: { maxHeight: 220 },
  cardsContent: { paddingHorizontal: 16, gap: 10 },
  jobCard: { width: 300, padding: 15, borderRadius: 20, backgroundColor: "#18181b", borderWidth: 1, borderColor: "#3f3f46" },
  jobHeader: { flexDirection: "row-reverse", alignItems: "center", gap: 10 },
  storeIcon: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "#27272a" },
  storeCopy: { flex: 1 },
  storeName: { color: "white", fontSize: 14, fontWeight: "800", textAlign: "right" },
  address: { color: "#a1a1aa", fontSize: 11, marginTop: 3, textAlign: "right" },
  metrics: { flexDirection: "row-reverse", justifyContent: "space-between", marginVertical: 14, paddingVertical: 10, borderTopWidth: 1, borderBottomWidth: 1, borderColor: "#27272a" },
  locationWarning: { marginTop: 12, padding: 9, borderRadius: 10, flexDirection: "row-reverse", alignItems: "center", gap: 6, backgroundColor: "#29220f", borderWidth: 1, borderColor: "#854d0e" },
  locationWarningText: { flex: 1, color: "#fde68a", fontSize: 10, lineHeight: 16, textAlign: "right" },
  metric: { color: "#a1a1aa", fontSize: 12 },
  metricStrong: { color: "#fbbf24", fontWeight: "900", fontSize: 15 },
  acceptButton: { height: 44, borderRadius: 13, backgroundColor: "#fbbf24", flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center" },
  acceptText: { color: "#18181b", fontWeight: "900" },
  emptyCard: { marginHorizontal: 16, padding: 18, borderRadius: 18, flexDirection: "row-reverse", justifyContent: "center", alignItems: "center", gap: 9, backgroundColor: "#18181b", borderWidth: 1, borderColor: "#3f3f46" },
  emptyText: { color: "#a1a1aa", fontSize: 13 },
});
