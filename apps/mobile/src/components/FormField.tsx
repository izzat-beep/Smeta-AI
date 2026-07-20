import { View, Text, TextInput, type TextInputProps } from 'react-native';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { colors } from '@/theme/tokens';

interface FormFieldProps<T extends FieldValues> extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  errorText?: string;
}

// RHF Controller bilan boshqariladigan matn maydoni — label + xato matni.
export function FormField<T extends FieldValues>({
  control,
  name,
  label,
  errorText,
  ...inputProps
}: FormFieldProps<T>) {
  return (
    <View className="mb-4">
      <Text className="text-muted text-xs uppercase mb-2">{label}</Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { value, onChange, onBlur } }) => (
          <TextInput
            value={typeof value === 'string' ? value : ''}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholderTextColor={colors.muted}
            className={`rounded-xl border bg-black/20 px-4 py-3 text-white ${
              errorText ? 'border-danger/60' : 'border-border/40'
            }`}
            {...inputProps}
          />
        )}
      />
      {errorText ? <Text className="text-danger text-xs mt-1">{errorText}</Text> : null}
    </View>
  );
}
