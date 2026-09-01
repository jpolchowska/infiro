import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import { useEffect } from 'react';
import { Pressable, Text, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAccountType } from '../utils/decodeToken';
import { CLIENT_ID, KEYCLOAK_URL, REALM } from '../lib/auth';
import { getMe } from '../lib/student';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const discovery = AuthSession.useAutoDiscovery(`${KEYCLOAK_URL}/realms/${REALM}`);

  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'infiro', 
  });

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: CLIENT_ID,
      redirectUri,
      scopes: ['openid', 'profile', 'email'],
    },
    discovery
  );

useEffect(() => {
  const handleAuthResponse = async () => {
    if (response?.type === 'success' && response.params.code && discovery) {
      try {
        const tokenResult = await AuthSession.exchangeCodeAsync(
          {
            clientId: CLIENT_ID,
            code: response.params.code,
            redirectUri,
            extraParams: {
              code_verifier: request?.codeVerifier || '',
            },
          },
          discovery
        );

        await SecureStore.setItemAsync('access_token', tokenResult.accessToken);
        if (tokenResult.refreshToken) {
          await SecureStore.setItemAsync('refresh_token', tokenResult.refreshToken);
        }

        console.log('Logged in successfully!');
        const accountType = getAccountType(tokenResult.accessToken);

        if (accountType === "Nauczyciel") {
          router.replace('/(teacher)/home');
        } else if (accountType === "Uczeń") {
          let nextRoute: '/(student)/interests' | '/(student)/leveling-test' | '/(student)/home' = '/(student)/home';
          try {
            const me = await getMe();
            if (me.interest === null) {
              nextRoute = '/(student)/interests';
            } else if (!me.levelingTestCompleted) {
              nextRoute = '/(student)/leveling-test';
            }
          } catch (syncError) {
            console.error('Backend sync failed:', syncError);
          }

          router.replace(nextRoute);
        }
      } catch (error) {
        console.error('Token exchange failed:', error);
      }
    }
  };

  handleAuthResponse();
}, [response, discovery, request, redirectUri]);

  return (
    <View className="flex-1 bg-infiro-navy" style={{ overflow: 'hidden' }}>
      {/* --- Dekoracja ekranu logowania (placeholder, bez grafik) ---
          Do usunięcia w całości, jeśli powstanie prawdziwy design / logo. */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -90,
          right: -70,
          width: 240,
          height: 240,
          borderRadius: 999,
          backgroundColor: '#ff5f55',
          opacity: 0.14,
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          bottom: 10,
          left: -100,
          width: 280,
          height: 280,
          borderRadius: 999,
          backgroundColor: '#c873d9',
          opacity: 0.12,
        }}
      />
      {/* --- koniec dekoracji --- */}

      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <View className="flex-1 px-6" style={{ paddingTop: 12, paddingBottom: 20 }}>
          <Text className="text-infiro-white font-extrabold text-[20px]" style={{ letterSpacing: 2 }}>
            infiro
          </Text>

          <View className="flex-1 justify-center">
            <Text className="text-infiro-white font-extrabold text-[40px] leading-[44px] mb-3">
              Cześć!
            </Text>
            <Text style={{ color: '#b6bdec' }} className="font-medium text-[15px] leading-[22px]">
              Matematyka krok po kroku, w Twoim tempie.
            </Text>
          </View>

          <Pressable
            onPress={() => promptAsync({ preferEphemeralSession: true })}
            disabled={!request}
            className="bg-infiro-coral rounded-2xl py-4 items-center active:opacity-80"
            style={{
              shadowColor: '#ff5f55',
              shadowOpacity: 0.5,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 8 },
              elevation: 8,
            }}
          >
            {!request ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-infiro-white font-semibold text-base">Zaloguj się</Text>
            )}
          </Pressable>
          <Text style={{ color: '#8f9adf' }} className="font-medium text-[13px] text-center mt-3">
            Zaloguj się otrzymanym kontem
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}