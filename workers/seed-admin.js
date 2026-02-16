#!/usr/bin/env node
//
// Seed initial users into COACHES_AUTH KV namespace.
//
// Usage:
//   node workers/seed-admin.js <username> <password> [--role admin|coach|player] [--name "Display Name"]
//   node workers/seed-admin.js --init-permissions
//
// Examples:
//   node workers/seed-admin.js dave mypassword
//   node workers/seed-admin.js player teampass --role player --name "Players"
//   node workers/seed-admin.js --init-permissions
//
// Outputs wrangler kv:key put commands to run.

const crypto = require('crypto');

const args = process.argv.slice(2);

if (args.includes('--init-permissions')) {
  const permissions = {
    admin: ['roster', 'plans', 'notes', 'scouting', 'forms', 'flowcharts', 'techniques', 'users'],
    coach: ['roster', 'plans', 'notes', 'scouting', 'forms', 'flowcharts', 'techniques'],
    player: ['forms'],
  };
  const json = JSON.stringify(permissions);
  console.log(`\nRun this command to set default permissions:\n`);
  console.log(`wrangler kv:key put --binding COACHES_AUTH "permissions" '${json}'`);
  console.log();
  process.exit(0);
}

if (args.length < 2) {
  console.error('Usage: node workers/seed-admin.js <username> <password> [--role admin|coach|player] [--name "Display Name"]');
  console.error('       node workers/seed-admin.js --init-permissions');
  process.exit(1);
}

const username = args[0];
const password = args[1];

let role = 'admin';
let name = username.charAt(0).toUpperCase() + username.slice(1);

for (let i = 2; i < args.length; i++) {
  if (args[i] === '--role' && args[i + 1]) {
    role = args[++i];
  } else if (args[i] === '--name' && args[i + 1]) {
    name = args[++i];
  }
}

if (!['admin', 'coach', 'player'].includes(role)) {
  console.error('Role must be admin, coach, or player');
  process.exit(1);
}

// Hash password with random salt (same algorithm as the Worker)
const salt = crypto.randomBytes(16).toString('hex');
const hash = crypto.createHash('sha256').update(salt + ':' + password).digest('hex');
const stored = salt + ':' + hash;

const userObj = { hash: stored, role, name };
const userJson = JSON.stringify(userObj);

console.log(`\nUser: ${username}`);
console.log(`Role: ${role}`);
console.log(`Name: ${name}`);
console.log(`Hash: ${stored}`);
console.log();
console.log(`To add this user, first get current users and merge, or for a fresh start:\n`);
console.log(`# If this is the first user (fresh KV):`);
console.log(`wrangler kv:key put --binding COACHES_AUTH "users" '{"${username}":${userJson}}'`);
console.log();
console.log(`# To add to existing users, get current value first:`);
console.log(`# wrangler kv:key get --binding COACHES_AUTH "users"`);
console.log(`# Then merge and put back the combined JSON.`);
console.log();
console.log(`# Don't forget to also initialize permissions (run once):`);
console.log(`# node workers/seed-admin.js --init-permissions`);
console.log();
