import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, X, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PaymentProofCaptureProps {
  onCapture: (imageUrl: string) => void;
  onClose: () => void;
}

export default function PaymentProofCapture({ onCapture, onClose }: PaymentProofCaptureProps) {
  const webcamRef = useRef<Webcam>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setCapturedImage(imageSrc);
    }
  }, [webcamRef]);

  const handleSave = async () => {
    if (!capturedImage) return;
    try {
      // Convert base64 to blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      
      // Upload to Supabase Storage with correct bucket name
      const fileName = `payment_proofs/${Date.now()}.jpg`;
      const { data, error } = await supabase.storage
        .from('public1')
        .upload(fileName, blob);
      
      if (error) throw error;
      
      // Get public URL with correct bucket name
      const { data: { publicUrl } } = supabase.storage
        .from('public1')
        .getPublicUrl(fileName);
      
      onCapture(publicUrl);
    } catch (error) {
      console.error('Failed to save payment proof:', error);
      alert('Failed to save payment proof: ' + (error as Error).message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Capture Payment Proof</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="relative">
          {capturedImage ? (
            <img
              src={capturedImage}
              alt="Captured payment proof"
              className="w-full rounded-lg"
            />
          ) : (
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              className="w-full rounded-lg"
            />
          )}
        </div>
        <div className="mt-4 flex justify-center space-x-4">
          {capturedImage ? (
            <>
              <button
                onClick={() => setCapturedImage(null)}
                className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                <Camera className="w-5 h-5 mr-2" />
                Retake
              </button>
              <button
                onClick={handleSave}
                className="flex items-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
              >
                <Check className="w-5 h-5 mr-2" />
                Save
              </button>
            </>
          ) : (
            <button
              onClick={capture}
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              <Camera className="w-5 h-5 mr-2" />
              Capture
            </button>
          )}
        </div>
      </div>
    </div>
  );
}