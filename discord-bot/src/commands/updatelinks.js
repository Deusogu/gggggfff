const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const api = require('../utils/api');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('updatelinks')
    .setDescription('Update the instruction/loader link for your cheat')
    .addStringOption(option =>
      option.setName('cheat-id')
        .setDescription('The ID of the cheat')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('instruction-url')
        .setDescription('The new instruction/loader URL')
        .setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const cheatId = interaction.options.getString('cheat-id');
      const instructionUrl = interaction.options.getString('instruction-url');
      const discordId = interaction.user.id;

      // Validate URL
      try {
        new URL(instructionUrl);
      } catch (e) {
        return await interaction.editReply({
          content: '❌ Invalid URL format. Please provide a valid URL starting with http:// or https://',
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

      // Update instruction URL
      const result = await api.updateProductLinks(cheatId, instructionUrl, sellerData.user._id);

      if (result.success) {
        const embed = new EmbedBuilder()
          .setColor(0x00ff00)
          .setTitle('✅ Instruction Link Updated')
          .setDescription(`Successfully updated the instruction/loader link for **${result.product.name}**`)
          .addFields(
            { name: '🔗 New URL', value: instructionUrl },
            { name: '🆔 Product ID', value: cheatId }
          )
          .setTimestamp()
          .setFooter({ text: 'All future purchases will receive this link' });

        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.editReply({
          content: `❌ Failed to update link: ${result.message}`,
          ephemeral: true
        });
      }
    } catch (error) {
      console.error('UpdateLinks command error:', error);
      await interaction.editReply({
        content: `❌ Error: ${error.message}`,
        ephemeral: true
      });
    }
  },
};
