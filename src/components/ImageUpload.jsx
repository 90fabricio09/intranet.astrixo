import React, { useState } from 'react';
import imageCompression from 'browser-image-compression';
import '../styles/ImageUpload.css';

export default function ImageUpload({ onUploadComplete, currentImageUrl = null }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState(currentImageUrl);
  const [error, setError] = useState('');

  const handleImageSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione apenas arquivos de imagem');
      return;
    }

    try {
      setUploading(true);
      setError('');
      setProgress(0);

      // Opções de compressão
      const options = {
        maxSizeMB: 0.5, // Máximo 500KB para salvar no Firestore
        maxWidthOrHeight: 1200, // Máximo 1200px
        useWebWorker: true,
        fileType: 'image/jpeg' // Converter para JPEG
      };

      console.log('Comprimindo imagem...');
      setProgress(20);
      
      // Comprimir imagem
      const compressedFile = await imageCompression(file, options);
      console.log(`Tamanho original: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      console.log(`Tamanho comprimido: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
      
      setProgress(50);

      // Converter para base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        console.log(`Base64 gerado: ${(base64String.length / 1024).toFixed(2)}KB`);
        
        setPreview(base64String);
        setProgress(100);
        setUploading(false);
        
        // Chamar callback com a base64
        if (onUploadComplete) {
          onUploadComplete(base64String);
        }
      };
      
      reader.onerror = () => {
        console.error('Erro ao ler arquivo');
        setError('Erro ao processar imagem');
        setUploading(false);
      };
      
      reader.readAsDataURL(compressedFile);
      setProgress(75);
      
    } catch (error) {
      console.error('Erro ao processar imagem:', error);
      setError('Erro ao processar imagem');
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="image-upload-container">
      <label className="image-upload-label">
        <input
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          disabled={uploading}
          className="image-upload-input"
        />
        
        <div className="image-upload-area">
          {preview ? (
            <div className="image-preview">
              <img src={preview} alt="Preview" />
              <div className="image-overlay">
                <i className="bi bi-cloud-upload"></i>
                <span>{uploading ? 'Processando...' : 'Clique para trocar'}</span>
              </div>
            </div>
          ) : (
            <div className="image-placeholder">
              <i className="bi bi-image"></i>
              <span>Clique para selecionar imagem</span>
              <small>JPG, PNG ou WEBP (será comprimido para ~500KB)</small>
            </div>
          )}
        </div>
      </label>

      {uploading && (
        <div className="upload-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <span className="progress-text">{progress}%</span>
        </div>
      )}

      {error && (
        <div className="upload-error">
          <i className="bi bi-exclamation-circle"></i>
          {error}
        </div>
      )}

      {!uploading && preview && progress === 100 && (
        <div className="upload-success">
          <i className="bi bi-check-circle"></i>
          Imagem processada com sucesso!
        </div>
      )}
    </div>
  );
}
