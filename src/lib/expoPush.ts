type PushData = Record<string, string | number | boolean | null>;

interface PushNotificationInput {
  expoPushToken: string;
  title: string;
  body: string;
  data?: PushData;
  channelId?: string;
}

export async function sendPushNotifications(messages: PushNotificationInput[]) {
  if (messages.length === 0) return;

  const payload = messages.map(({ expoPushToken, title, body, data = {}, channelId = "default" }) => ({
    to: expoPushToken,
    sound: "default" as const,
    title,
    body,
    data,
    channelId,
    priority: "high" as const,
  }));

  try {
    for (let index = 0; index < payload.length; index += 100) {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload.slice(index, index + 100)),
        signal: AbortSignal.timeout(5_000),
      });
      if (!response.ok) console.error('Expo push request failed:', response.status);
    }
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}

export async function sendPushNotification(expoPushToken: string, title: string, body: string, data: PushData = {}) {
  return sendPushNotifications([{ expoPushToken, title, body, data }]);
}
