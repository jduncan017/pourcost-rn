import { View, Text, Pressable, Image, ImageSourcePropType } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/src/contexts/ThemeContext';

interface ImagePlaceholderProps {
  imageSource?: ImageSourcePropType | null;
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const SIZES = {
  small: { container: 'w-24 h-24', icon: 24, text: 'text-xs' },
  medium: { container: 'w-32 h-32', icon: 28, text: 'text-xs' },
  large: { container: 'w-36 h-36', icon: 32, text: 'text-xs' },
} as const;

export default function ImagePlaceholder({
  imageSource,
  onPress,
  size = 'medium',
  className = '',
}: ImagePlaceholderProps) {
  const colors = useThemeColors();
  const s = SIZES[size];

  const content = (
    <View
      className={`${s.container} rounded-xl overflow-hidden ${className}`}
      style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
    >
      {imageSource ? (
        <Image source={imageSource} className="w-full h-full" resizeMode="cover" />
      ) : (
        <View className="w-full h-full items-center justify-center">
          <Ionicons name="add" size={s.icon} color={colors.textTertiary} />
          <Text className={`${s.text} mt-1`} style={{ color: colors.textTertiary, fontWeight: '600' }}>
            Add Photo
          </Text>
        </View>
      )}
    </View>
  );

  if (onPress) {
    return <Pressable onPress={onPress}>{content}</Pressable>;
  }

  return content;
}
