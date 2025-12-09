import { firestore } from '@/firebase/FirebaseInit';
import * as Device from 'expo-device';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Platform } from 'react-native';

export interface FeedbackData {
  userId: string;
  userEmail: string;
  userName: string;
  courseId?: string;
  courseTitle?: string;
  pageId?: string; // Se estiver numa página específica
  type: 'bug' | 'sugestao' | 'conteudo' | 'outro';
  description: string;
  deviceInfo: {
    brand: string | null;
    modelName: string | null;
    osName: string | null;
    osVersion: string | null;
  };
  appVersion: string;
}

export class FeedbackService {
  static async sendFeedback(data: FeedbackData) {
    try {
      const feedbackRef = collection(firestore, 'feedback');
      
      const enrichedData = {
        ...data,
        createdAt: serverTimestamp(),
        status: 'open', // open, in_progress, resolved
        platform: Platform.OS,
      };

      await addDoc(feedbackRef, enrichedData);
      return true;
    } catch (error) {
      console.error('Erro ao enviar feedback:', error);
      throw error;
    }
  }

  static getDeviceInfo() {
    return {
      brand: Device.brand,
      modelName: Device.modelName,
      osName: Device.osName,
      osVersion: Device.osVersion,
    };
  }
}
