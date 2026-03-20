import { View } from 'react-native';

interface SectionDividerProps {
  className?: string;
}

export default function SectionDivider({ className = '' }: SectionDividerProps) {
  return <View className={`h-px bg-g2/30 dark:bg-p2/50 ${className}`} />;
}
