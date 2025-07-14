const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config();

// Create Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ]
});

// Command collection
client.commands = new Collection();

// Load commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

const commands = [];
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
  } else {
    console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
  }
}

// Register slash commands
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);

(async () => {
  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);

    const data = await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
      { body: commands },
    );

    console.log(`Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) {
    console.error(error);
  }
})();

// Bot ready event
client.once('ready', () => {
  console.log(`✅ Bot is online as ${client.user.tag}`);
  
  // Set bot activity
  client.user.setActivity(process.env.BOT_ACTIVITY || 'Managing Cheats', {
    type: 'WATCHING'
  });
});

// Import API utility
const api = require('./utils/api');

// Verify user is a seller with matching Discord ID
async function verifySeller(discordId) {
  try {
    const response = await api.get(`/seller/verify-discord/${discordId}`);
    return response.data.success ? response.data.seller : null;
  } catch (error) {
    console.error('Error verifying seller:', error.message);
    return null;
  }
}

// Handle interactions
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    // Verify the user is a registered seller with this Discord ID
    const sellerData = await verifySeller(interaction.user.id);
    
    if (!sellerData) {
      await interaction.reply({ 
        content: '❌ **Access Denied**\n\nYou are not authorized to use this bot. Only registered sellers with verified Discord IDs can use these commands.\n\n**To use this bot:**\n1. Register as a seller on the marketplace\n2. Add your Discord ID (`' + interaction.user.id + '`) to your profile\n3. Get approved by an admin\n\n*Your Discord ID has been copied above for convenience.*', 
        ephemeral: true 
      });
      return;
    }

    // Check if seller is approved
    if (!sellerData.isApproved) {
      await interaction.reply({ 
        content: '❌ **Account Not Approved**\n\nYour seller account is pending approval. Please wait for an admin to approve your account before using bot commands.', 
        ephemeral: true 
      });
      return;
    }

    // Pass seller data to the command
    await command.execute(interaction, sellerData);
  } catch (error) {
    console.error(`Error executing ${interaction.commandName}:`, error);
    
    const errorMessage = {
      content: 'There was an error while executing this command!',
      ephemeral: true
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
});

// Error handling
client.on('error', error => {
  console.error('Discord client error:', error);
});

process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
});

// Login to Discord
client.login(process.env.DISCORD_BOT_TOKEN);
