import Link from "next/link";
import LoginPage from "./login/page";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center  p-6">
       <LoginPage/>
    </main>
  );
}