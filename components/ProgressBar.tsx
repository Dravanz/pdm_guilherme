import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, useTheme } from 'react-native-paper';

interface ProgressBarProps {
  percentage: number;
  showLabel?: boolean;
}

export function ProgressBar({ percentage }: ProgressBarProps) {
  const theme = useTheme();
  
  const getColor = (percent: number) => {
    if (percent < 35) return '#f44336'; // Vermelho
    if (percent < 65) return '#ff9800'; // Amarelo
    return '#4caf50'; // Verde
  };

  const getStatusText = (percent: number) => {
    if (percent < 35) return 'Iniciante';
    if (percent < 65) return 'Intermediário';
    return 'Avançado';
  };

  const color = getColor(percentage);
  const clampedPercentage = Math.max(0, Math.min(100, percentage));
  const statusText = getStatusText(clampedPercentage);

  return (
    <Card style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <Card.Content style={styles.content}>
        <View style={styles.header}>
          <Text variant="titleMedium" style={[styles.title, { color: theme.colors.onSurface }]}>
            📈 Progresso Geral
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: color + '20' }]}>
            <Text variant="bodySmall" style={[styles.statusText, { color: color }]}>
              {statusText}
            </Text>
          </View>
        </View>
        
        <View style={styles.progressSection}>
          <View style={[styles.track, { backgroundColor: theme.colors.surfaceVariant }]}>
            <View 
              style={[
                styles.fill,
                {
                  width: `${clampedPercentage}%`,
                  backgroundColor: color,
                }
              ]}
            />
          </View>
          <Text variant="headlineSmall" style={[styles.percentage, { color: color }]}>
            {clampedPercentage}%
          </Text>
        </View>
        
        <Text variant="bodySmall" style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
          {clampedPercentage < 35 
            ? 'Continue estudando para avançar!' 
            : clampedPercentage < 65 
            ? 'Você está progredindo bem!' 
            : 'Excelente! Você é um expert!'}
        </Text>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    borderRadius: 16,
    elevation: 3,
  },
  content: {
    paddingVertical: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontWeight: '600',
    fontSize: 12,
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  track: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 12,
  },
  fill: {
    height: '100%',
    borderRadius: 4,
    minWidth: 2,
  },
  percentage: {
    fontWeight: '700',
    minWidth: 60,
    textAlign: 'right',
  },
  description: {
    textAlign: 'center',
    fontStyle: 'italic',
  },
});