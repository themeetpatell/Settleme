import { useState } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';
import type { ReactNode } from 'react';
import { Text } from './Text';

interface InputProps extends TextInputProps {
  label?: string;
  hint?: string;
  error?: string | null;
  leading?: ReactNode;
  trailing?: ReactNode;
}

export function Input({
  label,
  hint,
  error,
  leading,
  trailing,
  className,
  onFocus,
  onBlur,
  ...rest
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const borderTone = error
    ? 'border-terracotta-500'
    : focused
      ? 'border-ink-900 dark:border-marigold-400'
      : 'border-ink-100 dark:border-ink-700';

  return (
    <View className="w-full">
      {label ? (
        <Text variant="small" className="mb-1.5 font-medium text-ink-700 dark:text-ink-100">
          {label}
        </Text>
      ) : null}
      <View
        className={`flex-row items-center rounded-2xl border-2 bg-white dark:bg-ink-800 ${borderTone} px-4`}
      >
        {leading ? <View className="mr-2">{leading}</View> : null}
        <TextInput
          placeholderTextColor="#8A95A6"
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          className={`flex-1 py-3 text-[15px] text-ink-900 dark:text-sand-50 ${className ?? ''}`}
          {...rest}
        />
        {trailing ? <View className="ml-2">{trailing}</View> : null}
      </View>
      {error ? (
        <Text variant="small" tone="danger" className="mt-1.5">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" className="mt-1.5">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
