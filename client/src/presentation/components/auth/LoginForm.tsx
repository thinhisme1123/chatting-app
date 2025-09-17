"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Loader2, Mail, Lock } from "lucide-react";
import { useAuth } from "@/src/presentation/contexts/AuthContext";
import toast from "react-hot-toast";
import { useLanguage } from "../../contexts/LanguageContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface LoginFormProps {
  onForgotPassword?: () => void
}


export const LoginForm: React.FC<LoginFormProps> = ({ onForgotPassword }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const {t} = useLanguage()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(email, password);
      toast.success("Đăng nhập thành công!", {
        duration: 4000,
        style: {
          border: "1px solid #4ade80",
          padding: "12px",
          color: "#16a34a",
        },
        iconTheme: {
          primary: "#4ade80",
          secondary: "#f0fdf4",
        },
      });
    } catch (error: any) {
      setError(
        error.response?.data?.message || "Email hoặc mật khẩu không đúng"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 shadow-2xl border-0 dark:shadow-gray-900/50">
      <CardHeader className="space-y-1 pb-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            {t("auth.welcomeBack")}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {t("auth.loginSubtitle")}
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert
            variant="destructive"
            className="dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
          >
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {t("auth.email")}
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <Input
                id="email"
                type="email"
                placeholder={t("auth.emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-11 border-gray-200 dark:border-gray-700 dark:bg-gray-800/50 dark:text-white dark:placeholder-gray-400 focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-emerald-500 dark:focus:ring-emerald-400"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {t("auth.password")}
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder={t("auth.passwordPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 h-11 border-gray-200 dark:border-gray-700 dark:bg-gray-800/50 dark:text-white dark:placeholder-gray-400 focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-emerald-500 dark:focus:ring-emerald-400"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent dark:hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                )}
              </Button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 dark:from-emerald-500 dark:to-teal-500 dark:hover:from-emerald-600 dark:hover:to-teal-600 text-white font-medium transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("auth.loggingIn")}
              </>
            ) : (
              t("auth.login")
            )}
          </Button>
        </form>

        <div className="text-center pt-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t("auth.forgotPassword")}{" "}
            <button type="button" onClick={onForgotPassword} className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium hover:underline transition-colors">
              {t("auth.recoverNow")}
            </button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
