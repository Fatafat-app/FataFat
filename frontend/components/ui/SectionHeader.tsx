import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography } from '../../constants/Theme';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionText?: string;
  onActionPress?: () => void;
}

export function SectionHeader({ title, subtitle, actionText, onActionPress }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      
      {actionText && onActionPress && (
        <TouchableOpacity onPress={onActionPress} style={styles.actionBtn}>
          <Text style={styles.actionText}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...Typography.title,
    marginBottom: 2,
  },
  subtitle: {
    ...Typography.bodySmall,
  },
  actionBtn: {
    paddingLeft: 12,
    paddingVertical: 4,
  },
  actionText: {
    ...Typography.label,
    color: Colors.primary,
  },
});
