import { server, app } from "./app.js"; 

async function bootstrap() {
    const PORT = Number(process.env.PORT) || 3001;
    
    server.listen(PORT, () => {
        console.log(`🚀 Server & Socket.io running at: http://localhost:${PORT}`);
    });

    // ==========================================
    // GRACEFUL SHUTDOWN HANDLER (Zero-Downtime support)
    // ==========================================
    const shutdown = () => {
        console.log('🛑 SIGINT / SIGTERM received. Starting graceful shutdown...');

        // 1. Naye incoming HTTP requests lena band karo
        server.close(async () => {
            console.log('🔒 HTTP server closed. No longer accepting new connections.');

            try {
                // 2. Agar database ya Redis clients hain, unhe yahan close kar sakte ho
                // Misal ke tor par agar mongoose use kar rahe ho:
                // await mongoose.connection.close(false);
                // console.log('📦 Database connection closed.');

                console.log('✨ Graceful shutdown completed successfully.');
                process.exit(0); // Safely exit process
            } catch (err) {
                console.error('❌ Error during graceful shutdown:', err);
                process.exit(1); // Exit with error
            }
        });

        // 3. Safety Net: Agar 10 seconds mein purane requests khatam na hon, toh zabardasti band kar do
        setTimeout(() => {
            console.error('⚠️ Could not close connections in time, forcefully shutting down process.');
            process.exit(1);
        }, 10000);
    };

    // PM2 jab reload ya stop karta hai, toh yeh signals bhejta hai
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}

bootstrap();