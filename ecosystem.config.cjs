module.exports = {
  apps: [
    {
      name: "company",
      cwd: "/root/company",
      script: ".output/server/index.mjs",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
        HOST: "127.0.0.1",
      },
    },
  ],
};
