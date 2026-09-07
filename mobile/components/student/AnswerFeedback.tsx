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
        style={{ gap: 10, padding: 14, borderRadius: 16, backgroundColor: 'rgba(31,157,99,0.12)' }}
      >
        <Ionicons name="checkmark-circle" size={22} color={GREEN} />
        <Text className="font-manrope-extrabold text-[15px]" style={{ color: GREEN }}>
          Dobrze!
        </Text>
      </View>
    );
  }

  if (props.kind === 'retry') {
    return (
      <View style={{ padding: 14, borderRadius: 16, backgroundColor: 'rgba(255,95,85,0.1)' }}>
        <Text className="font-manrope-extrabold text-[15px]" style={{ color: CORAL }}>
          Spróbuj jeszcze raz
        </Text>
        <Text className="font-manrope-semibold text-xs mt-1" style={{ color: '#8b93bd' }}>
          {props.attemptsLeft === 1 ? 'Została ostatnia próba' : `Zostały ${props.attemptsLeft} próby`}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ padding: 14, borderRadius: 16, backgroundColor: 'rgba(20,34,132,0.06)' }}>
      <Text
        className="font-manrope-bold text-xs uppercase"
        style={{ color: '#8b93bd', letterSpacing: 1 }}
      >
        Poprawna odpowiedź
      </Text>
      <MathText className="font-manrope-extrabold text-[16px]" color={NAVY}>
        {props.solution}
      </MathText>
    </View>
  );
}
