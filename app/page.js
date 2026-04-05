import { redirect } from 'next/navigation'

export default function Home() {
  // Chuyển hướng người dùng thẳng vào dashboard vì ứng dụng đã được thiết kế
  // bên trong các thư mục (app) và (auth)
  redirect('/dashboard')
}
