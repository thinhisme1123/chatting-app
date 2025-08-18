"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Languages, Check } from "lucide-react"
import { useLanguage } from "@/src/presentation/contexts/LanguageContext"

const languages = [
  { code: "vi" as const, name: "Tiếng Việt", flag: "🇻🇳" },
  { code: "en" as const, name: "English", flag: "🇺🇸" },
  { code: "ja" as const, name: "日本語", flag: "🇯🇵" },
]

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)

  const currentLanguage = languages.find((lang) => lang.code === language)

  const handleLanguageChange = (langCode: "vi" | "en" | "ja") => {
    setLanguage(langCode)
    setIsOpen(false)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 hover:bg-accent transition-colors duration-200"
          aria-label="Select language"
        >
          {currentLanguage ? (
            <span className="text-lg" role="img" aria-label={currentLanguage.name}>
              {currentLanguage.flag}
            </span>
          ) : (
            <Languages className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 p-1">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-accent rounded-md transition-colors duration-200"
          >
            <span className="text-lg" role="img" aria-label={lang.name}>
              {lang.flag}
            </span>
            <span className="flex-1 text-sm font-medium">{lang.name}</span>
            {language === lang.code && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
