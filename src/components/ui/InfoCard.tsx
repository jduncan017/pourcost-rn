import React, { ReactNode } from 'react';
import { View, Text, Image, ImageSourcePropType } from 'react-native';
import Card from './Card';
import ScreenTitle from './ScreenTitle';

interface InfoCardProps {
  title?: string;
  subtitle?: string;
  description?: string;
  features?: string[];
  steps?: Array<{ title: string; description: string }>;
  icon?: ImageSourcePropType;
  iconSize?: number;
  centered?: boolean;
  className?: string;
  titleVariant?: 'main' | 'section' | 'page';
  children?: ReactNode;
}

/**
 * Reusable info card component for about pages and similar content
 * Supports multiple layouts: basic info, feature lists, step-by-step guides
 */
export default function InfoCard({
  title,
  subtitle,
  description,
  features,
  steps,
  icon,
  iconSize = 64,
  centered = false,
  className = '',
  titleVariant = 'section',
  children,
}: InfoCardProps) {
  return (
    <Card className={className}>
      {/* Icon + Title + Subtitle Section (for app info style) */}
      {icon && (
        <View className={`${centered ? 'items-center' : 'items-start'} mb-4`}>
          <View className="w-16 h-16 items-center justify-center mb-3">
            <Image
              source={icon}
              style={{ width: iconSize, height: iconSize }}
              resizeMode="contain"
            />
          </View>
          {title && (
            <Text
              className={`text-xl text-g4 dark:text-n1 ${centered ? 'text-center' : ''}`}
              style={{ fontWeight: '700' }}
            >
              {title}
            </Text>
          )}
          {subtitle && (
            <Text
              className={`text-g3 dark:text-n1 ${centered ? 'text-center' : ''}`}
              style={{}}
            >
              {subtitle}
            </Text>
          )}
        </View>
      )}

      {/* Title Only Section (for standard cards) */}
      {title && !icon && (
        <ScreenTitle title={title} variant={titleVariant} className="mb-3" />
      )}

      {/* Description */}
      {description && (
        <Text
          className={`text-g4 dark:text-n1 leading-relaxed ${centered ? 'text-center' : ''}`}
          style={{}}
        >
          {description}
        </Text>
      )}

      {/* Feature List */}
      {features && (
        <View className="flex flex-col gap-2">
          {features.map((feature, index) => (
            <Text
              key={index}
              className="text-g4 dark:text-n1"
              style={{}}
            >
              • {feature}
            </Text>
          ))}
        </View>
      )}

      {/* Step-by-step Guide */}
      {steps && (
        <View className="flex flex-col gap-3">
          {steps.map((step, index) => (
            <View key={index} className="bg-n1/80 dark:bg-p3/80 p-4 rounded-lg">
              <Text
                className="text-g4 dark:text-n1 mb-1"
                style={{ fontWeight: '500' }}
              >
                {step.title}
              </Text>
              <Text
                className="text-sm text-g3 dark:text-n1"
                style={{}}
              >
                {step.description}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Custom children content */}
      {children}
    </Card>
  );
}