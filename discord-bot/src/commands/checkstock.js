const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const api = require('../utils/api');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('checkstock')
    .setDescription('Check remaining license keys for your cheat')
    .addStringOption(option =>
      option.setName('cheat-id')
        .setDescription('The ID of the cheat')
        .setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const cheatId = interaction.options.getString('cheat-id');
      const discordId = interaction.user.id;

      // Verify seller
      const sellerData = await api.verifySellerByDiscordId(discordId);
      if (!sellerData.success) {
        return await interaction.editReply({
          content: '❌ You are not registered as a seller or your Discord ID is not linked.',
          ephemeral: true
        });
      }

      // Get stock info
      const result = await api.getProductStock(cheatId, sellerData.user._id);

      if (result.success) {
        const availableKeys = result.keys.filter(key => !key.isUsed).length;
        const usedKeys = result.keys.filter(key => key.isUsed).length;
        const totalKeys = result.keys.length;

        const embed = new EmbedBuilder()
          .setColor(availableKeys > 10 ? 0x00ff00 : availableKeys > 0 ? 0xffff00 : 0xff0000)
          .setTitle('📊 Stock Information')
          .setDescription(`License key inventory for product ID: ${cheatId}`)
          .addFields(
            { name: '✅ Available Keys', value: availableKeys.toString(), inline: true },
            { name: '❌ Used Keys', value: usedKeys.toString(), inline: true },
            { name: '📦 Total Keys', value: totalKeys.toString(), inline: true }
          )
          .setTimestamp();

        // Add warning if low stock
        if (availableKeys === 0) {
          embed.addFields({ 
            name: '⚠️ Warning', 
            value: 'You are out of stock! Add more keys to continue selling.' 
          });
        } else if (availableKeys < 10) {
          embed.addFields({ 
            name: '⚠️ Low Stock', 
            value: `Only ${availableKeys} keys remaining. Consider adding more.` 
          });
        }

        // Show recent key usage
        const recentUsed = result.keys
          .filter(key => key.isUsed && key.usedAt)
          .sort((a, b) => new Date(b.usedAt) - new Date(a.usedAt))
          .slice(0, 5);

        if (recentUsed.length > 0) {
          const recentUsageText = recentUsed
            .map(key => `• ${new Date(key.usedAt).toLocaleDateString()} - Order: ${key.orderId?.orderId || 'N/A'}`)
            .join('\n');
          
          embed.addFields({ 
            name: '📅 Recent Usage', 
            value: recentUsageText || 'No recent usage' 
          });
        }

        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.editReply({
          content: `❌ Failed to get stock information: ${result.message}`,
          ephemeral: true
        });
      }
    } catch (error) {
      console.error('CheckStock command error:', error);
      await interaction.editReply({
        content: `❌ Error: ${error.message}`,
        ephemeral: true
      });
    }
  },
};
