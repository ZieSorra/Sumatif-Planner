import http from "node:http";
import {readFile,stat} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const types={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".json":"application/json; charset=utf-8",".svg":"image/svg+xml"};
const port=Number(process.env.PORT||process.argv.find((v,i,a)=>a[i-1]==="--port")||4173);
http.createServer(async(req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,"http://localhost").pathname);const target=path.resolve(root,"."+pathname);if(target!==root&&!target.startsWith(root+path.sep)){res.writeHead(403);res.end("Forbidden");return;}let file=target;try{if((await stat(file)).isDirectory())file=path.join(file,"index.html");}catch{}const body=await readFile(file);res.writeHead(200,{"Content-Type":types[path.extname(file)]||"application/octet-stream","Cache-Control":"no-store"});res.end(body);}catch{res.writeHead(404,{"Content-Type":"text/plain; charset=utf-8"});res.end("Not found");}}).listen(port,"127.0.0.1",()=>console.log(`Sumatif Planner serving on http://127.0.0.1:${port}`));
