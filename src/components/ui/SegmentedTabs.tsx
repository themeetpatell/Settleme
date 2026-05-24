import { Pressable, View } from 'react-native';
import { Text } from './Text';

interface SegmentedTabsProps<T extends string> {
  segments: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}

export function SegmentedTabs<T extends string>({ segments, value, onChange }: SegmentedTabsProps<T>) {
  return (
    <View className="flex-row rounded-2xl bg-ink-50 p-1 dark:bg-ink-800">
      {segments.map((s) => {
        const active = s.value === value;
        return (
          <Pressable
            key={s.value}
            onPress={() => onChange(s.value)}
            className={`flex-1 rounded-xl py-2 ${active ? 'bg-white dark:bg-ink-700' : ''}`}
          >
            <Text
              variant="small"
              className={`text-center font-medium ${active ? 'text-ink-900 dark:text-ink-50' : 'text-ink-400'}`}
            >
              {s.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
