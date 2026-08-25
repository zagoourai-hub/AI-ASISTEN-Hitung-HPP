"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { ChangeEvent } from "react"
import Link from "next/link"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { ImagePlus, X } from "lucide-react"
import { createProduct, uploadProductImage } from "@/lib/api/catalog"
import { ApiError } from "@/lib/api/client"
import { mapSemanticErrorToMessage } from "@/lib/api/error-mapper"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ErrorBanner } from "@/components/feedback/feedback-states"
import {
  PRODUCT_IMAGE_ACCEPT,
  PRODUCT_IMAGE_MAX_BYTES,
  validateProductImage,
} from "@/components/products/product-image"

interface ProductFormValues {
  name: string
  category: string
  variantName: string
  sellingPrice: string
  packagingCost: string
  directCost: string
  targetMargin: string
}

interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface ProductSubmitValues {
  values: ProductFormValues
  imageFile: File | null
}

interface ProductSubmitResult {
  productId: string
  imageError: string | null
}

const DEFAULT_VALUES: ProductFormValues = {
  name: "",
  category: "Minuman",
  variantName: "Regular",
  sellingPrice: "",
  packagingCost: "0",
  directCost: "0",
  targetMargin: "",
}

export function ProductModal({ isOpen, onClose, onSuccess }: ProductModalProps) {
  const queryClient = useQueryClient()
  const imageInputRef = useRef<HTMLInputElement>(null)
  const form = useForm<ProductFormValues>({ defaultValues: DEFAULT_VALUES })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageValidationError, setImageValidationError] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [createdProductId, setCreatedProductId] = useState<string | null>(null)

  const imagePreviewUrl = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : null),
    [imageFile]
  )

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl)
    }
  }, [imagePreviewUrl])

  const clearImage = () => {
    setImageFile(null)
    setImageValidationError(null)
    if (imageInputRef.current) imageInputRef.current.value = ""
  }

  const resetModal = () => {
    form.reset(DEFAULT_VALUES)
    clearImage()
    setUploadError(null)
    setCreatedProductId(null)
  }

  const mutation = useMutation<ProductSubmitResult, Error, ProductSubmitValues>({
    mutationFn: async ({ values, imageFile: selectedImage }) => {
      const product = await createProduct({
        name: values.name,
        category: values.category,
        variant: {
          name: values.variantName,
          selling_price: values.sellingPrice,
          packaging_cost: values.packagingCost || "0",
          direct_cost: values.directCost || "0",
          target_margin_override: values.targetMargin
            ? (Number(values.targetMargin) / 100).toFixed(4)
            : null,
        },
      })

      if (!selectedImage) return { productId: product.id, imageError: null }

      try {
        await uploadProductImage(product.id, selectedImage)
        return { productId: product.id, imageError: null }
      } catch (error: unknown) {
        return {
          productId: product.id,
          imageError: error instanceof ApiError
            ? mapSemanticErrorToMessage(error.code, error.message)
            : "Produk tersimpan, tetapi gambar gagal diunggah.",
        }
      }
    },
    onSuccess: async ({ productId, imageError }) => {
      await queryClient.invalidateQueries({ queryKey: ["products"] })
      if (imageError) {
        form.reset(DEFAULT_VALUES)
        clearImage()
        setCreatedProductId(productId)
        setUploadError(imageError)
        return
      }
      resetModal()
      onSuccess()
    },
  })

  const error = mutation.error instanceof ApiError ? mutation.error : null

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedImage = event.target.files?.[0] ?? null
    if (!selectedImage) {
      clearImage()
      return
    }
    const validationError = validateProductImage(selectedImage)
    setImageValidationError(validationError)
    if (validationError) {
      setImageFile(null)
      return
    }
    setUploadError(null)
    setImageFile(selectedImage)
  }

  const handleClose = () => {
    if (!mutation.isPending) onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-modal-title"
        className="max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-[20px] border border-[#E8ECE9] bg-white p-6 shadow-xl dark:border-[#2B312E] dark:bg-[#161A18]"
      >
        <div className="flex items-center justify-between border-b border-[#E8ECE9] pb-4 dark:border-[#2B312E]">
          <h2 id="product-modal-title" className="text-base font-bold">Tambah Produk Baru</h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Tutup"
            className="rounded-lg p-1.5 text-[#737B76] hover:bg-[#F3F5F4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14804A]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4">
            <ErrorBanner code={error.code} message={mapSemanticErrorToMessage(error.code, error.message)} />
          </div>
        )}
        {uploadError && createdProductId && (
          <div className="mt-4 space-y-2 rounded-xl border border-[#FED7AA] bg-[#FFF7ED] p-3 text-xs text-[#9A3412]" role="alert">
            <p>{uploadError}</p>
            <Link href={`/products/${createdProductId}`} onClick={onClose} className="font-semibold underline">
              Buka detail produk untuk unggah ulang
            </Link>
          </div>
        )}

        <form
          onSubmit={form.handleSubmit((values) => {
            if (imageValidationError) return
            mutation.mutate({ values, imageFile })
          })}
          className="mt-4 space-y-4 text-xs"
        >
          <div className="space-y-1.5">
            <label htmlFor="product-name" className="font-semibold">Nama Produk</label>
            <Input id="product-name" placeholder="Contoh: Es Kopi Susu Aren" {...form.register("name", { required: "Nama produk wajib diisi." })} />
            {form.formState.errors.name && <p role="alert" className="text-[11px] text-[#DC2626]">{form.formState.errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="product-category" className="font-semibold">Kategori</label>
              <Input id="product-category" {...form.register("category", { required: "Kategori wajib diisi." })} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="variant-name" className="font-semibold">Nama Varian Awal</label>
              <Input id="variant-name" {...form.register("variantName", { required: "Nama varian wajib diisi." })} />
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-[#E8ECE9] bg-[#FAFBFA] p-3.5 dark:border-[#2B312E] dark:bg-[#111315]">
            <p className="font-bold text-[#14804A]">Gambar Produk</p>
            <div className="flex items-center gap-3">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#F3F5F4] text-[#737B76] dark:bg-[#231E19]">
                {imagePreviewUrl ? (
                  // Local preview is safe because it is created from the selected File object.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imagePreviewUrl} alt="Pratinjau gambar produk" className="h-full w-full object-cover" />
                ) : (
                  <ImagePlus className="h-5 w-5" aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-1.5">
                <label htmlFor="product-image" className="font-semibold">Pilih gambar (opsional)</label>
                <Input
                  ref={imageInputRef}
                  id="product-image"
                  type="file"
                  accept={PRODUCT_IMAGE_ACCEPT}
                  onChange={handleImageChange}
                  disabled={mutation.isPending}
                  className="h-auto py-2 text-[11px] file:mr-2 file:rounded-lg file:border-0 file:bg-[#DDF5E7] file:px-2 file:py-1.5 file:text-[10px] file:font-semibold file:text-[#10673C]"
                />
                <p className="text-[10px] text-[#737B76]">JPG, PNG, atau WebP · maksimal {PRODUCT_IMAGE_MAX_BYTES / (1024 * 1024)} MB</p>
                {imageValidationError && <p role="alert" className="text-[11px] text-[#DC2626]">{imageValidationError}</p>}
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-[#E8ECE9] bg-[#FAFBFA] p-3.5 dark:border-[#2B312E] dark:bg-[#111315]">
            <p className="font-bold text-[#14804A]">Harga &amp; Biaya Varian</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label htmlFor="selling-price" className="text-[11px] font-medium">Harga Jual (IDR)</label>
                <Input id="selling-price" type="number" min="0" step="any" prefixNode="Rp" {...form.register("sellingPrice", { required: "Harga jual wajib diisi.", validate: (value) => Number(value) >= 0 || "Harga tidak valid." })} />
              </div>
              <div className="space-y-1">
                <label htmlFor="target-margin" className="text-[11px] font-medium">Target Margin (%)</label>
                <Input id="target-margin" type="number" min="0" max="99.9" step="0.1" suffixNode="%" {...form.register("targetMargin", { validate: (value) => !value || (Number(value) >= 0 && Number(value) < 100) || "Margin harus 0-99.9%." })} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label htmlFor="packaging-cost" className="text-[11px] font-medium">Biaya Kemasan</label>
                <Input id="packaging-cost" type="number" min="0" step="any" prefixNode="Rp" {...form.register("packagingCost")} />
              </div>
              <div className="space-y-1">
                <label htmlFor="direct-cost" className="text-[11px] font-medium">Biaya Langsung</label>
                <Input id="direct-cost" type="number" min="0" step="any" prefixNode="Rp" {...form.register("directCost")} />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={handleClose}>Batal</Button>
            <Button type="submit" size="sm" disabled={mutation.isPending || Boolean(imageValidationError) || Boolean(uploadError)} className="bg-[#14804A] text-white hover:bg-[#10673C]">
              {mutation.isPending ? "Menyimpan..." : "Simpan Produk"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
