import { View } from 'react-native';
import { Text } from './Text';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  body?: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export function EmptyState({ title, body, ctaLabel, onCta }: EmptyStateProps) {
  return (
    <View className="items-center justify-center px-8 py-16">
      <Text variant="h2" className="text-center">
        {title}
      </Text>
      {body ? (
        <Text variant="body" muted className="mt-2 text-center">
          {body}
        </Text>
      ) : null}
      {ctaLabel && onCta ? (
        <View className="mt-6">
          <Button title={ctaLabel} onPress={onCta} variant="primary" />
        </View>
      ) : null}
    </View>
  );
}
