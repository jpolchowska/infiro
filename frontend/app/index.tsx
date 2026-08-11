import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // TODO: integrate with Keycloak once auth service is ready
    console.log('login attempt', { login, password });
  };

  return (
    <SafeAreaView className="flex-1 bg-infiro-navy">
      <View className="flex-1 justify-center px-6">
        <Text className="text-infiro-white text-4xl font-extrabold leading-tight mb-3">
          Cześć!{'\n'}Zaloguj się.
        </Text>
        <Text className="text-infiro-white/70 text-base mb-10">
          Podaj login i hasło, aby przejść do nauki.
        </Text>

        <View className="bg-infiro-white/10 rounded-2xl px-4 pt-3 pb-3 mb-4">
          <Text className="text-infiro-white/50 text-xs font-semibold tracking-wider mb-1">
            LOGIN
          </Text>
          <TextInput
            value={login}
            onChangeText={setLogin}
            autoCapitalize="none"
            underlineColorAndroid="transparent"
            className="text-infiro-white text-lg p-0"
          />
        </View>

        <View className="bg-infiro-white/10 rounded-2xl px-4 pt-3 pb-3 mb-8">
          <Text className="text-infiro-white/50 text-xs font-semibold tracking-wider mb-1">
            HASŁO
          </Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            underlineColorAndroid="transparent"
            className="text-infiro-white text-lg p-0"
          />
        </View>

        <Pressable
          onPress={handleLogin}
          className="bg-infiro-coral rounded-2xl py-4 items-center active:opacity-80"
          style={{
            shadowColor: '#ff5f55',
            shadowOpacity: 0.5,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 8 },
            elevation: 8,
          }}
        >
          <Text className="text-infiro-white font-semibold text-base">Zaloguj się</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
