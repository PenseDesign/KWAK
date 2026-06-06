import { proxy } from './src/proxy'

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|manifest.*|sw\\.js|icon-.*\\.png|logo\\..*|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}

export default proxy
