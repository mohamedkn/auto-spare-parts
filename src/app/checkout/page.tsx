"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  CreditCard,
  CheckCircle,
  Loader2,
  Package,
  ChevronLeft,
  Banknote,
  Smartphone,
  X,
} from "lucide-react";
import { DELIVERY_FEE_EGP } from "@/lib/delivery/pricing";

interface CartItem {
  id: string;
  quantity: number;
  itemTotal: string;
  product: {
    id: string;
    name: string;
    price: string;
    images: { url: string }[];
    vendor: { id: string; storeName: string };
  };
}

interface CartData {
  items: CartItem[];
  totalItems: number;
  totalPrice: string;
}

interface Address {
  id: string;
  fullName: string;
  phone: string;
  streetAddress: string;
  city: string;
  governorate: string;
  isDefault: boolean;
}

const PAYMENT_METHODS = [
  { id: "cash_on_delivery", label: "الدفع عند الاستلام", icon: Banknote, desc: "ادفع نقداً عند وصول طلبك" },
  { id: "paymob", label: "البطاقة الائتمانية / المحافظ", icon: CreditCard, desc: "الدفع الآمن عبر Paymob" },
  { id: "instapay", label: "InstaPay", icon: Smartphone, desc: "حول مبلغ الطلب عبر InstaPay وأرسل الإيصال" },
];



export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartData | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("cash_on_delivery");
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [paymobIframeUrl, setPaymobIframeUrl] = useState<string | null>(null);
  const deliveryFee = cart
    ? new Set(cart.items.map((item) => item.product.vendor.id)).size * DELIVERY_FEE_EGP
    : 0;

  // Manual address fields (if no saved address)
  const [manualAddress, setManualAddress] = useState({
    fullName: "",
    phone: "",
    addressLine1: "",
    city: "",
    governorate: "",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/cart").then((r) => {
        if (r.status === 401) { router.push("/login"); throw new Error("Unauthorized"); }
        return r.json();
      }),
      fetch("/api/addresses").then((r) => r.json()),
    ]).then(([cartRes, addrRes]) => {
      if (cartRes?.data) setCart(cartRes.data);
      if (addrRes?.data) {
        setAddresses(addrRes.data);
        const def = addrRes.data.find((a: Address) => a.isDefault);
        if (def) setSelectedAddressId(def.id);
      }
    }).finally(() => setLoading(false));
  }, [router]);

  async function handlePlaceOrder() {
    setError("");

    // Validate address
    const hasAddress = selectedAddressId || (manualAddress.fullName && manualAddress.phone && manualAddress.addressLine1 && manualAddress.city && manualAddress.governorate);
    if (!hasAddress) {
      setError("يرجى اختيار أو إدخال عنوان الشحن");
      return;
    }

    setPlacing(true);
    try {
      const body: Record<string, unknown> = {
        paymentMethod,
      };

      if (selectedAddressId) {
        body.addressId = selectedAddressId;
      } else {
        body.shippingAddress = {
          fullName: manualAddress.fullName,
          phone: manualAddress.phone,
          addressLine1: manualAddress.addressLine1,
          city: manualAddress.city,
          governorate: manualAddress.governorate,
        };
      }

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "idempotency-key": `checkout-${Date.now()}`,
        },
        body: JSON.stringify(body),
      });

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "حدث خطأ أثناء إتمام الطلب");
        return;
      }

      if (json.data?.paymentUrl) {
        setPaymobIframeUrl(json.data.paymentUrl);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/orders"), 2000);
    } catch {
      setError("تعذّر الاتصال بالخادم. حاول مرة أخرى.");
    } finally {
      setPlacing(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-primary-500" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4">
        <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
          <CheckCircle size={40} className="text-emerald-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">تم تأكيد طلبك! 🎉</h1>
        <p className="text-slate-500">سيتم توجيهك إلى صفحة طلباتك خلال ثوانٍ...</p>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Package size={48} className="text-slate-300" />
        <p className="text-slate-500">سلتك فارغة</p>
        <Link href="/products" className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold px-6 py-3 rounded-full">
          تسوق الآن
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-6xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-500 mb-8">
        <Link href="/cart" className="hover:text-primary transition-colors flex items-center gap-1">
          <ChevronLeft size={14} />
          السلة
        </Link>
        <span>←</span>
        <span className="text-slate-900 dark:text-white font-semibold">إتمام الطلب</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Address + Payment */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Shipping Address */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary-50 dark:bg-primary-900/30 text-primary">
                <MapPin size={20} />
              </div>
              <h2 className="font-bold text-lg text-slate-900 dark:text-white">عنوان الشحن</h2>
            </div>

            <div className="p-6">
              {addresses.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  {addresses.map((addr) => (
                    <button
                      key={addr.id}
                      type="button"
                      onClick={() => setSelectedAddressId(addr.id)}
                      className={`text-right p-4 rounded-xl border-2 transition-all duration-200 ${
                        selectedAddressId === addr.id
                          ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                          : "border-slate-200 dark:border-slate-700 hover:border-primary-300"
                      }`}
                    >
                      <p className="font-bold text-slate-900 dark:text-white text-sm">{addr.fullName}</p>
                      <p className="text-xs text-slate-500 mt-1">{addr.streetAddress}</p>
                      <p className="text-xs text-slate-500">{addr.city}, {addr.governorate}</p>
                      <p className="text-xs text-slate-500 mt-1">{addr.phone}</p>
                      {addr.isDefault && (
                        <span className="text-xs bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-400 px-2 py-0.5 rounded-full mt-2 inline-block">
                          الافتراضي
                        </span>
                      )}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setSelectedAddressId(null)}
                    className={`text-center p-4 rounded-xl border-2 border-dashed transition-all ${
                      selectedAddressId === null
                        ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                        : "border-slate-200 dark:border-slate-700 hover:border-primary-300"
                    } text-slate-500 hover:text-primary`}
                  >
                    + عنوان جديد
                  </button>
                </div>
              ) : null}

              {/* Manual address form (shown when no saved address selected) */}
              {!selectedAddressId && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                  {[
                    { name: "fullName", label: "الاسم بالكامل", span: true },
                    { name: "phone", label: "رقم الهاتف", span: false },
                    { name: "addressLine1", label: "العنوان التفصيلي", span: true },
                    { name: "city", label: "المدينة", span: false },
                    { name: "governorate", label: "المحافظة", span: false },
                  ].map(({ name, label, span }) => (
                    <div key={name} className={`flex flex-col gap-1 ${span ? "sm:col-span-2" : ""}`}>
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</label>
                      <input
                        type="text"
                        value={manualAddress[name as keyof typeof manualAddress]}
                        onChange={(e) => setManualAddress((prev) => ({ ...prev, [name]: e.target.value }))}
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all text-sm"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary-50 dark:bg-primary-900/30 text-primary">
                <CreditCard size={20} />
              </div>
              <h2 className="font-bold text-lg text-slate-900 dark:text-white">طريقة الدفع</h2>
            </div>

            <div className="p-6 flex flex-col gap-3">
              {PAYMENT_METHODS.map(({ id, label, icon: Icon, desc }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPaymentMethod(id)}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-right ${
                    paymentMethod === id
                      ? "border-primary bg-primary/10 dark:bg-primary/20"
                      : "border-slate-200 dark:border-slate-700 hover:border-primary/50"
                  }`}
                >
                  <div className={`p-3 rounded-xl ${paymentMethod === id ? "bg-primary/20 dark:bg-primary/40 text-primary" : "bg-slate-100 dark:bg-slate-800 text-slate-500"} transition-colors`}>
                    <Icon size={22} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-900 dark:text-white">{label}</p>
                    <p className="text-sm text-slate-500 mt-0.5">{desc}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${paymentMethod === id ? "border-primary" : "border-slate-300 dark:border-slate-600"}`}>
                    {paymentMethod === id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden sticky top-20">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800">
              <h2 className="font-bold text-lg text-slate-900 dark:text-white">ملخص الطلب</h2>
            </div>

            {/* Items */}
            <div className="p-4 space-y-3 max-h-64 overflow-y-auto border-b border-slate-200 dark:border-slate-800">
              {cart.items.map((item) => (
                <div key={item.id} className="flex gap-3 items-center">
                  <div className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
                    {item.product.images[0] ? (
                      <Image src={item.product.images[0].url} alt={item.product.name} fill sizes="48px" className="object-cover" />
                    ) : (
                      <Package className="absolute inset-0 m-auto text-slate-300" size={20} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">{item.product.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">×{item.quantity}</p>
                  </div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white flex-shrink-0">
                    {Number(item.itemTotal).toLocaleString("ar-EG")} ج.م
                  </p>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="p-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">المجموع الجزئي</span>
                <span className="font-semibold">{Number(cart.totalPrice).toLocaleString("ar-EG")} ج.م</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">الشحن</span>
                <span className="font-semibold">{deliveryFee.toLocaleString("ar-EG")} ج.م</span>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-700 pt-3 flex justify-between">
                <span className="font-bold text-lg text-slate-900 dark:text-white">الإجمالي</span>
                <span className="font-bold text-xl text-primary dark:text-primary-400">
                  {(Number(cart.totalPrice) + deliveryFee).toLocaleString("ar-EG")} ج.م
                </span>
              </div>
            </div>

            {error && (
              <div className="mx-6 mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400">
                {error}
              </div>
            )}

            <div className="px-6 pb-6">
              <button
                onClick={handlePlaceOrder}
                disabled={placing}
                className="w-full flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-slate-900 font-bold py-4 rounded-full transition-colors shadow-md hover:shadow-lg text-base disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {placing ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>جاري تأكيد الطلب...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} />
                    <span>تأكيد الطلب</span>
                  </>
                )}
              </button>
              <p className="text-center text-xs text-slate-400 mt-3">
                بالضغط توافق على شروط الاستخدام وسياسة الإرجاع
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Paymob Iframe Modal */}
      {paymobIframeUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-[450px] h-[650px] max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">الدفع الآمن عبر Paymob</h3>
              <button
                onClick={() => {
                  setPaymobIframeUrl(null);
                  router.push("/orders"); // Order is already created, redirect to orders
                }}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 w-full bg-slate-50 dark:bg-slate-900">
              <iframe
                src={paymobIframeUrl}
                className="w-full h-full border-0"
                title="Paymob Secure Payment"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
