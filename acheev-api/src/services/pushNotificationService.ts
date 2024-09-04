import { UserModel } from "../models/userModel";
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { compact, flatten } from 'lodash';

const expo = new Expo();

export class PushNotificationService {

  public static pushNotifyUserIds = async (userIds: string[], body?: string, title?: string, data?: Record<string, any>) => {
    try {
      const users = await UserModel.query().findByIds(userIds);
      return PushNotificationService.pushNotify(users, body, title, data)
    } catch (err) {
      console.error('[PushNotification]', err);
    }
  }

  public static pushNotify = async (users: UserModel[], body?: string, title?: string, data?: Record<string, any>) => {
    const pushTokens = compact(
      flatten(
        users.map(user => [user.iosPushToken, user.androidPushToken])
      )
    )
      .filter(Expo.isExpoPushToken);


    if (pushTokens.length === 0) {
      return;
    }

    return PushNotificationService.pushNotifyTokens(pushTokens, body, title, data);
  }

  public static pushNotifyTokens = async (pushTokens: string[], body?: string, title?: string, data?: Record<string, any>) => {
    try {
      const pushMessage: ExpoPushMessage = {
        to: pushTokens,
        sound: 'default',
        title,
        body,
        data: { title, body, ...data },
      };

      const chunks = expo.chunkPushNotifications([pushMessage]);

      let ticketChunks: ExpoPushTicket[] = [];
      for (const chunk of chunks) {
        try {
          const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          console.log('[PushNotification]', ticketChunk);
          ticketChunks = ticketChunks.concat(ticketChunks);
        } catch (error) {
          console.error('push notification error', error);
        }
      }
    } catch (err) {
      console.error('[PushNotification]', err)
    }
  }
}