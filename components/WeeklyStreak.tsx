import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, Text, useTheme } from 'react-native-paper';

interface WeeklyStreakProps {
  loginDays: string[]; // Array de datas no formato 'YYYY-MM-DD'
}

export function WeeklyStreak({ loginDays }: WeeklyStreakProps) {
  const theme = useTheme();
  
  const getDayName = (dayIndex: number) => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return days[dayIndex];
  };
  
  const getLast7Days = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      days.push({
        date: date.toISOString().split('T')[0], // YYYY-MM-DD
        dayName: getDayName(date.getDay()),
        isToday: i === 0
      });
    }
    
    return days;
  };
  
  const last7Days = getLast7Days();
  
  return (
    <View style={styles.container}>
      <Text variant="bodyMedium" style={[styles.title, { color: theme.colors.onSurface }]}>
        Sequência de 7 dias
      </Text>
      <View style={styles.daysContainer}>
        {last7Days.map((day, index) => {
          const hasLogin = loginDays.includes(day.date);
          return (
            <View key={day.date} style={styles.dayItem}>
              <Text variant="bodySmall" style={[styles.dayName, { color: theme.colors.onSurfaceVariant }]}>
                {day.dayName}
              </Text>
              <View style={[
                styles.dayCircle,
                {
                  backgroundColor: day.isToday 
                    ? theme.colors.primary + '20'
                    : theme.colors.surfaceVariant,
                  borderColor: day.isToday ? theme.colors.primary : 'transparent',
                  borderWidth: day.isToday ? 2 : 0,
                }
              ]}>
                <Icon
                  source={hasLogin ? 'fire' : 'close'}
                  size={20}
                  color={hasLogin ? theme.colors.streak : theme.colors.onSurfaceVariant}
                />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
  },
  title: {
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'center',
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  dayItem: {
    alignItems: 'center',
    flex: 1,
  },
  dayName: {
    fontSize: 10,
    marginBottom: 4,
    fontWeight: '500',
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});