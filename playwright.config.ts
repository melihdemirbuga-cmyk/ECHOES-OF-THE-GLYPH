import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests/browser',timeout:60000,workers:1,use:{baseURL:'http://127.0.0.1:5173',viewport:{width:1440,height:900},headless:true,launchOptions:{channel:'msedge',args:['--enable-webgl','--ignore-gpu-blocklist']}},reporter:'list'});
