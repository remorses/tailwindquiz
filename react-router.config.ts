import type { Config } from '@react-router/dev/config'

export default {
    serverBuildFile: 'assets/server-build.js',
    appDirectory: 'src',
    prerender: ['/', '/defer-example'],
} satisfies Config
