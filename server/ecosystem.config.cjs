module.exports = {
  apps: [
    {
      name: "backend",
      script: "./src/main.js",
      instances: 2,          
      exec_mode: "cluster",  
      env: {
        NODE_ENV: "production",
        PORT: 3000,          
      },
      env_production: {
        NODE_ENV: "production",
      },
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      merge_logs: true,
      time: true,
    },
  ],
};