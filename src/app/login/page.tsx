import { login, signup } from './actions'

export default async function LoginPage(props: { searchParams: Promise<{ message: string }> }) {
  const searchParams = await props.searchParams
  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 mx-auto min-h-screen">
      <form className="flex-1 flex flex-col w-full justify-center gap-2 text-foreground">
        <h1 className="text-2xl font-bold mb-4 text-center">EveryNote</h1>
        <label className="text-md" htmlFor="email">
          Email
        </label>
        <input
          className="rounded-md px-4 py-2 bg-inherit border mb-6"
          name="email"
          placeholder="you@example.com"
          required
        />
        <label className="text-md" htmlFor="password">
          Password
        </label>
        <input
          className="rounded-md px-4 py-2 bg-inherit border mb-6"
          type="password"
          name="password"
          placeholder="••••••••"
          required
        />
        <button
          formAction={login}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-2 mb-2"
        >
          Sign In
        </button>
        <button
          formAction={signup}
          className="border border-foreground/20 rounded-md px-4 py-2 mb-2"
        >
          Sign Up
        </button>
        {searchParams?.message && (
          <p className="mt-4 p-4 bg-red-100 text-red-700 text-center border-l-4 border-red-500 rounded">
            {searchParams.message}
          </p>
        )}
      </form>
    </div>
  )
}
