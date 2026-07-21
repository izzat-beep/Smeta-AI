import { Pressable, Text, ActivityIndicator, type PressableProps } from 'react-native';
import { colors } from '@/theme/tokens';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  title: string;
  loading?: boolean;
  variant?: 'primary' | 'danger' | 'ghost';
}

const VARIANT: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-purple active:bg-purple-dark',
  danger: 'bg-danger/10 border border-danger/40 active:bg-danger/20',
  ghost: 'bg-transparent active:bg-white/5',
};

const TEXT: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'text-white',
  danger: 'text-danger',
  ghost: 'text-muted',
};

export function Button({ title, loading, variant = 'primary', disabled, ...rest }: ButtonProps) {
  return (
    <Pressable
      disabled={loading || disabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!(loading || disabled), busy: !!loading }}
      className={`h-12 flex-row items-center justify-center rounded-xl disabled:opacity-50 ${VARIANT[variant]}`}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.white : colors.muted} />
      ) : (
        <Text className={`font-bold text-base ${TEXT[variant]}`}>{title}</Text>
      )}
    </Pressable>
  );
}
