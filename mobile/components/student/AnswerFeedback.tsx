import Ionicons from '@expo/vector-icons/Ionicons';
import { View } from 'react-native';
import { Text } from '../Text';
import { MathText } from '../MathText';

const GREEN = '#1f9d63';
const CORAL = '#ff5f55';
const NAVY = '#142284';

type AnswerFeedbackProps =
  | { kind: 'correct' }
  | { kind: 'retry'; attemptsLeft: number }
  | { kind: 'revealed'; solution: string };

export function AnswerFeedback(props: AnswerFeedbackProps) {
  if (props.kind === 'correct') {
    return (
      <View
        className="flex-row items-center"
        style={{ gap: 12, padding: 16, borderRadius: 16, backgroundColor: 'rgba(31,157,99,0.1)' }}
      >
        <Ionicons name="checkmark-circle" size={26} color={GREEN} />
        <Text className="font-manrope-extrabold text-[16px]" style={{ color: GREEN }}>
          Dobrze!
        </Text>
      </View>
    );
  }

  if (props.kind === 'retry') {
    return (
      <View
        className="flex-row items-center"
        style={{ gap: 12, padding: 16, borderRadius: 16, backgroundColor: 'rgba(255,95,85,0.1)' }}
      >
        <Ionicons name="refresh-circle" size={26} color={CORAL} />
        <View className="flex-1">
          <Text className="font-manrope-extrabold text-[16px]" style={{ color: CORAL }}>
            Spróbuj jeszcze raz
          </Text>
          <Text className="font-manrope-semibold text-[13px] mt-0.5" style={{ color: '#8b93bd' }}>
            {props.attemptsLeft === 1 ? 'Została ostatnia próba' : `Zostały ${props.attemptsLeft} próby`}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ padding: 16, borderRadius: 16, backgroundColor: 'rgba(20,34,132,0.06)' }}>
      <Text className="font-manrope-bold text-xs uppercase" style={{ color: '#8b93bd', letterSpacing: 1 }}>
        Poprawna odpowiedź
      </Text>
      <View style={{ marginTop: 6 }}>
        <MathText className="font-manrope-extrabold text-[18px] text-infiro-navy" color={NAVY}>
          {props.solution}
        </MathText>
      </View>
    </View>
  );
}
