import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import Button from '@/src/components/ui/Button';
import { palette } from '@/src/contexts/ThemeContext';

const VALUE_PROPS = [
  { icon: 'pricetags' as const, text: 'Track real ingredient costs' },
  { icon: 'wine' as const, text: 'Build & price cocktails instantly' },
  { icon: 'trending-up' as const, text: 'Hit your margin targets every pour' },
];

const videoSource = require('@/assets/splash-video.mp4');

export default function LandingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const player = useVideoPlayer(videoSource, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  return (
    <View style={styles.container}>
      {/* Video Background */}
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
      />

      {/* Gradient overlay: transparent at top, solid at bottom */}
      <LinearGradient
        colors={['rgba(11, 17, 32, 0)', 'rgba(11, 17, 32, 0.3)', 'rgba(11, 17, 32, 0.8)', palette.B9]}
        locations={[0, 0.4, 0.65, 0.85]}
        style={StyleSheet.absoluteFill}
      />

      {/* Content — pushed to bottom, everything centered */}
      <View
        className="flex-1 justify-end items-center px-6"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        {/* Logo */}
        <Image
          source={require('@/assets/images/PC-Logo-Gold.png')}
          style={{ width: 220, height: 55, marginBottom: 8 }}
          resizeMode="contain"
        />

        {/* Tagline */}
        <Text
          className="text-lg text-center mb-10"
          style={{ color: palette.N3 }}
        >
          The smartest way to manage bar profitability
        </Text>

        {/* Value props — fit-width centered box, content left-aligned */}
        <View className="items-center mb-12">
          <View className="flex-col gap-4">
            {VALUE_PROPS.map((prop, i) => (
              <View key={i} className="flex-row items-center gap-3">
                <Ionicons name={prop.icon} size={20} color={palette.Y4} />
                <Text
                  className="text-lg"
                  style={{ color: palette.N2, fontWeight: '500' }}
                >
                  {prop.text}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* CTAs — full width, pill-shaped */}
        <View className="flex-col gap-4 w-full" style={{ paddingBottom: 8 }}>
          <Pressable
            onPress={() => router.push('/(auth)/onboarding-tour' as any)}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(auth)/login' as any)}
            style={styles.outlineButton}
          >
            <Text style={styles.outlineButtonText}>I already have an account</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.B9,
  },
  primaryButton: {
    backgroundColor: palette.B5,
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: palette.N1,
    fontSize: 16,
    fontWeight: '600',
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
  },
  outlineButtonText: {
    color: palette.N1,
    fontSize: 16,
    fontWeight: '500',
  },
});
