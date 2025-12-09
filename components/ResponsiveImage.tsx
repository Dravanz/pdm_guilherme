import { Image } from 'expo-image';
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import ImageViewing from "react-native-image-viewing";

interface ResponsiveImageProps {
  source: { uri: string };
  placeholder?: string;
  style?: object;
}

export function ResponsiveImage({ source, placeholder, style }: ResponsiveImageProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity onPress={() => setVisible(true)} activeOpacity={0.9}>
        <Image
          source={source}
          style={styles.image}
          contentFit="contain"
          placeholder={placeholder}
        />
      </TouchableOpacity>
      
      <ImageViewing
        images={[{ uri: source.uri }]}
        imageIndex={0}
        visible={visible}
        onRequestClose={() => setVisible(false)}
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