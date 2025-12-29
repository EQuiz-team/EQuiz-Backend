// test-process.js
console.log('=== Testing process.env ===');
console.log('All env variables:', Object.keys(process.env));
console.log('Current directory:', process.cwd());
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PATH exists?', 'PATH' in process.env);

// Test setting an env variable
process.env.TEST_VAR = 'hello';
console.log('TEST_VAR:', process.env.TEST_VAR);