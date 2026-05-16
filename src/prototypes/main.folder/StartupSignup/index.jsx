import Branding from './Branding'
import SignupForm from './SignupForm'

export default function StartupSignup() {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      <Branding />
      <SignupForm />
    </div>
  )
}
