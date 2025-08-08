import { useState, useRef } from 'react';
import { ImageIcon } from '../../icons';

interface PhotoUploadProps {
  onChange: (file: File | null) => void;
  currentPhoto?: string | null;
  error?: string;
}

export default function PhotoUpload({ onChange, currentPhoto, error }: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentPhoto || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image file (JPEG, JPG, or PNG)');
      return;
    }

    // Validate file size (1MB)
    if (file.size > 1 * 1024 * 1024) {
      alert('File size should be less than 1MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    onChange(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <div
        onClick={handleClick}
        className="relative w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-500 transition-colors flex items-center justify-center"
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover rounded-lg"
            />
            <button
              onClick={handleRemove}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              ×
            </button>
          </>
        ) : (
          <div className="text-center">
            <ImageIcon className="w-8 h-8 mx-auto text-gray-400" />
            <p className="mt-1 text-sm text-gray-500">Click to upload</p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/jpg"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
} 