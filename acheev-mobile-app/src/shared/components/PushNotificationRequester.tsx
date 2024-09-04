import React, { useContext, useState, useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { isEmpty } from 'lodash';
import { AuthContext } from '../auth/Authentication';
import { ModifyUserInput, useModifyUserMutation } from '../../types/gqlReactTypings.generated.d';
import { isIos, isSimulator } from '../Utilities';

export const PushNotificationRequester: React.FC = () => {
  const [iosPushToken, setIosPushToken] = useState<string>();
  const [androidPushToken, setAndroidPushToken] = useState<string>();
  const { currentUser } = useContext(AuthContext);
  const [modifyUserMutation] = useModifyUserMutation();

  useEffect(() => {
    registerForPushNotificationsAsync().catch(console.error);

    if (isSimulator()) {
      setIosPushToken("wakerTestToken");
    }

    const notificationsSubscription = Notifications.addNotificationResponseReceivedListener(handleNotification);
    return () => notificationsSubscription?.remove();
  }, []);

  useEffect(() => {
    let userInput: ModifyUserInput = {};
    if (isSimulator()) {
      return;
    }
    if (!isEmpty(iosPushToken) && iosPushToken !== currentUser?.iosPushToken) {
      userInput = { ...userInput, iosPushToken };
    }

    if (!isEmpty(androidPushToken) && androidPushToken !== currentUser?.androidPushToken) {
      userInput = { ...userInput, androidPushToken };
    }

    if (Object.keys(userInput).length > 0 && currentUser != null) {
      modifyUserMutation({ variables: { modifyUserInput: userInput } }).catch(err => {
        window.alert(`Failed to update push notification token.  Error: ${err}`)
      });
    }
  }, [iosPushToken, androidPushToken]);

  const registerForPushNotificationsAsync = async () => {
    try {
      let token: string | undefined;
      if (!!Constants.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') {
          // alert('Failed to get push token for push notification!');
          console.info('Failed to get push token for push notification!');
          return;
        }
        token = (await Notifications.getExpoPushTokenAsync()).data;
        console.log("Received token", token);
      } else {
        return console.info('Must use physical device for Push Notifications');
      }

      if (!!isIos()) {
        setIosPushToken(token);
      } else {
        setAndroidPushToken(token);

        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
        });
      }
    } catch (e) {
      console.error("Error in registerForPushNotificationsAsync", e);
    }
  };

  const handleNotification = async (event: Notifications.NotificationResponse) => {
    try {
      const { request } = event.notification;
      const notification = request.content;
      console.info("in handleNotification", request);
      onNotificationClick(notification)

    } catch (e) {
      console.error("Error handling notification in foreground", e);
    }
  };


  const onNotificationClick = (notification: Notifications.NotificationContent) => {
    try {
      console.info("in onNotificationClick");
      const data: {
        switchOrg?: { [key: string]: string };
        navigate?: { [key: string]: string };
        analyticEvent?: { [key: string]: string };
      } = (notification?.data as any) ?? {};


      const { navigate } = data;

      if (navigate != null) {
        // const { root, screen, params = {} } = navigate;

        // if (root) navigation?.navigate(root, { screen, params });
        // else navigation?.navigate(screen, params);
      }
    } catch (e) {
      console.error("Error clicking notification", e);
    }
  };

  return (
    <>

    </>
  );
}
