module.exports = {
    apps: [
        {
            name: "lodb-api",
            script: "index.js",
            watch: true,
            ignore_watch: ["node_modules"],
            env_production: {
                NODE_ENV: "dev"
            }
        }
    ],
    deploy: {
        dev: {
            user: "root",
            host: "82.196.8.165",
            ref: "origin/master",
            repo: "git@github.com:Skakruk/lodb-api.git",
            path: "/opt/lodb/api",
            "post-deploy": "npm install && pm2 startOrRestart ecosystem.config.js --env dev",
            env: {
                NODE_ENV: "dev"
            }
        }
    }
};
