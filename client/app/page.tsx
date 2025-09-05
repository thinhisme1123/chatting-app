"use client";

import { useState } from "react";
import { LoginForm } from "@/src/presentation/components/auth/LoginForm";
import { RegisterForm } from "@/src/presentation/components/auth/RegisterForm";
import { useAuth } from "@/src/presentation/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { MessageCircle, Users, Zap, Shield, Heart } from "lucide-react";
import ChatPage from "@/src/presentation/pages/ChatPage";
import { ErrorBoundary } from "react-error-boundary";
import { useLanguage } from "@/src/presentation/contexts/LanguageContext";
import { ForgetPassForm } from "@/src/presentation/components/auth/ForgetPassForm";

function AuthPageContent() {
  // const [isLogin, setIsLogin] = useState(true);
  const [authMode, setAuthMode] = useState<"login" | "register" | "forgot">(
    "login"
  );
  const { t } = useLanguage();

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
              <p className="text-blue-100">{t("slogan")}</p>
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
                  {t("features.realtime")}
                </h3>
                <p className="text-blue-100">{t("features.realtimeDesc")}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">
                  {t("features.groupChat")}
                </h3>
                <p className="text-blue-100">{t("features.groupChatDesc")}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">
                  {t("features.security")}
                </h3>
                <p className="text-blue-100">{t("features.securityDesc")}</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold">10K+</div>
              <div className="text-blue-100 text-sm">{t("stats.users")}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">1M+</div>
              <div className="text-blue-100 text-sm">{t("stats.messages")}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">99.9%</div>
              <div className="text-blue-100 text-sm">{t("stats.uptime")}</div>
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
            <p className="text-gray-600">{t("slogan")}</p>
          </div>

          {/* Auth Form */}
          {authMode === "login" && (
            <LoginForm onForgotPassword={() => setAuthMode("forgot")} />
          )}
          {authMode === "register" && <RegisterForm />}
          {authMode === "forgot" && (
            <ForgetPassForm onBackToLogin={() => setAuthMode("login")} />
          )}

          {/* Toggle Button */}
          <div className="mt-6 text-center">
            {authMode === "login" ? (
              <Button
                variant="ghost"
                onClick={() => setAuthMode("register")}
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Chưa có tài khoản?{" "}
                <span className="text-blue-600 ml-1">Đăng ký ngay</span>
              </Button>
            ) : authMode === "register" ? (
              <Button
                variant="ghost"
                onClick={() => setAuthMode("login")}
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Đã có tài khoản?{" "}
                <span className="text-blue-600 ml-1">Đăng nhập</span>
              </Button>
            ) : null}
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500 flex items-center justify-center">
              Made with <Heart className="h-3 w-3 text-red-500 mx-1" /> by
              Thinhjbeos
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { user, loading } = useAuth();
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t("commom.loading")}</p>
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
