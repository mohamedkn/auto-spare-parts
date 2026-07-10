"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Zap, ShieldCheck, Wrench } from "lucide-react";

export function HeroSlider() {
  return (
    <div className="relative overflow-hidden bg-zinc-950 h-[400px] sm:h-[500px] flex items-center border-b border-zinc-800">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 z-0 opacity-20">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/30 rounded-full blur-[120px] mix-blend-screen translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[150px] mix-blend-screen -translate-x-1/3 translate-y-1/3"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-sm font-medium text-zinc-300 mb-6">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            المنصة الأذكى لقطع غيار السيارات
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-black text-white mb-6 leading-[1.2]">
            ابحث، طابق، وركّب <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-200">
              بكل ثقة وسرعة.
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-zinc-400 mb-8 max-w-2xl leading-relaxed">
            محرك بحث متطور يضمن لك الحصول على القطعة المتوافقة مع سيارتك 100% من أفضل الوكلاء المعتمدين.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Link 
              href="/products" 
              className="px-8 py-3.5 rounded-xl bg-primary text-black font-bold hover:bg-amber-400 transition-all flex items-center gap-2 group"
            >
              تصفح الكتالوج
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            </Link>
            
            <div className="hidden sm:flex items-center gap-6 px-6">
              <div className="flex items-center gap-2 text-zinc-300 text-sm font-medium">
                <ShieldCheck size={20} className="text-primary" />
                قطع أصلية ومضمونة
              </div>
              <div className="flex items-center gap-2 text-zinc-300 text-sm font-medium">
                <Zap size={20} className="text-primary" />
                شحن سريع
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Abstract Car Silhouette / Shape on the left */}
      <div className="hidden lg:block absolute left-10 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none">
        <Wrench size={400} className="text-primary -rotate-45" />
      </div>
    </div>
  );
}

