import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { FAB, useTheme } from 'react-native-paper';
import { FeedbackModal } from './FeedbackModal';

interface FeedbackFABProps {
  courseId?: string;
  courseTitle?: string;
  pageId?: string;
}

export function FeedbackFAB({ courseId, courseTitle, pageId }: FeedbackFABProps) {
  const theme = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      <FAB
        icon="message-alert"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color={theme.colors.onPrimary}
        onPress={() => setModalVisible(true)}
        label="Feedback"
        small
      />
      
      <FeedbackModal
        visible={modalVisible}
        onDismiss={() => setModalVisible(false)}
        courseId={courseId}
        courseTitle={courseTitle}
        pageId={pageId}
      />
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 80, // Acima da tab bar se houver, ou ajustar conforme necessidade
    zIndex: 1000,
  },
});
