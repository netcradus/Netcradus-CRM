const fs = require('fs');
const path = require('path');

const files = [
  "accountRoutes.js", "callsRoutes.js", "campaignRoutes.js", "caseRoutes.js",
  "columnRoutes.js", "dealsRoutes.js", "forecastRoutes.js", "meetingRoutes.js",
  "priceBooks.js", "productRoutes.js", "purchaseOrderRoutes.js", "quoteRoutes.js",
  "salesInboxRoutes.js", "salesOrderRoutes.js", "solutionRoutes.js", "vendors.js", "visitRoutes.js"
];

const routesDir = path.join(__dirname, 'server/routes');
// Exclude super_user from generic RBAC if they are only managed under specific routes?
// The prompt says: "use the existing rbac middleware".
// It could just be `router.use(rbac());` but rbac takes allowedRoles array.
// I will just use `authMiddleware` for now. Oh wait, "lock them down with authMiddleware and use the existing rbac middleware."
// I will look at what other authenticated routes use. `contactRoutes.js` uses `authMiddleware`.

files.forEach(file => {
  const filepath = path.join(routesDir, file);
  if (fs.existsSync(filepath)) {
    let content = fs.readFileSync(filepath, 'utf8');
    if (!content.includes('authMiddleware')) {
      const importAuth = `const authMiddleware = require("../middleware/authMiddleware");\nconst rbac = require("../middleware/rbac");\n`;
      const routerMatch = content.match(/const\s+router\s*=\s*express\.Router\(\);/);
      if (routerMatch) {
        const insertPos = routerMatch.index + routerMatch[0].length;
        // The CRM has roles like admin, management, sales, support, it, hr, digital_media, super_user
        const useStmt = `\n\nrouter.use(authMiddleware);\nrouter.use(rbac(["admin", "management", "sales", "support", "it", "hr", "digital_media", "super_user"]));\n`;
        content = content.slice(0, insertPos) + '\n' + importAuth + useStmt + content.slice(insertPos);
        fs.writeFileSync(filepath, content);
        console.log("Updated", file);
      }
    }
  }
});
