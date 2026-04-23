import { View, Text, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '@/src/contexts/ThemeContext';
import { HapticService } from '@/src/services/haptic-service';

interface AuthHeaderProps {
  backLabel?: string;
  onBack?: () => void;
}

const liquidGlassReady = isLiquidGlassAvailable();

/**
 * Compact top bar for pre-login screens: Liquid Glass back pill on the left.
 * Uses expo-glass-effect's native UIVisualEffectView on iOS 26+, falls back
 * to expo-blur on older iOS / Android.
 */
export default function AuthHeader({ backLabel = 'Back', onBack }: AuthHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    HapticService.buttonPress();
    if (onBack) onBack();
    else router.back();
  };

  const pillStyle = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingLeft: 10,
    paddingRight: 16,
    paddingVertical: 8,
    borderRadius: 999,
    overflow: 'hidden' as const,
  };

  const pillChildren = (
    <>
      <Ionicons name="chevron-back" size={20} color={palette.N1} />
      <Text style={{ color: palette.N1, fontSize: 15, fontWeight: '500', marginLeft: 2 }}>
        {backLabel}
      </Text>
    </>
  );

  return (
    <View className="flex-row items-center py-2">
      <Pressable onPress={handleBack} hitSlop={8}>
        {liquidGlassReady ? (
          <GlassView
            glassEffectStyle="regular"
            isInteractive
            colorScheme="dark"
            style={pillStyle}
          >
            {pillChildren}
          </GlassView>
        ) : (
          <BlurView
            intensity={50}
            tint="systemThinMaterialDark"
            style={{
              ...pillStyle,
              borderWidth: 0.5,
              borderColor: 'rgba(255,255,255,0.18)',
            }}
          >
            {pillChildren}
          </BlurView>
        )}
      </Pressable>
    </View>
  );
}
