"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { IconSearch } from "@tabler/icons-react"
import { Input } from "@/components/ui/input"

export default function SearchInput() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  // 1. Dapatkan kueri dari URL saat ini
  const urlQuery = searchParams.get("q") || ""
  
  // 2. Buat state HANYA untuk input.
  //    Kita inisialisasi DENGAN kueri URL.
  const [inputValue, setInputValue] = useState(urlQuery)

  // 3. EFEK #1: Memperbarui URL (setelah pengguna berhenti mengetik)
  useEffect(() => {
    // Tetapkan penundaan (debounce)
    const timer = setTimeout(() => {
      // Jika nilai input sama dengan kueri URL, jangan lakukan apa-apa
      if (inputValue === urlQuery) {
        return
      }

      // Asumsikan halaman proyek adalah root "/"
      const targetPath = "/projects" 
      const params = new URLSearchParams(searchParams)
      
      params.set("q", inputValue)
      if (inputValue === "") {
          params.delete("q")
      }

      // Dorong URL baru setelah penundaan berakhir
      router.push(`${targetPath}?${params.toString()}`)

    }, 300) // Penundaan 300ms

    // Bersihkan timer jika pengguna terus mengetik
    return () => clearTimeout(timer)

  // Jalankan ini setiap kali nilai input berubah
  }, [inputValue, urlQuery, pathname, router, searchParams])


  // 4. EFEK #2: Memperbarui input (jika URL berubah, misal: tombol 'kembali')
  useEffect(() => {
    // Jika kueri URL berubah, paksa nilai input untuk ikut berubah
    setInputValue(urlQuery)
  }, [urlQuery])


  return (
    <div className="flex items-center gap-2">
      <div className="relative w-full md:w-40 lg:w-64">
        <IconSearch className='absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
        <Input
          placeholder="Search..."
          value={inputValue}
          // Cukup perbarui state input saat mengetik.
          onChange={(e) => setInputValue(e.target.value)}
          className="h-9 w-full rounded-[0.5rem] pl-8 text-sm"
        />
      </div>
      <div className='bg-muted pointer-events-none top-[0.3rem] right-[0.3rem] h-8 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none sm:flex'>
          <span className='text-xs'>Filter</span>
      </div>
    </div>
  )
}