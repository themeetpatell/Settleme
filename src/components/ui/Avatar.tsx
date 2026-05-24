import { Image } from 'expo-image';
import { View } from 'react-native';
import { Text } from './Text';

interface AvatarProps {
  url?: string | null;
  name?: string | null;
  size?: number;
}

export function Avatar({ url, name, size = 40 }: AvatarProps) {
  const initials =
    (name ?? '?')
      .split(' ')
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?';
  if (url) {
    return (
      <Image
        source={{ uri: url }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        contentFit="cover"
      />
    );
  }
  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className="items-center justify-center bg-marigold-100"
    >
      <Text variant="small" className="font-semibold text-marigold-600">
        {initials}
      </Text>
    </View>
  );
}
