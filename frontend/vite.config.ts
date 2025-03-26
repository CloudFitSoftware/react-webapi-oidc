import {defineConfig, loadEnv} from 'vite';
import fs from 'fs';
import react from '@vitejs/plugin-react-swc';

// https://vitejs.dev/config/
export default defineConfig(({mode}) => {
    const env = loadEnv(mode, process.cwd(), '');
    return {
        plugins: [react()],
        server: {
            port: parseInt(env.VITE_PORT),
            https: env.CERT_PATH && env.CERT_KEY_PATH ? {
                cert: fs.readFileSync(env.CERT_PATH),
                key: fs.readFileSync(env.CERT_KEY_PATH)
            } : undefined,
        }
    }
})