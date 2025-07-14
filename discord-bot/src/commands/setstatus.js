const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const api = require('../utils/api');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setstatus')
    .setDescription('Update the status of your cheat')
    .addStringOption(option =>
      option.setName('cheat-id')
        .setDescription('The ID of the cheat to update')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('status')
        .setDescription('The new status')
        .setRequired(true)
        .addChoices(
          { name: 'Undetected', value: 'undetected' },
          { name: 'Detected', value: 'detected' },
          { name: 'Updating', value: 'updating' },
          { name: 'Discontinued', value: 'discontinued' }
        ))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for status change (optional)')
        .setRequired(false)),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const cheatId = interaction.options.getString('cheat-id');
      const status = interaction.options.getString('status');
      const reason = interaction.options.getString('reason') || '';
      const discordId = interaction.user.id;

      // Verify seller
      const sellerData = await api.verifySellerByDiscordId(discordId);
      if (!sellerData.success) {
        return await interaction.editReply({
          content: '❌ You are not registered as a seller or your Discord ID is not linked.',
          ephemeral: true
        });
      }

      // Update product status
      const result = await api.updateProductStatus(cheatId, status, reason, sellerData.user._id);

      if (result.success) {
        const embed = new EmbedBuilder()
          .setColor(status === 'undetected' ? 0x00ff00 : status === 'detected' ? 0xff0000 : 0xffff00)
          .setTitle('✅ Status Updated')
          .setDescription(`Successfully updated the status of **${result.product.name}**`)
          .addFields(
            { name: 'New Status', value: status.charAt(0).toUpperCase() + status.slice(1), inline: true },
            { name: 'Product ID', value: cheatId, inline: true }
          )
          .setTimestamp();

        if (reason) {
          embed.addFields({ name: 'Reason', value: reason });
        }

        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.editReply({
          content: `❌ Failed to update status: ${result.message}`,
          ephemeral: true
        });
      }
    } catch (error) {
      console.error('SetStatus command error:', error);
      await interaction.editReply({
        content: `❌ Error: ${error.message}`,
        ephemeral: true
      });
    }
  },
};
