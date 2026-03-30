/**
 * start_tunnel.js — Starts an ngrok tunnel on port 5000
 * and automatically updates BACKEND_URL in .env to the public URL.
 *
 * Usage: node start_tunnel.js
 *
 * When a campaign is launched after the tunnel is active,
 * each phishing email will contain a public link like:
 *   https://abc123.ngrok-free.app/api/track/click/<token>
 *
 * Each user has a unique <token> (e.g., /click/01, /click/02).
 * When user 01 clicks their link → database records "user 01 clicked".
 * When user 02 clicks their link → database records "user 02 clicked".
 * When any user presses a button → database records "user X submitted form".
 *
 * This works from ANY device on ANY network (phone, another laptop, etc.)
 */

const ngrok = require('ngrok');
const fs = require('fs');
const path = require('path');

const PORT = 5000;
const ENV_PATH = path.join(__dirname, '.env');

async function startTunnel() {
  try {
    console.log(`\n🔄 Starting ngrok tunnel on port ${PORT}...`);

    const publicUrl = await ngrok.connect({
      addr: PORT,
      proto: 'http'
    });

    console.log(`\n✅ Ngrok tunnel is LIVE!`);
    console.log(`   Public URL: ${publicUrl}`);
    console.log(`   Backend:    http://localhost:${PORT}`);
    console.log(`\n📧 Phishing email links will use: ${publicUrl}/api/track/click/<token>`);
    console.log(`   Each user gets a unique <token> — tracking works on ANY device!\n`);

    // Update BACKEND_URL in .env
    let envContent = fs.readFileSync(ENV_PATH, 'utf8');
    if (envContent.includes('BACKEND_URL=')) {
      envContent = envContent.replace(/BACKEND_URL=.*/g, `BACKEND_URL=${publicUrl}`);
    } else {
      envContent += `\nBACKEND_URL=${publicUrl}`;
    }
    fs.writeFileSync(ENV_PATH, envContent);
    console.log(`✅ Updated BACKEND_URL in .env to: ${publicUrl}`);
    console.log(`\n⚠️  IMPORTANT: Restart the backend server for the new URL to take effect.`);
    console.log(`   Run: npm run backend (from the root) or node server.js (from backend/)`);
    console.log(`\n🛑 Press Ctrl+C to stop the tunnel.\n`);

    // Keep the process alive
    process.on('SIGINT', async () => {
      console.log('\n🔌 Shutting down ngrok tunnel...');
      await ngrok.disconnect();
      await ngrok.kill();

      // Restore BACKEND_URL to localhost
      let env = fs.readFileSync(ENV_PATH, 'utf8');
      env = env.replace(/BACKEND_URL=.*/g, `BACKEND_URL=http://localhost:${PORT}`);
      fs.writeFileSync(ENV_PATH, env);
      console.log('✅ Restored BACKEND_URL to http://localhost:5000');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Error starting ngrok:', error.message);
    
    if (error.message.includes('authtoken')) {
      console.log('\n📋 To fix this:');
      console.log('   1. Go to https://dashboard.ngrok.com/signup and create a free account');
      console.log('   2. Copy your auth token from https://dashboard.ngrok.com/get-started/your-authtoken');
      console.log('   3. Run: ngrok config add-authtoken YOUR_TOKEN_HERE');
      console.log('   4. Then run this script again: node start_tunnel.js\n');
    }
    process.exit(1);
  }
}

startTunnel();
