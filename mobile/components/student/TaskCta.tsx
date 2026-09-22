import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, Pressable } from 'react-native';
import { Text } from '../Text';

type Tone = 'accent' | 'success' | 'warning';

const TONE_HEX: Record<Exclude<Tone, 'accent'>, string> = {
  success: '#1f9d63',
  warning: '#ff5f55',
};

type TaskCtaProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  tone?: Tone;
  accentHex?: string;
  showArrow?: boolean;
};

export function TaskCta({
  label,
  onPress,
  disabled = false,
  loading = false,
  tone = 'accent',
  accentHex = '#142284',
  showArrow = false,
}: TaskCtaProps) {
  const bg = tone === 'accent' ? accentHex : TONE_HEX[tone];
  const muted = disabled && !loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className="flex-row items-center justify-center rounded-2xl active:opacity-85"
      style={{
        height: 56,
        gap: 8,
        backgroundColor: bg,
        opacity: muted ? 0.4 : 1,
        shadowColor: bg,
        shadowOpacity: muted ? 0 : 0.28,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
        elevation: muted ? 0 : 4,
      }}
    >
      {loading ? (
        <ActivityIndicator color="#fefefe" />
      ) : (
        <>
          <Text className="text-infiro-white font-manrope-semibold text-base">{label}</Text>
          {showArrow ? <Ionicons name="arrow-forward" size={18} color="#fefefe" /> : null}
        </>
      )}
    </Pressable>
  );
}
