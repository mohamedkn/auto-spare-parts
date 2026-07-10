import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key');
const FROM_EMAIL = process.env.EMAIL_FROM || 'AutoParts Pro <noreply@example.com>';

export async function sendOrderConfirmationEmail(to: string, orderNumber: string, amount: number) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Order Confirmation - #${orderNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; direction: rtl;">
          <h2>شكراً لطلبك!</h2>
          <p>تم استلام طلبك <strong>#${orderNumber}</strong> بنجاح.</p>
          <p>الإجمالي: <strong>${amount} ج.م</strong></p>
          <p>سنقوم بإعلامك فور شحن الطلب.</p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend email error:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Failed to send order email:', error);
    return { success: false, error };
  }
}

export async function sendVendorApprovalEmail(to: string, storeName: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `تم الموافقة على متجرك "${storeName}"!`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; direction: rtl;">
          <h2>مبروك!</h2>
          <p>تمت الموافقة على متجرك <strong>${storeName}</strong> من قبل الإدارة.</p>
          <p>تقدر دلوقتي تضيف منتجاتك وتبدأ تستقبل طلبات.</p>
          <br />
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/vendor" style="display:inline-block; padding: 10px 20px; background-color: #f97316; color: #fff; text-decoration: none; border-radius: 5px;">انتقل للوحة التحكم</a>
        </div>
      `,
    });

    if (error) {
      console.error('Resend email error:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Failed to send vendor approval email:', error);
    return { success: false, error };
  }
}
