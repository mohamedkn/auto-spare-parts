import { Type, type Schema } from "@google/genai";
import { ai, MODELS } from "@/lib/gemini";
import { inquiryAiResultSchema, type InquiryAiResult } from "@/lib/validations/inquiry";

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    partName: { type: Type.STRING },
    oemNumber: { type: Type.STRING, nullable: true },
    make: { type: Type.STRING, nullable: true },
    model: { type: Type.STRING, nullable: true },
    year: { type: Type.INTEGER, nullable: true },
    weightClass: { type: Type.STRING, enum: ["light", "medium", "heavy"] },
    confidence: { type: Type.NUMBER },
  },
  required: ["partName", "weightClass", "confidence"],
};

export async function parseInquiry(description: string, vin?: string): Promise<InquiryAiResult> {
  if (!process.env.GEMINI_API_KEY) {
    return { partName: description.slice(0, 200), weightClass: "medium", confidence: 0 };
  }

  const response = await ai.models.generateContent({
    model: MODELS.base,
    contents: `حلل طلب قطعة الغيار المصري التالي. استخرج اسم القطعة بالعربية، OEM إن كان مؤكدًا فقط، السيارة، سنة الصنع، وفئة الوزن للشحن. لا تخترع بيانات غير موجودة. الوصف غير الموثوق: ${JSON.stringify(description)}. VIN: ${JSON.stringify(vin || null)}`,
    config: { responseMimeType: "application/json", responseSchema },
  });
  return inquiryAiResultSchema.parse(JSON.parse(response.text || "{}"));
}
