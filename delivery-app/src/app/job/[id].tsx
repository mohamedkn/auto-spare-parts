import { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView, TextInput, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import apiClient from "../../api/client";

export default function ActiveJobScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [pickupOtp, setPickupOtp] = useState("");
  const [deliveryOtp, setDeliveryOtp] = useState("");
  const [failedReason, setFailedReason] = useState("");

  const fetchJobDetails = useCallback(async () => {
    try {
      const res = await apiClient.get(`/driver/jobs/${id}`);
      const data = res.data;
      if (data.success) {
        setJob(data.data.job);
      } else {
        Alert.alert("خطأ", data.error?.message || "لم نتمكن من جلب تفاصيل الطلب");
      }
    } catch (error) {
      Alert.alert("خطأ", "حدث خطأ في الاتصال");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchJobDetails();
  }, [fetchJobDetails]);

  const verifyPickupOtp = async () => {
    if (!pickupOtp || pickupOtp.length < 4) {
      Alert.alert("تنبيه", "الرجاء إدخال رمز التحقق بشكل صحيح");
      return;
    }
    setActionLoading(true);
    try {
      const res = await apiClient.post(`/driver/jobs/${id}/verify-pickup-otp`, { otp: pickupOtp });
      const data = res.data;
      if (data.success) {
        Alert.alert("نجاح", "تم تأكيد الاستلام بنجاح");
        setJob(data.data.job);
      } else {
        Alert.alert("عفواً", data.error?.message || "رمز التحقق غير صحيح");
      }
    } catch (error: any) {
      Alert.alert("خطأ", error.response?.data?.error?.message || "حدث خطأ في الاتصال");
    } finally {
      setActionLoading(false);
    }
  };

  const verifyDeliveryOtp = async () => {
    if (!deliveryOtp || deliveryOtp.length < 4) {
      Alert.alert("تنبيه", "الرجاء إدخال رمز التحقق بشكل صحيح");
      return;
    }
    setActionLoading(true);
    try {
      const res = await apiClient.post(`/driver/jobs/${id}/verify-delivery-otp`, { otp: deliveryOtp });
      const data = res.data;
      if (data.success) {
        Alert.alert("نجاح", "تم تأكيد التسليم بنجاح");
        router.replace("/");
      } else {
        Alert.alert("عفواً", typeof data.error === 'string' ? data.error : (data.error?.message || "رمز التحقق غير صحيح"));
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.error;
      Alert.alert("خطأ", typeof errorMsg === 'string' ? errorMsg : (errorMsg?.message || "حدث خطأ في الاتصال"));
    } finally {
      setActionLoading(false);
    }
  };

  const reportFailedDelivery = async () => {
    if (!failedReason) {
      Alert.alert("تنبيه", "الرجاء كتابة سبب فشل التوصيل");
      return;
    }
    setActionLoading(true);
    try {
      const res = await apiClient.post(`/driver/jobs/${id}/report-failed-delivery`, { reason: failedReason });
      const data = res.data;
      if (data.success) {
        Alert.alert("نجاح", "تم تسجيل فشل التوصيل");
        router.replace("/");
      } else {
        Alert.alert("عفواً", data.error?.message || "حدث خطأ أثناء التسجيل");
      }
    } catch (error: any) {
      Alert.alert("خطأ", error.response?.data?.error?.message || "حدث خطأ في الاتصال");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.center}>
        <Text style={{color: "#a1a1aa", fontSize: 16}}>لا توجد بيانات للطلب</Text>
        <TouchableOpacity onPress={() => router.replace("/")} style={{marginTop: 20}}>
          <Text style={{color: "#fbbf24", fontSize: 16, fontWeight: "bold"}}>العودة للرئيسية</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>الرحلة الحالية</Text>
      <Text style={styles.subtitle}>رقم الطلب: {id}</Text>
      
      {job.isCod && (
        <View style={styles.codBadge}>
          <Text style={styles.codText}>دفع عند الاستلام: {job.codAmountToCollect} ج.م</Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>تفاصيل الاستلام (التاجر)</Text>
        <Text style={styles.cardText}>العنوان: {job.subOrder?.vendor?.address || job.pickupAddress}</Text>
        {job.subOrder?.vendor?.storeName && (
           <Text style={styles.cardText}>المتجر: {job.subOrder.vendor.storeName} ({job.subOrder.vendor.phone})</Text>
        )}
        
        {job.status === "accepted" ? (
          <View>
            <TextInput
              style={styles.input}
              placeholder="أدخل رمز الاستلام (OTP)"
              placeholderTextColor="#a1a1aa"
              keyboardType="number-pad"
              value={pickupOtp}
              onChangeText={setPickupOtp}
            />
            <TouchableOpacity 
              style={[styles.button, actionLoading && {opacity: 0.7}]} 
              onPress={verifyPickupOtp}
              disabled={actionLoading}
            >
              <Text style={styles.buttonText}>{actionLoading ? "جاري التحقق..." : "تأكيد استلام الشحنة من التاجر"}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, { backgroundColor: "#ef4444", marginTop: 15 }, actionLoading && {opacity: 0.7}]}
              onPress={() => {
                const handleReject = async () => {
                  setActionLoading(true);
                  try {
                    const res = await apiClient.post(`/driver/jobs/${id}/reject`);
                    if (res.data.success) {
                      Alert.alert("نجاح", "تم إلغاء الطلب بنجاح");
                      router.replace("/");
                    } else {
                      Alert.alert("عفواً", res.data.error?.message || "حدث خطأ أثناء الإلغاء");
                    }
                  } catch (error: any) {
                    Alert.alert("خطأ", error.response?.data?.error?.message || "حدث خطأ في الاتصال");
                  } finally {
                    setActionLoading(false);
                  }
                };

                if (Platform.OS === 'web') {
                  const confirmed = window.confirm("هل أنت متأكد أنك تريد إلغاء قبول هذا الطلب؟ سيتم إرجاعه للمناديب الآخرين.");
                  if (confirmed) {
                    handleReject();
                  }
                } else {
                  Alert.alert(
                    "تأكيد الرفض",
                    "هل أنت متأكد أنك تريد إلغاء قبول هذا الطلب؟ سيتم إرجاعه للمناديب الآخرين.",
                    [
                      { text: "تراجع", style: "cancel" },
                      { text: "نعم، إلغاء", style: "destructive", onPress: handleReject }
                    ]
                  );
                }
              }}
              disabled={actionLoading}
            >
              <Text style={[styles.buttonText, { color: "white" }]}>رفض / إلغاء الطلب</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.button, {backgroundColor: "#27272a"}]}>
            <Text style={[styles.buttonText, { color: "#a1a1aa" }]}>تم الاستلام</Text>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>تفاصيل التسليم (العميل)</Text>
        <Text style={styles.cardText}>العميل: {job.subOrder?.order?.shippingAddress?.fullName || "غير محدد"} - {job.subOrder?.order?.shippingAddress?.phone || "لا يوجد رقم"}</Text>
        <Text style={styles.cardText}>العنوان: {job.subOrder?.order?.shippingAddress?.streetAddress || job.dropoffAddress}{job.subOrder?.order?.shippingAddress?.city ? `، ${job.subOrder.order.shippingAddress.city}` : ''}</Text>
        
        {job.status === "picked_up" || job.status === "on_the_way" ? (
           <View>
            <TextInput
              style={styles.input}
              placeholder="أدخل رمز التسليم للعميل (OTP)"
              placeholderTextColor="#a1a1aa"
              keyboardType="number-pad"
              value={deliveryOtp}
              onChangeText={setDeliveryOtp}
            />
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: "#16a34a", marginBottom: 10 }, actionLoading && {opacity: 0.7}]}
              onPress={verifyDeliveryOtp}
              disabled={actionLoading}
            >
              <Text style={styles.buttonText}>{actionLoading ? "جاري التحقق..." : "تم تسليم الشحنة للعميل"}</Text>
            </TouchableOpacity>

            <View style={{ height: 1, backgroundColor: "#27272a", marginVertical: 15 }} />
            
            <Text style={{ textAlign: "right", marginBottom: 5, color: "#a1a1aa" }}>في حال تعذر التسليم:</Text>
            <TextInput
              style={styles.input}
              placeholder="اكتب سبب فشل التوصيل..."
              placeholderTextColor="#a1a1aa"
              value={failedReason}
              onChangeText={setFailedReason}
            />
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: "#ef4444" }, actionLoading && {opacity: 0.7}]}
              onPress={reportFailedDelivery}
              disabled={actionLoading}
            >
              <Text style={styles.buttonText}>{actionLoading ? "جاري التسجيل..." : "تسجيل فشل التوصيل"}</Text>
            </TouchableOpacity>
           </View>
        ) : job.status === "delivered" ? (
           <View style={[styles.button, {backgroundColor: "#94a3b8"}]}>
            <Text style={styles.buttonText}>اكتمل الطلب</Text>
          </View>
        ) : job.status === "failed_delivery" ? (
          <View style={[styles.button, {backgroundColor: "#ef4444"}]}>
            <Text style={styles.buttonText}>تم إلغاء التوصيل</Text>
          </View>
        ) : (
           <Text style={{textAlign: "center", color: "#64748b"}}>يجب استلام الشحنة من التاجر أولاً</Text>
        )}
      </View>

      <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/(tabs)')}>
        <Text style={styles.backButtonText}>العودة للرئيسية</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#09090b", padding: 15 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#09090b" },
  title: { fontSize: 22, fontWeight: "bold", textAlign: "center", marginBottom: 10, color: "#fafafa" },
  subtitle: { fontSize: 16, textAlign: "center", color: "#a1a1aa", marginBottom: 20 },
  codBadge: { backgroundColor: "#fbbf24", padding: 15, borderRadius: 8, marginBottom: 20 },
  codText: { color: "black", fontWeight: "bold", textAlign: "center", fontSize: 16 },
  card: { backgroundColor: "#18181b", padding: 20, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: "#27272a" },
  cardTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10, color: "#fafafa" },
  cardText: { fontSize: 16, marginBottom: 15, color: "#a1a1aa", lineHeight: 24 },
  input: {
    backgroundColor: "#09090b",
    borderWidth: 1,
    borderColor: "#27272a",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    textAlign: "right",
    color: "#fafafa"
  },
  button: {
    backgroundColor: "#fbbf24",
    padding: 15,
    borderRadius: 8,
    alignItems: "center"
  },
  buttonText: { color: "black", fontWeight: "bold", fontSize: 16 },
  backButton: { marginTop: 10, padding: 15, alignItems: "center" },
  backButtonText: { color: "#a1a1aa", fontSize: 16 }
});
