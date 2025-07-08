"use client"

import type React from "react"
import { useState, useRef, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Loader2, UserX } from "lucide-react"
import type { User } from "../../../domain/entities/User"
import type { AuthUseCases } from "../../../application/usecases/AuthUseCases"

interface AddFriendModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onUserSelect: (user: User) => void
  authUseCases: AuthUseCases
  currentUserId?: string
}

export const AddFriendModal: React.FC<AddFriendModalProps> = ({
  isOpen,
  onOpenChange,
  onUserSelect,
  authUseCases,
  currentUserId,
}) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Debounced search function
  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query)
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }

      if (!query.trim()) {
        setSearchResults([])
        setIsSearching(false)
        return
      }

      setIsSearching(true)
      searchTimeoutRef.current = setTimeout(async () => {
        try {
        //   const results = await authUseCases.searchUsers(query)
          // Filter out the current user from search results
        //   setSearchResults(results.filter((u) => u.id !== currentUserId))
        console.log(query);
        
        } catch (error) {
          console.error("Search failed:", error)
          setSearchResults([])
        } finally {
          setIsSearching(false)
        }
      }, 500) // Debounce for 500ms
    },
    [authUseCases, currentUserId],
    
  )

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Kết bạn mới</DialogTitle>
          <DialogDescription className="text-center text-gray-500">
            Tìm kiếm người dùng bằng tên hoặc email để bắt đầu trò chuyện.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="search"
              placeholder="Tìm kiếm người dùng..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <div className="min-h-[150px] max-h-[300px] overflow-y-auto border rounded-md p-2">
            {isSearching ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Loader2 className="h-6 w-6 animate-spin mb-2" />
                <p>Đang tìm kiếm...</p>
              </div>
            ) : searchQuery.trim() === "" ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Search className="h-8 w-8 mb-2" />
                <p>Vui lòng nhập tên hoặc email để tìm kiếm.</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <UserX className="h-8 w-8 mb-2" />
                <p>Không tìm thấy người dùng nào.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {searchResults.map((resultUser) => (
                  <div
                    key={resultUser.id}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      onUserSelect(resultUser)
                      onOpenChange(false) // Close modal after selection
                      setSearchQuery("") // Clear search query
                      setSearchResults([]) // Clear search results
                    }}
                  >
                    <Avatar className="w-9 h-9">
                      <AvatarImage src={resultUser.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{resultUser.username.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{resultUser.username}</p>
                      <p className="text-xs text-gray-500">{resultUser.email}</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Kết bạn
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
