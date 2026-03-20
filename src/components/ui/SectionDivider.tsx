import { View } from 'react-native';
import { useThemeColors } from '@/src/contexts/ThemeContext';

interface SectionDividerProps {
  className?: string;
}

export default function SectionDivider({ className = '' }: SectionDividerProps) {
  const colors = useThemeColors();
  return <View style={{ height: 1, backgroundColor: colors.borderSubtle }} className={className} />;
}
