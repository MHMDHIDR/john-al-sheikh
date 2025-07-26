import { ImageIcon } from "lucide-react";
import Image from "next/image";
import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { env } from "@/env";

type FileUploadProps = {
  onFilesSelected: (files: Array<File>) => void;
  disabled?: boolean;
  file?: File | null;
  isNewsletter?: boolean;
};

export function FileUpload({
  onFilesSelected,
  file,
  disabled = false,
  isNewsletter = false,
}: FileUploadProps) {
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
      className={`p-2 border-2 border-dashed rounded-lg text-center
        ${isDragActive ? "border-primary bg-primary/10" : "border-gray-300"}
        ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:border-primary"}
        ${isNewsletter ? "pb-0" : "p-2"}
      `}
    >
      <input {...getInputProps()} multiple={false} />
      {isNewsletter && file ? (
        <Image
          src={URL.createObjectURL(file)}
          alt={`${file.name} - ${env.NEXT_PUBLIC_APP_NAME} Newsletter Image`}
          className="object-contain rounded-lg shadow-sm"
          draggable={false}
          width={768}
          height={224}
        />
      ) : (
        isNewsletter && (
          <div className="flex items-center justify-center w-3xl h-56 rounded-lg bg-muted">
            <ImageIcon className="size-12 text-muted-foreground" />
          </div>
        )
      )}
      {isDragActive ? (
        <p className="text-sm text-muted-foreground py-2">Drop the image here...</p>
      ) : (
        <p className="text-sm text-muted-foreground py-2">
          Drag & drop an image here, or click to select
        </p>
      )}
    </div>
  );
}
