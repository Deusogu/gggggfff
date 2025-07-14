const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const api = require('../utils/api');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('updatesupport')
    .setDescription('Update the support contact for your cheat')
    .addStringOption(option =>
      option.setName('cheat-id')
        .setDescription('The ID of the cheat')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('support-contact')
        .setDescription('The new support contact (Discord, email, etc.)')
        .setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const cheatId = interaction.options.getString('cheat-id');
      const supportContact = interaction.options.getString('support-contact');
      const discordId = interaction.user.id;

      // Verify seller
      const sellerData = await api.verifySellerByDiscordId(discordId);
      if (!sellerData.success) {
        return await interaction.editReply({
          content: '❌ You are not registered as a seller or your Discord ID is not linked.',
          ephemeral: true
        });
      }

      // Update support contact
      const result = await api.updateProductSupport(cheatId, supportContact, sellerData.user._id);

      if (result.success) {
        const embed = new EmbedBuilder()
          .setColor(0x00ff00)
          .setTitle('✅ Support Contact Updated')
          .setDescription(`Successfully updated the support contact for **${result.product.name}**`)
          .addFields(
            { name: '📞 New Support Contact', value: supportContact },
            { name: '🆔 Product ID', value: cheatId }
          )
          .setTimestamp()
          .setFooter({ text: 'Buyers will see this contact when they need help' });

        // Add tips for support contact
        embed.addFields({
          name: '💡 Tips',
          value: '• Use a Discord username with tag (e.g., Support#1234)\n' +
                 '• Or provide an email address\n' +
                 '• Or link to a support Discord server\n' +
                 '• Make sure the contact method is actively monitored'
        });

        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.editReply({
          content: `❌ Failed to update support contact: ${result.message}`,
          ephemeral: true
        });
      }
    } catch (error) {
      console.error('UpdateSupport command error:', error);
      await interaction.editReply({
        content: `❌ Error: ${error.message}`,
        ephemeral: true
      });
    }
  },
};
