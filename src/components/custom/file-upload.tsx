import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";

type FileUploadProps = {
  onFilesSelected: (files: Array<File>) => void;
  disabled?: boolean;
};

export function FileUpload({ onFilesSelected, disabled = false }: FileUploadProps) {
  const onDrop = useCallback(
    (acceptedFiles: Array<File>) => {
      onFilesSelected(acceptedFiles);
    },
    [onFilesSelected],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    maxFiles: 1,
    disabled,
  });

  return (
    <div
      {...getRootProps()}
      className={`p-4 border-2 border-dashed rounded-lg text-center
        ${isDragActive ? "border-primary bg-primary/10" : "border-gray-300"}
        ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:border-primary"}
      `}
    >
      <input {...getInputProps()} multiple={false} />
      {isDragActive ? (
        <p>Drop the image here...</p>
      ) : (
        <p>Drag & drop an image here, or click to select</p>
      )}
    </div>
  );
}
