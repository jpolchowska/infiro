import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import { useEffect } from 'react';
import { Pressable, Text, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

WebBrowser.maybeCompleteAuthSession();

const KEYCLOAK_URL = process.env.EXPO_PUBLIC_KEYCLOAK_URL; 
const REALM = 'matematyka-app';
const CLIENT_ID = 'matematyka-mobile';

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

          console.log('Zalogowano pomyślnie!');
          router.replace('/home');
        } catch (error) {
          console.error('Błąd wymiany kodu na tokeny:', error);
        }
      }
    };

    handleAuthResponse();
  }, [response]);

  return (
    <SafeAreaView className="flex-1 bg-infiro-navy">
      <View className="flex-1 justify-center px-6">
        <Text className="text-infiro-white text-4xl font-extrabold leading-tight mb-6">
          Cześć!
        </Text>

        <Pressable
          onPress={() => promptAsync()}
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
            <Text className="text-infiro-white font-semibold text-base">
              Zaloguj się
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}