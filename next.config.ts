import type { NextConfig } from 'next'

// GitHub Pages는 https://<계정>.github.io/<저장소>/ 처럼 하위 경로로 서비스된다.
// 배포할 때만 이 값을 넣고, 로컬에서는 비워 두어 http://localhost:3000 그대로 쓴다.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

const nextConfig: NextConfig = {
  // 서버 없이 정적 파일로만 굴러가게 내보낸다 (out/ 폴더)
  output: 'export',
  basePath,
  // /artifacts/index.html 형태로 만들어 주소를 직접 쳐도 열리게 한다
  trailingSlash: true,
  images: { unoptimized: true },
}

export default nextConfig
