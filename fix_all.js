const fs = require("fs");

// Fix files
const file1 = "src/app/gyogyszerfeliras/page.tsx";
const content1 = fs.readFileSync(file1, "utf-8");
const lines = content1.split("\n");
