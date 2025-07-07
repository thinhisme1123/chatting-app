"use client";

import { useState } from "react";
import { LoginForm } from "@/src/presentation/components/auth/LoginForm";
import { RegisterForm } from "@/src/presentation/components/auth/RegisterForm";
import { useAuth } from "@/src/presentation/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { MessageCircle, Users, Zap, Shield, Heart } from "lucide-react";
import ChatPage from "@/src/presentation/pages/ChatPage";
import { ErrorBoundary } from "react-error-boundary";

function AuthPageContent() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-12 flex-col justify-center relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-20 h-20 bg-white rounded-full"></div>
          <div className="absolute top-32 right-20 w-16 h-16 bg-white rounded-full"></div>
          <div className="absolute bottom-20 left-20 w-24 h-24 bg-white rounded-full"></div>
          <div className="absolute bottom-40 right-10 w-12 h-12 bg-white rounded-full"></div>
        </div>

        <div className="relative z-10 text-white">
          {/* Logo */}
          <div className="flex items-center mb-8">
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 mr-4">
              <MessageCircle className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">ChatApp</h1>
              <p className="text-blue-100">Kết nối mọi lúc, mọi nơi</p>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-6 mb-12">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">
                  Tin nhắn thời gian thực
                </h3>
                <p className="text-blue-100">
                  Trò chuyện ngay lập tức với bạn bè
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Chat nhóm</h3>
                <p className="text-blue-100">
                  Tạo nhóm và trò chuyện cùng nhiều người
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Bảo mật cao</h3>
                <p className="text-blue-100">Tin nhắn được mã hóa an toàn</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold">10K+</div>
              <div className="text-blue-100 text-sm">Người dùng</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">1M+</div>
              <div className="text-blue-100 text-sm">Tin nhắn</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">99.9%</div>
              <div className="text-blue-100 text-sm">Uptime</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-4">
              <MessageCircle className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">ChatApp</h1>
            <p className="text-gray-600">Kết nối mọi lúc, mọi nơi</p>
          </div>

          {/* Auth Form */}
          {isLogin ? <LoginForm /> : <RegisterForm />}

          {/* Toggle Button */}
          <div className="mt-6 text-center">
            <Button
              variant="ghost"
              onClick={() => setIsLogin(!isLogin)}
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              {isLogin ? (
                <>
                  Chưa có tài khoản?{" "}
                  <span className="text-blue-600 ml-1">Đăng ký ngay</span>
                </>
              ) : (
                <>
                  Đã có tài khoản?{" "}
                  <span className="text-blue-600 ml-1">Đăng nhập</span>
                </>
              )}
            </Button>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500 flex items-center justify-center">
              Made with <Heart className="h-3 w-3 text-red-500 mx-1" /> by
              ChatApp Team
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPageContent />;
  }

  return (
    <ErrorBoundary fallback={<p>Oops! Something broke.</p>}>
      <ChatPage />
    </ErrorBoundary>
  );
}
