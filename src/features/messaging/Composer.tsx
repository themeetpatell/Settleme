// SettleMe — message composer (member + vendor share this).

import { useState } from 'react';
import { View, Pressable, Platform, KeyboardAvoidingView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '@/components/ui/Input';

interface ComposerProps {
  placeholder?: string;
  disabled?: boolean;
  onSend: (text: string) => Promise<void> | void;
}

export function Composer({ placeholder, disabled, onSend }: ComposerProps) {
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSend() {
    const trimmed = draft.trim();
    if (!trimmed || busy || disabled) return;
    setBusy(true);
    try {
      await onSend(trimmed);
      setDraft('');
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <View className="flex-row items-end gap-2 px-4 pb-3 pt-2">
        <View className="flex-1">
          <Input
            placeholder={placeholder ?? 'Type a message…'}
            value={draft}
            onChangeText={setDraft}
            multiline
            editable={!disabled && !busy}
          />
        </View>
        <Pressable
          onPress={handleSend}
          disabled={!draft.trim() || busy || disabled}
          className={`h-12 w-12 items-center justify-center rounded-2xl ${
            !draft.trim() || busy || disabled ? 'bg-ink-200 dark:bg-ink-700' : 'bg-ink-900'
          }`}
        >
          <Ionicons name="arrow-up" size={20} color="#FBF8F2" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
