import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
      initialRouteName="landing"
    >
      <Stack.Screen name="landing" />
      <Stack.Screen name="login" />
      <Stack.Screen name="onboarding-tour" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="onboarding-profile" />
      <Stack.Screen name="onboarding-wells" />
      <Stack.Screen name="onboarding-wells-success" />
      <Stack.Screen name="onboarding-complete" />
    </Stack>
  );
}
