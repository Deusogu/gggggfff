const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const api = require('../utils/api');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addkeys')
    .setDescription('Add license keys to your cheat')
    .addStringOption(option =>
      option.setName('cheat-id')
        .setDescription('The ID of the cheat')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('keys')
        .setDescription('License keys separated by commas')
        .setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const cheatId = interaction.options.getString('cheat-id');
      const keysInput = interaction.options.getString('keys');
      const discordId = interaction.user.id;

      // Parse keys
      const keys = keysInput.split(',').map(key => key.trim()).filter(key => key.length > 0);

      if (keys.length === 0) {
        return await interaction.editReply({
          content: '❌ No valid keys provided. Please separate keys with commas.',
          ephemeral: true
        });
      }

      // Verify seller
      const sellerData = await api.verifySellerByDiscordId(discordId);
      if (!sellerData.success) {
        return await interaction.editReply({
          content: '❌ You are not registered as a seller or your Discord ID is not linked.',
          ephemeral: true
        });
      }

      // Add keys
      const result = await api.addLicenseKeys(cheatId, keys, sellerData.user._id);

      if (result.success) {
        const embed = new EmbedBuilder()
          .setColor(0x00ff00)
          .setTitle('✅ License Keys Added')
          .setDescription(`Successfully added license keys to your product`)
          .addFields(
            { name: 'Keys Added', value: result.result.added.toString(), inline: true },
            { name: 'Total Stock', value: result.stockCount.toString(), inline: true },
            { name: 'Product ID', value: cheatId, inline: true }
          )
          .setTimestamp();

        if (result.result.duplicates > 0) {
          embed.addFields({ 
            name: '⚠️ Duplicates', 
            value: `${result.result.duplicates} keys were already in the system and were skipped.` 
          });
        }

        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.editReply({
          content: `❌ Failed to add keys: ${result.message}`,
          ephemeral: true
        });
      }
    } catch (error) {
      console.error('AddKeys command error:', error);
      await interaction.editReply({
        content: `❌ Error: ${error.message}`,
        ephemeral: true
      });
    }
  },
};
