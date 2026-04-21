import { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { useThemeColors } from '@/src/contexts/ThemeContext';

interface SkeletonItemProps {
  height?: number;
  width?: string | number;
  borderRadius?: number;
}

function SkeletonItem({ height = 20, width = '100%', borderRadius = 8 }: SkeletonItemProps) {
  const colors = useThemeColors();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        { height, width: width as any, borderRadius, backgroundColor: colors.border },
        { opacity },
      ]}
    />
  );
}

interface SkeletonCardProps {
  count?: number;
}

export default function SkeletonLoader({ count = 5 }: SkeletonCardProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.card}>
          <View style={styles.row}>
            <SkeletonItem height={18} width="55%" />
            <SkeletonItem height={18} width="20%" />
          </View>
          <SkeletonItem height={13} width="35%" />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  card: {
    borderRadius: 12,
    padding: 16,
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
});
