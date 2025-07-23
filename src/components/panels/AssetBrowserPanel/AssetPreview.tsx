/**
 * Asset preview component for different file types
 * 不同文件类型的资源预览组件
 */

import React, { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Center, Environment } from '@react-three/drei';
import { Spin, Typography, Card, Image, Button, Space } from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  SoundOutlined,
  FileTextOutlined,
  CodeOutlined,
  EyeOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import * as THREE from 'three';
import type { AssetMetadata } from '../../../types/AssetTypes';
import { AssetType } from '../../../types/AssetTypes';
import { assetService } from '../../../services/AssetService';

const { Text } = Typography;

/**
 * Asset preview props
 */
export interface AssetPreviewProps {
  asset: AssetMetadata;
  width?: number;
  height?: number;
  onClose?: () => void;
}

/**
 * 3D Model preview component
 */
const Model3DPreview: React.FC<{ url: string }> = ({ url }) => {
  const { scene } = useGLTF(url);
  const modelRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (modelRef.current) {
      modelRef.current.rotation.y += 0.01;
    }
  });

  return (
    <Center>
      <primitive ref={modelRef} object={scene} />
    </Center>
  );
};

/**
 * Image preview component
 */
const ImagePreview: React.FC<{ asset: AssetMetadata }> = ({ asset }) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadImage = async () => {
      try {
        const data = await assetService.getAssetData(asset.id);
        if (data) {
          const url = URL.createObjectURL(data);
          setImageUrl(url);
        }
      } catch (error) {
        console.error('Failed to load image:', error);
      } finally {
        setLoading(false);
      }
    };

    loadImage();

    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [asset.id, asset.mimeType]);

  if (loading) {
    return <Spin size="large" />;
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <Image
        src={imageUrl}
        alt={asset.name}
        style={{ maxWidth: '100%', maxHeight: '400px' }}
        preview={{
          mask: <EyeOutlined />
        }}
      />
      <div style={{ marginTop: '16px' }}>
        <Text type="secondary">
          {asset.width && asset.height && `${asset.width} × ${asset.height} pixels`}
        </Text>
      </div>
    </div>
  );
};

/**
 * Audio preview component
 */
const AudioPreview: React.FC<{ asset: AssetMetadata }> = ({ asset }) => {
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const loadAudio = async () => {
      try {
        const data = await assetService.getAssetData(asset.id);
        if (data) {
          const url = URL.createObjectURL(data);
          setAudioUrl(url);
        }
      } catch (error) {
        console.error('Failed to load audio:', error);
      }
    };

    loadAudio();

    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [asset.id, asset.mimeType]);

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <SoundOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
      
      <div style={{ marginBottom: '16px' }}>
        <Text strong>{asset.name}</Text>
      </div>

      <Space direction="vertical" size="large">
        <Button
          type="primary"
          icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
          onClick={togglePlayback}
          size="large"
        >
          {isPlaying ? 'Pause' : 'Play'}
        </Button>

        <div>
          <Text type="secondary">
            {formatTime(currentTime)} / {formatTime(duration)}
          </Text>
        </div>

        <input
          type="range"
          min={0}
          max={duration}
          value={currentTime}
          onChange={(e) => {
            if (audioRef.current) {
              audioRef.current.currentTime = Number(e.target.value);
            }
          }}
          style={{ width: '100%' }}
        />
      </Space>

      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />
    </div>
  );
};

/**
 * Video preview component
 */
const VideoPreview: React.FC<{ asset: AssetMetadata }> = ({ asset }) => {
  const [videoUrl, setVideoUrl] = useState<string>('');

  useEffect(() => {
    const loadVideo = async () => {
      try {
        const data = await assetService.getAssetData(asset.id);
        if (data) {
          const url = URL.createObjectURL(data);
          setVideoUrl(url);
        }
      } catch (error) {
        console.error('Failed to load video:', error);
      }
    };

    loadVideo();

    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [asset.id, asset.mimeType]);

  return (
    <div style={{ textAlign: 'center' }}>
      <video
        src={videoUrl}
        controls
        style={{ maxWidth: '100%', maxHeight: '400px' }}
      />
    </div>
  );
};

/**
 * Text/Script preview component
 */
const TextPreview: React.FC<{ asset: AssetMetadata }> = ({ asset }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadText = async () => {
      try {
        const data = await assetService.getAssetData(asset.id);
        if (data) {
          const arrayBuffer = await data.arrayBuffer();
          const text = new TextDecoder().decode(arrayBuffer);
          setContent(text);
        }
      } catch (error) {
        console.error('Failed to load text:', error);
      } finally {
        setLoading(false);
      }
    };

    loadText();
  }, [asset.id]);

  if (loading) {
    return <Spin size="large" />;
  }

  const isCode = asset.name.match(/\.(js|ts|json|css|html|xml|py|lua)$/i);

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        {isCode ? <CodeOutlined /> : <FileTextOutlined />}
        <Text strong>{asset.name}</Text>
        <Text type="secondary">({content.length} characters)</Text>
      </div>
      
      <div
        style={{
          backgroundColor: '#f5f5f5',
          padding: '12px',
          borderRadius: '6px',
          maxHeight: '400px',
          overflow: 'auto',
          fontFamily: isCode ? 'Monaco, Consolas, monospace' : 'inherit',
          fontSize: isCode ? '12px' : '14px',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word'
        }}
      >
        {content}
      </div>
    </div>
  );
};

/**
 * 3D model preview with Three.js canvas
 */
const Model3DContainer: React.FC<{ asset: AssetMetadata }> = ({ asset }) => {
  const [modelUrl, setModelUrl] = useState<string>('');

  useEffect(() => {
    const loadModel = async () => {
      try {
        const data = await assetService.getAssetData(asset.id);
        if (data) {
          const url = URL.createObjectURL(data);
          setModelUrl(url);
        }
      } catch (error) {
        console.error('Failed to load model:', error);
      }
    };

    loadModel();

    return () => {
      if (modelUrl) {
        URL.revokeObjectURL(modelUrl);
      }
    };
  }, [asset.id, asset.mimeType]);

  if (!modelUrl) {
    return <Spin size="large" />;
  }

  return (
    <div style={{ height: '400px', border: '1px solid #d9d9d9', borderRadius: '6px' }}>
      <Canvas camera={{ position: [2, 2, 2], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <Suspense fallback={null}>
          <Model3DPreview url={modelUrl} />
          <Environment preset="studio" />
        </Suspense>
        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
      </Canvas>
    </div>
  );
};

/**
 * Generic file preview component
 */
const GenericPreview: React.FC<{ asset: AssetMetadata }> = ({ asset }) => {
  const downloadAsset = async () => {
    try {
      const data = await assetService.getAssetData(asset.id);
      if (data) {
        const url = URL.createObjectURL(data);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = asset.name;
        a.click();
        
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to download asset:', error);
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '40px' }}>
      <FileTextOutlined style={{ fontSize: '48px', color: '#888', marginBottom: '16px' }} />
      <div style={{ marginBottom: '16px' }}>
        <Text strong>{asset.name}</Text>
      </div>
      <Text type="secondary">Preview not available for this file type</Text>
      <div style={{ marginTop: '24px' }}>
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={downloadAsset}
        >
          Download File
        </Button>
      </div>
    </div>
  );
};

/**
 * Main asset preview component
 */
export const AssetPreview: React.FC<AssetPreviewProps> = ({
  asset,
  width = 600,
  height = 500
}) => {
  const renderPreview = () => {
    switch (asset.type) {
      case AssetType.Texture:
        return <ImagePreview asset={asset} />;
      case AssetType.Mesh:
        return <Model3DContainer asset={asset} />;
      case AssetType.Audio:
        return <AudioPreview asset={asset} />;
      case AssetType.Video:
        return <VideoPreview asset={asset} />;
      case AssetType.Script:
        return <TextPreview asset={asset} />;
      default:
        return <GenericPreview asset={asset} />;
    }
  };

  return (
    <Card
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text strong>{asset.name}</Text>
          <div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {(asset.size / 1024).toFixed(1)} KB
            </Text>
          </div>
        </div>
      }
      style={{ width, height, overflow: 'hidden' }}
      bodyStyle={{ height: 'calc(100% - 57px)', overflow: 'auto' }}
    >
      {renderPreview()}
    </Card>
  );
};