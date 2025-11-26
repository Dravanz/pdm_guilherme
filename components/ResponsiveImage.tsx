import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';

interface ResponsiveImageProps {
  source: { uri: string };
  placeholder?: string;
  style?: object;
}

export function ResponsiveImage({ source, placeholder, style }: ResponsiveImageProps) {
  return (
    <View style={[styles.container, style]}>
      <Image
        source={source}
        style={styles.image}
        contentFit="contain"
        placeholder={placeholder}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  image: {
    width: '100%',
    aspectRatio: 16/9,
  },
});