import { config } from "dotenv";
config();

const API_KEY = process.env.PAYMOB_API_KEY;
const INTEGRATION_ID_VODAFONE_CASH = process.env.PAYMOB_INTEGRATION_ID_VCASH;
const HMAC_SECRET = process.env.PAYMOB_HMAC_SECRET;

async function testPaymob() {
  console.log("Testing Paymob Configuration...");
  console.log("API Key loaded:", !!API_KEY);
  console.log("Integration ID loaded:", !!INTEGRATION_ID_VODAFONE_CASH);
  
  if (!API_KEY) {
    console.error("Missing PAYMOB_API_KEY");
    return;
  }

  try {
    // 1. Auth Token
    console.log("\n1. Requesting Auth Token...");
    const authRes = await fetch("https://accept.paymob.com/api/auth/tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: API_KEY }),
    });
    const authData = await authRes.json();
    
    if (!authData.token) {
      console.error("Auth Token Failed:", authData);
      return;
    }
    console.log("✅ Auth Token Success!");

    // 2. Register Order
    console.log("\n2. Registering Order...");
    const orderRes = await fetch("https://accept.paymob.com/api/ecommerce/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_token: authData.token,
        delivery_needed: "false",
        amount_cents: "10000", // 100 EGP
        currency: "EGP",
        merchant_order_id: `test_order_${Date.now()}`,
        items: [],
      }),
    });
    const orderData = await orderRes.json();
    
    if (!orderData.id) {
      console.error("Order Registration Failed:", orderData);
      return;
    }
    console.log(`✅ Order Registered! ID: ${orderData.id}`);

    // 3. Payment Key
    console.log("\n3. Requesting Payment Key...");
    const paymentKeyRes = await fetch("https://accept.paymob.com/api/acceptance/payment_keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_token: authData.token,
        amount_cents: "10000",
        expiration: 3600,
        order_id: orderData.id,
        billing_data: {
          first_name: "Test",
          last_name: "User",
          email: "test@example.com",
          phone_number: "01010101010",
          apartment: "NA",
          floor: "NA",
          street: "NA",
          building: "NA",
          shipping_method: "NA",
          postal_code: "NA",
          city: "NA",
          country: "NA",
          state: "NA",
        },
        currency: "EGP",
        integration_id: INTEGRATION_ID_VODAFONE_CASH,
      }),
    });
    const paymentKeyData = await paymentKeyRes.json();
    
    if (!paymentKeyData.token) {
      console.error("Payment Key Failed:", paymentKeyData);
      return;
    }
    console.log(`✅ Payment Key Success!`);
    console.log(`\n🎉 Test completed successfully! All keys are valid.`);
    console.log(`To pay with this key, the user would be redirected to:`);
    console.log(`https://accept.paymob.com/api/acceptance/iframes/dummy?payment_token=${paymentKeyData.token}`);

  } catch (error) {
    console.error("\n❌ Error during testing:", error);
  }
}

testPaymob();
