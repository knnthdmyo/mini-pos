import Link from "next/link";

interface Props {
  searchParams: { email?: string };
}

export default function CheckEmailPage({ searchParams }: Props) {
  const email = searchParams.email ?? "your email";

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm border border-gray-100 text-center">
        <div className="mb-4 flex justify-center">
          <span className="text-5xl">📬</span>
        </div>
        <h1 className="mb-2 text-xl font-bold text-gray-900">Check your email</h1>
        <p className="text-sm text-gray-500">
          We sent a verification link to{" "}
          <span className="font-medium text-gray-800">{email}</span>. Click the
          link in the email to verify your address and set your password.
        </p>
        <p className="mt-4 text-xs text-gray-400">
          Didn&apos;t receive it?{" "}
          <Link href="/register" className="text-indigo-600 hover:underline">
            Try again
          </Link>
        </p>
      </div>
    </main>
  );
}
