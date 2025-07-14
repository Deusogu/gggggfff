const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const api = require('../utils/api');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('earnings')
    .setDescription('Check your current earnings and payout information')
    .addStringOption(option =>
      option.setName('period')
        .setDescription('Time period to view')
        .setRequired(false)
        .addChoices(
          { name: 'Last 7 days', value: '7d' },
          { name: 'Last 30 days', value: '30d' },
          { name: 'Last 90 days', value: '90d' },
          { name: 'All time', value: 'all' }
        )),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const period = interaction.options.getString('period') || '30d';
      const discordId = interaction.user.id;

      // Verify seller
      const sellerData = await api.verifySellerByDiscordId(discordId);
      if (!sellerData.success) {
        return await interaction.editReply({
          content: '❌ You are not registered as a seller or your Discord ID is not linked.',
          ephemeral: true
        });
      }

      // Get earnings data
      const result = await api.getSellerEarnings(sellerData.user._id);

      if (result.success) {
        const embed = new EmbedBuilder()
          .setColor(0x00ff00)
          .setTitle('💰 Earnings Overview')
          .setDescription(`Your earnings summary for ${period === 'all' ? 'all time' : `the last ${period}`}`)
          .setTimestamp();

        // Add current balance info
        const sellerInfo = sellerData.user.sellerInfo;
        embed.addFields(
          { 
            name: '💵 Available for Payout', 
            value: `${(sellerInfo.pendingEarnings || 0).toFixed(8)} LTC`, 
            inline: true 
          },
          { 
            name: '💸 Total Withdrawn', 
            value: `${(sellerInfo.withdrawnEarnings || 0).toFixed(8)} LTC`, 
            inline: true 
          },
          { 
            name: '📊 Lifetime Earnings', 
            value: `${(sellerInfo.totalEarnings || 0).toFixed(8)} LTC`, 
            inline: true 
          }
        );

        // Add period earnings
        if (result.earnings && result.earnings.timeline) {
          const periodEarnings = result.earnings.timeline.reduce((sum, entry) => sum + entry.revenue, 0);
          const periodOrders = result.earnings.timeline.reduce((sum, entry) => sum + entry.orders, 0);
          const periodCommission = result.earnings.timeline.reduce((sum, entry) => sum + entry.commission, 0);

          embed.addFields(
            { name: '\u200B', value: '\u200B' }, // Empty field for spacing
            { 
              name: `📈 ${period === 'all' ? 'All Time' : 'Period'} Revenue`, 
              value: `${periodEarnings.toFixed(8)} LTC`, 
              inline: true 
            },
            { 
              name: '🛒 Orders', 
              value: periodOrders.toString(), 
              inline: true 
            },
            { 
              name: '💳 Commission Paid', 
              value: `${periodCommission.toFixed(8)} LTC`, 
              inline: true 
            }
          );
        }

        // Add top performing products
        if (result.earnings && result.earnings.byProduct && result.earnings.byProduct.length > 0) {
          const topProducts = result.earnings.byProduct
            .slice(0, 5)
            .map((product, index) => 
              `**${index + 1}.** ${product.productName}\n` +
              `   💰 ${product.revenue.toFixed(8)} LTC | 📦 ${product.orders} sales`
            )
            .join('\n\n');

          embed.addFields({ 
            name: '🏆 Top Products', 
            value: topProducts || 'No product data available' 
          });
        }

        // Add payout info
        if (sellerInfo.payoutAddress) {
          embed.addFields({ 
            name: '💳 Payout Address', 
            value: `\`${sellerInfo.payoutAddress}\`` 
          });
        } else {
          embed.addFields({ 
            name: '⚠️ Payout Address', 
            value: 'Not set - Please set your payout address on the website' 
          });
        }

        // Add minimum payout notice
        const minPayout = 0.1; // LTC
        if (sellerInfo.pendingEarnings < minPayout) {
          embed.addFields({ 
            name: '📌 Note', 
            value: `Minimum payout amount is ${minPayout} LTC. Keep selling to reach the threshold!` 
          });
        }

        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.editReply({
          content: `❌ Failed to get earnings data: ${result.message}`,
          ephemeral: true
        });
      }
    } catch (error) {
      console.error('Earnings command error:', error);
      await interaction.editReply({
        content: `❌ Error: ${error.message}`,
        ephemeral: true
      });
    }
  },
};
