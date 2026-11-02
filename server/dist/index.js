"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const port = Number(process.env.PORT ?? 4000);
app_1.app.listen(port, () => console.log(`TLO API listening on http://localhost:${port}`));
