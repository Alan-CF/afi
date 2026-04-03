import { signInWithGoogle } from "../lib/auth"

export default function Login() {
  return (
    <div>
      <h1>Login</h1>

      <button onClick={signInWithGoogle} className="px-4 py-2 m-2 bg-blue-500 text-white rounded">
        Login with Google
      </button>
    </div>
  )
}