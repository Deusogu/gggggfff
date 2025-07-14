const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const api = require('../utils/api');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sales')
    .setDescription('View your recent sales summary')
    .addIntegerOption(option =>
      option.setName('limit')
        .setDescription('Number of recent sales to show (default: 10)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(25)),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const limit = interaction.options.getInteger('limit') || 10;
      const discordId = interaction.user.id;

      // Verify seller
      const sellerData = await api.verifySellerByDiscordId(discordId);
      if (!sellerData.success) {
        return await interaction.editReply({
          content: '❌ You are not registered as a seller or your Discord ID is not linked.',
          ephemeral: true
        });
      }

      // Get sales data
      const result = await api.getSellerSales(sellerData.user._id, limit);

      if (result.success) {
        const embed = new EmbedBuilder()
          .setColor(0x00ff00)
          .setTitle('💰 Recent Sales Summary')
          .setDescription(`Showing your last ${result.orders.length} sales`)
          .setTimestamp();

        if (result.orders.length === 0) {
          embed.addFields({ 
            name: 'No Sales', 
            value: 'You have no recent sales.' 
          });
        } else {
          // Add sales summary
          const totalRevenue = result.orders.reduce((sum, order) => sum + order.sellerEarnings, 0);
          const totalOrders = result.orders.length;
          
          embed.addFields(
            { name: '📊 Total Orders', value: totalOrders.toString(), inline: true },
            { name: '💵 Total Revenue', value: `${totalRevenue.toFixed(8)} LTC`, inline: true },
            { name: '📈 Avg. Sale', value: `${(totalRevenue / totalOrders).toFixed(8)} LTC`, inline: true }
          );

          // Add recent sales
          const salesList = result.orders.slice(0, 10).map((order, index) => {
            const date = new Date(order.createdAt).toLocaleDateString();
            const time = new Date(order.createdAt).toLocaleTimeString();
            return `**${index + 1}.** ${order.productId?.name || 'Unknown Product'}\n` +
                   `   💰 ${order.sellerEarnings.toFixed(8)} LTC | 📅 ${date} ${time}\n` +
                   `   🆔 Order: ${order.orderId}`;
          }).join('\n\n');

          embed.addFields({ 
            name: '📋 Recent Sales', 
            value: salesList || 'No sales data available' 
          });
        }

        // Add stats if available
        if (result.stats) {
          embed.addFields(
            { name: '📈 Today\'s Sales', value: result.stats.todaySales?.toString() || '0', inline: true },
            { name: '📊 This Month', value: result.stats.monthSales?.toString() || '0', inline: true },
            { name: '💎 Best Seller', value: result.stats.bestSeller || 'N/A', inline: true }
          );
        }

        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.editReply({
          content: `❌ Failed to get sales data: ${result.message}`,
          ephemeral: true
        });
      }
    } catch (error) {
      console.error('Sales command error:', error);
      await interaction.editReply({
        content: `❌ Error: ${error.message}`,
        ephemeral: true
      });
    }
  },
};
