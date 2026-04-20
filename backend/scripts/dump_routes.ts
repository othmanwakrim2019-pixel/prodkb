
import { app } from '../src/app';

function printRoutes(stack: any[], prefix = '') {
    stack.forEach((middleware: any) => {
        if (middleware.route) {
            // Route
            const methods = Object.keys(middleware.route.methods).join(',').toUpperCase();
            console.log(`${methods} ${prefix}${middleware.route.path}`);
        } else if (middleware.name === 'router' && middleware.handle.stack) {
            // Router
            let newPrefix = prefix;
            if (middleware.regexp) {
                // Try to extract prefix from regexp if possible
                // This is crude but works for simple cases
                const match = middleware.regexp.toString().match(/^\/\^\\(\/.*?)\\\//);
                if (match) newPrefix += match[1];
            }
            printRoutes(middleware.handle.stack, newPrefix);
        }
    });
}

console.log('Registered Routes:');
printRoutes((app as any)._router.stack);
process.exit(0);
