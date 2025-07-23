/**
 * Asset import pipeline for processing various file types
 * 用于处理各种文件类型的资源导入管线
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { assetService } from './AssetService';
import type { AssetMetadata } from '../types/AssetTypes';
import { AssetType, generateAssetId } from '../types/AssetTypes';

/**
 * Supported file types and their categories
 * 支持的文件类型及其类别
 */
export const SUPPORTED_FILE_TYPES = {
  images: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'],
  models: ['.gltf', '.glb', '.fbx', '.obj', '.dae', '.3ds'],
  audio: ['.mp3', '.wav', '.ogg', '.m4a', '.aac'],
  video: ['.mp4', '.webm', '.ogv', '.avi', '.mov'],
  scripts: ['.js', '.ts', '.json', '.lua', '.py'],
  fonts: ['.ttf', '.otf', '.woff', '.woff2'],
  documents: ['.txt', '.md', '.pdf', '.doc', '.docx'],
  archives: ['.zip', '.rar', '.7z', '.tar', '.gz']
};

/**
 * Asset import configuration
 * 资源导入配置
 */
export interface ImportConfig {
  generateThumbnails: boolean;
  compressTextures: boolean;
  optimizeMeshes: boolean;
  preserveOriginalFormat: boolean;
  targetFormat?: string;
  quality?: number;
  targetFolderId: string;
  metadata?: Record<string, any>;
}

/**
 * Import result interface
 * 导入结果接口
 */
export interface ImportResult {
  success: boolean;
  asset?: AssetMetadata;
  error?: string;
  warnings?: string[];
}

/**
 * Asset import pipeline class
 * 资源导入管线类
 */
export class AssetImportPipeline {
  private loaders: Map<string, any> = new Map();
  private loadingManager: THREE.LoadingManager;

  constructor() {
    this.loadingManager = new THREE.LoadingManager();
    this.initializeLoaders();
  }

  /**
   * Initialize Three.js loaders
   * 初始化Three.js加载器
   */
  private initializeLoaders() {
    this.loaders.set('.gltf', new GLTFLoader(this.loadingManager));
    this.loaders.set('.glb', new GLTFLoader(this.loadingManager));
    this.loaders.set('.fbx', new FBXLoader(this.loadingManager));
    this.loaders.set('.obj', new OBJLoader(this.loadingManager));
  }

  /**
   * Get file type category
   * 获取文件类型类别
   */
  getFileTypeCategory(extension: string): AssetType {
    extension = extension.toLowerCase();
    
    if (SUPPORTED_FILE_TYPES.images.includes(extension)) return AssetType.Texture;
    if (SUPPORTED_FILE_TYPES.models.includes(extension)) return AssetType.Mesh;
    if (SUPPORTED_FILE_TYPES.audio.includes(extension)) return AssetType.Audio;
    if (SUPPORTED_FILE_TYPES.video.includes(extension)) return AssetType.Video;
    if (SUPPORTED_FILE_TYPES.scripts.includes(extension)) return AssetType.Script;
    if (SUPPORTED_FILE_TYPES.fonts.includes(extension)) return AssetType.Font;
    
    return AssetType.Unknown;
  }

  /**
   * Check if file type is supported
   * 检查文件类型是否支持
   */
  isSupported(fileName: string): boolean {
    const extension = this.getFileExtension(fileName);
    return Object.values(SUPPORTED_FILE_TYPES).some(types => 
      types.includes(extension)
    );
  }

  /**
   * Import single file
   * 导入单个文件
   */
  async importFile(file: File, config: ImportConfig = this.getDefaultConfig()): Promise<ImportResult> {
    try {
      const extension = this.getFileExtension(file.name);
      const type = this.getFileTypeCategory(extension);

      if (!this.isSupported(file.name)) {
        return {
          success: false,
          error: `Unsupported file type: ${extension}`
        };
      }

      // Generate asset metadata
      const metadata: AssetMetadata = {
        id: generateAssetId(),
        name: file.name.split('.')[0],
        filename: file.name,
        type,
        size: file.size,
        createdAt: Date.now(),
        modifiedAt: file.lastModified,
        path: `assets/${type}/${file.name}`,
        mimeType: file.type,
        parentId: config.targetFolderId,
        metadata: config.metadata || {},
        tags: []
      };

      // Process file based on type
      const processedData = await this.processFileByType(file, type, config);
      
      // Generate thumbnail if needed
      if (config.generateThumbnails) {
        const thumbnailResult = await this.generateThumbnail(file, type);
        if (thumbnailResult) {
          metadata.thumbnail = thumbnailResult;
        }
      }

      // Store asset
      await assetService.createAsset(metadata, processedData);

      return {
        success: true,
        asset: metadata
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown import error'
      };
    }
  }

  /**
   * Import multiple files
   * 导入多个文件
   */
  async importFiles(files: FileList | File[], config?: ImportConfig): Promise<ImportResult[]> {
    const results: ImportResult[] = [];
    const fileArray = Array.from(files);

    for (const file of fileArray) {
      const result = await this.importFile(file, config);
      results.push(result);
    }

    return results;
  }

  /**
   * Process file based on its type
   * 根据文件类型处理文件
   */
  private async processFileByType(file: File, type: AssetType, config: ImportConfig): Promise<ArrayBuffer | string> {
    switch (type) {
      case AssetType.Texture:
        return this.processImageFile(file, config);
      case AssetType.Mesh:
        return this.process3DModelFile(file, config);
      case AssetType.Audio:
        return this.processAudioFile(file, config);
      case AssetType.Script:
        return this.processScriptFile(file, config);
      default:
        return file.arrayBuffer();
    }
  }

  /**
   * Process image file
   * 处理图像文件
   */
  private async processImageFile(file: File, config: ImportConfig): Promise<ArrayBuffer> {
    if (!config.compressTextures) {
      return file.arrayBuffer();
    }

    // Create canvas for image processing
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();

    return new Promise((resolve, reject) => {
      img.onload = () => {
        // Calculate optimal size (power of 2 for WebGL)
        const maxSize = 2048;
        let { width, height } = img;
        
        if (width > maxSize || height > maxSize) {
          const scale = Math.min(maxSize / width, maxSize / height);
          width *= scale;
          height *= scale;
        }

        // Ensure power of 2 dimensions
        width = this.nearestPowerOf2(width);
        height = this.nearestPowerOf2(height);

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(blob => {
          if (blob) {
            blob.arrayBuffer().then(resolve).catch(reject);
          } else {
            reject(new Error('Failed to compress image'));
          }
        }, 'image/webp', config.quality || 0.8);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Process 3D model file
   * 处理3D模型文件
   */
  private async process3DModelFile(file: File, _config: ImportConfig): Promise<ArrayBuffer> {
    const extension = this.getFileExtension(file.name);
    const loader = this.loaders.get(extension);

    if (!loader) {
      return file.arrayBuffer();
    }

    // For now, just return the original file
    // TODO: Implement model optimization
    return file.arrayBuffer();
  }

  /**
   * Process audio file
   * 处理音频文件
   */
  private async processAudioFile(file: File, _config: ImportConfig): Promise<ArrayBuffer> {
    // For now, just return the original file
    // TODO: Implement audio compression
    return file.arrayBuffer();
  }

  /**
   * Process script file
   * 处理脚本文件
   */
  private async processScriptFile(file: File, _config: ImportConfig): Promise<string> {
    return file.text();
  }

  /**
   * Generate thumbnail for asset
   * 为资源生成缩略图
   */
  private async generateThumbnail(file: File, type: AssetType): Promise<string | undefined> {
    switch (type) {
      case AssetType.Texture:
        return this.generateImageThumbnail(file);
      case AssetType.Mesh:
        return this.generate3DThumbnail(file);
      default:
        return undefined;
    }
  }

  /**
   * Generate image thumbnail
   * 生成图像缩略图
   */
  private async generateImageThumbnail(file: File): Promise<string> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();

    return new Promise((resolve, reject) => {
      img.onload = () => {
        const size = 128;
        canvas.width = size;
        canvas.height = size;

        // Calculate aspect ratio and draw centered
        const scale = Math.min(size / img.width, size / img.height);
        const width = img.width * scale;
        const height = img.height * scale;
        const x = (size - width) / 2;
        const y = (size - height) / 2;

        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, x, y, width, height);

        resolve(canvas.toDataURL('image/webp', 0.7));
      };

      img.onerror = () => reject(new Error('Failed to generate thumbnail'));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Generate 3D model thumbnail
   * 生成3D模型缩略图
   */
  private async generate3DThumbnail(_file: File): Promise<string> {
    // Create a simple Three.js scene for thumbnail generation
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ preserveDrawingBuffer: true });
    renderer.setSize(128, 128);
    renderer.setClearColor(0xf0f0f0);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(ambientLight, directionalLight);

    try {
      // Load and render model
      // This is a simplified version - would need proper loader integration
      const geometry = new THREE.BoxGeometry();
      const material = new THREE.MeshStandardMaterial({ color: 0x888888 });
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      camera.position.set(2, 2, 2);
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      return renderer.domElement.toDataURL('image/webp', 0.7);
    } finally {
      renderer.dispose();
    }
  }

  /**
   * Get file extension
   * 获取文件扩展名
   */
  private getFileExtension(fileName: string): string {
    return fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  }

  /**
   * Get nearest power of 2
   * 获取最近的2的幂
   */
  private nearestPowerOf2(value: number): number {
    return Math.pow(2, Math.ceil(Math.log2(value)));
  }


  /**
   * Get default import configuration
   * 获取默认导入配置
   */
  private getDefaultConfig(): ImportConfig {
    return {
      generateThumbnails: true,
      compressTextures: false,
      optimizeMeshes: false,
      preserveOriginalFormat: true,
      quality: 0.8,
      targetFolderId: 'root',
      metadata: {}
    };
  }

  /**
   * Validate file before import
   * 导入前验证文件
   */
  validateFile(file: File): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      errors.push('File size exceeds 100MB limit');
    }

    // Check file type
    if (!this.isSupported(file.name)) {
      errors.push(`Unsupported file type: ${this.getFileExtension(file.name)}`);
    }

    // Check file name
    if (!/^[a-zA-Z0-9._-]+$/.test(file.name)) {
      errors.push('File name contains invalid characters');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
export const assetImportPipeline = new AssetImportPipeline();