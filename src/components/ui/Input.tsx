import { TextInput, View, type TextInputProps } from 'react-native';
import { Text } from './Text';

interface InputProps extends TextInputProps {
  label?: string;
  hint?: string;
  error?: string | null;
}

export function Input({ label, hint, error, className, ...rest }: InputProps) {
  return (
    <View className="w-full">
      {label ? (
        <Text variant="small" className="mb-2 font-medium text-ink-700 dark:text-ink-100">
          {label}
        </Text>
      ) : null}
      <TextInput
        placeholderTextColor="#8A95A6"
        className={`rounded-2xl border border-ink-100 bg-white px-4 py-3 text-ink-900 dark:bg-ink-800 dark:border-ink-700 dark:text-ink-50 ${
          error ? 'border-terracotta-500' : ''
        } ${className ?? ''}`}
        {...rest}
      />
      {error ? (
        <Text variant="small" className="mt-1 text-terracotta-500">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" className="mt-1">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
