import { server } from "./app.js";

async function bootstrap() {
    const PORT = Number(process.env.PORT) || 3001;
    
    server.listen(PORT, () => {
        console.log(`🚀 Server & Socket.io running at: http://localhost:${PORT}`);
    });
}

bootstrap();