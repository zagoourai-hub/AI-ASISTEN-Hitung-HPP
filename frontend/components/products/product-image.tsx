"use client"

import { useRef, useState } from "react"
import type { ChangeEvent } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ImageOff } from "lucide-react"
import { deleteProductImage, getProductImageUrl, uploadProductImage } from "@/lib/api/catalog"
import { ApiError } from "@/lib/api/client"
import { mapSemanticErrorToMessage } from "@/lib/api/error-mapper"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export const PRODUCT_IMAGE_MAX_BYTES = 5 * 1024 * 1024
export const PRODUCT_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp"

const PRODUCT_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])

export function validateProductImage(file: File): string | null {
  if (!PRODUCT_IMAGE_TYPES.has(file.type)) return "Gunakan gambar JPG, PNG, atau WebP."
  if (file.size > PRODUCT_IMAGE_MAX_BYTES) return "Ukuran gambar maksimal 5 MB."
  return null
}

interface ProductImageProps {
  imageUrl: string | null
  name: string
  className?: string
}

export function ProductImage({ imageUrl, name, className }: ProductImageProps) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null)
  const source = getProductImageUrl(imageUrl)
  const hasError = failedImageUrl !== null && failedImageUrl === imageUrl

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#F3F5F4] text-[#737B76] dark:bg-[#231E19] dark:text-[#98A09B]",
        className
      )}
    >
      {source && !hasError ? (
        // The image endpoint is cookie-authenticated; native img preserves the browser session.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={source}
          alt={name}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setFailedImageUrl(imageUrl)}
        />
      ) : (
        <ImageOff className="h-5 w-5" aria-hidden="true" />
      )}
    </span>
  )
}

interface ProductImageManagerProps {
  productId: string
  productName: string
  imageUrl: string | null
}

export function ProductImageManager({
  productId,
  productName,
  imageUrl,
}: ProductImageManagerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()
  const [validationError, setValidationError] = useState<string | null>(null)

  const refreshProductQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["product", productId] }),
      queryClient.invalidateQueries({ queryKey: ["products"] }),
    ])
  }

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadProductImage(productId, file),
    onSuccess: refreshProductQueries,
  })
  const deleteMutation = useMutation({
    mutationFn: () => deleteProductImage(productId),
    onSuccess: refreshProductQueries,
  })

  const apiError = uploadMutation.error instanceof ApiError
    ? uploadMutation.error
    : deleteMutation.error instanceof ApiError
      ? deleteMutation.error
      : null
  const errorMessage = validationError
    ?? (apiError ? mapSemanticErrorToMessage(apiError.code, apiError.message) : null)
  const isPending = uploadMutation.isPending || deleteMutation.isPending

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const error = validateProductImage(file)
    setValidationError(error)
    if (!error) uploadMutation.mutate(file)
  }

  const handleDelete = () => {
    if (!window.confirm("Hapus gambar produk ini?")) return
    setValidationError(null)
    deleteMutation.mutate()
  }

  return (
    <div className="flex shrink-0 flex-col items-center gap-2">
      <ProductImage imageUrl={imageUrl} name={productName} className="h-24 w-24 text-4xl" />
      <input
        ref={inputRef}
        id="product-image-upload"
        type="file"
        accept={PRODUCT_IMAGE_ACCEPT}
        onChange={handleFileChange}
        disabled={isPending}
        className="w-36 text-[10px] file:mr-1.5 file:rounded-lg file:border-0 file:bg-[#DDF5E7] file:px-2 file:py-1.5 file:text-[10px] file:font-semibold file:text-[#10673C] hover:file:bg-[#C8EFD6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14804A]"
      />
      {imageUrl && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={isPending}
          className="h-7 px-2 text-[10px] text-[#C63C3C] hover:bg-[#FEF2F2] hover:text-[#C63C3C]"
        >
          {deleteMutation.isPending ? "Menghapus..." : "Hapus gambar"}
        </Button>
      )}
      {isPending && uploadMutation.isPending && (
        <p className="text-[10px] text-[#737B76]" role="status">Mengunggah...</p>
      )}
      {errorMessage && (
        <p className="max-w-40 text-center text-[10px] text-[#C63C3C]" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  )
}
