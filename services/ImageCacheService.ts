import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

export class ImageCacheService {
  private static readonly CACHE_PREFIX = 'image_cache_';
  private static readonly HASH_PREFIX = 'image_hash_';

  static async getCachedImage(userId: string, firebaseUrl: string): Promise<string> {
    try {
      // Verificar se é uma URL válida do Firebase Storage
      if (!this.isValidFirebaseUrl(firebaseUrl)) {
        return firebaseUrl; // Retornar URL original se não for válida
      }

      const cacheKey = `${this.CACHE_PREFIX}${userId}`;
      const hashKey = `${this.HASH_PREFIX}${userId}`;
      
      // Obter hash atual da URL do Firebase
      const currentHash = this.generateUrlHash(firebaseUrl);
      
      // Verificar hash salvo
      const savedHash = await AsyncStorage.getItem(hashKey);
      
      // Se hash é o mesmo, retornar imagem do cache
      if (savedHash === currentHash) {
        const cachedPath = await AsyncStorage.getItem(cacheKey);
        if (cachedPath) {
          const fileInfo = await FileSystem.getInfoAsync(cachedPath);
          if (fileInfo.exists) {
            return cachedPath;
          }
        }
      }
      
      // Download e cache da nova imagem
      return await this.downloadAndCache(userId, firebaseUrl, currentHash);
    } catch (error) {
      console.error('Erro no cache de imagem:', error);
      return firebaseUrl; // Fallback para URL original
    }
  }

  private static isValidFirebaseUrl(url: string): boolean {
    // Verificar se é uma URL válida do Firebase Storage
    return Boolean(url && 
           typeof url === 'string' && 
           (url.startsWith('https://firebasestorage.googleapis.com') || 
            url.startsWith('https://storage.googleapis.com')) &&
           !url.includes('/path/to/image.png') &&
           url.length > 50); // URLs do Firebase são longas
  }

  private static async downloadAndCache(userId: string, firebaseUrl: string, hash: string): Promise<string> {
    const cacheKey = `${this.CACHE_PREFIX}${userId}`;
    const hashKey = `${this.HASH_PREFIX}${userId}`;
    const fileName = `profile_${userId}.jpg`;
    const localPath = `${FileSystem.documentDirectory}${fileName}`;

    try {
      // Download da imagem
      const downloadResult = await FileSystem.downloadAsync(firebaseUrl, localPath);
      
      if (downloadResult.status === 200) {
        // Salvar caminho local e hash
        await AsyncStorage.setItem(cacheKey, localPath);
        await AsyncStorage.setItem(hashKey, hash);
        return localPath;
      }
    } catch (error) {
      console.error('Erro ao fazer download da imagem:', error);
    }
    
    return firebaseUrl; // Fallback
  }

  private static generateUrlHash(url: string): string {
    // Gerar hash simples baseado na URL (pode usar timestamp ou token da URL)
    const urlParts = url.split('?');
    const token = urlParts[1] || '';
    return btoa(token).substring(0, 16);
  }

  static async clearCache(userId?: string): Promise<void> {
    try {
      if (userId) {
        // Limpar cache específico do usuário
        const cacheKey = `${this.CACHE_PREFIX}${userId}`;
        const hashKey = `${this.HASH_PREFIX}${userId}`;
        const cachedPath = await AsyncStorage.getItem(cacheKey);
        
        if (cachedPath) {
          await FileSystem.deleteAsync(cachedPath, { idempotent: true });
        }
        
        await AsyncStorage.removeItem(cacheKey);
        await AsyncStorage.removeItem(hashKey);
      } else {
        // Limpar todo o cache
        const keys = await AsyncStorage.getAllKeys();
        const cacheKeys = keys.filter(key => 
          key.startsWith(this.CACHE_PREFIX) || key.startsWith(this.HASH_PREFIX)
        );
        
        await AsyncStorage.multiRemove(cacheKeys);
        
        // Limpar arquivos do sistema
        const files = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory!);
        const profileFiles = files.filter(file => file.startsWith('profile_'));
        
        for (const file of profileFiles) {
          await FileSystem.deleteAsync(`${FileSystem.documentDirectory}${file}`, { idempotent: true });
        }
      }
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
    }
  }
}