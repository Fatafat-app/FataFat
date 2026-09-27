import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radii } from '../../constants/Theme';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  fullScreen?: boolean;
}

export function ErrorState({ title = 'Oops!', message, onRetry, fullScreen = false }: ErrorStateProps) {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <View style={styles.iconContainer}>
        <Ionicons name="alert-circle" size={48} color={Colors.error} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      
      {onRetry && (
        <Button 
          title="Try Again" 
          onPress={onRetry} 
          variant="primary" 
          style={styles.retryBtn} 
          leftIcon={<Ionicons name="refresh" size={18} color={Colors.white} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEE2E2', // Very light red
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.title,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  message: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  retryBtn: {
    minWidth: 180,
  },
});
