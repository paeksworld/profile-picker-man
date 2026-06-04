import './globals.css'

export const metadata = {
  title: '소개팅 프로필 사진 고르기',
  description: '남사친 AI가 베스트 프로필 사진 골라줌',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
