import { login } from "@lib/data/customer"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import { useActionState } from "react"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

const Login = ({ setCurrentView }: Props) => {
  const [message, formAction] = useActionState(login, null)

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google?country=ro'
  }

  return (
    <div
      className="max-w-sm w-full flex flex-col items-center bg-dark-800 border border-dark-700 rounded-2xl p-5 small:p-7"
      data-testid="login-page"
    >
      <div className="w-12 h-12 bg-primary-500/20 rounded-full flex items-center justify-center mb-4">
        <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
      <h1 className="text-xl font-bold text-white mb-1">Welcome back</h1>
      <p className="text-center text-dark-400 text-sm mb-5">
        Sign in to access your account.
      </p>

      {/* Google Login Button */}
      <button
        onClick={handleGoogleLogin}
        className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 border border-dark-600 rounded-xl bg-white hover:bg-gray-50 active:scale-[0.98] transition-all font-medium text-gray-700 text-sm shadow-sm"
        data-testid="google-login-button"
      >
        <GoogleIcon />
        <span>Continue with Google</span>
      </button>

      <div className="relative w-full my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-dark-600"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-dark-800 px-3 text-dark-400">or with email</span>
        </div>
      </div>

      <form className="w-full" action={formAction}>
        <div className="flex flex-col w-full gap-y-3">
          <Input
            label="Email"
            name="email"
            type="email"
            title="Enter a valid email address."
            autoComplete="email"
            required
            data-testid="email-input"
          />
          <Input
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            data-testid="password-input"
          />
        </div>
        <ErrorMessage error={message} data-testid="login-error-message" />
        <SubmitButton data-testid="sign-in-button" className="w-full mt-4 h-11 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 active:scale-[0.98] text-white font-bold rounded-xl text-sm transition-all shadow-md">
          Sign In
        </SubmitButton>
      </form>
      <span className="text-center text-dark-400 text-sm mt-5">
        Don't have an account?{" "}
        <button
          onClick={() => setCurrentView(LOGIN_VIEW.REGISTER)}
          className="text-primary-400 hover:text-primary-300 font-medium underline-offset-2 hover:underline"
          data-testid="register-button"
        >
          Sign Up
        </button>
      </span>
    </div>
  )
}

export default Login
