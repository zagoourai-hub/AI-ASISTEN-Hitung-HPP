import type { SemanticErrorCode } from "@/lib/types/api"

/**
  * Maps backend semantic error codes to user-friendly Indonesian messages.
  * Never relies on matching arbitrary English strings from exceptions.
  */
export function mapSemanticErrorToMessage(
  code: SemanticErrorCode | string | undefined,
  fallbackMessage?: string
): string {
  switch (code) {
    case "MISSING_EFFECTIVE_PRICE":
      return "Bahan baku belum memiliki riwayat harga beli yang efektif. Harap masukkan harga beli bahan terlebih dahulu."
    case "INVALID_UNIT_CONVERSION":
      return "Konversi satuan tidak valid atau belum ditentukan antara satuan resep dan satuan dasar bahan."
    case "INVALID_RECIPE_STATE":
      return "Status resep tidak valid untuk operasi ini. Pastikan resep memiliki minimal satu bahan baku aktif."
    case "INVALID_MARGIN":
      return "Target margin tidak valid. Target margin harus berada pada rentang 0% hingga 99.9%."
    case "CALCULATION_CONFLICT":
      return "Terjadi konflik perhitungan HPP. Silakan refresh halaman dan hitung ulang."
    case "VALIDATION_ERROR":
      return "Data yang dimasukkan tidak valid. Periksa kembali form input Anda."
    case "UNAUTHENTICATED":
      return "Sesi login Anda telah berakhir. Silakan login kembali."
    case "FORBIDDEN":
      return "Anda tidak memiliki izin untuk mengakses atau memodifikasi data ini."
    case "RESOURCE_NOT_FOUND":
      return "Data yang diminta tidak ditemukan."
    case "DUPLICATE_RESOURCE":
      return "Data duplikat telah ditemukan. Gunakan nama atau kode yang berbeda."
    case "INTERNAL_ERROR":
      return "Terjadi kendala pada server. Tim teknis sedang menanganinya."
    default:
      return fallbackMessage || "Terjadi kesalahan yang tidak terduga. Silakan coba lagi."
  }
}
