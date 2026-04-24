import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '@/src/contexts/ThemeContext';
import ScreenTitle from './ScreenTitle';

interface SuggestedTitleProps {
  title: string;
  className?: string;
}

/**
 * "✨ SUGGESTED …" header — sparkles icon + uppercase muted title in the AI
 * purple accent (P2). Used on Search, Ingredient Selector, and Batch when
 * showing suggested items.
 */
export default function SuggestedTitle({
  title,
  className = 'mb-1',
}: SuggestedTitleProps) {
  return (
    <View className={`flex-row items-center gap-1.5 ${className}`}>
      <Ionicons name="sparkles" size={12} color={palette.P2} />
      <ScreenTitle
        title={title}
        variant="muted"
        style={{ color: palette.P2 }}
      />
    </View>
  );
}
