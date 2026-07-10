import { DriverRegisterForm } from "@/components/auth/DriverRegisterForm";

export const metadata = {
  title: "انضم ككابتن توصيل | زي ماركت بليس",
  description: "سجل الآن ككابتن توصيل في زي ماركت بليس وابدأ رحلتك معنا",
};

export default function DriverRegisterPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">انضم ككابتن توصيل 🚚</h1>
          <p className="text-slate-600">
            سجل الآن وابدأ في استلام طلبات التوصيل وزيادة دخلك
          </p>
        </div>
        
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
          <DriverRegisterForm />
        </div>
      </div>
    </div>
  );
}
